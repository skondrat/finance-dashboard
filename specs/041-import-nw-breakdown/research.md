# Research: Import Networth with Account Breakdown

## Existing Infrastructure

### Current Import Modal (`import-networth-modal.tsx`)

- Simple form: month/year selector + single "Total Networth" number input
- Uses `useCreateManualSnapshot()` which POSTs `{ snapshot_month, total_networth, currency }`
- No breakdown field — snapshots created via import have `breakdown: null`

### Edit Modal (`edit-snapshot-modal.tsx`)

- Uses `useNetworthHistory()` to load snapshot data and populate breakdown fields
- Shows one row per breakdown entry: account name label + editable balance input
- Live total = sum of all balances
- This is the target layout for the import modal

### Backend POST Endpoint (`POST /api/v1/networth/snapshots`)

- Currently accepts `ManualSnapshotCreate { snapshot_month, total_networth, currency }`
- Creates snapshot with `source="manual"` and `breakdown=None`
- Need to add optional `breakdown` field

### Account List Source

- `useNetworthSummary()` returns `accounts: NetworthSummaryAccount[]` with `{ name, source, account_type }` for all manual + investment accounts
- This is the same data that `capture_snapshot()` uses to build breakdowns for auto snapshots

## Decisions

### Account List Source for Import

- **Decision**: Use `useNetworthSummary()` to get the current account list and pre-populate empty breakdown rows
- **Rationale**: Same source the auto-capture uses. Gives consistent account names and types.
- **Alternative rejected**: Using `useNetworthHistory()` to copy a previous month's breakdown — doesn't help for the first import

### Backend Change

- **Decision**: Add optional `breakdown: list | None` field to `ManualSnapshotCreate` schema
- **Rationale**: Minimal change — the endpoint already creates the snapshot, just needs to pass through the breakdown data
- **Alternative rejected**: New endpoint — unnecessary, the existing one just needs the extra field

### Default Balances

- **Decision**: All balances default to 0 when the Import modal opens
- **Rationale**: These are historical values the user needs to fill in — we can't guess what they were
