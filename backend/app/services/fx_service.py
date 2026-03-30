"""
FX service – currency conversion and exchange-rate caching (T079).

Uses the Frankfurter API (free, no API key required, ECB data) to fetch
daily EUR/USD (and other currency pair) rates and caches them in the
ExchangeRate table for offline / fast access.
"""

from __future__ import annotations

import logging
from datetime import date, datetime
from decimal import Decimal

import httpx
from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.models.exchange_rate import ExchangeRate

logger = logging.getLogger(__name__)

_FRANKFURTER_BASE = "https://api.frankfurter.dev/v1"


# ---------------------------------------------------------------------------
# Public helpers
# ---------------------------------------------------------------------------


def convert(amount: Decimal, from_currency: str, to_currency: str, rate: Decimal) -> Decimal:
    """Convert *amount* from one currency to another using the given rate.

    The *rate* is expected to express how many units of *to_currency*
    correspond to 1 unit of *from_currency*.
    """
    return amount * rate


# ---------------------------------------------------------------------------
# Rate retrieval
# ---------------------------------------------------------------------------


def get_rate(
    db: Session,
    base: str = "EUR",
    target: str = "USD",
    target_date: date | None = None,
) -> Decimal | None:
    """Return the cached rate for *base*/*target* on *target_date*.

    If no exact match exists, falls back to the nearest earlier available date.
    Returns ``None`` when no rate is cached at all for the pair.
    """
    if base == target:
        return Decimal("1")

    if target_date is None:
        target_date = date.today()

    # Exact match first
    row = (
        db.query(ExchangeRate)
        .filter(
            and_(
                ExchangeRate.base_currency == base,
                ExchangeRate.target_currency == target,
                ExchangeRate.date == target_date,
            )
        )
        .first()
    )
    if row is not None:
        return row.rate

    # Fallback: nearest earlier date
    row = (
        db.query(ExchangeRate)
        .filter(
            and_(
                ExchangeRate.base_currency == base,
                ExchangeRate.target_currency == target,
                ExchangeRate.date <= target_date,
            )
        )
        .order_by(ExchangeRate.date.desc())
        .first()
    )
    return row.rate if row is not None else None


# ---------------------------------------------------------------------------
# Fetching from external API
# ---------------------------------------------------------------------------


def fetch_daily_rate(
    db: Session,
    base: str = "EUR",
    target: str = "USD",
    target_date: date | None = None,
) -> ExchangeRate | None:
    """Fetch the rate for *base*/*target* from exchangerate.host and cache it.

    If the rate for the given date already exists in the database, the
    cached row is returned without making an HTTP request.
    """
    if target_date is None:
        target_date = date.today()

    # Return cached value when available
    existing = (
        db.query(ExchangeRate)
        .filter(
            and_(
                ExchangeRate.base_currency == base,
                ExchangeRate.target_currency == target,
                ExchangeRate.date == target_date,
            )
        )
        .first()
    )
    if existing is not None:
        return existing

    # Fetch from Frankfurter API
    url = f"{_FRANKFURTER_BASE}/{target_date.isoformat()}"
    params = {"base": base, "symbols": target}

    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
    except Exception:
        logger.exception(
            "Frankfurter: failed to fetch %s/%s for %s",
            base,
            target,
            target_date,
        )
        return None

    rates = data.get("rates") or {}
    rate_value = rates.get(target)
    if rate_value is None:
        logger.warning(
            "Frankfurter: no rate returned for %s/%s on %s",
            base,
            target,
            target_date,
        )
        return None

    row = ExchangeRate(
        base_currency=base,
        target_currency=target,
        rate=Decimal(str(rate_value)),
        date=target_date,
        fetched_at=datetime.utcnow(),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def fetch_historical_rates(
    db: Session,
    base: str = "EUR",
    target: str = "USD",
    from_date: date | None = None,
    to_date: date | None = None,
) -> list[ExchangeRate]:
    """Fetch historical rates for a date range and cache them.

    Returns the list of ExchangeRate rows for the range (from cache or
    freshly fetched).
    """
    if to_date is None:
        to_date = date.today()
    if from_date is None:
        from_date = to_date

    # Fetch from Frankfurter API for the range
    url = f"{_FRANKFURTER_BASE}/{from_date.isoformat()}..{to_date.isoformat()}"
    params = {
        "base": base,
        "symbols": target,
    }

    try:
        with httpx.Client(timeout=15.0) as client:
            resp = client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
    except Exception:
        logger.exception(
            "Frankfurter: failed to fetch timeseries %s/%s %s–%s",
            base,
            target,
            from_date,
            to_date,
        )
        # Fall back to whatever is already cached
        return (
            db.query(ExchangeRate)
            .filter(
                and_(
                    ExchangeRate.base_currency == base,
                    ExchangeRate.target_currency == target,
                    ExchangeRate.date >= from_date,
                    ExchangeRate.date <= to_date,
                )
            )
            .order_by(ExchangeRate.date)
            .all()
        )

    rates_by_date: dict = data.get("rates") or {}
    now = datetime.utcnow()
    rows: list[ExchangeRate] = []

    for date_str, rate_map in rates_by_date.items():
        rate_value = rate_map.get(target)
        if rate_value is None:
            continue

        d = date.fromisoformat(date_str)

        # Upsert
        existing = (
            db.query(ExchangeRate)
            .filter(
                and_(
                    ExchangeRate.base_currency == base,
                    ExchangeRate.target_currency == target,
                    ExchangeRate.date == d,
                )
            )
            .first()
        )

        if existing:
            existing.rate = Decimal(str(rate_value))
            existing.fetched_at = now
            rows.append(existing)
        else:
            row = ExchangeRate(
                base_currency=base,
                target_currency=target,
                rate=Decimal(str(rate_value)),
                date=d,
                fetched_at=now,
            )
            db.add(row)
            rows.append(row)

    db.commit()
    rows.sort(key=lambda r: r.date)
    return rows
