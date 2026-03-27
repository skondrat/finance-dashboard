"""
Cashflow Sankey endpoint (T091).
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id
from app.database import get_db
from app.models.budget_transaction import BudgetTransaction
from app.models.category import Category
from app.models.income_source import IncomeSource

router = APIRouter(prefix="/api/v1", tags=["cashflow"])

_ZERO = Decimal("0")
_QUANT_2 = Decimal("0.01")


def _last_completed_month() -> tuple[int, int]:
    """Return (year, month) of the last fully completed calendar month."""
    today = date.today()
    if today.month == 1:
        return today.year - 1, 12
    return today.year, today.month - 1


@router.get("/cashflow/sankey")
def get_cashflow_sankey(
    currency: Optional[str] = Query("EUR"),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Return Sankey diagram data for the last completed month.

    Response shape:
      { month, nodes: [{id, label, type}], links: [{source, target, value}] }
    """
    year, month = _last_completed_month()
    start = date(year, month, 1)
    if month == 12:
        end = date(year + 1, 1, 1)
    else:
        end = date(year, month + 1, 1)

    # ── Income sources for the month ──────────────────────────────────────
    income_rows = (
        db.query(IncomeSource.label, IncomeSource.amount)
        .filter(
            IncomeSource.user_id == user_id,
            IncomeSource.currency == currency,
            IncomeSource.year == year,
            IncomeSource.month == month,
        )
        .all()
    )

    total_income = sum(
        (Decimal(str(r.amount)) for r in income_rows), _ZERO
    )

    # ── Expense categories (negative transactions, grouped) ───────────────
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
            BudgetTransaction.is_investment == False,  # noqa: E712
        )
        .group_by(BudgetTransaction.category_id)
        .all()
    )

    # Investment transactions
    investment_total_raw = (
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
    investment_total = abs(Decimal(str(investment_total_raw))) if investment_total_raw else _ZERO

    # Map category_id → (name, abs spend)
    category_ids = [r.category_id for r in spend_rows if r.category_id is not None]
    cat_map: dict[str | None, str] = {}
    if category_ids:
        cats = (
            db.query(Category.id, Category.name)
            .filter(Category.id.in_(category_ids))
            .all()
        )
        cat_map = {c.id: c.name for c in cats}

    expense_entries: list[tuple[str, str, Decimal]] = []
    for row in spend_rows:
        cat_id = row.category_id
        cat_name = cat_map.get(cat_id, "Uncategorized") if cat_id else "Uncategorized"
        node_id = f"expense-{cat_id}" if cat_id else "expense-uncategorized"
        amount = abs(Decimal(str(row.total)))
        expense_entries.append((node_id, cat_name, amount))

    total_spend = sum((e[2] for e in expense_entries), _ZERO)
    savings = max(total_income - total_spend - investment_total, _ZERO)

    # ── Build nodes ───────────────────────────────────────────────────────
    nodes: list[dict] = []
    links: list[dict] = []

    # Income nodes
    for idx, row in enumerate(income_rows):
        node_id = f"income-{idx}"
        nodes.append({"id": node_id, "label": row.label, "type": "income"})

    # Expense category nodes
    for node_id, cat_name, _amount in expense_entries:
        nodes.append({"id": node_id, "label": cat_name, "type": "expense"})

    # Savings node
    if savings > _ZERO:
        nodes.append({"id": "savings", "label": "Savings", "type": "savings"})

    # Investments node
    if investment_total > _ZERO:
        nodes.append({"id": "investments", "label": "Investments", "type": "investments"})

    # ── Build links (income → expenses / savings / investments) ──────────
    for idx, row in enumerate(income_rows):
        source_id = f"income-{idx}"
        source_amount = Decimal(str(row.amount))

        if total_income <= _ZERO:
            continue

        proportion = source_amount / total_income

        # Link to each expense category proportionally
        for node_id, _cat_name, exp_amount in expense_entries:
            link_value = (exp_amount * proportion).quantize(
                _QUANT_2, rounding=ROUND_HALF_UP
            )
            if link_value > _ZERO:
                links.append(
                    {
                        "source": source_id,
                        "target": node_id,
                        "value": float(link_value),
                    }
                )

        # Link to savings
        if savings > _ZERO:
            savings_share = (savings * proportion).quantize(
                _QUANT_2, rounding=ROUND_HALF_UP
            )
            if savings_share > _ZERO:
                links.append(
                    {
                        "source": source_id,
                        "target": "savings",
                        "value": float(savings_share),
                    }
                )

        # Link to investments
        if investment_total > _ZERO:
            inv_share = (investment_total * proportion).quantize(
                _QUANT_2, rounding=ROUND_HALF_UP
            )
            if inv_share > _ZERO:
                links.append(
                    {
                        "source": source_id,
                        "target": "investments",
                        "value": float(inv_share),
                    }
                )

    month_label = f"{year}-{month:02d}"

    return {
        "month": month_label,
        "total_income": float(total_income.quantize(_QUANT_2, rounding=ROUND_HALF_UP)),
        "total_spend": float(total_spend.quantize(_QUANT_2, rounding=ROUND_HALF_UP)),
        "total_savings": float(savings.quantize(_QUANT_2, rounding=ROUND_HALF_UP)),
        "total_investments": float(investment_total.quantize(_QUANT_2, rounding=ROUND_HALF_UP)),
        "nodes": nodes,
        "links": links,
    }
