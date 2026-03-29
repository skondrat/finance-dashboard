# Data Model: Edit Init Categories

## Entities

### Category (existing — no schema changes)

| Field          | Type            | Constraints                  | Notes                          |
|----------------|-----------------|------------------------------|--------------------------------|
| id             | String(36)      | PK, auto-generated UUID      |                                |
| user_id        | String(36)      | FK → users.id, NOT NULL      |                                |
| name           | String(50)      | NOT NULL, unique per user     |                                |
| color          | String(7)       | NOT NULL, default "#4c4546"  |                                |
| monthly_budget | Numeric(12,2)   | NULLABLE                     | Editable via PATCH             |
| is_archived    | Boolean         | NOT NULL, default false      |                                |
| is_default     | Boolean         | NOT NULL, default false      |                                |
| merged_into_id | String(36)      | FK → categories.id, NULLABLE |                                |
| created_at     | DateTime        | NOT NULL, auto-set           |                                |

**No schema changes required.** The existing Category model already supports all needed operations:
- `monthly_budget` is nullable, supporting both set and clear operations
- The model supports deletion (hard delete for categories without transactions)

## Validation Rules

- `monthly_budget` must be >= 0 when provided (zero is valid — means "tracked but no limit")
- `monthly_budget` can be set to null to clear the budget
- Category deletion is blocked if the category has associated transactions (409 Conflict)
