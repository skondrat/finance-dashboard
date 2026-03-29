# Implementation Plan: Net Worth History

**Branch**: `022-networth-history` | **Date**: 2026-03-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/022-networth-history/spec.md`

## Summary

Add automatic monthly net worth snapshots and a line chart to the networth page. When any networth account is created, updated, or deleted, the system auto-captures/overwrites the current month's snapshot (total + per-account breakdown). The chart displays the trend over time with a range selector (6M, YTD, 1Y, ALL), following the same Recharts patterns used in the portfolio performance chart.

## Technical Context

**Language/Version**: Python 3.11 (backend), TypeScript 5 (frontend)
**Primary Dependencies**: FastAPI, SQLAlchemy 2.0, Alembic (backend); Next.js 16, React 19, Recharts 3, TanStack Query, Zustand (frontend)
**Storage**: SQLite via SQLAlchemy (new `networth_snapshots` table + Alembic migration)
**Testing**: Playwright MCP (browser-based verification)
**Target Platform**: Web (desktop browser)
**Project Type**: Web application (full-stack)
**Performance Goals**: Chart renders in <1s; snapshot capture adds <200ms to account CRUD operations
**Constraints**: Must match Editorial Ledger design system; reuse existing networth summary logic for snapshot computation
**Scale/Scope**: 1 new model, 2 new endpoints, 1 new component, modifications to 3 existing files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Feature Delivery Workflow | PASS | Following full pipeline |
| II. Combine Small Features | N/A | Single feature |
| III. Always Test with Browser | PLANNED | Will verify with Playwright MCP |
| IV. Ideas Tracking | N/A | Not from backlog |
| V. Git Hygiene | PASS | On feature branch from main |
| VI. Keep It Simple | PASS | Minimal new code; reuses existing summary logic and chart patterns |

## Project Structure

### Documentation (this feature)

```text
specs/022-networth-history/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── snapshot-api.md
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── models/
│   │   └── networth_snapshot.py    # CREATE — new snapshot model
│   ├── schemas/
│   │   └── networth.py             # MODIFY — add snapshot schemas
│   ├── api/
│   │   └── networth.py             # MODIFY — add snapshot trigger + history endpoint
│   └── services/
│       └── networth_service.py     # CREATE — snapshot capture logic
├── alembic/
│   └── versions/
│       └── xxx_add_networth_snapshots.py  # CREATE — migration

frontend/
├── src/
│   ├── components/
│   │   └── networth/
│   │       └── networth-chart.tsx  # CREATE — line chart component
│   ├── lib/
│   │   └── queries/
│   │       └── networth.ts         # MODIFY — add snapshot history query
│   └── app/
│       └── (dashboard)/
│           └── networth/
│               └── page.tsx         # MODIFY — add chart to page
```

**Structure Decision**: New snapshot model + service in existing directories. New chart component follows established pattern from `performance-chart.tsx`. Snapshot logic extracted to a service to keep API endpoints thin.

## Design Decisions

### Snapshot Trigger Strategy

Call snapshot capture as a side-effect after each account CRUD operation (create/update/delete) completes. The snapshot service reuses the existing summary computation logic to calculate totals. This avoids duplicating currency conversion and portfolio aggregation logic.

### Snapshot Storage

Store one row per month per user in `networth_snapshots`. Use a composite unique constraint on `(user_id, snapshot_month)` to enforce one-per-month. Use SQLAlchemy merge/upsert pattern for idempotent writes.

Per-account breakdown stored as a JSON column — simpler than a separate breakdown table, sufficient for chart tooltip data, and avoids complex joins.

### Chart Implementation

Follow the exact pattern from `performance-chart.tsx`: AreaChart with gradient fill, custom tooltip, range selector buttons. Range options: 6M, YTD, 1Y, ALL. Data source: snapshot history endpoint.

### Currency Handling

Snapshots are stored in the currency that was active when the snapshot was taken. The history endpoint returns snapshots as-is. This is acceptable for MVP — values represent the net worth at that point in time.

## Complexity Tracking

No constitution violations. Table not needed.
