# Tasks: Add Spend Button & Default Categories

**Input**: Design documents from `/specs/014-add-spend-default-categories/`
**Tests**: Not requested.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: User Story 2 - Default Categories (Priority: P2, but foundational)

**Goal**: Ensure Debt and Investments categories exist after seed import.

- [x] T001 [US2] In `backend/app/services/seed_service.py`, after `load_seed_categories()` completes, check if "Debt" and "Investments" categories exist (case-insensitive). If not, create them with default colors and no budget.

**Checkpoint**: Seed CSV import auto-creates Debt and Investments.

---

## Phase 2: User Story 1 - Add Spend Button (Priority: P1)

**Goal**: User can add a manual expense from the budget page.

- [x] T002 [US1] Create `frontend/src/components/budget/add-spend-modal.tsx` — a modal with: category dropdown (fetched from existing categories), amount number input, description text input, submit/cancel buttons. On submit, POST to `/budget/transactions` with date=today, amount as negative, currency from store.
- [x] T003 [US1] In `frontend/src/app/(dashboard)/budget/page.tsx`, import AddSpendModal and place it next to the ImportModal in the right column button area. After successful submission, invalidate budget queries so the table refreshes.

**Checkpoint**: Add Spend button works end-to-end.

---

## Phase 3: Polish

- [x] T004 Verify full flow in browser: add a spend, check totals update. Reset data, upload seed CSV, verify Debt/Investments appear.

---

## Dependencies

- T001 is independent (backend only)
- T002 before T003 (modal must exist before importing it)
- T004 after T001 + T003

## Notes

- Total tasks: 4
- US1: 2 tasks (T002, T003)
- US2: 1 task (T001)
- Polish: 1 task (T004)
