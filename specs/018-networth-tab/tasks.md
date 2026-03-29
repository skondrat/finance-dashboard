# Tasks: Networth Tab

**Input**: Design documents from `/specs/018-networth-tab/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/networth-api.md

**Tests**: Not explicitly requested — test tasks omitted. Browser testing via Playwright MCP after implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: No project-level setup needed — existing project structure is already in place.

*(No tasks — project already initialized with backend/frontend structure)*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend model, migration, schemas, and API endpoints that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T001 Create NetworthAccount SQLAlchemy model in `backend/app/models/networth_account.py` — fields: id (String(36) PK, UUID default), user_id (FK→users.id, CASCADE, indexed), name (String(100)), balance (Numeric(18,8), default 0), currency (String(3), default "EUR"), account_type (String(20), default "bank"), created_at (DateTime), updated_at (DateTime with onupdate). Add relationship to User model in `backend/app/models/user.py`.
- [x] T002 Create Alembic migration for networth_accounts table — run `alembic revision --autogenerate -m "add_networth_accounts"` from `backend/`, then verify the generated migration creates the table with the user_id index.
- [x] T003 [P] Create Pydantic schemas in `backend/app/schemas/networth.py` — NetworthAccountCreate (name required, balance/currency/account_type optional with defaults), NetworthAccountUpdate (all optional), NetworthAccountResponse (all fields), NetworthSummaryAccount (id, name, balance, original_currency, converted_balance, percentage, source, account_type, conversion_available), NetworthSummaryResponse (total_networth, manual_total, investment_total, currency, accounts list). Use FloatDecimal from `backend/app/schemas/common.py` for all Decimal fields.
- [x] T004 Create API router in `backend/app/api/networth.py` — implement 5 endpoints per contract: GET /api/v1/networth/accounts (list), POST /api/v1/networth/accounts (create, 201), PATCH /api/v1/networth/accounts/{account_id} (update), DELETE /api/v1/networth/accounts/{account_id} (204), GET /api/v1/networth/summary?currency=EUR (combines manual accounts with per-portfolio-account investment totals using portfolio_service and fx_service for currency conversion). Import and register the router in `backend/app/main.py`.

**Checkpoint**: Backend API fully functional — can be tested with curl/httpie

---

## Phase 3: User Story 1 — View Total Net Worth at a Glance (Priority: P1) 🎯 MVP

**Goal**: User opens the Networth tab and sees their total net worth combining manual accounts and investments

**Independent Test**: Navigate to /networth tab, verify total net worth figure is displayed (even if zero with empty state)

### Implementation for User Story 1

- [x] T005 [US1] Add NETWORTH tab to navigation in `frontend/src/components/layout/top-bar.tsx` — add `{ label: "NETWORTH", href: "/networth" }` to the tabs array after CASHFLOW.
- [x] T006 [US1] Create TanStack Query hooks in `frontend/src/lib/queries/networth.ts` — useNetworthAccounts() for GET /networth/accounts, useNetworthSummary() for GET /networth/summary (include currency from useCurrencyStore in queryKey and params), useCreateNetworthAccount() mutation (invalidate ["networth"]), useUpdateNetworthAccount() mutation (invalidate ["networth"]), useDeleteNetworthAccount() mutation (invalidate ["networth"]). Follow existing patterns from `frontend/src/lib/queries/portfolio.ts`.
- [x] T007 [P] [US1] Create summary KPI component in `frontend/src/components/networth/summary-kpi.tsx` — display total net worth as large formatted number (use formatCurrency from utils.ts), show manual vs investment subtotals below. Use existing KPI strip styling pattern from `frontend/src/components/portfolio/kpi-strip.tsx`. Support loading skeleton state.
- [x] T008 [US1] Create Networth page in `frontend/src/app/(dashboard)/networth/page.tsx` — "use client" component with grid layout matching existing pages (grid-cols-12). Render SummaryKpi at top. Show empty state (use EmptyState from `frontend/src/components/ui/empty-state.tsx`) when no manual accounts and no investments, with prompt to add accounts. Wire up useNetworthSummary() hook.

**Checkpoint**: User can navigate to Networth tab and see total net worth (or empty state). Story 1 independently testable.

---

## Phase 4: User Story 2 — Manage Manual Accounts (Priority: P1)

**Goal**: User can add, edit, and delete manual accounts (bank, crypto, cash) from the Networth tab

**Independent Test**: Click "Add Account", fill in name/balance/currency, submit — verify account appears. Edit and delete it.

### Implementation for User Story 2

- [x] T009 [US2] Create add-account-modal component in `frontend/src/components/networth/add-account-modal.tsx` — modal/form with fields: name (text input, required), balance (number input, default 0), currency (select with EUR/USD options matching existing currency toggle), account_type (select with options: bank, crypto, cash). Support both create and edit modes (pass optional existing account to pre-fill). Use react-hook-form for form handling. On submit, call useCreateNetworthAccount or useUpdateNetworthAccount mutation. Style consistent with `frontend/src/components/portfolio/add-account-modal.tsx`.
- [x] T010 [US2] Add account management UI to the Networth page in `frontend/src/app/(dashboard)/networth/page.tsx` — add "Add Account" button (top-right area, matching existing button patterns). Wire up AddAccountModal with open/close state. Add edit/delete action buttons per account row (edit opens modal in edit mode, delete calls useDeleteNetworthAccount with confirmation).

**Checkpoint**: Full CRUD for manual accounts working. Story 2 independently testable.

---

## Phase 5: User Story 3 — View Breakdown Table (Priority: P2)

**Goal**: User sees a table with each manual account and each portfolio account as separate rows, showing name, balance, and percentage of total

**Independent Test**: Add multiple manual accounts, verify each appears as a row. If portfolio accounts exist, verify they also appear. Percentages should sum to 100%.

### Implementation for User Story 3

- [x] T011 [US3] Create accounts-table component in `frontend/src/components/networth/accounts-table.tsx` — grid-based table (matching existing pattern from `frontend/src/components/budget/category-table.tsx`). Columns: Account Name, Type/Source, Balance (in display currency), % of Total. Render rows from useNetworthSummary().accounts — both manual (source="manual") and investment (source="investment") rows. Group or visually distinguish manual vs investment rows (e.g., section headers or subtle background difference). Show account_type for manual, "Investment" label for portfolio accounts. Show warning icon when conversion_available is false. Support loading skeleton state.
- [x] T012 [US3] Integrate accounts-table into the Networth page in `frontend/src/app/(dashboard)/networth/page.tsx` — render AccountsTable below the SummaryKpi component in the main content area. Pass the summary data from useNetworthSummary().

**Checkpoint**: Full breakdown table visible with manual + investment accounts. Story 3 independently testable.

---

## Phase 6: User Story 4 — Update Account Balances Quickly (Priority: P2)

**Goal**: User can click on a manual account's balance in the table and edit it inline without opening a modal

**Independent Test**: Click on a balance value in the table, type a new number, press Enter — verify the total net worth updates immediately.

### Implementation for User Story 4

- [x] T013 [US4] Add inline balance editing to accounts-table in `frontend/src/components/networth/accounts-table.tsx` — for manual account rows only (not investment rows), make the balance cell clickable. On click, replace with a number input (pre-filled with current balance). On Enter or onBlur, call useUpdateNetworthAccount mutation with the new balance. On Escape, cancel edit. Show loading state during save. Follow inline editing pattern from `frontend/src/components/budget/income-manager.tsx`.

**Checkpoint**: Quick balance updates working. Story 4 independently testable.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Visual consistency and edge case handling

- [x] T014 Ensure dark mode compatibility in all networth components — verify all colors use theme tokens (bg-surface, text-on-surface, etc.) and no hardcoded colors. Check against existing dark mode patterns in `frontend/src/components/portfolio/` and `frontend/src/components/budget/`.
- [x] T015 Handle edge cases in the summary endpoint `backend/app/api/networth.py` — negative balances subtract from total correctly, zero-division safe for percentage calculation, missing FX rates set conversion_available=false and use unconverted balance with a flag.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No tasks needed
- **Foundational (Phase 2)**: BLOCKS all user stories — backend model/migration/schemas/API must be complete first
- **US1 (Phase 3)**: Depends on Phase 2 — creates the page and navigation
- **US2 (Phase 4)**: Depends on Phase 2 + T005 (navigation) — adds account management
- **US3 (Phase 5)**: Depends on Phase 2 + T006 (hooks) + T008 (page) — adds breakdown table
- **US4 (Phase 6)**: Depends on T011 (accounts-table) — adds inline editing to existing table
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2 — no dependency on other stories
- **US2 (P1)**: Starts after Phase 2 — can run in parallel with US1 but needs T005 (nav tab)
- **US3 (P2)**: Needs T008 (page) from US1 to integrate into
- **US4 (P2)**: Needs T011 (accounts-table) from US3 to add inline editing to

### Within Each User Story

- Models → Schemas → API (backend, sequential)
- Hooks → Components → Page integration (frontend, sequential)
- Backend before frontend (API must exist for hooks to call)

### Parallel Opportunities

- T003 (schemas) can run in parallel with T001+T002 (model + migration)
- T007 (summary-kpi) can run in parallel with T006 (hooks) — different files
- After Phase 2, US1 and US2 can largely proceed in parallel

---

## Parallel Example: Phase 2 (Foundational)

```
# Sequential: model → migration (migration depends on model)
Task T001: Create NetworthAccount model
Task T002: Create Alembic migration

# Parallel with T001+T002: schemas are independent
Task T003: Create Pydantic schemas

# Sequential after T001+T003: API uses both model and schemas
Task T004: Create API router and register
```

## Parallel Example: User Story 1

```
# After T006 (hooks), these can run in parallel:
Task T007: Create summary-kpi component
Task T008: Create Networth page (can start layout while T007 is in progress)
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 2: Foundational (backend model, migration, schemas, API)
2. Complete Phase 3: US1 (navigation, page, summary display)
3. Complete Phase 4: US2 (add/edit/delete accounts)
4. **STOP and VALIDATE**: Test with Playwright MCP — add accounts, verify total
5. Deploy/demo if ready — users can see net worth and manage accounts

### Incremental Delivery

1. Phase 2 → Backend ready
2. US1 → Tab visible, total displayed (MVP!)
3. US2 → Account management (full MVP)
4. US3 → Breakdown table with percentages and investment accounts
5. US4 → Inline editing for quick updates
6. Polish → Dark mode, edge cases

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Backend API (Phase 2) must be complete before any frontend work
- The summary endpoint handles both manual accounts AND investment portfolio data server-side
- Reuse existing patterns: grid tables, KPI strips, modal forms, inline editing, query hooks
- All currency conversion happens server-side via fx_service
