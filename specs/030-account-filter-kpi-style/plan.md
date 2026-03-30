# Implementation Plan: Account Filter & KPI Style

**Branch**: `030-account-filter-kpi-style` | **Date**: 2026-03-30 | **Spec**: [spec.md](./spec.md)

## Summary

Move account selector from inside PositionsList to the top of the portfolio page. Pass `account_id` to all portfolio API calls so KPIs, chart, positions, allocation, breakdown, and transactions all filter by account. Add `account_id` parameter to backend endpoints that don't have it yet (summary, performance, allocation, breakdown). Remove green/red background from KPI value text.

## Technical Context

**Language/Version**: Python 3.11 (backend), TypeScript 5 (frontend)
**Primary Dependencies**: FastAPI (backend); Next.js 16, TanStack Query, Recharts (frontend)

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| Keep It Simple | PASS | Adding optional parameter to existing endpoints, moving UI component |
| Always Test with Browser | PASS | Will verify with Playwright |

## Implementation Approach

### Backend: Add account_id to remaining endpoints

Currently only `GET /portfolio/positions` supports `?account_id=`. Need to add to:
- `GET /portfolio/summary` → pass to `get_summary()` → already calls `get_positions(account_id=)`
- `GET /portfolio/performance` → pass to `get_performance()` → filter transactions by account
- `GET /portfolio/allocation` → pass to `get_allocation()` → already calls `get_positions(account_id=)`
- `GET /portfolio/performance-breakdown` → pass to `get_performance_breakdown()` → filter transactions by account

Since `get_summary()` and `get_allocation()` both call `get_positions()` internally, adding `account_id` pass-through is straightforward. `get_performance()` and `get_performance_breakdown()` query transactions directly — need to add account filter there.

### Frontend: Lift account selector, pass to all hooks

1. Extract account tabs from `PositionsList` into `page.tsx` (top-level)
2. Pass `selectedAccountId` to all hooks: `usePortfolioSummary(accountId)`, `usePerformanceChart(range, accountId)`, `usePositions(accountId)`, `useAllTransactions()` / `useTransactions(accountId)`
3. Update hook signatures and query keys to include `accountId`

### Frontend: KPI style fix

In `kpi-strip.tsx`, remove the `bg-*` classes from `valueColorClass()` — keep only `text-*` color classes.
