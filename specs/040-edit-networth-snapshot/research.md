# Research: Edit Previous Networth Snapshots

## Existing Infrastructure

### Backend

1. **NetworthSnapshot model** (`backend/app/models/networth_snapshot.py`):
   - Fields: id, user_id, snapshot_month ("YYYY-MM"), total_networth, currency, source ("auto"/"manual"), breakdown (JSON), created_at, updated_at
   - Unique constraint: `(user_id, snapshot_month)` — one snapshot per month
   - Breakdown format: `[{name, balance, source, account_type}, ...]`

2. **Existing endpoints** (`backend/app/api/networth.py`):
   - `GET /networth/history` — returns all snapshots (with breakdown)
   - `POST /networth/snapshots` — create manual snapshot (no breakdown)
   - `DELETE /networth/snapshots/manual` — bulk delete manual entries
   - **Missing**: No PATCH/PUT endpoint for updating a snapshot

3. **Schemas** (`backend/app/schemas/networth.py`):
   - `NetworthSnapshotResponse` already includes `breakdown: Optional[list]` and `id` is NOT included (only `snapshot_month`)
   - Need to add snapshot `id` to the history response for the PATCH target

### Frontend

1. **SettingsDropdown** (inline in `networth/page.tsx`):
   - Manages open state with `useState(false)`, click-outside detection
   - Options: Show Debts (checkbox), Import previous networth (opens modal), Remove all manual entries
   - Pattern: callbacks passed from parent, dropdown closes before triggering callback

2. **ImportNetworthModal** (`components/networth/import-networth-modal.tsx`):
   - Props: `{ open, onClose }`
   - Month/year selectors with MONTHS constant and `getYearOptions()` helper
   - Single `value` input for total networth
   - Uses `useCreateManualSnapshot()` mutation
   - Resets state on close, handles error display

3. **Query hooks** (`lib/queries/networth.ts`):
   - `useNetworthHistory()` — fetches history with currency from store
   - `useCreateManualSnapshot()` — POST mutation, invalidates `["networth"]`
   - All mutations invalidate `queryKey: ["networth"]` on success

## Decisions

### Backend Endpoint

- **Decision**: Add `PATCH /api/v1/networth/snapshots/{snapshot_id}` endpoint
- **Rationale**: Follows existing PATCH pattern used for account updates. Takes `total_networth` and `breakdown` as optional fields.
- **Alternative rejected**: PUT (full replace) — PATCH is simpler and matches existing patterns

### Snapshot ID in History

- **Decision**: Add `id` field to `NetworthSnapshotResponse` schema
- **Rationale**: The edit modal needs to identify which snapshot to PATCH. Currently history response omits `id`.

### Frontend Component

- **Decision**: Create `EditSnapshotModal` following `ImportNetworthModal` pattern
- **Rationale**: Same modal shell, same month/year selectors, same button patterns — just adds breakdown editing
- **Data loading**: Use existing `useNetworthHistory()` to get snapshot list, find the selected month's snapshot to pre-populate the form

### Month/Year Selector Behavior

- **Decision**: Month/year selector filters from the list of existing snapshots, not all possible months
- **Rationale**: The spec says Save is disabled for months without snapshots. Showing only months with data is simpler and more intuitive.
- **Alternative rejected**: Free-form month picker with disabled Save — adds complexity for no user benefit

### Live Total Calculation

- **Decision**: Compute total as sum of all breakdown balance fields in real-time using controlled inputs
- **Rationale**: Simple useState per entry, total is derived. No debouncing needed since it's local state math.
