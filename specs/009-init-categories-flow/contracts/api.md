# API Contracts: Init Categories Flow

## Modified Endpoints

### POST /api/v1/budget/import/seed-categories

**Change**: Response now includes `budgets_loaded` count. Backend now parses optional `Budget` CSV column.

**Request**: `multipart/form-data` with `file` field (CSV)

**CSV Format** (enhanced):
```csv
Categories,Examples,Budget
Rent,,1200
Groceries,Lidl | Aldi,400
```

**Response** (200 OK):
```json
{
  "categories_loaded": 15,
  "examples_loaded": 8,
  "budgets_loaded": 10
}
```

**Error** (400):
```json
{
  "detail": "Invalid CSV: ...",
  "error_type": "invalid_csv",
  "action": "Ensure CSV has a 'Categories' column."
}
```

## Existing Endpoints (No Changes)

### POST /api/v1/budget/categories

Already supports manual category creation with `monthly_budget`. Used as-is by the Init flow's manual add form.

**Request**:
```json
{
  "name": "Groceries",
  "color": "#4c4546",
  "monthly_budget": 400.00
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "name": "Groceries",
  "color": "#4c4546",
  "monthly_budget": 400.00,
  "is_archived": false,
  "is_default": false,
  "created_at": "2026-03-29T..."
}
```

### GET /api/v1/budget/categories

Already returns all non-archived categories. Used to detect "no categories" state and to list categories in Init screen.

**Response** (200 OK):
```json
[
  {
    "id": "uuid",
    "name": "Groceries",
    "color": "#4c4546",
    "monthly_budget": 400.00,
    "is_archived": false,
    "is_default": false,
    "created_at": "2026-03-29T..."
  }
]
```
