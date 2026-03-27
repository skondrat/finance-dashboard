# Bug Fixes — 2026-03-25

## Summary

All bugs stem from a single root cause: **frontend/backend API contract mismatches**. The frontend was built against assumed response shapes that don't match the actual backend schemas. Additionally, one UI layout issue was found.

---

## 1. Portfolio Performance Chart Crash — `chartData.slice is not a function`

**Files:** `frontend/src/lib/queries/portfolio.ts`

**Symptom:** Portfolio page crashes immediately after login with `TypeError: chartData.slice is not a function`.

**Cause:** The backend `GET /portfolio/performance` returns `{ range: string, data_points: [] }` (a wrapped object), but the frontend query passed the entire response object directly to `<AreaChart data={data}>`, which expects an array.

**Fix:** Extract `.data_points` from the API response in the `usePerformanceChart` query hook.

---

## 2. Budget Spend-by-Category 500 Error (manifests as CORS error)

**Files:** `backend/app/services/budget_service.py`

**Symptom:** Budget page shows CORS errors in console. The `/budget/spend-by-category` endpoint returns HTTP 500.

**Cause:** The service returned flat dicts with `category_id`, `category_name`, `color` at the top level, but the Pydantic response schema `SpendByCategoryItem` expects a nested `category: CategoryResponse` object. FastAPI's response validation failed, producing a 500 that bypassed the CORS middleware (CORS headers are not added to unhandled exception responses).

**Fix:** Restructured the service output to nest category fields under a `category` key matching `CategoryResponse` schema (including the uncategorized fallback entry).

---

## 3. Budget KPI Strip Shows `€NaN`

**Files:** `frontend/src/lib/queries/budget.ts`, `frontend/src/components/budget/kpi-strip.tsx`

**Symptom:** Monthly Income, Monthly Spend, and Monthly Savings all display `€NaN`.

**Cause:** The backend returns fields named `income`, `spend`, `savings` but the frontend `BudgetSummary` interface and component referenced `monthly_income`, `monthly_spend`, `monthly_savings` — which are `undefined`, causing `NaN` when formatted.

**Fix:** Aligned the frontend TypeScript interface and component to use the correct field names (`income`, `spend`, `savings`).

---

## 4. Budget Category Table Uses Stale Flat Field Names

**Files:** `frontend/src/lib/queries/budget.ts`, `frontend/src/components/budget/category-table.tsx`

**Symptom:** After fix #2, the category table would fail to render because it still referenced the old flat structure.

**Cause:** The frontend `SpendByCategoryItem` type used flat `category_id` / `category_name` / `color` fields, but after fix #2 the backend returns a nested `category` object.

**Fix:** Updated the TypeScript interface and all component references to use `item.category.id`, `item.category.name`, `item.category.color`.

---

## 5. Transaction Creation Fails with 422 Validation Error

**Files:** `frontend/src/lib/queries/accounts.ts`, `frontend/src/components/portfolio/add-transaction-form.tsx`

**Symptom:** Clicking "Buy AAPL" shows `[object Object],[object Object],[object Object]` as an error message. The backend returns HTTP 422.

**Cause:** Two sub-issues:
1. The frontend sent `{ type, amount, currency, description, date }` but the backend `TransactionCreate` schema expects `{ asset_ticker, type, quantity, price_per_unit, currency, date }`. The form collected the right inputs (ticker, quantity, price) but collapsed them into a computed `amount` and `description` string before sending.
2. The error display rendered the raw 422 `detail` array (which contains validation error objects) via `Error.toString()`, producing `[object Object]`.

**Fix:** Updated `CreateTransactionPayload` to match the backend schema, changed the form submit to send individual fields, and improved `apiFetch` error parsing to handle both string and array `detail` formats.

---

## 6. Transactions View Crash — `description` is undefined

**Files:** `frontend/src/lib/queries/accounts.ts`, `frontend/src/components/portfolio/transactions-view.tsx`

**Symptom:** After successfully creating a transaction, the page crashes with `Cannot read properties of undefined (reading 'match')` in `getInitial()`.

**Cause:** The frontend `Transaction` interface expected `description` and `amount` fields, but the backend `TransactionResponse` returns `asset` (nested object with `ticker`, `name`), `quantity`, `price_per_unit`, etc. The `getInitial()` function called `.match()` on the undefined `description`.

**Fix:** Updated the `Transaction` interface to match the backend schema, and rewrote the view to display transaction info from `tx.asset.ticker`, `tx.quantity`, `tx.price_per_unit`.

---

## 7. Positions List Crash — `pl_percent` is undefined

**Files:** `frontend/src/lib/queries/portfolio.ts`, `frontend/src/components/portfolio/positions-list.tsx`

**Symptom:** Portfolio page crashes with `Cannot read properties of undefined (reading 'toFixed')` in `formatPercent()` when positions exist.

**Cause:** The frontend `Position` interface used `pl_absolute`, `pl_percent`, `ticker`, `asset_name`, `buy_in`, `value` but the backend returns `pnl_absolute`, `pnl_percent`, nested `asset` object, `avg_cost_basis`, `current_value`.

**Fix:** Updated the `Position` interface and all field references in the sorting logic and row rendering.

---

## 8. KPI Card Values Overflow Their Containers

**Files:** `frontend/src/components/portfolio/kpi-strip.tsx`

**Symptom:** Long currency values like `-€1,500.00` overflow the KPI card boundaries on the portfolio page.

**Cause:** Fixed font sizes (`text-4xl` / `text-2xl`) don't account for varying value lengths. The cards have no overflow handling.

**Fix:** Added dynamic font sizing that scales down for values longer than 9 characters, plus `overflow-hidden` and `truncate` as safety nets.
