# Implementation Plan: Auto-Match Categories for Identical Descriptions

**Branch**: `006-auto-match-categories` | **Date**: 2026-03-28 | **Spec**: [spec.md](spec.md)

## Summary

When a user overrides the category of an uncategorized transaction in the import preview, automatically apply the same override to all other uncategorized transactions with the same description. Frontend-only change — modify the `handleOverride` function in `import-modal.tsx`.

## Technical Context

**Language/Version**: TypeScript 5 (frontend only)
**Primary Dependencies**: Next.js, React
**Storage**: N/A
**Testing**: Manual browser testing
**Target Platform**: Web browser
**Project Type**: Web application (frontend-only fix)
**Performance Goals**: Auto-match completes in <100ms
**Constraints**: None
**Scale/Scope**: 1 file modified, 1 function changed

## Constitution Check

Constitution unpopulated. No gates. Proceeding.

## Project Structure

```text
frontend/
├── src/
│   └── components/budget/
│       └── import-modal.tsx     # Modify handleOverride to propagate
```
