from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.schemas.common import FloatDecimal


class SubscriptionCreate(BaseModel):
    name: str
    cadence: str = "monthly"
    amount: FloatDecimal
    currency: str = "EUR"
    payment_day: Optional[int] = None
    payment_source: Optional[str] = None


class SubscriptionUpdate(BaseModel):
    name: Optional[str] = None
    cadence: Optional[str] = None
    amount: Optional[FloatDecimal] = None
    currency: Optional[str] = None
    payment_day: Optional[int] = None
    payment_source: Optional[str] = None


class SubscriptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    cadence: str
    amount: FloatDecimal
    currency: str
    payment_day: Optional[int] = None
    payment_source: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime


class SuggestionResponse(BaseModel):
    description: str
    amount: FloatDecimal
    currency: str
    months_detected: int
    latest_date: str


class SuggestionsListResponse(BaseModel):
    suggestions: list[SuggestionResponse]


class DismissRequest(BaseModel):
    description: str


class PaymentSourcesResponse(BaseModel):
    sources: list[str]
