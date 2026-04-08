# Implementation Plan: Budget Spend Treemap

**Branch**: `075-budget-spend-treemap` | **Date**: 2026-04-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/075-budget-spend-treemap/spec.md`

## Summary

Add a stock-market-style treemap chart to the Budget page's right column (below existing charts). Each rectangle represents a spending category — sized by absolute spend, colored green-to-red by percentage change vs a user-selectable baseline (another month or "Budget"). Uses Recharts Treemap (already installed). Frontend-only — reuses existing `spend-by-category` endpoint called twice (current month + comparison month).

## Technical Context

**Language/Version**: TypeScript 5 (frontend only)
**Primary Dependencies**: Next.js 16, Recharts 3.8.1 (Treemap component), TanStack Query v5, Zustand, Tailwind CSS v4
**Storage**: N/A (reads from existing backend API)
**Testing**: Manual browser testing via Playwright MCP
**Target Platform**: Web (desktop + responsive)
**Project Type**: Web application (frontend only)
**Performance Goals**: Treemap renders within 2 seconds, consistent with existing charts
**Constraints**: Must fit within existing 4-column right sidebar layout
**Scale/Scope**: Up to ~30 spending categories per month

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Feature Delivery Workflow | PASS | Following full pipeline |
| II. Combine Small Features | N/A | Single feature |
| III. Always Test with Browser | WILL DO | Playwright MCP after implementation |
| IV. Ideas Tracking | WILL DO | Update ideas.md after merge |
| V. Git Hygiene | PASS | Branch created from main |
| VI. Keep It Simple | PASS | Frontend-only, no unnecessary backend artifacts, reuses existing endpoint |

## Project Structure

### Documentation (this feature)

```text
specs/075-budget-spend-treemap/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── spec.md              # Feature specification
├── data-model.md        # Phase 1 output (frontend data shapes)
├── quickstart.md        # Phase 1 output
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── components/budget/
│   │   ├── spending-charts.tsx          # MODIFY — add SpendTreemap below existing charts
│   │   └── charts/
│   │       └── spend-treemap.tsx        # NEW — treemap chart component
│   └── lib/
│       └── queries/
│           └── budget.ts                # EXISTING — reuse useSpendByCategory hook
```

**Structure Decision**: Single new component file + minor modification to the SpendingCharts wrapper. No backend changes needed — the existing `GET /budget/spend-by-category` endpoint returns all required data (spent, budget, category color, monthly_budget). The treemap calls this endpoint twice: once for the selected month, once for the comparison month. For "Budget" comparison mode, only one call is needed (budget data is included in the response).
