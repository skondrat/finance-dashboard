# Quickstart: Parallel Categorization with Import Progress

**Feature**: 004-parallel-categorization-progress
**Date**: 2026-03-28

## Prerequisites

- Python 3.11+ with backend virtualenv active
- Anthropic API key in `backend/.env`
- Backend running: `cd backend && uvicorn app.main:app --reload --port 8000`
- Frontend running: `cd frontend && npm run dev`

## What Changes

| File | Change |
|------|--------|
| `backend/app/services/llm_service.py` | Add async client + `suggest_category_async()` |
| `backend/app/services/categorization_service.py` | Add `categorize_transactions_batch_async()` with semaphore |
| `backend/app/api/import_.py` | Change upload endpoint to return SSE stream |
| `frontend/src/components/budget/import-modal.tsx` | Add progress display UI |
| `frontend/src/lib/queries/budget.ts` | Add SSE consumption hook |

## How to Test

1. Navigate to `http://localhost:3000/budget`
2. Click "Import Statement"
3. Upload `data/monthly_statement_3_2026.pdf` with source "Payoneer"
4. Verify:
   - Progress indicator shows "Extracting transactions..."
   - Progress switches to "Categorizing: N / M transactions" with count updating
   - Progress shows "Preparing preview..."
   - Preview table appears with ~103 transactions and category suggestions
   - Total time: under 60 seconds (vs 5+ minutes before)

## Architecture

```
Frontend: POST /budget/import/upload
  ← SSE: {"stage": "extracting"}
  ← SSE: {"stage": "categorizing", "total": 103, "done": 0}
  ← SSE: {"stage": "categorizing", "total": 103, "done": 10}  (10 at a time)
  ← ...
  ← SSE: {"stage": "categorizing", "total": 103, "done": 103}
  ← SSE: {"stage": "saving"}
  ← SSE: {"stage": "complete", "result": {<ImportUploadResponse>}}
```
