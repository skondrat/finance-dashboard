# Implementation Plan: Fix Currency Conversion

**Branch**: `027-fix-currency-conversion` | **Date**: 2026-03-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/027-fix-currency-conversion/spec.md`

## Summary

The EUR/USD toggle only swaps the currency symbol — values stay the same. The FX infrastructure already exists (`fx_service.py`, `ExchangeRate` model, exchange rate API endpoints) but is never called. Fix: wire `fx_service.convert()` into `portfolio_service.py` calculations, add a `currency` column to `AssetPrice` to track native price currency, and ensure all monetary values are properly converted when the user toggles between EUR and USD.

## Technical Context

**Language/Version**: Python 3.11 (backend), TypeScript 5 (frontend)
**Primary Dependencies**: FastAPI, SQLAlchemy 2.0, Alembic (backend); Next.js 16, TanStack Query, Zustand (frontend)
**Storage**: SQLite via SQLAlchemy (new `currency` column on `asset_prices`, existing `exchange_rates` table)
**Testing**: Manual browser testing via Playwright MCP
**Target Platform**: Web application (local dev)
**Project Type**: Full-stack web application

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| Keep It Simple | PASS | Reusing existing FX infrastructure — no new abstractions needed |
| Always Test with Browser | PASS | Will verify EUR/USD toggle with Playwright MCP |
| Git Hygiene | PASS | Dedicated branch from main |

## Project Structure

### Source Code

```text
backend/
├── alembic/versions/
│   └── xxx_add_currency_to_asset_prices.py  # New migration
├── app/
│   ├── models/
│   │   └── asset_price.py          # Add currency column
│   ├── services/
│   │   ├── portfolio_service.py    # Wire in fx_service.convert()
│   │   ├── price_service.py        # Store native currency on price fetch
│   │   └── fx_service.py           # Already exists — may need minor fixes
│   └── api/
│       └── portfolio.py            # No changes expected

frontend/
└── src/
    └── (no changes expected — toggle already sends currency param)
```

## Implementation Approach

### What Already Exists
- `ExchangeRate` model + `exchange_rates` table (migration `d7baca819772`)
- `fx_service.py` with `fetch_daily_rate()`, `get_rate()`, `convert()`
- Exchange rate API endpoints at `/api/v1/exchange-rates/`
- `Asset.currency` field (tracks trading currency)
- `InvestmentTransaction.currency` field (tracks transaction currency)
- Frontend `useCurrencyStore` that passes `?currency=` to all API calls

### What Needs to Change
1. **Add `currency` column to `asset_prices`** — track what currency each price was fetched in
2. **Update price providers** — store the native currency when saving prices (yfinance→USD, CoinGecko→EUR)
3. **Update `portfolio_service.py`** — call `fx_service.get_rate()` + `fx_service.convert()` to convert:
   - Current prices from native currency → display currency
   - Cost basis from transaction currency → display currency
   - All derived values (current_value, pnl_absolute, net_worth, etc.)
4. **Ensure percentages are unaffected** — pnl_percent, weight, return_pct stay the same
5. **Fix Asset.currency values** — ensure IUAA.L, ISAC.L have currency="USD", BTC/ETH have currency="EUR"
