# Implementation Plan: Add Spend Button & Default Categories

**Branch**: `014-add-spend-default-categories` | **Date**: 2026-03-29 | **Spec**: [spec.md](./spec.md)

## Summary

Add an "Add Spend" button next to "Import Statement" that opens a modal for quick manual expense entry (category, amount, description). Also ensure Debt and Investments categories are auto-created after seed categories import.

## Technical Context

**Language/Version**: Python 3.11 (backend), TypeScript 5 (frontend)
**Primary Dependencies**: FastAPI, SQLAlchemy 2.0 (backend); Next.js 16, TanStack Query (frontend)
**Storage**: SQLite via SQLAlchemy (no schema changes)
**Testing**: Manual browser testing
**Target Platform**: Web application (localhost)
**Project Type**: Web application (frontend + backend)
**Constraints**: Reuse existing POST /budget/transactions endpoint for Add Spend

## Constitution Check

Constitution is a blank template — no gates.

## Project Structure

```text
backend/
├── app/
│   └── services/
│       └── seed_service.py        # Add Debt/Investments after seed import

frontend/
├── src/
│   ├── app/(dashboard)/budget/
│   │   └── page.tsx               # Add "Add Spend" button next to Import Statement
│   └── components/budget/
│       └── add-spend-modal.tsx    # New: modal component for manual expense entry
```
