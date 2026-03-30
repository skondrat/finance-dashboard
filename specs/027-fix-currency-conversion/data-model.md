# Data Model: Fix Currency Conversion

**Feature**: 027-fix-currency-conversion
**Date**: 2026-03-30

## New Column

### AssetPrice.currency (new)
| Field | Type | Notes |
|-------|------|-------|
| currency | String(3) | NOT NULL, default "USD". ISO 4217 code of the price's native currency. |

Migration: Add column to existing `asset_prices` table. Backfill existing rows: set "EUR" for prices with source="coingecko", "USD" for source="yfinance".

## Existing Entities (no schema changes)

### ExchangeRate (already exists)
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| base_currency | String(3) | e.g., "EUR" |
| target_currency | String(3) | e.g., "USD" |
| rate | Numeric(18,8) | Conversion rate |
| date | Date | Rate date |
| fetched_at | DateTime | When fetched |
| **Unique** | (base_currency, target_currency, date) | One rate per pair per day |

### Asset.currency (already exists)
- String(3), NOT NULL — trading currency of the asset

### InvestmentTransaction.currency (already exists)
- String(3), NOT NULL — currency the transaction was executed in

## Data Fixes Required

### Asset Currency Corrections
| Ticker | Current currency | Correct currency |
|--------|-----------------|-----------------|
| IUAA.L | (verify) | USD |
| ISAC.L | (verify) | USD |
| BTC | (verify) | EUR |
| ETH | (verify) | EUR |

## Conversion Logic

```
display_value = raw_value × fx_rate(native_currency → display_currency)

If native_currency == display_currency → fx_rate = 1.0 (no conversion)
If native_currency != display_currency → fx_rate from exchange_rates table
```
