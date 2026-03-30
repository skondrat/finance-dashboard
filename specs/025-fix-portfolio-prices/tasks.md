# Tasks: Fix Portfolio Prices

**Input**: Design documents from `/specs/025-fix-portfolio-prices/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: No test tasks — manual browser testing via Playwright MCP per constitution.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Install missing dependencies so price providers can function

- [x] T001 Install finnhub-python and pycoingecko packages in backend virtualenv (`cd backend && pip install finnhub-python pycoingecko`)
- [x] T002 Verify both packages import successfully (`python3 -c "import finnhub; from pycoingecko import CoinGeckoAPI; print('OK')"`)

---

## Phase 2: Foundational (Data Fixes)

**Purpose**: Fix incorrect database records that block ALL price fetching. MUST complete before any user story work.

**⚠️ CRITICAL**: No price fetching can work until asset types and tickers are corrected.

- [x] T003 Update BTC and ETH asset_type from "stock" to "crypto" in backend/data/finance.db
- [x] T004 Update IUAA ticker to "IUAA.DE" and ISAC ticker to "ISAC.DE" for Finnhub Xetra format in backend/data/finance.db
- [x] T005 Update corresponding investment_transactions if they reference old ticker values (verify foreign keys use asset_id UUID, not ticker string)

**Checkpoint**: Database records are correct — price provider routing will now work

---

## Phase 3: User Story 1 & 2 - Portfolio Shows Prices with Correct Providers (Priority: P1) 🎯 MVP

**Goal**: Fix the CoinGecko provider to use correct IDs and EUR currency, so all 4 positions (IUAA, ISAC, BTC, ETH) return real prices when refresh is triggered.

**Independent Test**: Call `POST /api/v1/portfolio/refresh-prices`, then `GET /api/v1/portfolio/positions` — all positions should have non-zero `current_price` and `current_value`.

### Implementation

- [x] T006 [P] [US1] Add CoinGecko ticker-to-ID mapping dict (BTC→bitcoin, ETH→ethereum) in backend/app/services/price_service.py CoinGeckoProvider.fetch_price()
- [x] T007 [P] [US1] Change CoinGecko vs_currencies from "usd" to "eur" in backend/app/services/price_service.py CoinGeckoProvider.fetch_price()
- [x] T008 [US1] Apply same CoinGecko ID mapping and EUR currency fix to CoinGeckoProvider.fetch_historical() in backend/app/services/price_service.py
- [x] T009 [US1] Restart backend server and call refresh-prices endpoint to verify prices are fetched and stored in asset_prices table
- [x] T010 [US1] Verify GET /portfolio/positions returns non-zero current_price for all 4 assets (IUAA.L, ISAC.L, BTC, ETH)

**Checkpoint**: All positions show real prices via API. Portfolio page should now display correct values.

---

## Phase 4: User Story 3 - Manual Price Refresh Button (Priority: P2)

**Goal**: Add a "Refresh Prices" button on the portfolio page so users can trigger price updates from the UI.

**Independent Test**: Click the refresh button on /portfolio, verify positions update with fresh prices.

### Implementation

- [x] T011 [US3] Add useRefreshPrices() mutation hook in frontend/src/lib/queries/portfolio.ts that calls POST /portfolio/refresh-prices and invalidates all portfolio query keys on success
- [x] T012 [US3] Add "Refresh Prices" button to portfolio page header in frontend/src/app/(dashboard)/portfolio/page.tsx, wired to useRefreshPrices() with loading state

**Checkpoint**: Users can manually refresh prices from the UI

---

## Phase 5: User Story 4 - Auto-Refresh on Page Load (Priority: P3)

**Goal**: Automatically refresh prices when the user visits the portfolio page and prices are stale (>1 hour old).

**Independent Test**: Navigate to /portfolio when prices are >1 hour old, verify a background refresh triggers automatically without user action.

### Implementation

- [x] T013 [US4] Add last_refreshed_at field to the GET /portfolio/summary response in backend/app/services/portfolio_service.py and backend/app/schemas/portfolio.py (query max fetched_at from asset_prices for user's assets)
- [x] T014 [US4] Add auto-refresh logic in frontend/src/app/(dashboard)/portfolio/page.tsx: on mount, check if summary.last_refreshed_at is >1 hour old (or null), if so call useRefreshPrices() automatically

**Checkpoint**: Prices auto-refresh on stale page load

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and cleanup

- [x] T015 Verify portfolio page in browser via Playwright MCP: all KPIs (Net Worth, Total Return, Return %, Invested Capital) show correct non-zero values
- [x] T016 Verify allocation chart and performance breakdown show correct data
- [x] T017 Run quickstart.md validation steps end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (packages must be installed)
- **US1/US2 (Phase 3)**: Depends on Phase 2 (data must be fixed)
- **US3 (Phase 4)**: Depends on Phase 3 (refresh must work before adding button)
- **US4 (Phase 5)**: Depends on Phase 4 (refresh hook must exist before auto-trigger)
- **Polish (Phase 6)**: Depends on all prior phases

### User Story Dependencies

- **US1 + US2 (P1)**: Combined — both are about making prices work. Can start after Foundational.
- **US3 (P2)**: Needs the refresh-prices endpoint to actually work (US1/US2 complete).
- **US4 (P3)**: Needs the useRefreshPrices hook from US3.

### Parallel Opportunities

- T006 and T007 can run in parallel (different parts of the same file, different methods)
- T003 and T004 are both DB updates but on the same table, so run sequentially

---

## Parallel Example: Phase 3

```bash
# Launch CoinGecko fixes in parallel (different methods):
Task T006: "Add CoinGecko ticker-to-ID mapping in fetch_price()"
Task T007: "Change vs_currencies from usd to eur in fetch_price()"
```

---

## Implementation Strategy

### MVP First (Phase 1-3: US1/US2 Only)

1. Install packages (Phase 1)
2. Fix database records (Phase 2)
3. Fix CoinGecko provider code (Phase 3)
4. **STOP and VALIDATE**: Refresh prices via API, verify portfolio shows values
5. This alone fixes the "all zeros" problem

### Incremental Delivery

1. Phase 1-3 → Prices work via API (MVP)
2. Phase 4 → Users can refresh from UI
3. Phase 5 → Auto-refresh for convenience
4. Phase 6 → Final verification

---

## Notes

- Total tasks: 17
- US1/US2 (P1): 5 tasks (core fix)
- US3 (P2): 2 tasks (refresh button)
- US4 (P3): 2 tasks (auto-refresh)
- Setup: 2 tasks, Foundational: 3 tasks, Polish: 3 tasks
- MVP is Phase 1-3 (10 tasks) — fixes the core "all zeros" problem
