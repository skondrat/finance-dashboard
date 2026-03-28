# Tasks: PDF Statement Import with Intelligent Categorization

**Input**: Design documents from `/specs/002-pdf-statement-import/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md

**Tests**: Not explicitly requested — test tasks omitted.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add dependencies, config, and data files needed by all user stories

- [x] T001 Add `pdfplumber` and `anthropic` dependencies to `backend/pyproject.toml` and run `uv lock`
- [x] T002 [P] Add `ANTHROPIC_API_KEY` and `LLM_MODEL` (default: `claude-sonnet-4-6`) settings to `backend/app/config.py` using existing pydantic-settings pattern
- [x] T003 [P] Update `backend/.env.example` with `ANTHROPIC_API_KEY` and `LLM_MODEL` placeholders
- [x] T004 [P] Create `backend/data/source_mappings.json` with placeholder column mappings for Payoneer, Monobank, Millenium (including `date_column`, `description_column`, `amount_column`, `currency_column`, `type_column`, `debit_value`, `credit_value`, `date_format`, `table_index` per research.md R4 and FR-004)
- [x] T005 [P] Create empty `backend/data/category_mappings.md` with header row only (per FR-006 and research.md R3)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core services and model changes that MUST be complete before any user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Add `source` field (String, nullable) to `StatementImport` model in `backend/app/models/statement_import.py` and add `"pdf"` to allowed format values. Create Alembic migration.
- [x] T007 [P] Create `backend/app/services/llm_service.py` — Anthropic SDK wrapper with: `suggest_category(description, existing_mappings, known_categories)` and `suggest_column_mapping(table_data)` functions. Use settings from config.py. Implement 30-second timeout and 1 automatic retry per FR-019.
- [x] T008 [P] Create `backend/app/services/mapping_file_service.py` — read/write category_mappings.md: `load_mappings()` returns dict (lowercase description → category), `save_mapping(description, category)` appends/overwrites entry, `save_bulk_mappings(mappings_dict)` for batch updates on confirm. Handle auto-creation if file missing (FR-006), handle corrupted file gracefully (FR-021).
- [x] T009 [P] Create `backend/app/parsers/pdf_parser.py` — `PdfParser` class extending `StatementParser` using pdfplumber. Accept source mapping config dict for known sources. Extract tables, apply column mapping, parse dates per source format, map debit/credit indicator to amount sign (FR-003). Skip rows with missing Description or Amount (FR-018). Validate PDF is not password-protected (FR-017), check file size ≤ 10 MB (FR-002).
- [x] T010 Register `PdfParser` with `StatementFormat.PDF` in `backend/app/parsers/registry.py`
- [x] T011 [P] Create source mapping config loader — function to load and validate `backend/data/source_mappings.json`, return config for a given source name. Raise error if file missing/malformed (FR-020).

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 — Import PDF from Known Source (Priority: P1) 🎯 MVP

**Goal**: User selects source (Payoneer/Monobank/Millenium), uploads PDF, sees extracted transactions

**Independent Test**: Upload a sample PDF, select "Payoneer", verify transactions appear with correct Date, Description, Amount, Currency, and Type fields

### Implementation for User Story 1

- [x] T012 [US1] Extend `ImportUploadResponse` and related schemas in `backend/app/schemas/budget.py` — add `source` field to request, add `currency`, `type`, `category_id`, `category_name`, `category_source`, `skipped_count` to response per contracts/api.md
- [x] T013 [US1] Extend upload endpoint in `backend/app/api/import_.py` — accept `source` form field (required for PDF, ignored for other formats), load source mapping config, pass to PdfParser, return extended response. Add error responses: 400 for invalid PDF/missing source, 422 for no extractable tables, 503 for AI unavailable.
- [x] T014 [US1] Extend `import_service.create_import()` in `backend/app/services/import_service.py` — accept `source` parameter, detect PDF format, use PdfParser with source config for extraction, store source on StatementImport record
- [x] T015 [US1] Add source selector dropdown (Payoneer, Monobank, Millenium, Other) to `frontend/src/components/budget/import-modal.tsx` — show selector before/alongside file upload, require selection when PDF is uploaded
- [x] T016 [US1] Extend `useImportUpload` mutation in `frontend/src/lib/queries/budget.ts` — pass `source` as additional FormData field, add `.pdf` to accepted file types in dropzone config
- [x] T017 [US1] Add error handling in `frontend/src/components/budget/import-modal.tsx` for structured error messages (error type + suggested action per FR-013)

**Checkpoint**: User can upload a known-source PDF and see extracted transactions in preview

---

## Phase 4: User Story 2 — Automatic and Learning Categorization (Priority: P1)

**Goal**: Transactions auto-categorized via mapping file → keyword rules → AI fallback. Mappings saved on confirm.

**Independent Test**: Import a statement with both previously-seen and new descriptions, verify auto-categorization for known and AI-suggested for new

### Implementation for User Story 2

- [x] T018 [US2] Extend `categorization_service.py` in `backend/app/services/categorization_service.py` — implement category resolution chain: (1) case-insensitive exact match from mapping_file_service, (2) existing AutoCatRule keyword match, (3) AI suggestion via llm_service with up to 50 recent examples (FR-008). Return category_id + category_source ("mapping", "rule", "ai", "none").
- [x] T019 [US2] Integrate categorization into import flow in `backend/app/services/import_service.py` — after PDF extraction, run categorization for each transaction. Check AI availability before starting if any new descriptions exist (FR-014). If AI returns unknown category or empty response, leave uncategorized (FR-016).
- [x] T020 [US2] Implement mapping persistence on confirm in `backend/app/services/import_service.py` — on `confirm_import()`, call `mapping_file_service.save_bulk_mappings()` with final description→category pairs. Overwrite existing mappings (FR-011). Return `mappings_updated` count.
- [x] T021 [US2] Extend confirm endpoint in `backend/app/api/import_.py` — accept `category_overrides` JSON body per contracts/api.md, apply overrides before saving mappings

**Checkpoint**: Categorization chain works end-to-end, mappings persist across imports

---

## Phase 5: User Story 3 — Review and Confirm Import (Priority: P1)

**Goal**: User reviews all transactions with categories in a scrollable table, can edit categories via dropdown, confirm or cancel

**Independent Test**: Complete import to review stage, verify all transactions displayed with editable categories, confirm saves data and mappings, cancel discards everything

### Implementation for User Story 3

- [x] T022 [US3] Add `GET /api/v1/budget/import/categories` endpoint in `backend/app/api/import_.py` — return list of all known categories (from database + seed CSV) with id, name, color per contracts/api.md
- [x] T023 [US3] Update preview table in `frontend/src/components/budget/import-modal.tsx` — display scrollable table with Date, Description, Amount, Currency, Type, Category, and category_source indicator (mapping/rule/ai/none). Show skipped rows count.
- [x] T024 [US3] Add category dropdown selector to each transaction row in `frontend/src/components/budget/import-modal.tsx` — fetch categories via new query hook, allow changing category per row, track overrides locally
- [x] T025 [US3] Add categories query hook in `frontend/src/lib/queries/budget.ts` — `useImportCategories()` fetching from `GET /api/v1/budget/import/categories`
- [x] T026 [US3] Extend `useConfirmImport` mutation in `frontend/src/lib/queries/budget.ts` — send `category_overrides` array with the confirm request

**Checkpoint**: Full import workflow functional — upload, review with category editing, confirm/cancel

---

## Phase 6: User Story 4 — Import from Unknown Source (Priority: P2)

**Goal**: "Other" source uses AI to determine column mapping from PDF table content

**Independent Test**: Upload a PDF from an unsupported bank with "Other" selected, verify AI maps columns correctly and transactions appear for review

### Implementation for User Story 4

- [x] T027 [US4] Implement AI column mapping logic in `backend/app/parsers/pdf_parser.py` — when source is "other", extract table headers + first 5 rows, call `llm_service.suggest_column_mapping()`, validate response contains all 5 required fields (FR-005), apply dynamic mapping to extract transactions
- [x] T028 [US4] Extend upload flow in `backend/app/services/import_service.py` — when source is "other", pass raw table data to PdfParser for AI-based mapping instead of config-based mapping. Handle AI failure with structured error message.
- [x] T029 [US4] Handle "Other" source in frontend `frontend/src/components/budget/import-modal.tsx` — when "Other" is selected, show appropriate loading state during AI column mapping, display error if AI fails

**Checkpoint**: Any PDF can be imported regardless of source

---

## Phase 7: User Story 5 — Upload Seed Categories (Priority: P2)

**Goal**: User uploads CSV with initial categories and optional example descriptions. First import prompts for CSV if no categories exist.

**Independent Test**: Upload a CSV with categories, verify they appear in category selector during import review

### Implementation for User Story 5

- [x] T030 [US5] Create seed categories CSV parser in `backend/app/services/seed_service.py` — parse CSV with "Categories" column (required) and optional "Examples" column (pipe-separated). Validate format, return parsed data. Error on missing Categories column (FR-015).
- [x] T031 [US5] Add `POST /api/v1/budget/import/seed-categories` endpoint in `backend/app/api/import_.py` — accept CSV upload, create Category records for new names, pre-populate category_mappings.md with examples if provided. Return categories_loaded and examples_loaded counts per contracts/api.md.
- [x] T032 [US5] Add first-import category check in `backend/app/api/import_.py` — before processing PDF upload, check if any categories exist in the system. If not, return a specific response indicating seed categories are required (FR-015).
- [x] T033 [US5] Add seed categories upload UI in `frontend/src/components/budget/import-modal.tsx` — when first-import check returns "no categories", show prompt to upload seed CSV before proceeding. Include file picker for CSV and success/error feedback.

**Checkpoint**: Category bootstrapping works, first import experience is guided

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Error handling standardization and resilience improvements

- [x] T034 Standardize all error responses across import endpoints in `backend/app/api/import_.py` — ensure every error includes error type + suggested action per FR-013
- [x] T035 [P] Add source_mappings.json validation on app startup or first use in `backend/app/services/import_service.py` — log warning if file missing/malformed (FR-020)
- [x] T036 [P] Add category_mappings.md corruption recovery in `backend/app/services/mapping_file_service.py` — if parse fails, log warning, return empty dict, recreate on next save (FR-021)
- [x] T037 Run quickstart.md validation — follow setup steps in `specs/002-pdf-statement-import/quickstart.md` end-to-end to verify documentation accuracy

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational (Phase 2) — No dependencies on other stories
- **US2 (Phase 4)**: Depends on Foundational (Phase 2) — Integrates with US1 import flow but can be developed and tested with mock data
- **US3 (Phase 5)**: Depends on US1 (Phase 3) for preview data — Integrates with US2 for category display
- **US4 (Phase 6)**: Depends on Foundational (Phase 2) — Independent of US1/US2/US3 (different parsing path)
- **US5 (Phase 7)**: Depends on Foundational (Phase 2) — Independent of other stories (separate endpoint)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Foundation only — **MVP target**
- **US2 (P1)**: Foundation + imports US1's import_service flow
- **US3 (P1)**: Foundation + imports US1's preview data + US2's categorization
- **US4 (P2)**: Foundation only — parallel with US1/US2/US3
- **US5 (P2)**: Foundation only — parallel with US1/US2/US3

### Within Each User Story

- Models/schemas before services
- Services before API endpoints
- Backend before frontend
- Core logic before error handling

### Parallel Opportunities

**Phase 1**: T002, T003, T004, T005 all run in parallel
**Phase 2**: T007, T008, T009, T011 all run in parallel (after T006 migration)
**Phase 3+**: US4 and US5 can run in parallel with US1/US2/US3

---

## Parallel Example: Phase 2

```bash
# After T006 (migration), launch all foundational services in parallel:
Task T007: "Create llm_service.py in backend/app/services/llm_service.py"
Task T008: "Create mapping_file_service.py in backend/app/services/mapping_file_service.py"
Task T009: "Create pdf_parser.py in backend/app/parsers/pdf_parser.py"
Task T011: "Create source mapping config loader"
```

## Parallel Example: User Stories

```bash
# After Phase 2, these stories can proceed in parallel:
US1 (Phase 3): PDF import from known source
US4 (Phase 6): AI column mapping for "Other" source
US5 (Phase 7): Seed categories upload
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Upload a known-source PDF, verify extraction works
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → PDF import works → **MVP!**
3. Add US2 → Auto-categorization works
4. Add US3 → Review + edit categories → **Full P1 feature complete**
5. Add US4 → "Other" source support
6. Add US5 → Seed categories + first-import guidance
7. Polish → Error standardization, resilience

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently testable at its checkpoint
- Commit after each task or logical group
- Source mappings JSON has placeholder values — user fills in real column indices from sample statements
