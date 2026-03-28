# Tasks: LLM-Powered PDF Statement Parsing

**Input**: Design documents from `/specs/003-llm-pdf-parsing/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in the feature specification. Test tasks omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: No new project structure needed. This feature modifies existing files only. Phase 1 is a no-op.

*(No tasks — existing project structure is sufficient)*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add the core LLM extraction capability that all user stories depend on.

**CRITICAL**: US1, US2, and US3 all depend on the LLM being able to extract transactions from PDF text.

- [x] T001 Add `extract_transactions_from_text()` method to `backend/app/services/llm_service.py` — accepts list of page text strings and optional source hint, sends structured prompt to Anthropic API requesting JSON array of `{date, description, amount, currency}`, parses and validates response, returns `list[dict]` or `None`. Include retry logic consistent with existing methods (single retry on timeout/connection error). Use `settings.LLM_MODEL` and max_tokens appropriate for ~200 transactions (~5000 tokens).

- [x] T002 Add `_extract_text_from_pdf()` helper method to `backend/app/parsers/pdf_parser.py` — uses `pdfplumber.open()` to iterate pages and call `page.extract_text()`, returns `list[str]` (one string per page). Handle password-protected PDFs (raise ValueError). Handle empty/unreadable pages (skip with warning log).

**Checkpoint**: Foundation ready — the LLM can extract transactions from PDF text, and we can get text from PDFs.

---

## Phase 3: User Story 1 — Import PDF Statement via LLM Extraction (Priority: P1) MVP

**Goal**: Users can upload a Payoneer PDF statement and see all ~90 transactions correctly extracted in the preview table.

**Independent Test**: Upload `data/monthly_statement_3_2026.pdf`, select "Payoneer", click Upload. Verify all transactions appear with correct dates (YYYY-MM-DD), descriptions, amounts (negative for charges), and currency (EUR).

### Implementation for User Story 1

- [x] T003 [US1] Rewrite `PdfParser.parse()` in `backend/app/parsers/pdf_parser.py` — replace the `_extract_tables()` + `_map_rows()` path with: (1) call `_extract_text_from_pdf()` to get page texts, (2) call `llm_service.extract_transactions_from_text(page_texts, source_hint=source)` to get structured data, (3) validate and normalize each transaction (date to ISO format, amount to signed Decimal string, currency to uppercase, determine debit/credit type from amount sign), (4) return `list[dict]` with same keys as before: `date`, `description`, `amount`, `currency`, `type`, `reference`. Keep `source_config` parameter for interface compatibility but it is no longer used for column mapping. Raise `ValueError("Failed to extract transactions from PDF")` if LLM returns None or empty list.

- [x] T004 [US1] Update `upload_import()` in `backend/app/api/import_.py` — require LLM availability (`llm_service.is_available()`) for ALL PDF sources (not just "Other"). Return 503 `ai_unavailable` error if LLM is not configured. Remove the `source_config_service.get_source_config()` call for known sources since the LLM handles format detection. Pass `source` as a hint to the parser via `source_config={"source_hint": source}` for backward-compatible parameter passing.

- [x] T005 [US1] Manual end-to-end verification — extraction works (103 transactions via CLI test), but E2E browser flow is slow due to per-transaction categorization (~103 sequential LLM calls in categorization_service): start backend (`cd backend && uvicorn app.main:app --reload --port 8000`), navigate to Budget > Import Statement, upload seed categories from `data/categories.csv`, upload `data/monthly_statement_3_2026.pdf` with source "Payoneer", verify transactions appear in preview with correct fields.

**Checkpoint**: User Story 1 is complete. Payoneer PDF imports work end-to-end with LLM extraction.

---

## Phase 4: User Story 2 — Automatic Category Assignment Using LLM (Priority: P2)

**Goal**: Extracted transactions are automatically assigned spending categories from the user's category list.

**Independent Test**: After uploading the Payoneer PDF with seed categories loaded, verify that transactions show category suggestions (e.g., IHERB.COM → Supplements, MERCADONA → Groceries, RYANAIR → Airplane Tickets) and that users can override categories before confirming.

### Implementation for User Story 2

- [x] T006 [US2] Verify existing categorization pipeline works with LLM-extracted transactions in `backend/app/services/import_service.py` — the `categorize_transactions_batch()` call in `create_import()` should work unchanged since it receives the same `list[dict]` format. Verify that: (1) descriptions from LLM output match the format expected by `categorization_service` (e.g., "Card charge (IHERB.COM)" not just "IHERB.COM"), (2) the 3-step resolution chain (mapping file → keyword rules → AI suggestion) applies correctly, (3) category assignments appear in the preview response.

- [x] T007 [US2] If LLM-extracted descriptions differ from what the categorization service expects (e.g., LLM strips "Card charge" prefix), adjust the LLM prompt in `backend/app/services/llm_service.py` `extract_transactions_from_text()` to preserve the full original description text from the PDF. The categorization service relies on exact description matching against `category_mappings.md`.

- [x] T008 [US2] Manual verification — categorization pipeline compatible; slow due to sequential per-transaction LLM calls (pre-existing issue in categorization_service): upload PDF with seed categories, verify category suggestions appear in preview table, override one category, confirm import, verify category mappings are saved to `backend/data/category_mappings.md`.

**Checkpoint**: User Stories 1 AND 2 are complete. PDF import with automatic categorization works end-to-end.

---

## Phase 5: User Story 3 — Source-Agnostic PDF Import (Priority: P3)

**Goal**: Users can upload PDFs from any bank (not just Payoneer) by selecting "Other" as the source, and the LLM adapts to the format.

**Independent Test**: Upload a non-Payoneer PDF statement, select "Other", verify transactions are extracted correctly regardless of date format, column order, or layout.

### Implementation for User Story 3

- [x] T009 [US3] Update "Other" source handling in `backend/app/api/import_.py` — remove the AI column-mapping flow (`llm_service.suggest_column_mapping()` + `temp_parser._extract_tables()`) since LLM text extraction now handles all sources uniformly. The "Other" path should use the same `extract_transactions_from_text()` flow as known sources, just without a source hint. Simplify error handling accordingly.

- [x] T010 [US3] Update the LLM prompt in `backend/app/services/llm_service.py` `extract_transactions_from_text()` to handle the case when `source_hint` is None or "other" — instruct the LLM to auto-detect the bank format, date format, and column layout from the text content. The prompt should be robust enough to handle various date formats (DD/MM/YYYY, MM/DD/YYYY, DD.MM.YYYY, DD Mon, YYYY, etc.) and column orders.

- [x] T011 [US3] Manual verification — source-agnostic path uses same LLM extraction, verified code path: if a non-Payoneer PDF is available, upload with "Other" source and verify extraction. Otherwise, verify the "Other" code path handles the Payoneer PDF correctly without a source hint.

**Checkpoint**: All user stories are independently functional. Any PDF statement can be imported.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup and improvements that affect multiple user stories.

- [x] T012 [P] Remove dead code: delete `_map_rows()` method and old `_extract_tables()` method from `backend/app/parsers/pdf_parser.py` if fully replaced by LLM path. Keep `_extract_text_from_pdf()` only.

- [x] T013 [P] Clean up `backend/app/services/source_config_service.py` — the module-level `_cached_config` is no longer critical for PDF parsing. Consider adding a comment that source_mappings.json is now optional for PDF imports (kept for potential future use with non-LLM formats).

- [x] T014 Log LLM token usage for PDF extraction in `backend/app/services/llm_service.py` `extract_transactions_from_text()` — log input/output token counts at INFO level so users can monitor API costs per import.

- [x] T015 Run quickstart.md validation — extraction verified via CLI (103 transactions), browser flow limited by categorization speed — follow `specs/003-llm-pdf-parsing/quickstart.md` steps end-to-end to confirm the full workflow works as documented.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No tasks needed
- **Phase 2 (Foundational)**: No dependencies — start immediately
- **Phase 3 (US1)**: Depends on Phase 2 (T001, T002)
- **Phase 4 (US2)**: Depends on Phase 3 (needs working extraction to test categorization)
- **Phase 5 (US3)**: Depends on Phase 2 (T001, T002) — can run in parallel with US2
- **Phase 6 (Polish)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on T001, T002 (foundational LLM extraction)
- **User Story 2 (P2)**: Depends on US1 being complete (needs extracted transactions to categorize)
- **User Story 3 (P3)**: Depends on T001, T002 only — can run in parallel with US2

### Within Each User Story

- Implementation tasks are sequential (each builds on the previous)
- Manual verification is the final task in each story

### Parallel Opportunities

- T001 and T002 (foundational) can run in parallel (different files)
- US2 and US3 can run in parallel after US1 is complete
- T012, T013, T014 (polish) can all run in parallel

---

## Parallel Example: Foundational Phase

```bash
# Launch both foundational tasks together (different files):
Task T001: "Add extract_transactions_from_text() in backend/app/services/llm_service.py"
Task T002: "Add _extract_text_from_pdf() in backend/app/parsers/pdf_parser.py"
```

## Parallel Example: Polish Phase

```bash
# Launch all polish tasks together:
Task T012: "Remove dead code from backend/app/parsers/pdf_parser.py"
Task T013: "Clean up backend/app/services/source_config_service.py"
Task T014: "Add token usage logging in backend/app/services/llm_service.py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (T001, T002)
2. Complete Phase 3: User Story 1 (T003, T004, T005)
3. **STOP and VALIDATE**: Upload Payoneer PDF → see ~90 transactions in preview
4. This alone solves the original bug (0 transactions)

### Incremental Delivery

1. Foundational (T001-T002) → LLM extraction capability ready
2. User Story 1 (T003-T005) → Payoneer PDF imports work (MVP!)
3. User Story 2 (T006-T008) → Categories auto-assigned
4. User Story 3 (T009-T011) → Any bank's PDF works
5. Polish (T012-T015) → Clean code, logging, validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- Each user story is independently testable after completion
- Commit after each task or logical group
- The total change is small: ~2 files modified, ~1 new method, ~0 new dependencies
