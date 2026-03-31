# Research: Networth Manual Import & Composition Donut Chart

**Date**: 2026-03-30 | **Branch**: `032-networth-manual-donut`

## R1: How to add "manual" flag to networth snapshots

**Decision**: Add a `source` column (String(10), default "auto") to the `networth_snapshots` table via Alembic migration. Existing rows get "auto" as default.

**Rationale**: The `breakdown` JSON field already tracks `source` per account entry ("manual" vs "investment"), but there's no top-level column on the snapshot itself to distinguish user-imported historical entries from auto-captured ones. A dedicated column enables efficient filtering (DELETE WHERE source='manual') without parsing JSON.

**Alternatives considered**:
- Using the `breakdown` JSON field: Rejected because manual imports are whole-month entries without per-account breakdown. Also, filtering JSON in SQLite is inefficient.
- Separate table for manual entries: Rejected as it would duplicate the networth_snapshots schema and complicate the history query.

## R2: How to derive networth composition for the donut chart

**Decision**: Create a new `/networth/composition?group_by=account|type` endpoint that aggregates current account data from both NetworthAccount (manual accounts) and Account (investment accounts with positions).

**Rationale**: The existing `/networth/summary` endpoint already returns per-account breakdowns with `source`, `account_type`, `balance`, and `percentage` fields. The composition endpoint can extend this logic to also support grouping by asset type. This mirrors the existing `/portfolio/allocation?group_by=<type>` pattern.

**Alternatives considered**:
- Reusing `/networth/summary` directly on the frontend: Rejected because the summary response doesn't support grouping by type (ETF/Crypto/Bank/Cash), only lists individual accounts.
- Deriving composition purely from the latest snapshot's `breakdown` JSON: Rejected because it may be stale if accounts changed since last snapshot capture.

## R3: Frontend donut chart component approach

**Decision**: Create a new `NetworthComposition` component modeled on the existing `AllocationDonut` component from the Portfolio tab. Use the same Recharts Pie configuration, color generation, tooltip pattern, and tab selector structure.

**Rationale**: Direct code reuse of the proven pattern ensures visual consistency and reduces implementation risk. The allocation donut already handles tooltips, legends, empty states, and responsive layout.

**Alternatives considered**:
- Extracting a shared generic donut component: Rejected as over-engineering for two instances. If a third donut is ever needed, refactoring is straightforward.
- Using a different chart library: Rejected since Recharts is already used throughout the project.

## R4: Import modal month/year selector approach

**Decision**: Use two native `<select>` elements (month dropdown 1-12, year dropdown from 10 years ago to current year), consistent with the existing form patterns in AddAccountModal. Pre-fill with the current month/year.

**Rationale**: Simple, accessible, and consistent with the existing form UI. The AddAccountModal already uses `<select>` for account_type, so this follows the same pattern.

**Alternatives considered**:
- Date picker component: Rejected because we only need month+year granularity, not full dates. A date picker would be unnecessarily complex.
- Single "YYYY-MM" text input: Rejected for poor UX — dropdowns prevent invalid input.

## R5: Duplicate month/year handling

**Decision**: The backend endpoint returns a 409 Conflict error when a snapshot already exists for the given month. The frontend shows the error message from the API response. The unique constraint `(user_id, snapshot_month)` enforces this at the database level.

**Rationale**: The existing unique constraint already prevents duplicates. We just need to handle the conflict gracefully in the API and frontend.

**Alternatives considered**:
- Upsert (overwrite existing): Rejected because silently overwriting auto-generated snapshots with manual values could be destructive.
- Frontend-only validation (check before submit): Adds UX polish but the backend constraint is the source of truth. Both layers should validate.
