# API Contracts: Networth Manual Import & Composition

**Date**: 2026-03-30 | **Branch**: `032-networth-manual-donut`

## New Endpoints

### POST `/api/v1/networth/snapshots`

Create a manual networth snapshot for a specific month.

**Request Body:**
```json
{
  "snapshot_month": "2025-06",
  "total_networth": 45000.00,
  "currency": "EUR"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `snapshot_month` | string | Yes | Format "YYYY-MM", must not be in the future |
| `total_networth` | number | Yes | Any numeric value (zero and negative allowed) |
| `currency` | string | No | ISO 4217, defaults to user's display currency |

**Response 201:**
```json
{
  "id": "uuid",
  "snapshot_month": "2025-06",
  "total_networth": 45000.00,
  "currency": "EUR",
  "source": "manual",
  "created_at": "2026-03-30T12:00:00Z"
}
```

**Response 409 (Conflict):**
```json
{
  "detail": "A snapshot already exists for 2025-06"
}
```

**Response 422 (Validation):**
```json
{
  "detail": "snapshot_month must not be in the future"
}
```

---

### DELETE `/api/v1/networth/snapshots/manual`

Delete all manually imported networth snapshots for the current user.

**Request Body:** None

**Response 200:**
```json
{
  "deleted_count": 5
}
```

**Response 200 (no manual entries):**
```json
{
  "deleted_count": 0
}
```

---

### GET `/api/v1/networth/composition`

Get networth composition breakdown for the donut chart.

**Query Parameters:**

| Param | Type | Required | Values | Default |
|-------|------|----------|--------|---------|
| `group_by` | string | No | "account", "type" | "account" |
| `currency` | string | No | ISO 4217 code | User's display currency |

**Response 200:**
```json
{
  "group_by": "account",
  "total": 125000.00,
  "currency": "EUR",
  "segments": [
    {
      "label": "Interactive Brokers",
      "value": 75000.00,
      "percentage": 60.0
    },
    {
      "label": "Bank of America",
      "value": 30000.00,
      "percentage": 24.0
    },
    {
      "label": "Coinbase",
      "value": 20000.00,
      "percentage": 16.0
    }
  ]
}
```

**Response 200 (group_by=type):**
```json
{
  "group_by": "type",
  "total": 125000.00,
  "currency": "EUR",
  "segments": [
    {
      "label": "ETF",
      "value": 55000.00,
      "percentage": 44.0
    },
    {
      "label": "Bank",
      "value": 30000.00,
      "percentage": 24.0
    },
    {
      "label": "Crypto",
      "value": 20000.00,
      "percentage": 16.0
    },
    {
      "label": "Cash",
      "value": 15000.00,
      "percentage": 12.0
    },
    {
      "label": "Other",
      "value": 5000.00,
      "percentage": 4.0
    }
  ]
}
```

## Modified Endpoints

### GET `/api/v1/networth/history`

**No changes to request/response schema.** Existing endpoint already returns all snapshots. Manual snapshots will appear naturally in the response since they use the same `networth_snapshots` table.

Optional enhancement: Include `source` field in each history entry so the frontend can visually distinguish manual vs auto data points.

**Enhanced response entry:**
```json
{
  "month": "2025-06",
  "value": 45000.00,
  "source": "manual"
}
```
