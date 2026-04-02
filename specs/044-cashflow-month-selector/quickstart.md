# Quickstart: Cashflow Month Selector

## What Changed

Added month/year selection to the Cashflow page. Users can navigate between months using left/right arrows. Backend endpoint now accepts optional `year` and `month` query parameters.

## Backend

The `GET /api/v1/cashflow/sankey` endpoint now accepts:
- `year` (int, optional) — defaults to last completed month's year
- `month` (int, optional) — defaults to last completed month's month
- `currency` (str, optional) — unchanged, defaults to "EUR"

## Frontend

New `MonthNavigator` component at top of Cashflow page. All child components (KPI strip, Sankey diagram, breakdown row) receive and use the selected month/year for their data queries.

## Testing

1. Start backend: `cd backend && uvicorn app.main:app --reload`
2. Start frontend: `cd frontend && npm run dev`
3. Navigate to Cashflow page
4. Verify default month is last completed month
5. Click left arrow — page should show previous month's data
6. Click right arrow to return — should work until reaching last completed month
7. At last completed month, right arrow should be disabled
