"""
Portfolio read endpoints (T036).
"""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id
from app.database import get_db
from app.schemas.portfolio import (
    AllocationResponse,
    PerformanceBreakdownResponse,
    PerformanceResponse,
    PortfolioSummaryResponse,
    PositionResponse,
)
from app.services import portfolio_service, price_service

router = APIRouter(prefix="/api/v1", tags=["portfolio"])


# ---------------------------------------------------------------------------
# Positions
# ---------------------------------------------------------------------------


@router.get("/portfolio/positions", response_model=list[PositionResponse])
def get_positions(
    account_id: str | None = Query(None),
    currency: str = Query("EUR"),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Return aggregated positions for the current user."""
    return portfolio_service.get_positions(
        db, user_id, account_id=account_id, currency=currency
    )


# ---------------------------------------------------------------------------
# Summary / KPIs
# ---------------------------------------------------------------------------


@router.get("/portfolio/summary", response_model=PortfolioSummaryResponse)
def get_summary(
    account_id: str | None = Query(None),
    currency: str = Query("EUR"),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Return portfolio-level KPIs."""
    return portfolio_service.get_summary(db, user_id, account_id=account_id, currency=currency)


# ---------------------------------------------------------------------------
# Performance time-series
# ---------------------------------------------------------------------------


@router.get("/portfolio/performance", response_model=PerformanceResponse)
def get_performance(
    range: str = Query("1Y", alias="range"),
    account_id: str | None = Query(None),
    currency: str = Query("EUR"),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Return a historical performance time-series."""
    return portfolio_service.get_performance(
        db, user_id, range_str=range, account_id=account_id, currency=currency
    )


# ---------------------------------------------------------------------------
# Refresh prices
# ---------------------------------------------------------------------------


@router.post(
    "/portfolio/refresh-prices",
    status_code=status.HTTP_202_ACCEPTED,
)
def refresh_prices(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Trigger a price refresh for all held assets."""
    count = price_service.refresh_prices(db, user_id)
    return {"status": "accepted", "asset_count": count}


# ---------------------------------------------------------------------------
# Allocation (T105)
# ---------------------------------------------------------------------------


@router.get("/portfolio/allocation", response_model=AllocationResponse)
def get_allocation(
    group_by: str = Query("type"),
    account_id: str | None = Query(None),
    currency: str = Query("EUR"),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Return portfolio allocation breakdown by the given grouping."""
    return portfolio_service.get_allocation(
        db, user_id, group_by=group_by, account_id=account_id, currency=currency
    )


# ---------------------------------------------------------------------------
# Performance Breakdown (T106)
# ---------------------------------------------------------------------------


@router.get(
    "/portfolio/performance-breakdown",
    response_model=PerformanceBreakdownResponse,
)
def get_performance_breakdown(
    account_id: str | None = Query(None),
    currency: str = Query("EUR"),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Return detailed performance breakdown with IRR and TWR."""
    return portfolio_service.get_performance_breakdown(
        db, user_id, account_id=account_id, currency=currency
    )


# ---------------------------------------------------------------------------
# All Transactions (028)
# ---------------------------------------------------------------------------


@router.get("/portfolio/transactions")
def get_all_transactions(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Return all investment transactions across all accounts."""
    return portfolio_service.get_all_transactions(db, user_id)
