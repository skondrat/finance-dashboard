# Tasks: Convert Budget Amounts Across Currencies

**Input**: Design documents from `/specs/038-budget-currency-convert/`
**Prerequisites**: plan.md, spec.md, research.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Foundational — Currency Conversion Helper

**Purpose**: Create a reusable conversion helper in budget_service that all endpoints can use.

- [x] T001 Add a `_convert_amount` helper function to `backend/app/services/budget_service.py` that takes (db, amount, from_currency, to_currency, txn_date) and returns the converted Decimal using `fx_service.get_rate()` and `fx_service.convert()`. Return amount unchanged if from == to. Use rate=1 fallback if no rate found.

**Checkpoint**: Helper ready for use by all story tasks.

---

## Phase 2: User Story 1 — Monthly Income KPI aggregates all income converted (Priority: P1) 🎯 MVP

**Goal**: Monthly Income KPI shows total income from ALL currencies, converted to display currency.

**Independent Test**: Import USD + EUR statements, view in EUR mode, verify Monthly Income includes both converted to EUR.

- [x] T002 [US1] Modify `_income_for_period()` in `backend/app/services/budget_service.py` to remove the `IncomeSource.currency == currency` filter. Instead, query all income sources for the period, convert each to the display currency using `_convert_amount`, and return the sum.

**Checkpoint**: KPI strip Monthly Income shows cross-currency total.

---

## Phase 3: User Story 2 — Income Sources sidebar shows all sources converted (Priority: P1)

**Goal**: Income Sources sidebar displays ALL income sources with amounts converted to display currency.

**Independent Test**: View EUR mode, verify USD Gainsight salary appears with EUR-converted amount.

- [x] T003 [US2] Modify `list_income_sources()` in `backend/app/api/income.py` to remove the currency filter. Instead, accept `currency` as the display currency, fetch all income sources, and convert each amount to the display currency using `_convert_amount` before returning.

**Checkpoint**: Sidebar shows all income sources in display currency.

---

## Phase 4: User Story 3 — Spend, Savings, and Category totals reflect cross-currency (Priority: P2)

**Goal**: Monthly Spend, Savings, Saving Rate, Spend by Category, and transaction list all include cross-currency converted amounts.

**Independent Test**: Import EUR + USD statements with spending, verify EUR view includes converted USD spend in totals and transaction list.

- [x] T004 [US3] Modify `_spend_for_period()` in `backend/app/services/budget_service.py` to remove the `BudgetTransaction.currency == currency` filter. Query all spending transactions, convert each to display currency, and return the sum.
- [x] T005 [US3] Modify `_investment_spend_for_period()` in `backend/app/services/budget_service.py` similarly — remove currency filter, convert all investment transactions to display currency.
- [x] T006 [US3] Modify `get_spend_by_category()` in `backend/app/services/budget_service.py` to remove the currency filter from the spend query. Fetch individual transactions (not aggregated), convert each amount, then aggregate by category in Python.
- [x] T007 [US3] Modify `list_transactions()` in `backend/app/api/budget.py` to remove the currency filter. Fetch all transactions, convert each amount to display currency using `_convert_amount`, and return with converted amounts.

**Checkpoint**: All budget views show cross-currency converted data.

---

## Phase 5: Polish & Verification

- [x] T008 Manual browser test: import USD + EUR statements, verify EUR view shows all data converted, USD view shows all data converted, totals match expectations.

---

## Dependencies & Execution Order

- **Phase 1 (T001)**: No dependencies — foundational helper
- **Phase 2 (T002)**: Depends on T001
- **Phase 3 (T003)**: Depends on T001, independent of T002
- **Phase 4 (T004–T007)**: Depends on T001, independent of T002/T003
- **Phase 5 (T008)**: Depends on all previous phases

### Implementation Strategy

1. T001 (helper) → T002 (income KPI) → browser test income → **MVP done**
2. T003 (sidebar) → T004–T007 (spend/categories/transactions)
3. T008 (full verification)

---

## Notes

- The `_convert_amount` helper should cache rates per (from, to, date) tuple within a request to avoid repeated DB lookups
- `fx_service.get_rate()` already falls back to nearest earlier date if exact date missing
- No frontend changes needed — backend returns converted amounts, frontend formats with display currency symbol
