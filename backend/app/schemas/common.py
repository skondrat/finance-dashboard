from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel
from pydantic.functional_serializers import PlainSerializer

# Decimal type that serializes as float in JSON responses (not string).
FloatDecimal = Annotated[Decimal, PlainSerializer(float, return_type=float)]


class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    per_page: int
    pages: int


class ErrorResponse(BaseModel):
    detail: str


class CurrencyParam(BaseModel):
    currency: str = "EUR"
