"""
Income source endpoints (T066).
"""

from datetime import date
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id
from app.database import get_db
from app.models.income_source import IncomeSource
from app.schemas.budget import IncomeSourceCreate, IncomeSourceResponse
from app.services.budget_service import _convert_amount

router = APIRouter(prefix="/api/v1", tags=["income"])


# ---------------------------------------------------------------------------
# List income sources
# ---------------------------------------------------------------------------


@router.get("/budget/income", response_model=list[IncomeSourceResponse])
def list_income_sources(
    year: Optional[int] = None,
    month: Optional[int] = None,
    currency: Optional[str] = None,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Return income sources with optional year/month filtering.

    When *currency* is provided, amounts are converted to that currency
    (but all sources are returned, not filtered).
    """
    query = db.query(IncomeSource).filter(IncomeSource.user_id == user_id)

    if year is not None:
        query = query.filter(IncomeSource.year == year)
    if month is not None:
        query = query.filter(IncomeSource.month == month)

    rows = query.order_by(IncomeSource.year.desc(), IncomeSource.month.desc()).all()

    if not currency:
        return rows

    rate_cache: dict = {}
    results = []
    for inc in rows:
        converted = _convert_amount(
            db, Decimal(str(inc.amount)), inc.currency, currency,
            date(inc.year, inc.month, 1), rate_cache,
        )
        results.append(IncomeSourceResponse(
            id=inc.id, label=inc.label, amount=float(converted),
            currency=currency, month=inc.month, year=inc.year,
        ))
    return results


# ---------------------------------------------------------------------------
# Copy income sources from previous month
# ---------------------------------------------------------------------------


@router.post("/budget/income/copy-from-previous")
def copy_income_from_previous(
    target_year: int,
    target_month: int,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Copy all income sources from the previous month into the target month."""
    # Calculate previous month
    if target_month == 1:
        src_month, src_year = 12, target_year - 1
    else:
        src_month, src_year = target_month - 1, target_year

    sources = (
        db.query(IncomeSource)
        .filter(
            IncomeSource.user_id == user_id,
            IncomeSource.year == src_year,
            IncomeSource.month == src_month,
        )
        .all()
    )

    if not sources:
        return {"copied": 0}

    # Check if target month already has income sources
    existing = (
        db.query(IncomeSource)
        .filter(
            IncomeSource.user_id == user_id,
            IncomeSource.year == target_year,
            IncomeSource.month == target_month,
        )
        .count()
    )
    if existing > 0:
        return {"copied": 0, "message": "Target month already has income sources"}

    for src in sources:
        db.add(IncomeSource(
            user_id=user_id,
            label=src.label,
            amount=src.amount,
            currency=src.currency,
            month=target_month,
            year=target_year,
        ))

    db.commit()
    return {"copied": len(sources)}


# ---------------------------------------------------------------------------
# Create income source
# ---------------------------------------------------------------------------


@router.post(
    "/budget/income",
    response_model=IncomeSourceResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_income_source(
    payload: IncomeSourceCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Create a new income source entry."""
    income = IncomeSource(
        user_id=user_id,
        label=payload.label,
        amount=payload.amount,
        currency=payload.currency,
        month=payload.month,
        year=payload.year,
    )
    db.add(income)
    db.commit()
    db.refresh(income)
    return income


# ---------------------------------------------------------------------------
# Update income source
# ---------------------------------------------------------------------------


@router.patch("/budget/income/{income_id}", response_model=IncomeSourceResponse)
def update_income_source(
    income_id: str,
    payload: IncomeSourceCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Update an income source entry."""
    income = (
        db.query(IncomeSource)
        .filter(IncomeSource.id == income_id, IncomeSource.user_id == user_id)
        .first()
    )
    if income is None:
        raise HTTPException(status_code=404, detail="Income source not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(income, field, value)

    db.commit()
    db.refresh(income)
    return income


# ---------------------------------------------------------------------------
# Delete income source
# ---------------------------------------------------------------------------


@router.delete(
    "/budget/income/{income_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_income_source(
    income_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Delete an income source entry."""
    income = (
        db.query(IncomeSource)
        .filter(IncomeSource.id == income_id, IncomeSource.user_id == user_id)
        .first()
    )
    if income is None:
        raise HTTPException(status_code=404, detail="Income source not found")

    db.delete(income)
    db.commit()
