# Feature Specification: Fix Portfolio Prices

**Feature Branch**: `025-fix-portfolio-prices`
**Created**: 2026-03-30
**Status**: Draft
**Input**: User description: "Install missing price provider packages, fix crypto asset types, and enable live portfolio price fetching so positions display correct current values"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Portfolio Shows Current Position Values (Priority: P1)

A user navigates to the Portfolio page and sees their positions with up-to-date market values, P/L, and allocation weights. Currently all positions show €0.00 because no price data exists in the system and the price provider packages are not installed.

**Why this priority**: This is the core problem — without prices, the entire portfolio page is useless. Every KPI, chart, and position row depends on current asset prices.

**Independent Test**: Navigate to /portfolio after price data has been fetched. Verify that positions (IUAA, ISAC, BTC, ETH) show non-zero current prices, current values, P/L amounts, and percentage weights.

**Acceptance Scenarios**:

1. **Given** a user with investment transactions, **When** they visit the portfolio page, **Then** all positions display current prices, values, and P/L calculated from those prices.
2. **Given** a user with stock/ETF positions (IUAA, ISAC), **When** prices are fetched, **Then** the system retrieves prices from a stock market data provider.
3. **Given** a user with crypto positions (BTC, ETH), **When** prices are fetched, **Then** the system retrieves prices from a cryptocurrency data provider.
4. **Given** price data exists, **When** the user views KPIs, **Then** Net Worth, Total Return, Return %, and Invested Capital reflect accurate calculations.

---

### User Story 2 - Crypto Assets Use Correct Provider (Priority: P1)

Crypto assets (BTC, ETH) are currently classified as "stock" in the database, causing the system to query a stock market provider instead of a cryptocurrency provider. The asset types must be corrected so the right provider is used.

**Why this priority**: Without correct asset types, crypto prices will never be fetched even when providers are working. This is a data integrity issue that blocks price fetching for crypto.

**Independent Test**: Trigger a price refresh and verify that BTC and ETH prices are fetched from the cryptocurrency provider, not the stock provider.

**Acceptance Scenarios**:

1. **Given** BTC and ETH exist as assets, **When** the system determines which price provider to use, **Then** it routes them to the cryptocurrency provider.
2. **Given** IUAA and ISAC exist as assets, **When** the system determines which price provider to use, **Then** it routes them to the stock market provider.

---

### User Story 3 - Manual Price Refresh (Priority: P2)

A user can trigger a price refresh from the portfolio page to get the latest prices for all their held assets. The system fetches prices from the appropriate providers and updates the display.

**Why this priority**: Users need a way to get fresh prices on demand. This is the existing mechanism (refresh-prices endpoint) that currently fails silently because providers are not installed.

**Independent Test**: Click a refresh button on the portfolio page and verify that the asset prices are populated and positions update with new values.

**Acceptance Scenarios**:

1. **Given** a user on the portfolio page, **When** they trigger a price refresh, **Then** the system fetches current prices for all held assets and the portfolio values update.
2. **Given** a price provider is temporarily unavailable, **When** a refresh is triggered, **Then** the system gracefully handles the failure and shows existing prices (or indicates no data).

---

### User Story 4 - Automatic Price Refresh on Page Load (Priority: P3)

When a user navigates to the portfolio page, prices are automatically refreshed if they are stale (e.g., older than 1 hour), so users always see reasonably current data without manual intervention.

**Why this priority**: Convenience feature that removes the need for users to remember to manually refresh. Less critical than getting prices working at all.

**Independent Test**: Navigate to the portfolio page when price data is more than 1 hour old. Verify that prices are automatically refreshed without user action.

**Acceptance Scenarios**:

1. **Given** prices are older than the staleness threshold, **When** the user loads the portfolio page, **Then** a price refresh is triggered automatically in the background.
2. **Given** prices were refreshed recently (within threshold), **When** the user loads the portfolio page, **Then** no automatic refresh occurs and cached prices are used.

---

### Edge Cases

- What happens when a price provider API is down or rate-limited? System should use the most recent cached price and not show misleading zero values.
- What happens when a new asset is added that the provider doesn't recognize (e.g., delisted ticker)? The asset should show the buy-in price as a fallback.
- How does the system handle assets with no price history at all (first-ever fetch)? Positions should still display with cost basis data even if current price is unavailable.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST have all required price provider packages installed and operational.
- **FR-002**: System MUST classify crypto assets (BTC, ETH) with the correct "crypto" type so the cryptocurrency provider is used for price lookups.
- **FR-003**: System MUST classify stock/ETF assets (IUAA, ISAC) with the correct type so the stock market provider is used for price lookups.
- **FR-004**: System MUST fetch and store current prices for all held assets when a price refresh is triggered.
- **FR-005**: System MUST calculate position current values, P/L, and weights using the latest available prices.
- **FR-006**: System MUST handle provider failures gracefully without crashing or showing misleading data.
- **FR-007**: System SHOULD automatically refresh prices when the user loads the portfolio page and prices are stale (older than 1 hour).

### Key Entities

- **Asset**: Represents a financial instrument (stock, ETF, cryptocurrency). Has a type field that determines which price provider is used.
- **AssetPrice**: Stores historical and current price data for assets. Keyed by asset + date. Used to calculate position values.
- **Position**: A derived view combining transaction history with current prices to show holdings, cost basis, and P/L.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All portfolio positions display non-zero current prices and values when the user has active holdings.
- **SC-002**: Portfolio KPIs (Net Worth, Total Return, Return %) reflect accurate calculations based on current market prices.
- **SC-003**: Crypto assets retrieve prices from a cryptocurrency-specific data source.
- **SC-004**: Stock/ETF assets retrieve prices from a stock market data source.
- **SC-005**: Price refresh completes within 10 seconds for a portfolio with up to 20 distinct assets.
- **SC-006**: The portfolio page shows current data without requiring the user to manually trigger a refresh on every visit.

## Assumptions

- The Finnhub API key has been configured in the environment (already done).
- The CoinGecko free API does not require an API key.
- Price providers return prices in EUR or a convertible currency. Full multi-currency conversion is out of scope for this feature.
- The existing refresh-prices endpoint and portfolio service logic are correct — only the missing packages and wrong asset types need to be fixed.
- "Stale" prices for auto-refresh means older than 1 hour (reasonable default for a personal finance dashboard).
- Finnhub uses exchange-specific tickers for European ETFs (e.g., IUAA may need a suffix like ".DE" or ".L").
