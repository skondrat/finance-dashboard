# Feature Specification: Transaction Edit/Delete, Net Worth Currency, Account Currency Display

**Feature Branch**: `031-txn-edit-networth-currency`
**Created**: 2026-03-30
**Status**: Draft
**Input**: User description: "Edit/delete transactions via 3-dot menu. Net worth tab shows history in EUR but not USD. Show base currency for each account."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Edit and Delete Transactions (Priority: P1)

A user wants to correct a mistake in a transaction (wrong quantity, price, or date) or remove a transaction entirely. Currently there is no way to edit or delete transactions from the UI. Each transaction card should have a 3-dot options menu on the right side with "Edit" and "Delete" actions.

**Why this priority**: Data correction is essential — a single wrong transaction throws off all portfolio calculations. Users need this before anything else.

**Independent Test**: Find a transaction in the list, click the 3-dot menu, select Edit — verify the transaction fields are editable and can be saved. Click Delete — verify the transaction is removed after confirmation.

**Acceptance Scenarios**:

1. **Given** a transaction is displayed in the list, **When** the user clicks the 3-dot menu on the right side, **Then** a dropdown appears with "Edit" and "Delete" options.
2. **Given** the user selects "Edit", **When** the edit form opens, **Then** all transaction fields (asset, type, quantity, price, currency, fees, date) are pre-filled and editable.
3. **Given** the user saves an edited transaction, **When** the save completes, **Then** the transaction list updates with the new values and portfolio calculations refresh.
4. **Given** the user selects "Delete", **When** a confirmation dialog appears and they confirm, **Then** the transaction is removed and portfolio calculations refresh.
5. **Given** the user clicks "Delete" but cancels the confirmation, **When** the dialog closes, **Then** the transaction remains unchanged.

---

### User Story 2 - Net Worth History Respects Currency Toggle (Priority: P2)

The Net Worth tab shows historical snapshots in EUR regardless of the EUR/USD toggle. When the user switches to USD, the net worth history should display values converted to USD using the exchange rate, consistent with how the portfolio page works.

**Why this priority**: Inconsistency between portfolio (which respects the toggle) and net worth (which doesn't) confuses users.

**Independent Test**: Navigate to the Net Worth tab, toggle to USD. Verify that all historical net worth values change proportionally by the EUR/USD exchange rate.

**Acceptance Scenarios**:

1. **Given** the user is on the Net Worth tab in EUR mode, **When** they toggle to USD, **Then** all net worth history values are converted using the EUR/USD rate.
2. **Given** the user views the net worth chart in USD, **When** the chart renders, **Then** the Y-axis and data points show USD values.

---

### User Story 3 - Show Account Base Currency (Priority: P3)

Each account in the Accounts section of the portfolio page should display its base currency (e.g., "USD" for Interactive Brokers, "EUR" for Kraken) so users know what currency the account's transactions are denominated in.

**Why this priority**: Minor informational improvement — helpful context but not blocking any workflow.

**Independent Test**: View the Accounts section in the portfolio sidebar. Verify each account shows its base currency label.

**Acceptance Scenarios**:

1. **Given** accounts are listed in the sidebar, **When** the user views them, **Then** each account displays its base currency (e.g., "USD", "EUR") alongside the account type.

---

### Edge Cases

- What happens when editing a transaction and changing the asset? The system should allow it — it's effectively replacing the transaction.
- What happens when deleting the only transaction for an asset? The position should disappear from the portfolio.
- What if the net worth snapshots were recorded in EUR only? Convert them using the exchange rate for the snapshot date.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each transaction card MUST display a 3-dot options menu on the right side.
- **FR-002**: The options menu MUST contain "Edit" and "Delete" actions.
- **FR-003**: "Edit" MUST open an inline or modal form with all transaction fields pre-filled.
- **FR-004**: "Delete" MUST show a confirmation dialog before removing the transaction.
- **FR-005**: After edit or delete, all portfolio calculations (positions, KPIs, chart) MUST refresh.
- **FR-006**: The Net Worth tab MUST respect the EUR/USD currency toggle and convert historical values accordingly.
- **FR-007**: Each account in the Accounts section MUST display its base currency.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can edit any field of an existing transaction and see the updated values reflected in the portfolio.
- **SC-002**: Users can delete a transaction with confirmation, and it disappears from the list.
- **SC-003**: Toggling to USD on the Net Worth tab changes all historical values proportionally.
- **SC-004**: Each account shows its currency label (e.g., "USD", "EUR") in the sidebar.

## Assumptions

- Backend PUT and DELETE endpoints for transactions already exist (`PUT /accounts/{id}/transactions/{txn_id}`, `DELETE /accounts/{id}/transactions/{txn_id}`).
- The 3-dot menu will be a simple dropdown — no external component library needed.
- Net worth snapshots are stored in EUR and need to be converted on display, not re-stored.
- Account base currency can be derived from the most common transaction currency for that account, or from a field on the Account model if it exists.
