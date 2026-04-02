# Data Model: Edit and Delete Budget Transactions

## Existing Entity: BudgetTransaction

No schema changes required. The existing `budget_transactions` table already supports all needed fields.

| Field | Type | Notes |
|-------|------|-------|
| id | String (UUID) | Primary key |
| user_id | String (UUID) | Foreign key → users |
| date | Date | Transaction date |
| description | String(500) | Transaction description |
| amount | Decimal(12,2) | **Now editable via PATCH** (was read-only after import) |
| currency | String(3) | Currency code (not editable) |
| category_id | String(UUID) | Foreign key → categories (already editable) |
| is_investment | Boolean | Investment flag (already editable) |

## Schema Change: BudgetTransactionUpdate

Add `amount` field to the existing Pydantic update schema:

**Before**:
```
category_id: Optional[str]
description: Optional[str]
is_investment: Optional[bool]
```

**After**:
```
category_id: Optional[str]
description: Optional[str]
is_investment: Optional[bool]
amount: Optional[Decimal]        ← NEW
```

No database migration needed. No new tables. No new relationships.
