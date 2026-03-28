# Implementation Plan: LLM-Powered PDF Statement Parsing

**Branch**: `003-llm-pdf-parsing` | **Date**: 2026-03-28 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-llm-pdf-parsing/spec.md`

## Summary

Replace the pdfplumber table-detection approach for PDF statement parsing with LLM-based text extraction. The current approach fails on real-world Payoneer statements because pdfplumber cannot detect column boundaries in PDFs that use whitespace instead of borders — returning all columns merged into single strings and yielding 0 transactions. The new approach uses `pdfplumber.extract_text()` to get raw text, sends it to the Anthropic API for structured extraction, and returns the same `list[dict]` format downstream services expect. No database changes, no API contract changes, no frontend changes.

## Technical Context

**Language/Version**: Python 3.11 (backend only — no frontend changes)
**Primary Dependencies**: FastAPI, pdfplumber (text extraction only), anthropic (Anthropic Python SDK), SQLAlchemy 2.0
**Storage**: SQLite via SQLAlchemy (unchanged)
**Testing**: pytest (existing test infrastructure, currently minimal)
**Target Platform**: macOS/Linux development, Docker
**Project Type**: Web application (full-stack, backend-focused change)
**Performance Goals**: PDF import completes in <30 seconds for statements with up to 100 transactions
**Constraints**: LLM API call adds latency (~5-15s); Anthropic API key required; token cost ~$0.01-0.03 per import
**Scale/Scope**: Single user, statements up to 10 MB / ~200 transactions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution is unpopulated (template only). No gates defined. Proceeding.

**Post-Phase 1 re-check**: No violations. The design is minimal — two files modified, no new dependencies, no schema changes.

## Project Structure

### Documentation (this feature)

```text
specs/003-llm-pdf-parsing/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: research findings
├── data-model.md        # Phase 1: data model (no changes needed)
├── quickstart.md        # Phase 1: quickstart guide
├── contracts/           # Phase 1: API contracts
│   └── import-upload-api.md
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── api/
│   │   └── import_.py           # Minor change: require LLM for all PDF sources
│   ├── parsers/
│   │   └── pdf_parser.py        # Major change: LLM-based extraction
│   ├── services/
│   │   ├── llm_service.py       # Add extract_transactions_from_text()
│   │   ├── import_service.py    # Unchanged
│   │   ├── categorization_service.py  # Unchanged
│   │   └── source_config_service.py   # Unchanged (kept for backward compat)
│   └── models/                  # Unchanged (no schema changes)
├── data/
│   ├── source_mappings.json     # Kept but no longer critical for parsing
│   └── category_mappings.md     # Unchanged
└── tests/
    └── unit/
        └── test_pdf_parser.py   # New: test LLM extraction

frontend/                        # No changes
```

**Structure Decision**: Existing web application structure. Backend-only change touching 2-3 files. No new directories or modules needed.

## Complexity Tracking

No constitution violations to justify. The implementation is intentionally minimal:
- 2 files modified (pdf_parser.py, llm_service.py)
- 1 file with minor change (import_.py — LLM availability check)
- 0 new dependencies
- 0 database migrations
- 0 frontend changes
