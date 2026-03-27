"""
Exchange-rate endpoints (T080).
"""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id
from app.database import get_db
from app.schemas.exchange_rate import (
    HistoricalRateEntry,
    HistoricalRatesResponse,
    LatestRateResponse,
)
from app.services import fx_service

router = APIRouter(prefix="/api/v1", tags=["exchange-rates"])


# ---------------------------------------------------------------------------
# Latest rate
# ---------------------------------------------------------------------------


@router.get("/exchange-rates/latest", response_model=LatestRateResponse)
def get_latest_rate(
    base: str = Query("EUR", max_length=3),
    target: str = Query("USD", max_length=3),
    db: Session = Depends(get_db),
    _user_id: str = Depends(get_current_user_id),
):
    """Return the latest exchange rate for the given currency pair."""
    row = fx_service.fetch_daily_rate(db, base=base.upper(), target=target.upper())
    if row is None:
        raise HTTPException(
            status_code=502,
            detail=f"Unable to fetch exchange rate for {base}/{target}",
        )
    return LatestRateResponse(
        base_currency=row.base_currency,
        target_currency=row.target_currency,
        rate=row.rate,
        date=row.date,
    )


# ---------------------------------------------------------------------------
# Historical rates
# ---------------------------------------------------------------------------


@router.get("/exchange-rates", response_model=HistoricalRatesResponse)
def get_historical_rates(
    from_date: date = Query(..., alias="from"),
    to_date: date = Query(..., alias="to"),
    base: str = Query("EUR", max_length=3),
    target: str = Query("USD", max_length=3),
    db: Session = Depends(get_db),
    _user_id: str = Depends(get_current_user_id),
):
    """Return historical exchange rates for the given date range."""
    rows = fx_service.fetch_historical_rates(
        db,
        base=base.upper(),
        target=target.upper(),
        from_date=from_date,
        to_date=to_date,
    )
    return HistoricalRatesResponse(
        base_currency=base.upper(),
        target_currency=target.upper(),
        rates=[
            HistoricalRateEntry(date=r.date, rate=r.rate)
            for r in rows
        ],
    )
