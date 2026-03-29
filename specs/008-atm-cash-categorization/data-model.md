# Data Model: ATM Cash Expense Categorization

**Date**: 2026-03-29 | **Branch**: `008-atm-cash-categorization`

## No Database Schema Changes

This feature does not require new tables or columns. The split operates on existing `BudgetTransaction` rows at confirm time.

## Entities

### SplitAtmRequest (API input)

| Field     | Type   | Constraints                     |
|-----------|--------|---------------------------------|
| row_index | int    | Must reference valid ATM row    |
| notes     | str    | Must contain ≥1 numeric amount  |

### CashSplitItem (LLM output / API response)

| Field         | Type          | Description                              |
|---------------|---------------|------------------------------------------|
| description   | str           | User's note text (e.g., "cosmetics")     |
| amount        | Decimal       | Positive amount for this expense         |
| category_name | str \| null   | Matched category name or null            |
| category_id   | str \| null   | Matched category ID or null              |

### SplitAtmResponse (API output)

| Field     | Type              | Description                                  |
|-----------|-------------------|----------------------------------------------|
| items     | CashSplitItem[]   | Parsed expense items from notes              |
| remainder | Decimal           | Unaccounted amount (ATM amount - sum(items)) |

### SplitOverride (confirm input, per split)

| Field      | Type              | Description                                 |
|------------|-------------------|---------------------------------------------|
| row_index  | int               | Index of original ATM row in preview        |
| items      | SplitConfirmItem[]| Final split items with user's overrides     |

### SplitConfirmItem

| Field       | Type        | Description                          |
|-------------|-------------|--------------------------------------|
| description | str         | Expense description from notes       |
| amount      | Decimal     | Expense amount                       |
| category_id | str \| null | Category (possibly user-overridden)  |

## State Transitions

```
ATM Withdrawal row in preview
  │
  ├─ [Split Cash] → call LLM endpoint → split items displayed
  │   │
  │   ├─ [Override category] → update split item category locally
  │   ├─ [Undo Split] → restore original ATM row
  │   └─ [Confirm Import] → backend replaces ATM row with split transactions
  │
  └─ [Confirm Import without split] → ATM row persisted as-is
```

## Impact on Existing Models

- **BudgetTransaction**: No schema change. At confirm time, one ATM row may be deleted and replaced by N+1 rows (N split items + optional remainder).
- **ConfirmImportRequest**: Extended with optional `splits: list[SplitOverride]`.
- **StatementImport**: `row_count` updated after splits are applied during confirm.
