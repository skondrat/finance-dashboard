# Data Model: Categorization Quality Improvements

**Branch**: `007-categorization-quality` | **Date**: 2026-03-29

## Existing Entities (unchanged)

### Category
- `id`: string (PK)
- `user_id`: string (FK → users)
- `name`: string (unique per user)
- `color`: string (hex, default: "#4c4546")
- `monthly_budget`: decimal (optional)
- `is_archived`: boolean (default: false)
- `is_default`: boolean (default: false)
- `merged_into_id`: string (optional, self-reference)

No schema changes. The "ATM Withdrawal" category is created as a normal `Category` row on-demand.

### AutoCatRule
- `id`: string (PK)
- `category_id`: string (FK → categories)
- `keyword`: string

No schema changes. The ATM withdrawal rule is hardcoded in service logic, not stored as an `AutoCatRule`.

### BudgetTransaction
No schema changes.

### StatementImport
No schema changes.

## New Concepts (no DB changes)

### Built-in Rules (in-code only)
Hardcoded prefix-match rules in `categorization_service.py`:
- **ATM Withdrawal**: description starts with "atm withdrawal" (case-insensitive) → maps to "ATM Withdrawal" category

### Transfer Exclusion Filter (in-code only)
Applied in `import_service.create_import()`:
- **Transfer between balances**: description starts with "transfer between balances" (case-insensitive) → row excluded from preview and not saved

### Harmonization (in-code only)
Post-processing step after AI batch categorization:
- Groups results by `description.lower().strip()`
- For groups with mixed AI-sourced categories: majority vote, first-occurrence tiebreak
- Only modifies entries with `category_source == "ai"`

## API Response Changes

### ImportUploadResponse (updated)
New field:
- `excluded_count`: int (default: 0) — number of transactions excluded as internal transfers

No other response schema changes. Frontend uses existing `category_name` field to detect "Other" for highlighting.
