# Quickstart: Categorization Quality Improvements

**Branch**: `007-categorization-quality`

## What this feature does

Four improvements to how transactions are categorized during import:

1. **Exclude internal transfers** — "Transfer between balances" transactions are filtered out before preview
2. **ATM Withdrawal category** — Auto-categorized via built-in prefix rule, no AI needed
3. **Harmonize AI results** — Identical descriptions get the same category (majority vote)
4. **Flag "Other"** — Amber highlight on "Other"-categorized rows in import preview

## Files to modify

### Backend
- `backend/app/services/import_service.py` — Add transfer exclusion filter + `excluded_count`
- `backend/app/services/categorization_service.py` — Add ATM withdrawal built-in rule + harmonization post-processing
- `backend/app/schemas/budget.py` — Add `excluded_count` to `ImportUploadResponse`

### Frontend
- `frontend/src/components/budget/import-modal.tsx` — "Other" row highlighting + excluded count display
- `frontend/src/lib/queries/budget.ts` — Add `excluded_count` to `ImportResponse` type

### Data
- `data/categories.csv` — Add "ATM Withdrawal" to seed categories

## How to test

1. Import a PDF with "Transfer between balances" transactions → verify they don't appear in preview, `excluded_count` shown
2. Import a PDF with "ATM withdrawal (…)" transactions → verify auto-categorized as "ATM Withdrawal" with "rule" badge
3. Import a PDF with repeated descriptions → verify all get the same AI category
4. Import a PDF where some transactions get "Other" → verify amber highlighting in preview
