# Implementation Plan: Fix Performance Chart

**Branch**: `029-fix-performance-chart` | **Date**: 2026-03-30 | **Spec**: [spec.md](./spec.md)

## Summary

Fix three chart issues: (1) Change line color from black to green + green gradient fill. (2) Extend historical price seeding from 365 days to earliest transaction date (Jun 2023). (3) Fix backend `get_performance()` to carry forward last known prices on days without data (weekends/holidays) so the chart doesn't drop to zero.

## Technical Context

**Language/Version**: Python 3.11 (backend), TypeScript 5 (frontend)
**Primary Dependencies**: Recharts 3 (frontend chart), yfinance/pycoingecko (historical prices)
**Changes**: 3 files — `performance-chart.tsx` (styling) + `portfolio_service.py` (carry-forward logic) + `price_service.py` (date range fix)

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| Keep It Simple | PASS | Small targeted fixes in existing code |
| Always Test with Browser | PASS | Will verify chart visually |

## Implementation Approach

### Frontend (performance-chart.tsx)
- Change `stroke="#000000"` to green color (`#4ade80`)
- Change gradient stops from black to green
- Add `interval="preserveStartEnd"` to XAxis to prevent label overlap

### Backend (portfolio_service.py — get_performance)
- In the date loop, carry forward the last known price for each asset when no price exists for that day
- Build a `last_known_price` map that persists across days

### Backend (price_service.py — seed_historical_prices)
- Replace `from_date = today - timedelta(days=365)` with earliest transaction date
- Query `MIN(InvestmentTransaction.date)` for the user's assets

No data-model.md or contracts/ needed — no schema changes.
