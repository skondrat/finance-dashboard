# Data Model: Finance Dashboard

**Feature**: 001-finance-dashboard
**Date**: 2026-03-25
**Storage**: SQLite via SQLAlchemy 2.0, managed by Alembic migrations

## Entity Relationship Diagram (text)

```
User 1──* Account 1──* InvestmentTransaction *──1 Asset
                                                   1
                                                   │
                                                   *
                                              AssetPrice

User 1──* BudgetTransaction *──1 Category 1──* AutoCatRule
User 1──* IncomeSource
User 1──* BankProfile
User 1──* StatementImport 1──* BudgetTransaction
Category: self-referential (merge_into)
ExchangeRate: standalone lookup table
```

## Entities

### User

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| email | String(255) | UNIQUE, NOT NULL | Login identifier |
| password_hash | String(255) | NOT NULL | bcrypt hash |
| display_name | String(100) | NOT NULL | |
| preferred_currency | String(3) | NOT NULL, DEFAULT 'EUR' | ISO 4217 code |
| theme | String(5) | NOT NULL, DEFAULT 'light' | 'light' or 'dark' |
| created_at | DateTime | NOT NULL | |
| updated_at | DateTime | NOT NULL | |

### Account

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| user_id | UUID | FK → User, NOT NULL | |
| name | String(100) | NOT NULL | e.g., "Interactive Brokers" |
| type | String(20) | NOT NULL | 'brokerage', 'crypto_exchange', 'bank' |
| notes | Text | NULLABLE | |
| created_at | DateTime | NOT NULL | |

**Indexes**: (user_id)

### Asset

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| ticker | String(20) | UNIQUE, NOT NULL | e.g., "AAPL", "BTC" |
| name | String(200) | NOT NULL | e.g., "Apple Inc." |
| asset_type | String(20) | NOT NULL | 'stock', 'etf', 'crypto', 'bond' |
| currency | String(3) | NOT NULL | ISO 4217 — asset's native currency |
| region | String(50) | NULLABLE | e.g., "North America" |
| sector | String(50) | NULLABLE | e.g., "Technology" |
| industry | String(100) | NULLABLE | e.g., "Consumer Electronics" |

**Indexes**: (ticker), (asset_type)

### InvestmentTransaction

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| account_id | UUID | FK → Account, NOT NULL | |
| asset_id | UUID | FK → Asset, NOT NULL | |
| type | String(4) | NOT NULL | 'buy' or 'sell' |
| quantity | Decimal(18,8) | NOT NULL | Supports fractional shares and crypto |
| price_per_unit | Decimal(18,8) | NOT NULL | Price in transaction currency |
| currency | String(3) | NOT NULL | Transaction currency (may differ from asset currency) |
| fees | Decimal(12,2) | NOT NULL, DEFAULT 0 | |
| date | Date | NOT NULL | |
| created_at | DateTime | NOT NULL | |

**Indexes**: (account_id, date), (asset_id, date)

**Derived**: Position is computed by aggregating InvestmentTransactions per (account_id, asset_id). Not stored as a table — calculated at query time using average cost method.

### Position (computed view, not a table)

| Field | Derivation |
|-------|-----------|
| account_id | Group key |
| asset_id | Group key |
| quantity | SUM(buy quantities) - SUM(sell quantities) |
| avg_cost_basis | Weighted average of buy prices, recalculated on each purchase |
| total_cost | quantity * avg_cost_basis |
| current_value | quantity * latest asset price (in asset currency) |
| pnl_absolute | current_value - total_cost |
| pnl_percent | (current_value - total_cost) / total_cost * 100 |
| weight | current_value / total_portfolio_value * 100 |

### AssetPrice

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| asset_id | UUID | FK → Asset, NOT NULL | |
| date | Date | NOT NULL | |
| close_price | Decimal(18,8) | NOT NULL | In asset's native currency |
| source | String(20) | NOT NULL | 'finnhub', 'coingecko', 'manual' |
| fetched_at | DateTime | NOT NULL | |

**Indexes**: UNIQUE (asset_id, date)

### Category

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| user_id | UUID | FK → User, NOT NULL | |
| name | String(50) | NOT NULL | |
| color | String(7) | NOT NULL, DEFAULT '#4c4546' | Hex color code |
| monthly_budget | Decimal(12,2) | NULLABLE | NULL = no budget set |
| is_archived | Boolean | NOT NULL, DEFAULT false | |
| is_default | Boolean | NOT NULL, DEFAULT false | System-provided categories |
| merged_into_id | UUID | FK → Category, NULLABLE | Self-ref for merged categories |
| created_at | DateTime | NOT NULL | |

**Indexes**: (user_id, is_archived), UNIQUE (user_id, name)

**Default categories** (seeded on user creation): Housing, Food & Groceries, Transport, Entertainment, Health, Shopping, Subscriptions, Utilities, Investments, Income, Transfers, Other

### AutoCatRule

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| category_id | UUID | FK → Category, NOT NULL | |
| keyword | String(100) | NOT NULL | Case-insensitive match against transaction description |
| created_at | DateTime | NOT NULL | |

**Indexes**: (category_id)

### BankProfile

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| user_id | UUID | FK → User, NOT NULL | |
| name | String(100) | NOT NULL | e.g., "ING DiBa CSV" |
| delimiter | String(1) | NOT NULL, DEFAULT ',' | |
| date_column | String(50) | NOT NULL | Column name in CSV |
| amount_column | String(50) | NOT NULL | |
| description_column | String(50) | NOT NULL | |
| reference_column | String(50) | NULLABLE | |
| date_format | String(20) | NOT NULL, DEFAULT '%Y-%m-%d' | strftime format |
| encoding | String(20) | NOT NULL, DEFAULT 'utf-8' | |
| skip_rows | Integer | NOT NULL, DEFAULT 0 | Header rows to skip |
| created_at | DateTime | NOT NULL | |

**Indexes**: (user_id)

### StatementImport

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| user_id | UUID | FK → User, NOT NULL | |
| filename | String(255) | NOT NULL | |
| format | String(10) | NOT NULL | 'csv', 'ofx', 'mt940' |
| bank_profile_id | UUID | FK → BankProfile, NULLABLE | Only for CSV imports |
| row_count | Integer | NOT NULL | |
| duplicate_count | Integer | NOT NULL, DEFAULT 0 | |
| status | String(20) | NOT NULL | 'parsing', 'preview', 'confirmed', 'discarded' |
| uploaded_at | DateTime | NOT NULL | |

**Indexes**: (user_id, uploaded_at)

### BudgetTransaction

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| user_id | UUID | FK → User, NOT NULL | |
| import_id | UUID | FK → StatementImport, NULLABLE | NULL if manually entered |
| category_id | UUID | FK → Category, NULLABLE | NULL = uncategorized |
| date | Date | NOT NULL | |
| description | String(500) | NOT NULL | |
| amount | Decimal(12,2) | NOT NULL | Negative = debit, positive = credit |
| currency | String(3) | NOT NULL | Original transaction currency |
| reference | String(200) | NULLABLE | Bank reference for deduplication |
| is_investment | Boolean | NOT NULL, DEFAULT false | Cash-flow tag only, no portfolio link |
| dedup_hash | String(64) | NOT NULL | SHA-256 of (date + amount + reference) |
| created_at | DateTime | NOT NULL | |

**Indexes**: (user_id, date), (user_id, category_id), (dedup_hash)

### IncomeSource

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| user_id | UUID | FK → User, NOT NULL | |
| label | String(100) | NOT NULL | e.g., "Salary", "Dividends" |
| amount | Decimal(12,2) | NOT NULL | |
| currency | String(3) | NOT NULL | |
| month | Integer | NOT NULL | 1-12 |
| year | Integer | NOT NULL | |
| created_at | DateTime | NOT NULL | |

**Indexes**: (user_id, year, month)

### ExchangeRate

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| base_currency | String(3) | NOT NULL | e.g., "EUR" |
| target_currency | String(3) | NOT NULL | e.g., "USD" |
| rate | Decimal(18,8) | NOT NULL | |
| date | Date | NOT NULL | |
| fetched_at | DateTime | NOT NULL | |

**Indexes**: UNIQUE (base_currency, target_currency, date)

## State Transitions

### StatementImport.status

```
parsing → preview → confirmed
                  → discarded
```

- `parsing`: File uploaded, background task running
- `preview`: Parsed successfully, awaiting user confirmation
- `confirmed`: User accepted import, transactions written to BudgetTransaction
- `discarded`: User rejected the import

### Category merge

When category A is merged into category B:
1. All BudgetTransactions with `category_id = A` are updated to `category_id = B`
2. All AutoCatRules with `category_id = A` are updated to `category_id = B`
3. Category A's `merged_into_id` is set to B's id and `is_archived = true`

## Data Integrity Rules

- Deleting a User cascades to all owned entities (Account, BudgetTransaction, Category, etc.)
- Deleting an Account cascades to its InvestmentTransactions
- Archiving a Category does not delete transactions; they retain the category reference
- BudgetTransaction.dedup_hash prevents duplicate imports (UNIQUE per user)
- Asset.ticker is globally unique (shared reference data across users)
- Position quantity must never go negative (validated at transaction creation)
