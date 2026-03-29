# API Contract: Networth Snapshot History

**Feature**: 022-networth-history | **Date**: 2026-03-29

## GET /api/v1/networth/history

Returns all monthly net worth snapshots for the authenticated user.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| currency | string | "EUR" | Display currency filter (returns only snapshots in this currency) |

### Response 200

```json
{
  "snapshots": [
    {
      "snapshot_month": "2026-01",
      "total_networth": 45000.00,
      "currency": "EUR",
      "breakdown": [
        {
          "name": "Chase Checking",
          "balance": 5000.00,
          "source": "manual",
          "account_type": "bank"
        },
        {
          "name": "Fidelity Investments",
          "balance": 40000.00,
          "source": "investment",
          "account_type": null
        }
      ],
      "updated_at": "2026-01-15T10:30:00Z"
    },
    {
      "snapshot_month": "2026-02",
      "total_networth": 47500.00,
      "currency": "EUR",
      "breakdown": [...],
      "updated_at": "2026-02-20T14:00:00Z"
    }
  ]
}
```

### Response Schema

**NetworthSnapshotResponse**:
| Field | Type | Description |
|-------|------|-------------|
| snapshot_month | string | "YYYY-MM" format |
| total_networth | number | Total net worth value |
| currency | string | ISO 4217 currency code |
| breakdown | array | Per-account breakdown (nullable) |
| updated_at | datetime | Last update time for this snapshot |

**NetworthHistoryResponse**:
| Field | Type | Description |
|-------|------|-------------|
| snapshots | array[NetworthSnapshotResponse] | Ordered by snapshot_month ascending |

## Side-Effect: Snapshot Capture

Triggered automatically on these existing endpoints (no new request required):

- `POST /api/v1/networth/accounts` — after account creation
- `PATCH /api/v1/networth/accounts/{id}` — after balance update
- `DELETE /api/v1/networth/accounts/{id}` — after account deletion

Each trigger computes the current total net worth using the same logic as `GET /api/v1/networth/summary` and upserts the snapshot for the current month.
