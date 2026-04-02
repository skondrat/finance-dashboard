# Feature Specification: Edit and Delete Budget Transactions

**Feature Branch**: `042-edit-delete-transactions`  
**Created**: 2026-04-02  
**Status**: Draft  
**Input**: User description: "I want to be able to remove transactions from Budget page. at the very bottom at the transaction list, each transaction should be a trash button. also I should be able to change the sum (maybe next to sum have a pencil button, if pressed sum can ber changed and saved)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Delete a Transaction (Priority: P1)

As a user viewing the Budget page, I want to delete a transaction I no longer need so that my spending data remains accurate. Each transaction row in the transaction list displays a trash/delete button. Clicking it prompts a confirmation, and upon confirming, the transaction is permanently removed and all related summaries (KPIs, charts, category totals) update accordingly.

**Why this priority**: Removing incorrect or duplicate transactions is the most critical data-correction action. Without it, users have no way to fix bad data imported from statements.

**Independent Test**: Can be fully tested by importing a statement, then deleting one transaction and verifying it disappears from the list and totals update.

**Acceptance Scenarios**:

1. **Given** a transaction list with at least one transaction, **When** the user clicks the trash button on a transaction row, **Then** a confirmation dialog appears asking the user to confirm deletion.
2. **Given** the confirmation dialog is shown, **When** the user confirms deletion, **Then** the transaction is removed from the list, and all budget summaries (KPIs, charts, category spend) reflect the updated totals.
3. **Given** the confirmation dialog is shown, **When** the user cancels, **Then** the transaction remains unchanged and the dialog closes.

---

### User Story 2 - Edit a Transaction Amount (Priority: P1)

As a user viewing the Budget page, I want to edit the amount of a transaction so that I can correct errors from statement imports. Each transaction row displays a pencil/edit icon next to the amount. Clicking it makes the amount field editable inline. The user changes the value and saves it, and all related summaries update.

**Why this priority**: Equally critical to deletion — correcting an incorrect amount is a common need after importing statements where amounts may be split or misread.

**Independent Test**: Can be fully tested by clicking the edit icon on a transaction, changing the amount, saving, and verifying the new amount appears in the list and totals update.

**Acceptance Scenarios**:

1. **Given** a transaction in the list, **When** the user clicks the pencil icon next to the amount, **Then** the amount becomes an editable input field pre-filled with the current value.
2. **Given** the amount field is in edit mode, **When** the user changes the value and confirms (presses Enter or clicks a save/check button), **Then** the new amount is saved and all budget summaries update to reflect the change.
3. **Given** the amount field is in edit mode, **When** the user presses Escape or clicks away without saving, **Then** the edit is cancelled and the original amount is restored.
4. **Given** the amount field is in edit mode, **When** the user enters an invalid value (non-numeric, empty), **Then** the save action is prevented and the field shows a validation indicator.

---

### Edge Cases

- What happens when the user deletes the last transaction in a category? The category should show zero spend.
- What happens when the user edits an amount to zero? The transaction should be saved with zero amount.
- What happens when the user tries to delete or edit while another operation is in progress? Actions should be disabled until the current operation completes.
- What happens if the server request fails during delete or edit? An error message should be shown and the transaction should remain in its original state.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each transaction row in the transaction list MUST display a delete (trash) button.
- **FR-002**: Clicking the delete button MUST show a confirmation dialog before removing the transaction.
- **FR-003**: Upon confirmed deletion, the system MUST permanently remove the transaction and update all budget summaries (KPIs, spend-by-category, charts).
- **FR-004**: Each transaction row MUST display an edit (pencil) icon next to the amount column.
- **FR-005**: Clicking the edit icon MUST make the amount field editable inline, pre-filled with the current value.
- **FR-006**: The user MUST be able to save the edited amount by pressing Enter or clicking a save/confirm button.
- **FR-007**: The user MUST be able to cancel the edit by pressing Escape or clicking outside the field.
- **FR-008**: The system MUST validate that the edited amount is a valid number before saving.
- **FR-009**: After a successful edit or delete, all related views (KPI cards, donut chart, bar chart, spend-by-category table) MUST refresh to reflect the updated data.
- **FR-010**: The delete and edit buttons MUST be visually unobtrusive (not dominating the row) but clearly accessible.

### Key Entities

- **Budget Transaction**: Existing entity representing a spending or income entry. Key attributes affected: amount (editable), existence (deletable).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can delete any transaction from the budget page in under 5 seconds (2 clicks: trash + confirm).
- **SC-002**: Users can edit a transaction amount inline in under 10 seconds (click edit, type new value, confirm).
- **SC-003**: After deletion or edit, all visible budget summaries update within 2 seconds without requiring a page refresh.
- **SC-004**: 100% of delete operations show a confirmation step to prevent accidental data loss.

## Assumptions

- The backend already has or can easily support DELETE and PATCH/PUT endpoints for budget transactions.
- Only the transaction amount is editable inline; other fields (date, description, category) are not part of this feature scope.
- Deleted transactions are permanently removed, not soft-deleted or archived.
- The existing transaction list component on the Budget page will be extended with the new action buttons.
- Currency of the transaction cannot be changed via inline edit — only the numeric amount.
