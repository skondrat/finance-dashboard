from datetime import date as date_type
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.schemas.common import FloatDecimal
from app.schemas.portfolio import AssetResponse


class AccountCreate(BaseModel):
    name: str
    type: str
    notes: Optional[str] = None


class AccountUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    notes: Optional[str] = None


class AccountResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    type: str
    notes: Optional[str] = None


class TransactionCreate(BaseModel):
    asset_ticker: str
    type: str
    quantity: FloatDecimal
    price_per_unit: FloatDecimal
    currency: str
    fees: FloatDecimal = Decimal("0")
    date: date_type


class TransactionUpdate(BaseModel):
    asset_ticker: Optional[str] = None
    type: Optional[str] = None
    quantity: Optional[Decimal] = None
    price_per_unit: Optional[Decimal] = None
    currency: Optional[str] = None
    fees: Optional[Decimal] = None
    date: Optional[date_type] = None


class TransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    asset: AssetResponse
    type: str
    quantity: FloatDecimal
    price_per_unit: FloatDecimal
    currency: str
    fees: FloatDecimal
    date: date_type
