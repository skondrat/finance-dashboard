# API Contracts: Categories Settings Page

**Branch**: `011-categories-settings` | **Date**: 2026-03-29

## New Endpoint

### POST /api/v1/budget/categories/ensure-required

Ensures "Other" and "ATM Withdrawal" categories exist for the authenticated user. Creates any that are missing. Idempotent.

**Request**: No body required.

**Response** (200):
```json
{
  "created": ["Other"]
}
```

`created` is an array of category names that were newly created. Empty array if both already existed.

**Response** (200, nothing created):
```json
{
  "created": []
}
```

**Error responses**: Standard auth errors (401, 403).

---

## Existing Endpoints Used (unchanged)

### GET /api/v1/budget/categories
Returns all non-archived categories for the user. Used to populate the Categories page list and determine if categories exist (empty state).

### POST /api/v1/budget/categories
Creates a single category. Used for manual category addition on the Categories page.

**Body**:
```json
{
  "name": "string",
  "color": "#hex (optional)",
  "monthly_budget": 0.00  // optional
}
```

### PATCH /api/v1/budget/categories/{category_id}
Updates category fields. Used for inline budget editing on the Categories page.

**Body**:
```json
{
  "monthly_budget": 500.00
}
```

### DELETE /api/v1/budget/categories/{category_id}
Deletes a category. Returns 409 if the category has associated transactions.

### POST /api/v1/budget/import/seed-categories
Uploads CSV to bulk-create categories. Used during init mode on the Categories page.

**Body**: multipart/form-data with CSV file.

### GET /api/v1/budget/import/categories
Returns categories formatted for import dropdowns. Used to check category existence on the Budget page.

---

## Frontend Routes

### New: /budget/categories
Dedicated Categories page. Full page (not a modal). Accessible via:
- "Init Categories" button on Budget page (when no categories)
- Settings gear dropdown → "Categories" (when categories exist)

Navigation: Save button navigates back to `/budget`.
