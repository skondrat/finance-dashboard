# API Contract: Networth

**Branch**: `018-networth-tab` | **Date**: 2026-03-29
**Base path**: `/api/v1/networth`

## Endpoints

### List Networth Accounts

```
GET /api/v1/networth/accounts
```

**Query Parameters**: None

**Response** `200 OK`:
```json
[
  {
    "id": "uuid-string",
    "name": "Wise",
    "balance": 5000.00,
    "currency": "EUR",
    "account_type": "bank",
    "created_at": "2026-03-29T10:00:00",
    "updated_at": "2026-03-29T10:00:00"
  }
]
```

---

### Create Networth Account

```
POST /api/v1/networth/accounts
```

**Request Body**:
```json
{
  "name": "Wise",
  "balance": 5000.00,
  "currency": "EUR",
  "account_type": "bank"
}
```

| Field | Required | Default |
|-------|----------|---------|
| name | yes | — |
| balance | no | 0 |
| currency | no | "EUR" |
| account_type | no | "bank" |

**Response** `201 Created`:
```json
{
  "id": "uuid-string",
  "name": "Wise",
  "balance": 5000.00,
  "currency": "EUR",
  "account_type": "bank",
  "created_at": "2026-03-29T10:00:00",
  "updated_at": "2026-03-29T10:00:00"
}
```

---

### Update Networth Account

```
PATCH /api/v1/networth/accounts/{account_id}
```

**Request Body** (all fields optional):
```json
{
  "name": "Wise EUR",
  "balance": 6000.00,
  "currency": "EUR",
  "account_type": "bank"
}
```

**Response** `200 OK`: Full account object (same schema as create response)

**Error** `404 Not Found`: Account does not exist or belongs to another user

---

### Delete Networth Account

```
DELETE /api/v1/networth/accounts/{account_id}
```

**Response** `204 No Content`

**Error** `404 Not Found`: Account does not exist or belongs to another user

---

### Get Networth Summary

```
GET /api/v1/networth/summary
```

**Query Parameters**:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| currency | string | "EUR" | Display currency for converted values |

**Response** `200 OK`:
```json
{
  "total_networth": 85000.00,
  "manual_total": 35000.00,
  "investment_total": 50000.00,
  "currency": "EUR",
  "accounts": [
    {
      "id": "uuid-string",
      "name": "Wise",
      "balance": 5000.00,
      "original_currency": "EUR",
      "converted_balance": 5000.00,
      "percentage": 5.88,
      "source": "manual",
      "account_type": "bank",
      "conversion_available": true
    },
    {
      "id": "portfolio-account-uuid",
      "name": "Interactive Brokers",
      "balance": 30000.00,
      "original_currency": "EUR",
      "converted_balance": 30000.00,
      "percentage": 35.29,
      "source": "investment",
      "account_type": null,
      "conversion_available": true
    }
  ]
}
```

**Fields**:
- `total_networth`: Sum of all converted balances (manual + investment)
- `manual_total`: Sum of manual account converted balances only
- `investment_total`: Sum of investment account values only
- `accounts[]`: Unified list of all accounts (manual + investment)
  - `source`: "manual" or "investment" — distinguishes account origin
  - `converted_balance`: Balance in the requested display currency
  - `percentage`: This account's share of total net worth
  - `conversion_available`: false if FX rate was unavailable (balance shown unconverted)

## Authentication

All endpoints require Bearer token authentication (same as existing endpoints). User ID extracted from JWT — users can only access their own accounts.

## Error Responses

Standard error format used by all existing endpoints:
```json
{
  "detail": "Error message"
}
```
