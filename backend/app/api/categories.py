"""
Category and auto-categorization rule endpoints (T061 + T062).
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id
from app.database import get_db
from app.models.auto_cat_rule import AutoCatRule
from app.models.category import Category
from app.schemas.budget import (
    AutoCatRuleCreate,
    AutoCatRuleResponse,
    CategoryCreate,
    CategoryResponse,
    CategoryUpdate,
    MergeCategoryRequest,
)
from app.services import categorization_service

router = APIRouter(prefix="/api/v1", tags=["categories"])


# ---------------------------------------------------------------------------
# List categories
# ---------------------------------------------------------------------------


@router.get("/budget/categories", response_model=list[CategoryResponse])
def list_categories(
    include_archived: bool = False,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Return all categories for the current user."""
    query = db.query(Category).filter(Category.user_id == user_id)
    if not include_archived:
        query = query.filter(Category.is_archived == False)  # noqa: E712
    return query.order_by(Category.name).all()


# ---------------------------------------------------------------------------
# Create category
# ---------------------------------------------------------------------------


@router.post(
    "/budget/categories",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Create a new category."""
    category = Category(
        user_id=user_id,
        name=payload.name,
        color=payload.color,
        monthly_budget=payload.monthly_budget,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


# ---------------------------------------------------------------------------
# Update category
# ---------------------------------------------------------------------------


@router.patch("/budget/categories/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: str,
    payload: CategoryUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Partially update an existing category."""
    category = (
        db.query(Category)
        .filter(Category.id == category_id, Category.user_id == user_id)
        .first()
    )
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)

    db.commit()
    db.refresh(category)
    return category


# ---------------------------------------------------------------------------
# Merge category
# ---------------------------------------------------------------------------


@router.post("/budget/categories/{category_id}/merge", response_model=CategoryResponse)
def merge_category(
    category_id: str,
    payload: MergeCategoryRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Merge a category into a target category.

    All transactions belonging to the source category are reassigned to the
    target. The source category is archived and linked via merged_into_id.
    """
    source = (
        db.query(Category)
        .filter(Category.id == category_id, Category.user_id == user_id)
        .first()
    )
    if source is None:
        raise HTTPException(status_code=404, detail="Source category not found")

    target = (
        db.query(Category)
        .filter(Category.id == payload.target_category_id, Category.user_id == user_id)
        .first()
    )
    if target is None:
        raise HTTPException(status_code=404, detail="Target category not found")

    categorization_service.merge_category(db, source, target)

    db.refresh(target)
    return target


# ---------------------------------------------------------------------------
# List rules for a category
# ---------------------------------------------------------------------------


@router.get(
    "/budget/categories/{category_id}/rules",
    response_model=list[AutoCatRuleResponse],
)
def list_rules(
    category_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Return all auto-categorization rules for a category."""
    # Verify the category belongs to the user.
    category = (
        db.query(Category)
        .filter(Category.id == category_id, Category.user_id == user_id)
        .first()
    )
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")

    return (
        db.query(AutoCatRule)
        .filter(AutoCatRule.category_id == category_id)
        .order_by(AutoCatRule.keyword)
        .all()
    )


# ---------------------------------------------------------------------------
# Create rule
# ---------------------------------------------------------------------------


@router.post(
    "/budget/categories/{category_id}/rules",
    response_model=AutoCatRuleResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_rule(
    category_id: str,
    payload: AutoCatRuleCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Create an auto-categorization rule."""
    category = (
        db.query(Category)
        .filter(Category.id == category_id, Category.user_id == user_id)
        .first()
    )
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")

    rule = AutoCatRule(category_id=category_id, keyword=payload.keyword)
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


# ---------------------------------------------------------------------------
# Delete rule
# ---------------------------------------------------------------------------


@router.delete(
    "/budget/categories/{category_id}/rules/{rule_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_rule(
    category_id: str,
    rule_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Delete an auto-categorization rule."""
    # Verify category ownership first.
    category = (
        db.query(Category)
        .filter(Category.id == category_id, Category.user_id == user_id)
        .first()
    )
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")

    rule = (
        db.query(AutoCatRule)
        .filter(AutoCatRule.id == rule_id, AutoCatRule.category_id == category_id)
        .first()
    )
    if rule is None:
        raise HTTPException(status_code=404, detail="Rule not found")

    db.delete(rule)
    db.commit()


# ---------------------------------------------------------------------------
# Re-apply all rules
# ---------------------------------------------------------------------------


@router.post("/budget/rules/apply", status_code=status.HTTP_200_OK)
def apply_rules(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Re-apply all auto-categorization rules retroactively."""
    updated = categorization_service.apply_rules(db, user_id)
    return {"updated": updated}
