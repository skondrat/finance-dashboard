# Contract: Import Upload API (PDF)

**Feature**: 003-llm-pdf-parsing
**Endpoint**: `POST /api/v1/budget/import/upload`

## No API Contract Changes

The existing endpoint contract remains identical. The change is internal — how the backend processes PDF files — not what it accepts or returns.

### Request (unchanged)
- **Method**: POST
- **Content-Type**: multipart/form-data
- **Parameters**:
  - `file` (required): PDF file upload, max 10 MB
  - `source` (required for PDF): "payoneer" | "monobank" | "millenium" | "other"
  - `bank_profile_id` (optional): UUID for CSV profiles

### Response (unchanged)
- **Status**: 202 Accepted
- **Body**: `ImportUploadResponse`

```json
{
  "id": "uuid",
  "status": "preview",
  "file_name": "statement.pdf",
  "source": "payoneer",
  "row_count": 90,
  "duplicate_count": 0,
  "skipped_count": 0,
  "rows": [
    {
      "date": "2026-03-27",
      "description": "Card charge (EL CORTE INGLES)",
      "amount": "-24.17",
      "currency": "EUR",
      "type": "debit",
      "category_id": "uuid-or-null",
      "category_name": "Shopping",
      "category_source": "ai",
      "category_guess": "Shopping"
    }
  ]
}
```

### Error Responses (unchanged)
- `400`: invalid_format, missing_source, file_too_large, password_protected, parse_error
- `422`: no_tables, mapping_failed
- `503`: ai_unavailable

### New Error Case
- `503 ai_unavailable`: Now returned for ALL PDF imports when the LLM is unavailable (previously only for "Other" source). The LLM is now required for PDF parsing.

## Internal Contract: PdfParser.parse()

The method signature and return type remain unchanged. Only the internal implementation changes.

```python
# Unchanged interface
def parse(self, file_content: bytes, bank_profile=None, *, source_config: dict | None = None) -> list[dict]:
    """Returns list of transaction dicts with keys: date, description, amount, currency, type, reference"""
```

## Internal Contract: LLM Service Addition

New method added to `llm_service`:

```python
def extract_transactions_from_text(
    page_texts: list[str],
    source_hint: str | None = None,
) -> list[dict] | None:
    """
    Send PDF text to LLM for structured extraction.

    Args:
        page_texts: List of text strings, one per PDF page.
        source_hint: Optional bank name for context (e.g., "payoneer").

    Returns:
        List of transaction dicts or None on failure.
        Each dict: {date: str, description: str, amount: float, currency: str}
    """
```
