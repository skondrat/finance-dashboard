# Research: Networth Tab

**Branch**: `018-networth-tab` | **Date**: 2026-03-29

## Decision Log

### 1. NetworthAccount Model Design

**Decision**: Create a new `networth_accounts` table separate from the existing `accounts` table (which is for investment/portfolio accounts).

**Rationale**: The existing `Account` model is tightly coupled to `InvestmentTransaction` — it represents brokerage accounts with buy/sell transactions. Networth manual accounts are fundamentally different: they store a single balance that the user updates manually. Mixing them into one table would require nullable fields and conditional logic everywhere.

**Alternatives considered**:
- Reuse `accounts` table with a discriminator column → rejected because it would complicate all existing portfolio queries and the Account→InvestmentTransaction relationship
- Store in a JSON file → rejected because it bypasses the existing SQLAlchemy/Alembic pipeline

### 2. Investment Data Source for Networth

**Decision**: Reuse existing `/api/v1/portfolio/positions` endpoint (grouped by account) to get per-account investment totals. Call it from the frontend and combine with manual account data client-side.

**Rationale**: The portfolio service already calculates current positions with prices and currency conversion. Creating a separate backend endpoint that duplicates this logic would violate DRY. The frontend already has `usePositions()` and `useAccounts()` hooks.

**Alternatives considered**:
- Backend aggregation endpoint that combines manual + investment data → rejected as unnecessary complexity; the frontend can sum two API responses easily
- New backend service that imports portfolio_service → rejected because it creates tight coupling between unrelated domains

### 3. Currency Conversion for Manual Accounts

**Decision**: Use the existing `fx_service.get_rate()` on the backend when returning the networth summary, converting each account's balance to the requested currency.

**Rationale**: The backend already handles FX conversion for portfolio values. Doing it server-side keeps the frontend simple and consistent with how portfolio values are already converted.

**Alternatives considered**:
- Frontend-side conversion using `useLatestRate()` → rejected because it would require N rate fetches for N currencies, and the backend already has cached rates

### 4. Inline Editing Approach

**Decision**: Use a click-to-edit pattern on the balance cell — clicking turns the cell into an input, pressing Enter or blurring saves via PATCH mutation.

**Rationale**: The income-manager component already implements a similar inline add/edit pattern with state toggling. This is the simplest UX for quick balance updates (spec requirement: 2 clicks or fewer).

**Alternatives considered**:
- Contenteditable div → rejected due to number formatting complexity
- Separate edit modal → rejected because it adds unnecessary friction for a single-field update

### 5. Account Type Field

**Decision**: Store `account_type` as a free-text string with suggested defaults ("bank", "crypto", "cash"). No enum constraint.

**Rationale**: The spec says types are "informational labels" that don't affect calculations. A free-text field is simpler and lets users categorize however they want. The UI can suggest common types without enforcing them.

**Alternatives considered**:
- Strict enum → rejected because it limits flexibility for no functional benefit
- No type field at all → rejected because grouping/filtering by type could be useful visually
