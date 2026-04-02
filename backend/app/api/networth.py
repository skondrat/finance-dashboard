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
    DeleteManualSnapshotsResponse,
    ManualSnapshotCreate,
    ManualSnapshotResponse,
    NetworthAccountCreate,
    NetworthAccountResponse,
    NetworthAccountUpdate,
    NetworthHistoryResponse,
    NetworthSnapshotResponse,
    NetworthSummaryAccount,
    NetworthSummaryResponse,
    SnapshotUpdate,
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

    # Keep the current month's snapshot in sync with live values
    networth_service.capture_snapshot(db, user_id, currency=currency)

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
    from decimal import Decimal

    # Load all snapshots regardless of stored currency
    all_snapshots = (
        db.query(NetworthSnapshot)
        .filter(NetworthSnapshot.user_id == user_id)
        .order_by(NetworthSnapshot.snapshot_month.asc(), NetworthSnapshot.updated_at.desc())
        .all()
    )

    # Deduplicate by month (keep the most recently updated)
    by_month: dict[str, NetworthSnapshot] = {}
    for snap in all_snapshots:
        if snap.snapshot_month not in by_month:
            by_month[snap.snapshot_month] = snap

    # Convert any snapshots that aren't in the requested currency
    snapshots = []
    for snap in by_month.values():
        if snap.currency != currency:
            rate = fx_service.get_rate(db, base=snap.currency, target=currency)
            if rate is None:
                row = fx_service.fetch_daily_rate(db, base=snap.currency, target=currency)
                rate = row.rate if row else Decimal("1")
            snap.total_networth = snap.total_networth * rate
            if snap.breakdown:
                snap.breakdown = [
                    {**entry, "balance": float(Decimal(str(entry["balance"])) * rate)}
                    for entry in snap.breakdown
                ]
            snap.currency = currency
        snapshots.append(snap)

    snapshots.sort(key=lambda s: s.snapshot_month)

    return NetworthHistoryResponse(snapshots=snapshots)


# ---------------------------------------------------------------------------
# Composition (donut chart)
# ---------------------------------------------------------------------------


@router.get("/composition")
def get_networth_composition(
    group_by: str = "account",
    currency: str = "EUR",
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    return networth_service.get_composition(db, user_id, group_by=group_by, currency=currency)


# ---------------------------------------------------------------------------
# Manual snapshot import
# ---------------------------------------------------------------------------


@router.post(
    "/snapshots",
    response_model=ManualSnapshotResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_manual_snapshot(
    payload: ManualSnapshotCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    import re
    from datetime import datetime

    # Validate format
    if not re.match(r"^\d{4}-(0[1-9]|1[0-2])$", payload.snapshot_month):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="snapshot_month must be in YYYY-MM format",
        )

    # Validate not in the future
    current_month = datetime.utcnow().strftime("%Y-%m")
    if payload.snapshot_month > current_month:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="snapshot_month must not be in the future",
        )

    # Check for duplicate
    existing = (
        db.query(NetworthSnapshot)
        .filter(
            NetworthSnapshot.user_id == user_id,
            NetworthSnapshot.snapshot_month == payload.snapshot_month,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A snapshot already exists for {payload.snapshot_month}",
        )

    snapshot = NetworthSnapshot(
        user_id=user_id,
        snapshot_month=payload.snapshot_month,
        total_networth=Decimal(str(payload.total_networth)),
        currency=payload.currency,
        source="manual",
        breakdown=payload.breakdown,
    )
    db.add(snapshot)
    db.commit()
    db.refresh(snapshot)
    return snapshot


# ---------------------------------------------------------------------------
# Delete all manual snapshots
# ---------------------------------------------------------------------------


@router.delete("/snapshots/manual", response_model=DeleteManualSnapshotsResponse)
def delete_manual_snapshots(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    count = (
        db.query(NetworthSnapshot)
        .filter(
            NetworthSnapshot.user_id == user_id,
            NetworthSnapshot.source == "manual",
        )
        .delete()
    )
    db.commit()
    return DeleteManualSnapshotsResponse(deleted_count=count)


# ---------------------------------------------------------------------------
# Update snapshot
# ---------------------------------------------------------------------------


@router.patch("/snapshots/{snapshot_id}", response_model=NetworthSnapshotResponse)
def update_snapshot(
    snapshot_id: str,
    payload: SnapshotUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    from datetime import datetime

    snapshot = (
        db.query(NetworthSnapshot)
        .filter(
            NetworthSnapshot.id == snapshot_id,
            NetworthSnapshot.user_id == user_id,
        )
        .first()
    )
    if snapshot is None:
        raise HTTPException(status_code=404, detail="Snapshot not found")

    if payload.total_networth is not None:
        snapshot.total_networth = Decimal(str(payload.total_networth))
    if payload.breakdown is not None:
        snapshot.breakdown = payload.breakdown
    snapshot.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(snapshot)
    return snapshot
