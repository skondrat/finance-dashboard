"""
Pydantic schemas for exchange-rate endpoints (T080).
"""

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel


class ExchangeRateResponse(BaseModel):
    id: str
    base_currency: str
    target_currency: str
    rate: Decimal
    date: date
    fetched_at: datetime

    model_config = {"from_attributes": True}


class LatestRateResponse(BaseModel):
    base_currency: str
    target_currency: str
    rate: Decimal
    date: date


class HistoricalRateEntry(BaseModel):
    date: date
    rate: Decimal


class HistoricalRatesResponse(BaseModel):
    base_currency: str
    target_currency: str
    rates: list[HistoricalRateEntry]
