# Quickstart: Init Categories Flow

## Overview

Enhances the Import Statement modal to show a dedicated "Init Categories" step when the user has no categories. Users upload a CSV (with optional Budget column) and/or manually add categories before proceeding to their first statement import.

## Files to Modify

### Backend
- `backend/app/services/seed_service.py` — Add `Budget` column parsing to `parse_seed_csv()`, pass `monthly_budget` to Category creation in `load_seed_categories()`
- `backend/app/schemas/budget.py` — Add `budgets_loaded` field to `SeedCategoriesResponse`

### Frontend
- `frontend/src/components/budget/import-modal.tsx` — Replace existing seed upload UI with full Init Categories step (CSV upload + manual add form + category list + Continue to Import button)
- `frontend/src/lib/queries/budget.ts` — Update `useSeedCategoriesUpload` response type to include `budgets_loaded`

### Test Data
- `data/init_categories.csv` — New file with Categories, Examples, and Budget columns for manual testing

## Implementation Order

1. **Backend**: Extend `parse_seed_csv` to handle `Budget` column → update `load_seed_categories` to set `monthly_budget` → update response schema
2. **Test data**: Create `data/init_categories.csv` with budget amounts
3. **Frontend**: Build Init Categories step in import modal (CSV upload → category list with budgets → manual add form → Continue to Import button)
4. **Manual test**: Clean DB, test with browser MCP

## Key Design Decisions

- No new endpoints needed — reuses existing seed-categories upload and category CRUD
- No database schema changes — `monthly_budget` field already exists on Category model
- Init screen is a new modal step within ImportModal, not a separate page
- "Continue to Import" requires at least 1 category to be enabled
