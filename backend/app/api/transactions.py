"""
Transaction CRUD endpoints (T035).
"""

from datetime import date as date_type

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id
from app.database import get_db
from app.models.account import Account
from app.models.asset import Asset
from app.models.investment_transaction import InvestmentTransaction
from app.schemas.account import TransactionCreate, TransactionResponse, TransactionUpdate

router = APIRouter(prefix="/api/v1", tags=["transactions"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _ensure_account(db: Session, account_id: str, user_id: str) -> Account:
    """Return the account or raise 404."""
    account = (
        db.query(Account)
        .filter(Account.id == account_id, Account.user_id == user_id)
        .first()
    )
    if account is None:
        raise HTTPException(status_code=404, detail="Account not found")
    return account


def _resolve_asset(db: Session, ticker: str) -> Asset:
    """Return an existing Asset by ticker, or create a minimal placeholder."""
    asset = db.query(Asset).filter(Asset.ticker == ticker).first()
    if asset is not None:
        return asset

    # Create a minimal asset record – the user (or a background job) can
    # enrich it later with name, sector, region, etc.
    asset = Asset(
        ticker=ticker,
        name=ticker,          # placeholder name
        asset_type="stock",   # default; caller can update
        currency="USD",       # default
    )
    db.add(asset)
    db.flush()  # assign an ID so we can reference it immediately
    return asset


# ---------------------------------------------------------------------------
# List transactions
# ---------------------------------------------------------------------------


@router.get(
    "/accounts/{account_id}/transactions",
    response_model=list[TransactionResponse],
)
def list_transactions(
    account_id: str,
    asset_id: str | None = Query(None),
    from_date: date_type | None = Query(None, alias="from"),
    to_date: date_type | None = Query(None, alias="to"),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """List transactions for an account with optional filters."""
    _ensure_account(db, account_id, user_id)

    q = (
        db.query(InvestmentTransaction)
        .filter(InvestmentTransaction.account_id == account_id)
    )

    if asset_id is not None:
        q = q.filter(InvestmentTransaction.asset_id == asset_id)
    if from_date is not None:
        q = q.filter(InvestmentTransaction.date >= from_date)
    if to_date is not None:
        q = q.filter(InvestmentTransaction.date <= to_date)

    transactions = q.order_by(InvestmentTransaction.date.desc()).all()
    return transactions


# ---------------------------------------------------------------------------
# Create transaction
# ---------------------------------------------------------------------------


@router.post(
    "/accounts/{account_id}/transactions",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_transaction(
    account_id: str,
    payload: TransactionCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Create a new investment transaction.

    If the asset_ticker does not match an existing Asset, a minimal Asset
    record is created automatically.
    """
    _ensure_account(db, account_id, user_id)
    asset = _resolve_asset(db, payload.asset_ticker)

    tx = InvestmentTransaction(
        account_id=account_id,
        asset_id=asset.id,
        type=payload.type,
        quantity=payload.quantity,
        price_per_unit=payload.price_per_unit,
        currency=payload.currency,
        fees=payload.fees,
        date=payload.date,
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


# ---------------------------------------------------------------------------
# Update transaction
# ---------------------------------------------------------------------------


@router.put(
    "/accounts/{account_id}/transactions/{transaction_id}",
    response_model=TransactionResponse,
)
def update_transaction(
    account_id: str,
    transaction_id: str,
    payload: TransactionUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Update an existing investment transaction."""
    _ensure_account(db, account_id, user_id)

    tx = (
        db.query(InvestmentTransaction)
        .filter(
            InvestmentTransaction.id == transaction_id,
            InvestmentTransaction.account_id == account_id,
        )
        .first()
    )
    if tx is None:
        raise HTTPException(status_code=404, detail="Transaction not found")

    update_data = payload.model_dump(exclude_unset=True)

    # If the ticker is being changed, resolve the new asset
    if "asset_ticker" in update_data:
        asset = _resolve_asset(db, update_data.pop("asset_ticker"))
        tx.asset_id = asset.id

    for field, value in update_data.items():
        setattr(tx, field, value)

    db.commit()
    db.refresh(tx)
    return tx


# ---------------------------------------------------------------------------
# Delete transaction
# ---------------------------------------------------------------------------


@router.delete(
    "/accounts/{account_id}/transactions/{transaction_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_transaction(
    account_id: str,
    transaction_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Delete an investment transaction."""
    _ensure_account(db, account_id, user_id)

    tx = (
        db.query(InvestmentTransaction)
        .filter(
            InvestmentTransaction.id == transaction_id,
            InvestmentTransaction.account_id == account_id,
        )
        .first()
    )
    if tx is None:
        raise HTTPException(status_code=404, detail="Transaction not found")

    db.delete(tx)
    db.commit()
