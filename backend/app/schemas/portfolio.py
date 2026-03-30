from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import FloatDecimal


class AssetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    ticker: str
    name: str
    type: str = Field(alias="asset_type")


class PositionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    asset: AssetResponse
    quantity: FloatDecimal
    avg_cost_basis: FloatDecimal
    total_cost: FloatDecimal
    current_price: FloatDecimal
    current_value: FloatDecimal
    pnl_absolute: FloatDecimal
    pnl_percent: FloatDecimal
    weight: FloatDecimal
    currency: str


class PortfolioSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    net_worth: FloatDecimal
    total_return: FloatDecimal
    return_pct: FloatDecimal
    saving_rate: FloatDecimal
    investment_rate: FloatDecimal
    invested_capital: FloatDecimal
    currency: str
    last_refreshed_at: Optional[datetime] = None


class PerformanceDataPoint(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    date: date
    value: FloatDecimal


class PerformanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    range: str
    data_points: list[PerformanceDataPoint]


# ---------------------------------------------------------------------------
# Allocation (T105)
# ---------------------------------------------------------------------------


class AllocationSegment(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    label: str
    value: FloatDecimal
    percentage: FloatDecimal


class AllocationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    group_by: str
    total: FloatDecimal
    segments: list[AllocationSegment]


# ---------------------------------------------------------------------------
# Performance Breakdown (T106)
# ---------------------------------------------------------------------------


class PerformanceBreakdownResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    capital: FloatDecimal
    price_gain: FloatDecimal
    price_gain_pct: FloatDecimal
    dividends: FloatDecimal
    dividends_pct: FloatDecimal
    realized_losses: FloatDecimal
    realized_losses_pct: FloatDecimal
    transaction_costs: FloatDecimal
    total_return: FloatDecimal
    total_return_pct: FloatDecimal
    irr: FloatDecimal
    twr: FloatDecimal
    currency: str
