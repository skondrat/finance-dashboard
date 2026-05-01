# Quickstart: Networth Month Selector

**Feature**: 077-networth-month-selector
**Audience**: Anyone manually verifying the feature in a browser via Playwright MCP

This document is the manual test plan that maps directly to the spec's acceptance scenarios. Run it after `/speckit.implement` finishes and before opening the PR.

---

## Prerequisites

1. **Backend running** on its default port:
   ```bash
   cd backend && uvicorn app.main:app --reload
   ```
2. **Frontend running** on its default port:
   ```bash
   cd frontend && npm run dev
   ```
3. **Test data**: a user account that has at least 3 monthly snapshots in `networth_snapshots`, including:
   - The current month (auto-captured)
   - At least one past month with a non-empty `breakdown` (manual + investment rows)
   - At least one month with no snapshot (gap) — if no gap exists, pick a year/month outside the recorded range during the empty-state test
4. **Playwright MCP** session open at `http://localhost:3000/networth` after logging in.

---

## Verification path 1 — Default state (User Story 1, scenario 1)

1. Navigate to `/networth`.
2. **Expect**: month selector shows the current month and current year preselected.
3. **Expect**: top KPI cards render the latest net-worth figures (matching what they showed before this feature).
4. **Expect**: the historical line chart renders the full series.
5. **Expect**: the accounts table shows the current live balances (manual rows editable inline; investment rows non-editable).
6. **Expect**: the "Add Account" button is visible in the page header.

✅ Take screenshot.

---

## Verification path 2 — Switching to a past month (User Story 1, scenarios 2 & 3)

1. From the default state, change the **month** dropdown to a past month known to have a snapshot.
2. **Expect**: the accounts table immediately re-renders with the values stored in that snapshot's breakdown — including both manual and investment rows.
3. **Expect**: the top KPI cards are unchanged. The line chart is unchanged.
4. **Expect**: the "Add Account" button is no longer visible.
5. **Expect**: per-row Edit (✎) and Delete (×) icons are no longer visible.
6. **Expect**: the "% of Total" column is computed against that month's total, not the current total.
7. Change the dropdown back to the current month.
8. **Expect**: the table reverts to live behavior; the "Add Account" button reappears.

✅ Take screenshot at step 2 and step 7.

---

## Verification path 3 — Inline edit of a manual past-month value (User Story 2, scenarios 1, 2, 4)

1. Select a past month with snapshot data.
2. Note the current value of one manual-account row, say €1,234.56.
3. Click the balance cell for that row.
4. **Expect**: it becomes an editable input prefilled with `1234.56`.
5. Press **Escape** without changing anything.
6. **Expect**: the cell reverts to €1,234.56 and no network request was made.
7. Click the cell again, change to `1500`, press **Enter**.
8. **Expect**: the cell saves; refetch happens; the new value (€1,500.00) is shown; that month's chart point updates accordingly.
9. Switch to the current month.
10. **Expect**: the live balance for that account is unchanged from before step 7 (the edit must not have leaked into live data).
11. Switch back to the past month.
12. **Expect**: the new value (€1,500.00) is still there.
13. **Restore** the original value (€1,234.56) so the test data isn't permanently mutated.

✅ Take screenshots at step 4, 8, and 12.

---

## Verification path 4 — Inline edit of an investment past-month value (User Story 2, scenario 3)

1. With a past month selected, click the balance cell on an investment-source row.
2. **Expect**: same inline-edit input as for manual rows.
3. Change the value, press Enter.
4. **Expect**: the cell saves; the chart point for that month updates.
5. Switch to the current month and confirm the investment row's live computed value is unchanged.
6. Restore the original value.

✅ Take screenshot at step 4.

---

## Verification path 5 — Empty state for a month with no snapshot (User Story 1, scenario 4)

1. Pick a year/month combination that has no snapshot (a gap, or a date older than the earliest snapshot).
2. **Expect**: the accounts table area shows an empty-state message that says no data was captured for that month and that points the user to the existing "Import previous networth" flow under the Settings menu.
3. **Expect**: top KPI cards and the chart remain visible and unchanged.

✅ Take screenshot.

---

## Verification path 6 — Future month is not selectable (FR-011)

1. Confirm the current calendar month/year in the test data context.
2. Try to select a future month (e.g., if today is May 2026, try June 2026 in the dropdown).
3. **Expect**: it is either not present in the dropdown, or rendered as a disabled `<option>` that cannot be chosen.

✅ Take screenshot.

---

## Verification path 7 — Session persistence (FR-002)

1. Set the selector to a past month.
2. Click around to another tab in the dashboard (e.g., `/budget`).
3. Navigate back to `/networth`.
4. **Expect**: the selector is still on the past month chosen in step 1.
5. Close the tab and reopen `/networth` in a new tab.
6. **Expect**: the selector defaults back to the current month (sessionStorage cleared).

---

## Acceptance gate

Before opening the PR, verify:
- [ ] All 7 verification paths above pass
- [ ] Top KPI cards never visibly change between current and past-month selection
- [ ] Chart never visibly changes between current and past-month selection (it does change *only* when a past-month edit is saved, reflecting the corrected point)
- [ ] No console errors in the browser DevTools
- [ ] Screenshots attached to the PR description

---

## Cleanup

Restore any test-data values that were mutated in paths 3 and 4 to keep the local DB in a sane state for subsequent feature development.
