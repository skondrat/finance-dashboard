# Tasks: Edit and Delete Budget Transactions

**Input**: Design documents from `/specs/042-edit-delete-transactions/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Backend schema change shared by both user stories

- [x] T001 Add `amount: Optional[FloatDecimal] = None` field to `BudgetTransactionUpdate` schema in backend/app/schemas/budget.py

**Checkpoint**: Backend now accepts amount updates via existing PATCH endpoint — no other backend changes needed

---

## Phase 2: User Story 1 - Delete a Transaction (Priority: P1) 🎯 MVP

**Goal**: Users can delete any transaction from the budget page via a trash button with confirmation

**Independent Test**: Click trash icon on a transaction row → confirm → transaction disappears, KPIs and charts update

### Implementation for User Story 1

- [x] T002 [US1] Add `useDeleteBudgetTransaction()` mutation hook in frontend/src/lib/queries/budget.ts — DELETE to `/budget/transactions/{id}`, invalidate `["budget"]` queries on success
- [x] T003 [US1] Add trash/delete button to each transaction row in frontend/src/components/budget/transaction-list.tsx — small icon button at the end of the row, triggers `window.confirm()` then calls delete mutation
- [x] T004 [US1] Handle loading and error states for delete — disable trash button while mutation is pending, show error toast/message on failure

**Checkpoint**: Delete functionality complete and testable independently

---

## Phase 3: User Story 2 - Edit a Transaction Amount (Priority: P1)

**Goal**: Users can inline-edit the amount of any transaction via a pencil icon

**Independent Test**: Click pencil icon next to amount → field becomes editable → change value → press Enter → amount saved, summaries update

### Implementation for User Story 2

- [x] T005 [US2] Update `useUpdateBudgetTransaction()` mutation hook to accept `amount` field in frontend/src/lib/queries/budget.ts — add `amount?: number` to the mutation variables type
- [x] T006 [US2] Add inline amount editing to transaction rows in frontend/src/components/budget/transaction-list.tsx — pencil icon next to amount, click toggles to input field pre-filled with current value, Enter/checkmark saves, Escape cancels
- [x] T007 [US2] Add validation for amount input — ensure value is a valid number, prevent save on invalid input, show visual indicator

**Checkpoint**: Both edit and delete are fully functional and testable

---

## Phase 4: Polish & Cross-Cutting Concerns

- [x] T008 Run quickstart.md validation — start servers, test delete and edit on Budget page with Playwright MCP, verify KPIs/charts/category table refresh correctly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **User Story 1 (Phase 2)**: Depends on Phase 1 (schema change)
- **User Story 2 (Phase 3)**: Depends on Phase 1 (schema change); independent of Phase 2
- **Polish (Phase 4)**: Depends on Phases 2 and 3

### User Story Dependencies

- **User Story 1 (Delete)**: Independent — can be implemented and tested alone
- **User Story 2 (Edit Amount)**: Independent — can be implemented and tested alone
- Both stories modify `transaction-list.tsx` but touch different parts of the row (trash button vs amount cell)

### Parallel Opportunities

- T002 and T005 can run in parallel (different hooks in same file, but independent additions)
- User Stories 1 and 2 are largely parallelizable since they affect different UI areas within the same component

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Add amount to schema (T001)
2. Complete Phase 2: Delete functionality (T002-T004)
3. **STOP and VALIDATE**: Test delete independently
4. Proceed to Phase 3: Edit functionality (T005-T007)
5. Final validation (T008)

### Incremental Delivery

1. T001 → Backend ready
2. T002-T004 → Delete works → Testable MVP
3. T005-T007 → Edit works → Full feature
4. T008 → Verified with browser testing

---

## Notes

- Backend DELETE endpoint already exists — no backend changes needed for delete
- Backend PATCH endpoint already works generically — only schema change needed for amount
- Total: 8 tasks, 4 files modified, 0 new files, 0 migrations
- Both stories modify `transaction-list.tsx` — implement sequentially to avoid conflicts
