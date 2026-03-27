from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class AssetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    ticker: str
    name: str
    type: str = Field(alias="asset_type")


class PositionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    asset: AssetResponse
    quantity: Decimal
    avg_cost_basis: Decimal
    total_cost: Decimal
    current_price: Decimal
    current_value: Decimal
    pnl_absolute: Decimal
    pnl_percent: Decimal
    weight: Decimal
    currency: str


class PortfolioSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    net_worth: Decimal
    total_return: Decimal
    return_pct: Decimal
    saving_rate: Decimal
    investment_rate: Decimal
    invested_capital: Decimal
    currency: str


class PerformanceDataPoint(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    date: date
    value: Decimal


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
    value: Decimal
    percentage: Decimal


class AllocationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    group_by: str
    total: Decimal
    segments: list[AllocationSegment]


# ---------------------------------------------------------------------------
# Performance Breakdown (T106)
# ---------------------------------------------------------------------------


class PerformanceBreakdownResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    capital: Decimal
    price_gain: Decimal
    price_gain_pct: Decimal
    dividends: Decimal
    dividends_pct: Decimal
    realized_losses: Decimal
    realized_losses_pct: Decimal
    transaction_costs: Decimal
    total_return: Decimal
    total_return_pct: Decimal
    irr: Decimal
    twr: Decimal
    currency: str
