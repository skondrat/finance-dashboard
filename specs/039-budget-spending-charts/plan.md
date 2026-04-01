# Implementation Plan: Budget Spending Trend Charts

**Branch**: `039-budget-spending-charts` | **Date**: 2026-03-31 | **Spec**: [spec.md](spec.md)

## Summary

Replace the "Spending Trends" placeholder in the budget right sidebar with two charts: a donut chart (spend by category) and a grouped bar chart (monthly savings/income/spending). All backend endpoints already exist — this is frontend-only work. Recharts 3.8.1 is already installed with existing donut chart patterns to follow.

## Technical Context

**Language/Version**: TypeScript 5 (frontend only)
**Primary Dependencies**: Next.js 16, Recharts 3, TanStack Query
**Storage**: N/A (reads from existing endpoints)
**Testing**: Manual browser testing via Playwright MCP
**Target Platform**: Web application
**Project Type**: Frontend component work
**Constraints**: Must fit in the 4-col right sidebar layout

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| VI. Keep It Simple | ✅ Pass | Reuse existing donut pattern from networth-composition.tsx, existing backend endpoints |
| III. Always Test with Browser | ✅ Will do | Test after implementation |

## Project Structure

```text
frontend/
├── src/
│   ├── components/
│   │   └── budget/
│   │       └── spending-charts.tsx       # NEW: donut + bar chart component
│   └── app/
│       └── (dashboard)/
│           └── budget/
│               └── page.tsx              # Replace placeholder with SpendingCharts
```

### Existing Backend Endpoints (no changes needed)

- `GET /budget/charts/category-distribution` — donut data with colors
- `GET /budget/charts/income-vs-spend` — monthly bar chart data

### Existing Frontend Patterns to Reuse

- `networth-composition.tsx` — donut with PieChart, innerRadius, Cell colors, custom tooltip
- `allocation-donut.tsx` — donut with legend
