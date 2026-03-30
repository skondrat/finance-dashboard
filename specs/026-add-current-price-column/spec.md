# Feature Specification: Add Current Price Column

**Feature Branch**: `026-add-current-price-column`
**Created**: 2026-03-30
**Status**: Draft
**Input**: User description: "I don't see current price anywhere, that's bad. Add it."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See Current Price Per Unit in Positions Table (Priority: P1)

A user viewing the portfolio positions table wants to see the current market price per unit for each asset, alongside the existing buy-in price. Currently the table shows Asset, Buy In, Position (total value), P/L, and Weight — but not the current price per unit. Without it, users cannot quickly compare what they paid vs. what the asset trades at now.

**Why this priority**: This is the only user story — the current price is essential financial data that's missing from the positions view.

**Independent Test**: Navigate to /portfolio and verify that each position row shows the current price per unit in a dedicated column, formatted as currency.

**Acceptance Scenarios**:

1. **Given** a user with portfolio positions that have current price data, **When** they view the positions table, **Then** each row displays a "Current" column showing the latest price per unit formatted as currency.
2. **Given** a user viewing positions, **When** they compare the "Buy In" and "Current" columns, **Then** they can immediately see how the price has moved for each asset.
3. **Given** a position where current price data is unavailable (zero), **When** the user views that row, **Then** the current price column shows a dash or zero indicator rather than a misleading value.

---

### Edge Cases

- What happens when current price is zero (no price data fetched yet)? Show "—" or €0.00 to indicate no data.
- The column should be sortable, consistent with all other columns in the positions table.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The positions table MUST include a "Current" column showing the current price per unit for each asset.
- **FR-002**: The "Current" column MUST be placed between the "Buy In" and "Position" columns for logical reading order (paid → current → total value).
- **FR-003**: The current price MUST be formatted as currency consistent with the rest of the table.
- **FR-004**: The "Current" column MUST be sortable like all other columns in the table.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every position row displays the current price per unit in a visible, dedicated column.
- **SC-002**: Users can sort the positions table by current price.
- **SC-003**: The column layout reads naturally: Asset → Buy In → Current → Position → P/L → Weight.

## Assumptions

- The current price data is already available in the positions API response (the `current_price` field exists but is not displayed).
- This is a frontend-only change — no backend modifications needed.
- The column header label will be "Current" to be concise and consistent with "Buy In".
