# Tasks: Fix Performance Chart

**Input**: Design documents from `/specs/029-fix-performance-chart/`
**Prerequisites**: plan.md, spec.md

**Tests**: Manual browser testing via Playwright MCP.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: User Story 1 - Green Smooth Chart with Full History (Priority: P1)

**Goal**: Green line, no zero-dips on weekends, full date range from first transaction.

**Independent Test**: Select MAX on the chart — verify green smooth line spanning Jun 2023 to today with no zero-dips.

### Implementation

- [x] T001 [P] [US1] Change chart line color from `#000000` to green (`#4ade80`), update gradient fill to green, add `interval="preserveStartEnd"` to XAxis in frontend/src/components/portfolio/performance-chart.tsx
- [x] T002 [P] [US1] Update `seed_historical_prices()` in backend/app/services/price_service.py: replace `from_date = today - timedelta(days=365)` with earliest transaction date query (`MIN(InvestmentTransaction.date)` for user's assets)
- [x] T003 [US1] Update `get_performance()` in backend/app/services/portfolio_service.py: build a `last_known_price` dict per asset that carries forward prices across days without data, so weekends/holidays don't produce zero values
- [x] T004 [US1] Clear existing asset_prices to force re-seed with full history, restart backend, trigger refresh
- [x] T005 [US1] Verify chart in browser via Playwright MCP: green line, data from 2023, no zero-dips on weekends

---

## Dependencies & Execution Order

- T001 and T002 can run in parallel (different files)
- T003 depends on understanding the existing `get_performance()` code
- T004 depends on T002 (seed logic must be updated before re-seeding)
- T005 depends on all prior tasks

## Notes

- Total tasks: 5
- T001 is frontend-only, T002-T003 are backend-only
- CoinGecko free API may not return data older than 365 days for crypto — acceptable, ETF history from yfinance will cover 2023+
