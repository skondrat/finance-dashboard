# Data Model: Networth Manual Import & Composition Donut Chart

**Date**: 2026-03-30 | **Branch**: `032-networth-manual-donut`

## Schema Changes

### Modified Table: `networth_snapshots`

**New column:**

| Column | Type | Default | Nullable | Description |
|--------|------|---------|----------|-------------|
| `source` | String(10) | "auto" | No | Distinguishes auto-captured snapshots from manually imported ones. Values: "auto", "manual" |

**Migration**: Add `source` column with default "auto". All existing rows get "auto" (they were all auto-captured by the snapshot service).

**Index**: Add index on `(user_id, source)` for efficient filtering when bulk-deleting manual entries.

### Existing Tables (No Changes)

- **`networth_accounts`**: No changes. Manual accounts (bank, cash) remain as-is.
- **`accounts`**: No changes. Investment accounts remain as-is.
- **`assets`**: No changes. The `asset_type` field (stock, etf, crypto, bond) is used for "Type" grouping in the composition endpoint.

## Entity Relationships (for composition)

```
NetworthAccount (source="manual")     Account (source="investment")
  ├── name                              ├── name
  ├── balance                           ├── type
  ├── currency                          └── positions → assets
  └── account_type                           └── asset_type (etf, crypto, stock, bond)
        │                                          │
        └──────────── Composition API ─────────────┘
                     group_by=account → one segment per account
                     group_by=type → grouped by account_type / asset_type
```

## Composition Grouping Logic

### Group by "account"
Each NetworthAccount and each investment Account becomes one segment:
- Label: account name
- Value: converted balance in display currency
- Percentage: balance / total networth * 100

### Group by "type"
Accounts are grouped by their type:
- NetworthAccount: uses `account_type` field (bank, cash, etc.)
- Investment accounts: uses the dominant `asset_type` of their positions (etf, crypto, stock, bond)
- Label: type name (capitalized)
- Value: sum of balances for that type
- Percentage: group total / total networth * 100
