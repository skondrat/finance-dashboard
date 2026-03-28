# Research: LLM-Powered PDF Statement Parsing

**Feature**: 003-llm-pdf-parsing
**Date**: 2026-03-28

## R1: Why pdfplumber Table Extraction Fails

**Finding**: pdfplumber's `extract_tables()` relies on detecting cell boundaries (lines/borders) in the PDF. Payoneer statements use visual spacing (whitespace) rather than actual table borders to separate columns. As a result, pdfplumber returns each row as a single-element list containing the entire row as one concatenated string.

**Evidence**: Testing with the actual Payoneer PDF:
```python
Row 0: ['Date Description Amount Currency Running Balance']  # Header as one string
Row 1: ['27 Mar, 2026 Transfer between balances - to EUR from USD 861.91 EUR 1496.17']
```

All ~90 rows are single strings. The parser then skips every row because `len(row) <= max_col` (1 <= 4).

**Decision**: Replace pdfplumber table extraction with LLM-based text parsing for PDF statements.

**Alternatives considered**:
1. **pdfplumber `table_settings`** (explicit column boundaries): Requires knowing exact pixel coordinates per bank format. Fragile and unmaintainable.
2. **Regex-based row splitting**: Could work for Payoneer specifically, but breaks for other bank formats with different layouts. Not generalizable.
3. **Camelot/Tabula**: Same fundamental limitation as pdfplumber — rely on cell borders or line detection.
4. **LLM text parsing**: Send extracted text to LLM, receive structured JSON. Adapts to any format. Chosen approach.

---

## R2: LLM Extraction Approach

**Decision**: Use `pdfplumber.extract_text()` to get raw text from all pages, then send to the Anthropic API for structured extraction.

**Rationale**:
- `extract_text()` works reliably even when `extract_tables()` fails — it returns all visible text in reading order
- The text contains all needed data (dates, descriptions, amounts, currencies)
- Sending text (not images) to the LLM is cheaper and faster than vision-based approaches
- Claude can reliably parse tabular text into structured JSON

**Alternatives considered**:
1. **Vision/document mode** (send PDF pages as images): Higher token cost, slower, unnecessary when text extraction works fine.
2. **Send raw PDF bytes**: Not supported by the API as text input; would require base64 encoding as a document, adding complexity.

---

## R3: LLM Prompt Design for Transaction Extraction

**Decision**: Use a single LLM call per PDF with a structured output prompt requesting JSON array of transactions.

**Rationale**:
- A single call is more efficient than per-page or per-row calls
- Typical statements have <200 transactions — well within context limits
- The prompt specifies exact output schema to ensure consistent parsing
- Include the user's source hint (e.g., "Payoneer") for context

**Prompt structure**:
1. System: "You extract transactions from bank statement text into structured JSON."
2. User: Raw text from all pages + output schema specification
3. Expected output: JSON array of `{date, description, amount, currency}` objects

**Token budget estimate**:
- Input: ~2,000-5,000 tokens for a typical 100-transaction statement
- Output: ~3,000-5,000 tokens for structured JSON response
- Cost: ~$0.01-0.03 per import at current Sonnet pricing

---

## R4: Integration with Existing Import Flow

**Decision**: Create a new LLM-based parser method within the existing `PdfParser` class, replacing the pdfplumber table extraction path while keeping the same output interface.

**Rationale**:
- Minimal disruption to existing code — `import_service.create_import()` doesn't change
- The parser still returns `list[dict]` with the same keys (date, description, amount, currency, type, reference)
- Categorization pipeline remains unchanged
- Source config becomes optional (LLM handles format detection)

**Integration point**: Replace `PdfParser._extract_tables()` + `_map_rows()` with a new `_extract_via_llm()` method that returns the same `list[dict]` format.

---

## R5: Error Handling & Fallback Strategy

**Decision**: If LLM extraction fails, return a clear error. Do not fall back to pdfplumber table extraction (since it's known to fail for the primary use case).

**Rationale**:
- Silent fallback to a broken method would reproduce the original "0 transactions" problem
- Users prefer a clear error message over empty results
- The LLM service already has retry logic (single retry on timeout/connection error)

**Error cases**:
- LLM unavailable (no API key): Return error immediately with "AI service required for PDF import"
- LLM timeout after retry: Return error "Failed to process PDF — please try again"
- LLM returns unparseable response: Return error "Failed to extract transactions from PDF"
- PDF has no readable text: Return error "PDF contains no extractable text"

---

## R6: Source Config Simplification

**Decision**: Keep source_mappings.json for backward compatibility but make it optional. The LLM handles format detection regardless of source selection.

**Rationale**:
- The source dropdown (Payoneer/Monobank/Millenium/Other) still provides useful context to the LLM prompt
- No need to maintain per-bank column indices or date formats — the LLM infers these
- Existing "Other" + AI column mapping flow is replaced by the unified LLM extraction
- Simpler code: one extraction path for all PDF sources

---

## R7: Multi-Page Handling

**Decision**: Concatenate text from all pages with page markers, send as a single LLM request.

**Rationale**:
- Statements rarely exceed 10 pages (~200 transactions)
- A single LLM call avoids complexity of stitching results from multiple calls
- Page markers help the LLM understand page boundaries and ignore headers/footers

**Implementation**: `"\n--- Page N ---\n".join(page_texts)`
