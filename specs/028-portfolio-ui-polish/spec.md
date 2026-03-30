# Feature Specification: Portfolio UI Polish

**Feature Branch**: `028-portfolio-ui-polish`
**Created**: 2026-03-30
**Status**: Draft
**Input**: User description: "Three portfolio UI improvements: icon refresh button, fix performance chart history, show all transactions in aggregated view"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Performance Chart Shows Full History (Priority: P1)

The performance chart currently only shows a single data point (today). When selecting "MAX" or other time ranges, the chart should display the full portfolio value history starting from the date of the first transaction. Each data point represents the portfolio's total value on that date based on holdings and prices.

**Why this priority**: The performance chart is a key feature — showing only today makes it useless. Users need to see how their portfolio value has changed over time.

**Independent Test**: Navigate to /portfolio, select "MAX" on the performance chart. Verify the chart shows data points spanning from the first transaction date to today, with the portfolio value plotted over time.

**Acceptance Scenarios**:

1. **Given** a user with transactions dating back several months, **When** they select "MAX" on the performance chart, **Then** the chart displays data points from the first transaction date to today.
2. **Given** a user selects "1M" range, **When** the chart renders, **Then** it shows the last 30 days of portfolio value history.
3. **Given** a user selects "YTD", **When** the chart renders, **Then** it shows portfolio value from January 1st of the current year to today.
4. **Given** a user with no price history data, **When** they view the chart, **Then** it shows an empty state or a single data point for today.

---

### User Story 2 - Aggregated View Shows All Transactions (Priority: P2)

When the "Aggregated" tab is selected in the positions section, no transactions are shown below. Currently, the transactions view only appears when a specific account is selected. Users want to see all transactions across all accounts when viewing the aggregated portfolio.

**Why this priority**: Users need a complete transaction history view without having to click into each individual account.

**Independent Test**: Select "Aggregated" in the positions tab. Verify a transactions list appears below showing transactions from all accounts, sorted by date.

**Acceptance Scenarios**:

1. **Given** the user is on the Aggregated tab, **When** the portfolio page loads, **Then** a transactions list shows all transactions from all accounts sorted by most recent first.
2. **Given** the user switches from a specific account to Aggregated, **When** the tab changes, **Then** the transactions view updates to show all transactions instead of hiding.
3. **Given** the user is on the Aggregated tab, **When** they search within transactions, **Then** the search covers transactions from all accounts.

---

### User Story 3 - Compact Refresh Prices Button (Priority: P3)

The "Refresh Prices" button is currently a full text button that takes up too much space. Replace it with a small icon-only button (a refresh/sync icon) that performs the same action. It should still show a loading state while refreshing.

**Why this priority**: Minor visual polish — the current button works but is visually heavy. Less critical than the functional fixes above.

**Independent Test**: Verify the refresh icon button is visible near the KPI strip, clicking it triggers a price refresh, and it shows a spinning/loading state during refresh.

**Acceptance Scenarios**:

1. **Given** the portfolio page is loaded, **When** the user looks at the KPI area, **Then** they see a small refresh icon button instead of a large text button.
2. **Given** the user clicks the refresh icon, **When** prices are being fetched, **Then** the icon shows a loading/spinning state.
3. **Given** the refresh completes, **When** the icon returns to its default state, **Then** all portfolio values are updated with fresh prices.

---

### Edge Cases

- What happens when the performance chart has only one data point (single transaction, no price history)? Show the single point — the chart will be a dot.
- What happens when transactions span different accounts with no overlap? Aggregated transactions should show all of them with an account indicator.
- What if the refresh icon is clicked while already refreshing? The button should be disabled during refresh to prevent double-clicks.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The performance chart MUST display historical data points for all supported time ranges (1D, 1W, 1M, YTD, 1Y, MAX), not just today.
- **FR-002**: The "MAX" range MUST start from the date of the user's first investment transaction.
- **FR-003**: When the "Aggregated" tab is selected, the transactions view MUST display all transactions from all accounts.
- **FR-004**: Aggregated transactions MUST be sorted by date (most recent first).
- **FR-005**: The "Refresh Prices" button MUST be replaced with a compact icon-only button with a tooltip.
- **FR-006**: The refresh icon MUST show a loading/spinning state while prices are being fetched.
- **FR-007**: The refresh icon MUST be disabled during an active refresh to prevent duplicate requests.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The performance chart shows at least 2 data points when "MAX" is selected and the user has transactions spanning multiple days.
- **SC-002**: All time range buttons (1D, 1W, 1M, YTD, 1Y, MAX) produce a chart with the correct date range.
- **SC-003**: The Aggregated transactions view shows transactions from all accounts (count matches sum of individual account transactions).
- **SC-004**: The refresh button occupies less than 48x48 pixels and uses an icon instead of text.
- **SC-005**: Users can trigger a price refresh with a single click on the icon.

## Assumptions

- The backend already returns performance time-series data — the issue is likely that there are no historical price entries in the database, or the query range is too narrow.
- The existing transactions API supports fetching all transactions when no account filter is applied.
- A standard refresh/sync icon (circular arrows) will be used — no custom icon design needed.
- The transactions view component already exists and can be reused with or without an account filter.
