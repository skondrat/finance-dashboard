# Feature Specification: Networth Tab

**Feature Branch**: `018-networth-tab`
**Created**: 2026-03-29
**Status**: Draft
**Input**: User description: "I want to have an extra tab called Networth. It will have all my bank account, crypto wallets and maybe cash savings (I will enter them manually, don't confuse with accounts from Investments tab) in a table (e.g. Wise, Revolut, Millenium, Cash, Crypto wallet), and also current investments, so basically I see all my networth in one place."

## Clarifications

### Session 2026-03-29

- Q: How should investments appear in the Networth breakdown table — single aggregate, per portfolio account, or per individual holding? → A: Per-account rows (one row per portfolio account, e.g., "Interactive Brokers: $30k", "Degiro: $20k").

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Total Net Worth at a Glance (Priority: P1)

As a user, I want to open the Networth tab and immediately see my total net worth — the sum of all my manually entered account balances plus the current value of my investment portfolio. This gives me a single place to understand my complete financial position.

**Why this priority**: The core value of this feature is the consolidated view. Without it, users must mentally add up balances across the Portfolio tab and external bank/wallet sources.

**Independent Test**: Can be fully tested by navigating to the Networth tab and verifying a summary total is displayed, even with zero accounts (showing just investment totals or zero).

**Acceptance Scenarios**:

1. **Given** the user has added manual accounts and has investments in the Portfolio tab, **When** they navigate to the Networth tab, **Then** they see a total net worth figure that sums all manual account balances and the current portfolio value.
2. **Given** the user has no manual accounts and no investments, **When** they navigate to the Networth tab, **Then** they see a net worth of zero with a prompt to add accounts.
3. **Given** the user has manual accounts but no investments, **When** they view the Networth tab, **Then** the total net worth reflects only the manual account balances.

---

### User Story 2 - Manage Manual Accounts (Priority: P1)

As a user, I want to add, edit, and remove manual accounts (bank accounts, crypto wallets, cash savings) so that I can keep track of balances that are not part of my investment portfolio. Each account has a name (e.g., "Wise", "Revolut", "Millenium", "Cash", "Crypto wallet"), a current balance, and a currency.

**Why this priority**: Without the ability to enter manual accounts, the Networth tab cannot show anything beyond investment data, which the Portfolio tab already provides.

**Independent Test**: Can be fully tested by adding a manual account with a name, balance, and currency, then verifying it appears in the accounts table and can be edited or deleted.

**Acceptance Scenarios**:

1. **Given** the user is on the Networth tab, **When** they click "Add Account", **Then** a form appears where they can enter an account name, balance, and currency.
2. **Given** the user fills in valid account details, **When** they submit the form, **Then** the account appears in the accounts table with the entered balance.
3. **Given** an account exists in the table, **When** the user clicks edit on that account, **Then** they can update the name, balance, or currency and save changes.
4. **Given** an account exists in the table, **When** the user deletes the account, **Then** it is removed from the table and the total net worth is updated.
5. **Given** the user adds an account with a currency different from the display currency, **When** viewing the Networth tab, **Then** the balance is converted to the display currency for the total calculation.

---

### User Story 3 - View Breakdown Table (Priority: P2)

As a user, I want to see a table that breaks down my net worth by individual source — each manual account listed as a row, plus a row (or section) showing the total current investment portfolio value pulled from the existing portfolio data. This way I can see exactly where my money is.

**Why this priority**: The breakdown provides transparency beyond just the total. Users need to see each component to identify which accounts hold the most value and to verify correctness.

**Independent Test**: Can be fully tested by adding multiple manual accounts and confirming each appears as a row in the breakdown table alongside the investment portfolio total.

**Acceptance Scenarios**:

1. **Given** the user has 3 manual accounts and 2 portfolio accounts, **When** they view the Networth tab, **Then** the table shows 5 rows: one for each manual account and one for each portfolio account.
2. **Given** the breakdown table is displayed, **When** the user looks at each row, **Then** each row shows the account name, current balance (in display currency), and percentage of total net worth.
3. **Given** the user updates a manual account balance, **When** the table refreshes, **Then** the percentages and total recalculate accordingly.

---

### User Story 4 - Update Account Balances Quickly (Priority: P2)

As a user, I want to quickly update the balance of any manual account (e.g., after checking my bank app) without going through a full edit form. This encourages regular updates and keeps the net worth view accurate.

**Why this priority**: Ease of updating balances is key to adoption — if it's cumbersome, users won't keep data current.

**Independent Test**: Can be fully tested by clicking on a balance value in the table, editing it inline, and confirming the new value persists.

**Acceptance Scenarios**:

1. **Given** an account exists in the table, **When** the user clicks on the balance cell, **Then** it becomes editable inline.
2. **Given** the user enters a new balance and confirms (e.g., pressing Enter or clicking away), **When** the update is saved, **Then** the total net worth reflects the new balance immediately.

---

### Edge Cases

- What happens when the user enters a negative balance (e.g., an overdrawn account)? The system should accept it and subtract it from the total net worth.
- What happens when a portfolio account has no positions? That account row should show zero.
- What happens when currency conversion rates are unavailable for a manual account's currency? The system should display the unconverted value with a warning indicator.
- What happens when the user tries to add an account with a duplicate name? The system should allow it (different accounts can share names, e.g., two "Cash" entries).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a "Networth" tab accessible from the main navigation, alongside the existing Portfolio, Budget, and Cashflow tabs.
- **FR-002**: System MUST allow users to create manual accounts with a name (free text), current balance (numeric), and currency.
- **FR-003**: System MUST allow users to edit and delete existing manual accounts.
- **FR-004**: System MUST persist manual account data so it survives page reloads and sessions.
- **FR-005**: System MUST display all manual accounts in a table showing account name, balance, currency, and percentage of total net worth.
- **FR-006**: System MUST display each portfolio account as a separate row in the net worth breakdown, showing the account name and its current total value (pulled from existing portfolio data).
- **FR-007**: System MUST calculate and display the total net worth as the sum of all manual account balances plus the investment portfolio value, converted to the user's display currency.
- **FR-008**: System MUST support inline editing of account balances for quick updates.
- **FR-009**: System MUST accept negative balances (e.g., overdrawn accounts) and reflect them in the total.
- **FR-010**: System MUST convert manual account balances to the display currency when calculating totals, using available exchange rates.
- **FR-011**: System MUST show a warning indicator when a currency conversion rate is unavailable.

### Key Entities

- **NetworthAccount**: A manually entered financial account. Attributes: name, balance, currency, type (bank account, crypto wallet, cash), last updated timestamp.
- **Networth Summary**: A computed view combining all NetworthAccount balances with the current investment portfolio total, showing the overall net worth.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can add a new manual account and see it reflected in their net worth total within 5 seconds.
- **SC-002**: Users can view a complete breakdown of their net worth (manual accounts + investments) in a single screen without navigating to other tabs.
- **SC-003**: Users can update an account balance in 2 clicks or fewer (click to edit, confirm).
- **SC-004**: The net worth total accurately reflects the sum of all manual balances and the current portfolio value, with correct currency conversion.

## Assumptions

- Manual accounts (bank accounts, crypto wallets, cash) are entirely separate from Portfolio/investment accounts — there is no automatic sync or overlap.
- The existing portfolio summary endpoint provides the current total portfolio value, which can be reused for the investment portion of net worth.
- The app's existing currency store and exchange rate mechanism will be reused for converting manual account currencies to the display currency.
- Account types (bank, crypto, cash) are informational labels; they do not affect calculations.
- There is no automatic balance fetching from external banks or wallets — all manual account data is entered by the user.
- The Networth tab follows the same visual design patterns (dark/light mode, responsive layout) as existing tabs.
