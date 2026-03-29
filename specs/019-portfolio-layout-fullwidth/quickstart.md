# Quickstart: Portfolio Layout — Full-Width KPI Strip

**File to modify**: `frontend/src/app/(dashboard)/portfolio/page.tsx`

## Change

Move `<KpiStrip />` from inside the 8-column main content div to be a direct child of the 12-column grid, with `col-span-12`.

### Before

```tsx
<div className="grid grid-cols-12 gap-6">
  <div className="col-span-12 space-y-6 lg:col-span-8">
    <KpiStrip />              {/* ← constrained to 8 cols on desktop */}
    <PerformanceChart />
    ...
  </div>
  <div className="col-span-12 space-y-6 lg:col-span-4">
    <Accounts />              {/* sits alongside KPI strip */}
    ...
  </div>
</div>
```

### After

```tsx
<div className="grid grid-cols-12 gap-6">
  <KpiStrip className="col-span-12" />   {/* ← full width */}
  <div className="col-span-12 space-y-6 lg:col-span-8">
    <PerformanceChart />
    ...
  </div>
  <div className="col-span-12 space-y-6 lg:col-span-4">
    <Accounts />              {/* now starts below KPI strip */}
    ...
  </div>
</div>
```

**Note**: If `KpiStrip` doesn't accept a `className` prop, wrap it in a `<div className="col-span-12">` instead.

## Verification

1. Start frontend: `cd frontend && npm run dev`
2. Open Portfolio page at desktop width (>=1024px)
3. Confirm KPI cards span full width
4. Confirm Accounts section appears below KPI row, in the right sidebar
5. Resize to mobile — verify stacking order is unchanged
