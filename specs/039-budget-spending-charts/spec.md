# Feature Specification: Budget Spending Trend Charts

**Feature Branch**: `039-budget-spending-charts`  
**Created**: 2026-03-31  
**Status**: Draft  
**Input**: User description: "Add spending trends section with donut chart by category and monthly savings/income/spending bar chart"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Donut chart showing spend by category (Priority: P1)

In the Budget tab's right sidebar, replace the "Spending Trends" placeholder with a donut chart that visualizes spending broken down by category. Each slice uses the category's assigned color, matching the colored dots in the Spend by Category table rows. The chart respects the date/period selector above (Monthly, YTD, Yearly, Custom) — when the user changes the period, the donut updates to reflect that period's data.

**Why this priority**: The donut chart gives an immediate visual overview of where money goes — the most requested budget insight. It also makes the category colors meaningful across the page.

**Independent Test**: Import a statement with multiple categories of spending, view the budget page, and verify the donut chart appears with correctly colored slices matching each category's spend proportion.

**Acceptance Scenarios**:

1. **Given** transactions exist across 5+ categories for February, **When** the user views Feb Monthly, **Then** the donut chart shows one slice per category, sized proportionally to spend, using each category's assigned color.
2. **Given** the user switches from Monthly to YTD, **When** the donut updates, **Then** it reflects cumulative spending across all months in the year so far.
3. **Given** a category has 0 spending, **When** the donut renders, **Then** that category does not appear as a slice (no empty wedges).
4. **Given** the category dots in the Spend by Category table, **When** comparing to the donut, **Then** the colors match exactly.

---

### User Story 2 - Monthly Savings / Income / Spending bar chart (Priority: P2)

Below the donut chart, display a grouped bar chart showing three bars per month: Savings (blue), Spendings (red), and Income (yellow/gold). The chart always shows all 12 months of the current year on the X-axis (Jan through Dec), with bars only appearing for months that have data. This gives users a year-at-a-glance financial overview.

**Why this priority**: This chart provides the longitudinal view — users can see trends over time, which complements the donut's point-in-time snapshot.

**Independent Test**: Import statements for 2+ months, view the budget page, and verify the bar chart shows grouped bars for each month with data, with all 12 months labeled on the X-axis.

**Acceptance Scenarios**:

1. **Given** data exists for December, January, and February, **When** the bar chart renders, **Then** three groups of bars appear at Dec, Jan, Feb positions, with the remaining months showing empty.
2. **Given** each bar group, **When** examining the bars, **Then** Savings is blue, Spendings is red, Income is yellow/gold — matching the legend.
3. **Given** the chart has a legend, **When** viewing it, **Then** it clearly labels Savings, Spendings, and Income with their respective colors.
4. **Given** the user switches between EUR and USD display currency, **When** the chart re-renders, **Then** all values are converted to the selected currency and the Y-axis labels show the correct currency symbol.

---

### User Story 3 - Colorful category dots in Spend by Category table (Priority: P1)

The small dots next to each category name in the Spend by Category table should use the category's assigned color (from the database), not a uniform grey. This makes the table visually consistent with the donut chart.

**Why this priority**: Equal priority with the donut — the colored dots create visual coherence between the table and chart. Currently all dots appear the same grey color.

**Independent Test**: View the Spend by Category table and verify each row's dot uses the category's specific color.

**Acceptance Scenarios**:

1. **Given** the category "Airplane Tickets" has a blue color assigned, **When** viewing its row in the table, **Then** the dot is blue (not grey).
2. **Given** the donut chart is showing, **When** comparing a category's slice color to its table dot, **Then** the colors match.

---

### Edge Cases

- What happens when there is only one category with spending? The donut shows a full circle in that category's color.
- What happens when there is no spending data at all? The donut area shows a "No spending data" message instead of an empty chart.
- What happens when a month has income but no spending? The bar chart shows only the Income and Savings bars for that month (Spendings bar is absent or zero-height).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Spending Trends section MUST display a donut chart showing spend proportions by category.
- **FR-002**: Each donut slice MUST use the category's assigned color from the database.
- **FR-003**: The donut chart MUST respect the active date/period selector (Monthly, YTD, Yearly, Custom).
- **FR-004**: The bar chart MUST show grouped bars (Savings, Spendings, Income) for each month of the current year.
- **FR-005**: The bar chart MUST use blue for Savings, red for Spendings, and yellow/gold for Income.
- **FR-006**: The bar chart MUST show all 12 months on the X-axis, with bars only for months with data.
- **FR-007**: The bar chart MUST include a legend identifying each bar color.
- **FR-008**: Both charts MUST update when the user switches display currency.
- **FR-009**: The category dots in the Spend by Category table MUST use each category's assigned color.
- **FR-010**: The donut chart MUST appear above the bar chart in the Spending Trends section.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The donut chart displays all spending categories with correct proportional sizing and matching colors.
- **SC-002**: The bar chart shows monthly Savings/Income/Spendings for all months with data, with correct values matching the KPI totals.
- **SC-003**: Switching period (Monthly/YTD/Yearly) updates the donut chart within 1 second.
- **SC-004**: Category dot colors in the table match their corresponding donut slice colors 100% of the time.

## Assumptions

- The spend-by-category data already includes category colors from the existing endpoint.
- A new backend endpoint or modification is needed to provide monthly summaries (income, spend, savings) for all 12 months of a year for the bar chart.
- The bar chart always shows the current year (based on the year selector). It does not paginate across years.
- The donut chart uses the same data source as the Spend by Category table.
