"""
Pydantic schemas for exchange-rate endpoints (T080).
"""

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel

from app.schemas.common import FloatDecimal


class ExchangeRateResponse(BaseModel):
    id: str
    base_currency: str
    target_currency: str
    rate: FloatDecimal
    date: date
    fetched_at: datetime

    model_config = {"from_attributes": True}


class LatestRateResponse(BaseModel):
    base_currency: str
    target_currency: str
    rate: FloatDecimal
    date: date


class HistoricalRateEntry(BaseModel):
    date: date
    rate: FloatDecimal


class HistoricalRatesResponse(BaseModel):
    base_currency: str
    target_currency: str
    rates: list[HistoricalRateEntry]
