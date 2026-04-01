# Implementation Plan: Edit Previous Networth Snapshots

**Branch**: `040-edit-networth-snapshot` | **Date**: 2026-04-01 | **Spec**: [spec.md](spec.md)

## Summary

Add a "Modify previous networth" option to the Networth page's Gear menu that opens a modal with month/year selector and editable breakdown fields. Requires a new backend PATCH endpoint for snapshots and a new frontend modal component following the existing ImportNetworthModal pattern.

## Technical Context

**Language/Version**: Python 3.11 (backend), TypeScript 5 (frontend)
**Primary Dependencies**: FastAPI, SQLAlchemy 2.0 (backend); Next.js 16, TanStack Query, Zustand (frontend)
**Storage**: SQLite via SQLAlchemy (existing `networth_snapshots` table)
**Testing**: Manual browser testing via Playwright MCP
**Target Platform**: Web application
**Project Type**: Full-stack web application
**Constraints**: Must follow existing modal patterns and design system

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| VI. Keep It Simple | ✅ Pass | Follows existing ImportNetworthModal pattern, reuses existing data structures |
| III. Always Test with Browser | ✅ Will do | Test after implementation |

## Project Structure

```text
backend/
├── app/
│   ├── api/
│   │   └── networth.py              # Add PATCH /snapshots/{id} endpoint
│   └── schemas/
│       └── networth.py              # Add SnapshotUpdate schema, add id to response

frontend/
├── src/
│   ├── components/
│   │   └── networth/
│   │       └── edit-snapshot-modal.tsx   # NEW: edit modal with breakdown fields
│   ├── lib/
│   │   └── queries/
│   │       └── networth.ts              # Add useUpdateSnapshot mutation
│   └── app/
│       └── (dashboard)/
│           └── networth/
│               └── page.tsx             # Add menu option + modal state
```

### Existing Patterns to Reuse

- `import-networth-modal.tsx` — modal shell, month/year selectors, button styles, close/reset logic
- `useCreateManualSnapshot()` — mutation pattern with query invalidation
- `SettingsDropdown` — callback pattern for opening modals from the gear menu
