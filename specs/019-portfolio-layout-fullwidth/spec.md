# Feature Specification: Portfolio Layout — Full-Width KPI Strip

**Feature Branch**: `019-portfolio-layout-fullwidth`
**Created**: 2026-03-29
**Status**: Draft
**Input**: User description: "I want here to move Accounts (Add account) box lower, so that the topmost strip of cards takes full width."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Full-Width KPI Strip on Desktop (Priority: P1)

A user opens the Portfolio page on a desktop browser. The top row of KPI metric cards (Net Worth, Total Return, Return %, Saving Rate, Investment Rate, Invested Capital) spans the full width of the content area, without the Accounts box sitting beside them. The Accounts section appears below the KPI strip, repositioned into the sidebar column starting after the KPI row level.

**Why this priority**: The current layout compresses the KPI cards into roughly two-thirds of the page width because the Accounts box occupies the remaining third alongside them. Moving the Accounts box lower lets the KPI strip use all available horizontal space, improving readability of the financial metrics at a glance.

**Independent Test**: Navigate to the Portfolio page on a large screen (>=1024px). Verify that the KPI strip spans the full page width and the Accounts section appears below it.

**Acceptance Scenarios**:

1. **Given** a user is on the Portfolio page at desktop resolution (>=1024px), **When** the page loads, **Then** the KPI metric cards span the full content width with no sidebar element beside them.
2. **Given** a user is on the Portfolio page at desktop resolution, **When** they scroll down past the KPI strip, **Then** the Accounts section (with "Add Account" button) is visible below the KPI row.
3. **Given** a user is on the Portfolio page at mobile/tablet resolution, **When** the page loads, **Then** the layout remains unchanged (all sections already stack vertically on small screens).

---

### Edge Cases

- What happens when the browser window is resized from desktop to mobile? The layout should transition smoothly with no overlapping elements.
- What happens when there are many accounts listed? The Accounts section should still render correctly in its new position without pushing other content off-screen.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The KPI metric strip MUST span the full width of the page content area on desktop viewports (>=1024px), without any sidebar element appearing alongside it.
- **FR-002**: The Accounts section (heading + "Add Account" button + account list) MUST be repositioned below the KPI strip row.
- **FR-003**: The existing Accounts functionality (add account modal, account list, visibility toggles) MUST remain fully functional in the new position.
- **FR-004**: Mobile and tablet layouts MUST remain unchanged — all sections already stack vertically at smaller breakpoints.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On desktop viewports (>=1024px), the KPI strip visually occupies 100% of the available content width.
- **SC-002**: The Accounts section remains fully accessible and functional (add, toggle, view accounts) in its new position.
- **SC-003**: No visual regressions on mobile or tablet layouts.

## Assumptions

- Only the Portfolio page layout is affected; no other tabs (Budget, Cashflow, Networth) change.
- The KPI strip component itself does not need internal changes — only its container/grid placement changes.
- The Accounts section moves to a new position but its internal UI remains identical.
- The Performance chart, Allocation donut, and other sidebar content remain in their current relative positions.
