# Feature Specification: Fix Import Discard to Call Backend API

**Feature Branch**: `005-fix-import-discard`
**Created**: 2026-03-28
**Status**: Draft
**Input**: User description: "The frontend Discard button in the import modal only resets client-side state but never calls POST /budget/import/{id}/discard on the backend. This leaves orphaned preview transactions in the DB. On a subsequent import of the same PDF, all transactions show as duplicates skipped because the old preview transactions still have dedup hashes. Fix: wire up the Discard button to call the backend discard endpoint, passing the import ID from the SSE result."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Discard Import Cleans Up Backend Data (Priority: P1)

A user uploads a PDF statement, sees the preview with categorized transactions, decides not to import, and clicks "Discard". The system removes the preview transactions from the database so they don't interfere with future imports. If the user uploads the same PDF again later, all transactions appear fresh (not as duplicates).

**Why this priority**: This is a data integrity bug. Without this fix, discarded imports leave ghost data that blocks re-importing the same statement. The user has no way to recover except manual database intervention.

**Independent Test**: Upload a PDF, wait for preview, click Discard. Upload the same PDF again. Verify all transactions appear in preview (0 duplicates skipped).

**Acceptance Scenarios**:

1. **Given** a user has uploaded a PDF and sees the preview table, **When** they click "Discard", **Then** the system removes all preview transactions and the import record from the database, and the modal resets to the upload state.
2. **Given** a user discarded an import, **When** they upload the same PDF again, **Then** all transactions appear in the preview with 0 duplicates skipped.
3. **Given** a user is viewing the import preview, **When** they click "Discard", **Then** the budget summary behind the modal remains unchanged (€0.00 if no prior confirmed imports).

---

### Edge Cases

- What happens if the user closes the modal (X button) instead of clicking Discard while a preview is showing? The same cleanup should occur — closing the modal with an active preview should discard on the backend.
- What happens if the backend discard call fails (network error)? The UI should show an error message but still reset the modal state. The orphaned preview transactions will be excluded from budget totals by the existing confirmed-only filter.
- What happens if the user clicks Discard while the import is still processing (SSE stream active)? The system should wait for processing to complete or cancel, then discard.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When the user clicks "Discard" on the import preview, the system MUST call the backend discard endpoint to remove preview transactions and mark the import as discarded.
- **FR-002**: The import ID from the completed import MUST be available to the discard action, even when the import was uploaded via the SSE streaming flow.
- **FR-003**: After a successful discard, re-importing the same file MUST NOT show any transactions as duplicates (assuming no other confirmed import of that file exists).
- **FR-004**: Closing the import modal (X button) while a preview is displayed MUST also trigger the backend discard.
- **FR-005**: If the backend discard call fails, the system MUST show an error to the user but still reset the modal to the upload state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of discarded imports leave zero orphaned transactions in the database.
- **SC-002**: Re-importing a previously discarded PDF shows the full transaction count with 0 duplicates skipped.
- **SC-003**: The discard action completes (modal resets) in under 2 seconds.

## Assumptions

- The backend `POST /budget/import/{id}/discard` endpoint already exists and works correctly — this fix is frontend-only (wiring up the call).
- The SSE streaming flow provides the import ID in its completion event, which can be stored in frontend state for use by the discard action.
- The existing `_confirmed_tx_filter` in budget queries already prevents preview transactions from appearing in budget totals, so this fix addresses data cleanup, not display correctness.
