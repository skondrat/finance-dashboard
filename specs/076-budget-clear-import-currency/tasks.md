# Tasks: Budget Month Clear & Import Currency Selector

**Input**: Design documents from `/specs/076-budget-clear-import-currency/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: User Story 1 - Clear Budget Data for Current Month (Priority: P1) MVP

**Goal**: Add a "Clear current month data" option to the Debug menu that deletes only budget transactions for the selected month.

**Independent Test**: Select a month on the Budget page, open Debug menu, click "Clear current month data", confirm, and verify only that month's transactions are removed.

### Implementation for User Story 1

- [x] T001 [P] [US1] Add `POST /budget/debug/reset-month` endpoint accepting `month` and `year` query params that deletes budget transactions for the given month in `backend/app/api/import_.py`
- [x] T002 [P] [US1] Add `month: number` and `year: number` props to DebugMenu component, add "Clear current month data" button with `window.confirm()` dialog that calls the new endpoint and invalidates budget queries in `frontend/src/components/budget/debug-menu.tsx`
- [x] T003 [US1] Pass `month={month}` and `year={year}` props to `<DebugMenu />` in `frontend/src/app/(dashboard)/budget/page.tsx`

**Checkpoint**: User Story 1 should be fully functional — Debug menu shows new option, confirmation works, only selected month's transactions are deleted.

---

## Phase 2: User Story 2 - Import Currency Selector (Priority: P2)

**Goal**: Add a currency selector (EUR/USD/UAH) to the import modal so users control which currency is assigned to imported transactions.

**Independent Test**: Open import modal, verify currency selector shows EUR/USD/UAH with EUR as default, import a file with a non-default currency selected, and verify all transactions carry the selected currency.

### Implementation for User Story 2

- [x] T004 [P] [US2] Add `currency: Optional[str] = Form(default="EUR")` parameter to the `upload_import()` endpoint and pass it to `create_import()` in both PDF and non-PDF code paths in `backend/app/api/import_.py`
- [x] T005 [P] [US2] Add `currency?: string` to `UploadParams` interface and append `currency` to FormData in both `useImportUpload()` and `useImportWithProgress()` mutations in `frontend/src/lib/queries/budget.ts`
- [x] T006 [US2] Add `selectedCurrency` state (default "EUR"), render currency selector buttons (EUR/USD/UAH) visible for all file types, and pass selected currency to upload mutation and SSE upload calls in `frontend/src/components/budget/import-modal.tsx`

**Checkpoint**: User Story 2 should be fully functional — currency selector visible in import modal for all file types, selected currency applied to all imported transactions.

---

## Dependencies & Execution Order

### Phase Dependencies

- **User Story 1 (Phase 1)**: No dependencies — can start immediately
- **User Story 2 (Phase 2)**: No dependencies on US1 — can start immediately or in parallel
- Both stories modify `backend/app/api/import_.py` but in different sections (debug endpoints vs. upload endpoint), so they can proceed in parallel

### Within Each User Story

- T001 and T002 can run in parallel (backend and frontend)
- T003 depends on T002 (needs the updated DebugMenu props)
- T004 and T005 can run in parallel (backend and frontend)
- T006 depends on T005 (needs the updated UploadParams interface)

### Parallel Opportunities

```bash
# Wave 1: All backend + independent frontend tasks in parallel
T001: Backend reset-month endpoint
T002: Frontend DebugMenu component update
T004: Backend currency param on upload
T005: Frontend budget.ts upload mutations

# Wave 2: Frontend integration tasks (after Wave 1)
T003: Budget page passes props to DebugMenu
T006: Import modal currency selector UI
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001 + T002 in parallel
2. Complete T003
3. **STOP and VALIDATE**: Test clear month independently

### Incremental Delivery

1. User Story 1 (T001-T003) → Test → Clear month works
2. User Story 2 (T004-T006) → Test → Currency selector works
3. Both features independently add value

---

## Notes

- No schema changes needed — both features use existing `BudgetTransaction` model
- No new files created — all modifications to 5 existing files
- No test tasks generated (not requested in spec)
- `backend/app/services/import_service.py` already accepts a `currency` parameter — no changes needed there
