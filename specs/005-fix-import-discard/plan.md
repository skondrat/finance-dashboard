# Implementation Plan: Fix Import Discard

**Branch**: `005-fix-import-discard` | **Date**: 2026-03-28 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-fix-import-discard/spec.md`

## Summary

Wire up the frontend Discard button (and modal close) to call the backend `POST /budget/import/{id}/discard` endpoint. The SSE progress hook needs to expose the import ID from the completion event so the discard action can reference it. Frontend-only change — no backend modifications needed.

## Technical Context

**Language/Version**: TypeScript 5 (frontend only)
**Primary Dependencies**: Next.js, TanStack Query
**Storage**: N/A (backend unchanged)
**Testing**: Manual browser testing
**Target Platform**: Web browser
**Project Type**: Web application (frontend-only fix)
**Performance Goals**: Discard completes in <2 seconds
**Constraints**: None
**Scale/Scope**: 2 files modified

## Constitution Check

Constitution unpopulated. No gates. Proceeding.

## Project Structure

### Source Code

```text
frontend/
├── src/
│   ├── components/budget/
│   │   └── import-modal.tsx     # Wire handleDiscard + handleClose to call backend
│   └── lib/queries/
│       └── budget.ts            # Expose import ID from SSE hook
```

## Complexity Tracking

No violations. Minimal 2-file change.
