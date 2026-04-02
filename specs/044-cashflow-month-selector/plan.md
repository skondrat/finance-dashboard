# Implementation Plan: Cashflow Month Selector

**Branch**: `044-cashflow-month-selector` | **Date**: 2026-04-02 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/044-cashflow-month-selector/spec.md`

## Summary

Add month/year selection to the Cashflow page. Currently hardcoded to "last completed month", the page needs left/right arrow navigation to browse any historical month. Backend adds optional year/month query params; frontend adds a month navigator component and passes selection to all child components.

## Technical Context

**Language/Version**: Python 3.11 (backend), TypeScript 5 (frontend)
**Primary Dependencies**: FastAPI (backend); Next.js 16, TanStack Query v5, d3-sankey (frontend)
**Storage**: SQLite via SQLAlchemy (no schema changes)
**Testing**: Manual browser testing via Playwright MCP
**Target Platform**: Web application
**Project Type**: Web service (backend) + SPA (frontend)
**Performance Goals**: Month switch renders in <2 seconds
**Constraints**: Cannot select current or future months
**Scale/Scope**: Single page, 1 backend endpoint change, 1 new component, 4 file modifications

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| Feature Delivery Workflow | PASS | Following specify→plan→tasks→implement pipeline |
| Keep It Simple | PASS | No unnecessary abstractions — simple arrow navigator, optional query params |
| Git Hygiene | PASS | Dedicated branch from main |
| Always Test with Browser | PLANNED | Will test with Playwright MCP after implementation |

## Project Structure

### Documentation (this feature)

```text
specs/044-cashflow-month-selector/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── spec.md              # Feature specification
├── quickstart.md        # Phase 1 output
├── checklists/          # Quality checklists
└── tasks.md             # Phase 2 output (from /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
└── app/
    └── api/
        └── cashflow.py          # Add year/month query params

frontend/
└── src/
    ├── app/(dashboard)/cashflow/
    │   └── page.tsx              # Add state management, pass month/year to children
    ├── components/cashflow/
    │   ├── month-navigator.tsx   # NEW — left/right arrow month selector
    │   ├── kpi-strip.tsx         # Accept month/year props
    │   ├── sankey-diagram.tsx    # Accept month/year props
    │   └── breakdown-row.tsx     # Accept month/year props
    └── lib/queries/
        └── cashflow.ts           # Add year/month params to hook
```

**Structure Decision**: Web application with backend/ and frontend/ separation (existing structure). One new component file, all other changes are modifications.

## Changes Summary

### Backend: `cashflow.py`
- Add optional `year: int` and `month: int` query parameters to `get_cashflow_sankey`
- Default to `_last_completed_month()` when not provided
- Pass params through to existing query logic (no other changes needed)

### Frontend: `cashflow.ts` (query hook)
- Add `year` and `month` parameters to `useCashflowSankey(year, month)`
- Include year/month in query key for per-month caching
- Pass year/month as URL query params to backend

### Frontend: `month-navigator.tsx` (new component)
- Simple component: `< March 2026 >`
- Left arrow always enabled, right arrow disabled at last completed month
- Calls `onPrevMonth` / `onNextMonth` callbacks
- Styled consistently with existing page (font-mono, surface colors)

### Frontend: `page.tsx`
- Add `useState` for year and month (default: last completed month)
- Compute `lastCompletedMonth` to limit forward navigation
- Render `MonthNavigator` at top
- Pass year/month to `CashflowKpiStrip`, `SankeyDiagram`, `BreakdownRow`

### Frontend: `kpi-strip.tsx`, `sankey-diagram.tsx`, `breakdown-row.tsx`
- Accept `year` and `month` props
- Pass to `useCashflowSankey(year, month)`
