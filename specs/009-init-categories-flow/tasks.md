# Tasks: Init Categories Flow

**Input**: Design documents from `/specs/009-init-categories-flow/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md

**Tests**: Manual browser testing via Playwright MCP (no automated test tasks).

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

---

## Phase 1: Setup

**Purpose**: Test data preparation

- [x] T001 Create test data file with Categories, Examples, and Budget columns in data/init_categories.csv

---

## Phase 2: Foundational (Backend Changes)

**Purpose**: Backend support for Budget column in seed CSV — MUST complete before frontend work

**CRITICAL**: No frontend user story work can begin until this phase is complete

- [x] T002 [P] Extend `parse_seed_csv()` to parse optional `Budget` column as Decimal in backend/app/services/seed_service.py
- [x] T003 [P] Update `load_seed_categories()` to set `monthly_budget` on created Category records and return `budgets_loaded` count in backend/app/services/seed_service.py
- [x] T004 [P] Add `budgets_loaded: int` field to `SeedCategoriesResponse` schema in backend/app/schemas/budget.py
- [x] T005 [P] Update `upload_seed_categories` endpoint to pass `budgets_loaded` from service result to response in backend/app/api/import_.py
- [x] T006 [P] Update `useSeedCategoriesUpload` response type to include `budgets_loaded` in frontend/src/lib/queries/budget.ts

**Checkpoint**: Backend now accepts CSV with Budget column and returns budgets_loaded count

---

## Phase 3: User Story 1 — First-Time Category Initialization via CSV (Priority: P1) MVP

**Goal**: When user has no categories and clicks "Import Statement", show Init Categories screen with CSV upload instead of the normal import dropzone.

**Independent Test**: Open Budget page with no categories → click "Import Statement" → see Init screen → upload init_categories.csv → verify categories created with budget amounts.

### Implementation for User Story 1

- [x] T007 [US1] Add Init Categories step state management (detect `categories.length === 0`, new modal step `init-categories`) in frontend/src/components/budget/import-modal.tsx
- [x] T008 [US1] Build Init Categories screen UI with CSV upload dropzone, replacing existing SeedCategoriesUpload component in frontend/src/components/budget/import-modal.tsx
- [x] T009 [US1] Display list of created categories with name and budget amount after successful CSV upload in frontend/src/components/budget/import-modal.tsx

**Checkpoint**: User Story 1 fully functional — new users see Init screen, can upload CSV, see categories with budgets

---

## Phase 4: User Story 2 — Manual Category Addition (Priority: P2)

**Goal**: After CSV upload (or without one), user can manually add categories with name and optional budget amount.

**Independent Test**: On Init screen, type category name + budget → click Add → category appears in list. Try duplicate name → see validation error.

### Implementation for User Story 2

- [x] T010 [US2] Add inline manual category creation form (name input + budget input + Add button) to Init Categories screen in frontend/src/components/budget/import-modal.tsx
- [x] T011 [US2] Wire manual add form to existing `POST /api/v1/budget/categories` endpoint, refresh category list on success, show duplicate name validation error in frontend/src/components/budget/import-modal.tsx

**Checkpoint**: Users can supplement CSV categories with manual additions, duplicates are prevented

---

## Phase 5: User Story 3 — Complete Init and Proceed to Import (Priority: P2)

**Goal**: "Continue to Import" button transitions from Init screen to normal import dropzone. Button disabled until at least one category exists.

**Independent Test**: Add categories → click "Continue to Import" → see normal dropzone. Close modal, reopen → Init screen skipped (categories exist).

### Implementation for User Story 3

- [x] T012 [US3] Add "Continue to Import" button to Init Categories screen, disabled when category list is empty, transitions to dropzone step on click in frontend/src/components/budget/import-modal.tsx
- [x] T013 [US3] Ensure Import Statement modal skips Init step when categories already exist (existing behavior, verify correct with new step logic) in frontend/src/components/budget/import-modal.tsx

**Checkpoint**: Full Init-to-Import flow works end-to-end

---

## Phase 6: Polish & Manual Testing

**Purpose**: End-to-end validation with browser MCP

- [x] T014 Clean up database (delete transactions, categories) and clear category_mappings.md for fresh state testing
- [x] T015 Manual browser test: full Init flow (CSV upload + manual add + Continue to Import + first statement import) using Playwright MCP

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: No dependency on Setup — can run in parallel with Phase 1
- **User Story 1 (Phase 3)**: Depends on Phase 2 (backend must support Budget column)
- **User Story 2 (Phase 4)**: Depends on Phase 3 (needs Init screen UI to add manual form to)
- **User Story 3 (Phase 5)**: Depends on Phase 3 (needs Init screen UI to add button to)
- **Polish (Phase 6)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundational only — no dependency on other stories
- **User Story 2 (P2)**: Depends on US1 (adds form to Init screen built in US1)
- **User Story 3 (P2)**: Depends on US1 (adds button to Init screen built in US1). Can run in parallel with US2.

### Within Each Phase

- Phase 2: All tasks marked [P] — can run in parallel (different files/functions)
- Phase 3: Sequential (T007 → T008 → T009, same file)
- Phase 4: Sequential (T010 → T011, same file)
- Phase 5: T012 and T013 are sequential (same file)

### Parallel Opportunities

```text
Parallel Group 1 (Phase 1 + Phase 2):
  T001 (test data) || T002 + T003 + T004 + T005 + T006 (backend changes)

Parallel Group 2 (Phase 4 + Phase 5, after Phase 3):
  US2 (T010-T011) || US3 (T012-T013)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 + Phase 2 in parallel
2. Complete Phase 3: User Story 1
3. **STOP and VALIDATE**: Test CSV upload Init flow independently
4. This alone delivers the core value — users can initialize categories from CSV with budgets

### Incremental Delivery

1. Phase 1 + 2 → Backend ready
2. Add US1 → Test Init screen + CSV upload → MVP ready
3. Add US2 → Test manual category addition → Enhanced flow
4. Add US3 → Test Continue to Import → Complete flow
5. Phase 6 → Full manual testing with browser MCP

---

## Notes

- All frontend work is in a single file (import-modal.tsx) — tasks within a story are sequential
- Backend tasks are independent (different files/functions) — fully parallelizable
- No automated tests — manual browser testing per user request
- No database migrations needed — `monthly_budget` already exists on Category model
