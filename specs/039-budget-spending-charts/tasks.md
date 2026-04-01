# Tasks: Budget Spending Trend Charts

**Input**: Design documents from `/specs/039-budget-spending-charts/`
**Prerequisites**: plan.md (required), spec.md (required), research.md

**Tests**: Not requested — manual browser testing via Playwright MCP.

**Organization**: Tasks are grouped by user story. US3 (category dots) is already implemented — verified in research.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: No setup needed — all dependencies (Recharts 3, TanStack Query, query hooks) already installed and existing chart components exist.

_(No tasks — skip to Phase 2)_

---

## Phase 2: Foundational

**Purpose**: No foundational work needed — backend endpoints, query hooks, and base chart components all exist.

**Existing infrastructure**:
- `GET /budget/charts/category-distribution` — donut data with colors
- `GET /budget/charts/income-vs-spend` — monthly bar chart data
- `useCategoryDistribution()` and `useIncomeVsSpend()` hooks in `frontend/src/lib/queries/budget-charts.ts`
- `CategoryDistributionChart` component in `frontend/src/components/budget/charts/category-distribution.tsx`
- `IncomeVsSpendChart` component in `frontend/src/components/budget/charts/income-vs-spend.tsx`

_(No tasks — skip to Phase 3)_

---

## Phase 3: User Story 1 + 3 — Donut Chart + Category Dots (Priority: P1) MVP

**Goal**: Replace the "Spending Trends" placeholder in the budget right sidebar with a donut chart showing spend by category, using each category's assigned color. Category dots in the table should also use correct colors (already implemented).

**Independent Test**: View the Budget page, verify the donut chart appears in the right sidebar with correctly colored slices matching each category's spend proportion. Verify category dot colors in the table match the donut slices.

### Implementation

- [x] T001 [US1] Create `SpendingCharts` wrapper component in `frontend/src/components/budget/spending-charts.tsx` that renders `CategoryDistributionChart` (passing `period`, `month`, `year` props) and will later include the bar chart below it
- [x] T002 [US1] Replace the "Spending Trends" placeholder (lines 132-140) in `frontend/src/app/(dashboard)/budget/page.tsx` with the `SpendingCharts` component, passing `period={period}`, `month={summaryMonth}`, `year={summaryYear}` props
- [x] T003 [US3] Verify category dots in `frontend/src/components/budget/category-table.tsx` already use `item.category.color` — no code change expected (research confirmed this is already working)

**Checkpoint**: Donut chart visible in right sidebar, colored by category. Category dots match donut colors. Story is independently testable.

---

## Phase 4: User Story 2 — Monthly Savings / Income / Spending Bar Chart (Priority: P2)

**Goal**: Below the donut chart, display a grouped bar chart with three bars per month (Savings=blue, Spendings=red, Income=gold) for all 12 months of the current year.

**Independent Test**: View the Budget page, verify grouped bars appear for months with data, all 12 months labeled on X-axis, correct colors, and a legend.

### Implementation

- [x] T004 [US2] Modify `IncomeVsSpendChart` in `frontend/src/components/budget/charts/income-vs-spend.tsx` to add a computed `savings` field (`income - spend`) to each data point, add a third `Bar` for savings, and update colors: blue (#3B82F6) for Savings, red (#EF4444) for Spendings, gold (#EAB308) for Income
- [x] T005 [US2] Ensure all 12 months (Jan-Dec) appear on the X-axis in `frontend/src/components/budget/charts/income-vs-spend.tsx` by padding the data array with empty month entries for months without data
- [x] T006 [US2] Add the `IncomeVsSpendChart` to the `SpendingCharts` wrapper in `frontend/src/components/budget/spending-charts.tsx` below the donut chart, rendering it within the same sidebar section

**Checkpoint**: Both donut and bar chart visible in right sidebar. Bar chart shows 3 grouped bars per month with correct colors and legend. All 12 months labeled.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and sidebar fit adjustments.

- [x] T007 Browser test via Playwright MCP: verify donut chart renders with category colors, bar chart shows grouped bars with correct colors/legend, period selector updates donut, currency switch updates both charts, and category dot colors match donut slices

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 3 (US1+US3)**: No dependencies — can start immediately
- **Phase 4 (US2)**: Depends on T001 (SpendingCharts wrapper) from Phase 3
- **Phase 5 (Polish)**: Depends on all previous phases

### Within Each Phase

- T001 before T002 (wrapper must exist before page imports it)
- T004 and T005 can be done together (same file, related changes)
- T006 depends on T001 (wrapper) and T004/T005 (bar chart modifications)

### Parallel Opportunities

- T003 (verify category dots) is independent — can run in parallel with T001/T002
- T004+T005 (bar chart modifications) can start once T001 is done

---

## Parallel Example: Phase 3

```bash
# T001 first (create wrapper), then in parallel:
Task T002: "Replace placeholder in budget/page.tsx"
Task T003: "Verify category dots in category-table.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 + 3)

1. Create SpendingCharts wrapper with donut chart (T001)
2. Wire into budget page replacing placeholder (T002)
3. Verify category dots (T003)
4. **STOP and VALIDATE**: Donut visible, colors correct

### Incremental Delivery

1. Phase 3: Donut chart + dots → Test → Visual verification
2. Phase 4: Add bar chart → Test → Visual verification
3. Phase 5: Browser test all acceptance criteria

---

## Notes

- Existing `CategoryDistributionChart` already handles: category colors from API, loading/empty states, tooltip, legend, center total label
- Existing `IncomeVsSpendChart` needs: savings bar, color changes, 12-month padding
- US3 (category dots) is already implemented — `category-table.tsx` line ~94 uses `item.category.color`
- Both charts fit naturally in the 4-col right sidebar layout
- No backend changes needed — all endpoints exist and return required data
