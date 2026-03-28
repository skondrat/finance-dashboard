# finance-dashboard Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-28

## Active Technologies
- Python 3.11 (backend), TypeScript 5 (frontend) + FastAPI, SQLAlchemy 2.0, pdfplumber (PDF table extraction), anthropic (Anthropic Python SDK), Next.js 16, TanStack Query, Zustand, react-dropzone (002-pdf-statement-import)
- SQLite via SQLAlchemy (transactions, categories), Markdown file (description→category mappings), JSON file (source column mappings), CSV file (seed categories) (002-pdf-statement-import)
- Python 3.11 (backend only — no frontend changes) + FastAPI, pdfplumber (text extraction only), anthropic (Anthropic Python SDK), SQLAlchemy 2.0 (003-llm-pdf-parsing)
- SQLite via SQLAlchemy (unchanged) (003-llm-pdf-parsing)
- Python 3.11 (backend), TypeScript 5 (frontend) + FastAPI (SSE via StreamingResponse), anthropic (async client), Next.js, TanStack Query (004-parallel-categorization-progress)
- TypeScript 5 (frontend only) + Next.js, TanStack Query (005-fix-import-discard)
- N/A (backend unchanged) (005-fix-import-discard)

- Python 3.11 (backend), TypeScript 5 (frontend) + FastAPI, SQLAlchemy 2.0, Alembic (backend); Next.js 15, Tailwind CSS 4, shadcn/ui, Recharts, TanStack Query, Zustand (frontend) (001-finance-dashboard)

## Project Structure

```text
src/
tests/
```

## Commands

cd src [ONLY COMMANDS FOR ACTIVE TECHNOLOGIES][ONLY COMMANDS FOR ACTIVE TECHNOLOGIES] pytest [ONLY COMMANDS FOR ACTIVE TECHNOLOGIES][ONLY COMMANDS FOR ACTIVE TECHNOLOGIES] ruff check .

## Code Style

Python 3.11 (backend), TypeScript 5 (frontend): Follow standard conventions

## Recent Changes
- 005-fix-import-discard: Added TypeScript 5 (frontend only) + Next.js, TanStack Query
- 004-parallel-categorization-progress: Added Python 3.11 (backend), TypeScript 5 (frontend) + FastAPI (SSE via StreamingResponse), anthropic (async client), Next.js, TanStack Query
- 003-llm-pdf-parsing: Added Python 3.11 (backend only — no frontend changes) + FastAPI, pdfplumber (text extraction only), anthropic (Anthropic Python SDK), SQLAlchemy 2.0


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
