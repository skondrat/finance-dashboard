# Feature Specification: Net Worth History

**Feature Branch**: `022-networth-history`
**Created**: 2026-03-29
**Status**: Draft
**Input**: User description: "Track net worth over time with automatic monthly snapshots and a line chart. Auto-snapshot: whenever any networth account balance is created or updated, auto-save/overwrite the current month's snapshot (total net worth + per-account breakdown). Display a line chart at the top of the networth page showing net worth trend over time with time range selector (6M, YTD, 1Y, ALL). No history table needed. Monthly granularity."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Net Worth Trend Over Time (Priority: P1)

As a user tracking my finances, I want to see a line chart showing how my total net worth has changed over time so that I can understand whether my wealth is growing or shrinking.

**Why this priority**: The chart is the core deliverable — without it there is no visible value from snapshot data.

**Independent Test**: Navigate to the networth page with at least 2 months of snapshot data and verify the line chart displays the trend correctly with labeled axes and data points.

**Acceptance Scenarios**:

1. **Given** I have net worth snapshots for multiple months, **When** I view the networth page, **Then** I see a line chart at the top showing my total net worth over time.
2. **Given** I am viewing the net worth chart, **When** I select a time range (6M, YTD, 1Y, ALL), **Then** the chart updates to show only data within that range.
3. **Given** I have only one month of snapshot data, **When** I view the chart, **Then** it shows a single data point (no line, just a dot).
4. **Given** I have no snapshot data, **When** I view the networth page, **Then** the chart area shows a message indicating no history is available yet.

---

### User Story 2 - Automatic Monthly Snapshots (Priority: P1)

As a user, I want the system to automatically capture a snapshot of my net worth whenever I create or update an account balance so that my history is tracked without any manual action.

**Why this priority**: Without snapshots, the chart has no data to display. This is equally critical as the chart itself.

**Independent Test**: Create or update a networth account and verify that a snapshot record is saved for the current month containing the total net worth and per-account breakdown.

**Acceptance Scenarios**:

1. **Given** I create a new networth account with a balance, **When** the account is saved, **Then** a snapshot for the current month is automatically created or updated with the new total net worth.
2. **Given** I update an existing account's balance, **When** the update is saved, **Then** the current month's snapshot is overwritten with the recalculated total net worth.
3. **Given** a snapshot already exists for the current month, **When** I update any account, **Then** the existing snapshot is replaced (not duplicated) with the latest totals.
4. **Given** I have accounts in multiple currencies, **When** a snapshot is taken, **Then** the total net worth is stored in the user's preferred display currency.

---

### Edge Cases

- What happens when a user deletes an account? The current month's snapshot should be recalculated to reflect the removal.
- What happens when currency conversion rates are unavailable? The snapshot should still be saved using the best available rate, with unconvertible accounts excluded from the total (matching existing networth summary behavior).
- What happens when the user has no accounts? No snapshot should be created if total net worth is zero and no accounts exist.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST automatically create or update a monthly net worth snapshot whenever a networth account is created, updated, or deleted.
- **FR-002**: Each snapshot MUST store the snapshot date (year-month), total net worth, and per-account balance breakdown.
- **FR-003**: Only one snapshot per month per user may exist; subsequent changes within the same month MUST overwrite the existing snapshot.
- **FR-004**: The networth page MUST display a line chart showing total net worth over time at the top of the page, above existing content.
- **FR-005**: The chart MUST include a time range selector with options: 6M, YTD, 1Y, ALL.
- **FR-006**: The chart MUST display month labels on the x-axis and currency-formatted values on the y-axis.
- **FR-007**: When no snapshot history exists, the chart area MUST display an appropriate empty state message.
- **FR-008**: Snapshots MUST use the user's currently selected display currency for the total net worth value.

### Key Entities

- **NetworthSnapshot**: A monthly record of the user's total net worth. Key attributes: user, date (year-month), total net worth value, currency, per-account breakdown.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can see their net worth trend within 1 second of loading the networth page.
- **SC-002**: Snapshots are captured automatically with zero manual steps from the user.
- **SC-003**: The chart correctly reflects all account balance changes made within a given month.
- **SC-004**: Users can switch between time ranges (6M, YTD, 1Y, ALL) and see the chart update immediately.

## Assumptions

- The existing networth summary endpoint (which aggregates manual + investment accounts with currency conversion) will be reused to compute snapshot values.
- Recharts (already in project dependencies) will be used for the line chart, consistent with other charts in the application.
- Monthly granularity is sufficient — no need for daily or weekly snapshots since manual account balances don't change frequently.
- Investment account values (from the portfolio tab) are included in the snapshot total, matching the existing networth summary behavior.
- Historical snapshots are immutable once the month has passed; only the current month's snapshot can be overwritten.
