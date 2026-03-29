# Data Model: Subscriptions

**Feature**: 024-subscriptions | **Date**: 2026-03-29

## New Entities

### Subscription

A user's recurring financial commitment.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → users.id, CASCADE, NOT NULL, indexed | Owning user |
| name | String(200) | NOT NULL | Subscription name (e.g., "Netflix") |
| cadence | String(10) | NOT NULL, default "monthly" | One of: monthly, yearly, weekly |
| amount | Numeric(12,2) | NOT NULL | Payment amount |
| currency | String(3) | NOT NULL, default "EUR" | ISO 4217 currency code |
| payment_day | Integer | nullable | Day of month (1-31) when payment occurs |
| payment_source | String(100) | nullable | Payment source (e.g., "monobank") |
| status | String(10) | NOT NULL, default "active" | One of: active, cancelled |
| created_at | DateTime | NOT NULL | Creation timestamp |
| updated_at | DateTime | NOT NULL, auto-update | Last update timestamp |

**Index**: `ix_subscriptions_user_id` on `user_id`.

### DismissedSuggestion

Tracks which auto-detected suggestions the user has dismissed.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → users.id, CASCADE, NOT NULL | Owning user |
| description_hash | String(64) | NOT NULL | SHA-256 hash of LOWER(description) |
| created_at | DateTime | NOT NULL | When dismissed |

**Unique constraint**: `(user_id, description_hash)` — prevents duplicate dismissals.

## Computed (not persisted)

### SubscriptionSuggestion (API response only)

Computed on-demand from budget_transactions. Not stored in any table.

| Field | Type | Description |
|-------|------|-------------|
| description | String | Transaction description that recurs |
| amount | Decimal | Most recent transaction amount |
| currency | String | Currency from the transaction |
| months_detected | Integer | Number of consecutive months found |
| latest_date | Date | Date of most recent occurrence |

## Relationships

```
User (1) ──→ (N) Subscription
User (1) ──→ (N) DismissedSuggestion
User (1) ──→ (N) BudgetTransaction (existing — source for detection)
User (1) ──→ (N) StatementImport (existing — source for payment sources)
```

## State Transitions

### Subscription Lifecycle

```
[created] → active → cancelled → active (reactivated)
                 ↘              ↗
            [deleted permanently]
```

### Suggestion Lifecycle

```
[detected on-demand] → confirmed (creates Subscription)
                     → dismissed (creates DismissedSuggestion)
```
