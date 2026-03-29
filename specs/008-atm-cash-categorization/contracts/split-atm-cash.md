# API Contract: Split ATM Cash

## POST /budget/import/{import_id}/split-atm-cash

Parse user's free-text cash spending notes via LLM and return structured split items matched to existing categories.

### Request

```json
{
  "row_index": 5,
  "notes": "200 cosmetics, 50 taxi"
}
```

| Field     | Type   | Required | Description                              |
|-----------|--------|----------|------------------------------------------|
| row_index | int    | yes      | Index of ATM Withdrawal row in preview   |
| notes     | string | yes      | Free-text spending notes with amounts    |

### Response (200)

```json
{
  "items": [
    {
      "description": "cosmetics",
      "amount": "200.00",
      "category_id": "cat-abc-123",
      "category_name": "Cosmetics & Beauty"
    },
    {
      "description": "taxi",
      "amount": "50.00",
      "category_id": "cat-def-456",
      "category_name": "Transportation"
    }
  ],
  "remainder": "50.00"
}
```

| Field              | Type          | Description                              |
|--------------------|---------------|------------------------------------------|
| items              | array         | Parsed expense items                     |
| items[].description| string        | User's note text for this expense        |
| items[].amount     | string        | Decimal amount as string                 |
| items[].category_id| string\|null  | Matched category ID or null              |
| items[].category_name| string\|null| Matched category name or null            |
| remainder          | string        | Unaccounted amount (original - sum)      |

### Error Responses

| Status | Condition                                    |
|--------|----------------------------------------------|
| 400    | Notes contain no numeric amounts             |
| 400    | Parsed amounts exceed ATM withdrawal amount  |
| 400    | Row is not an ATM Withdrawal                 |
| 404    | Import not found or not in preview status    |
| 502    | LLM call failed or timed out                |

---

## POST /budget/import/{import_id}/confirm (Extended)

Existing confirm endpoint extended with optional `splits` field.

### Request (extended)

```json
{
  "category_overrides": [
    { "row_index": 0, "category_id": "cat-123" }
  ],
  "splits": [
    {
      "row_index": 5,
      "items": [
        { "description": "cosmetics", "amount": "200.00", "category_id": "cat-abc-123" },
        { "description": "taxi", "amount": "50.00", "category_id": "cat-def-456" },
        { "description": "ATM withdrawal (Optica Mutualista)", "amount": "50.00", "category_id": "cat-atm-789" }
      ]
    }
  ]
}
```

| Field                     | Type         | Required | Description                           |
|---------------------------|--------------|----------|---------------------------------------|
| splits                    | array\|null  | no       | ATM cash splits to apply              |
| splits[].row_index        | int          | yes      | Original ATM row index                |
| splits[].items            | array        | yes      | Split items (must sum to original)    |
| splits[].items[].description | string    | yes      | Expense description                   |
| splits[].items[].amount   | string       | yes      | Expense amount                        |
| splits[].items[].category_id | string\|null | no    | Category ID (user-overridden or LLM)  |

### Response

Same as existing confirm response — no changes.
