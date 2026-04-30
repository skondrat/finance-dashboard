# Quickstart: Budget Month Clear & Import Currency Selector

**Feature**: 076-budget-clear-import-currency
**Date**: 2026-04-30

## Dev Environment

```bash
# Backend (from backend/ directory)
uv run uvicorn app.main:app --reload --port 8000

# Frontend (from frontend/ directory)
npm run dev
```

## Files to Modify

### Backend

| File | Change |
|------|--------|
| `backend/app/api/import_.py` | Add `POST /budget/debug/reset-month` endpoint; add `currency` Form param to upload endpoint |
| `backend/app/services/import_service.py` | No changes needed — already accepts `currency` param |

### Frontend

| File | Change |
|------|--------|
| `frontend/src/components/budget/debug-menu.tsx` | Add `month`/`year` props; add "Clear current month data" menu item with confirmation |
| `frontend/src/app/(dashboard)/budget/page.tsx` | Pass `month`/`year` props to DebugMenu |
| `frontend/src/components/budget/import-modal.tsx` | Add currency selector state and UI |
| `frontend/src/lib/queries/budget.ts` | Add `currency` to UploadParams and FormData in both upload mutations |

## Testing

1. Navigate to Budget page, select a month with transactions
2. Open Debug menu → "Clear current month data" → Confirm
3. Verify only that month's transactions are removed
4. Open Import modal → verify currency selector shows EUR/USD/UAH
5. Select UAH, import a statement → verify transactions have UAH currency
