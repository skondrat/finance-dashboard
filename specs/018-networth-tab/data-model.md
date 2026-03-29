# Data Model: Networth Tab

**Branch**: `018-networth-tab` | **Date**: 2026-03-29

## New Entity: NetworthAccount

Represents a manually tracked financial account (bank account, crypto wallet, cash savings).

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String(36) | PK, UUID default | Unique identifier |
| user_id | String(36) | FK→users.id, NOT NULL, indexed, CASCADE delete | Owner |
| name | String(100) | NOT NULL | Display name (e.g., "Wise", "Revolut", "Cash") |
| balance | Numeric(18, 8) | NOT NULL, default 0 | Current balance in account currency |
| currency | String(3) | NOT NULL, default "EUR" | ISO 4217 currency code |
| account_type | String(20) | NOT NULL, default "bank" | Informational label: bank, crypto, cash |
| created_at | DateTime | NOT NULL, default utcnow | Creation timestamp |
| updated_at | DateTime | NOT NULL, default utcnow, onupdate utcnow | Last modification timestamp |

### Indexes

| Name | Columns | Purpose |
|------|---------|---------|
| ix_networth_accounts_user | user_id | Fast lookup by user |

### Relationships

- **User → NetworthAccount**: One-to-Many (cascade delete). A user owns zero or more networth accounts.
- No relationship to the existing `accounts` (portfolio) table — these are independent entities.

### Validation Rules

- `name`: 1–100 characters, free text, duplicates allowed per user
- `balance`: Any numeric value including negative (overdrawn accounts)
- `currency`: 3-character ISO 4217 code
- `account_type`: Free text, up to 20 characters

### State Transitions

None — NetworthAccount is a simple CRUD entity with no lifecycle states.

## Existing Entities Referenced (Read-Only)

### Account (portfolio)

Used to list portfolio accounts and their names in the networth breakdown. No modifications needed.

### Portfolio Positions (computed)

Per-account position totals from `portfolio_service.get_positions()` are summed to get each portfolio account's current value. No model changes needed.

## Migration

New Alembic migration: `add_networth_accounts`
- Creates `networth_accounts` table with all fields above
- Adds index on `user_id`
