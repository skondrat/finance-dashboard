# Research: PDF Statement Import

**Feature**: 002-pdf-statement-import | **Date**: 2026-03-27

## R1: PDF Table Extraction Library

**Decision**: Use `pdfplumber` for PDF parsing and table extraction.

**Rationale**: pdfplumber excels at extracting structured tables from text-based PDFs, which is the primary use case for bank statements. It provides cell-level access to table data, handles multi-page tables, and returns Python-native data structures. It's built on top of `pdfminer.six` for text extraction.

**Alternatives considered**:
- `pypdf` — Good for text extraction but lacks robust table detection. Would require manual parsing of positional text data.
- `tabula-py` — Java dependency (requires JRE), adds operational complexity. Good table extraction but heavy.
- `camelot` — Strong table extraction but requires Ghostscript as system dependency.
- `pdfminer.six` — Lower level, no built-in table extraction. pdfplumber wraps it with a better API.

## R2: Anthropic Python SDK Integration

**Decision**: Use the `anthropic` Python package with API key from `.env` and default model `claude-sonnet-4-6`.

**Rationale**: User explicitly specified Anthropic SDK. The `anthropic` package provides a simple sync/async client. Fits the existing pydantic-settings pattern in `config.py` for loading env vars.

**Integration pattern**:
- New `llm_service.py` wraps the Anthropic client
- Two functions: `suggest_column_mapping(pdf_content)` for "Other" sources, `suggest_category(description, existing_mappings)` for new descriptions
- API key loaded via `Settings` class in `config.py` (ANTHROPIC_API_KEY)
- Model configurable via `LLM_MODEL` env var, default `claude-sonnet-4-6`

**Alternatives considered**:
- OpenAI SDK — User explicitly chose Anthropic.
- LangChain — Over-engineered for two direct API calls. Adds unnecessary abstraction.
- Direct HTTP — SDK handles auth, retries, and typed responses better.

## R3: Category Mapping Storage Format

**Decision**: Markdown file (`category_mappings.md`) with a simple table format.

**Rationale**: User explicitly requested an MD file for the mapping. A markdown table is human-readable, version-controllable, and simple to parse/write programmatically.

**File format**:
```markdown
# Category Mappings

| Description | Category |
|-------------|----------|
| netflix | Entertainment |
| spotify premium | Entertainment |
| uber eats | Food & Dining |
```

- Descriptions stored lowercase for case-insensitive matching.
- File is read on import start, written on import confirm.
- If file doesn't exist, it's created empty (with header only).

**Alternatives considered**:
- JSON file — Less human-readable, harder to manually edit.
- SQLite table — Already have AutoCatRule model, but user specifically wants MD file separate from the database.
- YAML — No significant advantage over MD for this flat key-value structure.

## R4: Source Column Mapping Configuration

**Decision**: JSON config file (`source_mappings.json`) with per-source table column definitions.

**Rationale**: User specified JSON config for known source mappings. Each source entry defines which PDF table columns map to Date, Description, Amount, Currency, and Type.

**File format**:
```json
{
  "payoneer": {
    "date_column": 0,
    "description_column": 1,
    "amount_column": 2,
    "currency_column": 3,
    "type_column": 4,
    "date_format": "%m/%d/%Y"
  },
  "monobank": {
    "date_column": 0,
    "description_column": 2,
    "amount_column": 3,
    "currency_column": 4,
    "type_column": 1,
    "date_format": "%d.%m.%Y"
  },
  "millenium": {
    "date_column": 0,
    "description_column": 1,
    "amount_column": 3,
    "currency_column": 2,
    "type_column": 4,
    "date_format": "%Y-%m-%d"
  }
}
```

- Column indices refer to positions in the extracted PDF table.
- The user will fill in actual values once they have sample statements.
- `date_format` allows per-source date parsing.

**Alternatives considered**:
- Reuse BankProfile model — BankProfile is user-created and database-stored. Source mappings are system-level and predefined. Different concerns.
- YAML — User specified JSON.

## R5: CSV Seed Categories File

**Decision**: CSV file with "Categories" (required) and "Examples" (optional) columns.

**Rationale**: User explicitly specified this format. The Examples column uses pipe (`|`) separators for multiple example descriptions per category.

**File format**:
```csv
Categories,Examples
Food & Dining,uber eats|mcdonalds|starbucks
Entertainment,netflix|spotify|cinema
Transport,uber|bolt|fuel station
Salary,
Freelance Income,payoneer|upwork
Utilities,electricity|water|internet
```

- Loaded at application startup or first import.
- Categories are added to the AI prompt as valid options.
- Examples (if provided) are pre-populated into the category mapping file.
- An empty Examples field means the category exists but has no example descriptions yet.

## R6: AI Prompt Design for Categorization

**Decision**: Few-shot prompt with existing mappings as examples, constrained to known categories.

**Rationale**: FR-008 requires few-shot examples; FR-016 requires constraining to known categories.

**Prompt structure for category suggestion**:
```
You are a financial transaction categorizer. Given a transaction description,
assign it to exactly one of the following categories:

Categories: [list from CSV + learned mappings]

Here are examples of previous categorizations:
- "netflix" → Entertainment
- "uber eats" → Food & Dining
- "electricity bill" → Utilities
[... more from mapping file]

Transaction description: "{new_description}"

Respond with only the category name, nothing else.
```

**Prompt structure for "Other" source column mapping**:
```
You are a financial statement parser. Below is a table extracted from a PDF
bank statement. Identify which columns correspond to these fields:
- Date (transaction date)
- Description (transaction description/memo)
- Amount (monetary value)
- Currency (currency code)
- Type (Debit or Credit)

Table header and first 5 rows:
{table_data}

Respond in JSON format:
{"date_column": N, "description_column": N, "amount_column": N,
 "currency_column": N, "type_column": N, "date_format": "format_string"}
```

## R7: Integration with Existing Import Flow

**Decision**: Extend existing parser registry and import service rather than creating parallel flows.

**Rationale**: The codebase already has a well-designed parser registry pattern (StatementParser base class), import service with preview→confirm workflow, and import modal with dropzone. Extending these patterns minimizes code duplication and maintains architectural consistency.

**Integration points**:
1. New `PdfParser` registered in parser registry
2. `import_service.create_import()` extended to accept `source` parameter
3. `categorization_service` extended with AI-powered categorization alongside existing keyword rules
4. Import API endpoint extended with `source` form field
5. Frontend import modal extended with source selector dropdown and category editing in preview

**Key architectural decision**: The AI categorization via the MD mapping file operates *in addition to* the existing AutoCatRule keyword matching. The MD file is checked first (exact match, case-insensitive). If no match, existing AutoCatRule keyword matching runs. If still no match, AI is called. This preserves backward compatibility.
