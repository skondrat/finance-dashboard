# Tasks: ATM Cash Expense Categorization

**Input**: Design documents from `/specs/008-atm-cash-categorization/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. US1 and US2 are combined into one phase since they are both P1 and tightly coupled (US2 is the LLM matching that powers US1's split flow).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: Backend schemas and LLM function that all user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T001 [P] Add split ATM request/response Pydantic schemas (SplitAtmRequest, CashSplitItem, SplitAtmResponse, SplitOverride, SplitConfirmItem) in backend/app/schemas/budget.py
- [x] T002 [P] Add parse_cash_notes() function in backend/app/services/llm_service.py — accepts notes string, ATM amount (Decimal), and known_categories (list[str]); uses structured output via client.messages.parse() with a Pydantic model (_CashSplitResult) to return list of {description, amount, category_name}; single LLM call; follows existing extract_transactions_from_text pattern
- [x] T003 Extend ConfirmImportRequest in backend/app/schemas/budget.py to add optional splits field (list[SplitOverride] | None)

**Checkpoint**: Schemas and LLM function ready — endpoint and UI implementation can begin

---

## Phase 2: User Story 1+2 - Split ATM Cash & LLM Category Matching (Priority: P1) 🎯 MVP

**Goal**: User can click "Split Cash" on an ATM Withdrawal row, enter free-text notes, and see split line items matched to existing categories

**Independent Test**: Import a statement with ATM withdrawals, enter "200 cosmetics, 50 taxi" on a €300 ATM row, verify preview shows 3 rows (€200 cosmetics category, €50 transport category, €50 ATM remainder)

### Implementation for User Story 1+2

- [x] T004 [US1] Add POST /budget/import/{import_id}/split-atm-cash endpoint in backend/app/api/import_.py — load import (validate preview status), get transaction at row_index, validate it's ATM Withdrawal category, load user categories, call parse_cash_notes(), match category names to IDs (use "Other" for unmatched), validate sum ≤ original amount, compute remainder, return SplitAtmResponse
- [x] T005 [US1] Extend confirm_import() in backend/app/services/import_service.py — after applying category_overrides, process splits: for each split, find original BudgetTransaction at row_index, delete it, create new BudgetTransaction rows for each split item (same date, currency, import_id, user_id; description from note text; amount from split; category from split), create remainder row if remainder > 0 (keep original description and ATM Withdrawal category), update import row_count
- [x] T006 [P] [US1] Add TypeScript types for split (SplitAtmRequest, CashSplitItem, SplitAtmResponse, SplitState) and useSplitAtmCash mutation hook in frontend/src/lib/queries/budget.ts — POST to /budget/import/{importId}/split-atm-cash, extend useConfirmImport to include splits in request body
- [x] T007 [US1] Add split UI to import-modal.tsx in frontend/src/components/budget/import-modal.tsx — add "Split Cash" button on rows where category_name === "ATM Withdrawal"; clicking opens an inline textarea below the row; submit button calls useSplitAtmCash mutation; store split state as Map<number, { original: ImportRow, items: CashSplitItem[], remainder: string }>; render split items as sub-rows replacing the original ATM row; show loading spinner during LLM call; show error message on failure; client-side validation: reject notes without numeric amounts (/\d+/ regex)
- [x] T008 [US1] Wire confirm flow with splits in frontend/src/components/budget/import-modal.tsx — when building confirm payload, convert splitState Map to splits array: for each entry, build SplitOverride with row_index and items (use overridden category_id if user changed it, otherwise use LLM-assigned category_id); pass splits to confirmMutation

**Checkpoint**: Core split flow works end-to-end. User can split ATM cash, see results, and confirm import with splits persisted.

---

## Phase 3: User Story 3 - Review & Undo Split (Priority: P2)

**Goal**: User can override categories on split rows and undo a split to restore the original ATM Withdrawal row

**Independent Test**: Perform a split, change a category on a split row, confirm import — verify corrected category persists. Perform a split, click undo — verify original ATM row is restored.

### Implementation for User Story 3

- [x] T009 [US3] Add undo split functionality in frontend/src/components/budget/import-modal.tsx — add "Undo Split" button on split row groups; clicking removes the entry from splitState Map; original ATM Withdrawal row re-appears in the preview table; any category overrides for the split items are cleaned up from the overrides Map
- [x] T010 [US3] Enable category override on split rows in frontend/src/components/budget/import-modal.tsx — split sub-rows must render the CategorySelector dropdown (same as regular rows); when user changes category on a split item, update the item's category_id in the splitState Map (not in the overrides Map, since split items aren't real row indices); ensure the updated category flows through to the confirm payload

**Checkpoint**: All user stories functional. User has full control: split, review, override categories, undo, confirm.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, validation, and error handling improvements

- [x] T011 [P] Add backend validation edge cases in backend/app/api/import_.py — return 400 if notes contain no numeric amounts (regex check before LLM call); return 400 if row_index out of range; return 400 if referenced row is not ATM Withdrawal category; return 502 with clear message if LLM call fails/times out
- [x] T012 [P] Handle multiple ATM rows independently in frontend/src/components/budget/import-modal.tsx — ensure splitState Map supports multiple entries (one per ATM row); each ATM row's split is independent; undo only affects the targeted row
- [x] T013 Visual polish for split rows in frontend/src/components/budget/import-modal.tsx — indent split sub-rows or use visual grouping to distinguish them from regular rows; show "split" badge on split items (similar to existing category source badges); remainder row should keep the ATM Withdrawal styling

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — can start immediately
- **US1+US2 (Phase 2)**: Depends on Phase 1 completion (schemas + LLM function)
- **US3 (Phase 3)**: Depends on Phase 2 completion (split UI must exist to add undo/override)
- **Polish (Phase 4)**: Can start after Phase 2; runs in parallel with Phase 3

### Within Each Phase

- T001 and T002 can run in parallel (different files)
- T003 depends on T001 (extends same file)
- T004 depends on T001+T002 (uses schemas and LLM function)
- T005 depends on T003 (uses extended ConfirmImportRequest)
- T006 can start in parallel with T004 (different layer: frontend types)
- T007 depends on T006 (uses types and mutation hook)
- T008 depends on T007 (extends confirm wiring in same component)
- T009 and T010 depend on T007 (extend split UI)
- T011, T012, T013 can all run in parallel

### Parallel Opportunities

```
Phase 1:  T001 ──┬── T003
          T002 ──┘

Phase 2:  T004 ──── T005
          T006 ──── T007 ──── T008

Phase 3:  T009 (parallel with T010)
          T010

Phase 4:  T011 | T012 | T013 (all parallel)
```

---

## Implementation Strategy

### MVP First (User Story 1+2 Only)

1. Complete Phase 1: Foundational (T001-T003)
2. Complete Phase 2: US1+US2 core split (T004-T008)
3. **STOP and VALIDATE**: Test split flow end-to-end
4. Deploy if ready — core value delivered

### Incremental Delivery

1. Complete Foundational → schemas and LLM ready
2. Add US1+US2 → Test independently → Deploy (MVP!)
3. Add US3 → Undo and override → Deploy
4. Polish → Edge cases and visuals → Deploy

---

## Notes

- All changes are additions to existing files — no new files created
- Split state lives in frontend (research decision R1) — no DB schema changes
- LLM uses structured output via messages.parse() (research decision R2)
- Confirm endpoint extended with splits field (research decision R3)
- Frontend + backend both validate notes contain amounts (research decision R4)
