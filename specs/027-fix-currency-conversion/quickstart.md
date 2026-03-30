# Quickstart: Fix Currency Conversion

**Feature**: 027-fix-currency-conversion

## Prerequisites

- Backend running at `http://localhost:8000`
- Frontend running at `http://localhost:3000`
- Exchange rates table exists (migration `d7baca819772`)

## Verification Steps

1. Navigate to `http://localhost:3000/portfolio` in EUR mode
2. Note the Net Worth value (e.g., €361,000)
3. Click the "USD" toggle button
4. Verify Net Worth changes to a different number (e.g., ~$390,000 at 1.08 rate)
5. Verify all position values, P/L amounts, and KPIs change proportionally
6. Verify percentages (Return %, Weight, P/L %) remain unchanged
7. Toggle back to EUR — values should return to original amounts
8. Check the exchange_rates table has a cached rate for today's date
