# Tasks: Portfolio UI Polish

**Input**: Design documents from `/specs/028-portfolio-ui-polish/`
**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Tests**: Manual browser testing via Playwright MCP.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: User Story 1 - Fix Performance Chart History (Priority: P1) 🎯 MVP

**Goal**: Seed historical price data so the performance chart shows the full portfolio value history, not just today.

**Independent Test**: Select "MAX" on the performance chart — it should show data points spanning from the first transaction date to today.

### Implementation

- [x] T001 [US1] Add `seed_historical_prices(db, user_id)` function to backend/app/services/price_service.py that calls `fetch_historical()` on each provider for all held assets (last 365 days), storing results in `asset_prices` with correct currency
- [x] T002 [US1] Call `seed_historical_prices()` inside `refresh_prices()` when no historical data exists (check if asset_prices has <5 rows for any held asset) in backend/app/services/price_service.py
- [x] T003 [US1] Restart backend, trigger refresh-prices, verify asset_prices table has historical rows spanning multiple dates
- [x] T004 [US1] Verify performance chart in browser shows multiple data points for MAX range via Playwright MCP

**Checkpoint**: Performance chart shows historical portfolio value over time

---

## Phase 2: User Story 2 - Aggregated Transactions View (Priority: P2)

**Goal**: Show all transactions from all accounts when the Aggregated tab is selected.

**Independent Test**: Select Aggregated tab, verify transactions list shows below with entries from all accounts.

### Implementation

- [x] T005 [US2] Add `get_all_transactions(db, user_id)` function to backend/app/services/portfolio_service.py that queries all InvestmentTransaction rows for the user across all accounts, joining Account for account name, ordered by date desc
- [x] T006 [US2] Add `GET /portfolio/transactions` endpoint to backend/app/api/portfolio.py that returns all user transactions with account_name included in each row
- [x] T007 [US2] Add `useAllTransactions()` query hook to frontend/src/lib/queries/portfolio.ts that fetches from GET /portfolio/transactions
- [x] T008 [US2] Update frontend/src/app/(dashboard)/portfolio/page.tsx to show TransactionsView when Aggregated is selected (pass undefined as accountId), and pass specific accountId when an account is selected
- [x] T009 [US2] Update frontend/src/components/portfolio/transactions-view.tsx to support optional accountId: when undefined, use useAllTransactions() instead of useTransactions(accountId)
- [x] T010 [US2] Verify in browser: Aggregated tab shows all transactions, switching to specific account shows only that account's transactions

**Checkpoint**: Aggregated view shows all transactions across accounts

---

## Phase 3: User Story 3 - Compact Refresh Icon Button (Priority: P3)

**Goal**: Replace "Refresh Prices" text button with a small icon button.

**Independent Test**: Verify small icon button is visible, clicks trigger refresh with spinning animation.

### Implementation

- [x] T011 [US3] Replace the "Refresh Prices" text button with a compact icon button (inline SVG refresh icon, ~32x32px) in frontend/src/app/(dashboard)/portfolio/page.tsx, with CSS spin animation during isPending state and a title tooltip
- [x] T012 [US3] Verify icon button in browser: visible near KPIs, spins during refresh, tooltip on hover

**Checkpoint**: Compact icon button replaces text button

---

## Phase 4: Polish & Verification

- [x] T013 Verify all three features together in browser via Playwright MCP
- [x] T014 Take screenshot as evidence

---

## Dependencies & Execution Order

- **US1 (Phase 1)**: Independent — can start immediately
- **US2 (Phase 2)**: Independent — can start immediately
- **US3 (Phase 3)**: Independent — can start immediately
- **Polish (Phase 4)**: Depends on all prior phases

All three stories are independent and can be implemented in any order.

---

## Implementation Strategy

### MVP First (US1)
1. Seed historical prices → chart shows history
2. **STOP and VALIDATE**: MAX range shows multi-point chart

### Incremental
1. US1 → Chart works (MVP)
2. US2 → Aggregated transactions
3. US3 → Icon button
4. Polish → Final verification

---

## Notes

- Total tasks: 14
- US1 (P1): 4 tasks (historical price seeding)
- US2 (P2): 6 tasks (new endpoint + frontend wiring)
- US3 (P3): 2 tasks (icon button swap)
- Polish: 2 tasks
