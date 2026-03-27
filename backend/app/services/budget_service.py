"""
Budget service – default categories, summary, and spend-by-category (T052 + T059).
"""

from __future__ import annotations

import uuid
from datetime import date
from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from app.models.budget_transaction import BudgetTransaction
from app.models.category import Category
from app.models.income_source import IncomeSource

_ZERO = Decimal("0")
_HUNDRED = Decimal("100")
_QUANT_2 = Decimal("0.01")

# ---------------------------------------------------------------------------
# Default category definitions
# ---------------------------------------------------------------------------

DEFAULT_CATEGORIES: list[dict[str, str]] = [
    {"name": "Housing", "color": "#3B82F6"},
    {"name": "Food & Groceries", "color": "#22C55E"},
    {"name": "Transport", "color": "#EAB308"},
    {"name": "Entertainment", "color": "#A855F7"},
    {"name": "Health", "color": "#EF4444"},
    {"name": "Shopping", "color": "#F97316"},
    {"name": "Subscriptions", "color": "#06B6D4"},
    {"name": "Utilities", "color": "#64748B"},
    {"name": "Investments", "color": "#10B981"},
    {"name": "Income", "color": "#14B8A6"},
    {"name": "Transfers", "color": "#8B5CF6"},
    {"name": "Other", "color": "#6B7280"},
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _resolve_date_range(
    period: str,
    month: int | None = None,
    year: int | None = None,
    from_date: date | None = None,
    to_date: date | None = None,
) -> tuple[date, date]:
    """Return (start_date, end_date) for the given period specification."""
    today = date.today()

    if period == "monthly":
        m = month or today.month
        y = year or today.year
        start = date(y, m, 1)
        # Last day of the month
        if m == 12:
            end = date(y + 1, 1, 1)
        else:
            end = date(y, m + 1, 1)
        return start, end

    if period == "ytd":
        y = year or today.year
        return date(y, 1, 1), today

    if period == "yearly":
        y = year or today.year
        return date(y, 1, 1), date(y + 1, 1, 1)

    if period == "custom":
        if from_date is None or to_date is None:
            raise ValueError("custom period requires from_date and to_date")
        return from_date, to_date

    raise ValueError(f"Unknown period: {period}")


def _income_for_period(
    db: Session,
    user_id: str,
    start: date,
    end: date,
    currency: str,
) -> Decimal:
    """Sum IncomeSource amounts for months overlapping the date range."""
    # Determine month/year range
    start_ym = start.year * 12 + start.month
    end_ym = end.year * 12 + end.month

    rows = (
        db.query(func.coalesce(func.sum(IncomeSource.amount), 0))
        .filter(
            IncomeSource.user_id == user_id,
            IncomeSource.currency == currency,
            (IncomeSource.year * 12 + IncomeSource.month) >= start_ym,
            (IncomeSource.year * 12 + IncomeSource.month) <= end_ym,
        )
        .scalar()
    )
    return Decimal(str(rows)) if rows else _ZERO


def _spend_for_period(
    db: Session,
    user_id: str,
    start: date,
    end: date,
    currency: str,
    category_id: str | None = None,
) -> Decimal:
    """Sum of negative BudgetTransaction amounts (abs value) in the period."""
    q = db.query(func.coalesce(func.sum(BudgetTransaction.amount), 0)).filter(
        BudgetTransaction.user_id == user_id,
        BudgetTransaction.currency == currency,
        BudgetTransaction.date >= start,
        BudgetTransaction.date < end,
        BudgetTransaction.amount < 0,
    )
    if category_id is not None:
        q = q.filter(BudgetTransaction.category_id == category_id)

    result = q.scalar()
    return abs(Decimal(str(result))) if result else _ZERO


def _investment_spend_for_period(
    db: Session,
    user_id: str,
    start: date,
    end: date,
    currency: str,
) -> Decimal:
    """Sum abs value of transactions flagged as investments in the period."""
    result = (
        db.query(func.coalesce(func.sum(BudgetTransaction.amount), 0))
        .filter(
            BudgetTransaction.user_id == user_id,
            BudgetTransaction.currency == currency,
            BudgetTransaction.date >= start,
            BudgetTransaction.date < end,
            BudgetTransaction.is_investment == True,  # noqa: E712
            BudgetTransaction.amount < 0,
        )
        .scalar()
    )
    return abs(Decimal(str(result))) if result else _ZERO


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def seed_default_categories(db: Session, user_id: str) -> list[Category]:
    """Create the 12 default budget categories for a user.

    Skips categories whose name already exists for the user.
    Returns the list of created Category objects.
    """
    existing_names = {
        name
        for (name,) in db.query(Category.name).filter(Category.user_id == user_id).all()
    }

    created: list[Category] = []
    for cat_def in DEFAULT_CATEGORIES:
        if cat_def["name"] in existing_names:
            continue
        cat = Category(
            id=str(uuid.uuid4()),
            user_id=user_id,
            name=cat_def["name"],
            color=cat_def["color"],
            is_default=True,
        )
        db.add(cat)
        created.append(cat)

    if created:
        db.commit()
        for cat in created:
            db.refresh(cat)

    return created


def get_summary(
    db: Session,
    user_id: str,
    period: str = "monthly",
    month: int | None = None,
    year: int | None = None,
    from_date: date | None = None,
    to_date: date | None = None,
    currency: str = "EUR",
) -> dict:
    """Calculate budget summary KPIs for a given period.

    Returns dict with: income, spend, savings, saving_rate,
    investment_rate, budget_remaining.
    """
    start, end = _resolve_date_range(period, month, year, from_date, to_date)

    income = _income_for_period(db, user_id, start, end, currency)
    spend = _spend_for_period(db, user_id, start, end, currency)
    investment_spend = _investment_spend_for_period(db, user_id, start, end, currency)

    savings = income - spend
    saving_rate = (
        (savings / income * _HUNDRED).quantize(_QUANT_2, rounding=ROUND_HALF_UP)
        if income > _ZERO
        else _ZERO
    )
    investment_rate = (
        (investment_spend / income * _HUNDRED).quantize(_QUANT_2, rounding=ROUND_HALF_UP)
        if income > _ZERO
        else _ZERO
    )

    # Budget remaining: total of all category monthly budgets minus spend
    budget_total = (
        db.query(func.coalesce(func.sum(Category.monthly_budget), 0))
        .filter(
            Category.user_id == user_id,
            Category.is_archived == False,  # noqa: E712
        )
        .scalar()
    )
    budget_total = Decimal(str(budget_total)) if budget_total else _ZERO
    budget_remaining = budget_total - spend

    return {
        "income": income.quantize(_QUANT_2, rounding=ROUND_HALF_UP),
        "spend": spend.quantize(_QUANT_2, rounding=ROUND_HALF_UP),
        "savings": savings.quantize(_QUANT_2, rounding=ROUND_HALF_UP),
        "saving_rate": saving_rate,
        "investment_rate": investment_rate,
        "budget_remaining": budget_remaining.quantize(_QUANT_2, rounding=ROUND_HALF_UP),
        "currency": currency,
        "period": period,
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
    }


def get_spend_by_category(
    db: Session,
    user_id: str,
    period: str = "monthly",
    month: int | None = None,
    year: int | None = None,
    from_date: date | None = None,
    to_date: date | None = None,
    currency: str = "EUR",
) -> list[dict]:
    """Return spend breakdown by category for the given period.

    Each entry contains: category_id, category_name, color, budget,
    spent, remaining, pct_of_total.
    """
    start, end = _resolve_date_range(period, month, year, from_date, to_date)

    # Get all active categories for the user
    categories = (
        db.query(Category)
        .filter(
            Category.user_id == user_id,
            Category.is_archived == False,  # noqa: E712
        )
        .all()
    )

    # Aggregate spend per category
    spend_rows = (
        db.query(
            BudgetTransaction.category_id,
            func.sum(BudgetTransaction.amount).label("total"),
        )
        .filter(
            BudgetTransaction.user_id == user_id,
            BudgetTransaction.currency == currency,
            BudgetTransaction.date >= start,
            BudgetTransaction.date < end,
            BudgetTransaction.amount < 0,
        )
        .group_by(BudgetTransaction.category_id)
        .all()
    )

    spend_map: dict[str | None, Decimal] = {
        row.category_id: abs(Decimal(str(row.total))) for row in spend_rows
    }

    total_spend = sum(spend_map.values(), _ZERO)

    results: list[dict] = []
    for cat in categories:
        spent = spend_map.get(cat.id, _ZERO)
        budget = Decimal(str(cat.monthly_budget)) if cat.monthly_budget is not None else _ZERO
        remaining = budget - spent

        pct_of_total = (
            (spent / total_spend * _HUNDRED).quantize(_QUANT_2, rounding=ROUND_HALF_UP)
            if total_spend > _ZERO
            else _ZERO
        )

        results.append(
            {
                "category": {
                    "id": cat.id,
                    "name": cat.name,
                    "color": cat.color,
                    "monthly_budget": cat.monthly_budget,
                    "is_archived": cat.is_archived,
                    "is_default": cat.is_default,
                },
                "budget": budget.quantize(_QUANT_2, rounding=ROUND_HALF_UP),
                "spent": spent.quantize(_QUANT_2, rounding=ROUND_HALF_UP),
                "remaining": remaining.quantize(_QUANT_2, rounding=ROUND_HALF_UP),
                "pct_of_total": pct_of_total,
            }
        )

    # Include uncategorized spend if any
    uncategorized_spend = spend_map.get(None, _ZERO)
    if uncategorized_spend > _ZERO:
        pct = (
            (uncategorized_spend / total_spend * _HUNDRED).quantize(_QUANT_2, rounding=ROUND_HALF_UP)
            if total_spend > _ZERO
            else _ZERO
        )
        results.append(
            {
                "category": {
                    "id": "uncategorized",
                    "name": "Uncategorized",
                    "color": "#9CA3AF",
                    "monthly_budget": None,
                    "is_archived": False,
                    "is_default": False,
                },
                "budget": _ZERO.quantize(_QUANT_2),
                "spent": uncategorized_spend.quantize(_QUANT_2, rounding=ROUND_HALF_UP),
                "remaining": (-uncategorized_spend).quantize(_QUANT_2, rounding=ROUND_HALF_UP),
                "pct_of_total": pct,
            }
        )

    # Sort by spend descending
    results.sort(key=lambda r: r["spent"], reverse=True)


    return results
