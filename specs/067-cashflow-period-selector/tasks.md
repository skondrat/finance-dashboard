# Tasks: Cashflow Period Selector

**Input**: Design documents from `/specs/067-cashflow-period-selector/`
**Prerequisites**: plan.md, spec.md, research.md, contracts/cashflow-sankey.md

**Organization**: Tasks are grouped by user story. All three user stories are P1 and build on each other since they share the same backend endpoint and frontend components.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

---

## Phase 1: Foundational (Backend Period Support)

**Purpose**: Add period parameter and date range resolution to the backend endpoint — this is the prerequisite for all frontend work.

- [x] T001 Add `period` query parameter to `/cashflow/sankey` endpoint and implement date range resolution for monthly/yearly/ytd in `backend/app/api/cashflow.py`
- [x] T002 Update income source query to aggregate across multiple months (for yearly/ytd periods) in `backend/app/api/cashflow.py`
- [x] T003 Update the period label in the response (`month` field) to reflect the active period (e.g., "2026", "2026 YTD") in `backend/app/api/cashflow.py`

**Checkpoint**: Backend endpoint accepts `?period=yearly&year=2026` and returns aggregated data

---

## Phase 2: User Story 1 - Switch Between Period Views (Priority: P1) - MVP

**Goal**: User can switch between Monthly, Yearly, and YTD modes. UI controls adapt per mode.

**Independent Test**: Open Cashflow tab, click each period segment, verify controls and data change.

### Implementation for User Story 1

- [x] T004 [US1] Update `useCashflowSankey` hook to accept and pass `period` parameter to the API in `frontend/src/lib/queries/cashflow.ts`
- [x] T005 [US1] Replace MonthNavigator with period segmented control (Monthly/Yearly/YTD) and conditional month/year dropdowns in `frontend/src/app/(dashboard)/cashflow/page.tsx`
- [x] T006 [P] [US1] Update `CashflowKpiStrip` to accept `period` prop and pass it to the query hook in `frontend/src/components/cashflow/kpi-strip.tsx`
- [x] T007 [P] [US1] Update `SankeyDiagram` to accept `period` prop and pass it to the query hook in `frontend/src/components/cashflow/sankey-diagram.tsx`
- [x] T008 [P] [US1] Update `BreakdownRow` to accept `period` prop and pass it to the query hook in `frontend/src/components/cashflow/breakdown-row.tsx`

**Checkpoint**: Switching between Monthly/Yearly/YTD shows different data, controls adapt per mode

---

## Phase 3: User Story 2 - Yearly Aggregation Correctness (Priority: P1)

**Goal**: Yearly view shows correct aggregated data across all 12 months.

**Independent Test**: Compare yearly Sankey totals with sum of individual monthly totals.

- [x] T009 [US2] Verify yearly income aggregation sums all 12 months correctly — test in browser by comparing yearly total vs sum of monthly totals

**Checkpoint**: Yearly totals match arithmetic sum of all monthly totals

---

## Phase 4: User Story 3 - YTD Aggregation Correctness (Priority: P1)

**Goal**: YTD view shows data from January through last completed month (current year) or full year (past year).

**Independent Test**: Verify YTD for 2026 in April shows Jan-Mar data only.

- [x] T010 [US3] Verify YTD aggregation excludes current incomplete month — test in browser

**Checkpoint**: YTD for current year excludes current month; past year YTD shows full year

---

## Phase 5: Polish & Cross-Cutting Concerns

- [x] T011 Remove unused `month-navigator.tsx` component if fully replaced in `frontend/src/components/cashflow/month-navigator.tsx`
- [x] T012 Verify edge case: switching periods rapidly doesn't cause stale data display (TanStack Query handles this via query key)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — backend changes first
- **User Story 1 (Phase 2)**: Depends on Phase 1 (backend must support period param)
- **User Story 2 (Phase 3)**: Depends on Phase 2 (need UI to test yearly)
- **User Story 3 (Phase 4)**: Depends on Phase 2 (need UI to test YTD)
- **Polish (Phase 5)**: Depends on all stories complete

### Parallel Opportunities

- T006, T007, T008 can run in parallel (different component files)
- US2 and US3 verification (T009, T010) can run in parallel after US1 is complete

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Phase 1: Backend period support
2. Complete Phase 2: Frontend period selector
3. **STOP and VALIDATE**: Test all three modes in browser
4. Verify US2 + US3 correctness
5. Polish and cleanup

**Total tasks**: 12
**Per story**: US1: 5 tasks, US2: 1 task, US3: 1 task, Foundational: 3, Polish: 2
