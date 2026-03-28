"""
Auto-categorization service (T058, T018).

Matches transaction descriptions using a resolution chain:
1. Exact match from category_mappings.md (case-insensitive)
2. Keyword match via AutoCatRule
3. AI suggestion via Anthropic Claude (constrained to known categories)
"""

from __future__ import annotations

import logging
import uuid

from sqlalchemy.orm import Session

from app.models.auto_cat_rule import AutoCatRule
from app.models.budget_transaction import BudgetTransaction
from app.models.category import Category

logger = logging.getLogger(__name__)


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


def categorize_transactions_batch(
    db: Session,
    user_id: str,
    descriptions: list[str],
) -> dict[int, dict]:
    """Categorize a batch of transaction descriptions using the full resolution chain.

    Returns a dict mapping index -> {category_id, category_name, category_source}.
    """
    from app.services.mapping_file_service import load_mappings
    from app.services import llm_service

    results: dict[int, dict] = {}

    # Load mapping file
    mappings = load_mappings()

    # Load all active categories for this user
    categories = (
        db.query(Category)
        .filter(Category.user_id == user_id, Category.is_archived == False)  # noqa: E712
        .all()
    )
    category_by_name: dict[str, Category] = {c.name.lower(): c for c in categories}
    known_category_names = [c.name for c in categories]

    # Load all keyword rules
    rules = (
        db.query(AutoCatRule)
        .join(Category, AutoCatRule.category_id == Category.id)
        .filter(
            Category.user_id == user_id,
            Category.is_archived == False,  # noqa: E712
        )
        .all()
    )

    # Track descriptions that need AI categorization
    ai_needed: list[tuple[int, str]] = []

    for idx, description in enumerate(descriptions):
        if not description:
            results[idx] = {"category_id": None, "category_name": None, "category_source": "none"}
            continue

        desc_lower = description.lower().strip()

        # Step 1: Exact match from mapping file
        if desc_lower in mappings:
            cat_name = mappings[desc_lower]
            cat = category_by_name.get(cat_name.lower())
            if cat:
                results[idx] = {
                    "category_id": cat.id,
                    "category_name": cat.name,
                    "category_source": "mapping",
                }
                continue

        # Step 2: Keyword match via AutoCatRule
        matched = False
        for rule in rules:
            if rule.keyword.lower() in desc_lower:
                cat = db.query(Category).filter(Category.id == rule.category_id).first()
                results[idx] = {
                    "category_id": rule.category_id,
                    "category_name": cat.name if cat else None,
                    "category_source": "rule",
                }
                matched = True
                break

        if matched:
            continue

        # Step 3: Queue for AI
        ai_needed.append((idx, description))

    # Step 3: AI categorization for remaining descriptions
    if ai_needed and llm_service.is_available() and known_category_names:
        for idx, description in ai_needed:
            suggested_name = llm_service.suggest_category(
                description, mappings, known_category_names
            )
            if suggested_name:
                cat = category_by_name.get(suggested_name.lower())
                if cat:
                    results[idx] = {
                        "category_id": cat.id,
                        "category_name": cat.name,
                        "category_source": "ai",
                    }
                    continue

            # No match — leave uncategorized
            results[idx] = {"category_id": None, "category_name": None, "category_source": "none"}
    else:
        # AI not available — mark all remaining as uncategorized
        for idx, _ in ai_needed:
            results[idx] = {"category_id": None, "category_name": None, "category_source": "none"}

    return results


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
