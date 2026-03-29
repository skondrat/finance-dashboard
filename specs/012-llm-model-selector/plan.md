# Implementation Plan: LLM Model Selector

**Branch**: `012-llm-model-selector` | **Date**: 2026-03-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/012-llm-model-selector/spec.md`

## Summary

Add a model selector dropdown to the existing debug menu that allows switching between claude-haiku-4-5 and claude-sonnet-4-6. The frontend passes the selected model to the backend via a query parameter or header on LLM-triggering API calls. The backend overrides its `settings.LLM_MODEL` with the request-scoped value.

## Technical Context

**Language/Version**: Python 3.11 (backend), TypeScript 5 (frontend)
**Primary Dependencies**: FastAPI, SQLAlchemy 2.0, anthropic SDK (backend); Next.js 16, TanStack Query, Zustand (frontend)
**Storage**: SQLite via SQLAlchemy (no schema changes)
**Testing**: Manual browser testing
**Target Platform**: Web application (localhost)
**Project Type**: Web application (frontend + backend)
**Performance Goals**: N/A — UI-only feature with no performance impact
**Constraints**: Must not break existing LLM functionality; debug menu only
**Scale/Scope**: 2 models, 1 dropdown, 1 backend endpoint

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution is a blank template — no project-specific principles defined. No gates to evaluate.

## Project Structure

### Documentation (this feature)

```text
specs/012-llm-model-selector/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── config.py              # LLM_MODEL setting (existing)
│   ├── services/
│   │   └── llm_service.py     # All LLM calls use settings.LLM_MODEL (modify to accept override)
│   └── api/
│       └── import_.py          # Endpoints that trigger LLM (pass model override)

frontend/
├── src/
│   ├── components/budget/
│   │   └── debug-menu.tsx     # Add model selector dropdown
│   └── lib/
│       └── api.ts             # apiFetch utility (may need header support)
```

**Structure Decision**: Existing web application structure. Changes touch 3-4 existing files, no new files needed beyond the Zustand store for model state (if not already colocated).

## Complexity Tracking

No constitution violations — section not applicable.
