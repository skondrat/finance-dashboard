# Data Model: Net Worth History

**Feature**: 022-networth-history | **Date**: 2026-03-29

## New Entities

### NetworthSnapshot

Monthly record of a user's total net worth.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → users.id, CASCADE, NOT NULL, indexed | Owning user |
| snapshot_month | String(7) | NOT NULL | Year-month in "YYYY-MM" format |
| total_networth | Numeric(18,8) | NOT NULL | Total net worth in display currency |
| currency | String(3) | NOT NULL, default "EUR" | Currency used for the total |
| breakdown | JSON | nullable | Per-account breakdown: `[{name, balance, source, account_type}]` |
| created_at | DateTime | NOT NULL | First creation timestamp |
| updated_at | DateTime | NOT NULL, auto-update | Last update timestamp |

**Unique constraint**: `(user_id, snapshot_month)` — enforces one snapshot per month per user.

**Index**: `ix_networth_snapshots_user_id` on `user_id` for efficient history queries.

### Breakdown JSON Schema

```json
[
  {
    "name": "Chase Checking",
    "balance": 5000.00,
    "source": "manual",
    "account_type": "bank"
  },
  {
    "name": "Fidelity Investments",
    "balance": 25000.00,
    "source": "investment",
    "account_type": null
  }
]
```

## Relationships

```
User (1) ──→ (N) NetworthSnapshot
User (1) ──→ (N) NetworthAccount (existing)
User (1) ──→ (N) Account (existing, portfolio)
```

NetworthSnapshot has no direct relationship to NetworthAccount or Account — it captures a point-in-time total computed from both sources.

## Existing Entities (unchanged)

- **NetworthAccount**: Manual balance entries (bank, crypto, cash, debt)
- **Account**: Portfolio/investment accounts with transactions
- **User**: Parent entity for all networth data
