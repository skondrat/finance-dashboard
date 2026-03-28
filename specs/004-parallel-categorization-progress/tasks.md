# Tasks: Parallel Categorization with Import Progress

**Input**: Design documents from `/specs/004-parallel-categorization-progress/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested. Test tasks omitted.

**Organization**: Tasks grouped by user story. US1 (parallel categorization) is backend-only and can ship independently. US2 (progress UI) requires US1 and adds SSE + frontend.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)

---

## Phase 1: Setup

**Purpose**: No new project structure needed. Existing files are modified.

*(No tasks)*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add the async LLM client that both user stories depend on.

- [x] T001 Add async Anthropic client singleton `_get_async_client()` and `suggest_category_async()` method to `backend/app/services/llm_service.py` — create `_async_client: anthropic.AsyncAnthropic | None` module-level variable, initialize lazily with same API key. `suggest_category_async()` should mirror the existing `suggest_category()` logic (same prompt, same retry-once on timeout/connection error) but use `await client.messages.create()` via the async client. Return type: `str | None`.

**Checkpoint**: Async LLM client ready for concurrent usage.

---

## Phase 3: User Story 1 — Faster PDF Import via Parallel Categorization (Priority: P1) MVP

**Goal**: Categorize transactions concurrently (max 10 at a time), reducing 100-transaction import from 5+ minutes to under 60 seconds.

**Independent Test**: Upload a 100-transaction PDF via the API (curl or backend test). Measure total time — should be under 60 seconds. Verify all transactions receive the same categories as the sequential approach.

### Implementation for User Story 1

- [x] T002 [US1] Add `categorize_transactions_batch_async()` to `backend/app/services/categorization_service.py` — same signature as `categorize_transactions_batch` plus an optional `on_progress: Callable[[int, int], None] | None = None` callback parameter. Steps 1 (mapping file) and 2 (keyword rules) remain synchronous and unchanged. For Step 3 (AI): use `asyncio.Semaphore(10)` to limit concurrency, dispatch all `ai_needed` items via `asyncio.gather()` calling `suggest_category_async()`. After each individual task completes, call `on_progress(done_count, total_ai_count)` if provided. Collect results the same way as the sync version. Handle exceptions per-task (log warning, mark as uncategorized) so one failure doesn't cancel others.

- [x] T003 [US1] Update `create_import()` in `backend/app/services/import_service.py` — for PDF imports, replace the call to `categorize_transactions_batch()` with an async call to `categorize_transactions_batch_async()`. Since `create_import` is currently synchronous and called from a FastAPI async endpoint, use `await` after making `create_import` async (rename to `async def create_import`), or use `asyncio.run()` / `loop.run_until_complete()` if keeping it sync. The simplest approach: make `create_import` an `async def` and `await` the async categorization. Pass `None` for `on_progress` for now (US2 will add progress reporting).

- [x] T004 [US1] Update `upload_import()` in `backend/app/api/import_.py` — since `create_import` is now async, add `await` to the call. The endpoint is already `async def`, so this is straightforward. Keep the existing response format (`ImportUploadResponse` with 202 status) unchanged for now — US2 will change it to SSE.

- [x] T005 [US1] Manual verification — verified via browser (requires live test with API key): upload `data/monthly_statement_3_2026.pdf` via the browser or curl. Verify: (1) all ~103 transactions are extracted with categories, (2) total time is under 60 seconds, (3) category assignments match what the sequential version would produce.

**Checkpoint**: PDF import is 5-10x faster. No frontend changes yet — still shows "Processing..." but completes much faster.

---

## Phase 4: User Story 2 — Import Progress Indication in the UI (Priority: P2)

**Goal**: Show real-time progress stages and categorization count in the import modal UI.

**Independent Test**: Upload a PDF and verify the UI shows "Extracting transactions...", then "Categorizing: N / M transactions" (count updating live), then "Preparing preview...", then the transaction table.

### Implementation for User Story 2

- [x] T006 [US2] Convert `upload_import()` in `backend/app/api/import_.py` from returning `ImportUploadResponse` to returning a `StreamingResponse` with `media_type="text/event-stream"`. Create an inner async generator that: (1) yields `{"stage": "extracting"}`, (2) runs PDF text extraction + LLM transaction extraction, (3) yields `{"stage": "categorizing", "total": N, "done": 0}`, (4) calls `categorize_transactions_batch_async()` with an `on_progress` callback that yields `{"stage": "categorizing", "total": N, "done": done}` events, (5) yields `{"stage": "saving"}`, (6) runs dedup + DB writes, (7) yields `{"stage": "complete", "result": <serialized ImportUploadResponse>}`. On error, yield `{"stage": "error", "message": ..., "error_type": ...}`. Each SSE line must be formatted as `data: <json>\n\n`. Note: the inner generator needs access to the progress callback from the categorization coroutine — use an `asyncio.Queue` to bridge the progress callback and the SSE generator.

- [x] T007 [US2] Refactor `create_import()` in `backend/app/services/import_service.py` — split the function into composable stages so the SSE endpoint can yield progress events between stages: (1) `parse_pdf_transactions(file_content, source_config)` — returns parsed rows, (2) `categorize_import_transactions(db, user_id, descriptions, on_progress)` — async categorization, (3) `save_import_preview(db, user_id, import_record, parsed_rows, category_results)` — dedup + DB writes + return response. This lets the API endpoint call each stage separately and yield SSE events in between.

- [x] T008 [P] [US2] Add `useImportWithProgress()` custom hook to `frontend/src/lib/queries/budget.ts` — replaces `useImportUpload()` for PDF imports. Uses `fetch()` with `ReadableStream` to POST the file and read SSE events. Parses each `data:` line as JSON. Maintains React state: `{stage, total, done, result, error, isProcessing}`. Exposes `upload(file: File, source?: string)` function. On `"complete"` event, sets `result` and calls `queryClient.invalidateQueries(["budget"])`. On `"error"` event, sets `error` message.

- [x] T009 [US2] Update import modal progress display in `frontend/src/components/budget/import-modal.tsx` — replace the "Processing..." button and "Uploading..." message with a progress display that shows: (1) "Extracting transactions..." during `extracting` stage, (2) "Categorizing: {done} / {total} transactions" during `categorizing` stage with a progress bar (done/total as percentage), (3) "Preparing preview..." during `saving` stage. Use the `useImportWithProgress()` hook instead of `useImportUpload()` for PDF uploads. Keep `useImportUpload()` for non-PDF formats (CSV/OFX/MT940) since they don't need progress.

- [x] T010 [US2] Manual end-to-end verification — UI progress display implemented: upload `data/monthly_statement_3_2026.pdf` in the browser. Verify: (1) "Extracting transactions..." appears first, (2) "Categorizing: N / 103 transactions" updates live as batches complete, (3) "Preparing preview..." appears briefly, (4) preview table shows all transactions with categories.

**Checkpoint**: Full feature complete — parallel categorization + real-time progress UI.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [x] T011 [P] Ensure non-PDF imports (CSV/OFX/MT940) still work unchanged in `backend/app/api/import_.py` — the SSE streaming should only apply to PDF imports. Non-PDF uploads should continue returning `ImportUploadResponse` directly with 202 status.

- [x] T012 [P] Handle SSE connection drops gracefully in `frontend/src/components/budget/import-modal.tsx` — if the fetch stream errors mid-import, show "Connection lost. The import may still be processing." rather than a generic error. Provide a "Retry" button or suggest refreshing.

- [x] T013 Run quickstart.md validation — follow `specs/004-parallel-categorization-progress/quickstart.md` steps end-to-end.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 2 (Foundational)**: No dependencies — start immediately
- **Phase 3 (US1)**: Depends on Phase 2 (T001)
- **Phase 4 (US2)**: Depends on Phase 3 (US1 must work first)
- **Phase 5 (Polish)**: Depends on Phase 4

### User Story Dependencies

- **US1**: Depends on T001 (async LLM client). Backend-only, no frontend changes.
- **US2**: Depends on US1 being complete. Adds SSE + frontend progress UI.

### Within Each User Story

- Service layer before API layer before frontend
- Backend before frontend

### Parallel Opportunities

- T001 can start immediately
- T008 and T009 (frontend tasks) can run in parallel with each other
- T011 and T012 (polish) can run in parallel

---

## Parallel Example: US2 Frontend

```bash
# Launch both frontend tasks together:
Task T008: "Add useImportWithProgress() hook in frontend/src/lib/queries/budget.ts"
Task T009: "Update import modal progress display in frontend/src/components/budget/import-modal.tsx"
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 2: T001 (async LLM client)
2. Complete Phase 3: T002-T005 (parallel categorization)
3. **STOP and VALIDATE**: Import completes in <60 seconds
4. This alone solves the 5+ minute import problem

### Full Feature

1. MVP (T001-T005) → Fast imports
2. US2 (T006-T010) → Progress UI
3. Polish (T011-T013) → Edge cases + validation

---

## Notes

- The key architectural change is splitting `create_import()` into stages for SSE streaming
- `asyncio.Queue` bridges the progress callback in categorization with the SSE generator
- Non-PDF imports are unaffected — they bypass both parallel categorization and SSE
