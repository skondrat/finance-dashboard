# Research: Networth Month Selector

**Feature**: 077-networth-month-selector
**Date**: 2026-05-01

This document captures the key design decisions for the feature. It addresses the "how" trade-offs the spec deliberately avoided, and resolves any ambiguity before tasks are generated. There were no `[NEEDS CLARIFICATION]` markers in the spec — the items below are technical-design choices that needed to be settled to plan implementation cleanly.

---

## Decision 1: Data source for the historical accounts table

**Decision**: Reuse the existing `useNetworthHistory(currency)` hook. When a past month is selected, look up the matching snapshot client-side from the already-fetched array and render its `breakdown` field.

**Rationale**:
- The history endpoint already returns every snapshot with its full per-account breakdown.
- The frontend already calls this endpoint to render the chart and the existing "Edit previous networth" modal — adding a new endpoint would duplicate work that's already happening.
- The result set is small (one row per month, ≤ 12 per year) so transferring the full history is cheap; in-memory lookup by month key is O(n) and instant.

**Alternatives considered**:
- *New `GET /networth/snapshots/{month}` endpoint*: Cleaner per-month semantics but solves no real problem — list-then-filter is fine at this scale and avoids an endpoint round-trip when the user flips between months.
- *Per-account historical balance endpoint*: Overkill — would require new server logic when the breakdown row already contains everything.

---

## Decision 2: Persisting an inline edit for a past month

**Decision**: On save, take the snapshot's existing `breakdown` array, swap the targeted row's `balance`, recompute `total_networth` as the sum of the new array, and `PATCH /networth/snapshots/{snapshot_id}` with both fields. Reuse the existing `useUpdateSnapshot` mutation — no changes needed in the queries module.

**Rationale**:
- The `PATCH` endpoint already accepts both `breakdown` and `total_networth` and replaces them wholesale.
- Computing the new total client-side keeps the chart in sync immediately on TanStack Query invalidation — the server otherwise just stores whatever total we send.
- All values in the breakdown are already in the user's display currency (the history endpoint converts before returning), so the sum stays consistent.

**Alternatives considered**:
- *Add a new "patch one breakdown row" endpoint*: Cleaner API but requires backend changes for a feature that's otherwise frontend-only. Rejected per Constitution VI (Keep It Simple).
- *Send only the changed row and let the server merge*: The current PATCH is "replace breakdown wholesale," so this would also require backend changes. Skipped for the same reason.

**Edge case**: If two breakdown rows share the same `name` (theoretically possible), keying off `name` is ambiguous. We'll key off the row's array index instead, which is stable for a given snapshot.

---

## Decision 3: Month selector visual style and component placement

**Decision**: Build a small new `<NetworthMonthSelector>` component in `components/networth/`. It mirrors the **monthly mode** of `components/budget/time-aggregation.tsx` — two `<select>` dropdowns (month, year) with the same `selectClass` Tailwind classes — but drops the segmented period control (no YTD/Yearly/Custom in net-worth context).

**Rationale**:
- The user explicitly asked for "same as on Budget page." Reusing the exact dropdown styling keeps visual consistency.
- The Budget page's segmented period control (Monthly / YTD / Yearly / Custom) doesn't make sense for net worth — net worth is an inherently month-end snapshot concept, not an aggregation period.
- A dedicated component avoids coupling the Budget page's `Period` type and its sessionStorage keys to the Networth page.

**Alternatives considered**:
- *Lift `time-aggregation.tsx` into a shared component*: Too early to abstract — the Budget version has period-control concerns the Networth page doesn't share. Premature deduplication.
- *Embed the dropdowns directly in `accounts-table.tsx`*: Mixes layout concerns with table concerns; harder to move later.

---

## Decision 4: Constraining the selectable range

**Decision**: The month selector exposes years from the earliest snapshot's year through the current calendar year. Within the current year, months later than the current month are disabled (`<option disabled>`). Within the earliest year, months earlier than the earliest snapshot are still selectable but produce the "no data" empty state.

**Rationale**:
- Hard-disabling future months prevents nonsensical edits per FR-011.
- Allowing pre-snapshot past months to be selectable (with empty state) is friendlier than silently dropping them and matches FR-012's spec — the empty state explicitly suggests using the import flow.
- Computing the year list from the data avoids a hardcoded `[2026]` constant going stale.

**Alternatives considered**:
- *Hardcode years like Budget does today*: Budget hardcodes `YEARS = [2026]` which is already a known minor smell. We won't propagate it here.
- *Calendar-style month picker*: Heavier and inconsistent with Budget's two-dropdown look.

---

## Decision 5: Session persistence keys

**Decision**: Use `networth_month` and `networth_year` as `sessionStorage` keys, with the same `readSessionInt` helper pattern Budget uses inline.

**Rationale**:
- Mirrors the Budget convention (FR-002 Assumption).
- Distinct keys avoid clobbering Budget's selection if the user navigates between pages.
- Session-scoped (lost on tab close) is the right default — a long-lived preference would surprise users returning days later to find the table not on "current."

**Alternatives considered**:
- *Zustand store*: Heavier than needed; sessionStorage is the established pattern in this codebase for this kind of UI state.
- *URL query parameters*: Would enable bookmarking specific months but adds routing complexity. Can be added later if requested.

---

## Decision 6: Top KPI cards and chart isolation

**Decision**: The `<SummaryKpi>`, `<NetworthChart>`, and `<NetworthComposition>` components are not modified. They continue to consume `useNetworthSummary()` and `useNetworthHistory()` exactly as today. Only the accounts table is wired to the selector.

**Rationale**:
- The user explicitly said top cards and chart "should stay the same and just show latest month values" — exactly the current behavior.
- Keeps the blast radius small.
- Prevents accidental coupling: if a future feature wants to make the chart respect the selector, it can be added intentionally.

**Alternatives considered**: None — this is a hard requirement from the spec.

---

## Decision 7: Read-only-control behavior for past months

**Decision**: When a past month is selected:
- The page-level "Add Account" button is **hidden** (not disabled). Hiding is cleaner than a disabled button with a tooltip in this context — the user is already in "viewing the past" mode and the button is irrelevant.
- The per-row Edit (✎) and Delete (×) icons are **hidden**. The inline balance cell remains clickable.
- Investment-account rows in past-month view become inline-editable (today, current-month investment values are read-only because they come from live prices; past-month values are stored snapshot data and so are editable).

**Rationale**:
- Matches FR-009 / FR-010.
- Hiding (vs. disabling) reduces visual noise. Users who want to add or delete accounts will switch back to current month.

**Alternatives considered**:
- *Disabled buttons with tooltips*: More discoverable but visually noisier. The empty-state hint text already explains the model.

---

## Decision 8: Cache invalidation after a past-month edit

**Decision**: Continue relying on the existing `useUpdateSnapshot` `onSuccess` handler that invalidates `["networth"]`. This refetches summary, history, composition, and accounts — the chart picks up the new historical point automatically.

**Rationale**: The current invalidation key already covers everything the user can see; no need to narrow it.

**Alternatives considered**:
- *Optimistic updates*: Nice-to-have but unnecessary at this scale; the network round-trip is fast and the current behavior is "set, refetch, paint" which is well under the 2s target (SC-001).

---

## Open questions / non-goals

- **Editing investment historical values** affects the snapshot only. It does not retroactively change asset prices in `asset_prices`. This is intentional — the snapshot is the authoritative historical record once captured.
- **The existing "Edit previous networth" modal** stays in place. Removing it can be a follow-up after this inline flow proves out.
- **Adding a brand-new account back-dated to a past month** is explicitly out of scope (would require defining account creation semantics on past snapshots — not requested).
