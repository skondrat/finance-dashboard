# Quickstart: Net Worth History

**Feature**: 022-networth-history | **Date**: 2026-03-29

## What This Feature Does

Tracks net worth over time by automatically saving monthly snapshots whenever account balances change. Displays a line chart on the networth page showing the trend with a time range selector.

## Files to Create

| File | Purpose |
|------|---------|
| `backend/app/models/networth_snapshot.py` | NetworthSnapshot SQLAlchemy model |
| `backend/app/services/networth_service.py` | Snapshot capture logic |
| `backend/alembic/versions/xxx_add_networth_snapshots.py` | Database migration |
| `frontend/src/components/networth/networth-chart.tsx` | Line chart component |

## Files to Modify

| File | Change |
|------|--------|
| `backend/app/schemas/networth.py` | Add snapshot request/response schemas |
| `backend/app/api/networth.py` | Add history endpoint + snapshot triggers in CRUD |
| `backend/app/models/__init__.py` | Register new model (if applicable) |
| `frontend/src/lib/queries/networth.ts` | Add `useNetworthHistory` query hook |
| `frontend/src/app/(dashboard)/networth/page.tsx` | Add chart component above existing content |

## How to Verify

1. Start both servers: backend on :8000, frontend on :3000
2. Log in and navigate to /networth
3. Add a networth account with a balance (e.g., "Savings" with €10,000)
4. Verify the chart appears with a single data point for the current month
5. Update the account balance to €12,000
6. Verify the chart still shows one point (same month, overwritten)
7. To test multiple months: manually insert older snapshot rows via SQLite, then reload the page to see the trend line
