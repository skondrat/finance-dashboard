# Data Model: Categories Settings Page

**Branch**: `011-categories-settings` | **Date**: 2026-03-29

## Entities

### Category (existing — no schema changes)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID (String 36) | PK | Auto-generated |
| user_id | String(36) | FK → users, NOT NULL | Cascade delete |
| name | String(50) | Unique per (user_id, name) | |
| color | String(7) | Default: #4c4546 | Hex color |
| monthly_budget | Numeric(12,2) | Nullable | |
| is_archived | Boolean | Default: false | |
| is_default | Boolean | Default: false | Set by seed_default_categories |
| merged_into_id | String(36) | FK → categories, nullable | Self-referential |
| created_at | DateTime | Default: utcnow | |

**Immutability rule**: Categories named "Other" and "ATM Withdrawal" are treated as immutable (cannot be deleted or renamed). This is enforced at the frontend level by hiding remove/rename controls. No schema change needed.

### Required Categories (constants, not persisted)

| Name | Color | Auto-created when |
|------|-------|-------------------|
| Other | #6B7280 | Save on Categories page (ensure-required) |
| ATM Withdrawal | (default) | Save on Categories page (ensure-required) |

These are auto-ensured via the `POST /budget/categories/ensure-required` endpoint on every save from the Categories page.

## State Transitions

### Budget Page State

```
[No Categories] → Init Categories button clicked → [Categories Page]
[Has Categories] → Gear icon → Categories dropdown → [Categories Page]
```

### Categories Page State

```
[Empty / Init Mode]
  ├── CSV Upload → categories created via seed endpoint → [Populated]
  └── Manual Add → category created via POST → [Populated]

[Populated / Manage Mode]
  ├── Add category → POST /budget/categories
  ├── Edit budget → PATCH /budget/categories/{id}
  ├── Remove category → DELETE /budget/categories/{id}
  └── Save → POST /budget/categories/ensure-required → navigate to /budget
```

## Relationships

No new relationships. Existing:
- Category → BudgetTransaction (one-to-many)
- Category → AutoCatRule (one-to-many)
- Category → Category (self-ref via merged_into_id)
