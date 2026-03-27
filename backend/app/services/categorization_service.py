"""
Auto-categorization service (T058).

Matches transaction descriptions against AutoCatRule keywords and
applies rules retroactively to uncategorized transactions.
"""

from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from app.models.auto_cat_rule import AutoCatRule
from app.models.budget_transaction import BudgetTransaction
from app.models.category import Category


def categorize_transaction(
    db: Session,
    user_id: str,
    description: str,
) -> str | None:
    """Return matching category_id for a description, or None.

    Loads all rules for the user's categories and checks each keyword
    (case-insensitive) against the description.
    """
    if not description:
        return None

    description_lower = description.lower()

    rules = (
        db.query(AutoCatRule)
        .join(Category, AutoCatRule.category_id == Category.id)
        .filter(
            Category.user_id == user_id,
            Category.is_archived == False,  # noqa: E712
        )
        .all()
    )

    for rule in rules:
        if rule.keyword.lower() in description_lower:
            return rule.category_id

    return None


def apply_rules_retroactively(db: Session, user_id: str) -> int:
    """Re-categorize all uncategorized transactions for the user.

    Returns the number of transactions that were updated.
    """
    uncategorized = (
        db.query(BudgetTransaction)
        .filter(
            BudgetTransaction.user_id == user_id,
            BudgetTransaction.category_id.is_(None),
        )
        .all()
    )

    if not uncategorized:
        return 0

    # Pre-load all active rules for the user
    rules = (
        db.query(AutoCatRule)
        .join(Category, AutoCatRule.category_id == Category.id)
        .filter(
            Category.user_id == user_id,
            Category.is_archived == False,  # noqa: E712
        )
        .all()
    )

    updated_count = 0
    for tx in uncategorized:
        desc_lower = tx.description.lower()
        for rule in rules:
            if rule.keyword.lower() in desc_lower:
                tx.category_id = rule.category_id
                updated_count += 1
                break

    if updated_count > 0:
        db.commit()

    return updated_count


def create_rule(
    db: Session,
    category_id: str,
    keyword: str,
) -> AutoCatRule:
    """Create a new auto-categorization rule."""
    rule = AutoCatRule(
        id=str(uuid.uuid4()),
        category_id=category_id,
        keyword=keyword.strip(),
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule
