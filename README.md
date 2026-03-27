# Finance Dashboard

Personal finance dashboard combining **portfolio tracking**, **budgeting**, and **cashflow visualization**. Built with FastAPI + Next.js 15, following the Editorial Ledger design system.

## Prerequisites

- **Python 3.11+** (managed via [uv](https://docs.astral.sh/uv/))
- **Node.js 20+**
- **npm**

Install uv if you don't have it:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

## Quick Start

### 1. Backend

```bash
cd backend

# Create .env from example
cp .env.example .env

# Install dependencies
uv sync

# Run database migrations
uv run alembic upgrade head

# Start development server
uv run uvicorn app.main:app --reload --port 8000
```

API available at http://localhost:8000. Interactive docs at http://localhost:8000/docs.

### 2. Frontend

```bash
cd frontend

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1" > .env.local

# Install dependencies
npm install

# Start development server
npm run dev
```

App available at http://localhost:3000.

### 3. First Use

1. Open http://localhost:3000 — you'll be redirected to the **login page**
2. Click **Register** to create an account (default budget categories are seeded automatically)
3. You'll land on the **Portfolio** tab — add accounts and transactions to see data
4. Switch to **Budget** to import bank statements or add transactions manually
5. Use the **EUR/USD** toggle in the top bar to switch display currency
6. Toggle **dark/light** theme with the sun/moon icon

## Docker Compose

Alternatively, run both services with Docker:

```bash
docker compose up --build
```

- Backend: http://localhost:8000
- Frontend: http://localhost:3000

SQLite database is stored in `./data/finance.db` (mounted volume).

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite:///./data/finance.db` | SQLite database path |
| `JWT_SECRET_KEY` | `change-me-to-a-random-secret` | Secret for JWT signing |
| `JWT_ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `15` | Access token lifetime |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | Refresh token lifetime |
| `FINNHUB_API_KEY` | (empty) | Finnhub free-tier API key for stock prices |

### Frontend (`frontend/.env.local`)

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api/v1` | Backend API base URL |

## Testing

```bash
# Backend
cd backend && uv run pytest

# Frontend
cd frontend && npm test
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI, SQLAlchemy 2.0, Alembic, SQLite |
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS 4 |
| Charts | Recharts, d3-sankey |
| State | TanStack Query (server), Zustand (client) |
| Auth | JWT (python-jose, passlib/bcrypt) |
| Design | Editorial Ledger (monochromatic, borderless, typographic) |

See [IMPLEMENTATION.md](IMPLEMENTATION.md) for full implementation details.
