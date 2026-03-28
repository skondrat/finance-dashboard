# Quickstart: PDF Statement Import

**Feature**: 002-pdf-statement-import | **Date**: 2026-03-27

## Prerequisites

1. **Python 3.11+** with `uv` package manager
2. **Node.js 18+** with npm
3. **Anthropic API key** — obtain from https://console.anthropic.com/

## Setup

### 1. Backend dependencies

```bash
cd backend
uv add pdfplumber anthropic
```

### 2. Environment configuration

Add to `backend/.env`:

```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
LLM_MODEL=claude-sonnet-4-6
```

### 3. Create data files

```bash
mkdir -p backend/data

# Create empty category mappings file
cat > backend/data/category_mappings.md << 'EOF'
# Category Mappings

| Description | Category |
|-------------|----------|
EOF

# Create source mappings config (fill in real column indices from your statements)
cat > backend/data/source_mappings.json << 'EOF'
{
  "payoneer": {
    "date_column": 0,
    "description_column": 1,
    "amount_column": 2,
    "currency_column": 3,
    "type_column": 4,
    "date_format": "%m/%d/%Y"
  },
  "monobank": {
    "date_column": 0,
    "description_column": 2,
    "amount_column": 3,
    "currency_column": 4,
    "type_column": 1,
    "date_format": "%d.%m.%Y"
  },
  "millenium": {
    "date_column": 0,
    "description_column": 1,
    "amount_column": 3,
    "currency_column": 2,
    "type_column": 4,
    "date_format": "%Y-%m-%d"
  }
}
EOF
```

### 4. Prepare seed categories (optional but recommended)

Create `backend/data/seed_categories.csv`:

```csv
Categories,Examples
Food & Dining,uber eats|mcdonalds|starbucks|bolt food
Entertainment,netflix|spotify|cinema|youtube premium
Transport,uber|bolt|fuel|parking
Salary,
Freelance Income,payoneer|upwork|fiverr
Utilities,electricity|water|internet|mobile
Shopping,amazon|allegro|zalando
Health,pharmacy|doctor|gym
Subscriptions,github|notion|chatgpt
```

### 5. Run database migration

```bash
cd backend
alembic revision --autogenerate -m "add source field to statement_import"
alembic upgrade head
```

### 6. Start the application

```bash
# Terminal 1 — Backend
cd backend
uvicorn app.main:app --reload

# Terminal 2 — Frontend
cd frontend
npm run dev
```

## Verify Setup

1. Open `http://localhost:3000` and log in
2. Navigate to Budget page
3. Click "Import" — you should see the source selector (Payoneer, Monobank, Millenium, Other)
4. Upload a PDF statement from a known source
5. Review extracted transactions with auto-assigned categories
6. Confirm import

## Key Files

| File | Purpose |
|------|---------|
| `backend/data/source_mappings.json` | Column mapping config for known PDF sources |
| `backend/data/category_mappings.md` | Persistent description→category mappings (auto-growing) |
| `backend/data/seed_categories.csv` | Initial category set with optional examples |
| `backend/.env` | API keys and model configuration |
| `backend/app/parsers/pdf_parser.py` | PDF table extraction logic |
| `backend/app/services/llm_service.py` | Anthropic Claude integration |
