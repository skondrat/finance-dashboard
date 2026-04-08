# Feature Specification: Budget Spend Treemap

**Feature Branch**: `075-budget-spend-treemap`  
**Created**: 2026-04-08  
**Status**: Draft  
**Input**: User description: "I want to have a chart similar to when stocks growth / decrease are shown, where rectangles are of different sizes and are green or red, based on growth. But I want this kind of chart for my Budget, for categories spend, where color is diff % compared to previous month (less spend is green, red is more spend) and size is relevant to absolute size. Has to be under all the charts section on the right"

## Clarifications

### Session 2026-04-08

- Q: Should clicking a treemap rectangle filter the transaction list (like the donut chart)? → A: Yes, clicking filters the transaction list, matching existing donut chart behavior.
- Q: How should the color gradient scale work (fixed bounds vs dynamic)? → A: Dynamic scaling — deepest color maps to the largest percentage change in the current data set.
- Q: What should the comparison baseline be? → A: User-selectable — a month selector lets users pick which month to compare against, plus a "Budget" option that compares actual spend vs the category's monthly budget.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Spending Treemap (Priority: P1)

As a user viewing my monthly budget, I want to see a treemap chart that displays my spending categories as proportionally-sized rectangles colored by month-over-month change, so I can instantly identify which categories are my largest expenses and which ones are trending up or down compared to last month.

**Why this priority**: This is the core feature - without the treemap visualization, there is no value delivered. It provides an at-a-glance stock-market-style heatmap for personal spending.

**Independent Test**: Can be fully tested by navigating to the Budget page in monthly view and verifying the treemap appears below the existing charts on the right, with rectangles sized by spending amount and colored green/red by month-over-month change.

**Acceptance Scenarios**:

1. **Given** a user has spending data for the current month, **When** they view the Budget page in monthly period mode, **Then** a treemap chart appears below the existing charts on the right column showing one rectangle per spending category, with a comparison selector defaulting to the previous month.
2. **Given** a category where spending decreased compared to the selected baseline, **When** the treemap renders, **Then** that category's rectangle is colored green, with deeper green indicating a larger percentage decrease.
3. **Given** a category where spending increased compared to the selected baseline, **When** the treemap renders, **Then** that category's rectangle is colored red, with deeper red indicating a larger percentage increase.
4. **Given** categories with different absolute spending amounts, **When** the treemap renders, **Then** rectangles are sized proportionally to the category's absolute spending in the current month.
5. **Given** a user selects a different comparison month from the selector, **When** the treemap updates, **Then** colors reflect the percentage change between the current month and the newly selected comparison month.
6. **Given** a user selects "Budget" from the comparison selector, **When** the treemap updates, **Then** colors reflect the percentage difference between actual spend and the category's monthly budget (under budget = green, over budget = red).

---

### User Story 2 - Treemap Category Labels and Details (Priority: P2)

As a user, I want each rectangle in the treemap to display the category name, spending amount, and percentage change so I can read the data without additional interaction.

**Why this priority**: Labels turn the visual from a colored grid into an informative chart. Without them, users cannot interpret the data.

**Independent Test**: Can be tested by verifying that each rectangle displays the category name, spending amount, and percentage change text within the rectangle (for rectangles large enough to fit text).

**Acceptance Scenarios**:

1. **Given** a treemap is displayed, **When** a rectangle is large enough to fit text, **Then** it shows the category name, the absolute spending amount, and the percentage change from previous month.
2. **Given** a rectangle too small to fit full labels, **When** the treemap renders, **Then** the text is either truncated or hidden to avoid visual clutter.
3. **Given** a user hovers over any rectangle, **When** a tooltip appears, **Then** it shows the full category name, current month spending, the comparison baseline value (either another month's spending or budget amount), and the percentage change.
4. **Given** a user clicks on a treemap rectangle, **When** the click is registered, **Then** the transaction list below filters to show only transactions for that category (consistent with the existing donut chart click behavior).

---

### User Story 3 - Handle Edge Cases Gracefully (Priority: P3)

As a user viewing the treemap, I want the chart to handle edge cases like new categories (no previous month data) and zero-spend months so the visualization remains accurate and informative.

**Why this priority**: Edge cases ensure the chart is reliable and does not break or mislead users in uncommon but valid scenarios.

**Independent Test**: Can be tested by creating a category with spending in the current month only and verifying it displays with a neutral color and appropriate tooltip.

**Acceptance Scenarios**:

1. **Given** a category has spending this month but zero spending in the comparison month, **When** the treemap renders, **Then** the rectangle is shown with a neutral indicator (e.g., gray or a distinct color) since percentage change is undefined.
2. **Given** a category has spending in the comparison month but zero this month, **When** the treemap renders, **Then** it is not displayed (zero-area rectangle) since absolute size is zero.
3. **Given** a user is viewing a non-monthly period (yearly, YTD), **When** the treemap renders, **Then** the treemap is hidden or shows an appropriate message since month-over-month comparison requires monthly period mode.
4. **Given** a user selects "Budget" comparison but a category has no monthly budget set, **When** the treemap renders, **Then** the rectangle is shown with a neutral color (gray) and the tooltip indicates "no budget set".
5. **Given** a user selects "Budget" comparison, **When** the treemap renders, **Then** under-budget categories are green (spent less than budget) and over-budget categories are red (spent more than budget).

---

### Edge Cases

- What happens when there is only one category with spending? The treemap displays a single rectangle filling the entire area.
- What happens when all categories have the same spending change percentage? All rectangles are the same color but different sizes based on absolute amount.
- What happens when no spending data exists for the selected month? The chart area shows an empty state message.
- What happens when the user changes the selected month/year? The treemap updates to compare the newly selected month against the selected comparison baseline.
- What happens when "Budget" is selected but no categories have budgets? The treemap shows all rectangles in neutral gray with a hint that budgets are not configured.
- What happens when the comparison month has no spending data at all? All current-month categories show neutral color since there is no baseline to compare against.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a treemap chart in the right column of the Budget page, positioned below the existing charts (category distribution, month comparison, spending trends, income vs spend).
- **FR-002**: System MUST size each rectangle proportionally to the category's absolute spending amount for the selected month.
- **FR-003**: System MUST provide a comparison baseline selector above the treemap with two types of options: available months (defaulting to the previous month) and a "Budget" option.
- **FR-004**: System MUST color each rectangle based on the percentage change in spending compared to the selected baseline, using a green-to-red color gradient (green for decreased spending or under budget, red for increased spending or over budget).
- **FR-005**: System MUST display category name, spending amount, and percentage change as text labels within rectangles that are large enough to accommodate them.
- **FR-006**: System MUST show a tooltip on hover with full category name, current month spending, baseline value (comparison month spending or budget amount), and percentage change.
- **FR-007**: System MUST allow users to click a treemap rectangle to filter the transaction list to that category, consistent with existing donut chart click-to-filter behavior.
- **FR-008**: System MUST only display the treemap when the budget period is set to "monthly" since month-over-month comparison is required.
- **FR-009**: System MUST handle categories with no comparison data (no spending in comparison month, or no budget set) by displaying them with a neutral color (gray) and an appropriate indicator in the tooltip.
- **FR-010**: System MUST use the user's selected currency for all displayed amounts, consistent with the rest of the budget page.
- **FR-011**: System MUST update the treemap when the user changes the selected month, year, currency, or comparison baseline.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can identify their top 3 spending categories and their month-over-month trend direction within 5 seconds of viewing the treemap.
- **SC-002**: The treemap renders within 2 seconds of the budget page loading, consistent with existing chart performance.
- **SC-003**: 100% of spending categories with current-month transactions are represented in the treemap with correct proportional sizing.
- **SC-004**: Color coding accurately reflects the direction and magnitude of change for all categories compared to the previous month.

## Assumptions

- The treemap uses the same month/year/currency selection as the rest of the budget page (no separate selectors needed).
- The comparison baseline defaults to the previous month but can be changed by the user to any other month or to "Budget".
- Categories with zero spending in the current month are excluded from the treemap (zero-area rectangles are not meaningful).
- The treemap reuses existing spending data already available for the budget page, specifically the spend-by-category data.
- The color gradient uses a continuous, dynamically-scaled range: the deepest green/red maps to the largest percentage change in the current data set, ensuring maximum visual contrast regardless of data range.
- The chart and its comparison selector fit within the existing right-column width (4 columns out of 12) without requiring layout changes.
- "Budget" comparison uses the `monthly_budget` field already present on categories. Categories without a budget set are treated as having no baseline.
