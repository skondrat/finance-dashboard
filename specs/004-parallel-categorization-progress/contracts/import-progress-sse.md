# Contract: Import Upload with SSE Progress

**Feature**: 004-parallel-categorization-progress
**Endpoint**: `POST /api/v1/budget/import/upload`

## Contract Change

The upload endpoint changes from returning a JSON response to returning an SSE stream. The final SSE event contains the same `ImportUploadResponse` as before.

### Request (unchanged)
- **Method**: POST
- **Content-Type**: multipart/form-data
- **Parameters**: `file`, `source` (same as before)

### Response (changed)
- **Status**: 200 OK (changed from 202)
- **Content-Type**: `text/event-stream`
- **Body**: Stream of SSE events

### SSE Event Format

Each event is a JSON-encoded line prefixed with `data: `:

```
data: {"stage": "extracting"}

data: {"stage": "categorizing", "total": 100, "done": 0}

data: {"stage": "categorizing", "total": 100, "done": 10}

data: {"stage": "categorizing", "total": 100, "done": 20}

...

data: {"stage": "categorizing", "total": 100, "done": 100}

data: {"stage": "saving"}

data: {"stage": "complete", "result": {"id": "...", "status": "preview", "row_count": 100, ...}}

```

### Error Events

```
data: {"stage": "error", "message": "Password-protected PDFs are not supported", "error_type": "password_protected"}

```

### Stage Progression

1. `extracting` — PDF text extraction and LLM-based parsing
2. `categorizing` — AI categorization (with `total` and `done` counts)
3. `saving` — Deduplication and database writes
4. `complete` — Done, `result` field contains `ImportUploadResponse`

Or at any point:
- `error` — Import failed, `message` contains user-friendly error

## Internal Contract: Async Categorization

New async method in `categorization_service`:

```python
async def categorize_transactions_batch_async(
    db: Session,
    user_id: str,
    descriptions: list[str],
    on_progress: Callable[[int, int], None] | None = None,
) -> dict[int, dict]:
    """
    Same as categorize_transactions_batch but runs AI calls concurrently
    (max 10 at a time) and calls on_progress(done, total) after each completion.
    """
```

## Internal Contract: Async LLM Suggest Category

New async method in `llm_service`:

```python
async def suggest_category_async(
    description: str,
    existing_mappings: dict[str, str],
    known_categories: list[str],
) -> str | None:
    """Same as suggest_category but uses AsyncAnthropic client."""
```
