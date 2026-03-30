# Research: Fix Currency Conversion

**Feature**: 027-fix-currency-conversion
**Date**: 2026-03-30

## R1: Existing FX Infrastructure

**Decision**: Reuse the existing `fx_service.py` and `ExchangeRate` model — no need to build from scratch.

**Rationale**: The codebase already has:
- `ExchangeRate` model with `base_currency`, `target_currency`, `rate`, `date`, `fetched_at`
- `fx_service.fetch_daily_rate(db, base, target, target_date)` — fetches from exchangerate.host
- `fx_service.get_rate(db, base, target, target_date)` — retrieves cached rate with fallback
- `fx_service.convert(amount, rate)` — simple multiplication
- API endpoints at `/api/v1/exchange-rates/`
- Alembic migration `d7baca819772` already created the `exchange_rates` table

**Alternatives considered**: Frankfurter API, ECB API — rejected because existing integration already works.

## R2: Price Currency Tracking

**Decision**: Add a `currency` column (String(3), NOT NULL, default "USD") to the `asset_prices` table via Alembic migration. Update price providers to set it on each fetch.

**Rationale**: Currently `AssetPrice` stores `close_price` without knowing if it's USD, EUR, or GBP. Without this, conversion is impossible. The providers already know the currency:
- YFinanceProvider: always USD (Yahoo Finance default for London-listed assets)
- CoinGeckoProvider: already hardcoded to EUR (`vs_currencies="eur"`)

**Alternatives considered**: Infer from Asset.currency at query time — rejected because the Asset.currency field may not match the provider's fetch currency.

## R3: Where to Apply Conversion

**Decision**: Apply conversion inside `portfolio_service.py` functions, not in the API layer. Each function already accepts a `currency` parameter — just need to actually use it.

**Rationale**: The conversion needs to happen at the calculation level, not just formatting:
- `get_positions()`: Convert `current_price`, `current_value`, `total_cost`, `avg_cost_basis`, `pnl_absolute`
- `get_summary()`: Convert `net_worth`, `total_return`, `invested_capital`
- `get_allocation()`: Convert segment values and total
- `get_performance_breakdown()`: Convert capital, price_gain, transaction_costs, etc.
- `get_performance()`: Convert data point values

Percentages (`pnl_percent`, `weight`, `return_pct`, `irr`, `twr`) are already currency-agnostic.

**Alternatives considered**: Convert in frontend — rejected because it would require sending exchange rates to the client and duplicating logic.

## R4: Asset Currency Values

**Decision**: Fix existing asset records to have correct `currency` values:
- IUAA.L, ISAC.L → `USD` (London-listed iShares ETFs trade in USD)
- BTC, ETH → `EUR` (CoinGecko fetches in EUR)
- AAPL → `USD`

**Rationale**: The `Asset.currency` field exists but may have incorrect or empty values. Correct values are needed for the conversion logic to work.

## R5: Conversion Flow

**Decision**: For each monetary value, the conversion path is:
1. Look up the price's native currency (from `AssetPrice.currency` or `Asset.currency`)
2. If native currency == display currency → no conversion needed
3. If native currency != display currency → fetch rate via `fx_service.get_rate()` and convert

For cost basis:
1. Transaction.currency → display currency (using `fx_service.convert()`)

**Rationale**: This handles the mixed-currency portfolio correctly: ETF prices in USD, crypto prices in EUR, transactions possibly in either.
