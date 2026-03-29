# Research: Net Worth History

**Feature**: 022-networth-history | **Date**: 2026-03-29

## Research Summary

No major unknowns — all technology choices are established in the project. Research focused on integration patterns.

## Findings

### 1. Snapshot Trigger Approach

- **Decision**: Inline side-effect in API endpoints (call snapshot service after commit)
- **Rationale**: Simple and reliable. The three CRUD endpoints (create/update/delete) already exist. Adding a `capture_snapshot(db, user_id, currency)` call after each commit is minimal code. No need for database triggers, background jobs, or event systems.
- **Alternatives considered**:
  - SQLAlchemy event listeners (after_commit) — rejected as too implicit and harder to debug
  - Background task queue (Celery) — rejected as massive overkill for a synchronous side-effect
  - Database triggers — rejected as not portable and hard to maintain

### 2. Snapshot Upsert Pattern

- **Decision**: Query-then-update/insert pattern with unique constraint
- **Rationale**: SQLite doesn't support `INSERT ... ON CONFLICT DO UPDATE` cleanly through SQLAlchemy ORM. Instead, query for existing snapshot for user_id + month, update if found, create if not. The unique constraint is a safety net.
- **Alternatives considered**:
  - Raw SQL upsert — rejected to stay consistent with ORM usage across the codebase
  - Separate table per month — rejected as unnecessary complexity

### 3. Per-Account Breakdown Storage

- **Decision**: JSON column on the snapshot row
- **Rationale**: The breakdown is display-only data for chart tooltips. It doesn't need to be queried or joined. A JSON column keeps the schema simple (1 table, no joins). SQLAlchemy supports JSON columns on SQLite.
- **Alternatives considered**:
  - Separate `networth_snapshot_accounts` table — rejected as over-normalized for read-only tooltip data
  - No breakdown at all — rejected as it limits future chart drill-down capability

### 4. Chart Component Pattern

- **Decision**: Follow `performance-chart.tsx` pattern exactly (AreaChart, gradient, custom tooltip, range selector)
- **Rationale**: Consistent UI/UX across the application. Users already understand this chart pattern from the portfolio page. Recharts 3 is already installed.
- **Alternatives considered**: None — the existing pattern is well-established and fits perfectly.

### 5. History Endpoint Design

- **Decision**: Single `GET /api/v1/networth/history?currency=EUR` endpoint returning all snapshots
- **Rationale**: With monthly granularity, even 10 years of data is only 120 rows — no need for pagination. Client-side filtering by range (6M, YTD, 1Y, ALL) is trivial and avoids extra API parameters.
- **Alternatives considered**:
  - Server-side date range filtering — rejected as unnecessary complexity for small dataset
  - Combined with summary endpoint — rejected to keep endpoints focused

## Unresolved Items

None.
