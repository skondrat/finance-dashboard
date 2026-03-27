# API Contracts: Finance Dashboard

**Base URL**: `/api/v1`
**Auth**: JWT Bearer token in `Authorization` header (except `/auth/*`)
**Currency**: All monetary endpoints accept `?currency=EUR|USD` query param for display conversion
**Content-Type**: `application/json`

## Authentication

### POST /auth/register
Create a new user account.

**Request**:
```json
{ "email": "user@example.com", "password": "...", "display_name": "John" }
```

**Response** `201`:
```json
{ "id": "uuid", "email": "...", "display_name": "..." }
```
Sets `refresh_token` httpOnly cookie.

### POST /auth/login
**Request**:
```json
{ "email": "...", "password": "..." }
```

**Response** `200`:
```json
{ "access_token": "jwt...", "token_type": "bearer", "expires_in": 900 }
```
Sets `refresh_token` httpOnly cookie.

### POST /auth/refresh
Uses httpOnly `refresh_token` cookie. Returns new access + refresh tokens.

### POST /auth/logout
Clears refresh token cookie.

---

## User Preferences

### GET /user/me
Returns current user profile.

### PATCH /user/me
Update preferences (currency, theme, display_name).

**Request**:
```json
{ "preferred_currency": "USD", "theme": "dark" }
```

---

## Accounts

### GET /accounts
List all accounts for current user.

**Response** `200`:
```json
[{ "id": "uuid", "name": "IBKR", "type": "brokerage", "notes": null }]
```

### POST /accounts
Create account.

**Request**:
```json
{ "name": "Coinbase", "type": "crypto_exchange", "notes": "Main crypto" }
```

### PATCH /accounts/{id}
Update account name, type, or notes.

### DELETE /accounts/{id}
Delete account and all associated transactions.

---

## Investment Transactions

### GET /accounts/{account_id}/transactions
List investment transactions for an account. Supports `?asset_id=`, `?from=`, `?to=` filters.

**Response** `200`:
```json
[{
  "id": "uuid", "asset": { "id": "uuid", "ticker": "AAPL", "name": "Apple Inc." },
  "type": "buy", "quantity": "24.0", "price_per_unit": "104.55",
  "currency": "USD", "fees": "1.00", "date": "2025-06-15"
}]
```

### POST /accounts/{account_id}/transactions
Create buy/sell transaction.

**Request**:
```json
{
  "asset_ticker": "AAPL", "type": "buy", "quantity": "24",
  "price_per_unit": "104.55", "currency": "USD", "fees": "1.00",
  "date": "2025-06-15"
}
```

If the asset ticker doesn't exist, the system creates the Asset record (name, type, region, sector, industry populated from price provider metadata or left null for manual entry).

### PUT /accounts/{account_id}/transactions/{id}
Update transaction fields.

### DELETE /accounts/{account_id}/transactions/{id}
Delete a transaction. Recalculates positions.

---

## Portfolio

### GET /portfolio/positions
Aggregated positions across all accounts.
Supports `?account_id=` filter, `?currency=EUR|USD`.

**Response** `200`:
```json
[{
  "asset": { "id": "uuid", "ticker": "AAPL", "name": "Apple Inc.", "type": "stock" },
  "quantity": "24.0", "avg_cost_basis": "104.55", "total_cost": "2509.20",
  "current_price": "187.44", "current_value": "4498.56",
  "pnl_absolute": "1989.36", "pnl_percent": "79.28",
  "weight": "1.21", "currency": "USD"
}]
```

### GET /portfolio/summary
KPI strip data.
Supports `?currency=`, `?range=1D|1W|1M|YTD|1Y|MAX`.

**Response** `200`:
```json
{
  "net_worth": "371480.92", "total_return": "58470.81", "return_pct": "18.99",
  "saving_rate": "32.0", "investment_rate": "48.0", "invested_capital": "312985.07",
  "currency": "EUR"
}
```

### GET /portfolio/performance
Time-series data for the performance area chart.
Query: `?range=1D|1W|1M|YTD|1Y|MAX&currency=`

**Response** `200`:
```json
{
  "range": "1Y",
  "data_points": [
    { "date": "2025-03-25", "value": "340000.00" },
    { "date": "2025-03-26", "value": "341200.00" }
  ]
}
```

### GET /portfolio/allocation
Allocation breakdown for donut chart.
Query: `?group_by=type|positions|regions|sectors|industries&currency=`

**Response** `200`:
```json
{
  "group_by": "type", "total": "371480.92",
  "segments": [
    { "label": "Stock", "value": "280000.00", "percentage": "75.36" },
    { "label": "ETF", "value": "60000.00", "percentage": "16.15" },
    { "label": "Crypto", "value": "31480.92", "percentage": "8.47" }
  ]
}
```

### GET /portfolio/performance-breakdown
Detailed performance metrics for sidebar.
Query: `?currency=`

**Response** `200`:
```json
{
  "capital": "312985.07", "price_gain": "52470.81", "price_gain_pct": "16.76",
  "dividends": "8200.00", "dividends_pct": "2.62",
  "realized_losses": "-1200.00", "realized_losses_pct": "-0.38",
  "transaction_costs": "-1000.00",
  "total_return": "58470.81", "total_return_pct": "18.68",
  "irr": "15.42", "twr": "18.99"
}
```

### POST /portfolio/refresh-prices
Trigger on-demand price refresh for all held assets.

**Response** `202`:
```json
{ "status": "refreshing", "asset_count": 12 }
```

---

## Budget Transactions

### GET /budget/transactions
List budget transactions. Supports `?category_id=`, `?from=`, `?to=`, `?page=`, `?per_page=`.

### POST /budget/transactions
Manually create a budget transaction.

**Request**:
```json
{
  "date": "2026-03-01", "description": "Rent", "amount": "-1200.00",
  "currency": "EUR", "category_id": "uuid", "is_investment": false
}
```

### PATCH /budget/transactions/{id}
Update category, description, or is_investment flag.

### DELETE /budget/transactions/{id}

---

## Statement Import

### POST /budget/import/upload
Upload a bank statement file. Returns import ID for polling.

**Request**: `multipart/form-data` with `file` and optional `bank_profile_id`.

**Response** `202`:
```json
{ "import_id": "uuid", "status": "parsing" }
```

### GET /budget/import/{import_id}
Poll import status. When `status=preview`, includes parsed rows.

**Response** `200`:
```json
{
  "id": "uuid", "status": "preview", "filename": "ing_march.csv",
  "row_count": 45, "duplicate_count": 3,
  "rows": [
    { "date": "2026-03-01", "description": "LIDL", "amount": "-42.50",
      "reference": "NL42...", "suggested_category": "Food & Groceries" }
  ]
}
```

### POST /budget/import/{import_id}/confirm
Confirm import — writes transactions to BudgetTransaction table.

### POST /budget/import/{import_id}/discard
Discard import.

---

## Categories

### GET /budget/categories
List all categories for current user (excluding archived unless `?include_archived=true`).

### POST /budget/categories
Create category.

**Request**:
```json
{ "name": "Gym", "color": "#4c4546", "monthly_budget": "50.00" }
```

### PATCH /budget/categories/{id}
Update name, color, monthly_budget, is_archived.

### POST /budget/categories/{id}/merge
Merge this category into another.

**Request**:
```json
{ "target_category_id": "uuid" }
```

---

## Auto-Categorization Rules

### GET /budget/categories/{category_id}/rules
### POST /budget/categories/{category_id}/rules
**Request**: `{ "keyword": "LIDL" }`
### DELETE /budget/categories/{category_id}/rules/{rule_id}

### POST /budget/rules/apply
Re-apply all rules retroactively to uncategorized transactions.

---

## Bank Profiles

### GET /budget/bank-profiles
### POST /budget/bank-profiles
**Request**:
```json
{
  "name": "ING DiBa CSV", "delimiter": ";",
  "date_column": "Buchung", "amount_column": "Betrag",
  "description_column": "Verwendungszweck", "reference_column": "Referenz",
  "date_format": "%d.%m.%Y", "encoding": "iso-8859-1", "skip_rows": 1
}
```
### PATCH /budget/bank-profiles/{id}
### DELETE /budget/bank-profiles/{id}

---

## Income Sources

### GET /budget/income?year=2026&month=3
### POST /budget/income
**Request**: `{ "label": "Salary", "amount": "4500.00", "currency": "EUR", "month": 3, "year": 2026 }`
### PATCH /budget/income/{id}
### DELETE /budget/income/{id}

---

## Budget Analytics

### GET /budget/summary
KPI strip data for budget tab.
Query: `?period=monthly|ytd|yearly|custom&month=3&year=2026&from=&to=&currency=`

**Response** `200`:
```json
{
  "income": "4500.00", "spend": "3060.00", "savings": "1440.00",
  "saving_rate": "32.0", "investment_rate": "48.0",
  "budget_remaining": "940.00", "currency": "EUR"
}
```

### GET /budget/spend-by-category
Category breakdown table data.
Query: `?period=monthly|ytd|yearly|custom&month=&year=&from=&to=&currency=`

**Response** `200`:
```json
[{
  "category": { "id": "uuid", "name": "Food & Groceries", "color": "#4c4546" },
  "budget": "400.00", "spent": "362.50", "remaining": "37.50",
  "pct_of_total": "11.84", "sparkline": [320, 380, 400, 350, 362, 390]
}]
```

### GET /budget/charts/income-vs-spend
Monthly grouped bar chart data. Query: `?months=12&currency=`

### GET /budget/charts/savings-over-time
Monthly area chart data. Query: `?months=12&currency=`

### GET /budget/charts/investment-rate-trend
Monthly line chart data. Query: `?months=12`

### GET /budget/charts/category-distribution
Pie/donut chart data for selected period. Query: `?period=...&currency=`

---

## Cashflow

### GET /cashflow/sankey
Sankey diagram data for last month.
Query: `?currency=`

**Response** `200`:
```json
{
  "month": "2026-02",
  "nodes": [
    { "id": "salary", "label": "Salary", "type": "income" },
    { "id": "food", "label": "Food & Groceries", "type": "expense" },
    { "id": "savings", "label": "Savings", "type": "saving" },
    { "id": "investments", "label": "Investments", "type": "investment" }
  ],
  "links": [
    { "source": "salary", "target": "food", "value": "362.50" },
    { "source": "salary", "target": "savings", "value": "1440.00" },
    { "source": "salary", "target": "investments", "value": "2160.00" }
  ]
}
```

---

## Exchange Rates

### GET /exchange-rates/latest
Current EUR/USD rate.

### GET /exchange-rates?from=2025-01-01&to=2026-03-25
Historical rates for a date range.

---

## Common Patterns

### Error Response
```json
{ "detail": "Human-readable error message" }
```
Status codes: 400 (validation), 401 (unauthorized), 403 (forbidden), 404 (not found), 422 (unprocessable).

### Pagination
Endpoints returning lists support `?page=1&per_page=50`. Response includes:
```json
{ "items": [...], "total": 150, "page": 1, "per_page": 50, "pages": 3 }
```

### Currency Parameter
`?currency=EUR|USD` — when provided, all monetary values in the response are converted to the requested currency using date-appropriate exchange rates. Omitting defaults to the user's preferred currency.
