# Quickstart: Networth Manual Import & Composition Donut Chart

**Branch**: `032-networth-manual-donut`

## Prerequisites

- Python 3.11+ with pip
- Node.js 18+ with npm
- SQLite (bundled with Python)

## Setup

```bash
# Backend
cd backend
pip install -r requirements.txt
alembic upgrade head    # Applies new migration for 'source' column
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev             # Starts on port 3000
```

## Key Files to Modify

### Backend
| File | Change |
|------|--------|
| `backend/alembic/versions/<new>_add_source_to_networth_snapshots.py` | New migration: add `source` column |
| `backend/app/models/networth_snapshot.py` | Add `source` field to model |
| `backend/app/api/networth.py` | Add 3 new endpoints: POST snapshots, DELETE snapshots/manual, GET composition |
| `backend/app/services/networth_service.py` | Add composition aggregation logic |

### Frontend
| File | Change |
|------|--------|
| `frontend/src/app/(dashboard)/networth/page.tsx` | Extend gear dropdown, add donut chart to layout |
| `frontend/src/components/networth/import-networth-modal.tsx` | New: month/year/value import modal |
| `frontend/src/components/networth/networth-composition.tsx` | New: donut chart with Account/Type selector |
| `frontend/src/lib/queries/networth.ts` | Add composition query hook and manual snapshot mutations |

## Testing

```bash
# Backend tests
cd backend && pytest

# Manual verification
# 1. Open http://localhost:3000/networth
# 2. Click gear → "Import previous networth" → fill modal → submit
# 3. Verify new data point on chart
# 4. Check donut chart shows composition with Account/Type toggle
# 5. Click gear → "Remove all manual NW entries" → confirm → verify removal
```
