# Data Model: Budget Month Clear & Import Currency Selector

**Feature**: 076-budget-clear-import-currency
**Date**: 2026-04-30

## Schema Changes

**No schema changes required.** Both features operate on the existing `BudgetTransaction` model.

## Existing Entities Used

### BudgetTransaction

| Field       | Type         | Notes                                           |
|-------------|-------------|------------------------------------------------|
| id          | str (UUID)  | Primary key                                     |
| user_id     | str         | FK to users                                     |
| import_id   | str / null  | FK to statement_imports                          |
| category_id | str / null  | FK to categories                                |
| date        | date        | Transaction date — used for month filtering     |
| description | str         | Max 500 chars                                   |
| amount      | Decimal     | 12,2 precision                                  |
| currency    | str         | Max 3 chars (e.g., "EUR", "USD", "UAH")         |
| reference   | str / null  | Max 200 chars                                   |
| is_investment | bool      | Default false                                   |
| dedup_hash  | str         | 64 chars, duplicate detection                   |
| created_at  | datetime    | UTC, auto-set                                   |

**Relevant indexes**:
- `ix_budget_transactions_user_date` on `(user_id, date)` — enables efficient month-range queries for Feature 1
- `ix_budget_transactions_dedup_hash` on `(dedup_hash)` — existing dedup support

## Feature 1: Month Clear

Deletes rows from `budget_transactions` where:
- `user_id` matches the current user
- `date` falls within the target month (first day of month <= date <= last day of month)

No cascading effects. Categories, imports, and auto-categorization rules are preserved.

## Feature 2: Import Currency

The `currency` field on `BudgetTransaction` is already populated during import. Currently defaults to `"EUR"` when no currency is provided. The change passes the user-selected currency from the frontend through the upload endpoint to `create_import()`, which uses it as the default for `row.get("currency", currency)`.
