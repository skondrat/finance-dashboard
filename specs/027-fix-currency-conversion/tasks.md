# Tasks: Fix Currency Conversion

**Input**: Design documents from `/specs/027-fix-currency-conversion/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Manual browser testing via Playwright MCP.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Foundational (Schema + Data Fixes)

**Purpose**: Add currency tracking to asset prices and fix asset currency values. MUST complete before any conversion logic.

- [x] T001 Create Alembic migration to add `currency` column (String(3), NOT NULL, default "USD") to `asset_prices` table in backend/alembic/versions/
- [x] T002 Run the migration: `alembic upgrade head`
- [x] T003 Backfill existing `asset_prices` rows: set currency="EUR" where source="coingecko", currency="USD" where source="yfinance" in backend/data/finance.db
- [x] T004 Fix asset currency values in backend/data/finance.db: set currency="USD" for IUAA.L and ISAC.L, currency="EUR" for BTC and ETH
- [x] T005 Update `AssetPrice` model to include `currency = Column(String(3), nullable=False, default="USD")` in backend/app/models/asset_price.py

**Checkpoint**: Database schema updated, existing data backfilled with correct currencies

---

## Phase 2: User Story 2 - Store Prices in Native Currency (Priority: P1)

**Goal**: Price providers record the native currency of each fetched price, so conversion logic knows what currency a price is in.

**Independent Test**: Call refresh-prices, then query asset_prices table — each row should have the correct currency (USD for yfinance, EUR for coingecko).

- [x] T006 [US2] Update `YFinanceProvider` to return currency alongside price (always "USD") and update `refresh_prices()` to store it on the `AssetPrice` row in backend/app/services/price_service.py
- [x] T007 [US2] Update `CoinGeckoProvider` to return currency alongside price (always "EUR") and update `refresh_prices()` to store it on the `AssetPrice` row in backend/app/services/price_service.py
- [x] T008 [US2] Restart backend, call refresh-prices, verify new asset_prices rows have correct currency values

**Checkpoint**: All newly fetched prices have their native currency stored

---

## Phase 3: User Story 1 - EUR/USD Toggle Recalculates Values (Priority: P1) 🎯 MVP

**Goal**: Wire `fx_service.convert()` into `portfolio_service.py` so the `currency` parameter actually converts values.

**Independent Test**: Call GET /portfolio/summary?currency=EUR and GET /portfolio/summary?currency=USD — net_worth should differ by the EUR/USD exchange rate.

- [x] T009 [US1] Read and understand the existing `fx_service.py` — verify `get_rate()` and `convert()` work correctly in backend/app/services/fx_service.py
- [x] T010 [US1] Update `get_positions()` in backend/app/services/portfolio_service.py to convert current_price, current_value, avg_cost_basis, total_cost, and pnl_absolute from their native currency to the requested display currency using fx_service
- [x] T011 [US1] Update `get_summary()` in backend/app/services/portfolio_service.py to convert net_worth, total_return, and invested_capital to the display currency
- [x] T012 [P] [US1] Update `get_allocation()` in backend/app/services/portfolio_service.py to convert segment values and total to the display currency
- [x] T013 [P] [US1] Update `get_performance_breakdown()` in backend/app/services/portfolio_service.py to convert capital, price_gain, dividends, realized_losses, transaction_costs, and total_return to the display currency
- [x] T014 [US1] Update `get_performance()` in backend/app/services/portfolio_service.py to convert data_point values to the display currency
- [x] T015 [US1] Restart backend and verify: GET /portfolio/summary?currency=EUR vs ?currency=USD returns different values proportional to exchange rate

**Checkpoint**: EUR/USD toggle actually changes all monetary values

---

## Phase 4: User Story 3 - Cache Exchange Rates Daily (Priority: P2)

**Goal**: Ensure exchange rates are fetched once per day and cached — verify the existing fx_service handles this correctly.

**Independent Test**: Load portfolio twice on the same day, verify exchange_rates table has only one row for today's EUR/USD pair.

- [x] T016 [US3] Verify fx_service.get_rate() caches rates correctly: check that it queries the DB first and only fetches externally if no rate exists for today in backend/app/services/fx_service.py
- [x] T017 [US3] Add fallback logic to fx_service.get_rate(): if external API fails, return the most recent available rate from the database in backend/app/services/fx_service.py (if not already implemented)
- [x] T018 [US3] Verify exchange_rates table has correct data after portfolio loads in both EUR and USD

**Checkpoint**: Exchange rates cached daily with fallback

---

## Phase 5: Polish & Verification

**Purpose**: End-to-end browser testing

- [x] T019 Navigate to /portfolio in EUR mode via Playwright MCP, note Net Worth value
- [x] T020 Toggle to USD, verify all monetary values change proportionally (Net Worth, positions, P/L, KPIs)
- [x] T021 Verify percentages (Return %, Weight, P/L %) remain unchanged after toggle
- [x] T022 Toggle back to EUR, verify values return to original amounts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Foundational)**: No dependencies — start immediately
- **Phase 2 (US2)**: Depends on Phase 1 (currency column must exist)
- **Phase 3 (US1)**: Depends on Phase 2 (prices must have currency metadata)
- **Phase 4 (US3)**: Can run after Phase 1 (fx_service already exists), but test after Phase 3
- **Phase 5 (Polish)**: Depends on all prior phases

### Parallel Opportunities

- T012 and T013 can run in parallel (different functions in same file)
- Phase 4 tasks are mostly verification of existing code

---

## Implementation Strategy

### MVP First (Phase 1-3)

1. Add currency column + fix data (Phase 1)
2. Store native currency on price fetch (Phase 2)
3. Wire conversion into portfolio service (Phase 3)
4. **STOP and VALIDATE**: Toggle EUR/USD, verify values change

### Incremental Delivery

1. Phase 1-3 → Toggle works with real conversion (MVP)
2. Phase 4 → Verify caching and fallback
3. Phase 5 → Full browser verification

---

## Notes

- Total tasks: 22
- US1 (P1): 7 tasks (conversion logic)
- US2 (P1): 3 tasks (price currency tracking)
- US3 (P2): 3 tasks (rate caching verification)
- Foundational: 5 tasks, Polish: 4 tasks
- MVP is Phase 1-3 (15 tasks)
