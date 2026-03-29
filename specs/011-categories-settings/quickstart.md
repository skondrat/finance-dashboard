# Quickstart: Categories Settings Page

**Branch**: `011-categories-settings` | **Date**: 2026-03-29

## Overview

Move category management out of the import flow into a dedicated Categories page accessible from the Budget page. Add a settings gear icon dropdown and an "Init Categories" empty state.

## Files to Create

1. `frontend/src/app/(dashboard)/budget/categories/page.tsx` — Categories page (init + manage modes)
2. `frontend/src/components/budget/settings-menu.tsx` — Gear icon dropdown component

## Files to Modify

1. `frontend/src/app/(dashboard)/budget/page.tsx` — Add settings gear, Init Categories empty state, conditional Import visibility
2. `frontend/src/components/budget/import-modal.tsx` — Remove InitCategories component and init flow logic
3. `backend/app/api/categories.py` — Add `ensure-required` endpoint

## Files Unchanged

- `backend/app/models/category.py` — No schema changes
- `backend/app/services/seed_service.py` — CSV parsing reused as-is
- `backend/app/services/categorization_service.py` — ATM Withdrawal auto-creation during import unchanged
- All other backend services and endpoints

## Key Technical Decisions

- **No database migration** — Category model unchanged; immutability determined by name
- **Immediate API calls** — Each add/remove/edit hits the API immediately (existing pattern)
- **Save = ensure-required + navigate** — Save button calls ensure-required endpoint, then `router.push('/budget')`
- **CSV upload only in init mode** — When categories exist, only manual add/remove/edit available
- **Immutable categories** — "Other" and "ATM Withdrawal" determined by name check on frontend

## Dev Commands

```bash
# Backend
cd backend && python -m pytest tests/
cd backend && ruff check .

# Frontend
cd frontend && npm run dev
```
