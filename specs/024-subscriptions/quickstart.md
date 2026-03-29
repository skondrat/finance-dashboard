# Quickstart: Subscriptions

**Feature**: 024-subscriptions | **Date**: 2026-03-29

## What This Feature Does

Adds a Subscriptions tab for tracking recurring expenses. Users can manually add subscriptions or auto-detect them from imported bank statements. Supports cancel/reactivate lifecycle and shows total monthly cost.

## Files to Create

| File | Purpose |
|------|---------|
| `backend/app/models/subscription.py` | Subscription + DismissedSuggestion models |
| `backend/app/schemas/subscription.py` | Pydantic schemas |
| `backend/app/api/subscriptions.py` | CRUD + detection + dismiss endpoints |
| `backend/app/services/subscription_service.py` | Detection query logic |
| `backend/alembic/versions/xxx_add_subscriptions.py` | Migration |
| `frontend/src/app/(dashboard)/subscriptions/page.tsx` | Subscriptions page |
| `frontend/src/components/subscriptions/subscription-list.tsx` | Active + cancelled list |
| `frontend/src/components/subscriptions/subscription-modal.tsx` | Add/edit modal |
| `frontend/src/components/subscriptions/suggestion-cards.tsx` | Auto-detected suggestions |
| `frontend/src/lib/queries/subscriptions.ts` | TanStack Query hooks |

## Files to Modify

| File | Change |
|------|--------|
| `frontend/src/components/layout/top-bar.tsx` | Add SUBSCRIPTIONS tab |
| `backend/alembic/env.py` | Register new model imports |

## How to Verify

1. Start both servers
2. Navigate to /subscriptions — should see empty state
3. Click "Add Subscription" — fill form (name: Netflix, monthly, €13.99, day 15)
4. Verify it appears in list with total monthly cost = €13.99
5. Add a yearly subscription (€120) — total should be €13.99 + €10.00 = €23.99
6. Cancel Netflix — moves to Cancelled section, total drops to €10.00
7. Reactivate Netflix — moves back, total rises to €23.99
8. For auto-detection: ensure budget_transactions has recurring descriptions across 2+ months, then visit /subscriptions and check suggestions section
