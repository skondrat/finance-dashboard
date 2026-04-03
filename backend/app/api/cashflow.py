"""
Cashflow Sankey endpoint — 4-level flow visualization.
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id
from app.database import get_db
from app.models.budget_transaction import BudgetTransaction
from app.models.category import Category
from app.models.income_source import IncomeSource
from app.services.budget_service import _convert_amount

router = APIRouter(prefix="/api/v1", tags=["cashflow"])

_ZERO = Decimal("0")
_QUANT_2 = Decimal("0.01")

# ── Major category mapping ─────────────────────────────────────────────────
# Maps final category names → major group names.
# Categories not listed fall under "Other".
MAJOR_CATEGORY_MAP: dict[str, str] = {
    # Housing
    "Rent": "Housing",
    "Housing": "Housing",
    "Utilities": "Housing",
    "Electricity": "Housing",
    "Furniture": "Housing",
    # Food & Dining
    "Groceries & Supermarkets": "Food & Dining",
    "Cafes & Restaurants": "Food & Dining",
    "Coffee shops": "Food & Dining",
    "Restaurants": "Food & Dining",
    # Transportation
    "Taxi & Public Transportation": "Transportation",
    "Car": "Transportation",
    "Car Rental": "Transportation",
    "Fuel": "Transportation",
    "Transport": "Transportation",
    # Travel
    "Airplane Tickets": "Travel",
    "Airbnb & Hotels": "Travel",
    "Vacation": "Travel",
    # Health & Wellness
    "Health": "Health & Wellness",
    "Beauty": "Health & Wellness",
    "Supplements": "Health & Wellness",
    "Sport": "Health & Wellness",
    # Communication & Tech
    "Cell Phone & Internet": "Communication & Tech",
    "Subscriptions": "Communication & Tech",
    "Games / Subscriptions": "Communication & Tech",
    # Financial
    "Taxes": "Financial",
    "Insurance": "Financial",
    "Debt": "Financial",
    # Shopping
    "Clothes": "Shopping",
    "Amazon": "Shopping",
    "Shopping": "Shopping",
    "Presents": "Shopping",
    # Education
    "Education": "Education",
    # Family
    "Parents": "Family",
    # Entertainment
    "Leisure": "Entertainment",
    "Entertainment": "Entertainment",
}


def _last_completed_month() -> tuple[int, int]:
    """Return (year, month) of the last fully completed calendar month."""
    today = date.today()
    if today.month == 1:
        return today.year - 1, 12
    return today.year, today.month - 1


def _q(v: Decimal) -> float:
    return float(v.quantize(_QUANT_2, rounding=ROUND_HALF_UP))


@router.get("/cashflow/sankey")
def get_cashflow_sankey(
    currency: Optional[str] = Query("EUR"),
    period: Optional[str] = Query("monthly"),
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Return 4-level Sankey diagram data.

    Levels:
      0 – Income sources
      1 – Merged "Income" node
      2 – Major categories (+ Savings, Investments)
      3 – Final expense categories
    """
    if year is None or month is None:
        year, month = _last_completed_month()

    # ── Resolve date range based on period ─────────────────────────────────
    if period == "yearly":
        start = date(year, 1, 1)
        end = date(year + 1, 1, 1)
        income_months = list(range(1, 13))
    elif period == "ytd":
        today = date.today()
        if year < today.year:
            # Past year: full year
            start = date(year, 1, 1)
            end = date(year + 1, 1, 1)
            income_months = list(range(1, 13))
        else:
            # Current year: Jan through last completed month
            lc_year, lc_month = _last_completed_month()
            start = date(year, 1, 1)
            end = date(lc_year, lc_month + 1, 1) if lc_month < 12 else date(lc_year + 1, 1, 1)
            income_months = list(range(1, lc_month + 1))
    else:
        # monthly (default)
        start = date(year, month, 1)
        end = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)
        income_months = [month]

    # ── Income sources (all currencies, converted) ──────────────────────────
    rate_cache: dict = {}
    raw_income = (
        db.query(IncomeSource.label, IncomeSource.amount, IncomeSource.currency)
        .filter(
            IncomeSource.user_id == user_id,
            IncomeSource.year == year,
            IncomeSource.month.in_(income_months),
        )
        .all()
    )
    income_rows: list[tuple[str, Decimal]] = []
    total_income = _ZERO
    for r in raw_income:
        amt = _convert_amount(db, Decimal(str(r.amount)), r.currency, currency, start, rate_cache)
        income_rows.append((r.label, amt))
        total_income += amt

    # ── Expenses (all currencies, converted, grouped by category) ──────────
    raw_expenses = (
        db.query(BudgetTransaction)
        .filter(
            BudgetTransaction.user_id == user_id,
            BudgetTransaction.date >= start,
            BudgetTransaction.date < end,
            BudgetTransaction.amount < 0,
            BudgetTransaction.is_investment == False,  # noqa: E712
        )
        .all()
    )
    spend_by_cat: dict[str | None, Decimal] = {}
    for tx in raw_expenses:
        amt = abs(_convert_amount(db, Decimal(str(tx.amount)), tx.currency, currency, tx.date, rate_cache))
        spend_by_cat[tx.category_id] = spend_by_cat.get(tx.category_id, _ZERO) + amt

    # ── Investments (all currencies, converted) ────────────────────────────
    raw_investments = (
        db.query(BudgetTransaction)
        .filter(
            BudgetTransaction.user_id == user_id,
            BudgetTransaction.date >= start,
            BudgetTransaction.date < end,
            BudgetTransaction.is_investment == True,  # noqa: E712
            BudgetTransaction.amount < 0,
        )
        .all()
    )
    investment_total = _ZERO
    for tx in raw_investments:
        investment_total += abs(_convert_amount(db, Decimal(str(tx.amount)), tx.currency, currency, tx.date, rate_cache))

    # ── Resolve category names and colors ─────────────────────────────────
    category_ids = [cid for cid in spend_by_cat.keys() if cid is not None]
    cat_map: dict[str | None, str] = {}
    cat_color_map: dict[str | None, str] = {}
    if category_ids:
        cats = db.query(Category.id, Category.name, Category.color).filter(Category.id.in_(category_ids)).all()
        cat_map = {c.id: c.name for c in cats}
        cat_color_map = {c.id: c.color for c in cats}

    # (node_id, cat_name, amount, major_group, color)
    expense_entries: list[tuple[str, str, Decimal, str, str]] = []
    for cat_id, amount in spend_by_cat.items():
        cat_name = cat_map.get(cat_id, "Uncategorized") if cat_id else "Uncategorized"
        cat_color = cat_color_map.get(cat_id, "#6b7280") if cat_id else "#6b7280"
        node_id = f"final-{cat_id}" if cat_id else "final-uncategorized"
        major = MAJOR_CATEGORY_MAP.get(cat_name, "Other")
        expense_entries.append((node_id, cat_name, amount, major, cat_color))

    total_spend = sum((e[2] for e in expense_entries), _ZERO)
    savings = max(total_income - total_spend - investment_total, _ZERO)

    # ── Build 4-level nodes ────────────────────────────────────────────────
    nodes: list[dict] = []
    links: list[dict] = []

    # Level 0: Income source nodes
    for idx, (label, _amt) in enumerate(income_rows):
        nodes.append({
            "id": f"source-{idx}",
            "label": label,
            "type": "income",
            "level": 0,
        })

    # Level 1: Merged "Income" node
    if total_income > _ZERO:
        nodes.append({
            "id": "income",
            "label": "Income",
            "type": "income",
            "level": 1,
        })

    # Level 2: Major category nodes (+ Savings, Investments)
    # Track totals and largest child color per major group
    major_totals: dict[str, Decimal] = {}
    major_top_color: dict[str, tuple[Decimal, str]] = {}
    for _nid, _cname, amount, major, color in expense_entries:
        major_totals[major] = major_totals.get(major, _ZERO) + amount
        prev = major_top_color.get(major)
        if prev is None or amount > prev[0]:
            major_top_color[major] = (amount, color)

    for major_name in sorted(major_totals.keys()):
        nodes.append({
            "id": f"major-{major_name}",
            "label": major_name,
            "type": "major",
            "level": 2,
            "color": major_top_color[major_name][1],
        })

    if savings > _ZERO:
        nodes.append({
            "id": "savings",
            "label": "Savings",
            "type": "savings",
            "level": 2,
        })

    if investment_total > _ZERO:
        nodes.append({
            "id": "investments",
            "label": "Investments",
            "type": "investments",
            "level": 2,
        })

    # Level 3: Final expense category nodes
    for node_id, cat_name, _amount, _major, color in expense_entries:
        nodes.append({
            "id": node_id,
            "label": cat_name,
            "type": "expense",
            "level": 3,
            "color": color,
        })

    # ── Build links ────────────────────────────────────────────────────────

    # Level 0 → 1: Income sources → merged Income
    if total_income > _ZERO:
        for idx, (_label, amt) in enumerate(income_rows):
            if amt > _ZERO:
                links.append({
                    "source": f"source-{idx}",
                    "target": "income",
                    "value": _q(amt),
                })

    # Level 1 → 2: Income → Major categories / Savings / Investments
    if total_income > _ZERO:
        for major_name, major_total in sorted(major_totals.items()):
            if major_total > _ZERO:
                links.append({
                    "source": "income",
                    "target": f"major-{major_name}",
                    "value": _q(major_total),
                })

        if savings > _ZERO:
            links.append({
                "source": "income",
                "target": "savings",
                "value": _q(savings),
            })

        if investment_total > _ZERO:
            links.append({
                "source": "income",
                "target": "investments",
                "value": _q(investment_total),
            })

    # Level 2 → 3: Major categories → Final categories
    for node_id, _cat_name, amount, major, _color in expense_entries:
        if amount > _ZERO:
            links.append({
                "source": f"major-{major}",
                "target": node_id,
                "value": _q(amount),
            })

    if period == "yearly":
        period_label = str(year)
    elif period == "ytd":
        period_label = f"{year} YTD"
    else:
        period_label = f"{year}-{month:02d}"

    return {
        "month": period_label,
        "total_income": _q(total_income),
        "total_spend": _q(total_spend),
        "total_savings": _q(savings),
        "total_investments": _q(investment_total),
        "nodes": nodes,
        "links": links,
    }
