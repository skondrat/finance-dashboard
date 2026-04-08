# Quickstart: Budget Spend Treemap

## Prerequisites

- Node.js installed
- Backend running (`cd backend && uvicorn app.main:app --reload`)
- Frontend running (`cd frontend && npm run dev`)
- Budget page has spending data for at least 2 months

## Development

### Start servers

```bash
cd backend && uvicorn app.main:app --reload --port 8000
cd frontend && npm run dev
```

### Key files to modify

1. **New component**: `frontend/src/components/budget/charts/spend-treemap.tsx`
   - Treemap chart with comparison selector
   - Uses Recharts `Treemap` + `ResponsiveContainer`
   - Custom rectangle content renderer for labels
   - Custom tooltip for hover details
   - Dynamic green-to-red color gradient

2. **Modify wrapper**: `frontend/src/components/budget/spending-charts.tsx`
   - Import and render `SpendTreemap` below existing charts
   - Conditionally show only when `period === "monthly"`
   - Pass through `onCategoryClick`, `month`, `year` props

### Verify

1. Navigate to Budget page → select monthly period
2. Treemap should appear below IncomeVsSpend chart
3. Rectangles sized by spending, colored by change vs previous month
4. Change comparison selector → colors update
5. Select "Budget" → colors compare against monthly budgets
6. Click a rectangle → transaction list filters to that category
7. Hover → tooltip shows full details
