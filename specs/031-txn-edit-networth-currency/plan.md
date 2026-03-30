# Implementation Plan: Transaction Edit/Delete, Net Worth Currency, Account Currency

**Branch**: `031-txn-edit-networth-currency` | **Date**: 2026-03-30 | **Spec**: [spec.md](./spec.md)

## Summary

Three improvements: (1) Add 3-dot menu to transaction cards for edit/delete — backend PUT/DELETE endpoints already exist, just need frontend hooks + UI. (2) Fix net worth USD display — backend already supports currency param and frontend is wired, but snapshots may only exist for EUR; need to also save USD snapshots or convert on display. (3) Add currency field to Account model so accounts show their base currency.

## Technical Context

**Language/Version**: Python 3.11 (backend), TypeScript 5 (frontend)
**Primary Dependencies**: FastAPI, SQLAlchemy 2.0, Alembic (backend); Next.js 16, TanStack Query (frontend)

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| Keep It Simple | PASS | Reusing existing backend endpoints, small frontend additions |
| Always Test with Browser | PASS | Will verify with Playwright |

## Implementation Approach

### US1: Transaction Edit/Delete (Frontend only)
- Backend PUT/DELETE endpoints already exist at `/accounts/{id}/transactions/{txn_id}`
- Add `useUpdateTransaction()` and `useDeleteTransaction()` mutation hooks
- Add 3-dot options menu (simple dropdown) to each transaction row in `transactions-view.tsx`
- Edit: inline form or modal with pre-filled fields
- Delete: confirmation dialog via `window.confirm()`

### US2: Net Worth Currency
- Backend and frontend already support the `currency` parameter end-to-end
- The issue is likely that `networth_snapshots` table only has EUR entries
- The history endpoint filters by currency: `WHERE currency = ?` — so USD queries return empty
- Fix: The snapshot auto-creation should save snapshots in both EUR and USD, OR the history query should convert EUR snapshots to display currency using FX rates (simpler)

### US3: Account Base Currency
- Add `currency` column to `accounts` table (Alembic migration, default "USD")
- Update Account model, AccountCreate/AccountResponse schemas
- Frontend already sends currency and has the type — just needs to display it in the sidebar
- Backfill existing accounts: IB→USD, Kraken→EUR
