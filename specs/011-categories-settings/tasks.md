# Tasks: Categories Settings Page

**Input**: Design documents from `/specs/011-categories-settings/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)

## Phase 1: Foundational (Backend + Query Infrastructure)

**Purpose**: Backend endpoint and frontend mutation that all user stories depend on

- [x] T001 [P] Add `EnsureRequiredResponse` schema (with `created: list[str]` field) in backend/app/schemas/budget.py
- [x] T002 [P] Add `useEnsureRequiredCategories` mutation (POST `/budget/categories/ensure-required`) in frontend/src/lib/queries/budget.ts
- [x] T003 Add `POST /budget/categories/ensure-required` endpoint that creates "Other" (color #6B7280) and "ATM Withdrawal" if missing for the authenticated user, returning `EnsureRequiredResponse`, in backend/app/api/categories.py

**Checkpoint**: Backend endpoint returns `{"created": [...]}` and frontend can call the mutation

---

## Phase 2: User Story 1 - Initialize categories from Budget page (Priority: P1)

**Goal**: Users with no categories see a centered "Init Categories" button on the Budget page. Clicking it navigates to a dedicated Categories page where they can upload CSV or add categories manually. Save ensures required categories exist and navigates back to Budget.

**Independent Test**: Visit Budget page with zero categories, click "Init Categories", add categories via CSV or manually, click Save, verify return to Budget page with Import available.

### Implementation for User Story 1

- [x] T004 [US1] Create categories page at frontend/src/app/(dashboard)/budget/categories/page.tsx with: (a) init mode showing CSV upload dropzone using `useSeedCategoriesUpload` mutation, (b) manual add form with name + optional budget inputs using `useCreateCategory` mutation, (c) scrollable category list with inline budget editing using `useUpdateCategory` mutation, (d) delete button on each category row using `useDeleteCategory` mutation, (e) Save button that calls `useEnsureRequiredCategories` then `router.push('/budget')`, (f) uses `useImportCategories` query to load existing categories
- [x] T005 [US1] Modify budget page at frontend/src/app/(dashboard)/budget/page.tsx to: (a) use `useImportCategories` query to check category count, (b) when `categories.length === 0` show centered empty state with "Init Categories" button linking to `/budget/categories` and hide KPI strip, CategoryTable, ImportModal, IncomeManager, (c) when categories exist show normal budget layout, (d) hide Import button area when no categories

**Checkpoint**: Init flow works end-to-end — empty budget page → Init Categories → add categories → Save → budget page with content

---

## Phase 3: User Story 4 - Import flow without category initialization (Priority: P1)

**Goal**: The Import Statement modal no longer includes category initialization. It opens directly to file upload.

**Independent Test**: With categories initialized, click Import and verify the modal opens directly to file dropzone with no InitCategories step.

### Implementation for User Story 4

- [x] T006 [US4] Remove `InitCategories` component (lines ~400-581), `InitCategoryBudgetCell` component (lines ~331-398), `showInit` state variable, and the `if (categories.length === 0) setShowInit(true)` logic from the button click handler in frontend/src/components/budget/import-modal.tsx. The modal should always open directly to the file upload dropzone.

**Checkpoint**: Import modal opens straight to file upload. No category initialization step exists in the import flow.

---

## Phase 4: User Story 2 - Settings gear on Budget page (Priority: P2)

**Goal**: Budget page has a gear icon that opens a dropdown with a "Categories" option, navigating to the Categories page.

**Independent Test**: Click gear icon on Budget page, see dropdown with "Categories", click it, arrive at Categories page.

### Implementation for User Story 2

- [x] T007 [P] [US2] Create `SettingsMenu` component at frontend/src/components/budget/settings-menu.tsx with: (a) gear icon button (16x16 inline SVG, styled like existing ThemeToggle: `bg-surface-container-high rounded-full w-8 h-8`), (b) dropdown positioned below-right with single "Categories" item, (c) click-outside-to-close behavior, (d) clicking "Categories" navigates to `/budget/categories` via `router.push`
- [x] T008 [US2] Add `SettingsMenu` to the budget page at frontend/src/app/(dashboard)/budget/page.tsx — place it in the right column area near the top, visible in both empty and populated states

**Checkpoint**: Gear icon visible on budget page. Dropdown opens with "Categories" option. Clicking navigates to Categories page.

---

## Phase 5: User Story 3 - Manage categories on Categories page (Priority: P2)

**Goal**: Categories page supports full management: add, edit budget, remove (with immutability for "Other" and "ATM Withdrawal"). CSV upload is hidden when categories already exist (manage mode).

**Independent Test**: Navigate to Categories page with existing categories, verify CSV upload is hidden, edit a budget, add a new category, verify "Other" and "ATM Withdrawal" cannot be removed, remove a non-immutable category, Save.

### Implementation for User Story 3

- [x] T009 [US3] Update categories page at frontend/src/app/(dashboard)/budget/categories/page.tsx to: (a) define `IMMUTABLE_CATEGORIES = ["Other", "ATM Withdrawal"]` constant, (b) hide delete button for categories whose name is in `IMMUTABLE_CATEGORIES`, (c) hide CSV upload section when `categories.length > 0` (manage mode vs init mode)

**Checkpoint**: Immutable categories cannot be removed. CSV upload only shown when no categories exist. All management operations work.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verification and cleanup

- [x] T010 Run `cd backend && ruff check .` and fix any linting issues in modified backend files
- [x] T011 Verify end-to-end flow: empty budget page → Init Categories → add via CSV → Save → budget page populated → gear icon → Categories → manage → Save → budget page

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Foundational)**: No dependencies — start immediately
  - T001 and T002 can run in parallel (different codebases)
  - T003 depends on T001 (needs schema)
- **Phase 2 (US1)**: Depends on Phase 1 completion
  - T004 depends on T002 (needs frontend mutation) and T003 (needs backend endpoint)
  - T005 depends on T004 (categories page must exist for navigation link)
- **Phase 3 (US4)**: Can run in parallel with Phase 2 (independent file)
  - T006 has no dependency on other phases — only modifies import-modal.tsx
- **Phase 4 (US2)**: Can start after Phase 2 (needs categories page to navigate to)
  - T007 can start in parallel with Phase 2 (new file, no dependencies)
  - T008 depends on T005 (modifies same file — budget page.tsx)
- **Phase 5 (US3)**: Depends on Phase 2 (modifies categories page from T004)
  - T009 depends on T004
- **Phase 6 (Polish)**: Depends on all previous phases

### User Story Dependencies

- **US1 (P1)**: Depends on Foundational only — no other story dependencies
- **US4 (P1)**: Independent — can run in parallel with US1
- **US2 (P2)**: Depends on US1 (needs categories page to exist for navigation)
- **US3 (P2)**: Depends on US1 (modifies the categories page created in US1)

### Parallel Opportunities

- **Phase 1**: T001 ∥ T002 (backend schema ∥ frontend mutation)
- **Phase 2 + 3**: T006 (US4) can run in parallel with T004/T005 (US1)
- **Phase 4**: T007 can start early (new file, no dependencies on categories page content)

---

## Parallel Example: Phase 1

```
# These can run simultaneously:
Task T001: "Add EnsureRequiredResponse schema in backend/app/schemas/budget.py"
Task T002: "Add useEnsureRequiredCategories mutation in frontend/src/lib/queries/budget.ts"

# Then sequentially:
Task T003: "Add ensure-required endpoint in backend/app/api/categories.py" (needs T001)
```

## Parallel Example: Phase 2 + 3

```
# These can run simultaneously after Phase 1:
Task T004: "Create categories page" (US1)
Task T006: "Remove InitCategories from import-modal" (US4)
```

---

## Implementation Strategy

### MVP First (User Story 1 + 4 Only)

1. Complete Phase 1: Foundational (T001-T003)
2. Complete Phase 2: US1 - Categories page + empty state (T004-T005)
3. Complete Phase 3: US4 - Remove init from import (T006)
4. **STOP and VALIDATE**: Categories can be initialized from budget page, import skips init step
5. Deploy/demo if ready

### Incremental Delivery

1. Phase 1 → Backend + mutations ready
2. + US1 (T004-T005) → Init categories flow works
3. + US4 (T006) → Import flow simplified → **MVP complete**
4. + US2 (T007-T008) → Gear icon settings menu added
5. + US3 (T009) → Full category management with immutability
6. + Polish (T010-T011) → Verified and clean

---

## Notes

- All category operations (add, remove, edit budget) use immediate API calls — no local batching
- Save button = ensure-required endpoint + `router.push('/budget')`
- Immutability is frontend-only: hide delete button for categories named "Other" or "ATM Withdrawal"
- CSV upload visible only in init mode (categories.length === 0)
- No database migration required — existing Category model is unchanged
