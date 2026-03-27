from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import (
    accounts, transactions, portfolio, categories, import_, budget, income,
    exchange_rates, cashflow, budget_charts, users, auth,
)

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
app.include_router(users.router)


@app.get("/api/v1/health")
def health():
    return {"status": "ok"}
