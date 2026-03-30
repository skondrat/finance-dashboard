# Data Model: Fix Portfolio Prices

**Feature**: 025-fix-portfolio-prices
**Date**: 2026-03-30

## Existing Entities (no schema changes)

### Asset
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| ticker | String(20) | Unique. Must match provider format (e.g., "IUAA.DE" for Finnhub, "BTC" for CoinGecko) |
| name | String(200) | Display name |
| asset_type | String(20) | "stock", "etf", "crypto", "bond" — determines price provider routing |
| currency | String(3) | ISO 4217 |
| region | String(50) | Optional |
| sector | String(50) | Optional |
| industry | String(100) | Optional |

### AssetPrice
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| asset_id | FK → Asset | Indexed |
| date | Date | Price date |
| close_price | Numeric(18,8) | End-of-day or latest price |
| source | String(20) | "finnhub", "coingecko", "manual" |
| fetched_at | DateTime | When fetched |
| **Unique** | (asset_id, date) | One price per asset per day |

## Data Fixes Required

### Asset Type Corrections
| Ticker | Current asset_type | Correct asset_type |
|--------|-------------------|-------------------|
| BTC | stock | crypto |
| ETH | stock | crypto |

### Ticker Format Corrections
| Current Ticker | Correct Ticker | Reason |
|---------------|---------------|--------|
| IUAA | IUAA.DE | Finnhub requires Xetra exchange suffix |
| ISAC | ISAC.DE | Finnhub requires Xetra exchange suffix |

## Provider Routing

```
asset_type == "crypto"  → CoinGeckoProvider  → ticker mapping: BTC→bitcoin, ETH→ethereum
asset_type != "crypto"  → FinnhubProvider    → ticker used as-is (must include exchange suffix)
```
