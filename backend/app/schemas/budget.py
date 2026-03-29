"""
Pydantic schemas for the budget feature (T060).
"""

from datetime import date as date_type
from decimal import Decimal
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict


# ---------------------------------------------------------------------------
# Category
# ---------------------------------------------------------------------------


class CategoryCreate(BaseModel):
    name: str
    color: str = "#4c4546"
    monthly_budget: Optional[Decimal] = None


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    monthly_budget: Optional[Decimal] = None
    is_archived: Optional[bool] = None


class CategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    color: str
    monthly_budget: Optional[Decimal] = None
    is_archived: bool
    is_default: bool


class MergeCategoryRequest(BaseModel):
    target_category_id: str


# ---------------------------------------------------------------------------
# Auto-categorization rules
# ---------------------------------------------------------------------------


class AutoCatRuleCreate(BaseModel):
    keyword: str


class AutoCatRuleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    category_id: str
    keyword: str


# ---------------------------------------------------------------------------
# Budget transactions
# ---------------------------------------------------------------------------


class BudgetTransactionCreate(BaseModel):
    date: date_type
    description: str
    amount: Decimal
    currency: str
    category_id: Optional[str] = None
    is_investment: bool = False


class BudgetTransactionUpdate(BaseModel):
    category_id: Optional[str] = None
    description: Optional[str] = None
    is_investment: Optional[bool] = None


class BudgetTransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    date: date_type
    description: str
    amount: Decimal
    currency: str
    category_id: Optional[str] = None
    is_investment: bool
    reference: Optional[str] = None


# ---------------------------------------------------------------------------
# Statement import
# ---------------------------------------------------------------------------


class ImportRowResponse(BaseModel):
    date: str
    description: str
    amount: Decimal
    currency: str
    type: str = "debit"
    category_id: Optional[str] = None
    category_name: Optional[str] = None
    category_source: str = "none"  # mapping, rule, ai, none


class ImportUploadResponse(BaseModel):
    id: str
    status: str
    file_name: str
    source: Optional[str] = None
    row_count: int
    duplicate_count: int
    skipped_count: int = 0
    excluded_count: int = 0
    rows: list[ImportRowResponse]


class ImportDetailResponse(BaseModel):
    id: str
    status: str
    filename: str
    row_count: int
    duplicate_count: int
    rows: Optional[list[dict[str, Any]]] = None


# ---------------------------------------------------------------------------
# ATM cash split
# ---------------------------------------------------------------------------


class SplitAtmRequest(BaseModel):
    row_index: int
    notes: str


class CashSplitItem(BaseModel):
    description: str
    amount: Decimal
    category_id: Optional[str] = None
    category_name: Optional[str] = None


class SplitAtmResponse(BaseModel):
    items: list[CashSplitItem]
    remainder: Decimal


class SplitConfirmItem(BaseModel):
    description: str
    amount: Decimal
    category_id: Optional[str] = None


class SplitOverride(BaseModel):
    row_index: int
    items: list[SplitConfirmItem]


class ConfirmImportRequest(BaseModel):
    category_overrides: Optional[list[dict[str, Any]]] = None
    splits: Optional[list[SplitOverride]] = None


class ImportCategoryResponse(BaseModel):
    id: str
    name: str
    color: str
    monthly_budget: Optional[Decimal] = None


class SeedCategoriesResponse(BaseModel):
    categories_loaded: int
    examples_loaded: int
    budgets_loaded: int = 0


class EnsureRequiredResponse(BaseModel):
    created: list[str]


# ---------------------------------------------------------------------------
# Bank profiles
# ---------------------------------------------------------------------------


class BankProfileCreate(BaseModel):
    name: str
    delimiter: str
    date_column: str
    amount_column: str
    description_column: str
    reference_column: Optional[str] = None
    date_format: str
    encoding: str
    skip_rows: int


class BankProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    delimiter: str
    date_column: str
    amount_column: str
    description_column: str
    reference_column: Optional[str] = None
    date_format: str
    encoding: str
    skip_rows: int


# ---------------------------------------------------------------------------
# Income sources
# ---------------------------------------------------------------------------


class IncomeSourceCreate(BaseModel):
    label: str
    amount: Decimal
    currency: str
    month: int
    year: int


class IncomeSourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    label: str
    amount: Decimal
    currency: str
    month: int
    year: int


# ---------------------------------------------------------------------------
# Budget summary / analytics
# ---------------------------------------------------------------------------


class BudgetSummaryResponse(BaseModel):
    income: Decimal
    spend: Decimal
    savings: Decimal
    saving_rate: Decimal
    investment_rate: Decimal
    budget_remaining: Decimal
    currency: str


class SpendByCategoryItem(BaseModel):
    category: CategoryResponse
    budget: Optional[Decimal] = None
    spent: Decimal
    remaining: Optional[Decimal] = None
    pct_of_total: Decimal
    sparkline: Optional[list[float]] = None
