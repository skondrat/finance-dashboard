# Implementation Plan: Import Networth with Account Breakdown

**Branch**: `041-import-nw-breakdown` | **Date**: 2026-04-01 | **Spec**: [spec.md](spec.md)

## Summary

Refactor the "Import previous networth" modal to show per-account breakdown fields (matching the existing "Modify previous networth" modal) instead of a single total field. Requires updating the backend POST endpoint to accept an optional `breakdown` field and refactoring the frontend modal component.

## Technical Context

**Language/Version**: Python 3.11 (backend), TypeScript 5 (frontend)
**Primary Dependencies**: FastAPI, SQLAlchemy 2.0 (backend); Next.js 16, TanStack Query (frontend)
**Storage**: SQLite via SQLAlchemy (existing `networth_snapshots` table)
**Testing**: Manual browser testing via Playwright MCP
**Target Platform**: Web application
**Project Type**: Full-stack web application
**Constraints**: Must match the Modify modal's layout and UX

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| VI. Keep It Simple | ✅ Pass | Reuses EditSnapshotModal patterns, minimal backend change |
| III. Always Test with Browser | ✅ Will do | Test after implementation |

## Project Structure

```text
backend/
├── app/
│   ├── api/
│   │   └── networth.py              # Update POST /snapshots to accept breakdown
│   └── schemas/
│       └── networth.py              # Add breakdown to ManualSnapshotCreate

frontend/
├── src/
│   ├── components/
│   │   └── networth/
│   │       └── import-networth-modal.tsx  # Refactor: breakdown fields instead of single total
│   └── lib/
│       └── queries/
│           └── networth.ts               # Update CreateManualSnapshotPayload type
```

### Existing Patterns to Reuse

- `edit-snapshot-modal.tsx` — per-account breakdown layout, live total calculation
- `useNetworthSummary()` — provides current account list (name, source, account_type)
