# Feature Specification: Networth Month Selector

**Feature Branch**: `077-networth-month-selector`
**Created**: 2026-05-01
**Status**: Draft
**Input**: User description: "I want to rework the Networth page. I want to add a month selector and year selector (same as on Budget page), and based on that it will show Account values (top cards and chart should stay the same and just show latest month values). The idea is that I can select some previous month and down below change values for an account or investment acocunt."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse account values for a previous month (Priority: P1)

The user lands on the Networth page. The current month is preselected in the month/year selector. The top summary cards and the historical net-worth chart show their normal latest-state view. The user picks a previous month from the selector. The accounts table below the chart redraws to show the per-account balances captured for that month. Investment-account values reflect the price snapshot taken at that month's close. Manual-account values reflect the balance the user had on record for that month.

**Why this priority**: This is the primary value of the feature — it lets the user audit and review their financial position at any prior point in time without leaving the page. Without this, the rest of the feature (editing past values) cannot be reached.

**Independent Test**: Pick any month older than the current one. Verify the accounts table swaps from current balances to the historical balances for that month. Verify the top KPI cards and the line chart do not change.

**Acceptance Scenarios**:

1. **Given** the user is on the Networth page on the current date, **When** the page loads, **Then** the month selector defaults to the current month and year, the top KPI cards show the latest net-worth figures, and the accounts table shows current live balances.
2. **Given** the user is viewing the current month, **When** they change the month selector to a previous month that has a snapshot, **Then** the accounts table replaces every row with that month's snapshot values (manual + investment), while the top KPI cards and the line chart stay unchanged.
3. **Given** the user has selected a previous month, **When** they switch back to the current month, **Then** the table returns to showing live balances and the "Add Account" button becomes available again.
4. **Given** the user selects a month for which no snapshot exists, **When** the table renders, **Then** the user sees a clearly-labeled empty state explaining that no historical data was captured for that month, with a suggestion to use the existing "Import previous networth" flow.

---

### User Story 2 - Correct a value in a previous month (Priority: P1)

After selecting a previous month, the user clicks on a value in the accounts table and edits it inline (same interaction pattern as the current month). The change persists to that month's snapshot only — it does not alter the user's current balance. After saving, the chart reflects the corrected historical point.

**Why this priority**: This is the explicit reason the user asked for the feature: to "change values for an account or investment account" in a past month. Without this, the month selector would be read-only and the feature would not solve the stated problem.

**Independent Test**: Select a previous month, click a balance cell, change the number, hit Enter. Reload the page, navigate back to that month, and verify the new value persists. Switch to the current month and verify live balances are unchanged.

**Acceptance Scenarios**:

1. **Given** the user has selected a previous month with snapshot data, **When** they click a manual-account balance cell, **Then** the cell becomes an editable input prefilled with that month's balance for that account.
2. **Given** the user is editing a past-month balance, **When** they confirm the edit, **Then** the snapshot for that month is updated, the historical chart point recalculates accordingly, and the user's current live balance for that account is unchanged.
3. **Given** the user has selected a previous month, **When** they click an investment-account balance cell, **Then** the cell becomes editable and saving the change updates that month's snapshot value for that investment account.
4. **Given** the user is editing a past-month value, **When** they press Escape or click away without confirming, **Then** the cell reverts to the saved value with no change persisted.
5. **Given** the user is viewing the current month, **When** they click and edit a manual-account balance, **Then** behavior is unchanged from today — the live account balance is updated.

---

### User Story 3 - Read-only protection where editing doesn't make sense (Priority: P2)

Some controls only make sense in the context of "now" — adding a new account, deleting an account, or changing an account's currency or type. When the user is viewing a previous month, these controls are hidden or disabled, with a brief hint explaining why. Switching back to the current month restores them.

**Why this priority**: This prevents data-integrity bugs (e.g., an account "added" three months ago retroactively appearing in past snapshots) and avoids user confusion. It is P2 because the feature still works without it — users who only need to read or correct balances are served by P1.

**Independent Test**: Select a previous month. Verify the "Add Account" button is hidden or disabled. Verify per-row edit/delete icons no longer expose the full account-edit modal (only the inline balance edit remains). Switch back to current month and verify all controls reappear.

**Acceptance Scenarios**:

1. **Given** the user has selected a previous month, **When** they look at the page header, **Then** the "Add Account" button is either hidden or disabled with a tooltip explaining that new accounts can only be added in the current month.
2. **Given** the user has selected a previous month, **When** they look at the accounts table rows, **Then** the only edit affordance available is the inline balance cell — full edit and delete actions are not offered for historical values.

---

### Edge Cases

- **Future months**: The month selector must not allow selecting future months — no data exists yet, and editing a future snapshot would be meaningless.
- **Earliest available month**: The selector should not let the user pick months earlier than the oldest snapshot or account creation date — selecting such a month should produce a "no data" empty state rather than a broken view.
- **An account that did not exist in the selected month**: For example, an account created in March cannot have a January value. It must not appear in the January view, and the percentages in the table must be recomputed against the totals that *did* exist in that month.
- **Currency conversion**: All historical values must be displayed in the user's selected display currency, converted using the rate that was applicable at the snapshot's month-end (so the table reconciles with the historical chart point).
- **Concurrent edits**: If the user has the page open in two tabs and edits the same past month differently in each, last write wins — there is no merge logic.
- **Persistence across page navigations**: The selected month should persist within the session (consistent with the Budget page pattern), so the user can leave and come back without losing their selection.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Networth page MUST display a month selector and year selector at the top of the historical-data section, using the same visual style as the Budget page's monthly mode.
- **FR-002**: The selector MUST default to the current month and year on first load and MUST remember the user's last selection across page revisits within the same session.
- **FR-003**: The summary KPI cards at the top of the page MUST always show the latest available net-worth figures, regardless of the selected month.
- **FR-004**: The historical net-worth line chart MUST always show the full historical series, regardless of the selected month.
- **FR-005**: When the current month is selected, the accounts table MUST behave exactly as it does today — live balances for manual accounts, computed values for investment accounts, full edit/delete/add controls available.
- **FR-006**: When a previous month is selected, the accounts table MUST display the per-account balances captured in that month's net-worth snapshot, including both manual-source and investment-source rows.
- **FR-007**: When a previous month is selected, the user MUST be able to edit the balance of any account row inline (same click-to-edit interaction as today), and the edit MUST be persisted only to that month's snapshot, not to the live account balance.
- **FR-008**: The "% of Total" column in the accounts table MUST be recomputed from the totals that apply to the selected month, not from current totals.
- **FR-009**: The system MUST hide or disable the "Add Account" button when a previous month is selected, since adding accounts only makes sense for the present.
- **FR-010**: The system MUST hide or disable per-row "Edit" and "Delete" actions (the buttons that open the full account-edit modal or remove an account) when a previous month is selected. Only the inline balance edit remains available for historical rows.
- **FR-011**: The system MUST NOT allow the user to select a future month (later than the current calendar month).
- **FR-012**: If the user selects a month for which no snapshot exists, the accounts table MUST show an empty state with a clear message and a hint pointing to the existing "Import previous networth" flow.
- **FR-013**: All values displayed in the accounts table MUST be shown in the user's currently-selected display currency, converted using the historical exchange rate appropriate for that snapshot's month.
- **FR-014**: When a past-month edit is saved, the historical line chart and any other historical totals MUST refresh to reflect the corrected value without requiring a full page reload.

### Key Entities

- **Net-worth snapshot**: A captured set of account balances for a specific month, including breakdown rows per account (manual and investment), the total net worth, the snapshot's currency, and metadata about whether it was auto-captured or manually imported. Already exists in the system.
- **Snapshot breakdown row**: A single account's recorded balance within a snapshot — its name, balance, source (manual vs. investment), and account type. Already exists in the system; this feature exposes them as the editable units of the per-month accounts table.
- **Currently-selected month**: A UI-side piece of session state representing which month the accounts table is bound to. New to this feature.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can switch the accounts table between any two months in under 2 seconds (perceived response time) on a typical laptop.
- **SC-002**: A user who needs to correct a balance in a past month can do so without leaving the Networth page — no modal, no separate screen — completing the correction in under 30 seconds end-to-end.
- **SC-003**: The number of clicks needed to reach a past-month value (from page load) is at most 3 (open month selector, pick year if different, pick month).
- **SC-004**: 100% of past-month edits made through the inline cell are persisted exclusively to the targeted month — zero unintended changes to live balances or other months' snapshots, verifiable by inspecting the live account balance and other snapshots before and after the edit.
- **SC-005**: Selecting a month with no recorded snapshot produces a labeled empty state in 100% of cases — no broken layout, no stale data from a different month.

## Assumptions

- The existing "Edit previous networth" modal flow continues to exist in parallel for now and is not removed by this feature; this feature provides a more direct, in-context alternative to that modal. Removing or consolidating with it can be considered a follow-up.
- The user's display currency selection (set elsewhere in the app) drives the currency shown in the historical accounts table — no per-month currency override is introduced.
- Investment-account historical values come from snapshot breakdowns that already capture them at month-end. No new price-history backfill is needed; if a past month lacks a captured investment value for a given account, that row is simply absent from that month's view.
- The month selector exposes only months between the earliest existing snapshot (or the earliest account-creation date, whichever applies) and the current month, inclusive.
- The session-persistence behavior follows the Budget page's existing convention (sessionStorage, lost on tab close), not a long-lived user preference.
- Top KPI cards and the historical chart remain entirely unchanged in their data sources and behavior — they are out of scope for this feature.
