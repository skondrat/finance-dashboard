# Feature Specification: ATM Cash Expense Categorization

**Feature Branch**: `008-atm-cash-categorization`
**Created**: 2026-03-29
**Status**: Draft
**Input**: User description: "In Budget Import Statement flow, after categorisation is done, add an option to further categorise ATM Withdrawal cash using free-text notes and an LLM call."

## Clarifications

### Session 2026-03-29

- Q: What description text should split rows display in transaction history? → A: User's note text only (e.g., "cosmetics").
- Q: Should the system accept relative/proportional amounts (e.g., "half for cosmetics, rest for taxi")? → A: No, require explicit numeric amounts only.
- Q: When a note expense doesn't match any existing category, what should happen? → A: Assign to "Other" category; user can override via existing dropdown.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Split ATM cash into known expense categories (Priority: P1)

After importing a bank statement, the user sees one or more ATM Withdrawal transactions in the preview table. The user knows how part of that cash was spent (e.g., wife's notes: "200 cosmetics, 50 taxi"). The user clicks a button on an ATM Withdrawal row to open a text input, types their spending notes in free-form, and submits. The system uses an LLM to parse the notes, match amounts to existing categories, and splits the original ATM Withdrawal into multiple line items — reducing the ATM Withdrawal amount to only the unaccounted remainder.

**Why this priority**: This is the core feature — without it, cash spending is invisible in the budget, lumped under a single "ATM Withdrawal" category.

**Independent Test**: Can be fully tested by importing a statement with ATM withdrawals, entering cash spending notes, and verifying the preview table updates with split transactions mapped to correct categories.

**Acceptance Scenarios**:

1. **Given** a preview table with an ATM Withdrawal of €300, **When** the user enters "200 cosmetics, 50 taxi" and submits, **Then** the preview shows three rows: €200 mapped to a cosmetics-related category, €50 mapped to a transport-related category, and €50 remaining as ATM Withdrawal.
2. **Given** a preview table with an ATM Withdrawal of €150, **When** the user enters "150 groceries" and submits, **Then** the ATM Withdrawal row is fully replaced by a single €150 Groceries row (no ATM Withdrawal remainder).
3. **Given** a preview table with an ATM Withdrawal of €100, **When** the user enters notes totalling more than €100, **Then** the system rejects the input and displays a validation error indicating the total exceeds the withdrawal amount.

---

### User Story 2 - LLM maps notes to existing categories (Priority: P1)

The LLM receives the user's free-text notes along with the list of existing budget categories. It returns structured data mapping each noted expense to the best-matching existing category. If no existing category fits, the system assigns "Other" or creates a reasonable suggestion that the user can accept or override.

**Why this priority**: Accurate category matching is essential for the split to be useful — wrong mappings defeat the purpose.

**Independent Test**: Can be tested by providing various note formats (comma-separated, line-separated, shorthand) and verifying the LLM consistently maps them to correct existing categories.

**Acceptance Scenarios**:

1. **Given** existing categories including "Cosmetics & Beauty" and "Transportation", **When** the user enters "200 cosmetics, 50 taxi", **Then** the LLM maps "cosmetics" to "Cosmetics & Beauty" and "taxi" to "Transportation".
2. **Given** existing categories that do not include a match for "birthday gift", **When** the user enters "30 birthday gift", **Then** the system assigns the expense to "Other" and the user can override it via the category dropdown.
3. **Given** ambiguous notes like "50 food", **When** there are categories "Groceries" and "Restaurants", **Then** the LLM picks the most likely match (Groceries) and the user can override if needed.

---

### User Story 3 - Review and adjust split results before confirming import (Priority: P2)

After the LLM splits the ATM cash, the user sees the new rows in the preview table with category badges. The user can change any category assignment using the existing category dropdown before confirming the import. The user can also undo the entire split to return to the original ATM Withdrawal row.

**Why this priority**: Users need control over the final result — the LLM may not always get the mapping right, and the user should be able to correct mistakes before committing.

**Independent Test**: Can be tested by performing a split, changing a category on one of the resulting rows, and confirming the import — then verifying the corrected category persists.

**Acceptance Scenarios**:

1. **Given** a completed ATM cash split showing "€200 Cosmetics & Beauty", **When** the user changes the category to "Shopping", **Then** the row updates to show "Shopping" and this override is preserved on import confirmation.
2. **Given** a completed ATM cash split, **When** the user clicks an undo/reset action, **Then** the split rows are removed and the original ATM Withdrawal row is restored.

---

### Edge Cases

- What happens when the user enters notes that don't include explicit numeric amounts (e.g., "cosmetics, taxi, groceries" or "half for cosmetics, rest for taxi")? The system should show a validation error asking for explicit numeric amounts.
- What happens when the user enters a single note that exactly matches the withdrawal amount? The ATM Withdrawal row is fully replaced — no remainder row is shown.
- What happens when there are multiple ATM Withdrawal rows in the same import? Each one can be independently split with its own notes.
- What happens if the LLM call fails or times out? The system shows an error message and the original ATM Withdrawal row remains unchanged, allowing the user to retry.
- What happens when the user enters amounts in a different currency than the transaction? The system should treat all amounts as being in the same currency as the ATM Withdrawal transaction.
- What happens if there are no existing categories yet (empty category list)? The LLM should still parse the notes and assign all split rows to "Other"; the user can override categories via the dropdown after creating them.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a "Split Cash" action on ATM Withdrawal rows in the import preview table.
- **FR-002**: System MUST provide a text input field where the user can enter free-form spending notes for an ATM Withdrawal.
- **FR-003**: System MUST send the user's notes, the ATM Withdrawal amount, and the list of existing category names to an LLM in a single call.
- **FR-004**: System MUST parse the LLM response into structured line items, each with an amount and a matched category. If no existing category matches, the system MUST assign "Other".
- **FR-005**: System MUST validate that the sum of parsed amounts does not exceed the original ATM Withdrawal amount.
- **FR-006**: System MUST replace the original ATM Withdrawal row in the preview with the split line items, plus a remainder row if applicable. Each split row's description MUST be the user's note text for that expense (e.g., "cosmetics", "taxi").
- **FR-007**: System MUST allow the user to override the category on any split row using the existing category dropdown.
- **FR-008**: System MUST allow the user to undo a split, restoring the original ATM Withdrawal row.
- **FR-009**: System MUST persist the split rows as individual transactions when the import is confirmed.
- **FR-010**: System MUST show a loading indicator while the LLM call is in progress.
- **FR-011**: System MUST display a clear error message if the LLM call fails, and keep the original ATM Withdrawal row unchanged.
- **FR-012**: System MUST validate that the user's notes contain at least one amount before sending to the LLM.

### Key Entities

- **Cash Split Request**: A user's free-text notes associated with a specific ATM Withdrawal transaction, containing one or more expense descriptions with amounts.
- **Cash Split Line Item**: A single parsed expense from the notes, with an amount, a description, and a matched category. Multiple line items replace one ATM Withdrawal row in the preview.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can split an ATM Withdrawal into categorized expenses within 30 seconds of entering their notes.
- **SC-002**: The system correctly matches at least 80% of common expense descriptions (groceries, taxi, cosmetics, restaurants, etc.) to appropriate existing categories without user correction.
- **SC-003**: 100% of split transactions are accurately persisted with correct amounts that sum to the original ATM Withdrawal amount.
- **SC-004**: Users can undo a split and return to the original state in a single action.

## Assumptions

- Users have already completed the standard categorization step before using the ATM cash split feature (it is a post-categorization action).
- The free-text notes will be in the same language the user typically uses for their budget categories.
- Amounts in the notes are in the same currency as the ATM Withdrawal transaction.
- The existing LLM integration (Anthropic API) is available and will be reused for parsing notes.
- The feature applies only during the import preview phase, not to already-confirmed transactions.
- Each ATM Withdrawal can only be split once (user must undo before re-splitting).
