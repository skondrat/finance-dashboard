# Research: ATM Cash Expense Categorization

**Date**: 2026-03-29 | **Branch**: `008-atm-cash-categorization`

## R1: Where should split state live — frontend or database?

**Decision**: Frontend-managed split state with backend LLM parsing endpoint.

**Rationale**: The existing import preview uses row indices for category overrides. Modifying DB rows during split would shift indices and break overrides the user already set. Keeping split state in frontend avoids this, keeps undo trivial (discard local state), and requires only a small extension to the confirm endpoint.

**Alternatives considered**:
- DB-side split (replace BudgetTransaction rows): Breaks row index-based override system; requires index remapping.
- Hybrid with `split_group_id` column: Requires DB migration for a preview-only feature; over-engineered.

## R2: How to get structured LLM output for cash note parsing

**Decision**: Use Anthropic structured output via `client.messages.parse()` with a Pydantic model, same pattern as `extract_transactions_from_text` in `llm_service.py`.

**Rationale**: The project already uses this pattern successfully for PDF transaction extraction. It guarantees well-typed JSON output without manual parsing. A single LLM call with structured output covers both amount extraction and category matching.

**Alternatives considered**:
- Tool use: Works but more verbose; structured output is simpler for this use case.
- Free-text response + regex parsing: Fragile, error-prone.

## R3: How to handle split rows in the confirm flow

**Decision**: Extend `ConfirmImportRequest` with an optional `splits` field. During confirm, the backend replaces split original transactions with new ones.

**Rationale**: The confirm endpoint already handles `category_overrides` to modify preview transactions. Adding `splits` follows the same pattern — preview transactions are modified at confirm time based on frontend state.

**Alternatives considered**:
- New confirm endpoint for splits: Unnecessary complexity; one confirm action should handle everything.
- Frontend-only (no backend split handling): Would lose split data if page refreshes during preview; confirm must persist splits.

## R4: Client-side validation of notes before LLM call

**Decision**: Frontend validates that notes contain at least one numeric amount using a simple regex (`/\d+/`). Backend also validates before calling LLM.

**Rationale**: Saves an unnecessary LLM call and gives instant feedback. Double validation (frontend + backend) follows the existing pattern in the codebase.

**Alternatives considered**:
- LLM-only validation: Wastes API calls on obviously invalid input.
- Complex client-side NLP: Over-engineered; a simple number check suffices.
