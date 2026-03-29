"""
Networth CRUD + summary endpoints.
"""

from decimal import Decimal, ROUND_HALF_UP

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id
from app.database import get_db
from app.models.account import Account
from app.models.networth_account import NetworthAccount
from app.models.networth_snapshot import NetworthSnapshot
from app.schemas.networth import (
    NetworthAccountCreate,
    NetworthAccountResponse,
    NetworthAccountUpdate,
    NetworthHistoryResponse,
    NetworthSnapshotResponse,
    NetworthSummaryAccount,
    NetworthSummaryResponse,
)
from app.services import fx_service, networth_service, portfolio_service

router = APIRouter(prefix="/api/v1/networth", tags=["networth"])

_ZERO = Decimal("0")
_HUNDRED = Decimal("100")
_QUANT_2 = Decimal("0.01")


# ---------------------------------------------------------------------------
# List
# ---------------------------------------------------------------------------


@router.get("/accounts", response_model=list[NetworthAccountResponse])
def list_networth_accounts(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    return (
        db.query(NetworthAccount)
        .filter(NetworthAccount.user_id == user_id)
        .order_by(NetworthAccount.created_at)
        .all()
    )


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------


@router.post(
    "/accounts",
    response_model=NetworthAccountResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_networth_account(
    payload: NetworthAccountCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    account = NetworthAccount(
        user_id=user_id,
        name=payload.name,
        balance=payload.balance,
        currency=payload.currency,
        account_type=payload.account_type,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    networth_service.capture_snapshot(db, user_id)
    return account


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------


@router.patch("/accounts/{account_id}", response_model=NetworthAccountResponse)
def update_networth_account(
    account_id: str,
    payload: NetworthAccountUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    account = (
        db.query(NetworthAccount)
        .filter(NetworthAccount.id == account_id, NetworthAccount.user_id == user_id)
        .first()
    )
    if account is None:
        raise HTTPException(status_code=404, detail="Account not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(account, field, value)

    db.commit()
    db.refresh(account)
    networth_service.capture_snapshot(db, user_id)
    return account


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------


@router.delete("/accounts/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_networth_account(
    account_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    account = (
        db.query(NetworthAccount)
        .filter(NetworthAccount.id == account_id, NetworthAccount.user_id == user_id)
        .first()
    )
    if account is None:
        raise HTTPException(status_code=404, detail="Account not found")

    db.delete(account)
    db.commit()
    networth_service.capture_snapshot(db, user_id)


# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------


@router.get("/summary", response_model=NetworthSummaryResponse)
def get_networth_summary(
    currency: str = "EUR",
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    summary_accounts: list[NetworthSummaryAccount] = []

    # --- Manual accounts ---
    manual_accounts = (
        db.query(NetworthAccount)
        .filter(NetworthAccount.user_id == user_id)
        .order_by(NetworthAccount.created_at)
        .all()
    )

    manual_total = _ZERO
    for acct in manual_accounts:
        balance = acct.balance
        original_currency = acct.currency
        conversion_available = True

        if original_currency == currency:
            converted = balance
        else:
            rate = fx_service.get_rate(db, base=original_currency, target=currency)
            if rate is not None:
                converted = fx_service.convert(balance, original_currency, currency, rate)
            else:
                converted = balance
                conversion_available = False

        converted = converted.quantize(_QUANT_2, rounding=ROUND_HALF_UP)
        manual_total += converted

        summary_accounts.append(
            NetworthSummaryAccount(
                id=acct.id,
                name=acct.name,
                balance=balance,
                original_currency=original_currency,
                converted_balance=converted,
                percentage=_ZERO,  # calculated below
                source="manual",
                account_type=acct.account_type,
                conversion_available=conversion_available,
            )
        )

    # --- Investment accounts (per portfolio account) ---
    portfolio_accounts = (
        db.query(Account)
        .filter(Account.user_id == user_id)
        .order_by(Account.created_at)
        .all()
    )

    investment_total = _ZERO
    for pa in portfolio_accounts:
        positions = portfolio_service.get_positions(
            db, user_id, account_id=pa.id, currency=currency
        )
        account_value = sum(
            (Decimal(str(p["current_value"])) for p in positions), _ZERO
        ).quantize(_QUANT_2, rounding=ROUND_HALF_UP)
        investment_total += account_value

        summary_accounts.append(
            NetworthSummaryAccount(
                id=pa.id,
                name=pa.name,
                balance=account_value,
                original_currency=currency,
                converted_balance=account_value,
                percentage=_ZERO,  # calculated below
                source="investment",
                account_type=None,
                conversion_available=True,
            )
        )

    # --- Compute totals and percentages ---
    total_networth = (manual_total + investment_total).quantize(
        _QUANT_2, rounding=ROUND_HALF_UP
    )

    for sa in summary_accounts:
        if total_networth != _ZERO:
            sa.percentage = (
                (sa.converted_balance / total_networth) * _HUNDRED
            ).quantize(_QUANT_2, rounding=ROUND_HALF_UP)
        else:
            sa.percentage = _ZERO

    return NetworthSummaryResponse(
        total_networth=total_networth,
        manual_total=manual_total.quantize(_QUANT_2, rounding=ROUND_HALF_UP),
        investment_total=investment_total.quantize(_QUANT_2, rounding=ROUND_HALF_UP),
        currency=currency,
        accounts=summary_accounts,
    )


# ---------------------------------------------------------------------------
# History
# ---------------------------------------------------------------------------


@router.get("/history", response_model=NetworthHistoryResponse)
def get_networth_history(
    currency: str = "EUR",
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    snapshots = (
        db.query(NetworthSnapshot)
        .filter(
            NetworthSnapshot.user_id == user_id,
            NetworthSnapshot.currency == currency,
        )
        .order_by(NetworthSnapshot.snapshot_month.asc())
        .all()
    )
    return NetworthHistoryResponse(snapshots=snapshots)
