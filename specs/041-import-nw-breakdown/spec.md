# Feature Specification: Import Networth with Account Breakdown

**Feature Branch**: `041-import-nw-breakdown`  
**Created**: 2026-04-01  
**Status**: Draft  
**Input**: User description: "when I import previous Net worth, the fields should be the same as in Modify, meaning based on existing accounts and invest accounts."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Import previous networth with per-account breakdown (Priority: P1)

Currently, the "Import previous networth" modal only has a single total net worth field. Instead, it should show the same per-account breakdown fields as the "Modify previous networth" modal — one editable balance field for each existing manual account and investment account. The total is computed automatically from the individual balances. The user selects a month/year, fills in the historical balance for each account, and presses Import. This creates a snapshot with both the total and the full breakdown, making it consistent with auto-captured snapshots.

**Why this priority**: This is the entire feature — making the import modal match the modify modal's account-based layout so users enter accurate, granular historical data instead of a single opaque number.

**Independent Test**: Open Gear > "Import previous networth", verify account breakdown fields appear (matching current accounts), fill in balances, press Import, then open "Modify previous networth" for that month and confirm the breakdown data is saved.

**Acceptance Scenarios**:

1. **Given** the user opens "Import previous networth", **When** the modal loads, **Then** it shows a month/year selector and one editable balance field per existing account (same list as the Modify modal).
2. **Given** the user fills in balances for each account, **When** viewing the modal, **Then** the total net worth updates live as a sum of all account balances.
3. **Given** the user presses Import, **When** the snapshot is created, **Then** it includes both the total net worth and the per-account breakdown data.
4. **Given** the user imports a snapshot for a past month, **When** they later open "Modify previous networth" for that month, **Then** the breakdown fields show the values they originally entered.

---

### Edge Cases

- What happens when the user has no accounts set up yet? The modal shows a message "Add accounts first to import historical net worth" and disables the Import button.
- What happens when a snapshot already exists for the selected month? The existing behavior applies — an error message is shown indicating a snapshot already exists for that month.
- What happens when the user leaves all balances at zero? The snapshot is created with a total of 0 and a breakdown of all-zero balances.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The "Import previous networth" modal MUST display one editable balance field per existing account (manual and investment accounts).
- **FR-002**: The modal MUST show each account's name as a label next to its balance field.
- **FR-003**: The modal MUST compute and display a live total net worth from the sum of all account balances.
- **FR-004**: The Import action MUST save both the total net worth and the per-account breakdown to the snapshot.
- **FR-005**: The month/year selector MUST remain, allowing the user to choose which historical month to import.
- **FR-006**: The modal MUST retain the existing duplicate-month validation (error if a snapshot already exists for the selected month).
- **FR-007**: If no accounts exist, the modal MUST show a message and disable the Import button.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Imported snapshots contain per-account breakdown data that is viewable in the Modify modal.
- **SC-002**: The live total in the Import modal matches the sum of all account balances at all times.
- **SC-003**: Users can import a historical snapshot with full account breakdown within 30 seconds.

## Assumptions

- The account list shown in the Import modal comes from the user's current accounts (same source as the Modify modal and the accounts table on the Networth page).
- The existing backend endpoint for creating manual snapshots will be updated to accept a breakdown field alongside the total.
- All account balances default to 0 when the Import modal opens (since these are historical values the user needs to fill in).
- The Import modal uses the same visual layout and styling as the Modify modal for the breakdown fields.
