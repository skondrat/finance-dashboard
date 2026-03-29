# Feature Specification: Portfolio Account List & Delete

**Feature Branch**: `020-portfolio-account-list`
**Created**: 2026-03-29
**Status**: Draft
**Input**: User description: "Add account list with delete capability to Portfolio sidebar Accounts section"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Account List in Sidebar (Priority: P1)

A user opens the Portfolio page and sees a list of their existing brokerage/investment accounts below the "Add Account" button in the Accounts sidebar section. Each account shows its name and type, giving the user a clear overview of all accounts they have set up.

**Why this priority**: Without a visible list, users have no way to see what accounts exist in the Portfolio section. Currently accounts only appear as filter tabs in the Positions list, which is not intuitive for account management.

**Independent Test**: Navigate to Portfolio page with at least one account created. Verify the account appears listed below the "Add Account" button with its name and type.

**Acceptance Scenarios**:

1. **Given** a user has created portfolio accounts, **When** they view the Portfolio page, **Then** each account is listed below the "Add Account" button showing its name and type.
2. **Given** a user has no portfolio accounts, **When** they view the Portfolio page, **Then** only the "Add Account" button is shown (no empty list or placeholder).

---

### User Story 2 - Delete an Account (Priority: P2)

A user wants to remove a portfolio account they no longer need. They click a delete button on the account in the sidebar list. A confirmation prompt appears to prevent accidental deletion. Upon confirmation, the account and its associated transactions are removed.

**Why this priority**: Users currently have no way to remove accounts from the UI once created. This is a basic account management capability.

**Independent Test**: Create an account, then delete it via the sidebar list. Verify it disappears from the list and from the Positions filter tabs.

**Acceptance Scenarios**:

1. **Given** a user has a portfolio account listed, **When** they click the delete button on that account, **Then** a confirmation prompt appears warning that the account and its transactions will be deleted.
2. **Given** the confirmation prompt is shown, **When** the user confirms deletion, **Then** the account is removed from the list, the Positions filter tabs update, and the data is deleted from the system.
3. **Given** the confirmation prompt is shown, **When** the user cancels, **Then** the account remains unchanged.

---

### Edge Cases

- What happens when a user deletes the account whose positions are currently displayed? The view should fall back to the "Aggregated" tab.
- What happens when a user deletes the only account? The account list should become empty, showing only the "Add Account" button.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Accounts sidebar section MUST display a list of all existing portfolio accounts below the "Add Account" button.
- **FR-002**: Each account in the list MUST show the account name and type.
- **FR-003**: Each account in the list MUST have a delete action.
- **FR-004**: Deleting an account MUST show a confirmation prompt before proceeding.
- **FR-005**: Upon confirmed deletion, the account and all associated transactions MUST be removed.
- **FR-006**: The account list and Positions filter tabs MUST update immediately after deletion without requiring a page refresh.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can see all their portfolio accounts at a glance in the sidebar.
- **SC-002**: Users can delete any portfolio account in under 3 clicks (delete button + confirm).
- **SC-003**: After deletion, the account disappears from both the sidebar list and Positions filter tabs within 1 second.

## Assumptions

- The backend delete endpoint already exists and handles cascading transaction deletion.
- The account list reuses the same data already fetched for the Positions filter tabs (no additional API call needed).
- The visual style of the account list should be consistent with the Networth accounts table pattern.
- No edit functionality is included in this scope — only list and delete.
