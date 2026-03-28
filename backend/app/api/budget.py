"""
Budget transaction and summary endpoints (T065 + T067 + T068).
"""

from datetime import date as date_type
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id
from app.database import get_db
from app.models.budget_transaction import BudgetTransaction
from app.schemas.budget import (
    BudgetSummaryResponse,
    BudgetTransactionCreate,
    BudgetTransactionResponse,
    BudgetTransactionUpdate,
    SpendByCategoryItem,
)
from app.services import budget_service

router = APIRouter(prefix="/api/v1", tags=["budget"])


# ---------------------------------------------------------------------------
# List transactions
# ---------------------------------------------------------------------------


@router.get("/budget/transactions", response_model=list[BudgetTransactionResponse])
def list_transactions(
    category_id: Optional[str] = None,
    from_date: Optional[date_type] = Query(None, alias="from"),
    to_date: Optional[date_type] = Query(None, alias="to"),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Return paginated budget transactions with optional filters."""
    from app.services.budget_service import _confirmed_tx_filter
    query = db.query(BudgetTransaction).filter(BudgetTransaction.user_id == user_id, _confirmed_tx_filter())

    if category_id is not None:
        query = query.filter(BudgetTransaction.category_id == category_id)
    if from_date is not None:
        query = query.filter(BudgetTransaction.date >= from_date)
    if to_date is not None:
        query = query.filter(BudgetTransaction.date <= to_date)

    query = query.order_by(BudgetTransaction.date.desc())
    offset = (page - 1) * per_page
    return query.offset(offset).limit(per_page).all()


# ---------------------------------------------------------------------------
# Create transaction
# ---------------------------------------------------------------------------


@router.post(
    "/budget/transactions",
    response_model=BudgetTransactionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_transaction(
    payload: BudgetTransactionCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Create a manual budget transaction."""
    transaction = budget_service.create_transaction(db, user_id=user_id, data=payload)
    return transaction


# ---------------------------------------------------------------------------
# Update transaction
# ---------------------------------------------------------------------------


@router.patch(
    "/budget/transactions/{transaction_id}",
    response_model=BudgetTransactionResponse,
)
def update_transaction(
    transaction_id: str,
    payload: BudgetTransactionUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Update category or description of a budget transaction."""
    transaction = (
        db.query(BudgetTransaction)
        .filter(
            BudgetTransaction.id == transaction_id,
            BudgetTransaction.user_id == user_id,
        )
        .first()
    )
    if transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(transaction, field, value)

    db.commit()
    db.refresh(transaction)
    return transaction


# ---------------------------------------------------------------------------
# Delete transaction
# ---------------------------------------------------------------------------


@router.delete(
    "/budget/transactions/{transaction_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_transaction(
    transaction_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Delete a budget transaction."""
    transaction = (
        db.query(BudgetTransaction)
        .filter(
            BudgetTransaction.id == transaction_id,
            BudgetTransaction.user_id == user_id,
        )
        .first()
    )
    if transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")

    db.delete(transaction)
    db.commit()


# ---------------------------------------------------------------------------
# Budget summary (KPIs)
# ---------------------------------------------------------------------------


@router.get("/budget/summary", response_model=BudgetSummaryResponse)
def get_budget_summary(
    period: Optional[str] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    from_date: Optional[date_type] = Query(None, alias="from"),
    to_date: Optional[date_type] = Query(None, alias="to"),
    currency: Optional[str] = None,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Return budget KPI data for the given period."""
    summary = budget_service.get_summary(
        db,
        user_id=user_id,
        period=period,
        month=month,
        year=year,
        from_date=from_date,
        to_date=to_date,
        currency=currency,
    )
    return summary


# ---------------------------------------------------------------------------
# Spend by category
# ---------------------------------------------------------------------------


@router.get("/budget/spend-by-category", response_model=list[SpendByCategoryItem])
def get_spend_by_category(
    period: Optional[str] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    from_date: Optional[date_type] = Query(None, alias="from"),
    to_date: Optional[date_type] = Query(None, alias="to"),
    currency: Optional[str] = None,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Return spend breakdown by category for the given period."""
    breakdown = budget_service.get_spend_by_category(
        db,
        user_id=user_id,
        period=period,
        month=month,
        year=year,
        from_date=from_date,
        to_date=to_date,
        currency=currency,
    )
    return breakdown
