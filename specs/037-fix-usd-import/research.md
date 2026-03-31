# Research: Fix USD Import Currency Conversion

## Root Cause Analysis

### The Bug

When a user switches to EUR display mode, the frontend sends `GET /api/v1/budget/transactions?currency=EUR`. The backend ignores the `currency` parameter and returns ALL transactions (both EUR and USD). The frontend then formats raw USD amounts with a EUR symbol.

### Endpoint Comparison

| Endpoint | Accepts `currency`? | Filters by it? | Status |
|----------|---------------------|----------------|--------|
| `/budget/summary` | Yes | Yes (`BudgetTransaction.currency == currency`) | Correct |
| `/budget/spend-by-category` | Yes | Yes (`BudgetTransaction.currency == currency`) | Correct |
| `/budget/transactions` | **No** | **No** | **BUG** |

### Decision: Filter-only approach (not conversion)

- **Decision**: Add a `currency` filter parameter to the transactions endpoint, matching the existing pattern in summary and spend-by-category.
- **Rationale**: The summary and spend-by-category endpoints already use a filter-by-currency approach (not cross-currency conversion). This is consistent and sufficient — when viewing in EUR mode, only EUR transactions are shown; when viewing in USD mode, only USD transactions are shown.
- **Alternatives considered**:
  - Cross-currency conversion (convert USD→EUR using exchange rates): More complex, requires per-transaction rate lookups. Not how the other endpoints work. Could be a future enhancement.
  - Return all transactions with a `converted_amount` field: Would require schema changes. Over-engineered for current needs.

### Fix Location

**File**: `backend/app/api/budget.py`, function `list_transactions` (line 32)

Add `currency: Optional[str] = None` parameter and filter: `if currency: query = query.filter(BudgetTransaction.currency == currency)`
