# Quickstart: Transaction List View

## What This Feature Does

Adds a transaction list to the Budget tab so users can see individual transactions (date, description, amount, category) instead of just category summaries. Includes search by description and filter by category.

## How to Test

1. Start the backend: `cd backend && uvicorn app.main:app --reload`
2. Start the frontend: `cd frontend && npm run dev`
3. Open the Budget tab in the browser
4. Import some transactions if none exist
5. Scroll down to see the transaction list below the category table
6. Click a category row — the transaction list should filter to that category
7. Type in the search box to filter by description
8. Use the category dropdown to filter by category

## Key Files

| File | Role |
|------|------|
| `frontend/src/components/budget/transaction-list.tsx` | New transaction list component |
| `frontend/src/app/(dashboard)/budget/page.tsx` | Budget page — wires in the transaction list |
| `frontend/src/lib/queries/budget.ts` | Existing query hook for fetching transactions |
