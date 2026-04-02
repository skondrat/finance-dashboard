# Feature Specification: Cashflow Month Selector

**Feature Branch**: `044-cashflow-month-selector`  
**Created**: 2026-04-02  
**Status**: Draft  
**Input**: User description: "Should have a proper Month Selector"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navigate to a Previous Month (Priority: P1)

A user opens the Cashflow page and wants to view their cashflow data from two months ago. They click the left arrow on the month selector to navigate backward, and the entire page (KPIs, Sankey diagram, breakdown) refreshes to show data for that month.

**Why this priority**: This is the core purpose of the feature — without month navigation, the page is locked to a single month.

**Independent Test**: Can be fully tested by navigating backward one or more months and verifying all displayed data (KPIs, Sankey, breakdown) updates to reflect the selected month.

**Acceptance Scenarios**:

1. **Given** the Cashflow page is loaded showing March 2026, **When** the user clicks the left arrow, **Then** the page shows February 2026 data in all sections.
2. **Given** the user has navigated to January 2026, **When** the user clicks the left arrow, **Then** December 2025 is shown (correct year rollover).
3. **Given** the user selects a month with no data, **When** the page loads, **Then** KPIs show zero values and the Sankey diagram shows an empty/placeholder state.

---

### User Story 2 - Default to Last Completed Month (Priority: P1)

A user opens the Cashflow page for the first time (or refreshes). The month selector defaults to the last fully completed calendar month so the user immediately sees relevant, complete data.

**Why this priority**: The default behavior sets user expectations and must show meaningful data without any interaction.

**Independent Test**: Open the Cashflow page on April 2, 2026 and verify March 2026 is selected by default.

**Acceptance Scenarios**:

1. **Given** today is April 2, 2026, **When** the user opens the Cashflow page, **Then** "March 2026" is displayed in the month selector and the data corresponds to March 2026.
2. **Given** today is January 15, 2026, **When** the user opens the Cashflow page, **Then** "December 2025" is displayed.

---

### User Story 3 - Cannot Select Future Months (Priority: P2)

The month selector prevents users from navigating to future months or the current (incomplete) month, since no complete data exists for those periods.

**Why this priority**: Prevents confusing empty states and sets clear boundaries on available data.

**Independent Test**: Attempt to navigate forward past the last completed month and verify the forward arrow is disabled.

**Acceptance Scenarios**:

1. **Given** the last completed month is March 2026, **When** the user is viewing March 2026, **Then** the right (forward) arrow is disabled or hidden.
2. **Given** the user is viewing February 2026, **When** the user clicks the right arrow, **Then** March 2026 is shown and the right arrow becomes disabled.

---

### Edge Cases

- What happens when data exists for income but not expenses in a selected month? The page should still render with income-only data and zero spending.
- What happens when the user rapidly clicks the navigation arrows? The system should handle rapid month changes gracefully, showing the final selected month's data.
- How far back can the user navigate? There is no minimum date restriction — the user can navigate as far back as desired, and months with no data simply show empty/zero states.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST accept optional year and month parameters on the cashflow data endpoint, defaulting to the last completed calendar month when not provided.
- **FR-002**: System MUST display a month selector control at the top of the Cashflow page showing the currently selected month and year (e.g., "March 2026").
- **FR-003**: Users MUST be able to navigate to the previous month using a left arrow control.
- **FR-004**: Users MUST be able to navigate to the next month using a right arrow control, up to but not beyond the last completed calendar month.
- **FR-005**: The forward navigation control MUST be visually disabled when viewing the last completed month.
- **FR-006**: All Cashflow page sections (KPI strip, Sankey diagram, breakdown row) MUST update to reflect the selected month's data when the month changes.
- **FR-007**: System MUST cache data per-month so that switching back to a previously viewed month does not require a new data fetch if the data is still in cache.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can switch between any two months in under 2 seconds (including data load time).
- **SC-002**: The default month shown on page load matches the last fully completed calendar month 100% of the time.
- **SC-003**: Users cannot navigate to any month after the last completed month.
- **SC-004**: All three page sections (KPIs, chart, breakdown) update consistently when a month is selected — no section shows stale data from a different month.

## Assumptions

- The existing cashflow data endpoint structure (nodes, links, KPI totals) remains unchanged — only the month filtering is parameterized.
- Historical data availability depends on what the user has imported — the system does not generate data for months without imports.
- The month selector applies to the entire Cashflow page; there is no per-section month filtering.
- The current (incomplete) month is never selectable — only fully completed months are available.
