# Data Model: PDF Statement Import

**Feature**: 002-pdf-statement-import | **Date**: 2026-03-27

## Entity Changes

### Modified: StatementImport

Existing model at `backend/app/models/statement_import.py`.

| Field | Type | Change | Notes |
|-------|------|--------|-------|
| format | String | **Extend** | Add "pdf" to allowed values (currently: csv, ofx, mt940) |
| source | String (nullable) | **Add** | "payoneer", "monobank", "millenium", "other", or null (for non-PDF imports) |

### Modified: BudgetTransaction

Existing model at `backend/app/models/budget_transaction.py`.

No schema changes needed. Existing fields cover all extracted PDF data:
- `date` — Transaction date
- `description` — Transaction description
- `amount` — Monetary amount
- `currency` — Currency code
- `category_id` — Links to Category (set during categorization)
- `dedup_hash` — SHA-256 for duplicate detection

**Note**: The "Type" field (Debit/Credit) from the spec maps to the sign of `amount` (positive = credit, negative = debit). No new column needed.

### New File: source_mappings.json

Location: `backend/data/source_mappings.json`

Defines how PDF table columns map to transaction fields for each known source.

```json
{
  "payoneer": {
    "date_column": 0,
    "description_column": 1,
    "amount_column": 2,
    "currency_column": 3,
    "type_column": 4,
    "date_format": "%m/%d/%Y"
  },
  "monobank": { ... },
  "millenium": { ... }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| date_column | int | Yes | Column index for transaction date |
| description_column | int | Yes | Column index for description |
| amount_column | int | Yes | Column index for amount |
| currency_column | int | Yes | Column index for currency code |
| type_column | int | Yes | Column index for debit/credit indicator |
| date_format | string | Yes | Python strftime format for date parsing |

### New File: category_mappings.md

Location: `backend/data/category_mappings.md`

Persistent description-to-category mapping. Grows with each confirmed import.

```markdown
# Category Mappings

| Description | Category |
|-------------|----------|
| netflix | Entertainment |
| spotify premium | Entertainment |
| uber eats | Food & Dining |
```

| Field | Type | Notes |
|-------|------|-------|
| Description | string (lowercase) | Case-insensitive; stored lowercase for matching |
| Category | string | Must match a known category name |

**Behavior**:
- Read at import start for auto-categorization
- Appended/updated on import confirmation
- Descriptions are normalized to lowercase before storage and lookup

### New File: seed_categories.csv

Location: `backend/data/seed_categories.csv` (user-provided)

| Column | Required | Description |
|--------|----------|-------------|
| Categories | Yes | Category name |
| Examples | No | Pipe-separated example descriptions (e.g., "netflix\|spotify\|hulu") |

**Behavior**:
- Read to populate the initial category set
- Examples are optionally pre-populated into category_mappings.md
- AI is constrained to suggest only categories from this set + learned mappings

## Entity Relationships

```text
StatementImport (1) ──── (*) BudgetTransaction
       │                        │
       │ source                 │ category_id
       │                        │
  source_mappings.json    Category (existing)
                               │
                          category_mappings.md
                          seed_categories.csv
```

## State Transitions

### Import Flow (unchanged, extended)

```text
[User selects source + uploads PDF]
         │
         ▼
    ┌──────────┐
    │  parsing  │  PDF extracted via pdfplumber + source mapping
    └────┬─────┘
         │
         ▼
    ┌──────────┐
    │ categorizing │  Lookup MD file → AutoCatRule → AI fallback
    └────┬─────┘
         │
         ▼
    ┌──────────┐
    │  preview  │  User reviews transactions + edits categories
    └────┬─────┘
         │
    ┌────┴────┐
    ▼         ▼
┌──────────┐ ┌──────────┐
│ confirmed│ │ discarded│
└──────────┘ └──────────┘
    │
    ▼
  category_mappings.md updated with final categories
```

### Category Resolution Order

```text
1. Exact match in category_mappings.md (case-insensitive)
   ↓ (no match)
2. Keyword match via AutoCatRule (existing, case-insensitive substring)
   ↓ (no match)
3. AI suggestion via Anthropic Claude (constrained to known categories)
   ↓ (AI response)
4. User review and optional override
   ↓ (on confirm)
5. Save final mapping to category_mappings.md
```

## Validation Rules

- **PDF upload**: Must be a valid PDF file (checked via file header magic bytes)
- **Source**: Must be one of "payoneer", "monobank", "millenium", "other"
- **Amount**: Must be parseable as a decimal number
- **Date**: Must match the source's configured date_format
- **Category**: Must exist in the known category set (from CSV + learned)
- **Description**: Cannot be empty; trimmed and lowercased for mapping storage
