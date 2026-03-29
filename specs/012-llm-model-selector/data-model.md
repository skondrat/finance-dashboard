# Data Model: LLM Model Selector

## Entities

### LLM Model Override

- **Storage**: In-memory module-level variable (no database changes)
- **Field**: `model_override` — nullable string
- **Allowed values**: `claude-haiku-4-5`, `claude-sonnet-4-6`
- **Default**: `None` (falls back to `settings.LLM_MODEL`, which defaults to `claude-haiku-4-5`)
- **Lifecycle**: Resets on server restart

No database schema changes required.
