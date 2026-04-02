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
from app.services.budget_service import _convert_amount

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

    # Aggregate income by year/month with currency conversion
    income_rows = (
        db.query(IncomeSource)
        .filter(IncomeSource.user_id == user_id)
        .all()
    )
    rate_cache: dict = {}
    income_map: dict[tuple[int, int], Decimal] = {}
    for r in income_rows:
        amt = Decimal(str(r.amount))
        converted = _convert_amount(db, amt, r.currency, currency, date(r.year, r.month, 1), rate_cache)
        key = (r.year, r.month)
        income_map[key] = income_map.get(key, _ZERO) + converted

    # Aggregate spend (negative transactions) by year/month with currency conversion
    spend_txns = (
        db.query(BudgetTransaction)
        .filter(
            BudgetTransaction.user_id == user_id,
            BudgetTransaction.amount < 0,
        )
        .all()
    )
    spend_map: dict[tuple[int, int], Decimal] = {}
    for tx in spend_txns:
        amt = abs(Decimal(str(tx.amount)))
        converted = _convert_amount(db, amt, tx.currency, currency, tx.date, rate_cache)
        key = (tx.date.year, tx.date.month)
        spend_map[key] = spend_map.get(key, _ZERO) + converted

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

    # Income by month with currency conversion
    income_rows = (
        db.query(IncomeSource)
        .filter(IncomeSource.user_id == user_id)
        .all()
    )
    rate_cache: dict = {}
    income_map: dict[tuple[int, int], Decimal] = {}
    for r in income_rows:
        amt = Decimal(str(r.amount))
        converted = _convert_amount(db, amt, r.currency, currency, date(r.year, r.month, 1), rate_cache)
        key = (r.year, r.month)
        income_map[key] = income_map.get(key, _ZERO) + converted

    # Spend by month with currency conversion
    spend_txns = (
        db.query(BudgetTransaction)
        .filter(
            BudgetTransaction.user_id == user_id,
            BudgetTransaction.amount < 0,
        )
        .all()
    )
    spend_map: dict[tuple[int, int], Decimal] = {}
    for tx in spend_txns:
        amt = abs(Decimal(str(tx.amount)))
        converted = _convert_amount(db, amt, tx.currency, currency, tx.date, rate_cache)
        key = (tx.date.year, tx.date.month)
        spend_map[key] = spend_map.get(key, _ZERO) + converted

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

    # Income by month with currency conversion
    income_rows = (
        db.query(IncomeSource)
        .filter(IncomeSource.user_id == user_id)
        .all()
    )
    rate_cache: dict = {}
    income_map: dict[tuple[int, int], Decimal] = {}
    for r in income_rows:
        amt = Decimal(str(r.amount))
        converted = _convert_amount(db, amt, r.currency, currency, date(r.year, r.month, 1), rate_cache)
        key = (r.year, r.month)
        income_map[key] = income_map.get(key, _ZERO) + converted

    # Investment spend by month with currency conversion
    inv_txns = (
        db.query(BudgetTransaction)
        .filter(
            BudgetTransaction.user_id == user_id,
            BudgetTransaction.amount < 0,
            BudgetTransaction.is_investment == True,  # noqa: E712
        )
        .all()
    )
    inv_map: dict[tuple[int, int], Decimal] = {}
    for tx in inv_txns:
        amt = abs(Decimal(str(tx.amount)))
        converted = _convert_amount(db, amt, tx.currency, currency, tx.date, rate_cache)
        key = (tx.date.year, tx.date.month)
        inv_map[key] = inv_map.get(key, _ZERO) + converted

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

    # Fetch all spend transactions (any currency) and convert to target currency
    spend_txns = (
        db.query(BudgetTransaction)
        .filter(
            BudgetTransaction.user_id == user_id,
            BudgetTransaction.date >= start,
            BudgetTransaction.date < end,
            BudgetTransaction.amount < 0,
        )
        .all()
    )

    rate_cache: dict = {}
    spend_map: dict[str | None, Decimal] = {}
    for tx in spend_txns:
        amt = abs(Decimal(str(tx.amount)))
        converted = _convert_amount(db, amt, tx.currency, currency, tx.date, rate_cache)
        spend_map[tx.category_id] = spend_map.get(tx.category_id, _ZERO) + converted

    # Fetch category names and colors
    category_ids = [cid for cid in spend_map if cid is not None]
    cat_map: dict[str, tuple[str, str]] = {}
    if category_ids:
        cats = (
            db.query(Category.id, Category.name, Category.color)
            .filter(Category.id.in_(category_ids))
            .all()
        )
        cat_map = {c.id: (c.name, c.color) for c in cats}

    total_spend = sum(spend_map.values(), _ZERO)

    # Monochromatic palette for categories without a stored color
    gray_palette = [
        "#1a1a1a", "#333333", "#4d4d4d", "#666666",
        "#808080", "#999999", "#b3b3b3", "#cccccc",
    ]

    data = []
    for idx, (cat_id, amount) in enumerate(spend_map.items()):
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
