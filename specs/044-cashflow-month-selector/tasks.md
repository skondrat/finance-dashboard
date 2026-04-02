# Tasks: Cashflow Month Selector

**Input**: Design documents from `/specs/044-cashflow-month-selector/`
**Prerequisites**: plan.md, spec.md, research.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

---

## Phase 1: Foundational (Backend + Query Hook)

**Purpose**: Backend parameterization and query hook update — required before any frontend story

- [x] T001 Add optional `year` and `month` query params to `get_cashflow_sankey` in backend/app/api/cashflow.py
- [x] T002 Update `useCashflowSankey` hook to accept and pass `year`/`month` params in frontend/src/lib/queries/cashflow.ts

**Checkpoint**: Backend accepts month/year params, query hook passes them through

---

## Phase 2: User Story 1 & 2 - Month Navigation with Default (Priority: P1)

**Goal**: User can navigate between months; page defaults to last completed month

**Independent Test**: Open Cashflow page → verify default is last completed month → click left arrow → verify data updates to previous month

- [x] T003 [P] [US1] Create `MonthNavigator` component in frontend/src/components/cashflow/month-navigator.tsx with left/right arrows, month/year label, and disabled-forward logic
- [x] T004 [US1] Add month/year state to cashflow page, render `MonthNavigator`, pass year/month to all child components in frontend/src/app/(dashboard)/cashflow/page.tsx
- [x] T005 [P] [US1] Update `CashflowKpiStrip` to accept and use `year`/`month` props in frontend/src/components/cashflow/kpi-strip.tsx
- [x] T006 [P] [US1] Update `SankeyDiagram` to accept and use `year`/`month` props in frontend/src/components/cashflow/sankey-diagram.tsx
- [x] T007 [P] [US1] Update `BreakdownRow` to accept and use `year`/`month` props in frontend/src/components/cashflow/breakdown-row.tsx

**Checkpoint**: Full month navigation works — default month correct, arrows navigate, all sections update

---

## Phase 3: User Story 3 - Future Month Prevention (Priority: P2)

**Goal**: Right arrow disabled at last completed month

**Independent Test**: Navigate to last completed month → verify right arrow is visually disabled and non-clickable

- [x] T008 [US3] Verify forward arrow disable logic in MonthNavigator works at boundary (last completed month) — adjust if needed in frontend/src/components/cashflow/month-navigator.tsx

**Checkpoint**: Cannot navigate past last completed month

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1**: No dependencies — start immediately
- **Phase 2**: Depends on Phase 1 (T001, T002 must complete first)
- **Phase 3**: Depends on Phase 2 (T003 must exist)

### Parallel Opportunities

- T005, T006, T007 can all run in parallel (different files, same pattern)
- T003 can run in parallel with T005-T007 (different file)

---

## Implementation Strategy

1. T001 + T002 sequentially (backend then hook)
2. T003 + T005 + T006 + T007 in parallel (new component + update 3 existing)
3. T004 wires everything together
4. T008 validates boundary behavior
