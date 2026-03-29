# Quickstart: LLM Model Selector

## Files to modify

1. **`backend/app/config.py`** — Change `LLM_MODEL` default from `claude-sonnet-4-6` to `claude-haiku-4-5`
2. **`backend/app/services/llm_service.py`** — Add `_model_override` variable + `get_model()`/`set_model()` functions. Update all `settings.LLM_MODEL` references to use `get_model()`.
3. **`backend/app/api/import_.py`** — Add GET/PUT endpoints for `/budget/debug/model`
4. **`frontend/src/components/budget/debug-menu.tsx`** — Add model selector dropdown

## Implementation order

1. Backend: config default change
2. Backend: llm_service model override functions
3. Backend: debug model API endpoints
4. Frontend: model selector in debug menu
