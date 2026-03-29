# Tasks: Edit Init Categories

**Input**: Design documents from `/specs/010-edit-init-categories/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: Backend endpoint and frontend hooks that both user stories depend on

- [x] T001 [P] Add DELETE /budget/categories/{category_id} endpoint in backend/app/api/categories.py — hard-delete category, return 204; return 409 if category has associated transactions; return 404 if not found or wrong user
- [x] T002 [P] Add useUpdateCategory() mutation hook in frontend/src/lib/queries/budget.ts — PATCH /budget/categories/{id} with partial body, invalidate ["budget"] query key on success
- [x] T003 [P] Add useDeleteCategory() mutation hook in frontend/src/lib/queries/budget.ts — DELETE /budget/categories/{id}, invalidate ["budget"] query key on success

**Checkpoint**: Backend DELETE endpoint and both frontend mutation hooks are ready. User story implementation can begin.

---

## Phase 2: User Story 1 — Edit Budget Amount Inline (Priority: P1) 🎯 MVP

**Goal**: Users can click on any budget value in the Init Categories list to edit it in place. Confirm with Enter/blur, cancel with Escape.

**Independent Test**: Upload a CSV with budget amounts, click on a budget value, change it, verify it updates. Click on a dash, add a budget, verify it appears. Press Escape during edit, verify original value is restored.

### Implementation for User Story 1

- [x] T004 [US1] Update the category table in the InitCategories component to make budget cells click-to-edit in frontend/src/components/budget/import-modal.tsx — display mode shows formatted euro value or dash; clicking enters edit mode with a number input pre-filled with current value; Enter or blur calls useUpdateCategory with new monthly_budget (or null if cleared); Escape restores original value; reject negative values; show loading state during save

**Checkpoint**: Budget editing works independently. Users can modify any category's budget inline.

---

## Phase 3: User Story 2 — Remove Category from List (Priority: P1)

**Goal**: Users can remove unwanted categories from the Init Categories list with a single click.

**Independent Test**: Upload a CSV, click the remove button on a category, verify it disappears. Remove all categories, verify "Continue to Import" is disabled. Re-upload CSV, verify removed categories reappear.

### Implementation for User Story 2

- [x] T005 [US2] Add a remove button (x icon) column to the category table in the InitCategories component in frontend/src/components/budget/import-modal.tsx — each row gets a small "x" button; clicking calls useDeleteCategory; category disappears from list on success; "Continue to Import" button remains disabled when no categories exist (already handled by existing categories.length === 0 check)

**Checkpoint**: Category removal works independently. Users can curate their category list before proceeding to import.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Ensure both features work well together

- [x] T006 Verify combined flow in frontend/src/components/budget/import-modal.tsx — ensure editing a budget and removing a category in the same session works correctly; verify that removing a category while another row is in edit mode doesn't cause UI issues

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — can start immediately. All 3 tasks are parallel (different files/endpoints).
- **User Story 1 (Phase 2)**: Depends on T002 (useUpdateCategory hook)
- **User Story 2 (Phase 3)**: Depends on T001 and T003 (DELETE endpoint + useDeleteCategory hook)
  - US1 and US2 can proceed in parallel once their respective foundational tasks complete
- **Polish (Phase 4)**: Depends on both user stories being complete

### Within Each User Story

- Each user story is a single UI task that depends on its foundational hooks
- No model or service layer changes needed

### Parallel Opportunities

- T001, T002, T003 can all run in parallel (different files, independent endpoints)
- T004 and T005 modify the same file but different sections — can be done sequentially in either order
- US1 and US2 are independent — could be implemented by different developers in parallel

---

## Parallel Example: Foundational Phase

```bash
# Launch all foundational tasks together:
Task: "Add DELETE endpoint in backend/app/api/categories.py"
Task: "Add useUpdateCategory() hook in frontend/src/lib/queries/budget.ts"
Task: "Add useDeleteCategory() hook in frontend/src/lib/queries/budget.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T002 (useUpdateCategory hook)
2. Complete T004 (inline budget editing UI)
3. **STOP and VALIDATE**: Test inline budget editing independently
4. Deploy if ready — users can already edit budgets

### Incremental Delivery

1. Complete T001 + T002 + T003 → All hooks ready
2. Add T004 (US1: budget editing) → Test → Deploy (MVP!)
3. Add T005 (US2: category removal) → Test → Deploy
4. T006 (Polish) → Final validation

---

## Notes

- T002 and T003 both modify the same file (budget.ts) but are independent additions — can be done in sequence within the same file
- T004 and T005 both modify import-modal.tsx — the InitCategories component's table needs both the editable budget cell and the remove button column
- No backend schema or model changes needed
- The existing PATCH endpoint handles budget updates — only DELETE endpoint is new
