# Quickstart: ATM Cash Expense Categorization

## Prerequisites

- Python 3.11+ with `ANTHROPIC_API_KEY` set
- Backend running (`cd backend && uvicorn app.main:app --reload`)
- Frontend running (`cd frontend && npm run dev`)
- At least one imported statement with ATM Withdrawal transactions in preview state

## Development Order

1. **Backend LLM function** (`llm_service.py`) — parse_cash_notes
2. **Backend API endpoint** (`import_.py`) — POST /split-atm-cash
3. **Backend confirm extension** (`import_service.py`) — handle splits in confirm
4. **Backend schemas** (`budget.py`) — request/response models
5. **Frontend split UI** (`import-modal.tsx`) — button, text input, split display
6. **Frontend confirm integration** (`queries/budget.ts`) — send splits on confirm

## Key Files to Modify

| File | Change |
|------|--------|
| `backend/app/services/llm_service.py` | Add `parse_cash_notes()` function |
| `backend/app/api/import_.py` | Add split-atm-cash endpoint |
| `backend/app/services/import_service.py` | Extend confirm_import for splits |
| `backend/app/schemas/budget.py` | Add split request/response schemas |
| `frontend/src/components/budget/import-modal.tsx` | Add split UI |
| `frontend/src/lib/queries/budget.ts` | Add split mutation + types |

## Testing

```bash
# Backend
cd backend && python -m pytest

# Frontend
cd frontend && npm test

# Manual: Import a PDF statement, find ATM rows, click Split Cash, enter notes
```
