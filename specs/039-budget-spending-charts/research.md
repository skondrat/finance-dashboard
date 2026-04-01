# Research: Budget Spending Trend Charts

## Existing Infrastructure

### Backend Endpoints (all ready, no changes needed)

1. **`GET /budget/charts/category-distribution`** — Returns `{total_spend, categories: [{category_id, category_name, color, amount, pct}]}`. Supports `period`, `month`, `year`, `currency` params. Pre-sorted by amount descending. Includes category colors.

2. **`GET /budget/charts/income-vs-spend`** — Returns `IncomeVsSpendPoint[]` with `{month, income, spend}`. Supports `months` param (default 12). Monthly data points with `YYYY-MM` labels.

3. **`GET /budget/charts/savings-over-time`** — Returns `SavingsPoint[]` with `{month, savings, cumulative}`.

### Frontend Query Hooks (already exist)

- `useCategoryDistribution()` in `frontend/src/lib/queries/budget-charts.ts`
- `useIncomeVsSpend()` in same file
- Both include currency from the currency store

### Existing Donut Pattern

From `networth-composition.tsx`:
- Uses `PieChart` with `Pie` (innerRadius="60%", outerRadius="80%")
- `Cell` elements for per-segment colors
- Custom tooltip with `formatCurrency`
- `ResponsiveContainer` for sizing
- Groups small segments (<2%) into "Other"

### Category Table Colors

The category table (`category-table.tsx` line 94) already uses `item.category.color` for the dots — colors are already correct. No change needed for US3.

## Decisions

### Donut Chart

- **Decision**: Reuse the PieChart/Pie/Cell pattern from networth-composition.tsx
- **Data source**: `useCategoryDistribution()` hook — already returns colors per category
- **Props**: Receive period/month/year from parent to match the date selector

### Bar Chart

- **Decision**: Use Recharts `BarChart` with grouped bars
- **Data source**: `useIncomeVsSpend()` hook — returns monthly income/spend; calculate savings as `income - spend`
- **Colors**: Blue (#3B82F6) for Savings, Red (#EF4444) for Spendings, Gold (#EAB308) for Income
- **X-axis**: Show all 12 months (Jan-Dec), only months with data have bars

### Layout

- Both charts go in the right sidebar where the "Spending Trends" placeholder is
- Donut on top, bar chart below
- No new backend endpoints needed
