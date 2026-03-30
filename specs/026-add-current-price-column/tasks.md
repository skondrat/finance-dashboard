# Tasks: Add Current Price Column

**Input**: Design documents from `/specs/026-add-current-price-column/`
**Prerequisites**: plan.md, spec.md

**Tests**: Manual browser testing via Playwright MCP.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: User Story 1 - Current Price Column (Priority: P1) 🎯 MVP

**Goal**: Add a "Current" column to the positions table showing current price per unit.

**Independent Test**: Navigate to /portfolio and verify each position row shows the current price between Buy In and Position columns.

### Implementation

- [x] T001 [US1] Add "Current" column header and sort key between "Buy In" and "Position" in frontend/src/components/portfolio/positions-list.tsx
- [x] T002 [US1] Render current_price value in each position row (formatted as currency, show "—" if zero) in frontend/src/components/portfolio/positions-list.tsx
- [x] T003 Verify in browser via Playwright MCP that the Current column displays correctly with proper sorting

**Checkpoint**: Positions table shows 6 columns: Asset, Buy In, Current, Position, P/L, Weight

---

## Dependencies & Execution Order

- T001 → T002 → T003 (sequential, same file)

## Notes

- Total tasks: 3
- Single file change: `frontend/src/components/portfolio/positions-list.tsx`
