# API Contract: Import Upload Response

## POST /api/v1/budget/import/upload

### Response (JSON for non-PDF, SSE `complete` event for PDF)

```json
{
  "id": "string",
  "status": "preview",
  "file_name": "string",
  "source": "string | null",
  "row_count": 7,
  "duplicate_count": 0,
  "skipped_count": 0,
  "excluded_count": 3,
  "rows": [
    {
      "date": "2026-03-15",
      "description": "ATM withdrawal (Optica Mutualista)",
      "amount": -500.00,
      "currency": "EUR",
      "type": "debit",
      "category_id": "uuid",
      "category_name": "ATM Withdrawal",
      "category_source": "rule",
      "category_guess": "ATM Withdrawal"
    }
  ]
}
```

### Changes from current contract

| Field            | Before  | After                                      |
|------------------|---------|---------------------------------------------|
| `excluded_count` | absent  | `int` (default: 0) — internal transfers excluded |

### Excluded transactions

Transactions whose description starts with "transfer between balances" (case-insensitive) are **not included** in the `rows` array. The `excluded_count` field indicates how many were filtered out. These transactions are never persisted.

### ATM Withdrawal categorization

Transactions whose description starts with "atm withdrawal" (case-insensitive) receive:
- `category_source`: `"rule"`
- `category_name`: `"ATM Withdrawal"`
- The "ATM Withdrawal" category is auto-created if it doesn't exist for the user.

### Harmonization

After AI categorization, identical descriptions are harmonized:
- All transactions with the same description get the same category
- Majority vote determines the category; first-occurrence breaks ties
- Only `category_source: "ai"` entries are subject to harmonization
