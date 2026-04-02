# Tasks: Import Networth with Account Breakdown

**Input**: Design documents from `/specs/041-import-nw-breakdown/`
**Prerequisites**: plan.md (required), spec.md (required), research.md

**Tests**: Not requested — manual browser testing via Playwright MCP.

**Organization**: Single user story — refactor Import modal to use per-account breakdown fields.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1)
- Include exact file paths in descriptions

---

## Phase 1: Setup

_(No tasks — all dependencies exist)_

---

## Phase 2: Foundational

**Purpose**: Backend schema change to accept breakdown in snapshot creation.

- [x] T001 Add optional `breakdown: list | None = None` field to `ManualSnapshotCreate` schema in `backend/app/schemas/networth.py`
- [x] T002 Update `POST /api/v1/networth/snapshots` endpoint in `backend/app/api/networth.py` to pass `payload.breakdown` to the `NetworthSnapshot` model when creating the snapshot
- [x] T003 [P] Update `CreateManualSnapshotPayload` type in `frontend/src/lib/queries/networth.ts` to include optional `breakdown` field

**Checkpoint**: Backend accepts breakdown data on import, frontend type updated.

---

## Phase 3: User Story 1 — Import with Per-Account Breakdown (Priority: P1) MVP

**Goal**: Replace the single total field in the Import modal with per-account breakdown fields matching the Modify modal layout.

**Independent Test**: Open Gear > "Import previous networth", verify account breakdown fields appear, fill in balances, press Import, then open "Modify previous networth" for that month and confirm breakdown data is saved.

### Implementation

- [x] T004 [US1] Refactor `ImportNetworthModal` in `frontend/src/components/networth/import-networth-modal.tsx`: replace the single "Total Networth" input with per-account breakdown fields using `useNetworthSummary()` to get the account list (one row per account: name label + editable balance input, all defaulting to 0), compute live total as sum of balances, and send `breakdown` array alongside `total_networth` in the mutation payload
- [x] T005 [US1] Handle edge case in `ImportNetworthModal`: if the user has no accounts, show "Add accounts first to import historical net worth" message and disable the Import button

**Checkpoint**: Import modal shows account breakdown, saves breakdown data, and handles no-accounts edge case.

---

## Phase 4: Polish & Cross-Cutting Concerns

- [x] T006 Browser test via Playwright MCP: verify Import modal shows account fields, live total updates, Import saves breakdown, Modify modal shows saved values for that month, no-accounts edge case works

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 2 (Foundational)**: No dependencies — start immediately
- **Phase 3 (US1)**: Depends on T001-T003
- **Phase 4 (Polish)**: Depends on all previous phases

### Within Phases

- T001 before T002 (schema needed for endpoint)
- T003 can run in parallel with T001+T002 (frontend vs backend)
- T004 before T005 (modal must exist before edge case handling)

---

## Implementation Strategy

### MVP

1. Phase 2: Backend + type change
2. Phase 3: Refactor Import modal
3. **STOP and VALIDATE**: Import with breakdown works end-to-end

---

## Notes

- The Import modal uses `useNetworthSummary()` to get the account list (same source as auto-capture)
- Account balances default to 0 — these are historical values the user fills in
- The existing duplicate-month validation (409 error) remains unchanged
- Visual layout should match the Edit modal: account name on left, number input on right, live total at bottom
