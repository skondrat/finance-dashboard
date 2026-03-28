# Research: Parallel Categorization with Import Progress

**Feature**: 004-parallel-categorization-progress
**Date**: 2026-03-28

## R1: Concurrent AI Categorization Approach

**Decision**: Use Python `asyncio` with a semaphore (max 10) and the Anthropic async client (`AsyncAnthropic`) to run `suggest_category()` calls concurrently.

**Rationale**:
- The current bottleneck is sequential LLM calls: ~3s each * 100 transactions = ~5 minutes
- With concurrency of 10: ~3s * ceil(100/10) = ~30 seconds
- `asyncio` is the natural fit since FastAPI is already async-capable
- Anthropic Python SDK provides `AsyncAnthropic` for async API calls
- A semaphore of 10 limits concurrency to avoid API rate limits

**Alternatives considered**:
1. **ThreadPoolExecutor**: Simpler but less efficient than async I/O for network-bound work. FastAPI already runs in an async event loop.
2. **Batch all descriptions in one LLM call**: Would be faster but changes the categorization contract significantly — the LLM prompt for suggest_category is designed for single-transaction matching against the category list.
3. **No concurrency, just faster model**: Doesn't solve the fundamental N-sequential-calls problem.

---

## R2: Progress Communication Mechanism

**Decision**: Use Server-Sent Events (SSE) via FastAPI's `StreamingResponse` to push progress updates from backend to frontend during import processing.

**Rationale**:
- SSE is ideal for one-way server→client progress updates
- FastAPI supports SSE natively via `StreamingResponse` with `text/event-stream` content type
- The frontend can consume SSE via the standard `EventSource` API or fetch with ReadableStream
- No WebSocket complexity needed for one-way progress reporting
- The final SSE event contains the full import result, so the frontend gets both progress and result from a single connection

**Alternatives considered**:
1. **Polling**: Frontend polls a `/progress/{import_id}` endpoint. Simpler but adds latency (poll interval) and extra requests. Acceptable fallback if SSE is too complex.
2. **WebSocket**: Full-duplex, overkill for one-way progress. More complex setup.
3. **Long polling**: Similar to SSE but less standard.

---

## R3: Backend Architecture for Async Categorization

**Decision**: Make the upload endpoint return an SSE stream. The endpoint runs the import pipeline (extract → categorize → save) and yields progress events as each stage progresses. The final event contains the `ImportUploadResponse`.

**Rationale**:
- Keeps the import as a single request/response cycle (no background jobs or import status polling)
- The categorization service gains an async variant `categorize_transactions_batch_async()` that accepts a progress callback
- The progress callback is called after each individual AI categorization completes, enabling fine-grained progress reporting (FR-006)

**Flow**:
```
Client: POST /budget/import/upload (Accept: text/event-stream)
  → SSE event: {"stage": "extracting"}
  → SSE event: {"stage": "categorizing", "total": 100, "done": 0}
  → SSE event: {"stage": "categorizing", "total": 100, "done": 10}
  → ... (after each transaction completes)
  → SSE event: {"stage": "categorizing", "total": 100, "done": 100}
  → SSE event: {"stage": "saving"}
  → SSE event: {"stage": "complete", "result": {<ImportUploadResponse>}}
```

---

## R4: Frontend SSE Consumption

**Decision**: Use `fetch()` with `ReadableStream` to consume SSE events from the upload endpoint. This replaces the current `apiFetch` mutation with a custom function that reads the stream and updates React state on each event.

**Rationale**:
- TanStack Query's `useMutation` doesn't natively support streaming responses
- A custom hook (`useImportWithProgress`) can manage both the upload and progress state
- The hook exposes: `stage`, `total`, `done`, `result`, `error`, and `upload(file, source)`
- The import-modal component uses these to render progress bars and stage labels

**Alternatives considered**:
1. **EventSource API**: Standard for SSE but doesn't support POST requests or custom headers. Would require a separate GET endpoint for progress.
2. **Separate progress endpoint + polling**: Simpler frontend code but adds latency and complexity on the backend to maintain progress state.

---

## R5: Anthropic Async Client

**Decision**: Use `anthropic.AsyncAnthropic` for the concurrent categorization calls. Keep the existing synchronous client for other LLM functions.

**Rationale**:
- The Anthropic Python SDK provides `AsyncAnthropic` with the same API surface as `Anthropic`
- Only the categorization batch function needs async — the extraction and single-category suggestion functions can remain synchronous
- The async client shares the same API key and model configuration
