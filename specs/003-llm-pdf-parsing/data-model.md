# Data Model: LLM-Powered PDF Statement Parsing

**Feature**: 003-llm-pdf-parsing
**Date**: 2026-03-28

## Existing Entities (No Changes)

### StatementImport
Already supports PDF imports. No schema changes needed.

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| user_id | string | Owner |
| filename | string | Original filename |
| format | string | "csv", "ofx", "mt940", "pdf" |
| source | string | "payoneer", "monobank", "millenium", "other", null |
| status | string | "parsing" → "preview" → "confirmed" / "discarded" |
| row_count | int | Extracted transaction count |
| duplicate_count | int | Duplicates found |
| uploaded_at | datetime | Upload timestamp |

### BudgetTransaction
No schema changes needed. All fields already support PDF-imported transactions.

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| user_id | string | Owner |
| import_id | UUID | FK → StatementImport |
| category_id | UUID | FK → Category (nullable) |
| date | date | Transaction date (YYYY-MM-DD) |
| description | string | Transaction description |
| amount | decimal | Signed amount (negative = debit) |
| currency | string | e.g., "EUR", "USD" |
| type | string | "debit" or "credit" |
| reference | string | Optional reference (nullable) |
| dedup_hash | string | SHA-256(date\|amount\|reference) |
| is_investment | boolean | Default false |

### Category
No changes needed.

### AutoCatRule
No changes needed.

## Data Flow

```
PDF bytes
  → pdfplumber.extract_text() → raw text per page
  → LLM API call → JSON array of transactions
  → Validation & normalization → list[dict]
  → Categorization pipeline (existing) → category assignments
  → BudgetTransaction records (preview state)
```

## LLM Request/Response Schema

### Input to LLM
- Raw text from all PDF pages (concatenated with page markers)
- Source hint (e.g., "payoneer") for context
- Output format specification

### Expected LLM Output
```json
{
  "transactions": [
    {
      "date": "2026-03-27",
      "description": "Card charge (EL CORTE INGLES)",
      "amount": -24.17,
      "currency": "EUR"
    }
  ]
}
```

### Validation Rules
- `date`: Must be a valid date in YYYY-MM-DD format
- `description`: Non-empty string
- `amount`: Numeric value; negative for debits, positive for credits
- `currency`: 3-letter ISO currency code
- Rows failing validation are skipped with a warning logged

## No New Tables or Migrations Required

This feature modifies only the parsing logic within the existing `PdfParser` class. The database schema, models, and all downstream services remain unchanged.
