# Research: Convert Budget Amounts Across Currencies

## Current Architecture

Both `BudgetTransaction` and `IncomeSource` models already have a `currency` field. The FX service (`fx_service.py`) provides:
- `get_rate(db, base, target, target_date)` → `Decimal | None` (falls back to nearest earlier date)
- `convert(amount, from_currency, to_currency, rate)` → `Decimal` (simple multiplication)

Exchange rates are cached in the `exchange_rates` table from the Frankfurter API.

## Changes Required

### 1. `_income_for_period()` in budget_service.py

**Current**: Filters `IncomeSource.currency == currency`, sums amounts.
**New**: Remove currency filter. Query all income. For each row where `currency != display_currency`, get rate and convert. Sum all converted amounts.

**Approach**: Use individual row queries instead of aggregate SUM, since conversion rates vary by date.

### 2. `_spend_for_period()` in budget_service.py

**Current**: Filters `BudgetTransaction.currency == currency`, sums absolute amounts.
**New**: Remove currency filter. Query all transactions. Group by currency, convert each group. Or iterate and convert per-transaction.

**Approach**: Query transactions grouped by (currency, date) to minimize rate lookups, or batch-convert. For simplicity, query all rows and convert individually — the volume per month is small (< 200 transactions).

### 3. `get_spend_by_category()` in budget_service.py

**Current**: Filters by currency in the aggregate query, groups by category_id.
**New**: Remove currency filter. Fetch all transactions, convert each amount, then aggregate by category.

### 4. `list_transactions` endpoint in budget.py

**Current**: Filters `BudgetTransaction.currency == currency`.
**New**: Remove currency filter. Return all transactions. The frontend already calls `formatCurrency(tx.amount, currency)` — but now the amount should be converted server-side before returning.

**Decision**: Add a `converted_amount` field to the response, or modify `amount` in-place before returning.
**Choice**: Modify amount in-place to the display currency. The frontend already formats with the selected currency symbol. Keep the response schema unchanged.

### 5. `list_income_sources` endpoint in income.py

**Current**: Filters `IncomeSource.currency == currency`.
**New**: Remove currency filter. Convert amounts to display currency before returning.

## Rate Lookup Strategy

- **Decision**: Use `fx_service.get_rate()` per unique (from_currency, to_currency, date) combination. Cache rates in a dict during request processing to avoid repeated DB lookups for same date+currency pairs.
- **Fallback**: If `get_rate()` returns None (no rate available), use rate = 1.0 (no conversion) and log a warning. This prevents errors when rate data is missing.

## Scope

- Only EUR ↔ USD conversion needed for now
- No frontend changes required — backend returns converted amounts, frontend displays them
