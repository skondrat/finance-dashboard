"""
Subscriptions CRUD, detection, and utility endpoints.
"""

import hashlib

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id
from app.database import get_db
from app.models.subscription import DismissedSuggestion, Subscription
from app.models.statement_import import StatementImport
from app.schemas.subscription import (
    DismissRequest,
    PaymentSourcesResponse,
    SubscriptionCreate,
    SubscriptionResponse,
    SubscriptionUpdate,
    SuggestionsListResponse,
)
from app.services import subscription_service

router = APIRouter(prefix="/api/v1/subscriptions", tags=["subscriptions"])


# ---------------------------------------------------------------------------
# List
# ---------------------------------------------------------------------------


@router.get("", response_model=list[SubscriptionResponse])
def list_subscriptions(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    return (
        db.query(Subscription)
        .filter(Subscription.user_id == user_id)
        .order_by(Subscription.status, Subscription.name)
        .all()
    )


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------


@router.post("", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
def create_subscription(
    payload: SubscriptionCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    sub = Subscription(
        user_id=user_id,
        name=payload.name,
        cadence=payload.cadence,
        amount=payload.amount,
        currency=payload.currency,
        payment_day=payload.payment_day,
        payment_source=payload.payment_source,
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------


@router.patch("/{subscription_id}", response_model=SubscriptionResponse)
def update_subscription(
    subscription_id: str,
    payload: SubscriptionUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    sub = (
        db.query(Subscription)
        .filter(Subscription.id == subscription_id, Subscription.user_id == user_id)
        .first()
    )
    if sub is None:
        raise HTTPException(status_code=404, detail="Subscription not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(sub, field, value)

    db.commit()
    db.refresh(sub)
    return sub


# ---------------------------------------------------------------------------
# Cancel / Reactivate
# ---------------------------------------------------------------------------


@router.patch("/{subscription_id}/cancel", response_model=SubscriptionResponse)
def cancel_subscription(
    subscription_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    sub = (
        db.query(Subscription)
        .filter(Subscription.id == subscription_id, Subscription.user_id == user_id)
        .first()
    )
    if sub is None:
        raise HTTPException(status_code=404, detail="Subscription not found")

    sub.status = "cancelled"
    db.commit()
    db.refresh(sub)
    return sub


@router.patch("/{subscription_id}/reactivate", response_model=SubscriptionResponse)
def reactivate_subscription(
    subscription_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    sub = (
        db.query(Subscription)
        .filter(Subscription.id == subscription_id, Subscription.user_id == user_id)
        .first()
    )
    if sub is None:
        raise HTTPException(status_code=404, detail="Subscription not found")

    sub.status = "active"
    db.commit()
    db.refresh(sub)
    return sub


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------


@router.delete("/{subscription_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subscription(
    subscription_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    sub = (
        db.query(Subscription)
        .filter(Subscription.id == subscription_id, Subscription.user_id == user_id)
        .first()
    )
    if sub is None:
        raise HTTPException(status_code=404, detail="Subscription not found")

    db.delete(sub)
    db.commit()


# ---------------------------------------------------------------------------
# Suggestions (auto-detection)
# ---------------------------------------------------------------------------


@router.get("/suggestions", response_model=SuggestionsListResponse)
def get_suggestions(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    suggestions = subscription_service.detect_recurring(db, user_id)
    return SuggestionsListResponse(suggestions=suggestions)


@router.post("/suggestions/dismiss", status_code=status.HTTP_204_NO_CONTENT)
def dismiss_suggestion(
    payload: DismissRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    desc_hash = hashlib.sha256(payload.description.lower().encode()).hexdigest()
    existing = (
        db.query(DismissedSuggestion)
        .filter(
            DismissedSuggestion.user_id == user_id,
            DismissedSuggestion.description_hash == desc_hash,
        )
        .first()
    )
    if not existing:
        db.add(DismissedSuggestion(user_id=user_id, description_hash=desc_hash))
        db.commit()


# ---------------------------------------------------------------------------
# Payment Sources
# ---------------------------------------------------------------------------


@router.get("/payment-sources", response_model=PaymentSourcesResponse)
def get_payment_sources(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    sources = (
        db.query(StatementImport.source)
        .filter(StatementImport.user_id == user_id, StatementImport.source.isnot(None))
        .distinct()
        .all()
    )
    return PaymentSourcesResponse(sources=[s[0] for s in sources if s[0]])
