# Data Model: Init Categories Flow

**Date**: 2026-03-29

## Existing Entities (No Schema Changes)

### Category

No database schema changes required. The `Category` model already has all needed fields:

| Field | Type | Nullable | Notes |
|-------|------|----------|-------|
| id | UUID string | No | Auto-generated |
| user_id | string (FK) | No | Links to user |
| name | string(50) | No | Unique per user |
| color | string(7) | No | Hex color, default "#4c4546" |
| monthly_budget | Decimal(12,2) | Yes | **Used by Budget column in CSV** |
| is_archived | bool | No | Default False |
| is_default | bool | No | Default False |
| merged_into_id | UUID string (FK) | Yes | Self-referential for merges |
| created_at | datetime | No | Auto-set |

**Constraint**: Unique(user_id, name)

## Data Format Changes

### Init Categories CSV (Enhanced Seed CSV)

| Column | Required | Type | Description |
|--------|----------|------|-------------|
| Categories | Yes | string | Category name |
| Examples | No | string | Pipe-separated example descriptions |
| Budget | No | numeric | Monthly budget amount in euros |

**Example**:
```csv
Categories,Examples,Budget
Rent,,1200
Groceries,Lidl | Aldi | Continente,400
Restaurants,,200
ATM Withdrawal,,300
Insurance,Car Insurance | Health Insurance,150
Coffee shops,,50
```

**Parsing rules**:
- Column matching is case-insensitive
- Empty Budget values → `monthly_budget = NULL`
- Non-numeric Budget values → skip row, count as error
- Duplicate category names within CSV → last occurrence wins (budget value)
- Category already exists in DB → skip (no update to existing budget)

## Description-to-Category Mappings

No changes to `category_mappings.md` format. Existing `save_bulk_mappings` handles example descriptions as before.
