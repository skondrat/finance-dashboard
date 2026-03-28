# API Contracts: PDF Statement Import

**Feature**: 002-pdf-statement-import | **Date**: 2026-03-27

## Modified Endpoints

### POST /api/v1/budget/import/upload

**Change**: Add `source` form field for PDF uploads.

**Request** (multipart/form-data):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | File | Yes | PDF, CSV, OFX, or MT940 file |
| source | string | No | "payoneer", "monobank", "millenium", "other". Required when file is PDF. Ignored for non-PDF formats. |
| bank_profile_id | UUID | No | Existing field for CSV column mapping. Ignored for PDF. |

**Response** (202 Accepted):

```json
{
  "id": "uuid-string",
  "status": "preview",
  "file_name": "statement_march_2026.pdf",
  "source": "payoneer",
  "row_count": 47,
  "duplicate_count": 3,
  "rows": [
    {
      "date": "2026-03-01",
      "description": "Netflix Subscription",
      "amount": -15.99,
      "currency": "USD",
      "type": "debit",
      "category_id": "uuid-or-null",
      "category_name": "Entertainment",
      "category_source": "mapping"
    }
  ]
}
```

**New response fields per row**:

| Field | Type | Description |
|-------|------|-------------|
| currency | string | Currency code extracted from PDF |
| type | string | "debit" or "credit" |
| category_id | UUID or null | Matched category ID (null if uncategorized) |
| category_name | string or null | Category display name |
| category_source | string | How category was determined: "mapping" (MD file), "rule" (AutoCatRule), "ai" (LLM suggestion), "none" |

**Error responses**:

| Status | Condition |
|--------|-----------|
| 400 | Invalid/corrupted PDF, or PDF source not specified |
| 422 | PDF has no extractable tables or no recognizable transactions |
| 503 | AI service unavailable (blocks import per FR-014) |

---

### POST /api/v1/budget/import/{import_id}/confirm

**Change**: Accepts optional category overrides and saves mappings.

**Request** (JSON body):

```json
{
  "category_overrides": [
    {
      "row_index": 0,
      "category_id": "uuid-string"
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| category_overrides | array | No | List of row-level category changes made during review. If omitted, AI/auto suggestions are used as-is. |

**Response** (200 OK):

```json
{
  "id": "uuid-string",
  "status": "confirmed",
  "row_count": 47,
  "mappings_updated": 12
}
```

| Field | Type | Description |
|-------|------|-------------|
| mappings_updated | int | Number of new description→category mappings saved to the MD file |

**Behavior**: On confirmation, for each transaction:
1. Apply any category overrides from the request
2. Save each description→category pair to `category_mappings.md` (lowercase description)
3. Persist all transactions to database
4. Update import status to "confirmed"

---

## New Endpoints

### GET /api/v1/budget/import/categories

Returns the list of available categories for the category selector in the review UI.

**Response** (200 OK):

```json
{
  "categories": [
    {
      "id": "uuid-string",
      "name": "Entertainment",
      "color": "#FF5722"
    }
  ]
}
```

**Source**: Merges categories from the database (Category model) with any from the seed CSV that don't yet exist in the database.

---

### POST /api/v1/budget/import/seed-categories

Upload or replace the seed categories CSV file.

**Request** (multipart/form-data):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | File | Yes | CSV file with "Categories" column and optional "Examples" column |

**Response** (200 OK):

```json
{
  "categories_loaded": 15,
  "examples_loaded": 42
}
```

**Behavior**:
1. Parse CSV file
2. Create Category records for any new category names
3. If Examples column present, pre-populate `category_mappings.md` with example→category pairs
4. Return counts

**Error responses**:

| Status | Condition |
|--------|-----------|
| 400 | Missing "Categories" column or invalid CSV format |
