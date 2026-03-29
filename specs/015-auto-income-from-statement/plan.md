# Implementation Plan: Auto-Detect Income from Statements

**Branch**: `015-auto-income-from-statement` | **Date**: 2026-03-29 | **Spec**: [spec.md](./spec.md)

## Summary

During import confirmation, detect positive-amount transactions that are not self-transfers. For each, auto-create an IncomeSource record. Backend-only change in `import_service.py`.

## Technical Context

**Language/Version**: Python 3.11 (backend only)
**Primary Dependencies**: FastAPI, SQLAlchemy 2.0
**Storage**: SQLite via SQLAlchemy (no schema changes — reuses IncomeSource model)
**Project Type**: Web application (backend only)

## Project Structure

```text
backend/
├── app/
│   └── services/
│       └── import_service.py     # Add income detection in confirm_import()
```

Single file change.
