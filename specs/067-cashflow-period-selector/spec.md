# Feature Specification: Cashflow Period Selector

**Feature Branch**: `067-cashflow-period-selector`  
**Created**: 2026-04-03  
**Status**: Draft  
**Input**: User description: "Cashflow tab should have a period selector: Monthly (then month selection is available), Yearly (only year selector), or YTD (only year selector). Based on the selected period, the Sankey chart and all other cashflow components adapt to show data for that period."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Switch Between Period Views (Priority: P1)

A user navigating to the Cashflow tab sees a segmented control offering three period modes: Monthly, Yearly, and YTD. By default, the Monthly view is active (matching current behavior). When the user selects "Yearly", the month picker disappears and only a year selector remains. The Sankey chart, KPI strip, and breakdown row all update to show aggregated data for the entire selected year. When the user selects "YTD", only a year selector shows, and all components display data from January through the last completed month of that year.

**Why this priority**: This is the core feature — without period switching, nothing else works.

**Independent Test**: Select each period mode and verify the UI controls change and data reloads accordingly.

**Acceptance Scenarios**:

1. **Given** the Cashflow tab is open in Monthly mode, **When** the user clicks "Yearly", **Then** the month selector disappears, only the year selector remains, and all components show full-year aggregated data.
2. **Given** the Cashflow tab is open in Monthly mode, **When** the user clicks "YTD", **Then** the month selector disappears, only the year selector remains, and all components show data from January 1 through the end of the last completed month.
3. **Given** the Cashflow tab is open in Yearly mode, **When** the user clicks "Monthly", **Then** the month selector reappears alongside the year selector and data returns to single-month view.

---

### User Story 2 - Yearly Aggregation Shows Correct Data (Priority: P1)

When viewing yearly data, all income sources across all 12 months are summed. All expenses across all 12 months are summed and grouped by category. The Sankey chart shows the same 4-level hierarchy but with annual totals. Savings is calculated as total annual income minus total annual spend minus total annual investments.

**Why this priority**: Correctness of the yearly aggregation is essential for the feature to be useful.

**Independent Test**: Compare the yearly Sankey totals against the sum of individual monthly totals for the same year.

**Acceptance Scenarios**:

1. **Given** the user selects Yearly for a year with data in multiple months, **When** the Sankey loads, **Then** total income equals the sum of all monthly incomes for that year.
2. **Given** the user selects Yearly, **When** the Sankey loads, **Then** expense categories reflect spending across all months, not just one.

---

### User Story 3 - YTD Aggregation Shows Correct Data (Priority: P1)

When viewing YTD, data is aggregated from January through the last fully completed month of the selected year. If the selected year is the current year, YTD covers January through last month. If the selected year is a past year, YTD covers the full year (Jan-Dec).

**Why this priority**: YTD is a distinct calculation from yearly and must handle the current-year boundary correctly.

**Independent Test**: In the current year, verify YTD excludes the current (incomplete) month's data.

**Acceptance Scenarios**:

1. **Given** the current date is April 3, 2026 and the user selects YTD for 2026, **When** data loads, **Then** it includes January through March 2026 only.
2. **Given** the user selects YTD for a past year (e.g., 2025), **When** data loads, **Then** it includes all 12 months of that year.

---

### Edge Cases

- What happens when no data exists for the selected period? The components should show zero values and empty states gracefully.
- What happens when switching periods rapidly? The UI should cancel or ignore stale requests and show the latest selection's data.
- What if the user navigates to the Cashflow tab via a direct URL? The default period should be Monthly with the last completed month selected.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a segmented control with three options: Monthly, Yearly, and YTD on the Cashflow tab.
- **FR-002**: When Monthly is selected, system MUST show both month and year selectors.
- **FR-003**: When Yearly is selected, system MUST show only a year selector and hide the month selector.
- **FR-004**: When YTD is selected, system MUST show only a year selector and hide the month selector.
- **FR-005**: The backend MUST accept a period parameter (monthly, yearly, ytd) and return aggregated data for the appropriate date range.
- **FR-006**: For Yearly period, the backend MUST aggregate income and expenses across all 12 months of the selected year.
- **FR-007**: For YTD period in the current year, the backend MUST aggregate data from January through the last completed month.
- **FR-008**: For YTD period in a past year, the backend MUST aggregate data for all 12 months (same as yearly).
- **FR-009**: All cashflow components (KPI strip, Sankey diagram, breakdown row) MUST update when the period changes.
- **FR-010**: The default period on page load MUST be Monthly with the last completed month selected.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can switch between Monthly, Yearly, and YTD views and see updated data within 2 seconds.
- **SC-002**: Yearly totals match the arithmetic sum of all individual monthly totals for the same year.
- **SC-003**: YTD totals for the current year exclude the current incomplete month's data.
- **SC-004**: All three period modes render the Sankey chart, KPI strip, and breakdown row without errors.

## Assumptions

- The existing budget tab's TimeAggregation component style will be used as the visual reference for the segmented control.
- The existing arrow-based month navigation will be replaced by the new period selector with dropdowns.
- No "Custom" date range is needed for the cashflow tab (only Monthly, Yearly, YTD).
- Income sources are stored per-month; yearly/YTD aggregation sums across the relevant months.
- The year selector will include years that have data, defaulting to the current year.
