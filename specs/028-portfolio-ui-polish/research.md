# Research: Portfolio UI Polish

**Feature**: 028-portfolio-ui-polish
**Date**: 2026-03-30

## R1: Performance Chart — Missing Historical Prices

**Decision**: Seed historical prices using the existing `fetch_historical()` methods on `YFinanceProvider` and `CoinGeckoProvider`. Add a one-time historical seed as part of the refresh flow.

**Rationale**: The `get_performance()` function in portfolio_service.py is correct — it queries `AssetPrice` rows within the date range and builds time-series data. The issue is that `asset_prices` table only has today's prices (from the Refresh Prices button). The `fetch_historical()` methods on both providers already exist and work. YFinance supports `history(start=..., end=...)` and CoinGecko supports `get_coin_market_chart_by_id(days=...)`.

**Alternatives considered**: Store prices on a scheduled cron — over-engineering for a personal dashboard.

## R2: Aggregated Transactions — No Cross-Account Endpoint

**Decision**: Add a new `GET /portfolio/transactions` endpoint that queries all `InvestmentTransaction` rows for the user across all accounts, with optional date filters. Include the account name in each response row.

**Rationale**: All existing transaction endpoints (`GET /accounts/{id}/transactions`) require an account_id path parameter. The portfolio_service already queries all transactions across accounts for position calculation — just need to expose them as a list. The frontend TransactionsView can be adapted to work with or without an accountId.

**Alternatives considered**: Fetch from each account in parallel on the frontend — adds complexity, multiple network calls, and doesn't support unified search/sort.

## R3: Icon Refresh Button

**Decision**: Replace the text button with an inline SVG refresh icon (circular arrows). Use the existing `refreshPrices.isPending` state for a CSS spin animation.

**Rationale**: Standard UX pattern. No external icon library needed — a simple SVG is sufficient and avoids adding dependencies.
