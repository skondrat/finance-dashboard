# Tasks: Networth Month Selector

**Input**: Design documents from `/specs/077-networth-month-selector/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, quickstart.md ✓

**Tests**: No test tasks generated. Per Constitution III, manual browser verification with Playwright MCP is the test plan (see `quickstart.md`). No unit/integration tests were requested in the spec.

**Organization**: Tasks are grouped by user story so each story can be implemented and verified independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- File paths are absolute from the repo root.

## Path Conventions

This is a frontend-only feature. All code changes live in:

- `frontend/src/app/(dashboard)/networth/page.tsx`
- `frontend/src/components/networth/`

The backend is unchanged.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No project initialization needed — the feature edits an existing app. This phase is intentionally minimal.

- [X] T001 Verify the dev environment runs cleanly: start backend (`cd backend && uvicorn app.main:app --reload`) and frontend (`cd frontend && npm run dev`), then confirm `http://localhost:3000/networth` renders today's behavior with no console errors before any code changes.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the small selector primitive and the page-level state that every user story depends on. Without these, no user story can be wired up.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 Create the `<NetworthMonthSelector>` component at `frontend/src/components/networth/month-selector.tsx`. Two `<select>` dropdowns (month, year) using the same `selectClass` styling as `frontend/src/components/budget/time-aggregation.tsx`. Props: `month: number`, `year: number`, `availableYears: number[]`, `currentMonth: number`, `currentYear: number`, `onMonthChange(m)`, `onYearChange(y)`. Disable any month later than the current calendar month within the current year (per FR-011). Do not include the segmented period control — month/year only.

- [X] T003 Add `selectedMonth` and `selectedYear` state to `frontend/src/app/(dashboard)/networth/page.tsx`, with `sessionStorage` persistence under keys `networth_month` and `networth_year`. Default to the current calendar month/year on first load. Use the same inline `readSessionInt` pattern that `frontend/src/app/(dashboard)/budget/page.tsx` uses. Compute `isCurrentMonth: boolean` and a `selectedMonthKey: string` (in `"YYYY-MM"` format) and pass them to children.

- [X] T004 Render `<NetworthMonthSelector>` in `frontend/src/app/(dashboard)/networth/page.tsx`, placed above the accounts table and below the chart row (so the top KPI cards and chart visibly stay locked to "latest"). Compute `availableYears` from the loaded `useNetworthHistory()` snapshots' `snapshot_month` values plus the current year, deduplicated and sorted ascending.

**Checkpoint**: Foundation ready — selector renders, state persists across reloads, but selecting a past month does not yet change the table.

---

## Phase 3: User Story 1 — Browse account values for a previous month (Priority: P1) 🎯 MVP

**Goal**: When the user picks a past month, the accounts table swaps from current live balances to the per-account balances stored in that month's snapshot breakdown. Top KPI cards and the chart stay unchanged.

**Independent Test**: From the running app, change the month dropdown to a past month with a known snapshot. Verify the accounts table values match that snapshot's `breakdown` field exactly. Verify KPI cards and the chart are unchanged. Switch back to current month and verify live behavior is restored.

### Implementation for User Story 1

- [X] T005 [US1] In `frontend/src/components/networth/accounts-table.tsx`, extend the component's props to accept `selectedMonthKey: string`, `isCurrentMonth: boolean`, and `historicalSnapshot: NetworthSnapshot | null`. When `isCurrentMonth` is true, render exactly the existing live behavior (no regression). When false, render a historical view from `historicalSnapshot.breakdown`.

- [X] T006 [US1] Inside `accounts-table.tsx`, add a `renderHistoricalRow(entry, index, total)` helper that takes one `breakdown` entry and renders the same six-column grid as the live row (Account, Type, Currency, Balance, % of Total, Actions). For the historical view: leave the Currency column blank for both manual and investment rows (the breakdown values are already in the user's display currency — no per-row original currency is stored), set Type from `entry.account_type` for manual rows or "Investment" for investment rows, and recompute "% of Total" using the sum of all breakdown balances in this snapshot per FR-008.

- [X] T007 [US1] In `accounts-table.tsx` historical view, group breakdown rows into the same two sections used today: "Current Accounts" for `entry.source === "manual"`, "Investment Accounts" for `entry.source === "investment"`. Apply the existing `showDebts` filter to manual rows (skip rows with `account_type === "debt"` when `showDebts` is false).

- [X] T008 [US1] When `isCurrentMonth` is false and `historicalSnapshot` is `null` (no snapshot exists for the selected month), render an empty-state block in place of the rows. Message: "No net-worth data captured for this month." Hint: "Use Settings → Import previous networth to add it." Match the existing `EmptyState` component's visual style if it fits, otherwise inline a small block consistent with the table's container styling. This satisfies FR-012.

- [X] T009 [US1] In `frontend/src/app/(dashboard)/networth/page.tsx`, look up the snapshot matching `selectedMonthKey` from `useNetworthHistory()` data and pass it as `historicalSnapshot` to `<AccountsTable>`. When the lookup fails, pass `null` (the table renders empty state per T008).

**Checkpoint**: User Story 1 fully working. The user can browse past months and see correct data; KPI cards and chart are untouched. This alone is shippable as the MVP.

---

## Phase 4: User Story 2 — Correct a value in a previous month (Priority: P1)

**Goal**: From the historical view, the user can click any balance cell, edit inline, and persist the change to that month's snapshot only. Live balances are not affected. The chart picks up the corrected historical point automatically.

**Independent Test**: Per `quickstart.md` paths 3 and 4. Edit a manual past-month value, confirm the snapshot updates, confirm the live balance is untouched, confirm the chart point moves. Repeat for an investment row. Verify Escape and click-away cancel the edit.

### Implementation for User Story 2

- [X] T010 [US2] Create a `HistoricalInlineEditCell` component inside `frontend/src/components/networth/accounts-table.tsx` (same file — keeps the historical render branch self-contained). Props: `value: number`, `currency: string`, `snapshotId: string`, `breakdown: BreakdownEntry[]`, `entryIndex: number`. Behavior mirrors the existing `InlineEditCell`: click to edit, Enter saves, Escape reverts, blur saves. Uses the existing `useUpdateSnapshot` mutation from `frontend/src/lib/queries/networth.ts`.

- [X] T011 [US2] In `HistoricalInlineEditCell`, on save: build a new `breakdown` array by replacing the row at `entryIndex` with `{ ...entry, balance: parsed }`, compute `new_total = sum(new_breakdown.balance)`, and call `mutate({ id: snapshotId, total_networth: new_total, breakdown: new_breakdown })`. Skip the network call if `parsed` equals the current value (matches existing `InlineEditCell` behavior).

- [X] T012 [US2] Wire `HistoricalInlineEditCell` into `renderHistoricalRow` (from T006) for both manual and investment rows — investment values are inline-editable in past-month view per FR-007 and decision 7 in research.md.

- [X] T013 [US2] Confirm via the existing `onSuccess` handler in `useUpdateSnapshot` that `["networth"]` is invalidated (it already is). No code change here — this task is the explicit verification per research decision 8 that no additional invalidation key is needed for the chart and KPI cards to refresh appropriately.

**Checkpoint**: A user can audit and correct a past-month balance entirely on the Networth page, no modals.

---

## Phase 5: User Story 3 — Read-only protection where editing doesn't make sense (Priority: P2)

**Goal**: When a past month is selected, hide the page-level "Add Account" button and the per-row Edit/Delete icons. Only inline balance edits remain available for historical rows.

**Independent Test**: Select a past month. Verify the "Add Account" button is no longer visible in the page header. Verify the ✎ and × icons are missing from each row. Switch to current month and verify both reappear and behave as before.

### Implementation for User Story 3

- [X] T014 [US3] In `frontend/src/app/(dashboard)/networth/page.tsx`, conditionally render the "Add Account" button only when `isCurrentMonth` is true. Per research decision 7, hide rather than disable.

- [X] T015 [US3] In `frontend/src/components/networth/accounts-table.tsx`, in `renderHistoricalRow` (from T006), do not render the Edit (✎) and Delete (×) icons. The Actions cell stays in the grid (to keep alignment) but renders no buttons in the historical view.

**Checkpoint**: All user stories functional. Past-month view is read-only except for inline balance edits, which is exactly the intended UX.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanups and the manual verification gate.

- [X] T016 Run the seven verification paths from `specs/077-networth-month-selector/quickstart.md` end-to-end with Playwright MCP. Capture screenshots for paths 1, 2, 3, 4, 5, 6. Restore any test-data values mutated during paths 3 and 4 to keep the local DB stable.

- [X] T017 [P] Run `npm run lint` in `frontend/` and fix any new warnings introduced by this feature.

- [X] T018 [P] Run `npx tsc --noEmit` in `frontend/` and fix any type errors introduced by this feature.

- [X] T019 Visual sanity check on mobile width (resize the browser to ~390px) — confirm the month/year dropdowns and the table do not break the layout. No CSS changes expected, but flag any regressions.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)** runs first; it is just a smoke check.
- **Foundational (T002–T004)** must complete before any user story phase begins. T002 and T003 are independent files and can run in parallel; T004 depends on both being done.
- **US1 (T005–T009)** depends on Foundational; this is the MVP increment.
- **US2 (T010–T013)** depends on US1 (it edits the historical render branch added in US1).
- **US3 (T014–T015)** depends on US1 (it hides controls inside the same components US1 modifies). Independent of US2 — could ship before or after US2.
- **Polish (T016–T019)** depends on all desired user stories being merged in.

### User Story Dependencies

- **US1 (P1)**: Depends on Foundational only.
- **US2 (P1)**: Depends on US1 — the historical render branch must exist before inline edits can plug into it.
- **US3 (P2)**: Depends on US1 — needs `isCurrentMonth` plumbing and the historical render path.

### Within Each User Story

- US1: T005 → T006 → T007 → T008 (each builds on the previous render-branch logic in the same file). T009 in the page file can be done in parallel with T005–T008 since it only wires data through.
- US2: T010 → T011 → T012 → T013 (T010 defines the cell, T011 fills its save handler, T012 mounts it, T013 is a verification).
- US3: T014 and T015 are in different files and can run in parallel.

### Parallel Opportunities

- T002 and T003 (Foundational, different files): parallel.
- T009 (page wiring) can run alongside T005–T008 if developers split work; it touches a different file.
- T014 and T015 within US3: parallel.
- T017 and T018 within Polish: parallel.

---

## Parallel Example: Foundational

```bash
# Launch the two independent foundational tasks together:
Task: "Create <NetworthMonthSelector> in frontend/src/components/networth/month-selector.tsx (T002)"
Task: "Add selectedMonth/selectedYear state with sessionStorage in frontend/src/app/(dashboard)/networth/page.tsx (T003)"
```

## Parallel Example: Polish

```bash
Task: "Run npm run lint in frontend/ and fix new warnings (T017)"
Task: "Run npx tsc --noEmit in frontend/ and fix new type errors (T018)"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Complete Phase 1 (T001).
2. Complete Phase 2 (T002–T004).
3. Complete Phase 3 — US1 (T005–T009).
4. **STOP and VALIDATE**: Run quickstart paths 1, 2, 5, 6, 7. The page now lets the user *browse* past months read-only. This is shippable on its own as the first increment.

### Incremental Delivery

1. Setup + Foundational → selector exists but inert.
2. Add US1 → past-month browsing works (MVP).
3. Add US2 → past-month editing works (the headline of the feature).
4. Add US3 → read-only protections (polish).
5. Polish phase → lint, types, mobile, full quickstart.

### Single-developer order (recommended for this feature)

Since this is one developer and a small frontend-only feature, the natural sequential order is **T001 → T002 → T003 → T004 → T005 → T006 → T007 → T008 → T009 → T010 → T011 → T012 → T013 → T014 → T015 → T016 → T017 → T018 → T019**, committing at the end of each user story phase.

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks.
- [Story] label maps each task to its user story for traceability.
- Each user story is independently testable per the spec's "Independent Test" guidance.
- No backend changes — `backend/` is untouched by every task in this list.
- Commit after each user story phase (US1, US2, US3) at minimum — this gives clean PR-review-sized chunks if needed and matches the speckit workflow.
