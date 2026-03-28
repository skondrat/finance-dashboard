# Tasks: Fix Import Discard

**Input**: Design documents from `/specs/005-fix-import-discard/`
**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Tests**: Not requested. Manual browser testing per quickstart.md.

**Organization**: Single user story (P1). Frontend-only fix, 2 files.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

*(No tasks — existing project, no new dependencies)*

---

## Phase 2: Foundational

*(No tasks — backend discard endpoint already exists)*

---

## Phase 3: User Story 1 — Discard Import Cleans Up Backend Data (Priority: P1)

**Goal**: Clicking Discard (or closing modal with active preview) calls the backend discard endpoint, removing orphaned preview transactions.

**Independent Test**: Upload PDF → preview → Discard → re-upload same PDF → verify 0 duplicates skipped.

### Implementation for User Story 1

- [x] T001 [US1] Add `importId` field to the `ImportProgress` state in `useImportWithProgress()` hook in `frontend/src/lib/queries/budget.ts` — when the SSE `complete` event arrives with `evt.result`, store `evt.result.id` as `importId` in the progress state. Also expose `importId` in the returned object. Reset `importId` to `null` in the `reset()` function.

- [x] T002 [US1] Update `handleDiscard` in `frontend/src/components/budget/import-modal.tsx` — before resetting client state, check if we have an import ID (either from `preview.id` for non-SSE imports, or from `sseProgress.importId` for SSE imports). If an import ID exists, call `apiFetch(\`/budget/import/${importId}/discard\`, { method: "POST" })` to clean up backend data. Make this a fire-and-forget call (don't block the UI reset on it). Log errors to console but still reset the modal.

- [x] T003 [US1] Update `handleClose` in `frontend/src/components/budget/import-modal.tsx` — if a preview is active (either `preview` is set or `sseProgress.result` is set), call the same backend discard logic as `handleDiscard` before closing the modal. This ensures closing via the X button also cleans up.

- [x] T004 [US1] Manual verification per `specs/005-fix-import-discard/quickstart.md` — clean DB, upload PDF, wait for preview, click Discard, re-upload same PDF, verify 0 duplicates. Also test: upload PDF, preview, click X to close, re-upload, verify 0 duplicates.

**Checkpoint**: Discarded imports leave zero orphaned data. Re-imports work cleanly.

---

## Phase 4: Polish

- [x] T005 Verify that Confirm Import flow still works unchanged after the discard fix — upload PDF, confirm, verify budget totals update in `frontend/src/components/budget/import-modal.tsx`.

---

## Dependencies & Execution Order

- T001 → T002 → T003 → T004 → T005 (all sequential, same files)

## Implementation Strategy

### MVP: T001-T004 (4 tasks)

1. T001: Expose importId from SSE hook
2. T002: Wire handleDiscard to backend
3. T003: Wire handleClose to backend
4. T004: Manual verification

---

## Notes

- Backend is unchanged — `POST /budget/import/{id}/discard` already works
- The discard call is fire-and-forget to keep the UI responsive
- Total: 5 tasks, all sequential, 2 frontend files modified
