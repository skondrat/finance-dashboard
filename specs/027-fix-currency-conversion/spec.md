# Feature Specification: Fix Currency Conversion

**Feature Branch**: `027-fix-currency-conversion`
**Created**: 2026-03-30
**Status**: Draft
**Input**: User description: "The EUR/USD toggle only changes the currency symbol but values stay the same. All values must be recalculated using real exchange rates. Prices from data providers may be in different currencies than displayed — need proper conversion. Exchange rates should be fetched once per day, cached, and reused."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - EUR/USD Toggle Recalculates All Portfolio Values (Priority: P1)

A user views their portfolio in EUR (default) and toggles to USD. Currently only the currency symbol changes (e.g., €360K becomes $360K with the same number). After this fix, switching to USD should recalculate all values using the real EUR/USD exchange rate: net worth, positions, P/L, KPIs, allocation, and performance breakdown should all reflect actual USD-equivalent amounts.

**Why this priority**: The currency toggle is prominently visible in the UI and currently misleads users by showing incorrect values. This is the core problem.

**Independent Test**: Toggle from EUR to USD on the portfolio page. Verify that all numeric values change proportionally by the EUR/USD exchange rate (e.g., if rate is ~1.08, €360K should become ~$389K, not $360K).

**Acceptance Scenarios**:

1. **Given** a user viewing the portfolio in EUR, **When** they toggle to USD, **Then** all monetary values (net worth, positions, P/L, cost basis, current prices) are recalculated using the current EUR/USD exchange rate.
2. **Given** a user viewing positions in USD, **When** they look at individual position values, **Then** buy-in prices, current prices, position values, and P/L are all converted to USD equivalents.
3. **Given** a user toggles back from USD to EUR, **When** the page updates, **Then** all values return to their original EUR amounts.

---

### User Story 2 - Store Prices in Their Native Currency and Convert on Display (Priority: P1)

Asset prices from data providers come in different native currencies (e.g., London-listed ETFs in USD, crypto from CoinGecko in EUR). The system must track each price's native currency and convert to the user's display currency using the correct exchange rate. Currently, all prices are stored and displayed as if they were EUR regardless of their actual currency.

**Why this priority**: Without this, the base data is incorrect — all downstream calculations (positions, P/L, net worth) are wrong. This must be fixed alongside the toggle.

**Independent Test**: Check that a position bought in EUR with a price fetched in USD shows the correct EUR-equivalent current value (price × quantity × exchange rate), not just the raw USD number with a EUR symbol.

**Acceptance Scenarios**:

1. **Given** an asset whose price is fetched in USD (e.g., IUAA.L trades in USD on LSE), **When** the portfolio is displayed in EUR, **Then** the current price and value are converted from USD to EUR using the day's exchange rate.
2. **Given** an asset whose price is fetched in EUR (e.g., CoinGecko returns EUR prices for crypto), **When** the portfolio is displayed in EUR, **Then** no conversion is applied — values display as-is.
3. **Given** the same portfolio displayed in USD, **When** the user views crypto positions, **Then** the EUR-denominated crypto prices are converted to USD.

---

### User Story 3 - Cache Exchange Rates Daily (Priority: P2)

The system fetches exchange rates once per day and caches them in the database. Subsequent requests on the same day reuse the cached rate rather than making another external call. This ensures consistency within a day and minimizes external API calls.

**Why this priority**: Performance and reliability — avoids hammering external APIs on every page load and ensures stable values within a trading day.

**Independent Test**: Trigger two portfolio loads on the same day. Verify the exchange rate API is called only once and both requests use the same cached rate.

**Acceptance Scenarios**:

1. **Given** no exchange rate exists for today, **When** a portfolio calculation requires a conversion, **Then** the system fetches the current rate from an external source and stores it.
2. **Given** today's exchange rate already exists in the cache, **When** a portfolio calculation requires a conversion, **Then** the cached rate is used without an external call.
3. **Given** the external rate source is temporarily unavailable, **When** a conversion is needed, **Then** the system falls back to the most recent available rate.

---

### Edge Cases

- What happens when the exchange rate API is down? Fall back to the most recent cached rate.
- What happens for assets with no known native currency? Assume the currency stored on the Asset record; if absent, assume USD for stocks and EUR for crypto (matching current provider defaults).
- What happens on weekends/holidays when no new rate is published? Use the last available rate.
- How are historical P/L calculations affected? Use the exchange rate from the date of each transaction for cost basis conversion, and today's rate for current value conversion.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST convert all monetary values when the user switches between EUR and USD, using real exchange rates — not just swapping the currency symbol.
- **FR-002**: System MUST store the native currency of each fetched price alongside the price value.
- **FR-003**: System MUST fetch the EUR/USD exchange rate from a free external source once per day and cache it for reuse.
- **FR-004**: System MUST convert prices from their native currency to the user's display currency before calculating positions, P/L, and portfolio KPIs.
- **FR-005**: System MUST fall back to the most recent available exchange rate when the external source is unavailable.
- **FR-006**: System MUST use the transaction's original currency for cost basis, converting to the display currency at the current rate for P/L calculations.
- **FR-007**: Percentage values (return %, weight, P/L %) MUST remain the same regardless of display currency — only absolute monetary values change.

### Key Entities

- **ExchangeRate**: Stores daily exchange rates between currency pairs. Key attributes: base currency, target currency, rate, date.
- **AssetPrice** (existing, modified): Needs to track the native currency of the stored price.
- **Asset** (existing): Already has a currency field that indicates the asset's trading currency.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Toggling from EUR to USD changes all monetary values by the correct exchange rate factor (within 1% of the real-time rate).
- **SC-002**: Toggling back to EUR returns all values to their original amounts.
- **SC-003**: The exchange rate is fetched at most once per day per currency pair — subsequent loads use the cached value.
- **SC-004**: Positions with prices in different native currencies all display correctly in the user's chosen display currency.
- **SC-005**: Percentage-based values (return %, weight) remain unchanged when switching currencies.

## Assumptions

- Only EUR and USD are supported as display currencies (matching the existing toggle).
- The free exchange rate source does not require an API key (or a free-tier key is sufficient).
- Transaction cost basis is stored in the currency it was originally entered in (the `currency` field on each transaction).
- For simplicity, a single daily spot rate is used for all conversions within a day (not intraday fluctuations).
- The existing `currency` field on the Asset model accurately reflects the asset's trading currency.
