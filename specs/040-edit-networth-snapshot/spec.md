# Feature Specification: Edit Previous Networth Snapshots

**Feature Branch**: `040-edit-networth-snapshot`  
**Created**: 2026-04-01  
**Status**: Draft  
**Input**: User description: "I want in the Networth tab after pressing the Gear button to have an option Modify previous networth, there should be month/year selector and edit fields for all the values which compose the NW final value. and after they modified by me, if I press save, the modal will be closed."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Edit a previous networth snapshot (Priority: P1)

On the Networth page, the user clicks the Gear button and selects "Modify previous networth". A modal opens with a month/year selector defaulting to the most recent snapshot month. The modal shows all the accounts that make up the net worth total — each with its name and an editable balance field. The total net worth updates live as the user changes individual balances. When the user presses Save, the snapshot is updated in the database, the modal closes, and the chart/KPI reflect the new values.

**Why this priority**: This is the core feature — users need to correct historical net worth when account balances were wrong at snapshot time (e.g., missing an account, wrong price data, or a manual snapshot that needs adjustment).

**Independent Test**: Open the Networth page, click Gear > "Modify previous networth", select a month that has a snapshot, change one account balance, press Save, and verify the chart updates to reflect the new total.

**Acceptance Scenarios**:

1. **Given** the user is on the Networth page with existing snapshots, **When** they click Gear > "Modify previous networth", **Then** a modal opens with a month/year selector and the breakdown of account balances for the selected month.
2. **Given** the modal is open with a selected month, **When** the user changes an account's balance, **Then** the displayed total net worth recalculates immediately to reflect the change.
3. **Given** the user has modified one or more balances, **When** they press Save, **Then** the snapshot is updated, the modal closes, and the net worth chart and KPI card reflect the new values.
4. **Given** the user selects a different month/year in the selector, **When** the modal updates, **Then** it shows the breakdown for that month's snapshot with the correct account names and balances.

---

### User Story 2 - Handle months without existing snapshots (Priority: P2)

When the user selects a month/year that has no existing snapshot, the modal shows a message indicating no snapshot exists for that period, and the Save button is disabled. This prevents accidental creation of new snapshots through the edit flow (the existing "Import previous networth" option handles creation).

**Why this priority**: Prevents confusion and accidental data creation — editing should only modify existing data.

**Independent Test**: Open the edit modal, select a month with no snapshot, and verify the modal shows an appropriate message and Save is disabled.

**Acceptance Scenarios**:

1. **Given** the edit modal is open, **When** the user selects a month that has no snapshot, **Then** the modal displays "No snapshot exists for this month" and the Save button is disabled.
2. **Given** the user was viewing a month with no snapshot, **When** they switch to a month that does have a snapshot, **Then** the breakdown fields appear and Save becomes enabled.

---

### Edge Cases

- What happens when a snapshot has no breakdown data (e.g., old manual snapshots imported with only a total)? The modal shows a single editable "Total Net Worth" field instead of individual account rows.
- What happens when the user changes balances but then closes the modal without saving (via X button or clicking outside)? Changes are discarded, no update is made.
- What happens when the user sets all balances to zero? The total shows 0 and the snapshot can be saved with a zero net worth.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Gear dropdown on the Networth page MUST include a "Modify previous networth" option.
- **FR-002**: Selecting "Modify previous networth" MUST open a modal with a month/year selector.
- **FR-003**: The month/year selector MUST default to the most recent snapshot month.
- **FR-004**: The modal MUST display all accounts from the selected snapshot's breakdown, each with an editable balance field.
- **FR-005**: The modal MUST show a live-updating total net worth that recalculates as individual balances are changed.
- **FR-006**: Pressing Save MUST update the snapshot in the database with the new balances and recalculated total.
- **FR-007**: After a successful save, the modal MUST close and the net worth chart and KPI card MUST refresh to reflect the updated values.
- **FR-008**: For months with no existing snapshot, the modal MUST show a message and disable the Save button.
- **FR-009**: For snapshots without breakdown data, the modal MUST show a single editable total net worth field.
- **FR-010**: Closing the modal without saving MUST discard all unsaved changes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can modify any previous networth snapshot's account balances and save within 30 seconds.
- **SC-002**: After saving, the net worth chart immediately reflects the updated values without requiring a page refresh.
- **SC-003**: The live total in the modal matches the sum of all individual account balances at all times during editing.
- **SC-004**: Selecting any month/year with an existing snapshot loads the correct breakdown within 1 second.

## Assumptions

- The existing snapshot breakdown structure (list of accounts with name, balance, source, account_type) is sufficient for the edit UI — no new data fields are needed.
- A backend endpoint to update individual snapshots does not currently exist and will need to be created.
- The month/year selector only shows months up to the current month (no future months).
- The edit modal reuses the same visual style and patterns as existing modals in the application.
- Users can edit both "auto" and "manual" source snapshots through this modal.
