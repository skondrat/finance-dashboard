# Feature Specification: Auto-Detect Income from Statements

**Feature Branch**: `015-auto-income-from-statement`
**Created**: 2026-03-29
**Status**: Draft
**Input**: User description: "Income is deducted from Statement - if it has a plus sign, and it's not a transfer from self account, then it has to be added to Income Source with corresponding label and value."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Auto-Create Income from Imported Statement (Priority: P1)

When a user imports and confirms a bank statement, the system detects transactions with positive amounts (credits/deposits). If a positive transaction is not a self-transfer (e.g., "Transfer between balances"), it is automatically added as an Income Source entry for the corresponding month/year with the transaction description as the label and the amount as the value.

**Why this priority**: This is the only feature — auto-populating income eliminates manual data entry for the most predictable part of a user's finances.

**Independent Test**: Import a statement containing a mix of expenses (negative) and income (positive, e.g., salary deposit). Confirm the import. Verify that Income Sources are automatically created for the positive non-transfer transactions.

**Acceptance Scenarios**:

1. **Given** a statement contains a positive-amount transaction (e.g., "Salary +2000 EUR"), **When** the user confirms the import, **Then** an Income Source is created with label "Salary", amount 2000, and the correct month/year from the transaction date.
2. **Given** a statement contains a positive transaction labeled as a self-transfer (e.g., "Transfer between balances"), **When** the user confirms the import, **Then** no Income Source is created for that transaction.
3. **Given** a statement contains only negative transactions (expenses), **When** the user confirms the import, **Then** no Income Sources are created.
4. **Given** a statement contains multiple positive transactions, **When** the user confirms the import, **Then** an Income Source is created for each qualifying positive transaction.
5. **Given** income was auto-created from a statement, **When** the user views the Income Sources panel, **Then** the new entries appear with correct labels and amounts.

---

### Edge Cases

- What if a positive transaction is categorized as "Transfers"? It should be excluded (treated as self-transfer).
- What if the same income label already exists for that month? Create a new entry — the user can manually deduplicate via the existing delete button.
- Positive transactions with amount=0 should be ignored.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When an import is confirmed, the system MUST scan all transactions for positive amounts (amount > 0).
- **FR-002**: Positive transactions whose description contains "transfer between" (case-insensitive) MUST be excluded.
- **FR-003**: Positive transactions categorized as "Transfers" MUST be excluded.
- **FR-004**: For each qualifying positive transaction, the system MUST create an Income Source with: label = transaction description, amount = transaction amount, currency = transaction currency, month/year = transaction date's month/year.
- **FR-005**: The auto-created Income Sources MUST be visible immediately in the Income Sources panel after import confirmation.
- **FR-006**: Positive transactions that generate Income Sources MUST still be excluded from spend calculations (they are income, not expenses).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of qualifying positive transactions from imported statements automatically create Income Source entries.
- **SC-002**: Zero self-transfer transactions create Income Source entries.
- **SC-003**: Users see auto-created income entries immediately after confirming an import, with no manual steps required.

## Assumptions

- This is a backend-only change — the frontend already displays Income Sources and will show the new entries automatically after query invalidation.
- The import confirm flow already excludes "Transfer between balances" at parse time, but we also check at confirm time for any that slipped through or were categorized as Transfers.
- The feature applies to all import formats (CSV, PDF, OFX, etc.).
- Positive transactions are already stored in the database during preview — we just need to detect them at confirm time.
