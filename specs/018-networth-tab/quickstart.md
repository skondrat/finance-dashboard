# Quickstart: Networth Tab

**Branch**: `018-networth-tab` | **Date**: 2026-03-29

## Prerequisites

- Python 3.11+ with virtualenv
- Node.js 18+
- SQLite (included with Python)

## Setup

### Backend

```bash
cd backend
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head        # Apply migrations including new networth_accounts table
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                 # Starts on localhost:3000
```

## Verify

1. Login at http://localhost:3000/login
2. Click the "NETWORTH" tab in the top navigation
3. Click "Add Account" to create a manual account
4. Verify the account appears in the breakdown table
5. Click on a balance value to edit it inline
6. Verify total net worth updates

## Key Files (New)

| File | Purpose |
|------|---------|
| `backend/app/models/networth_account.py` | ORM model |
| `backend/app/schemas/networth.py` | Pydantic schemas |
| `backend/app/api/networth.py` | API endpoints |
| `frontend/src/app/(dashboard)/networth/page.tsx` | Page component |
| `frontend/src/components/networth/summary-kpi.tsx` | Net worth total display |
| `frontend/src/components/networth/accounts-table.tsx` | Breakdown table |
| `frontend/src/components/networth/add-account-modal.tsx` | Add/edit form |
| `frontend/src/lib/queries/networth.ts` | TanStack Query hooks |

## Key Files (Modified)

| File | Change |
|------|--------|
| `backend/app/main.py` | Register networth router |
| `frontend/src/components/layout/top-bar.tsx` | Add NETWORTH tab |
