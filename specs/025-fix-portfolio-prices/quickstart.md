# Quickstart: Fix Portfolio Prices

**Feature**: 025-fix-portfolio-prices

## Prerequisites

- Backend running at `http://localhost:8000`
- Frontend running at `http://localhost:3000`
- Finnhub API key configured in `backend/.env` as `FINNHUB_API_KEY`

## Setup

1. Install missing Python packages:
   ```bash
   cd backend && pip install finnhub-python pycoingecko
   ```

2. Fix asset data in database:
   ```bash
   # Run via SQLite or a migration script
   UPDATE assets SET asset_type = 'crypto' WHERE ticker IN ('BTC', 'ETH');
   UPDATE assets SET ticker = 'IUAA.DE' WHERE ticker = 'IUAA';
   UPDATE assets SET ticker = 'ISAC.DE' WHERE ticker = 'ISAC';
   ```

3. Restart backend server

## Verification

1. Navigate to `http://localhost:3000/portfolio`
2. Click "Refresh Prices" button
3. Verify all positions show non-zero current prices and values
4. Verify KPIs (Net Worth, Total Return, Return %) show correct calculations
