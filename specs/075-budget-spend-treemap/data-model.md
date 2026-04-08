# Data Model: Budget Spend Treemap

No new backend models or database changes required. This feature is frontend-only.

## Frontend Data Shapes

### Existing: SpendByCategoryItem (reused as-is)

Source: `frontend/src/lib/queries/budget.ts`

```typescript
interface SpendByCategoryItem {
  category: {
    id: string;
    name: string;
    color: string;
    monthly_budget: number | null;
    is_archived: boolean;
    is_default: boolean;
  };
  budget: number | null;
  spent: number;
  remaining: number | null;
  pct_of_total: number;
}
```

### New: TreemapDataItem (derived in component)

Computed from two `SpendByCategoryItem[]` responses (current month + comparison month/budget):

```typescript
interface TreemapDataItem {
  name: string;            // category.name
  categoryId: string;      // category.id
  value: number;           // current month spent (absolute, for rectangle sizing)
  pctChange: number | null; // percentage change vs baseline (null = no baseline)
  currentSpent: number;    // current month spending
  baselineValue: number | null; // comparison month spent OR budget amount
  baselineLabel: string;   // e.g., "Feb 2026" or "Budget"
  color: string;           // computed green/gray/red based on pctChange
}
```

### Comparison Baseline Type

```typescript
type ComparisonBaseline =
  | { type: "month"; month: number; year: number }
  | { type: "budget" };
```

## Data Flow

1. Budget page provides `month`, `year`, `period` to SpendingCharts
2. SpendTreemap calls `useSpendByCategory(period, month, year)` for current month
3. If baseline is a month: calls `useSpendByCategory("monthly", baselineMonth, baselineYear)` for comparison month
4. If baseline is "Budget": uses `budget` field from current month response (no extra call)
5. Component merges both datasets by category name, computes `pctChange` and `color`
6. Recharts Treemap renders with `value` for sizing and computed `color` for fill
