# API Contracts: Edit Init Categories

## Existing Endpoint (no changes)

### PATCH /budget/categories/{category_id}

Update a category's fields. Already exists — used for inline budget editing.

**Request**:
```json
{
  "monthly_budget": 250.00
}
```

To clear budget:
```json
{
  "monthly_budget": null
}
```

**Response** (200):
```json
{
  "id": "uuid",
  "name": "Groceries",
  "color": "#4c4546",
  "monthly_budget": 250.00
}
```

**Errors**: 404 if category not found or doesn't belong to user.

---

## New Endpoint

### DELETE /budget/categories/{category_id}

Delete a category. Only succeeds if the category has no associated transactions.

**Request**: No body.

**Response** (204): No content.

**Errors**:
- 404: Category not found or doesn't belong to user.
- 409: Category has associated transactions and cannot be deleted. Response body:
  ```json
  {
    "detail": "Category has transactions and cannot be deleted"
  }
  ```
