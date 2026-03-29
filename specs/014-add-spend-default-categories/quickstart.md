# Quickstart: Add Spend & Default Categories

## Files to modify/create

1. **`frontend/src/components/budget/add-spend-modal.tsx`** — New modal component
2. **`frontend/src/app/(dashboard)/budget/page.tsx`** — Add "Add Spend" button next to Import Statement
3. **`backend/app/services/seed_service.py`** — Ensure Debt/Investments after seed import

## Manual test

1. Open budget page, verify "Add Spend" button appears next to "Import Statement"
2. Click "Add Spend", fill category/amount/description, submit
3. Verify expense appears in category table with updated totals
4. Reset data, upload seed CSV without Debt/Investments, verify they get auto-created
