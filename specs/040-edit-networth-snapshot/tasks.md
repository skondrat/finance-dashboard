# Tasks: Edit Previous Networth Snapshots

**Input**: Design documents from `/specs/040-edit-networth-snapshot/`
**Prerequisites**: plan.md (required), spec.md (required), research.md

**Tests**: Not requested — manual browser testing via Playwright MCP.

**Organization**: Tasks grouped by user story. US1 is the core edit flow, US2 adds the empty-month guard.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: No project setup needed — all dependencies exist.

_(No tasks — skip to Phase 2)_

---

## Phase 2: Foundational (Backend + Frontend Plumbing)

**Purpose**: Backend endpoint and frontend mutation hook that both user stories depend on.

- [x] T001 Add `SnapshotUpdate` Pydantic schema (accepting `total_networth` and `breakdown`) and add `id` field to `NetworthSnapshotResponse` in `backend/app/schemas/networth.py`
- [x] T002 Add `PATCH /api/v1/networth/snapshots/{snapshot_id}` endpoint in `backend/app/api/networth.py` that updates `total_networth`, `breakdown`, and `updated_at` for the given snapshot (validate snapshot belongs to user)
- [x] T003 [P] Add `useUpdateSnapshot()` mutation hook in `frontend/src/lib/queries/networth.ts` that PATCHes `/networth/snapshots/{id}` with `total_networth` and `breakdown`, invalidating `["networth"]` on success

**Checkpoint**: Backend PATCH endpoint works, frontend has the mutation hook ready.

---

## Phase 3: User Story 1 — Edit a Previous Networth Snapshot (Priority: P1) MVP

**Goal**: Open a modal from the Gear menu, select a month, edit account balances, save, and see the chart update.

**Independent Test**: Click Gear > "Modify previous networth", change a balance, press Save, verify chart updates.

### Implementation

- [x] T004 [US1] Create `EditSnapshotModal` component in `frontend/src/components/networth/edit-snapshot-modal.tsx` following the `ImportNetworthModal` pattern: month/year selector defaulting to most recent snapshot, editable breakdown fields (account name label + balance input per row), live total recalculation, Save/Cancel buttons, close-on-backdrop-click, error display
- [x] T005 [US1] Add "Modify previous networth" option to the `SettingsDropdown` in `frontend/src/app/(dashboard)/networth/page.tsx`, add `editSnapshotOpen` state, and render `EditSnapshotModal` with `open`/`onClose` props
- [x] T006 [US1] Handle snapshots without breakdown data (edge case) in `EditSnapshotModal`: if `breakdown` is null/empty, show a single "Total Net Worth" editable field instead of individual account rows

**Checkpoint**: Full edit flow works — open modal, change balances, save, chart/KPI update.

---

## Phase 4: User Story 2 — Handle Months Without Snapshots (Priority: P2)

**Goal**: When a month with no snapshot is selected, show a message and disable Save.

**Independent Test**: Select a month with no snapshot in the edit modal, verify message appears and Save is disabled.

### Implementation

- [x] T007 [US2] In `EditSnapshotModal` (`frontend/src/components/networth/edit-snapshot-modal.tsx`), when the selected month has no matching snapshot in the history data, display "No snapshot exists for this month" message and disable the Save button

**Checkpoint**: Empty-month guard works. All user stories complete.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [x] T008 Browser test via Playwright MCP: verify Gear menu shows new option, modal opens with correct breakdown, balance editing updates total live, Save closes modal and updates chart, empty month shows disabled state

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 2 (Foundational)**: No dependencies — can start immediately
- **Phase 3 (US1)**: Depends on T001-T003 (schema, endpoint, mutation hook)
- **Phase 4 (US2)**: Depends on T004 (modal component exists)
- **Phase 5 (Polish)**: Depends on all previous phases

### Within Each Phase

- T001 before T002 (schema needed for endpoint)
- T003 can run in parallel with T001+T002 (different codebase: frontend vs backend)
- T004 before T005 (modal must exist before page imports it)
- T006 can be done as part of T004 or after
- T007 extends T004 (same file)

### Parallel Opportunities

- T001+T002 (backend) and T003 (frontend) can run in parallel
- T005 and T006 can run in parallel (different concerns in different places)

---

## Parallel Example: Phase 2

```bash
# Backend tasks (sequential):
Task T001: "Add SnapshotUpdate schema in backend/app/schemas/networth.py"
Task T002: "Add PATCH endpoint in backend/app/api/networth.py"

# Frontend task (parallel with above):
Task T003: "Add useUpdateSnapshot mutation in frontend/src/lib/queries/networth.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Phase 2: Backend endpoint + frontend mutation
2. Complete Phase 3: Edit modal + gear menu integration
3. **STOP and VALIDATE**: Edit flow works end-to-end

### Incremental Delivery

1. Phase 2: Backend + hook → Foundation ready
2. Phase 3: Edit modal → Test → Full edit flow works (MVP!)
3. Phase 4: Empty-month guard → Test → Edge case handled
4. Phase 5: Browser test all acceptance criteria

---

## Notes

- The `EditSnapshotModal` uses `useNetworthHistory()` to get the list of snapshots and their breakdowns — no new query needed
- Snapshot `id` must be added to `NetworthSnapshotResponse` so the frontend knows which snapshot to PATCH
- The month/year selector should be populated from the existing snapshots list, not a free-form date picker
- Live total = sum of all breakdown balances, computed in React state (no API call)
- Modal follows exact same styling patterns as `ImportNetworthModal` (backdrop, card, buttons, inputs)
