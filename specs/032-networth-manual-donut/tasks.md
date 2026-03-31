# Tasks: Networth Manual Import & Composition Donut Chart

**Input**: Design documents from `/specs/032-networth-manual-donut/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested — test tasks omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database migration and model update shared by all user stories

- [x] T001 Add `source` column (String(10), default "auto", not null) to NetworthSnapshot model in backend/app/models/networth_snapshot.py
- [x] T002 Create Alembic migration to add `source` column to `networth_snapshots` table with default "auto" for existing rows, plus index on (user_id, source) in backend/alembic/versions/

**Checkpoint**: Migration applied, existing snapshots have source="auto"

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Enhance the existing history endpoint to include source field — needed by US1 and US3 frontend work

- [x] T003 Update GET /networth/history endpoint to include `source` field in each history entry in backend/app/api/networth.py

**Checkpoint**: History API returns source field for each snapshot

---

## Phase 3: User Story 1 - Import Previous Networth Entry (Priority: P1) 🎯 MVP

**Goal**: Users can import historical networth values via gear menu → modal → save with "manual" flag

**Independent Test**: Open gear menu → click "Import previous networth" → fill month/year/value → submit → verify data point appears on chart

### Implementation for User Story 1

- [x] T004 [P] [US1] Add POST /networth/snapshots endpoint with validation (future month check, duplicate 409) in backend/app/api/networth.py
- [x] T005 [P] [US1] Add `useCreateManualSnapshot` mutation hook in frontend/src/lib/queries/networth.ts (POST /networth/snapshots, invalidates ["networth"] queries)
- [x] T006 [US1] Create ImportNetworthModal component with month select, year select, value input, submit/cancel in frontend/src/components/networth/import-networth-modal.tsx
- [x] T007 [US1] Add "Import previous networth" option to SettingsDropdown in gear menu, wire modal open state in frontend/src/app/(dashboard)/networth/page.tsx

**Checkpoint**: User can import a manual networth entry and see it on the history chart

---

## Phase 4: User Story 2 - Networth Composition Donut Chart (Priority: P2)

**Goal**: Donut chart to the right of networth history chart showing composition with Account/Type view toggle

**Independent Test**: Navigate to Networth tab → see donut chart → switch between Account and Type views → verify segments update

### Implementation for User Story 2

- [x] T008 [P] [US2] Add composition aggregation logic (group by account + group by type) to networth service in backend/app/services/networth_service.py
- [x] T009 [US2] Add GET /networth/composition endpoint (group_by, currency params) in backend/app/api/networth.py
- [x] T010 [P] [US2] Add `useNetworthComposition(groupBy)` query hook in frontend/src/lib/queries/networth.ts (GET /networth/composition)
- [x] T011 [US2] Create NetworthComposition component with donut chart, Account/Type tab selector, tooltips, legend, and empty state (modeled on portfolio allocation-donut.tsx) in frontend/src/components/networth/networth-composition.tsx
- [x] T012 [US2] Update page layout to place NetworthComposition beside NetworthChart (side-by-side on desktop, stacked on mobile) in frontend/src/app/(dashboard)/networth/page.tsx

**Checkpoint**: Donut chart renders with correct composition data, tab switching works

---

## Phase 5: User Story 3 - Remove All Manual NW Entries (Priority: P3)

**Goal**: Gear menu option to bulk-delete all manual snapshots with confirmation dialog

**Independent Test**: Import manual entries → gear menu → "Remove all manual NW entries" → confirm → verify manual entries gone, auto entries preserved

### Implementation for User Story 3

- [x] T013 [P] [US3] Add DELETE /networth/snapshots/manual endpoint (deletes where source="manual", returns deleted_count) in backend/app/api/networth.py
- [x] T014 [P] [US3] Add `useDeleteManualSnapshots` mutation hook in frontend/src/lib/queries/networth.ts (DELETE /networth/snapshots/manual, invalidates ["networth"] queries)
- [x] T015 [US3] Add "Remove all manual NW entries" option to SettingsDropdown with confirmation dialog (window.confirm or inline confirm), hide/disable when no manual entries exist, in frontend/src/app/(dashboard)/networth/page.tsx

**Checkpoint**: Bulk removal works, only manual entries deleted, chart updates immediately

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final refinements across all stories

- [x] T016 [P] Ensure donut chart groups segments below 2% into "Other" category in frontend/src/components/networth/networth-composition.tsx
- [x] T017 Run quickstart.md validation — start backend + frontend, verify all three stories end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (model must have source field before API changes)
- **User Stories (Phase 3-5)**: All depend on Phase 1 + 2 completion
  - US1, US2, US3 can proceed in parallel after Phase 2
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2 — no dependencies on other stories
- **User Story 2 (P2)**: Can start after Phase 2 — no dependencies on other stories (separate endpoint and component)
- **User Story 3 (P3)**: Can start after Phase 2 — no dependencies on US1 (uses same model field but different endpoint)

### Within Each User Story

- Backend endpoint before frontend mutation hook
- Mutation/query hooks before components that use them
- Components before page integration

### Parallel Opportunities

- T004 + T005: Backend endpoint and frontend hook (hook depends on endpoint existing but can be written simultaneously)
- T008 + T010: Backend service and frontend hook stub
- T013 + T014: Backend delete endpoint and frontend mutation hook
- US1 + US2 + US3: All three stories can run in parallel after Phase 2

---

## Parallel Example: User Story 1

```bash
# Backend and frontend hook can be written in parallel:
Task T004: "POST /networth/snapshots endpoint in backend/app/api/networth.py"
Task T005: "useCreateManualSnapshot mutation hook in frontend/src/lib/queries/networth.ts"

# Then sequentially:
Task T006: "ImportNetworthModal component" (needs T005 hook)
Task T007: "Wire modal into gear menu on page" (needs T006 component)
```

## Parallel Example: User Story 2

```bash
# Backend service and frontend hook in parallel:
Task T008: "Composition aggregation logic in backend service"
Task T010: "useNetworthComposition query hook in frontend queries"

# Then sequentially:
Task T009: "GET /networth/composition endpoint" (needs T008 service)
Task T011: "NetworthComposition donut component" (needs T010 hook)
Task T012: "Page layout integration" (needs T011 component)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (migration + model)
2. Complete Phase 2: Foundational (history source field)
3. Complete Phase 3: User Story 1 (import modal)
4. **STOP and VALIDATE**: Test import flow independently
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Test import → Deploy/Demo (MVP!)
3. Add User Story 2 → Test donut chart → Deploy/Demo
4. Add User Story 3 → Test bulk removal → Deploy/Demo
5. Polish → Final validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- All mutations must invalidate ["networth"] query keys for instant UI updates
- Frontend components follow existing patterns: AllocationDonut for donut chart, AddAccountModal for import modal
- Backend endpoints follow existing FastAPI patterns in networth.py
