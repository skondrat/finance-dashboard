# Feature Specification: Account Filter & KPI Style

**Feature Branch**: `030-account-filter-kpi-style`
**Created**: 2026-03-30
**Status**: Draft
**Input**: User description: "Account selection should go to the very top. Performance chart depends on it — selecting one account shows performance only for it. Also remove green background from KPI numbers."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Global Account Selector at Top (Priority: P1)

The account selector tabs (Aggregated, Interactive Brokers, Kraken) are currently inside the Positions section. They should move to the very top of the portfolio page — above the KPI strip — so that selecting an account filters everything: KPIs, performance chart, positions, and transactions. Currently the performance chart always shows the aggregated portfolio regardless of which account is selected.

**Why this priority**: The account filter is the primary navigation control for the portfolio. Having it buried inside Positions and not affecting the chart/KPIs makes the page inconsistent.

**Independent Test**: Select "Interactive Brokers" from the top account tabs. Verify that KPIs, performance chart, positions, and transactions all update to show only Interactive Brokers data. Switch back to "Aggregated" — verify everything shows the full portfolio again.

**Acceptance Scenarios**:

1. **Given** the portfolio page loads, **When** the user looks at the top of the page, **Then** account tabs (Aggregated + each account) are visible above the KPI strip.
2. **Given** the user selects "Interactive Brokers", **When** the page updates, **Then** KPIs show only Interactive Brokers totals, performance chart shows only IB performance, positions show only IB positions, and transactions show only IB transactions.
3. **Given** the user selects "Aggregated", **When** the page updates, **Then** all views return to showing the full portfolio across all accounts.

---

### User Story 2 - Remove Green Background from KPI Numbers (Priority: P2)

The Total Return and Return % KPI cards show positive values with a green background box that looks heavy and inconsistent with the rest of the UI. The green text color should remain, but the background highlight should be removed — just green text on the dark card background.

**Why this priority**: Visual polish — the green boxes are distracting and don't match the design language of other values on the page.

**Independent Test**: View the KPI strip. Verify that Total Return and Return % show green-colored text without any background highlight/box behind the numbers.

**Acceptance Scenarios**:

1. **Given** the portfolio has positive returns, **When** the user views the KPI strip, **Then** Total Return and Return % display as green text without a colored background box.
2. **Given** negative returns, **When** the user views the KPI strip, **Then** values display as red text without a colored background box.

---

### Edge Cases

- What happens when a newly created account has no transactions? The filtered view should show empty states (€0 KPIs, empty chart, no positions).
- What happens when switching accounts rapidly? Each selection should cancel the previous and show the correct data.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The account selector tabs (Aggregated + each account) MUST be positioned at the top of the portfolio page, above the KPI strip.
- **FR-002**: Selecting an account MUST filter ALL portfolio views: KPIs, performance chart, positions, allocation, performance breakdown, and transactions.
- **FR-003**: The performance chart MUST show data only for the selected account (or all accounts when Aggregated is selected).
- **FR-004**: KPI values (Net Worth, Total Return, etc.) MUST reflect only the selected account's data.
- **FR-005**: Positive KPI values MUST display with green text color only — no colored background box or highlight.
- **FR-006**: Negative KPI values MUST display with red text color only — no colored background box or highlight.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Account tabs are visible above the KPI strip on the portfolio page.
- **SC-002**: Selecting a specific account changes all displayed data (KPIs, chart, positions, transactions) to that account only.
- **SC-003**: KPI number values have no background color — only text color indicates positive (green) or negative (red).
- **SC-004**: Switching between Aggregated and a specific account shows different Net Worth values.

## Assumptions

- The backend already supports `account_id` filtering on positions and summary endpoints (it does — `?account_id=` parameter exists).
- The performance chart endpoint supports account filtering (needs verification — may need to add `account_id` parameter).
- The account selector is extracted from `PositionsList` component and moved to the page level.
