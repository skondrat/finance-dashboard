from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.schemas.common import FloatDecimal


class NetworthAccountCreate(BaseModel):
    name: str
    balance: FloatDecimal = 0
    currency: str = "EUR"
    account_type: str = "bank"


class NetworthAccountUpdate(BaseModel):
    name: Optional[str] = None
    balance: Optional[FloatDecimal] = None
    currency: Optional[str] = None
    account_type: Optional[str] = None


class NetworthAccountResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    balance: FloatDecimal
    currency: str
    account_type: str
    created_at: datetime
    updated_at: datetime


class NetworthSummaryAccount(BaseModel):
    id: str
    name: str
    balance: FloatDecimal
    original_currency: str
    converted_balance: FloatDecimal
    percentage: FloatDecimal
    source: str
    account_type: Optional[str] = None
    conversion_available: bool = True


class NetworthSummaryResponse(BaseModel):
    total_networth: FloatDecimal
    manual_total: FloatDecimal
    investment_total: FloatDecimal
    currency: str
    accounts: list[NetworthSummaryAccount]


class NetworthSnapshotResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    snapshot_month: str
    total_networth: FloatDecimal
    currency: str
    source: str = "auto"
    breakdown: Optional[list] = None
    updated_at: datetime


class NetworthHistoryResponse(BaseModel):
    snapshots: list[NetworthSnapshotResponse]


class ManualSnapshotCreate(BaseModel):
    snapshot_month: str  # "YYYY-MM"
    total_networth: float
    currency: str = "EUR"


class ManualSnapshotResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    snapshot_month: str
    total_networth: FloatDecimal
    currency: str
    source: str
    created_at: datetime


class DeleteManualSnapshotsResponse(BaseModel):
    deleted_count: int
