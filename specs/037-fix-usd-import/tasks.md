# Tasks: Fix USD Import Currency Conversion

**Input**: Design documents from `/specs/037-fix-usd-import/`
**Prerequisites**: plan.md, spec.md, research.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1)
- Include exact file paths in descriptions

---

## Phase 1: User Story 1 - USD transactions display correctly in EUR view (Priority: P1) 🎯 MVP

**Goal**: When viewing budget in EUR mode, USD transactions are filtered out (matching the behavior of summary and spend-by-category endpoints). When viewing in USD mode, only USD transactions are shown.

**Independent Test**: Import a USD statement, switch between EUR and USD display modes, and verify transaction list only shows transactions matching the selected currency.

### Implementation

- [x] T001 [US1] Add `currency` query parameter to `list_transactions` endpoint and filter by `BudgetTransaction.currency` in `backend/app/api/budget.py`

---

## Phase 2: Polish & Cross-Cutting Concerns

- [x] T002 Manual browser test: import USD statement, verify EUR view excludes USD transactions and USD view shows them correctly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1**: No dependencies — single-file fix
- **Phase 2**: Depends on Phase 1 completion (browser verification)

### Implementation Strategy

1. Apply the one-line fix to the transactions endpoint (T001)
2. Browser-test to confirm EUR/USD filtering works (T002)
3. Commit, push, PR, merge

---

## Notes

- This is a minimal fix: add currency filtering to match existing patterns in summary and spend-by-category endpoints
- No new models, services, or frontend changes needed — the frontend already sends the `currency` param
