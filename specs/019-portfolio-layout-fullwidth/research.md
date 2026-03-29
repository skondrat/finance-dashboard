# Research: Portfolio Layout — Full-Width KPI Strip

**Feature**: 019-portfolio-layout-fullwidth
**Date**: 2026-03-29

## Current Layout Analysis

The portfolio page uses a 12-column CSS grid (`grid grid-cols-12 gap-6`) with two child containers:

1. **Main content** (`col-span-12 lg:col-span-8`): KpiStrip, PerformanceChart, PositionsList, TransactionsView
2. **Sidebar** (`col-span-12 lg:col-span-4`): Accounts box, AllocationDonut, PerformanceBreakdown

On desktop (>=1024px), the KPI strip is constrained to 8/12 of the page width because it lives inside the main content column alongside the Accounts box in the sidebar.

## Approach Decision

**Decision**: Extract `<KpiStrip />` from the 8-column div and place it as a direct child of the 12-column grid with `col-span-12`, above both the main content and sidebar columns.

**Rationale**: This is the minimal change — one element moves up one level in the DOM. The KPI strip already handles its own internal responsive grid (`grid-cols-2 md:grid-cols-3 lg:grid-cols-6`), so it will naturally fill whatever container width it's given. No changes to the KpiStrip component itself.

**Alternatives considered**:
- *Restructure to nested grids*: Adds unnecessary complexity for a single reflow
- *Use CSS subgrid*: Browser support still limited, overkill for this change
- *Move Accounts into main column*: Would change the visual hierarchy — user specifically wants it in the sidebar area, just lower

## Layout After Change

```
┌─────────────────────────────────────────────┐
│ KpiStrip (col-span-12)                      │
├─────────────────────────────┬───────────────┤
│ Main content (lg:col-span-8)│ Sidebar       │
│ - PerformanceChart          │ (lg:col-span-4│
│ - PositionsList             │ - Accounts    │
│ - TransactionsView          │ - Allocation  │
│                             │ - Performance │
└─────────────────────────────┴───────────────┘
```

## Mobile/Tablet Impact

None. At breakpoints below `lg` (1024px), all elements already use `col-span-12` and stack vertically. Moving KpiStrip to be a sibling rather than a child of the main column has no effect on stacking order — it already appears first.
