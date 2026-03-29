import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import (
    accounts, transactions, portfolio, categories, import_, budget, income,
    exchange_rates, cashflow, budget_charts, users, auth, networth, subscriptions,
)

logger = logging.getLogger(__name__)

app = FastAPI(title="Finance Dashboard API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(accounts.router)
app.include_router(transactions.router)
app.include_router(portfolio.router)
app.include_router(categories.router)
app.include_router(import_.router)
app.include_router(budget.router)
app.include_router(income.router)
app.include_router(exchange_rates.router)
app.include_router(cashflow.router)
app.include_router(budget_charts.router)
app.include_router(networth.router)
app.include_router(users.router)
app.include_router(subscriptions.router)


@app.on_event("startup")
def _validate_source_mappings():
    """Validate source_mappings.json on startup (T035, FR-020)."""
    from app.services.source_config_service import validate_config
    is_valid, message = validate_config()
    if not is_valid:
        logger.warning("Source mappings validation: %s", message)
    else:
        logger.info("Source mappings validation: %s", message)


@app.get("/api/v1/health")
def health():
    return {"status": "ok"}
