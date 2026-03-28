# Implementation Plan: Parallel Categorization with Import Progress

**Branch**: `004-parallel-categorization-progress` | **Date**: 2026-03-28 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-parallel-categorization-progress/spec.md`

## Summary

The current `categorize_transactions_batch()` calls `suggest_category()` sequentially for each transaction needing AI, taking ~3s each = 5+ minutes for 100 transactions. This plan adds: (1) concurrent AI categorization with `asyncio.gather()` + semaphore (max 10), and (2) Server-Sent Events (SSE) for real-time progress updates to the frontend during import processing.

## Technical Context

**Language/Version**: Python 3.11 (backend), TypeScript 5 (frontend)
**Primary Dependencies**: FastAPI (SSE via StreamingResponse), anthropic (async client), Next.js, TanStack Query
**Storage**: SQLite via SQLAlchemy (unchanged)
**Testing**: pytest
**Target Platform**: macOS/Linux, Docker
**Project Type**: Web application (full-stack change)
**Performance Goals**: 100-transaction PDF import in <60 seconds (down from 5+ minutes)
**Constraints**: Max 10 concurrent Anthropic API requests to avoid rate limiting
**Scale/Scope**: Single user, statements up to ~200 transactions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution is unpopulated (template only). No gates defined. Proceeding.

## Project Structure

### Documentation (this feature)

```text
specs/004-parallel-categorization-progress/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: research findings
├── data-model.md        # Phase 1: data model
├── quickstart.md        # Phase 1: quickstart guide
├── contracts/           # Phase 1: API contracts
│   └── import-progress-sse.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── api/
│   │   └── import_.py           # Add SSE progress endpoint or modify upload to stream
│   └── services/
│       ├── categorization_service.py  # Add async parallel categorization
│       └── llm_service.py             # Add async suggest_category variant
└── tests/

frontend/
├── src/
│   ├── components/budget/
│   │   └── import-modal.tsx     # Add progress display
│   └── lib/queries/
│       └── budget.ts            # Add SSE consumption hook
```

**Structure Decision**: Existing web application structure. Changes span backend (async categorization + SSE) and frontend (progress UI).

## Complexity Tracking

No constitution violations.
