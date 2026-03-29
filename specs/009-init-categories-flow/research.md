# Research: Init Categories Flow

**Date**: 2026-03-29

## R-001: Extending Seed CSV to Support Budget Column

**Decision**: Add optional `Budget` column to the existing seed CSV parser in `seed_service.py`.

**Rationale**: The `Category` model already has a `monthly_budget: Decimal(12,2)` nullable field. The `CategoryCreate` schema already accepts `monthly_budget`. The only gap is the CSV parser (`parse_seed_csv`) which currently only handles `Categories` and `Examples` columns. Adding a third optional column is minimal effort and consistent with the existing pattern.

**Alternatives considered**:
- Separate endpoint for budget import: Rejected — adds unnecessary API surface. Budget is a property of a category, not a separate entity.
- JSON upload instead of CSV: Rejected — CSV is already established and simpler for users.

## R-002: Init Flow Placement in UI

**Decision**: The Init Categories screen replaces the import dropzone within the existing Import Statement modal. It is triggered when `categories.length === 0`.

**Rationale**: The frontend already has partial infrastructure for this — `useImportCategories()` fetches categories and the import modal already contains a `SeedCategoriesUpload` component. The Init flow enhances this existing pattern into a dedicated step rather than a small "seed upload" link.

**Alternatives considered**:
- Separate page for Init: Rejected — overkill for a one-time flow. Modal is sufficient.
- Init button on Budget page itself: Rejected — "Import Statement" is the natural entry point and already has the modal infrastructure.

## R-003: Manual Category Addition During Init

**Decision**: Use the existing `POST /api/v1/budget/categories` endpoint with `CategoryCreate` schema (supports `name`, `color`, `monthly_budget`). Frontend adds an inline form in the Init screen.

**Rationale**: The create category endpoint already exists and supports all needed fields. No backend changes needed for manual addition — only frontend UI work within the Init modal step.

**Alternatives considered**:
- Batch manual creation endpoint: Rejected — individual creation is fine for the expected volume (5-30 categories) and allows real-time validation feedback.

## R-004: Test Data Preparation

**Decision**: Create `data/init_categories.csv` with existing categories from the database, including the new `Budget` column. Provide a script/instructions to clean up DB (delete transactions and categories) and clear `category_mappings.md` for manual retesting.

**Rationale**: User explicitly requested this for manual browser MCP testing. The cleanup enables testing the "no categories" state.

**Alternatives considered**:
- Automated test suite: Out of scope for this feature — user wants manual browser testing via Playwright MCP.
