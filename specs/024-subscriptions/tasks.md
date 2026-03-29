# Tasks: Subscriptions

**Input**: Design documents from `/specs/024-subscriptions/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/subscriptions-api.md, research.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Exact file paths included in descriptions

---

## Phase 1: Foundational (Backend Model + Migration)

**Purpose**: Create the data layer shared across all user stories.

- [x] T001 [P] Create Subscription and DismissedSuggestion SQLAlchemy models in backend/app/models/subscription.py
- [x] T002 [P] Create Pydantic schemas (SubscriptionCreate, SubscriptionUpdate, SubscriptionResponse, SuggestionResponse, SuggestionsListResponse, DismissRequest, PaymentSourcesResponse) in backend/app/schemas/subscription.py
- [x] T003 Register subscription models in backend/alembic/env.py and add User relationship in backend/app/models/user.py
- [x] T004 Generate and apply Alembic migration for subscriptions and dismissed_suggestions tables in backend/

**Checkpoint**: Database tables exist, models and schemas ready.

---

## Phase 2: User Story 1 — View and Manage Subscriptions (Priority: P1) 🎯 MVP

**Goal**: SUBSCRIPTIONS tab in nav, subscription list with total monthly cost, manual add/edit/cancel/reactivate/delete.

**Independent Test**: Navigate to /subscriptions, add a subscription, verify it appears with correct total monthly cost. Cancel it, verify it moves to cancelled section. Delete it permanently.

### Implementation for User Story 1

- [x] T005 [US1] Create subscriptions API router with CRUD endpoints (list, create, update, cancel, reactivate, delete) in backend/app/api/subscriptions.py
- [x] T006 [US1] Register subscriptions router in backend/app/main.py (or wherever routers are registered)
- [x] T007 [US1] Create TanStack Query hooks (useSubscriptions, useCreateSubscription, useUpdateSubscription, useCancelSubscription, useReactivateSubscription, useDeleteSubscription) in frontend/src/lib/queries/subscriptions.ts
- [x] T008 [US1] Create SubscriptionModal component (add/edit form with name, cadence, amount, payment day, payment source fields) in frontend/src/components/subscriptions/subscription-modal.tsx
- [x] T009 [US1] Create SubscriptionList component (active list with total monthly cost KPI, cancelled section, edit/cancel/reactivate/delete actions) in frontend/src/components/subscriptions/subscription-list.tsx
- [x] T010 [US1] Create subscriptions page with empty state, list, and modal integration in frontend/src/app/(dashboard)/subscriptions/page.tsx
- [x] T011 [US1] Add SUBSCRIPTIONS tab between CASHFLOW and NETWORTH in frontend/src/components/layout/top-bar.tsx

**Checkpoint**: Full subscription CRUD works via the new tab. Total monthly cost correctly normalizes weekly/yearly subscriptions.

---

## Phase 3: User Story 2 — Auto-Detect Recurring Expenses (Priority: P2)

**Goal**: On-demand detection of recurring expenses from imported statements, displayed as suggestion cards that users can confirm or dismiss.

**Independent Test**: With budget_transactions containing the same description in 2+ consecutive months, navigate to /subscriptions and verify suggestion cards appear. Confirm one → becomes subscription. Dismiss another → doesn't reappear.

### Implementation for User Story 2

- [x] T012 [US2] Create subscription_service.py with detect_recurring(db, user_id) function that queries budget_transactions for descriptions appearing in 2+ consecutive months, excluding existing subscriptions and dismissed suggestions, in backend/app/services/subscription_service.py
- [x] T013 [US2] Add GET /suggestions endpoint to subscriptions router that calls detect_recurring and returns results in backend/app/api/subscriptions.py
- [x] T014 [US2] Add POST /suggestions/dismiss endpoint that creates a DismissedSuggestion record in backend/app/api/subscriptions.py
- [x] T015 [US2] Add useSubscriptionSuggestions and useDismissSuggestion query hooks in frontend/src/lib/queries/subscriptions.ts
- [x] T016 [US2] Create SuggestionCards component (cards with description, amount, months detected, confirm/dismiss buttons) in frontend/src/components/subscriptions/suggestion-cards.tsx
- [x] T017 [US2] Integrate SuggestionCards into subscriptions page (above subscription list, hidden when no suggestions) in frontend/src/app/(dashboard)/subscriptions/page.tsx

**Checkpoint**: Suggestions appear for recurring transactions. Confirm creates a subscription. Dismiss hides the suggestion permanently.

---

## Phase 4: User Story 3 — Payment Source Selection (Priority: P3)

**Goal**: Payment source dropdown populated from statement import sources with custom entry option.

**Independent Test**: Add/edit a subscription and verify payment source dropdown shows sources from imported statements.

### Implementation for User Story 3

- [x] T018 [US3] Add GET /payment-sources endpoint that queries distinct sources from statement_imports in backend/app/api/subscriptions.py
- [x] T019 [US3] Add usePaymentSources query hook in frontend/src/lib/queries/subscriptions.ts
- [x] T020 [US3] Update SubscriptionModal to use usePaymentSources for dropdown with custom entry fallback in frontend/src/components/subscriptions/subscription-modal.tsx

**Checkpoint**: Payment source dropdown shows real sources from user's imports.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Foundational)**: No dependencies — start immediately
- **Phase 2 (US1)**: Depends on Phase 1 (models + schemas)
- **Phase 3 (US2)**: Depends on Phase 2 (needs subscription list to exist for confirm flow)
- **Phase 4 (US3)**: Depends on T008 (modal must exist to add dropdown)

### Parallel Opportunities

- T001 and T002 can run in parallel (different files)
- T007, T008, T009 can be developed in parallel (different files)
- T012 and T015/T016 can be developed in parallel (backend/frontend)

### Execution Order

T001 + T002 → T003 → T004 → T005 → T006 → T007 + T008 + T009 → T010 → T011 → T012 → T013 → T014 → T015 + T016 → T017 → T018 → T019 → T020

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Models + migration
2. Phase 2: CRUD endpoints + frontend page + nav tab
3. **VALIDATE**: Full manual subscription management works
4. Deploy/demo

### Full Delivery

1. US1: Manual management (MVP)
2. US2: Auto-detection (core value-add)
3. US3: Payment source enrichment (polish)
4. Browser verification via Playwright MCP
