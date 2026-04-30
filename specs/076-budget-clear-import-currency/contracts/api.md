# API Contracts: Budget Month Clear & Import Currency Selector

**Feature**: 076-budget-clear-import-currency
**Date**: 2026-04-30

## New Endpoint: Clear Month Data

### POST /budget/debug/reset-month

Deletes all budget transactions for a specific month/year for the current user.

**Query Parameters**:

| Parameter | Type | Required | Description          |
|-----------|------|----------|----------------------|
| month     | int  | yes      | Month number (1-12)  |
| year      | int  | yes      | Year (e.g., 2026)    |

**Response** (200 OK):

```json
{
  "transactions_deleted": 42
}
```

**Error Responses**:
- 400: Invalid month/year values

---

## Modified Endpoint: Upload Import

### POST /budget/import/upload

**Added Form Parameter**:

| Parameter | Type   | Required | Default | Description                        |
|-----------|--------|----------|---------|------------------------------------|
| currency  | string | no       | "EUR"   | Currency code: "EUR", "USD", "UAH" |

Existing parameters (`file`, `source`, `bank_profile_id`) remain unchanged.

The `currency` value is passed to the import service and applied as the default currency for all transactions in the import. For PDF imports where the parser extracts per-row currencies, the parser's value takes precedence; the user-selected currency serves as fallback.

**No changes to response format.**
