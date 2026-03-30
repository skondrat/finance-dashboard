# Implementation Plan: Networth Manual Import & Composition Donut Chart

**Branch**: `032-networth-manual-donut` | **Date**: 2026-03-30 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/032-networth-manual-donut/spec.md`

## Summary

Add manual networth import capability (gear menu → modal with month/year/value → stored with "manual" flag), bulk removal of manual entries, and a donut chart showing networth composition with Account/Type view selector. Extends the existing networth_snapshots table with a `source` column and adds three new API endpoints. Frontend adds an import modal and a composition donut chart modeled on the Portfolio allocation pattern.

## Technical Context

**Language/Version**: Python 3.11 (backend), TypeScript 5 (frontend)
**Primary Dependencies**: FastAPI, SQLAlchemy 2.0, Alembic (backend); Next.js 16, TanStack Query, Recharts, Zustand (frontend)
**Storage**: SQLite via SQLAlchemy (existing `networth_snapshots` table + new `source` column)
**Testing**: pytest (backend), Playwright MCP manual verification (frontend)
**Target Platform**: Web application (localhost dev)
**Project Type**: Web application (full-stack)
**Performance Goals**: Sub-1s response for composition endpoint, instant UI updates after mutations
**Constraints**: Must preserve existing auto-snapshot behavior, no breaking changes to existing endpoints
**Scale/Scope**: Single-user finance dashboard

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| Feature Delivery Workflow | PASS | Following full speckit pipeline |
| Combine Small Related Features | PASS | Three related stories in one branch |
| Always Test with Browser | PASS | Will test with Playwright MCP after implementation |
| Git Hygiene | PASS | Single branch from latest main |
| Keep It Simple | PASS | Reusing existing patterns (allocation donut, modal, query hooks) |

**Post-Phase 1 Re-check**: All gates still pass. No unnecessary abstractions — composition endpoint follows existing allocation pattern, donut component follows existing allocation-donut pattern.

## Project Structure

### Documentation (this feature)

```text
specs/032-networth-manual-donut/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api.md           # New and modified API endpoints
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── alembic/versions/
│   └── <new>_add_source_to_networth_snapshots.py   # Migration
├── app/
│   ├── models/
│   │   └── networth_snapshot.py    # Add source field
│   ├── api/
│   │   └── networth.py             # 3 new endpoints
│   └── services/
│       └── networth_service.py     # Composition logic

frontend/
├── src/
│   ├── app/(dashboard)/networth/
│   │   └── page.tsx                # Extended gear menu + donut layout
│   ├── components/networth/
│   │   ├── import-networth-modal.tsx    # New modal
│   │   └── networth-composition.tsx     # New donut chart
│   └── lib/queries/
│       └── networth.ts             # New query hooks + mutations
```

**Structure Decision**: Follows existing backend/frontend split. New files are minimal: 1 migration, 2 new frontend components. All other changes are modifications to existing files.

## Complexity Tracking

> No constitution violations to justify.
