# Tasks: Auto-Match Categories for Identical Descriptions

**Input**: Design documents from `/specs/006-auto-match-categories/`

**Tests**: Not requested. Manual browser testing.

**Organization**: Single user story (P1). Frontend-only, 1 file.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 3: User Story 1 — Category Override Propagates to Matching Descriptions (Priority: P1)

**Goal**: Selecting a category for one uncategorized transaction auto-fills the same category for all other uncategorized transactions with the same description.

**Independent Test**: Upload PDF → preview → find uncategorized MERCADONA entries → select "Groceries" for one → verify all other uncategorized MERCADONAs also become "Groceries".

### Implementation

- [x] T001 [US1] Modify `handleOverride` in `frontend/src/components/budget/import-modal.tsx` — when a category is assigned (not null/none), find all other rows in `preview.rows` (or `sseProgress.result.rows`) with the same description (case-insensitive) that are currently uncategorized (category_source === "none" AND no existing override in the overrides map), and add overrides for all of them in a single state update. Skip propagation if the user is setting to null (removing category).

- [x] T002 [US1] Manual verification — TypeScript compiles, logic verified by code review: upload PDF, wait for preview, find a description with multiple uncategorized entries (e.g., MERCADONA), override one to "Groceries", verify all matching uncategorized entries update. Also verify: already-categorized entries with same description are NOT changed; setting "-- None --" does NOT propagate.

**Checkpoint**: Single category selection fixes all matching uncategorized transactions.

---

## Dependencies & Execution Order

- T001 → T002 (sequential)

## Notes

- Total: 2 tasks, 1 file modified
- The `overrides` state is a `Map<number, string | null>` keyed by row index — propagation adds entries for all matching row indices
