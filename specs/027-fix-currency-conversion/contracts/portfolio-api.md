# API Contract: Portfolio with Currency Conversion

**Feature**: 027-fix-currency-conversion

## Existing Endpoints (behavior change, not signature change)

All portfolio endpoints already accept `?currency=EUR|USD`. After this feature, the `currency` parameter will actually convert values instead of just labeling them.

### GET /api/v1/portfolio/positions?currency=USD

**Before**: Returns raw prices with `"currency": "USD"` label but EUR-denominated numbers.
**After**: Returns all monetary values converted to USD using today's exchange rate.

Affected fields: `current_price`, `current_value`, `avg_cost_basis`, `total_cost`, `pnl_absolute`
Unaffected fields: `pnl_percent`, `weight`, `quantity`

### GET /api/v1/portfolio/summary?currency=USD

Affected: `net_worth`, `total_return`, `invested_capital`
Unaffected: `return_pct`, `saving_rate`, `investment_rate`

### GET /api/v1/portfolio/allocation?currency=USD

Affected: `total`, segment `value`
Unaffected: segment `percentage`

### GET /api/v1/portfolio/performance-breakdown?currency=USD

Affected: `capital`, `price_gain`, `dividends`, `realized_losses`, `transaction_costs`, `total_return`
Unaffected: `price_gain_pct`, `dividends_pct`, `realized_losses_pct`, `total_return_pct`, `irr`, `twr`
