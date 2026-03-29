"""
Seed categories service (T030, T031).

Parse CSV with "Categories" column and optional "Examples" and "Budget" columns,
create Category records, and pre-populate category_mappings.md.
"""

from __future__ import annotations

import csv
import io
import uuid
from decimal import Decimal, InvalidOperation

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.category import Category


def parse_seed_csv(file_content: bytes) -> list[dict]:
    """Parse seed categories CSV.

    Returns list of dicts with 'category', optional 'examples', and optional 'budget' keys.
    Raises ValueError if CSV is invalid or missing 'Categories' column.
    """
    text = file_content.decode("utf-8-sig")  # Handle BOM
    reader = csv.DictReader(io.StringIO(text))

    if not reader.fieldnames:
        raise ValueError("CSV file is empty or has no headers")

    # Case-insensitive column matching
    field_map = {f.lower().strip(): f for f in reader.fieldnames}
    if "categories" not in field_map:
        raise ValueError("CSV must have a 'Categories' column")

    cat_field = field_map["categories"]
    examples_field = field_map.get("examples")
    budget_field = field_map.get("budget")

    results = []
    for row in reader:
        category = row.get(cat_field, "").strip()
        if not category:
            continue

        examples = []
        if examples_field and row.get(examples_field):
            examples = [e.strip() for e in row[examples_field].split("|") if e.strip()]

        budget = None
        if budget_field and row.get(budget_field, "").strip():
            try:
                budget = Decimal(row[budget_field].strip())
            except InvalidOperation:
                continue  # Skip rows with non-numeric budget

        results.append({"category": category, "examples": examples, "budget": budget})

    return results


def load_seed_categories(
    db: Session,
    user_id: str,
    parsed: list[dict],
) -> dict:
    """Create Category records and pre-populate mappings.

    Returns dict with categories_loaded, examples_loaded, and budgets_loaded counts.
    """
    from app.services.mapping_file_service import save_bulk_mappings

    categories_loaded = 0
    examples_loaded = 0
    budgets_loaded = 0
    all_mappings: dict[str, str] = {}

    for item in parsed:
        cat_name = item["category"]

        # Check if category already exists
        existing = (
            db.query(Category)
            .filter(Category.user_id == user_id, Category.name == cat_name)
            .first()
        )

        if not existing:
            new_cat = Category(
                id=str(uuid.uuid4()),
                user_id=user_id,
                name=cat_name,
                monthly_budget=item.get("budget"),
            )
            db.add(new_cat)
            categories_loaded += 1
            if item.get("budget") is not None:
                budgets_loaded += 1

        # Pre-populate mappings from examples
        for example in item.get("examples", []):
            all_mappings[example.lower()] = cat_name
            examples_loaded += 1

    db.commit()

    # Save example mappings to the MD file
    if all_mappings:
        save_bulk_mappings(all_mappings)

    # Ensure Debt and Investments categories exist
    _ENSURE_CATEGORIES = [
        {"name": "Debt", "color": "#DC2626"},
        {"name": "Investments", "color": "#10B981"},
    ]
    for cat_def in _ENSURE_CATEGORIES:
        exists = (
            db.query(Category)
            .filter(
                Category.user_id == user_id,
                func.lower(Category.name) == cat_def["name"].lower(),
            )
            .first()
        )
        if not exists:
            db.add(Category(
                id=str(uuid.uuid4()),
                user_id=user_id,
                name=cat_def["name"],
                color=cat_def["color"],
            ))
            categories_loaded += 1
    db.commit()

    return {
        "categories_loaded": categories_loaded,
        "examples_loaded": examples_loaded,
        "budgets_loaded": budgets_loaded,
    }
