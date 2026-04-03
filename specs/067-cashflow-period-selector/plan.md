# Implementation Plan: Cashflow Period Selector

**Branch**: `067-cashflow-period-selector` | **Date**: 2026-04-03 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/067-cashflow-period-selector/spec.md`

## Summary

Add a period selector (Monthly / Yearly / YTD) to the Cashflow tab. The backend `/cashflow/sankey` endpoint gains a `period` query parameter that controls the date range for income and expense aggregation. The frontend replaces the arrow-based month navigator with a segmented control (matching the budget tab's `TimeAggregation` style) that conditionally shows month/year selectors based on the active period.

## Technical Context

**Language/Version**: Python 3.11 (backend), TypeScript 5 (frontend)  
**Primary Dependencies**: FastAPI, SQLAlchemy 2.0 (backend); Next.js 16, TanStack Query v5, Zustand (frontend)  
**Storage**: SQLite via SQLAlchemy (existing `income_sources`, `budget_transactions`, `categories` tables — no schema changes)  
**Testing**: Browser-based manual testing via Playwright MCP  
**Target Platform**: Web application (desktop browser)  
**Project Type**: Web application (backend API + frontend SPA)  
**Performance Goals**: Period switch renders updated data within 2 seconds  
**Constraints**: Yearly/YTD queries aggregate more data but should remain responsive  
**Scale/Scope**: Single endpoint change + 3 frontend component updates

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| Start from latest main | PASS | Branch created from up-to-date main |
| One branch per feature | PASS | 067-cashflow-period-selector |
| Keep it simple | PASS | No new tables, no over-engineering — extends existing endpoint and reuses existing UI patterns |
| Skip unnecessary artifacts | PASS | No data-model.md needed (no schema changes), contracts/ for the API change only |

## Project Structure

### Documentation (this feature)

```text
specs/067-cashflow-period-selector/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── contracts/           # Phase 1 output (API contract)
└── tasks.md             # Phase 2 output (from /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── app/
│   └── api/
│       └── cashflow.py          # Modified: add period param, date range logic

frontend/
├── src/
│   ├── app/(dashboard)/cashflow/
│   │   └── page.tsx             # Modified: add period state, replace MonthNavigator
│   ├── components/cashflow/
│   │   ├── month-navigator.tsx  # Removed or replaced
│   │   ├── kpi-strip.tsx        # Modified: accept period param
│   │   ├── sankey-diagram.tsx   # Modified: accept period param
│   │   └── breakdown-row.tsx    # Modified: accept period param
│   └── lib/queries/
│       └── cashflow.ts          # Modified: pass period to API
```

**Structure Decision**: Standard web app layout (backend/ + frontend/). All changes are modifications to existing files — no new files needed except possibly a period-selector component extracted from the page.
