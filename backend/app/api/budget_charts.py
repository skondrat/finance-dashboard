"""
Budget analytics chart endpoints (T098).
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, extract
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id
from app.database import get_db
from app.models.budget_transaction import BudgetTransaction
from app.models.category import Category
from app.models.income_source import IncomeSource

router = APIRouter(prefix="/api/v1", tags=["budget-charts"])

_ZERO = Decimal("0")
_HUNDRED = Decimal("100")
_QUANT_2 = Decimal("0.01")


def _month_range(months: int) -> list[tuple[int, int]]:
    """Return a list of (year, month) tuples for the last *months* months
    ending with the current month."""
    today = date.today()
    result: list[tuple[int, int]] = []
    y, m = today.year, today.month
    for _ in range(months):
        result.append((y, m))
        m -= 1
        if m == 0:
            m = 12
            y -= 1
    result.reverse()
    return result


def _month_label(year: int, month: int) -> str:
    return f"{year}-{month:02d}"


# ---------------------------------------------------------------------------
# Income vs Spend (monthly grouped bar chart)
# ---------------------------------------------------------------------------


@router.get("/budget/charts/income-vs-spend")
def income_vs_spend(
    months: int = Query(12, ge=1, le=60),
    currency: Optional[str] = Query("EUR"),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Monthly income vs spend data for grouped bar chart."""
    month_list = _month_range(months)

    # Aggregate income by year/month
    income_rows = (
        db.query(
            IncomeSource.year,
            IncomeSource.month,
            func.coalesce(func.sum(IncomeSource.amount), 0).label("total"),
        )
        .filter(
            IncomeSource.user_id == user_id,
            IncomeSource.currency == currency,
        )
        .group_by(IncomeSource.year, IncomeSource.month)
        .all()
    )
    income_map = {(r.year, r.month): Decimal(str(r.total)) for r in income_rows}

    # Aggregate spend (negative transactions) by year/month
    spend_rows = (
        db.query(
            extract("year", BudgetTransaction.date).label("yr"),
            extract("month", BudgetTransaction.date).label("mo"),
            func.coalesce(func.sum(BudgetTransaction.amount), 0).label("total"),
        )
        .filter(
            BudgetTransaction.user_id == user_id,
            BudgetTransaction.currency == currency,
            BudgetTransaction.amount < 0,
        )
        .group_by("yr", "mo")
        .all()
    )
    spend_map = {(int(r.yr), int(r.mo)): abs(Decimal(str(r.total))) for r in spend_rows}

    data = []
    for y, m in month_list:
        income = income_map.get((y, m), _ZERO)
        spend = spend_map.get((y, m), _ZERO)
        data.append(
            {
                "month": _month_label(y, m),
                "income": float(income.quantize(_QUANT_2, rounding=ROUND_HALF_UP)),
                "spend": float(spend.quantize(_QUANT_2, rounding=ROUND_HALF_UP)),
            }
        )

    return data


# ---------------------------------------------------------------------------
# Savings over time (area chart)
# ---------------------------------------------------------------------------


@router.get("/budget/charts/savings-over-time")
def savings_over_time(
    months: int = Query(12, ge=1, le=60),
    currency: Optional[str] = Query("EUR"),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Monthly savings = income - spend, over time."""
    month_list = _month_range(months)

    # Income by month
    income_rows = (
        db.query(
            IncomeSource.year,
            IncomeSource.month,
            func.coalesce(func.sum(IncomeSource.amount), 0).label("total"),
        )
        .filter(
            IncomeSource.user_id == user_id,
            IncomeSource.currency == currency,
        )
        .group_by(IncomeSource.year, IncomeSource.month)
        .all()
    )
    income_map = {(r.year, r.month): Decimal(str(r.total)) for r in income_rows}

    # Spend by month
    spend_rows = (
        db.query(
            extract("year", BudgetTransaction.date).label("yr"),
            extract("month", BudgetTransaction.date).label("mo"),
            func.coalesce(func.sum(BudgetTransaction.amount), 0).label("total"),
        )
        .filter(
            BudgetTransaction.user_id == user_id,
            BudgetTransaction.currency == currency,
            BudgetTransaction.amount < 0,
        )
        .group_by("yr", "mo")
        .all()
    )
    spend_map = {(int(r.yr), int(r.mo)): abs(Decimal(str(r.total))) for r in spend_rows}

    data = []
    cumulative = _ZERO
    for y, m in month_list:
        income = income_map.get((y, m), _ZERO)
        spend = spend_map.get((y, m), _ZERO)
        monthly_savings = income - spend
        cumulative += monthly_savings
        data.append(
            {
                "month": _month_label(y, m),
                "savings": float(monthly_savings.quantize(_QUANT_2, rounding=ROUND_HALF_UP)),
                "cumulative": float(cumulative.quantize(_QUANT_2, rounding=ROUND_HALF_UP)),
            }
        )

    return data


# ---------------------------------------------------------------------------
# Investment rate trend (line chart)
# ---------------------------------------------------------------------------


@router.get("/budget/charts/investment-rate-trend")
def investment_rate_trend(
    months: int = Query(12, ge=1, le=60),
    currency: Optional[str] = Query("EUR"),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Monthly investment rate % = investment spend / income * 100."""
    month_list = _month_range(months)

    # Income by month
    income_rows = (
        db.query(
            IncomeSource.year,
            IncomeSource.month,
            func.coalesce(func.sum(IncomeSource.amount), 0).label("total"),
        )
        .filter(
            IncomeSource.user_id == user_id,
            IncomeSource.currency == currency,
        )
        .group_by(IncomeSource.year, IncomeSource.month)
        .all()
    )
    income_map = {(r.year, r.month): Decimal(str(r.total)) for r in income_rows}

    # Investment spend by month
    inv_rows = (
        db.query(
            extract("year", BudgetTransaction.date).label("yr"),
            extract("month", BudgetTransaction.date).label("mo"),
            func.coalesce(func.sum(BudgetTransaction.amount), 0).label("total"),
        )
        .filter(
            BudgetTransaction.user_id == user_id,
            BudgetTransaction.currency == currency,
            BudgetTransaction.amount < 0,
            BudgetTransaction.is_investment == True,  # noqa: E712
        )
        .group_by("yr", "mo")
        .all()
    )
    inv_map = {(int(r.yr), int(r.mo)): abs(Decimal(str(r.total))) for r in inv_rows}

    data = []
    for y, m in month_list:
        income = income_map.get((y, m), _ZERO)
        inv = inv_map.get((y, m), _ZERO)
        rate = (
            (inv / income * _HUNDRED).quantize(_QUANT_2, rounding=ROUND_HALF_UP)
            if income > _ZERO
            else _ZERO
        )
        data.append(
            {
                "month": _month_label(y, m),
                "rate": float(rate),
            }
        )

    return data


# ---------------------------------------------------------------------------
# Category distribution (pie / donut chart)
# ---------------------------------------------------------------------------


@router.get("/budget/charts/category-distribution")
def category_distribution(
    period: Optional[str] = Query("monthly"),
    month: Optional[int] = None,
    year: Optional[int] = None,
    currency: Optional[str] = Query("EUR"),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Spend distribution by category for pie chart."""
    today = date.today()

    # Resolve date range
    if period == "monthly":
        m = month or today.month
        y = year or today.year
        start = date(y, m, 1)
        end = date(y + 1, 1, 1) if m == 12 else date(y, m + 1, 1)
    elif period == "ytd":
        y = year or today.year
        start = date(y, 1, 1)
        end = today
    elif period == "yearly":
        y = year or today.year
        start = date(y, 1, 1)
        end = date(y + 1, 1, 1)
    else:
        # Default to current month
        start = date(today.year, today.month, 1)
        end = (
            date(today.year + 1, 1, 1)
            if today.month == 12
            else date(today.year, today.month + 1, 1)
        )

    # Aggregate spend by category
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

    # Fetch category names and colors
    category_ids = [r.category_id for r in spend_rows if r.category_id is not None]
    cat_map: dict[str, tuple[str, str]] = {}
    if category_ids:
        cats = (
            db.query(Category.id, Category.name, Category.color)
            .filter(Category.id.in_(category_ids))
            .all()
        )
        cat_map = {c.id: (c.name, c.color) for c in cats}

    total_spend = sum(
        abs(Decimal(str(r.total))) for r in spend_rows
    )

    # Monochromatic palette for categories without a stored color
    gray_palette = [
        "#1a1a1a", "#333333", "#4d4d4d", "#666666",
        "#808080", "#999999", "#b3b3b3", "#cccccc",
    ]

    data = []
    for idx, row in enumerate(spend_rows):
        cat_id = row.category_id
        amount = abs(Decimal(str(row.total)))
        if cat_id and cat_id in cat_map:
            name, color = cat_map[cat_id]
        else:
            name = "Uncategorized"
            color = "#9CA3AF"

        pct = (
            float((amount / total_spend * _HUNDRED).quantize(_QUANT_2, rounding=ROUND_HALF_UP))
            if total_spend > _ZERO
            else 0.0
        )

        data.append(
            {
                "category_id": cat_id,
                "category_name": name,
                "color": color,
                "amount": float(amount.quantize(_QUANT_2, rounding=ROUND_HALF_UP)),
                "pct": pct,
            }
        )

    # Sort by amount descending
    data.sort(key=lambda d: d["amount"], reverse=True)

    return {
        "total_spend": float(total_spend.quantize(_QUANT_2, rounding=ROUND_HALF_UP)),
        "categories": data,
    }
