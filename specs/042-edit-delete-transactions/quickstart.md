# Quickstart: Edit and Delete Budget Transactions

## Changes Overview

4 files modified, 0 new files, 0 migrations.

## Backend (2 files)

1. **`backend/app/schemas/budget.py`** — Add `amount: Optional[FloatDecimal] = None` to `BudgetTransactionUpdate`
2. **`backend/app/api/budget.py`** — No changes needed (generic PATCH handler already applies all schema fields)

## Frontend (2 files)

1. **`frontend/src/lib/queries/budget.ts`** — Add `useDeleteBudgetTransaction()` mutation hook + add `amount` to update mutation type
2. **`frontend/src/components/budget/transaction-list.tsx`** — Add trash button, pencil/edit button for amount, inline edit input, confirm dialog

## Testing

1. Start backend: `cd backend && uv run uvicorn app.main:app --reload --port 8000`
2. Start frontend: `cd frontend && npm run dev`
3. Navigate to Budget page, select a month with transactions
4. Verify: trash button visible on each row, click → confirm → transaction removed
5. Verify: pencil icon next to amount, click → edit → Enter → amount saved
6. Verify: KPIs, charts, and category table update after edit/delete
