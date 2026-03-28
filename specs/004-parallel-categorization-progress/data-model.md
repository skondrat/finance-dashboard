# Data Model: Parallel Categorization with Import Progress

**Feature**: 004-parallel-categorization-progress
**Date**: 2026-03-28

## No Database Schema Changes

This feature modifies runtime behavior only. No new tables, columns, or migrations needed.

## SSE Event Schema

Progress events sent from backend to frontend during import:

### Stage Events

```json
{"stage": "extracting"}
```

```json
{"stage": "categorizing", "total": 100, "done": 30}
```

```json
{"stage": "saving"}
```

### Completion Event

```json
{"stage": "complete", "result": { /* full ImportUploadResponse */ }}
```

### Error Event

```json
{"stage": "error", "message": "Failed to extract transactions from PDF"}
```

## Frontend State Model

The import modal component manages:

| Field | Type | Description |
|-------|------|-------------|
| stage | string | "idle" / "extracting" / "categorizing" / "saving" / "complete" / "error" |
| total | number | Total transactions to categorize |
| done | number | Transactions categorized so far |
| result | ImportResponse or null | Final import result (preview data) |
| error | string or null | Error message if import failed |
