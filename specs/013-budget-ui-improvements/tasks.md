# Tasks: Budget UI Improvements

**Input**: Design documents from `/specs/013-budget-ui-improvements/`
**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks grouped by user story. All changes in a single file: `frontend/src/components/budget/category-table.tsx`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)

---

## Phase 1: User Story 1 - Sort Categories by Column (Priority: P1) — MVP

**Goal**: All 5 column headers are clickable and sort the table with visible direction arrows.

**Independent Test**: Click each column header, verify rows reorder and arrow toggles direction.

### Implementation for User Story 1

- [x] T001 [US1] Add sort state (`sortColumn` and `sortDirection`) and sort logic to the `CategoryTable` component. Sort the `data` array using `useMemo` before rendering. Handle null values for Budget/Remaining by sorting them to the end. File: `frontend/src/components/budget/category-table.tsx`
- [x] T002 [US1] Replace static `<span>` column headers with clickable `<button>` elements. Add an inline SVG sort arrow (up/down chevron) that appears on the active sort column. Clicking a header sets it as the sort column (descending first); clicking again toggles direction. File: `frontend/src/components/budget/category-table.tsx`

**Checkpoint**: Table is fully sortable by all 5 columns with visible sort indicators.

---

## Phase 2: User Story 2 - Grey Progress Bar for No-Budget Categories (Priority: P2)

**Goal**: Categories with no budget (null or 0) display a grey progress bar instead of green.

**Independent Test**: View budget page, verify categories with €0.00 budget have grey bars and categories with positive budget have green bars.

### Implementation for User Story 2

- [x] T003 [US2] Verify and fix the `ProgressBar` component to ensure categories with budget === 0 or budget === null render a fully grey bar (no green fill). Check that the existing condition on line 30 works correctly, and if not, fix it. Also ensure that when spent > 0 but budget is 0/null, the bar remains grey. File: `frontend/src/components/budget/category-table.tsx`

**Checkpoint**: All no-budget categories show grey progress bars; budgeted categories show green/red correctly.

---

## Phase 3: Polish & Cross-Cutting Concerns

- [x] T004 Verify the full UI end-to-end in browser: sort all columns, check arrow indicators, confirm grey bars on no-budget categories, confirm green/red on budgeted categories.

---

## Dependencies & Execution Order

### Phase Dependencies

- **User Story 1 (Phase 1)**: No dependencies — start immediately
- **User Story 2 (Phase 2)**: No dependencies on US1 — can run in parallel (same file, but independent code sections)
- **Polish (Phase 3)**: Depends on both US1 and US2

### Within Each Phase

- T001 before T002 (T002 adds UI for the sort state T001 creates)
- T003 is independent of T001/T002

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. T001 — Sort state + logic
2. T002 — Clickable headers + arrows
3. **STOP and VALIDATE**: Test sorting in browser

### Incremental Delivery

1. T001 + T002 → Sorting works (MVP)
2. T003 → Grey bars for no-budget categories
3. T004 → Full verification

---

## Notes

- Total tasks: 4
- User Story 1: 2 tasks (T001, T002)
- User Story 2: 1 task (T003)
- Polish: 1 task (T004)
- All changes in a single file: `frontend/src/components/budget/category-table.tsx`
