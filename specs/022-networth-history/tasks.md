# Tasks: Net Worth History

**Input**: Design documents from `/specs/022-networth-history/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/snapshot-api.md, research.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Exact file paths included in descriptions

---

## Phase 1: Foundational (Backend Model + Migration)

**Purpose**: Create the snapshot data layer that both user stories depend on.

- [x] T001 [P] Create NetworthSnapshot SQLAlchemy model with fields (id, user_id, snapshot_month, total_networth, currency, breakdown JSON, created_at, updated_at) and unique constraint on (user_id, snapshot_month) in backend/app/models/networth_snapshot.py
- [x] T002 [P] Add snapshot Pydantic schemas (NetworthSnapshotResponse, NetworthHistoryResponse) to backend/app/schemas/networth.py
- [x] T003 Generate Alembic migration for networth_snapshots table by running alembic revision --autogenerate in backend/

**Checkpoint**: Database table exists, model and schemas ready for use.

---

## Phase 2: User Story 2 — Automatic Monthly Snapshots (Priority: P1)

**Goal**: Whenever a networth account is created, updated, or deleted, auto-capture/overwrite the current month's snapshot.

**Independent Test**: Create or update a networth account via API, then query the database to verify a snapshot row exists for the current month with correct totals.

### Implementation for User Story 2

- [x] T004 [US2] Create networth_service.py with capture_snapshot(db, user_id, currency) function that computes total net worth (reusing summary logic from networth.py) and upserts a snapshot for the current month in backend/app/services/networth_service.py
- [x] T005 [US2] Add snapshot trigger call to create_networth_account endpoint (after db.commit) in backend/app/api/networth.py
- [x] T006 [US2] Add snapshot trigger call to update_networth_account endpoint (after db.commit) in backend/app/api/networth.py
- [x] T007 [US2] Add snapshot trigger call to delete_networth_account endpoint (after db.commit) in backend/app/api/networth.py

**Checkpoint**: Creating/updating/deleting accounts automatically writes a snapshot row for the current month.

---

## Phase 3: User Story 1 — View Net Worth Trend Over Time (Priority: P1)

**Goal**: Display a line chart on the networth page showing net worth history with time range selector (6M, YTD, 1Y, ALL).

**Independent Test**: Navigate to /networth with snapshot data and verify chart displays correctly, range selector filters data.

### Implementation for User Story 1

- [x] T008 [US1] Add GET /api/v1/networth/history endpoint that returns all snapshots for the user ordered by snapshot_month ascending in backend/app/api/networth.py
- [x] T009 [US1] Add useNetworthHistory query hook to frontend/src/lib/queries/networth.ts
- [x] T010 [US1] Create NetworthChart component with AreaChart, range selector (6M, YTD, 1Y, ALL), custom tooltip, and empty state — following performance-chart.tsx pattern — in frontend/src/components/networth/networth-chart.tsx
- [x] T011 [US1] Add NetworthChart to networth page above existing SummaryKpi in frontend/src/app/(dashboard)/networth/page.tsx

**Checkpoint**: Chart displays on networth page with snapshot data and working range selector.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Foundational)**: No dependencies — can start immediately
- **Phase 2 (US2 - Snapshots)**: Depends on T001, T002 (model + schemas)
- **Phase 3 (US1 - Chart)**: Depends on T002 (schemas for response), T008 can start after T001
- **Polish**: Not needed — feature is self-contained

### Parallel Opportunities

- T001 and T002 can run in parallel (different files)
- T003 depends on T001 (migration needs model)
- T005, T006, T007 are sequential (same file, same pattern)
- T009 and T010 can run in parallel (different files)
- T011 depends on T009 and T010

### Within User Story 2

- T004 (service) → T005/T006/T007 (triggers in API endpoints)

### Within User Story 1

- T008 (endpoint) → T009 (query hook) → T010 (chart component, can parallel with T009) → T011 (page integration)

---

## Implementation Strategy

### MVP First (US2 then US1)

1. Complete Phase 1: Model + migration + schemas
2. Complete Phase 2: Snapshot triggers (data starts flowing)
3. Complete Phase 3: Chart (data becomes visible)
4. Browser verification via Playwright MCP

### Execution Order

T001 + T002 → T003 → T004 → T005 → T006 → T007 → T008 → T009 + T010 → T011
