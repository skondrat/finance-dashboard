"""
Subscription detection service — finds recurring expenses in budget transactions.
"""

import hashlib
from collections import defaultdict

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.budget_transaction import BudgetTransaction
from app.models.subscription import DismissedSuggestion, Subscription


def detect_recurring(db: Session, user_id: str) -> list[dict]:
    """Find transaction descriptions appearing in 2+ consecutive months."""

    # Get all expense transactions (negative amounts) grouped by description and month
    rows = (
        db.query(
            func.lower(BudgetTransaction.description).label("desc_lower"),
            func.strftime("%Y-%m", BudgetTransaction.date).label("month"),
            BudgetTransaction.amount,
            BudgetTransaction.currency,
            BudgetTransaction.date,
        )
        .filter(
            BudgetTransaction.user_id == user_id,
            BudgetTransaction.amount < 0,
        )
        .order_by(BudgetTransaction.date.asc())
        .all()
    )

    # Group by lowercase description
    by_desc: dict[str, list] = defaultdict(list)
    for row in rows:
        by_desc[row.desc_lower].append({
            "month": row.month,
            "amount": float(abs(row.amount)),
            "currency": row.currency,
            "date": str(row.date),
        })

    # Find descriptions with consecutive months
    suggestions = []
    for desc, occurrences in by_desc.items():
        months = sorted(set(o["month"] for o in occurrences))
        if len(months) < 2:
            continue

        consecutive_count = _count_consecutive_months(months)
        if consecutive_count < 2:
            continue

        latest = max(occurrences, key=lambda o: o["date"])
        suggestions.append({
            "description": desc,
            "amount": latest["amount"],
            "currency": latest["currency"],
            "months_detected": consecutive_count,
            "latest_date": latest["date"],
        })

    # Filter out existing subscriptions (case-insensitive name match)
    existing_names = {
        s.name.lower()
        for s in db.query(Subscription.name)
        .filter(Subscription.user_id == user_id)
        .all()
    }

    # Filter out dismissed suggestions
    dismissed_hashes = {
        d.description_hash
        for d in db.query(DismissedSuggestion.description_hash)
        .filter(DismissedSuggestion.user_id == user_id)
        .all()
    }

    filtered = []
    for s in suggestions:
        desc_hash = hashlib.sha256(s["description"].lower().encode()).hexdigest()
        if s["description"].lower() in existing_names:
            continue
        if desc_hash in dismissed_hashes:
            continue
        filtered.append(s)

    return sorted(filtered, key=lambda s: s["months_detected"], reverse=True)


def _count_consecutive_months(months: list[str]) -> int:
    """Count the longest run of consecutive months in a sorted list of 'YYYY-MM' strings."""
    if not months:
        return 0

    max_run = 1
    current_run = 1

    for i in range(1, len(months)):
        y1, m1 = map(int, months[i - 1].split("-"))
        y2, m2 = map(int, months[i].split("-"))

        # Check if consecutive month
        if (y1 == y2 and m2 == m1 + 1) or (y2 == y1 + 1 and m1 == 12 and m2 == 1):
            current_run += 1
            max_run = max(max_run, current_run)
        else:
            current_run = 1

    return max_run
