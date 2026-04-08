# Tasks: Budget Spend Treemap

**Input**: Design documents from `/specs/075-budget-spend-treemap/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: No separate setup needed — project already exists, Recharts already installed.

(No tasks — skip to foundational)

---

## Phase 2: Foundational (Color Utility + Data Merging)

**Purpose**: Shared logic that all user stories depend on — color gradient computation and the data merging/transformation function.

- [x] T001 Create the SpendTreemap component scaffold with TreemapDataItem interface, comparison baseline type, color gradient utility function (HSL interpolation: hue 120° green → 0° red, dynamic scaling to data range, gray for null), and data merging function that takes two SpendByCategoryItem arrays and produces TreemapDataItem array in `frontend/src/components/budget/charts/spend-treemap.tsx`

**Checkpoint**: Color utility and data transform logic ready — user story implementation can begin.

---

## Phase 3: User Story 1 — View Spending Treemap (Priority: P1) MVP

**Goal**: Render a treemap chart in the right column below existing charts, with rectangles sized by absolute spend and colored by % change vs previous month. Include comparison baseline selector (month picker + "Budget" option).

**Independent Test**: Navigate to Budget page in monthly mode → treemap appears below existing charts with colored rectangles → change comparison selector → colors update → select "Budget" → colors compare against monthly budgets.

### Implementation for User Story 1

- [x] T002 [US1] Implement the comparison baseline selector UI as a compact dropdown inside SpendTreemap: options include months (hardcoded MONTHS/YEARS matching existing MonthComparison pattern, default to previous month) and a "Budget" option. Store selection as local component state using ComparisonBaseline type in `frontend/src/components/budget/charts/spend-treemap.tsx`
- [x] T003 [US1] Implement data fetching inside SpendTreemap: call useSpendByCategory for current month, conditionally call useSpendByCategory for comparison month (when baseline type is "month"), merge datasets using the data merging function from T001. For "Budget" baseline, use the budget field from the current month response in `frontend/src/components/budget/charts/spend-treemap.tsx`
- [x] T004 [US1] Implement the Recharts Treemap rendering with ResponsiveContainer (h-72), custom `content` prop for rectangle rendering with dynamic fill color from TreemapDataItem.color, and loading/empty states matching existing chart patterns (skeleton loader, "No spending data" message) in `frontend/src/components/budget/charts/spend-treemap.tsx`
- [x] T005 [US1] Add SpendTreemap to the SpendingCharts wrapper: import and render below IncomeVsSpendChart, conditionally shown only when period === "monthly" and month/year are set. Pass through period, month, year, and onCategoryClick props in `frontend/src/components/budget/spending-charts.tsx`

**Checkpoint**: Treemap renders with colored rectangles sized by spend, comparison selector works for month-vs-month and vs-budget modes.

---

## Phase 4: User Story 2 — Category Labels and Details (Priority: P2)

**Goal**: Display category name, spending amount, and % change as text labels within rectangles. Show detailed tooltip on hover. Click-to-filter transaction list.

**Independent Test**: Hover any rectangle → tooltip shows full details. Large rectangles show text labels. Click a rectangle → transaction list filters to that category.

### Implementation for User Story 2

- [x] T006 [US2] Enhance the custom Treemap content renderer to display category name, formatted spending amount (using formatCurrency), and formatted percentage change (using formatPercent) as text labels inside each rectangle. Hide or truncate text for rectangles below a minimum size threshold in `frontend/src/components/budget/charts/spend-treemap.tsx`
- [x] T007 [US2] Implement custom tooltip component (ChartTooltip pattern from existing charts): show category name, current month spending, baseline value (comparison month spend or budget amount), baseline label, and percentage change. Style with rounded-xl bg-surface-container-lowest/80 backdrop-blur matching existing chart tooltips in `frontend/src/components/budget/charts/spend-treemap.tsx`
- [x] T008 [US2] Implement click-to-filter: add onClick handler to Treemap that extracts categoryId from the clicked node and calls onCategoryClick prop, triggering the existing scroll-to-transaction-list + filter behavior in `frontend/src/components/budget/charts/spend-treemap.tsx`

**Checkpoint**: Labels visible in rectangles, tooltip shows full details on hover, clicking filters transaction list.

---

## Phase 5: User Story 3 — Handle Edge Cases (Priority: P3)

**Goal**: Gracefully handle new categories (no comparison data), no-budget categories in budget mode, non-monthly periods, and empty data states.

**Independent Test**: View treemap with a category that only exists in current month → shows gray rectangle. Select "Budget" with a category that has no budget → shows gray with "no budget set" tooltip. Switch to yearly period → treemap hidden.

### Implementation for User Story 3

- [x] T009 [US3] Handle edge cases in data merging and rendering: categories with null pctChange get gray color (#9CA3AF), tooltip shows "New" for categories with no comparison month data and "No budget set" for categories without monthly_budget in budget mode. Ensure single-category treemap fills entire area in `frontend/src/components/budget/charts/spend-treemap.tsx`
- [x] T010 [US3] Add empty state handling: show "No spending data" when no categories have spending, show "All categories lack budgets" hint when in Budget comparison mode and no categories have monthly_budget set in `frontend/src/components/budget/charts/spend-treemap.tsx`

**Checkpoint**: All edge cases handled gracefully — no crashes, clear visual indicators for missing data.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T011 Verify treemap renders correctly at different viewport widths (responsive behavior within 4-col sidebar) and ensure text labels adapt to rectangle sizes in `frontend/src/components/budget/charts/spend-treemap.tsx`
- [x] T012 Run quickstart.md validation: start both servers, navigate to Budget page, verify all acceptance scenarios from spec.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — start immediately
- **User Story 1 (Phase 3)**: Depends on T001 (foundational)
- **User Story 2 (Phase 4)**: Depends on T004 (treemap rendering exists)
- **User Story 3 (Phase 5)**: Depends on T004 (treemap rendering exists)
- **Polish (Phase 6)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on foundational phase only — MVP deliverable
- **User Story 2 (P2)**: Depends on US1 treemap rendering (T004) — enhances existing rectangles
- **User Story 3 (P3)**: Depends on US1 treemap rendering (T004) — adds defensive handling

### Within Each User Story

- T002 → T003 → T004 (selector → data → rendering)
- T006, T007, T008 can be done sequentially (all in same file, building on rendering)
- T009 → T010 (data handling → empty states)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001: Foundational (color + data utilities)
2. Complete T002-T005: User Story 1 (selector, data, rendering, integration)
3. **STOP and VALIDATE**: Treemap visible with colored rectangles, selector works
4. Continue to US2 for labels/tooltips/clicking

### Incremental Delivery

1. T001 → Foundation ready
2. T002-T005 → Treemap renders with colors (MVP)
3. T006-T008 → Labels, tooltips, click-to-filter
4. T009-T010 → Edge case handling
5. T011-T012 → Polish and validation

---

## Notes

- All implementation is in a single new file (`spend-treemap.tsx`) plus one small modification (`spending-charts.tsx`)
- No backend changes needed — reuses existing `GET /budget/spend-by-category` endpoint
- Recharts Treemap is already available (recharts v3.8.1)
- Follow existing chart component patterns (CategoryDistributionChart) for styling consistency
