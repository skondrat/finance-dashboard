# Feature Specification: Portfolio Account Edit

**Feature Branch**: `034-portfolio-account-edit`  
**Created**: 2026-03-31  
**Status**: Draft  
**Input**: User description: "Accounts should be editable - users should be able to edit account names and types in the Portfolio section."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Edit Account Details (Priority: P1)

As a user, I want to edit my portfolio account's name, type, and currency so I can correct mistakes or update information after creation.

**Why this priority**: Core and only feature — without this, accounts are permanently fixed after creation.

**Independent Test**: Can be fully tested by clicking edit on an existing account, changing the name and type, saving, and verifying the changes persist.

**Acceptance Scenarios**:

1. **Given** I have an existing account in my portfolio, **When** I click the edit button on that account, **Then** a form appears pre-populated with the account's current name, type, and currency.
2. **Given** the edit form is open, **When** I change the name and type and save, **Then** the account list updates to reflect the new values.
3. **Given** the edit form is open, **When** I click cancel or close the form, **Then** no changes are saved and the account remains unchanged.

---

### Edge Cases

- What happens if the user submits an empty name? Validation prevents saving — name is required.
- What happens if the user edits an account that has existing transactions? Transactions remain linked — only the account metadata (name, type, currency) changes.
- What happens if there's a network error while saving? An error message is shown and the user can retry.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to edit an existing portfolio account's name, type, and currency.
- **FR-002**: System MUST pre-populate the edit form with the account's current values.
- **FR-003**: System MUST validate that the account name is not empty before saving.
- **FR-004**: System MUST update the account list immediately after a successful edit.
- **FR-005**: System MUST provide a way to cancel editing without saving changes.
- **FR-006**: System MUST show an edit trigger (button or icon) for each account in the account list.

### Key Entities

- **Account**: A portfolio account with name, type (brokerage, crypto exchange, bank), currency, and optional notes. Linked to investment transactions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can edit an account's name and type in under 10 seconds (open form, change, save).
- **SC-002**: Edited account details are immediately visible in the account list after saving.
- **SC-003**: Existing transactions linked to the account are unaffected by edits.

## Assumptions

- The backend already supports partial account updates — no new endpoints needed.
- The edit form reuses the same fields as the account creation form (name, type, currency).
- Account type options are the same as during creation (Brokerage, Crypto Exchange, Bank).
- Notes field is included in the edit form since it exists on the account model.
