# API Contracts: Edit and Delete Budget Transactions

## PATCH /api/v1/budget/transactions/{transaction_id}

**Existing endpoint** — adding `amount` to accepted fields.

### Request

```json
{
  "amount": -42.50
}
```

All fields optional (partial update):
- `category_id`: string | null
- `description`: string
- `is_investment`: boolean
- `amount`: number ← NEW

### Response (200)

```json
{
  "id": "uuid",
  "date": "2026-02-22",
  "description": "Card charge BAKERY JOLIE JOI",
  "amount": -42.50,
  "currency": "USD",
  "category_id": "uuid",
  "is_investment": false,
  "reference": null
}
```

### Errors

- 404: Transaction not found or not owned by user
- 422: Validation error (invalid amount format)

---

## DELETE /api/v1/budget/transactions/{transaction_id}

**Existing endpoint** — no changes needed.

### Request

No body required.

### Response (204)

No content.

### Errors

- 404: Transaction not found or not owned by user
