# Tasks: LLM Model Selector

**Input**: Design documents from `/specs/012-llm-model-selector/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Change the default model and add model override infrastructure to the backend.

- [x] T001 Change LLM_MODEL default from `claude-sonnet-4-6` to `claude-haiku-4-5` in `backend/app/config.py`
- [x] T002 Add `_model_override` variable, `get_model()`, and `set_model()` functions to `backend/app/services/llm_service.py`. `get_model()` returns `_model_override` if set, otherwise `settings.LLM_MODEL`. Replace all `settings.LLM_MODEL` references with `get_model()`.

**Checkpoint**: Backend uses haiku by default and supports model override via function call.

---

## Phase 2: Foundational (API Endpoints)

**Purpose**: Expose GET/PUT endpoints so the frontend can read and change the active model.

- [x] T003 Add `AVAILABLE_MODELS` constant (`["claude-haiku-4-5", "claude-sonnet-4-6"]`) and GET `/budget/debug/model` endpoint returning `{"model": ..., "available_models": [...]}` in `backend/app/api/import_.py`. Use `llm_service.get_model()`.
- [x] T004 Add PUT `/budget/debug/model` endpoint accepting `{"model": "..."}` in `backend/app/api/import_.py`. Validate against `AVAILABLE_MODELS`, call `llm_service.set_model()`, return `{"model": "..."}`.

**Checkpoint**: API endpoints work — can test with curl.

---

## Phase 3: User Story 1 - Select LLM Model (Priority: P1) — MVP

**Goal**: User can open the debug menu and switch between haiku and sonnet models.

**Independent Test**: Open debug menu, see model selector, change model, verify via GET endpoint that model changed.

### Implementation for User Story 1

- [x] T005 [US1] Add model selector UI to `frontend/src/components/budget/debug-menu.tsx`: fetch current model and available models on mount via GET `/budget/debug/model`, render a dropdown/toggle below the "Reset all data" button, call PUT `/budget/debug/model` on change, show the active model label.

**Checkpoint**: User Story 1 complete — model can be selected from the debug menu and is used for all LLM calls.

---

## Phase 4: User Story 2 - Model Selection Persists During Session (Priority: P2)

**Goal**: Model selection survives page navigations within the same browser session.

**Independent Test**: Select sonnet, navigate away, return to budget page, open debug menu — should still show sonnet.

### Implementation for User Story 2

- [x] T006 [US2] Verify that the backend in-memory `_model_override` persists across requests (it does by design — the variable lives in the Python process). No additional work needed if backend is not restarted between navigations. Mark as verified.

**Checkpoint**: Model selection persists across page navigations (backend holds state in-process).

---

## Phase 5: Polish & Cross-Cutting Concerns

- [x] T007 Verify the full flow end-to-end: change model in debug menu, import a PDF statement, confirm LLM calls use the selected model (check backend logs for model name).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on T002 (get_model/set_model functions)
- **User Story 1 (Phase 3)**: Depends on Phase 2 (API endpoints must exist)
- **User Story 2 (Phase 4)**: No code changes — verification only, can run after Phase 2
- **Polish (Phase 5)**: Depends on Phase 3 completion

### Within Each Phase

- T001 and T002 can run in parallel (different files)
- T003 and T004 are sequential (same file, T003 adds the constant T004 uses)
- T005 depends on T003/T004 (needs API to call)

### Parallel Opportunities

```text
# Phase 1 — parallel:
T001: backend/app/config.py (default change)
T002: backend/app/services/llm_service.py (override functions)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Config default + model override functions
2. Complete Phase 2: API endpoints
3. Complete Phase 3: Debug menu selector
4. **STOP and VALIDATE**: Test model switching from UI
5. Deploy if ready

### Incremental Delivery

1. T001 + T002 → Backend model override ready
2. T003 + T004 → API ready (testable with curl)
3. T005 → Full UI flow (MVP complete)
4. T006 → Verify session persistence
5. T007 → End-to-end validation

---

## Notes

- Total tasks: 7
- User Story 1: 1 task (T005)
- User Story 2: 1 task (T006 — verification only)
- Setup/Foundational: 4 tasks (T001–T004)
- Polish: 1 task (T007)
- This is a small feature — most complexity is in the foundational backend work
