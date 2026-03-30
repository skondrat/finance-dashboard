# API Contract: Portfolio Price Refresh

**Feature**: 025-fix-portfolio-prices

## Existing Endpoint (no changes)

### POST /api/v1/portfolio/refresh-prices

Triggers price refresh for all held assets.

**Request**: No body required.
**Auth**: Bearer token required.
**Response**: `202 Accepted`

```json
{
  "status": "accepted",
  "asset_count": 4
}
```

## New Frontend Hook

### useRefreshPrices()

TanStack Query mutation that calls `POST /portfolio/refresh-prices` and invalidates all portfolio queries on success.

**Invalidated query keys on success**:
- `["portfolio", "summary", currency]`
- `["portfolio", "positions", currency, ...]`
- `["portfolio", "performance", ...]`
- `["portfolio", "allocation", ...]`
- `["portfolio", "performance-breakdown", ...]`
