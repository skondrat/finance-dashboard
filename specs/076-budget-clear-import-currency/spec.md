# Feature Specification: Budget Month Clear & Import Currency Selector

**Feature Branch**: `076-budget-clear-import-currency`  
**Created**: 2026-04-30  
**Status**: Draft  
**Input**: User description: "Two features: 1) On the Budget page, add an option under the Debug button to Clear all data for current month which removes budget transactions data only for the currently selected month. 2) When importing a statement, add a currency selector (EUR / USD / UAH) so the app knows in which currency the expenses are added."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Clear Budget Data for Current Month (Priority: P1)

As a user viewing the Budget page, I want to clear all budget transaction data for the currently selected month only, so I can re-import or start fresh for that month without affecting data from other months.

The user navigates to the Budget page, selects a month (e.g., March 2026), opens the Debug menu, and clicks "Clear current month data." The system asks for confirmation, then deletes only budget transactions belonging to that month. All other months' data remains untouched.

**Why this priority**: This is the more impactful feature for day-to-day workflow. Currently, the only reset option wipes all data across all months, which is destructive. A month-scoped clear enables iterative re-imports without data loss.

**Independent Test**: Can be fully tested by selecting a month on the Budget page, clicking the new debug option, confirming, and verifying that only that month's transactions are removed while other months remain intact.

**Acceptance Scenarios**:

1. **Given** the user is on the Budget page with March 2026 selected and has transactions in both March and April, **When** they click "Clear current month data" in the Debug menu and confirm, **Then** only March 2026 transactions are deleted and April data remains unchanged.
2. **Given** the user is on the Budget page with a month that has no transactions, **When** they click "Clear current month data," **Then** the system shows a confirmation dialog and completes without error (no-op).
3. **Given** the user clicks "Clear current month data" and sees the confirmation prompt, **When** they cancel, **Then** no data is deleted.

---

### User Story 2 - Select Currency During Statement Import (Priority: P2)

As a user importing a bank statement, I want to select the currency (EUR, USD, or UAH) for the import, so the system correctly records which currency the expenses are in.

When the user opens the import modal and drops or selects a file, they are presented with a currency selector (EUR / USD / UAH) before the upload proceeds. The selected currency is applied to all transactions in that import. For PDF imports that already show a source selector, the currency selector appears alongside it.

**Why this priority**: This ensures imported transactions carry the correct currency, which is critical for accurate budget summaries and currency conversion. Without it, the system defaults to EUR which may be incorrect for USD or UAH statements.

**Independent Test**: Can be fully tested by importing a statement file, selecting a currency, and verifying that all resulting transactions are tagged with the chosen currency.

**Acceptance Scenarios**:

1. **Given** the user opens the import modal and drops a CSV file, **When** the currency selector is visible, **Then** it shows EUR, USD, and UAH as options with EUR pre-selected as the default.
2. **Given** the user selects UAH as the currency and uploads a CSV statement, **When** the import preview loads, **Then** all transactions display UAH as their currency.
3. **Given** the user uploads a PDF statement with source "Monobank" and currency "UAH," **When** the import preview loads, **Then** all transactions from that import are tagged with UAH.
4. **Given** the user uploads a PDF statement, **When** both the source selector and currency selector are visible, **Then** the user can independently choose the source and currency before the upload begins.

---

### Edge Cases

- What happens when clearing a month that contains transactions from multiple imports? All transactions for that month are deleted regardless of which import they came from.
- What happens if the user changes the currency selector after dropping a file but before upload starts? The newly selected currency is used.
- What happens when a PDF parser extracts per-row currencies that differ from the user-selected currency? The user-selected currency takes precedence as the override for all rows in that import.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST add a "Clear current month data" option to the existing Debug menu on the Budget page.
- **FR-002**: System MUST prompt the user for confirmation before deleting any data, showing the month/year that will be affected.
- **FR-003**: System MUST delete only budget transactions whose date falls within the currently selected month and year.
- **FR-004**: System MUST refresh the Budget page data after a successful month clear to reflect the updated state.
- **FR-005**: System MUST display a currency selector (EUR, USD, UAH) in the import modal before file upload begins.
- **FR-006**: System MUST default the currency selector to EUR.
- **FR-007**: System MUST pass the selected currency to the backend so all imported transactions are tagged with that currency.
- **FR-008**: System MUST show the currency selector for all file types (CSV, OFX, MT940, PDF).
- **FR-009**: System MUST allow the currency selector to coexist with the existing PDF source selector without conflicting.

### Key Entities

- **Budget Transaction**: Existing entity representing an individual expense/income line. Has a `date` field (used for month filtering) and a `currency` field (set during import).
- **Import**: Existing entity representing a batch upload of transactions. The currency selection applies to all transactions within a single import.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can clear a single month's budget data in under 3 clicks from the Budget page (Debug menu > Clear current month > Confirm).
- **SC-002**: After clearing a month, 100% of transactions for that month are removed and 0% of transactions from other months are affected.
- **SC-003**: Users can select from 3 currency options (EUR, USD, UAH) before every statement import.
- **SC-004**: 100% of transactions from an import carry the user-selected currency value.

## Assumptions

- The Budget page already has a month selector that determines the "current month" context; the clear operation uses this same selected month.
- The existing Debug menu component supports adding new menu items without structural changes.
- EUR is the most common currency for this user and is a sensible default for the currency selector.
- The three currencies (EUR, USD, UAH) are sufficient for now; additional currencies can be added later if needed.
- The currency selector overrides any currency the parser may extract from the file content, providing a consistent user-controlled value.
