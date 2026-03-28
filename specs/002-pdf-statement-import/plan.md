# Implementation Plan: PDF Statement Import

**Branch**: `002-pdf-statement-import` | **Date**: 2026-03-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-pdf-statement-import/spec.md`

## Summary

Add PDF statement import to the finance dashboard with source-specific column mapping (Payoneer, Monobank, Millenium via JSON config; "Other" via AI), intelligent transaction categorization using Anthropic Claude (with a persistent markdown mapping file and CSV seed categories), and a review-before-confirm workflow. Extends the existing parser registry, import service, and import modal.

## Technical Context

**Language/Version**: Python 3.11 (backend), TypeScript 5 (frontend)
**Primary Dependencies**: FastAPI, SQLAlchemy 2.0, pdfplumber (PDF table extraction), anthropic (Anthropic Python SDK), Next.js 16, TanStack Query, Zustand, react-dropzone
**Storage**: SQLite via SQLAlchemy (transactions, categories), Markdown file (description→category mappings), JSON file (source column mappings), CSV file (seed categories)
**Testing**: pytest (backend), vitest (frontend)
**Target Platform**: Web application (local/Docker)
**Project Type**: Web application (FastAPI backend + Next.js frontend)
**Performance Goals**: Full import workflow under 2 minutes for 100 transactions; AI categorization batched to minimize API calls
**Constraints**: Requires AI service connectivity for all imports (FR-014); single-user; text-based PDFs only (no OCR)
**Scale/Scope**: Single user, typical statements under 100 transactions, growing category mapping file

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution is an unfilled template — no principles defined, no gates to enforce. **PASS** (no violations possible).

## Project Structure

### Documentation (this feature)

```text
specs/002-pdf-statement-import/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api.md
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── api/
│   │   └── import_.py              # Extend with source selector + PDF support
│   ├── models/
│   │   └── statement_import.py     # Add format="pdf", source field
│   ├── parsers/
│   │   ├── registry.py             # Register PdfParser
│   │   └── pdf_parser.py           # NEW: PDF table extraction
│   ├── schemas/
│   │   └── budget.py               # Extend import schemas with source
│   ├── services/
│   │   ├── import_service.py       # Extend with PDF + AI categorization flow
│   │   ├── categorization_service.py  # Extend with AI + mapping file logic
│   │   └── llm_service.py          # NEW: Anthropic SDK wrapper
│   └── config.py                   # Add ANTHROPIC_API_KEY, LLM model config
├── data/
│   ├── source_mappings.json        # NEW: Column mappings for known sources
│   ├── category_mappings.md        # NEW: Persistent description→category mappings
│   └── seed_categories.csv         # NEW: User-provided initial categories
├── tests/
│   ├── unit/
│   │   ├── test_pdf_parser.py      # NEW
│   │   ├── test_llm_service.py     # NEW
│   │   └── test_categorization.py  # NEW
│   └── integration/
│       └── test_import_flow.py     # NEW
└── pyproject.toml                  # Add pdfplumber, anthropic

frontend/
├── src/
│   ├── components/
│   │   └── budget/
│   │       └── import-modal.tsx    # Extend with source selector + category editing
│   └── lib/
│       └── queries/
│           └── budget.ts           # Extend upload mutation with source param
└── package.json                    # No new deps needed
```

**Structure Decision**: Existing web application structure (backend/ + frontend/) is maintained. New files follow established patterns — new parser in `parsers/`, new service in `services/`, extended API in `api/`. Data files (JSON config, MD mappings, CSV seeds) go in `backend/data/`.

## Complexity Tracking

No constitution violations to justify.
