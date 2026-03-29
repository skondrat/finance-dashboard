# Research: LLM Model Selector

## How LLM model is currently used

- **Decision**: All LLM calls go through `backend/app/services/llm_service.py`, which reads `settings.LLM_MODEL` from `backend/app/config.py`.
- **Rationale**: Single point of configuration — changing the model only requires overriding one value.
- **Current default**: `claude-sonnet-4-6` (hardcoded in config).

## Model override approach

- **Decision**: Add backend endpoints (GET/PUT) at `/budget/debug/model` to read and change the active model at runtime. Store the override in a module-level variable in `llm_service.py` that takes precedence over `settings.LLM_MODEL`.
- **Rationale**: Simplest approach — no database changes, no header plumbing through every API call, no Zustand store needed on frontend. The backend holds the state and the frontend just reads/writes it via API.
- **Alternatives considered**:
  - *Request header per call*: Would require threading a header through every LLM-calling endpoint and passing it down to `llm_service`. More complex for no practical benefit since this is a single-user debug tool.
  - *Frontend-only state + query param*: Every LLM-triggering call would need the param. Easy to miss one.
  - *Database setting*: Overkill for a debug toggle.

## Debug menu placement

- **Decision**: Add the model selector below the "Reset all data" button in the existing `debug-menu.tsx` component.
- **Rationale**: Matches the spec requirement. The debug menu already toggles open/closed and has the right visual treatment.

## Default model

- **Decision**: Change the default from `claude-sonnet-4-6` to `claude-haiku-4-5` per spec requirement.
- **Rationale**: User requested haiku as default for cost savings. The config default will be updated.
