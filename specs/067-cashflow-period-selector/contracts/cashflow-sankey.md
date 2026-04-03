# API Contract: GET /api/v1/cashflow/sankey

## Request

### Query Parameters

| Parameter  | Type   | Required | Default   | Description |
|-----------|--------|----------|-----------|-------------|
| currency  | string | No       | "EUR"     | Target currency for conversion |
| period    | string | No       | "monthly" | One of: "monthly", "yearly", "ytd" |
| year      | int    | No       | auto      | Year to query. Defaults to last completed month's year |
| month     | int    | No       | auto      | Month to query (1-12). Only used when period=monthly. Defaults to last completed month |

### Period Behavior

- **monthly**: Returns data for a single month (year + month required). Same as current behavior.
- **yearly**: Returns data aggregated across all 12 months of the given year. Month parameter ignored.
- **ytd**: Returns data from January through the last completed month of the given year. If year is a past year, behaves like yearly. Month parameter ignored.

## Response

No changes to response shape — same `CashflowSankeyData` structure:

```json
{
  "month": "2026-01 to 2026-03",  // label changes to reflect range for yearly/ytd
  "total_income": 15000.00,
  "total_spend": 8500.00,
  "total_savings": 4000.00,
  "total_investments": 2500.00,
  "nodes": [...],
  "links": [...]
}
```

The `month` field becomes a period label:
- monthly: `"2026-03"` (unchanged)
- yearly: `"2026"`
- ytd: `"2026 YTD"`
