# Tasks: Finance Dashboard

**Input**: Design documents from `/specs/001-finance-dashboard/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/api.md, research.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Project initialization, dependencies, and tooling

- [x] T001 Create backend project structure: `backend/app/{models,api,services,parsers,schemas}/` directories and `backend/tests/{unit,integration}/` per plan.md
- [x] T002 Initialize backend Python project with uv: create `backend/pyproject.toml` with all dependencies (fastapi, sqlalchemy, alembic, python-jose, passlib, httpx, ofxparse, mt-940, finnhub-python, pycoingecko, pytest, uvicorn) and run `uv sync` in `backend/`
- [x] T003 Create frontend project with Next.js 15 App Router: `npx create-next-app@latest frontend` with TypeScript, Tailwind CSS 4, App Router, and src/ directory
- [x] T004 Install frontend dependencies: pnpm add recharts d3-sankey @tanstack/react-query zustand react-hook-form zod react-dropzone in `frontend/`
- [x] T005 [P] Configure Tailwind design tokens from SPEC.md section 11 (light + dark theme CSS custom properties) in `frontend/tailwind.config.ts` and `frontend/src/styles/globals.css`
- [x] T006 [P] Configure self-hosted fonts (Geist Mono, Space Grotesk, Inter) via next/font in `frontend/src/app/layout.tsx`
- [x] T007 [P] Create `docker-compose.yml` at project root with backend (port 8000) and frontend (port 3000) services
- [x] T008 [P] Create `backend/.env.example` and `frontend/.env.local.example` with all environment variables from quickstart.md

**Checkpoint**: Both projects initialize and run (`uv run uvicorn app.main:app` and `pnpm dev`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [x] T009 Create FastAPI application entry point with CORS middleware in `backend/app/main.py`
- [x] T010 Create settings/config module reading env vars in `backend/app/config.py`
- [x] T011 Create SQLAlchemy engine, session factory, and Base declarative class in `backend/app/database.py`
- [x] T012 Initialize Alembic with SQLite configuration in `backend/alembic/`
- [x] T013 [P] Create User SQLAlchemy model in `backend/app/models/user.py` per data-model.md (id, email, password_hash, display_name, preferred_currency, theme, timestamps)
- [x] T014 [P] Create Account SQLAlchemy model in `backend/app/models/account.py` per data-model.md (id, user_id FK, name, type, notes, created_at)
- [x] T015 [P] Create common Pydantic schemas (pagination, error response, currency param) in `backend/app/schemas/common.py` per contracts/api.md
- [x] T016 Generate initial Alembic migration for User and Account tables and run `alembic upgrade head`
- [x] T017 Create `backend/tests/conftest.py` with test database fixture (in-memory SQLite), test client, and test user factory
- [x] T018 [P] Create API client wrapper with auth header injection and currency param in `frontend/src/lib/api.ts`
- [x] T019 [P] Create Zustand currency store in `frontend/src/stores/currency-store.ts` and theme store in `frontend/src/stores/theme-store.ts`
- [x] T020 [P] Set up TanStack Query provider in `frontend/src/app/layout.tsx`
- [x] T021 Build top-bar component with tab navigation (Portfolio, Budget, Cashflow), currency segmented control, theme toggle placeholder, and user avatar placeholder in `frontend/src/components/layout/top-bar.tsx` per SPEC.md section 4
- [x] T022 Build currency toggle segmented control component (EUR | USD) per SPEC.md section 4 styling in `frontend/src/components/layout/currency-toggle.tsx`
- [x] T023 Create root layout with fonts, providers (QueryClient, Zustand), and top-bar in `frontend/src/app/layout.tsx`
- [x] T024 Create formatting utilities (currency formatting with Geist Mono, percentage formatting, date formatting, positive/negative color helpers) in `frontend/src/lib/utils.ts`
- [x] T025 Install and configure shadcn/ui base components (Dialog, Tabs, DropdownMenu, Input, Button) restyled to Editorial Ledger design system in `frontend/src/components/ui/`

**Checkpoint**: Backend serves API at /docs, frontend renders top-bar shell with working tab navigation. Database schema ready.

---

## Phase 3: User Story 1 - Portfolio Overview & Net Worth Tracking (Priority: P1)

**Goal**: Display net worth, portfolio performance chart, and positions list with KPI indicators

**Independent Test**: Add an account, enter a buy transaction via API, verify KPI strip shows net worth/return and positions list shows the position with correct P/L

### Implementation for User Story 1

- [x] T026 [P] [US1] Create Asset SQLAlchemy model in `backend/app/models/asset.py` per data-model.md (id, ticker, name, asset_type, currency, region, sector, industry)
- [x] T027 [P] [US1] Create InvestmentTransaction SQLAlchemy model in `backend/app/models/investment_transaction.py` per data-model.md (id, account_id FK, asset_id FK, type, quantity, price_per_unit, currency, fees, date)
- [x] T028 [P] [US1] Create AssetPrice SQLAlchemy model in `backend/app/models/asset_price.py` per data-model.md (id, asset_id FK, date, close_price, source, fetched_at)
- [x] T029 Generate Alembic migration for Asset, InvestmentTransaction, AssetPrice tables
- [x] T030 [P] [US1] Create Pydantic schemas for portfolio endpoints (PositionResponse, PortfolioSummaryResponse, PerformanceDataPoint) in `backend/app/schemas/portfolio.py` per contracts/api.md
- [x] T031 [P] [US1] Create Pydantic schemas for account and transaction CRUD (AccountCreate, TransactionCreate, TransactionResponse) in `backend/app/schemas/account.py` per contracts/api.md
- [x] T032 [US1] Implement portfolio_service with position calculation (average cost method), summary KPIs (net worth, total return, return %, invested capital), and performance time-series in `backend/app/services/portfolio_service.py`
- [x] T033 [US1] Implement price_service with Finnhub + CoinGecko provider abstraction, on-demand price fetching, and caching in `backend/app/services/price_service.py` per research.md
- [x] T034 [US1] Implement account CRUD API endpoints (GET/POST/PATCH/DELETE /accounts) in `backend/app/api/accounts.py` per contracts/api.md
- [x] T035 [US1] Implement transaction CRUD API endpoints (GET/POST/PUT/DELETE /accounts/{id}/transactions) in `backend/app/api/transactions.py` per contracts/api.md
- [x] T036 [US1] Implement portfolio API endpoints (GET /portfolio/positions, /portfolio/summary, /portfolio/performance, POST /portfolio/refresh-prices) in `backend/app/api/portfolio.py` per contracts/api.md
- [x] T037 [US1] Register all Phase 3 routers in `backend/app/main.py`
- [x] T038 [P] [US1] Create TanStack Query hooks for portfolio endpoints (usePortfolioSummary, usePositions, usePerformanceChart) in `frontend/src/lib/queries/portfolio.ts`
- [x] T039 [P] [US1] Create TanStack Query hooks for account/transaction endpoints (useAccounts, useTransactions, useCreateTransaction) in `frontend/src/lib/queries/accounts.ts`
- [x] T040 [US1] Build Portfolio KPI strip component with 6 cards (net worth, total return, return %, saving rate, investment rate, invested capital) per SPEC.md section 5.1 in `frontend/src/components/portfolio/kpi-strip.tsx`
- [x] T041 [US1] Build Portfolio performance area chart with time range selector pills (1D/1W/1M/YTD/1Y/MAX) and gradient fill per SPEC.md section 5.2 in `frontend/src/components/portfolio/performance-chart.tsx`
- [x] T042 [US1] Build Positions list table with sortable columns (asset, buy-in, position, P/L, weight), card rows, and aggregated/per-account sub-tabs per SPEC.md section 5.3 in `frontend/src/components/portfolio/positions-list.tsx`
- [x] T043 [US1] Compose Portfolio page with KPI strip + performance chart + positions list in `frontend/src/app/portfolio/page.tsx` following SPEC.md section 5 layout (8+4 grid, main content area)
- [x] T044 [US1] Create redirect from root page to /portfolio in `frontend/src/app/page.tsx`

**Checkpoint**: Portfolio tab displays KPI strip, performance chart, and positions list with real data from the API

---

## Phase 4: User Story 2 - Budget & Spend Tracking (Priority: P1)

**Goal**: Import bank statements, categorize transactions, set budgets, and view spend-by-category

**Independent Test**: Upload a CSV bank statement, verify parsed transactions appear, categorize them, set a budget for a category, confirm progress bar and KPI strip update

### Implementation for User Story 2

- [x] T045 [P] [US2] Create Category SQLAlchemy model in `backend/app/models/category.py` per data-model.md (id, user_id FK, name, color, monthly_budget, is_archived, is_default, merged_into_id self-ref)
- [x] T046 [P] [US2] Create AutoCatRule SQLAlchemy model in `backend/app/models/auto_cat_rule.py` per data-model.md (id, category_id FK, keyword)
- [x] T047 [P] [US2] Create BudgetTransaction SQLAlchemy model in `backend/app/models/budget_transaction.py` per data-model.md (id, user_id FK, import_id FK, category_id FK, date, description, amount, currency, reference, is_investment, dedup_hash)
- [x] T048 [P] [US2] Create BankProfile SQLAlchemy model in `backend/app/models/bank_profile.py` per data-model.md (id, user_id FK, name, delimiter, column mappings, date_format, encoding, skip_rows)
- [x] T049 [P] [US2] Create StatementImport SQLAlchemy model in `backend/app/models/statement_import.py` per data-model.md (id, user_id FK, filename, format, bank_profile_id FK, row_count, duplicate_count, status)
- [x] T050 [P] [US2] Create IncomeSource SQLAlchemy model in `backend/app/models/income_source.py` per data-model.md (id, user_id FK, label, amount, currency, month, year)
- [x] T051 Generate Alembic migration for Category, AutoCatRule, BudgetTransaction, BankProfile, StatementImport, IncomeSource tables
- [x] T052 [US2] Implement seed function to create default categories (Housing, Food & Groceries, Transport, Entertainment, Health, Shopping, Subscriptions, Utilities, Investments, Income, Transfers, Other) on user creation in `backend/app/services/budget_service.py`
- [x] T053 [P] [US2] Create parser registry with StatementFormat enum and StatementParser abstract base class in `backend/app/parsers/registry.py`
- [x] T054 [P] [US2] Implement CSV parser with bank-profile-driven column mapping in `backend/app/parsers/csv_parser.py`
- [x] T055 [P] [US2] Implement OFX parser using ofxparse in `backend/app/parsers/ofx_parser.py`
- [x] T056 [P] [US2] Implement MT940 parser using mt-940 in `backend/app/parsers/mt940_parser.py`
- [x] T057 [US2] Implement import_service with file parsing dispatch, deduplication (SHA-256 of date+amount+reference), preview generation, and confirm/discard flow in `backend/app/services/import_service.py`
- [x] T058 [US2] Implement categorization_service with keyword matching and retroactive rule application in `backend/app/services/categorization_service.py`
- [x] T059 [US2] Implement budget_service with KPI calculations (monthly income/spend/savings, saving rate, investment rate, budget remaining) and spend-by-category aggregation in `backend/app/services/budget_service.py`
- [x] T060 [P] [US2] Create Pydantic schemas for budget endpoints (CategoryResponse, BudgetTransactionResponse, ImportUploadResponse, SpendByCategoryResponse, BudgetSummaryResponse) in `backend/app/schemas/budget.py`
- [x] T061 [US2] Implement category CRUD API endpoints (GET/POST/PATCH /budget/categories, POST /budget/categories/{id}/merge) in `backend/app/api/categories.py` per contracts/api.md
- [x] T062 [US2] Implement auto-categorization rule API endpoints (GET/POST/DELETE /budget/categories/{id}/rules, POST /budget/rules/apply) in `backend/app/api/categories.py`
- [x] T063 [US2] Implement statement import API endpoints (POST /budget/import/upload, GET /budget/import/{id}, POST /budget/import/{id}/confirm, POST /budget/import/{id}/discard) in `backend/app/api/import_.py` per contracts/api.md
- [x] T064 [US2] Implement bank profile CRUD API endpoints (GET/POST/PATCH/DELETE /budget/bank-profiles) in `backend/app/api/import_.py`
- [x] T065 [US2] Implement budget transaction API endpoints (GET/POST/PATCH/DELETE /budget/transactions) in `backend/app/api/budget.py`
- [x] T066 [US2] Implement income source API endpoints (GET/POST/PATCH/DELETE /budget/income) in `backend/app/api/income.py`
- [x] T067 [US2] Implement budget summary API endpoint (GET /budget/summary with period params) in `backend/app/api/budget.py`
- [x] T068 [US2] Implement spend-by-category API endpoint (GET /budget/spend-by-category with period params) in `backend/app/api/budget.py`
- [x] T069 [US2] Register all Phase 4 routers in `backend/app/main.py`
- [x] T070 [P] [US2] Create TanStack Query hooks for budget endpoints (useBudgetSummary, useSpendByCategory, useCategories, useImportUpload) in `frontend/src/lib/queries/budget.ts`
- [x] T071 [US2] Build Budget KPI strip component (monthly income, spend, savings, saving rate, investment rate, budget remaining) per SPEC.md section 6.2 in `frontend/src/components/budget/kpi-strip.tsx`
- [x] T072 [US2] Build category table with spend-vs-budget progress bars, expandable rows, and sparkline placeholders per SPEC.md section 6.6 in `frontend/src/components/budget/category-table.tsx`
- [x] T073 [US2] Build statement import modal with drag-and-drop upload zone, bank profile selector, preview table, and confirm/discard buttons per SPEC.md section 6.3 in `frontend/src/components/budget/import-modal.tsx`
- [x] T074 [US2] Build income manager component for manual income entry with multiple sources per SPEC.md section 6.5 in `frontend/src/components/budget/income-manager.tsx`
- [x] T075 [US2] Build time aggregation segmented control (Monthly/YTD/Yearly/Custom) with month selector per SPEC.md section 6.7 in `frontend/src/components/budget/time-aggregation.tsx`
- [x] T076 [US2] Compose Budget page with KPI strip + time aggregation + category table + import button in `frontend/src/app/budget/page.tsx` following SPEC.md section 6.1 layout (8+4 grid)

**Checkpoint**: Budget tab shows KPI strip, category table with progress bars, working statement import flow

---

## Phase 5: User Story 3 - Currency Conversion (Priority: P1)

**Goal**: Toggle between EUR and USD with all monetary values converting in real time across all tabs

**Independent Test**: Toggle currency from EUR to USD and verify all displayed monetary values (portfolio KPIs, budget amounts, positions) convert using appropriate exchange rates

### Implementation for User Story 3

- [x] T077 [P] [US3] Create ExchangeRate SQLAlchemy model in `backend/app/models/exchange_rate.py` per data-model.md (id, base_currency, target_currency, rate, date, fetched_at)
- [x] T078 Generate Alembic migration for ExchangeRate table
- [x] T079 [US3] Implement fx_service with ECB daily rate fetching, caching, date-based rate lookup, and fallback-to-nearest-date logic in `backend/app/services/fx_service.py` per research.md
- [x] T080 [US3] Implement exchange rate API endpoints (GET /exchange-rates/latest, GET /exchange-rates with date range) in `backend/app/api/exchange_rates.py` per contracts/api.md
- [x] T081 [US3] Add currency conversion support to portfolio_service — convert position values and KPIs to requested currency using fx_service in `backend/app/services/portfolio_service.py`
- [x] T082 [US3] Add currency conversion support to budget_service — convert transaction amounts and KPIs to requested currency in `backend/app/services/budget_service.py`
- [x] T083 [US3] Wire currency query param (`?currency=`) through all monetary API endpoints in `backend/app/api/portfolio.py` and `backend/app/api/budget.py`
- [x] T084 [US3] Connect currency-store to API client so all requests include `?currency=` param in `frontend/src/lib/api.ts`
- [x] T085 [US3] Add TanStack Query cache invalidation on currency change so all monetary data refetches in `frontend/src/stores/currency-store.ts`

**Checkpoint**: Toggling EUR/USD in the top bar updates all monetary values across Portfolio and Budget tabs within 1 second

---

## Phase 6: User Story 4 - Transaction & Account Management (Priority: P2)

**Goal**: Full CRUD UI for accounts and investment transactions with modals and filters

**Independent Test**: Create a new account via modal, add a buy transaction, verify position appears in portfolio with correct cost basis

### Implementation for User Story 4

- [x] T086 [US4] Build "Add account" modal with form (name, type dropdown, notes) using React Hook Form + Zod validation per SPEC.md section 5.6 in `frontend/src/components/portfolio/add-account-modal.tsx`
- [x] T087 [US4] Build "Add transaction" form with fields (asset ticker/search, quantity, price, date, type buy/sell, currency) using React Hook Form + Zod per SPEC.md section 5.4 in `frontend/src/components/portfolio/add-transaction-form.tsx`
- [x] T088 [US4] Build Transactions view with search bar, chronological list grouped by month, and "+ Add transaction" button per SPEC.md section 5.4 in `frontend/src/components/portfolio/transactions-view.tsx`
- [x] T089 [US4] Add account filter sub-tabs (Aggregated | per-account) to positions list in `frontend/src/components/portfolio/positions-list.tsx`
- [x] T090 [US4] Integrate transactions view, add-account modal, and account filters into Portfolio page in `frontend/src/app/portfolio/page.tsx`

**Checkpoint**: Full account and transaction management from the Portfolio tab UI

---

## Phase 7: User Story 5 - Cashflow Visualization (Priority: P2)

**Goal**: Sankey diagram showing last month's cash flow from income to spending/saving/investments

**Independent Test**: With categorized budget transactions and income for last month, navigate to Cashflow tab and verify Sankey renders with correct flow values

### Implementation for User Story 5

- [x] T091 [US5] Implement cashflow Sankey data endpoint (GET /cashflow/sankey) computing nodes and links from last month's budget data in `backend/app/api/cashflow.py` per contracts/api.md
- [x] T092 [US5] Register cashflow router in `backend/app/main.py`
- [x] T093 [P] [US5] Create TanStack Query hook for cashflow endpoint (useCashflowSankey) in `frontend/src/lib/queries/cashflow.ts`
- [x] T094 [US5] Build Sankey diagram component using d3-sankey with monochromatic flows, green accent for savings, and glassmorphism tooltips per SPEC.md section 7.3 in `frontend/src/components/cashflow/sankey-diagram.tsx`
- [x] T095 [US5] Build Cashflow KPI strip (total income, total spend, total savings, total investments) per SPEC.md section 7.2 in `frontend/src/components/cashflow/kpi-strip.tsx`
- [x] T096 [US5] Build bottom breakdown row with income sources list (left 6-col) and top spending categories list (right 6-col) per SPEC.md section 7.4 in `frontend/src/components/cashflow/breakdown-row.tsx`
- [x] T097 [US5] Compose Cashflow page with KPI strip + Sankey diagram + breakdown row in `frontend/src/app/cashflow/page.tsx` per SPEC.md section 7.1 layout

**Checkpoint**: Cashflow tab shows Sankey diagram with accurate flow data from last month's budget

---

## Phase 8: User Story 6 - Budget Analytics & Charts (Priority: P2)

**Goal**: Budget analytics charts — income vs. spend, savings over time, investment rate trend, category distribution

**Independent Test**: With 3+ months of budget data, verify all analytics charts render with correct data on the Budget tab

### Implementation for User Story 6

- [x] T098 [US6] Implement budget chart API endpoints (GET /budget/charts/income-vs-spend, /budget/charts/savings-over-time, /budget/charts/investment-rate-trend, /budget/charts/category-distribution) in `backend/app/api/budget.py` per contracts/api.md
- [x] T099 [P] [US6] Build Income vs. Spend grouped bar chart (green=income, dark=spend) per SPEC.md section 6.8 in `frontend/src/components/budget/charts/income-vs-spend.tsx`
- [x] T100 [P] [US6] Build Savings Over Time area chart per SPEC.md section 6.8 in `frontend/src/components/budget/charts/savings-over-time.tsx`
- [x] T101 [P] [US6] Build Investment Rate Trend line chart per SPEC.md section 6.8 in `frontend/src/components/budget/charts/investment-rate-trend.tsx`
- [x] T102 [P] [US6] Build Category Spend Distribution pie/donut chart with monochromatic palette per SPEC.md section 6.8 in `frontend/src/components/budget/charts/category-distribution.tsx`
- [x] T103 [US6] Add category sparklines (6-month mini trend) to category table rows in `frontend/src/components/budget/category-table.tsx`
- [x] T104 [US6] Integrate analytics charts into Budget page right rail (income vs. spend chart) and main content area per SPEC.md section 6.1 layout in `frontend/src/app/budget/page.tsx`

**Checkpoint**: Budget tab shows all analytics charts with real data, sparklines in category table

---

## Phase 9: User Story 7 - Portfolio Allocation & Performance Analytics (Priority: P2)

**Goal**: Allocation donut chart, performance breakdown, and IRR/TWR in the right-rail sidebar

**Independent Test**: With a diversified portfolio, verify allocation donut shows correct segments and performance breakdown shows accurate figures

### Implementation for User Story 7

- [x] T105 [US7] Implement portfolio allocation API endpoint (GET /portfolio/allocation with group_by param) in `backend/app/api/portfolio.py` per contracts/api.md
- [x] T106 [US7] Implement portfolio performance breakdown API endpoint (GET /portfolio/performance-breakdown) with capital, price gain, dividends, realized losses, transaction costs, IRR, TWR in `backend/app/api/portfolio.py` per contracts/api.md
- [x] T107 [US7] Implement IRR (Newton-Raphson) and TWR calculations in `backend/app/services/portfolio_service.py` per SPEC.md section 9
- [x] T108 [US7] Build Allocation donut chart with sub-tabs (Type/Positions/Regions/Sectors/Industries) and center net worth label per SPEC.md section 5.5 in `frontend/src/components/portfolio/allocation-donut.tsx`
- [x] T109 [US7] Build Performance breakdown sidebar with capital, price gain, dividends, realized losses, transaction costs, total return, and positive/negative coloring per SPEC.md section 5.5 in `frontend/src/components/portfolio/performance-breakdown.tsx`
- [x] T110 [US7] Integrate allocation donut and performance breakdown into Portfolio page right-rail sidebar (4-column metadata rail) per SPEC.md section 5.5 in `frontend/src/app/portfolio/page.tsx`

**Checkpoint**: Portfolio right rail shows allocation donut with grouping sub-tabs and accurate performance breakdown

---

## Phase 10: User Story 8 - Theme Toggle & Visual Design (Priority: P3)

**Goal**: Working dark/light theme toggle with all components adapting to the Editorial Ledger dark palette

**Independent Test**: Toggle theme and verify all surfaces, text, charts, and interactive elements update to dark palette without layout shifts

### Implementation for User Story 8

- [x] T111 [US8] Implement dark mode CSS custom properties using Tailwind `dark:` variant with full dark palette from DESIGN.md in `frontend/src/styles/globals.css`
- [x] T112 [US8] Build theme toggle component (dark/light) and connect to Zustand theme store + `document.documentElement.classList` in `frontend/src/components/layout/theme-toggle.tsx`
- [x] T113 [US8] Add PATCH /user/me endpoint for persisting theme preference in `backend/app/api/auth.py` per contracts/api.md
- [x] T114 [US8] Update all chart components to use CSS custom property colors so they respond to theme changes in `frontend/src/components/portfolio/` and `frontend/src/components/budget/charts/`
- [x] T115 [US8] Integrate theme toggle into top-bar in `frontend/src/components/layout/top-bar.tsx`

**Checkpoint**: Theme toggle switches all UI elements between light and dark Editorial Ledger palettes

---

## Phase 11: User Story 9 - User Authentication (Priority: P3)

**Goal**: Registration, login, logout with JWT auth and data isolation between users

**Independent Test**: Register a new user, log in, access dashboard data, log out, confirm data not accessible without auth

### Implementation for User Story 9

- [x] T116 [P] [US9] Create Pydantic schemas for auth endpoints (RegisterRequest, LoginRequest, TokenResponse, UserResponse, UserUpdate) in `backend/app/schemas/auth.py` per contracts/api.md
- [x] T117 [US9] Implement auth_service with password hashing (bcrypt), JWT access/refresh token generation, and token validation in `backend/app/services/auth_service.py`
- [x] T118 [US9] Implement auth dependency (get_current_user) extracting user from JWT Bearer token in `backend/app/api/auth.py`
- [x] T119 [US9] Implement auth API endpoints (POST /auth/register, /auth/login, /auth/refresh, /auth/logout, GET /user/me) with httpOnly refresh cookie in `backend/app/api/auth.py` per contracts/api.md
- [x] T120 [US9] Add auth dependency to all protected API routers — inject current_user into all endpoints in `backend/app/api/*.py`
- [x] T121 [US9] Add user_id filtering to all service queries (row-level data isolation) in `backend/app/services/*.py`
- [x] T122 [P] [US9] Build login page with email/password form per Editorial Ledger styling in `frontend/src/app/login/page.tsx`
- [x] T123 [P] [US9] Build registration page with email/password/display_name form in `frontend/src/app/register/page.tsx`
- [x] T124 [US9] Add auth state management (token storage, auto-refresh, redirect to login on 401) to API client in `frontend/src/lib/api.ts`
- [x] T125 [US9] Add auth guard middleware to protect all dashboard routes in `frontend/src/middleware.ts`

**Checkpoint**: Full auth flow working — register, login, data isolated per user, session expiry redirects to login

---

## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T126 [P] Add loading/skeleton states for all async data views (KPI strips, position list, category table, charts) across `frontend/src/components/`
- [x] T127 [P] Add empty state components for no-data scenarios (no accounts, no positions, no transactions, no budget data) across `frontend/src/components/`
- [x] T128 [P] Add error boundary and error state components for API failures in `frontend/src/components/ui/error-boundary.tsx`
- [x] T129 Validate all components against DESIGN.md: no borders (except allowed exceptions), tonal stacking, correct typography tokens, positive/negative coloring
- [x] T130 Run quickstart.md validation: verify both backend and frontend start from a clean clone
- [x] T131 [P] Create `backend/Dockerfile` and `frontend/Dockerfile` per quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 Portfolio (Phase 3)**: Depends on Foundational
- **US2 Budget (Phase 4)**: Depends on Foundational — can run in parallel with US1
- **US3 Currency (Phase 5)**: Depends on US1 + US2 (needs monetary endpoints to add conversion to)
- **US4 Transaction Mgmt (Phase 6)**: Depends on US1 (adds management UI to existing portfolio)
- **US5 Cashflow (Phase 7)**: Depends on US2 (needs budget transaction data)
- **US6 Budget Analytics (Phase 8)**: Depends on US2 (needs budget data for charts)
- **US7 Portfolio Analytics (Phase 9)**: Depends on US1 (needs position data for allocation/performance)
- **US8 Theme (Phase 10)**: Depends on Foundational (can start once frontend scaffold exists, but best after most components are built)
- **US9 Auth (Phase 11)**: Depends on Foundational (can be done anytime, but listed last since single-user mode is acceptable for dev)
- **Polish (Phase 12)**: Depends on all desired user stories being complete

### User Story Dependencies

```
Phase 1: Setup
    ↓
Phase 2: Foundational
    ↓
    ├── Phase 3: US1 Portfolio (P1)──────┬── Phase 6: US4 Transaction Mgmt (P2)
    │                                    └── Phase 9: US7 Portfolio Analytics (P2)
    ├── Phase 4: US2 Budget (P1)────────┬── Phase 7: US5 Cashflow (P2)
    │                                    └── Phase 8: US6 Budget Analytics (P2)
    └── (US1 + US2) ─── Phase 5: US3 Currency (P1)

Phase 10: US8 Theme (P3) — after most components built
Phase 11: US9 Auth (P3) — anytime after Foundational
Phase 12: Polish — after all stories
```

### Parallel Opportunities

- **Phase 1**: T005, T006, T007, T008 can run in parallel
- **Phase 2**: T013, T014, T015 in parallel; T018, T019, T020 in parallel
- **Phase 3 + Phase 4**: US1 and US2 can run in parallel after Foundational
- **Phase 6 + Phase 7 + Phase 8 + Phase 9**: US4, US5, US6, US7 can all run in parallel once their dependencies are met
- **Phase 10 + Phase 11**: US8 and US9 can run in parallel
- Within each story: models marked [P] can be created in parallel; schemas marked [P] can be created in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all models in parallel:
Task: "Create Asset model in backend/app/models/asset.py" (T026)
Task: "Create InvestmentTransaction model in backend/app/models/investment_transaction.py" (T027)
Task: "Create AssetPrice model in backend/app/models/asset_price.py" (T028)

# Launch all schemas in parallel:
Task: "Create portfolio Pydantic schemas in backend/app/schemas/portfolio.py" (T030)
Task: "Create account Pydantic schemas in backend/app/schemas/account.py" (T031)

# Launch frontend queries in parallel:
Task: "Create portfolio query hooks in frontend/src/lib/queries/portfolio.ts" (T038)
Task: "Create account query hooks in frontend/src/lib/queries/accounts.ts" (T039)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (Portfolio Overview)
4. **STOP and VALIDATE**: KPI strip shows net worth, chart renders, positions list works
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 Portfolio + US2 Budget (parallel) → Two core tabs working
3. US3 Currency → Cross-cutting conversion working
4. US4-US7 (P2 stories, parallelizable) → Full feature set
5. US8 Theme + US9 Auth → Production readiness
6. Polish → Loading states, error handling, validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All frontend components MUST follow SPEC.md sections 3-7 and DESIGN.md for layout, surfaces, typography, and colors
- All backend models MUST follow data-model.md entity definitions
- All API endpoints MUST follow contracts/api.md request/response schemas
