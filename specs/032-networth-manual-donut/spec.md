# Feature Specification: Networth Manual Import & Composition Donut Chart

**Feature Branch**: `032-networth-manual-donut`
**Created**: 2026-03-30
**Status**: Draft
**Input**: User description: "In Networth Tab, add Import previous networth option under gear button (modal with month/year/value, stored with manual flag), Remove all manual NW entries option, and a donut chart with networth components alongside an Account/Type selector."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Import Previous Networth Entry (Priority: P1)

A user wants to record historical networth values from before they started using the dashboard. They click the gear button on the Networth tab and select "Import previous networth." A modal appears where they select a month and year, then enter a total networth value. After submitting, the entry is saved and appears on the networth history chart, giving them a more complete picture of their financial trajectory.

**Why this priority**: This is the primary new capability requested. Without it, users have no way to fill in historical networth data, making the networth trend chart incomplete for long-time users who started tracking recently.

**Independent Test**: Can be fully tested by opening the gear menu, selecting "Import previous networth," filling in the modal fields, and verifying the new data point appears on the networth chart.

**Acceptance Scenarios**:

1. **Given** the user is on the Networth tab, **When** they click the gear button, **Then** they see an "Import previous networth" option in the dropdown menu.
2. **Given** the gear menu is open, **When** the user clicks "Import previous networth," **Then** a modal opens with month selector, year selector, and value input field.
3. **Given** the modal is open, **When** the user selects a month, year, and enters a value, then clicks submit, **Then** the entry is saved and the networth chart updates to include the new data point.
4. **Given** the modal is open, **When** the user selects a month/year combination that already has a snapshot, **Then** the system prevents duplicate entry and informs the user that a snapshot already exists for that period.
5. **Given** the modal is open, **When** the user submits without filling all required fields, **Then** the system shows validation errors for the missing fields.

---

### User Story 2 - Networth Composition Donut Chart (Priority: P2)

A user wants to understand what their networth is composed of. Next to the networth history line chart, they see a donut chart that visually breaks down their current networth by component. They can switch between viewing the breakdown by Account (e.g., "Coinbase," "Bank of America," "Interactive Brokers") or by Type (e.g., ETF, Crypto, Bank, Cash). This gives them immediate insight into how their wealth is distributed.

**Why this priority**: This adds significant analytical value to the Networth tab, helping users understand their asset allocation at a glance. It reuses an existing UI pattern from the Portfolio tab's allocation chart.

**Independent Test**: Can be fully tested by navigating to the Networth tab and verifying the donut chart renders with correct proportions, then switching between Account and Type views to confirm data changes accordingly.

**Acceptance Scenarios**:

1. **Given** the user is on the Networth tab, **When** the page loads, **Then** a donut chart is displayed to the right of the networth history chart showing the composition breakdown.
2. **Given** the donut chart is visible, **When** the user hovers over a segment, **Then** a tooltip shows the component name, value, and percentage of total networth.
3. **Given** the donut chart is visible, **When** the user selects "Account" view, **Then** the chart shows networth broken down by individual account (e.g., brokerage, bank, crypto exchange).
4. **Given** the donut chart is visible, **When** the user selects "Type" view, **Then** the chart shows networth broken down by asset type (ETF, Crypto, Bank, Cash).
5. **Given** the user has no accounts or assets, **When** the page loads, **Then** the donut chart shows an appropriate empty state.

---

### User Story 3 - Remove All Manual Networth Entries (Priority: P3)

A user who previously imported manual networth entries decides they want to clear all of them (e.g., they now have enough auto-generated snapshots, or they entered incorrect data). They click the gear button and select "Remove all manual NW entries." After confirming, all manually imported entries are deleted and the chart updates.

**Why this priority**: This is a cleanup/management action that complements Story 1. It's lower priority because it's used less frequently, but important for data hygiene.

**Independent Test**: Can be fully tested by first importing manual entries (Story 1), then using the remove option and verifying all manual entries are gone while auto-generated snapshots remain.

**Acceptance Scenarios**:

1. **Given** the user is on the Networth tab, **When** they click the gear button, **Then** they see a "Remove all manual NW entries" option in the dropdown menu.
2. **Given** manual entries exist, **When** the user clicks "Remove all manual NW entries," **Then** a confirmation dialog appears warning that all manually imported networth entries will be permanently deleted.
3. **Given** the confirmation dialog is shown, **When** the user confirms, **Then** all entries flagged as "manual" are deleted and the networth chart updates to reflect only auto-generated snapshots.
4. **Given** the confirmation dialog is shown, **When** the user cancels, **Then** no entries are deleted and the dialog closes.
5. **Given** no manual entries exist, **When** the user opens the gear menu, **Then** the "Remove all manual NW entries" option is either disabled or hidden.

---

### Edge Cases

- What happens when the user enters a networth value of zero or a negative number? Zero should be allowed (valid networth); negative values should be allowed (net debt).
- What happens when the user tries to import a networth entry for a future month? The system should prevent selecting months beyond the current month.
- What happens when deleting manual entries and the chart has only manual entries? The chart should show an empty state after deletion.
- What happens when the donut chart has many small segments? Segments below a threshold (e.g., 2% of total) should be grouped into an "Other" category to keep the chart readable.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an "Import previous networth" option in the Networth tab's gear/settings dropdown menu.
- **FR-002**: System MUST display a modal when "Import previous networth" is selected, containing month selector, year selector, and networth value input.
- **FR-003**: System MUST store manually imported networth entries with a "manual" flag to distinguish them from auto-generated snapshots.
- **FR-004**: System MUST prevent duplicate entries for the same month/year combination, showing an appropriate error message.
- **FR-005**: System MUST validate that the selected month/year is not in the future.
- **FR-006**: System MUST provide a "Remove all manual NW entries" option in the gear/settings dropdown menu.
- **FR-007**: System MUST require user confirmation before deleting all manual entries.
- **FR-008**: System MUST only delete entries flagged as "manual" when the bulk remove action is performed, preserving auto-generated snapshots.
- **FR-009**: System MUST display a donut chart to the right of the networth history chart showing networth composition.
- **FR-010**: System MUST provide a view selector for the donut chart with at least two options: "Account" (per account breakdown) and "Type" (per asset type: ETF, Crypto, Bank, Cash).
- **FR-011**: System MUST show tooltips on donut chart segments displaying the component name, value, and percentage.
- **FR-012**: System MUST update the networth chart immediately after importing or removing manual entries without requiring a page refresh.
- **FR-013**: System MUST allow zero and negative networth values in manual imports.

### Key Entities

- **Manual Networth Snapshot**: A user-provided historical networth data point for a specific month/year, distinguished from auto-generated snapshots by a "manual" flag. Key attributes: month, year, value, source flag (manual vs. auto).
- **Networth Composition Segment**: A breakdown component of the user's current networth, representing either an account or an asset type. Key attributes: label, value, percentage of total.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can import a historical networth entry in under 30 seconds (open modal, fill fields, submit).
- **SC-002**: The donut chart accurately reflects the current networth composition, with segment values summing to 100% of total networth.
- **SC-003**: Users can switch between Account and Type views on the donut chart and see updated data within 1 second.
- **SC-004**: Bulk removal of manual entries completes and the chart updates within 2 seconds.
- **SC-005**: Manual entries are visually distinguishable or clearly labeled on the networth history chart so users know which data points are auto-generated vs. manually imported.

## Assumptions

- The existing gear/settings dropdown on the Networth tab will be extended with new menu items (not replaced).
- The "Show Debts" toggle currently in the gear menu will remain alongside the new options.
- The donut chart follows the same visual style as the existing allocation donut chart in the Portfolio tab (color scheme, tooltip format, center label).
- The networth composition data for the donut chart is derived from the user's current accounts and assets, not from historical snapshots.
- Asset types for the "Type" view are: ETF, Crypto, Bank, and Cash (as specified by the user), matching the types already tracked in the portfolio system.
- The month/year selector in the import modal allows selection from a reasonable historical range (e.g., the past 10 years up to the current month).
- Currency for manual entries follows the user's current display currency setting.
