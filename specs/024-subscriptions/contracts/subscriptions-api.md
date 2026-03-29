# API Contract: Subscriptions

**Feature**: 024-subscriptions | **Date**: 2026-03-29

## CRUD Endpoints

### GET /api/v1/subscriptions

Returns all subscriptions for the authenticated user (active and cancelled).

**Response 200**:
```json
[
  {
    "id": "uuid",
    "name": "Netflix",
    "cadence": "monthly",
    "amount": 13.99,
    "currency": "EUR",
    "payment_day": 15,
    "payment_source": "monobank",
    "status": "active",
    "created_at": "2026-01-15T10:00:00Z",
    "updated_at": "2026-01-15T10:00:00Z"
  }
]
```

### POST /api/v1/subscriptions

Create a new subscription.

**Request**:
```json
{
  "name": "Spotify",
  "cadence": "monthly",
  "amount": 9.99,
  "currency": "EUR",
  "payment_day": 1,
  "payment_source": "monobank"
}
```

**Response 201**: Created subscription object.

### PATCH /api/v1/subscriptions/{id}

Update an existing subscription. All fields optional.

**Response 200**: Updated subscription object.

### PATCH /api/v1/subscriptions/{id}/cancel

Mark subscription as cancelled (soft-delete).

**Response 200**: Updated subscription with `status: "cancelled"`.

### PATCH /api/v1/subscriptions/{id}/reactivate

Reactivate a cancelled subscription.

**Response 200**: Updated subscription with `status: "active"`.

### DELETE /api/v1/subscriptions/{id}

Permanently delete a subscription.

**Response 204**: No content.

## Detection Endpoints

### GET /api/v1/subscriptions/suggestions

Returns auto-detected recurring expenses (computed on-demand from budget_transactions). Excludes descriptions matching existing subscriptions and dismissed suggestions.

**Response 200**:
```json
{
  "suggestions": [
    {
      "description": "NETFLIX",
      "amount": 13.99,
      "currency": "EUR",
      "months_detected": 3,
      "latest_date": "2026-03-15"
    }
  ]
}
```

### POST /api/v1/subscriptions/suggestions/dismiss

Dismiss a suggestion so it won't reappear.

**Request**:
```json
{
  "description": "NETFLIX"
}
```

**Response 204**: No content.

## Utility Endpoints

### GET /api/v1/subscriptions/payment-sources

Returns distinct payment sources from the user's statement imports.

**Response 200**:
```json
{
  "sources": ["monobank", "payoneer", "millenium"]
}
```
