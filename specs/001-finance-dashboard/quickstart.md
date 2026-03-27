# Quickstart: Finance Dashboard

## Prerequisites

- Python 3.11+ (managed via uv)
- Node.js 20+ (LTS)
- pnpm (or npm)
- [uv](https://docs.astral.sh/uv/) (`curl -LsSf https://astral.sh/uv/install.sh | sh`)

## Project Setup

### Backend

```bash
cd backend
uv sync

# Initialize database
uv run alembic upgrade head

# Run development server
uv run uvicorn app.main:app --reload --port 8000
```

API available at `http://localhost:8000`. Docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
pnpm install

# Run development server
pnpm dev
```

App available at `http://localhost:3000`.

### Docker Compose (alternative)

```bash
docker compose up --build
```

Runs both backend (port 8000) and frontend (port 3000). SQLite database stored in `./data/finance.db` (mounted volume).

## Key Backend Dependencies

| Package | Purpose |
|---------|---------|
| fastapi | Web framework |
| sqlalchemy[sqlite] | ORM + SQLite |
| alembic | Database migrations |
| python-jose[cryptography] | JWT tokens |
| passlib[bcrypt] | Password hashing |
| httpx | HTTP client (price/FX APIs) |
| ofxparse | OFX statement parsing |
| mt-940 | MT940 statement parsing |
| finnhub-python | Stock/ETF/bond prices |
| pycoingecko | Crypto prices |
| pytest | Testing |
| uvicorn | ASGI server |

## Key Frontend Dependencies

| Package | Purpose |
|---------|---------|
| next | Framework (App Router) |
| typescript | Language |
| tailwindcss | Styling with design tokens |
| @shadcn/ui | Accessible UI primitives |
| recharts | Charts (area, bar, line, pie, donut) |
| d3-sankey | Sankey diagram layout |
| @tanstack/react-query | Server state management |
| zustand | Client state (currency, theme, filters) |
| react-hook-form + zod | Form handling + validation |
| react-dropzone | File upload |
| vitest + @testing-library/react | Testing |

## Environment Variables

### Backend (`backend/.env`)

```
DATABASE_URL=sqlite:///./data/finance.db
JWT_SECRET_KEY=<generate-a-random-secret>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
FINNHUB_API_KEY=<free-tier-key>
```

### Frontend (`frontend/.env.local`)

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## Testing

```bash
# Backend
cd backend && uv run pytest

# Frontend
cd frontend && pnpm test
```
