# Research: Fix Portfolio Prices

**Feature**: 025-fix-portfolio-prices
**Date**: 2026-03-30

## R1: Package Installation Status

**Decision**: Install `finnhub-python` and `pycoingecko` via pip — they are already listed in `pyproject.toml` but not installed in the active environment.

**Rationale**: Both packages are declared as dependencies (`finnhub-python>=2.4.0`, `pycoingecko>=3.1.0`) in `backend/pyproject.toml` but `import finnhub` and `from pycoingecko import CoinGeckoAPI` both fail at runtime. The backend's `PriceProvider` classes silently catch `ImportError` and set `self._client = None`, causing all `fetch_price()` calls to return `None`.

**Alternatives considered**: None — these are the intended packages.

## R2: Crypto Asset Type Mismatch

**Decision**: Update BTC and ETH `asset_type` from `"stock"` to `"crypto"` in the database.

**Rationale**: The `get_provider()` function routes `asset_type == "crypto"` to `CoinGeckoProvider` and everything else to `FinnhubProvider`. BTC and ETH are currently typed as `"stock"`, so they'd be routed to Finnhub, which doesn't have crypto prices. The Asset model allows `stock`, `etf`, `crypto`, `bond` as valid types.

**Alternatives considered**: Add crypto ticker support to Finnhub provider — rejected because Finnhub is a stock/ETF data provider, not a crypto provider.

## R3: CoinGecko ID Mapping

**Decision**: Add a ticker→CoinGecko ID mapping to the `CoinGeckoProvider`. The current code does `cg_id = ticker.lower()` which produces `"btc"` and `"eth"`, but CoinGecko's API requires full IDs: `"bitcoin"` and `"ethereum"`.

**Rationale**: CoinGecko's `/simple/price` endpoint uses coin IDs (e.g., `"bitcoin"`, `"ethereum"`), not ticker symbols. Passing `"btc"` as an ID returns no data. A simple static mapping dict covers the common cases; the `/coins/list` endpoint can be used for dynamic lookup if needed later.

**Alternatives considered**:
- Use CoinGecko's symbol-based lookup — rejected because the `ids` parameter has highest priority and symbol lookup is unreliable for duplicate tickers.
- Use `/coins/list` API to dynamically resolve — over-engineering for 2 assets; can add later.

## R4: Finnhub Ticker Format for European ETFs

**Decision**: IUAA and ISAC are iShares ETFs traded on European exchanges (primarily Xetra). Finnhub requires exchange-specific ticker suffixes for non-US securities. Xetra uses `.DE` suffix (e.g., `IUAA.DE`, `ISAC.DE`). The Asset model's `ticker` field needs to store the Finnhub-compatible ticker, or the provider needs to handle suffix resolution.

**Rationale**: Finnhub's `/quote` endpoint for European securities requires the exchange suffix. Without it, the API returns no data or incorrect US listings. Testing with the Finnhub API will confirm the exact format.

**Alternatives considered**:
- Store exchange suffix in a separate field on the Asset model — adds schema complexity for a simple mapping.
- Add suffix at the provider level based on asset metadata — preferred approach: use the Asset's existing ticker field and update existing records to include the suffix.

## R5: Frontend Price Refresh UX

**Decision**: Add a "Refresh Prices" button to the portfolio page that calls `POST /portfolio/refresh-prices`, and add an auto-refresh hook that triggers on page load when prices are stale (>1 hour old).

**Rationale**: The backend endpoint exists but is not wired to any frontend UI. Users have no way to trigger a price refresh. Additionally, the portfolio summary endpoint could return a `last_refreshed_at` timestamp so the frontend can decide whether to auto-refresh.

**Alternatives considered**:
- Server-side scheduled refresh (cron) — heavier infrastructure, not needed for a personal dashboard.
- Refresh on every page load unconditionally — wastes API calls and adds latency.

## R6: Price Currency Mismatch

**Decision**: Finnhub returns prices in the asset's trading currency (EUR for Xetra ETFs), and CoinGecko supports `vs_currencies` parameter. The current CoinGecko provider hardcodes `"usd"` — this should be changed to `"eur"` to match the portfolio's default currency.

**Rationale**: The portfolio calculates everything in EUR. If CoinGecko returns USD prices for crypto, the P/L calculations will be wrong. Changing the `vs_currencies` parameter to `"eur"` fixes this without needing a currency conversion layer.

**Alternatives considered**: Add currency conversion — out of scope per spec assumptions.
