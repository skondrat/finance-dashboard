# Feature Specification: Budget UI Improvements

**Feature Branch**: `013-budget-ui-improvements`
**Created**: 2026-03-29
**Status**: Draft
**Input**: User description: "Improve Budget UI: (1) All columns in the Spend by Category table need sort arrows - clicking a column header toggles between ascending and descending sort order. (2) If a category has no budget set up (budget is 0 or null), its progress bar must be grey instead of green."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sort Categories by Column (Priority: P1)

A user viewing the Spend by Category table wants to sort categories by any column (Category name, Budget, Spent, Remaining, % Total). They click a column header and see a sort arrow appear indicating the sort direction. Clicking the same header again toggles between ascending and descending order. Clicking a different header sorts by that column instead.

**Why this priority**: Sorting is the most impactful improvement — it lets users quickly find their highest spending, largest budgets, or most over-budget categories.

**Independent Test**: Load the budget page with multiple categories, click each column header, and verify rows reorder correctly with a visible sort direction indicator.

**Acceptance Scenarios**:

1. **Given** the table is displayed with unsorted categories, **When** the user clicks the "Spent" header, **Then** categories sort by spent amount (descending by default) and a downward arrow appears on the header.
2. **Given** the table is sorted by Spent descending, **When** the user clicks the "Spent" header again, **Then** categories sort by spent amount ascending and the arrow points upward.
3. **Given** the table is sorted by Spent, **When** the user clicks the "Budget" header, **Then** categories sort by budget amount (descending by default) and the sort arrow moves to the Budget header.
4. **Given** the table is displayed, **When** the user clicks the "Category" header, **Then** categories sort alphabetically by name.
5. **Given** some categories have null budget values, **When** sorting by Budget or Remaining, **Then** null values sort to the end regardless of sort direction.

---

### User Story 2 - Grey Progress Bar for No-Budget Categories (Priority: P2)

A user viewing the Spend by Category table sees categories without a budget (budget is 0 or null). These categories should display a grey progress bar instead of a green one, making it visually obvious that no budget has been configured.

**Why this priority**: Visual clarity improvement — users can instantly distinguish between "on track" (green) and "not configured" (grey) at a glance.

**Independent Test**: View the budget page with a mix of categories that have budgets and categories that don't, and verify the progress bars are colored correctly.

**Acceptance Scenarios**:

1. **Given** a category has a budget of 0, **When** the table renders, **Then** its progress bar is grey (not green).
2. **Given** a category has no budget set (null), **When** the table renders, **Then** its progress bar is grey (not green).
3. **Given** a category has a positive budget and spending below budget, **When** the table renders, **Then** its progress bar is green.
4. **Given** a category has a positive budget and spending exceeding budget, **When** the table renders, **Then** its progress bar is red/error-colored.

---

### Edge Cases

- What happens when all rows have the same value for the sorted column? The order remains stable (original order preserved).
- What happens when the data refreshes while a sort is active? The sort should be re-applied to the new data.
- What is the default sort on page load? No sort applied — categories appear in the order returned by the server.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each column header (Category, Budget, Spent, Remaining, % Total) MUST be clickable to trigger sorting.
- **FR-002**: Clicking a column header MUST sort the table by that column in descending order on first click.
- **FR-003**: Clicking the same column header again MUST toggle the sort direction (descending to ascending).
- **FR-004**: A sort direction arrow (up or down) MUST be visible on the currently sorted column header.
- **FR-005**: Only one column MUST be sortable at a time (no multi-column sort).
- **FR-006**: Null or zero budget values MUST sort to the end of the list regardless of sort direction when sorting by Budget or Remaining.
- **FR-007**: Categories with no budget (null or 0) MUST display a grey progress bar.
- **FR-008**: Categories with a positive budget and spending within budget MUST display a green progress bar.
- **FR-009**: Categories with spending exceeding budget MUST display a red/error progress bar.
- **FR-010**: The sort state MUST NOT persist across page navigations — default order on each page load.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can sort the category table by any of the 5 columns within a single click.
- **SC-002**: Sort direction is visually indicated on the active column at all times when a sort is applied.
- **SC-003**: 100% of no-budget categories display grey progress bars.
- **SC-004**: Users can identify no-budget categories at a glance without reading the budget value.

## Assumptions

- This is a frontend-only change — no backend modifications needed.
- The "Category" column sorts alphabetically; all numeric columns sort numerically.
- Sort arrows use a simple up/down chevron or triangle icon consistent with the existing design system.
- The sort state is local to the component — it resets when navigating away and returning.
