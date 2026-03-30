# Tasks: Account Filter & KPI Style

**Input**: Design documents from `/specs/030-account-filter-kpi-style/`
**Prerequisites**: plan.md, spec.md

**Tests**: Manual browser testing via Playwright MCP.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: User Story 1 - Global Account Selector Filtering Everything (Priority: P1)

### Backend

- [x] T001 [US1] Add `account_id` parameter to `GET /portfolio/summary` endpoint in backend/app/api/portfolio.py
- [x] T002 [US1] Add `account_id` parameter to `get_summary()` in backend/app/services/portfolio_service.py
- [x] T003 [US1] Add `account_id` parameter to `GET /portfolio/performance` endpoint in backend/app/api/portfolio.py
- [x] T004 [US1] Add `account_id` parameter to `get_performance()` in backend/app/services/portfolio_service.py
- [x] T005 [P] [US1] Add `account_id` parameter to `GET /portfolio/allocation` endpoint in backend/app/api/portfolio.py
- [x] T006 [P] [US1] Add `account_id` parameter to `get_allocation()` in backend/app/services/portfolio_service.py
- [x] T007 [P] [US1] Add `account_id` parameter to `GET /portfolio/performance-breakdown` endpoint in backend/app/api/portfolio.py
- [x] T008 [P] [US1] Add `account_id` parameter to `get_performance_breakdown()` in backend/app/services/portfolio_service.py

### Frontend

- [x] T009 [US1] Extract account selector tabs from positions-list.tsx into the page level
- [x] T010 [US1] Add account selector tabs at the top of the portfolio page above KPI strip
- [x] T011 [US1] Update `usePortfolioSummary()` hook to accept optional `accountId` param
- [x] T012 [US1] Update `usePerformanceChart()` hook to accept optional `accountId` param
- [x] T013 [US1] Pass `selectedAccountId` to all hooks and components in page.tsx
- [x] T014 [US1] Update KpiStrip component to accept optional `accountId` prop
- [x] T015 [US1] Update PerformanceChart component to accept optional `accountId` prop
- [x] T016 [US1] Restart backend, verify in browser

---

## Phase 2: User Story 2 - Remove KPI Background Color (Priority: P2)

- [x] T017 [US2] Update `valueColorClass()` in frontend/src/lib/utils.ts to remove `bg-*` classes
- [x] T018 [US2] Verify in browser: green text without background highlight

---

## Phase 3: Polish & Verification

- [x] T019 Take screenshot of portfolio page with account selector at top and clean KPI styling
