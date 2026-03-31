# Tasks: Transaction List View

**Input**: Design documents from `/specs/033-transaction-list-view/`
**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No setup needed — project already exists, dependencies installed, backend API ready.

*(No tasks — skip to Phase 2)*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Verify the existing query hook and understand current component structure before building.

- [x] T001 Verify `useBudgetTransactions` hook works and returns expected data shape in `frontend/src/lib/queries/budget.ts` — add `category_name` and `category_color` to the response type if not present
- [x] T002 Add category filter state to the budget Zustand store or create local state management for transaction list filters (search text, selected category ID) in `frontend/src/lib/queries/budget.ts` or a new store

**Checkpoint**: Query hook confirmed working with proper types, filter state management ready.

---

## Phase 3: User Story 1 - View All Transactions (Priority: P1) 🎯 MVP

**Goal**: Display a transaction list table below the category table showing date, description, amount, and category for each budget transaction, sorted by date (newest first) with sortable columns.

**Independent Test**: Navigate to Budget tab → scroll down → see transaction list with all transactions for the selected period.

### Implementation for User Story 1

- [x] T003 [US1] Create `TransactionList` component in `frontend/src/components/budget/transaction-list.tsx` — table with columns: date, description, amount (formatted with currency), category (name + color dot). Default sort by date descending. Pagination controls (page size 50). Empty state when no transactions. Use `useBudgetTransactions` hook with current period's `from_date`/`to_date`.
- [x] T004 [US1] Add sortable column headers to `TransactionList` — clicking a column header toggles sort direction (asc/desc) for date, description, amount, category. Visual indicator for active sort column and direction.
- [x] T005 [US1] Wire `TransactionList` into the Budget page in `frontend/src/app/(dashboard)/budget/page.tsx` — add below the category table section. Pass the current time period (from/to dates) from the existing `TimeAggregation` state.
- [x] T006 [US1] Add category row click handler in `frontend/src/components/budget/category-table.tsx` — clicking a category row scrolls to the transaction list and sets the category filter. Show a visual indicator (cursor pointer, hover state) that rows are clickable.

**Checkpoint**: Transaction list visible on Budget page, shows all transactions for the selected period, sortable columns, clicking a category row scrolls to and filters the list.

---

## Phase 4: User Story 2 - Search Transactions (Priority: P2)

**Goal**: Add a text search box above the transaction list that filters transactions by description (case-insensitive, client-side).

**Independent Test**: Type a merchant name in the search box → only matching transactions shown → clear search → all transactions return.

### Implementation for User Story 2

- [x] T007 [US2] Add search input to `TransactionList` component in `frontend/src/components/budget/transaction-list.tsx` — text input above the table, debounced (300ms), filters displayed transactions by description (case-insensitive substring match). Show result count. Clear button (X) to reset search.

**Checkpoint**: Search works independently, filters the transaction list in real-time.

---

## Phase 5: User Story 3 - Filter Transactions (Priority: P2)

**Goal**: Add a category dropdown filter that works alongside search and respects the pre-filter from category row clicks.

**Independent Test**: Select a category from dropdown → only that category's transactions shown → combine with search → both filters apply (AND logic) → clear filter → all transactions return.

### Implementation for User Story 3

- [x] T008 [US3] Add category filter dropdown to `TransactionList` component in `frontend/src/components/budget/transaction-list.tsx` — dropdown next to search input showing all categories (with color dots). Pre-populated when navigated from category row click. "All Categories" option to clear. Combines with search (AND logic).
- [x] T009 [US3] Handle "Uncategorized" transactions in `frontend/src/components/budget/transaction-list.tsx` — transactions with no category show "Uncategorized" label with a neutral gray color dot. Ensure they appear when "All Categories" is selected.

**Checkpoint**: Category filter works, combines with search, pre-filters from category row click, uncategorized transactions handled.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final refinements across the feature.

- [x] T010 Style and responsive polish in `frontend/src/components/budget/transaction-list.tsx` — ensure the table looks consistent with the rest of the Budget tab (matches category-table styling, Tailwind CSS conventions). Amount formatting matches existing currency display patterns. Proper spacing and alignment.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — can start immediately
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion
- **User Story 2 (Phase 4)**: Depends on Phase 3 (needs the TransactionList component)
- **User Story 3 (Phase 5)**: Depends on Phase 3 (needs the TransactionList component), can run in parallel with Phase 4
- **Polish (Phase 6)**: Depends on all user stories being complete

### Within Each User Story

- T003 before T004 (table structure before sortable headers)
- T005 and T006 depend on T003 (component must exist before wiring)
- T005 and T006 can run in parallel [P]

### Parallel Opportunities

- T005 and T006 can run in parallel (different files)
- US2 (T007) and US3 (T008, T009) can run in parallel after US1 is done (both modify transaction-list.tsx but different sections)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Verify hook + filter state
2. Complete Phase 3: Build TransactionList, wire into page, add category click
3. **STOP and VALIDATE**: Can see all transactions, sort columns, click category to filter

### Incremental Delivery

1. Phase 2 → Foundation ready
2. Phase 3 → Transaction list visible and functional (MVP!)
3. Phase 4 → Search added
4. Phase 5 → Category filter added
5. Phase 6 → Polish

---

## Notes

- This is a frontend-only feature — no backend changes needed
- The existing `useBudgetTransactions` hook and `/api/v1/budget/transactions` endpoint handle pagination and filtering
- Search is client-side on loaded page data for instant feedback
- Total: 10 tasks across 6 phases
