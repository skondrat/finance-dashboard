# API Contract: LLM Model Selector

## GET /api/v1/budget/debug/model

Get the currently active LLM model.

**Response** `200 OK`:
```json
{
  "model": "claude-haiku-4-5",
  "available_models": ["claude-haiku-4-5", "claude-sonnet-4-6"]
}
```

## PUT /api/v1/budget/debug/model

Set the active LLM model.

**Request**:
```json
{
  "model": "claude-sonnet-4-6"
}
```

**Response** `200 OK`:
```json
{
  "model": "claude-sonnet-4-6"
}
```

**Error** `400 Bad Request` (invalid model):
```json
{
  "detail": "Invalid model. Must be one of: claude-haiku-4-5, claude-sonnet-4-6"
}
```
