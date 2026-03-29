# Tasks: Categorization Quality Improvements

**Input**: Design documents from `/specs/007-categorization-quality/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: No automated tests requested. Manual browser testing per quickstart.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Foundational (Shared Schema Change)

**Purpose**: Add `excluded_count` to the API response schema — needed by US1 but also used across stories.

- [x] T001 Add `excluded_count: int = 0` field to `ImportUploadResponse` in `backend/app/schemas/budget.py`
- [x] T002 [P] Add `excluded_count: number` to `ImportResponse` interface in `frontend/src/lib/queries/budget.ts`

**Checkpoint**: Schema/types updated, no behavioral changes yet.

---

## Phase 2: User Story 1 - Exclude Internal Transfers from Import (Priority: P1) 🎯 MVP

**Goal**: Filter out "Transfer between balances" transactions before preview and categorization so they never pollute budget data.

**Independent Test**: Import a PDF with "Transfer between balances" transactions → verify they don't appear in preview, `excluded_count` is displayed.

### Implementation for User Story 1

- [x] T003 [US1] Add transfer exclusion filter in `import_service.create_import()` in `backend/app/services/import_service.py` — after `parsed_rows` is produced (line ~104), filter out rows where `description.lower().strip().startswith("transfer between balances")`, track `excluded_count`, pass only non-excluded rows to categorization and preview building, include `excluded_count` in the return dict
- [x] T004 [US1] Display excluded count in import preview summary in `frontend/src/components/budget/import-modal.tsx` — in the preview header section (line ~576), add a span showing excluded_count when > 0 (e.g., "(3 internal transfers excluded)"), similar to existing duplicate_count and skipped_count display

**Checkpoint**: Internal transfers are filtered out. Import preview shows only real transactions with excluded count info.

---

## Phase 3: User Story 2 - ATM Withdrawal Auto-Categorization (Priority: P2)

**Goal**: Auto-categorize "ATM withdrawal" transactions via a built-in prefix rule with a dedicated category, bypassing AI.

**Independent Test**: Import a PDF with "ATM withdrawal (…)" transactions → verify auto-categorized as "ATM Withdrawal" with "rule" badge.

### Implementation for User Story 2

- [x] T005 [US2] Add `_ensure_builtin_category()` helper and built-in ATM rule in `backend/app/services/categorization_service.py` — create a helper function that checks if description starts with "atm withdrawal" (case-insensitive), looks up "ATM Withdrawal" category for the user (creating it if missing via `Category(id=uuid4(), user_id=user_id, name="ATM Withdrawal")`), returns `{category_id, category_name: "ATM Withdrawal", category_source: "rule"}` or None. Add this as Step 0 in both `categorize_transactions_batch()` and `categorize_transactions_batch_async()` before the mapping file check.
- [x] T006 [P] [US2] Add "ATM Withdrawal" to seed categories CSV in `data/categories.csv` — add a new row `ATM Withdrawal,` (no examples needed since the built-in rule handles it)

**Checkpoint**: ATM withdrawals are auto-categorized with "rule" source. Category created on-demand.

---

## Phase 4: User Story 3 - Harmonize Identical Descriptions (Priority: P3)

**Goal**: Post-process AI categorization results so all transactions with the same description get the same category via majority vote.

**Independent Test**: Import a PDF with repeated descriptions → verify all instances of same description get the same AI category.

### Implementation for User Story 3

- [x] T007 [US3] Add `_harmonize_ai_results()` function and integrate into both batch functions in `backend/app/services/categorization_service.py` — create `_harmonize_ai_results(results: dict[int, dict], descriptions: list[str]) -> dict[int, dict]` that groups by `description.lower().strip()`, for each group collects entries with `category_source == "ai"`, finds majority `category_id` (Counter, tie-break by lowest index), applies majority to all AI entries in the group. Call this at the end of `categorize_transactions_batch()` (before return) and `categorize_transactions_batch_async()` (after the AI gather completes, before return), passing `descriptions` alongside `results`.

**Checkpoint**: Identical descriptions always get the same AI-assigned category.

---

## Phase 5: User Story 4 - Flag "Other" Transactions for Review (Priority: P4)

**Goal**: Visually highlight "Other"-categorized transactions in the import preview to prompt user review.

**Independent Test**: Import a PDF where some transactions get "Other" → verify amber highlighting in preview table.

### Implementation for User Story 4

- [x] T008 [US4] Add amber/warning row highlighting for "Other" category in `PreviewTable` in `frontend/src/components/budget/import-modal.tsx` — in the row rendering (line ~133), determine effective category name (use override category name if present, otherwise `row.category_name`). If the effective name is "Other", add warning styling to the `<tr>` (e.g., `bg-on-error-container/5` or similar amber tone from the design system tokens). The highlight should disappear reactively when the user overrides the category via the dropdown (since `currentCatName` already reflects overrides).

**Checkpoint**: "Other" rows are visually distinct. Re-categorizing removes highlight.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all stories.

- [x] T009 Manually test full import flow per `specs/007-categorization-quality/quickstart.md` — import a PDF that exercises all 4 improvements (transfers excluded, ATM auto-categorized, repeated descriptions harmonized, "Other" highlighted), verify everything works together

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — schema changes only
- **US1 (Phase 2)**: Depends on T001, T002 (schema must have `excluded_count`)
- **US2 (Phase 3)**: Depends on Phase 1 only (no dependency on US1)
- **US3 (Phase 4)**: Depends on Phase 1 only (no dependency on US1 or US2)
- **US4 (Phase 5)**: Depends on T002 only (frontend type must be updated)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: After Phase 1 — independent
- **User Story 2 (P2)**: After Phase 1 — independent, can run in parallel with US1
- **User Story 3 (P3)**: After Phase 1 — independent, can run in parallel with US1/US2
- **User Story 4 (P4)**: After Phase 1 — independent, frontend-only, can run in parallel with US1/US2/US3

### Parallel Opportunities

- T001 and T002 can run in parallel (different files: backend schema vs frontend types)
- T003 and T005 can run in parallel (different files: import_service.py vs categorization_service.py)
- T004 and T008 can run in parallel (same file but different sections; or sequentially if safer)
- T006 can run in parallel with any other task (separate data file)
- US1–US4 backend work (T003, T005, T007) touches different functions in different files — parallelizable

---

## Parallel Example: All Backend Work

```bash
# After Phase 1, launch all backend story tasks in parallel:
Task T003: "Transfer exclusion filter in import_service.py"
Task T005: "ATM built-in rule in categorization_service.py"
Task T007: "Harmonization in categorization_service.py"
# Note: T005 and T007 are in the same file but different functions — can be parallelized carefully
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Schema changes (T001, T002)
2. Complete Phase 2: US1 — Transfer exclusion (T003, T004)
3. **STOP and VALIDATE**: Import a PDF with transfers → verify excluded
4. Deploy/demo if ready

### Incremental Delivery

1. Phase 1 → Schema ready
2. Add US1 (transfer exclusion) → Test → most impactful data quality fix
3. Add US2 (ATM rule) → Test → eliminates common "Other" misclassification
4. Add US3 (harmonization) → Test → ensures consistency across AI results
5. Add US4 ("Other" flagging) → Test → visual polish for remaining edge cases
6. Phase 6 → Full integration validation

---

## Notes

- No database migrations needed — all changes are in-code logic or API response fields
- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently testable after Phase 1 foundation
- Commit after each task or logical group
