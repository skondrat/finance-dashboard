# Quickstart: LLM-Powered PDF Statement Parsing

**Feature**: 003-llm-pdf-parsing
**Date**: 2026-03-28

## Prerequisites

- Python 3.11+ with backend virtualenv active
- Anthropic API key in `.env` (`ANTHROPIC_API_KEY=sk-ant-...`)
- Backend running: `cd backend && uvicorn app.main:app --reload --port 8000`
- Frontend running: `cd frontend && npm run dev`

## What Changes

Only two backend files are modified:

| File | Change |
|------|--------|
| `backend/app/parsers/pdf_parser.py` | Replace pdfplumber table extraction with LLM text extraction |
| `backend/app/services/llm_service.py` | Add `extract_transactions_from_text()` method |

## How to Test

1. Navigate to `http://localhost:3000/budget`
2. Click "Import Statement"
3. (First time) Upload seed categories via `data/categories.csv`
4. Upload `data/monthly_statement_3_2026.pdf`
5. Select "Payoneer" as source
6. Click "Upload"
7. Verify: ~90 transactions appear in the preview table with dates, descriptions, amounts, currencies, and suggested categories

## Key Files to Read

```
backend/app/parsers/pdf_parser.py          # Modified: LLM extraction
backend/app/services/llm_service.py        # Modified: new extraction method
backend/app/services/import_service.py     # Unchanged: calls parser.parse()
backend/app/api/import_.py                 # Minor: require LLM for all PDF sources
```

## Architecture

```
PDF Upload → pdfplumber.extract_text() → raw text
  → llm_service.extract_transactions_from_text() → JSON transactions
  → validation & normalization → list[dict]
  → categorization_service (existing) → category assignments
  → preview table in frontend
```
