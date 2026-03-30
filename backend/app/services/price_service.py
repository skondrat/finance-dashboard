"""
Price service – provider abstraction and price refresh logic (T033).
"""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.config import settings
from app.models.account import Account
from app.models.asset import Asset
from app.models.asset_price import AssetPrice
from app.models.investment_transaction import InvestmentTransaction

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Abstract provider
# ---------------------------------------------------------------------------


class PriceProvider(ABC):
    """Base class for price data providers."""

    @abstractmethod
    def fetch_price(self, ticker: str) -> Decimal | None:
        """Return the latest price for *ticker*, or None on failure."""

    @abstractmethod
    def fetch_historical(
        self, ticker: str, from_date: date, to_date: date
    ) -> list[dict]:
        """Return a list of ``{"date": date, "close_price": Decimal}`` dicts."""


# ---------------------------------------------------------------------------
# Yahoo Finance provider (stocks / ETFs)
# ---------------------------------------------------------------------------


class YFinanceProvider(PriceProvider):
    """Fetch prices from Yahoo Finance for stocks and ETFs."""

    def __init__(self) -> None:
        try:
            import yfinance  # type: ignore[import-untyped]

            self._yf = yfinance
        except Exception:
            logger.warning("yfinance SDK not available")
            self._yf = None

    # -- public interface ----------------------------------------------------

    def fetch_price(self, ticker: str) -> Decimal | None:
        if self._yf is None:
            return None
        try:
            t = self._yf.Ticker(ticker)
            hist = t.history(period="5d")
            if not hist.empty:
                last_close = hist["Close"].iloc[-1]
                if last_close > 0:
                    return Decimal(str(round(last_close, 8)))
        except Exception:
            logger.exception("YFinance: error fetching quote for %s", ticker)
        return None

    def fetch_historical(
        self, ticker: str, from_date: date, to_date: date
    ) -> list[dict]:
        if self._yf is None:
            return []
        try:
            t = self._yf.Ticker(ticker)
            hist = t.history(start=from_date.isoformat(), end=to_date.isoformat())
            results: list[dict] = []
            for idx, row in hist.iterrows():
                d = idx.date() if hasattr(idx, "date") else idx
                results.append({"date": d, "close_price": Decimal(str(round(row["Close"], 8)))})
            return results
        except Exception:
            logger.exception(
                "YFinance: error fetching historical for %s", ticker
            )
        return []


# ---------------------------------------------------------------------------
# CoinGecko provider (crypto)
# ---------------------------------------------------------------------------


class CoinGeckoProvider(PriceProvider):
    """Fetch prices from CoinGecko for crypto assets."""

    # Ticker → CoinGecko coin ID mapping
    _TICKER_TO_CG_ID: dict[str, str] = {
        "btc": "bitcoin",
        "eth": "ethereum",
        "sol": "solana",
        "ada": "cardano",
        "dot": "polkadot",
        "matic": "matic-network",
        "link": "chainlink",
        "avax": "avalanche-2",
        "xrp": "ripple",
        "doge": "dogecoin",
    }

    def __init__(self) -> None:
        try:
            from pycoingecko import CoinGeckoAPI  # type: ignore[import-untyped]

            self._cg = CoinGeckoAPI()
        except Exception:
            logger.warning("pycoingecko SDK not available")
            self._cg = None

    def _resolve_cg_id(self, ticker: str) -> str:
        """Map a ticker symbol to a CoinGecko coin ID."""
        return self._TICKER_TO_CG_ID.get(ticker.lower(), ticker.lower())

    # -- public interface ----------------------------------------------------

    def fetch_price(self, ticker: str) -> Decimal | None:
        if self._cg is None:
            return None
        try:
            cg_id = self._resolve_cg_id(ticker)
            data = self._cg.get_price(ids=cg_id, vs_currencies="eur")
            price = data.get(cg_id, {}).get("eur")
            if price is not None:
                return Decimal(str(price))
        except Exception:
            logger.exception("CoinGecko: error fetching price for %s", ticker)
        return None

    def fetch_historical(
        self, ticker: str, from_date: date, to_date: date
    ) -> list[dict]:
        if self._cg is None:
            return []
        try:
            cg_id = self._resolve_cg_id(ticker)
            days = (to_date - from_date).days or 1
            data = self._cg.get_coin_market_chart_by_id(
                id=cg_id, vs_currency="eur", days=days
            )
            results: list[dict] = []
            for ts_ms, price in data.get("prices", []):
                d = date.fromtimestamp(ts_ms / 1000)
                results.append({"date": d, "close_price": Decimal(str(price))})
            return results
        except Exception:
            logger.exception(
                "CoinGecko: error fetching historical for %s", ticker
            )
        return []


# ---------------------------------------------------------------------------
# Provider factory
# ---------------------------------------------------------------------------

# Singletons (created lazily)
_yfinance_provider: YFinanceProvider | None = None
_coingecko_provider: CoinGeckoProvider | None = None


def get_provider(asset_type: str) -> PriceProvider:
    """Return the appropriate PriceProvider based on asset type."""
    global _yfinance_provider, _coingecko_provider

    if asset_type == "crypto":
        if _coingecko_provider is None:
            _coingecko_provider = CoinGeckoProvider()
        return _coingecko_provider

    # stock, etf, bond → Yahoo Finance
    if _yfinance_provider is None:
        _yfinance_provider = YFinanceProvider()
    return _yfinance_provider


# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------


def get_latest_price(db: Session, asset_id: str) -> AssetPrice | None:
    """Return the most recent AssetPrice row for the given asset, or None."""
    return (
        db.query(AssetPrice)
        .filter(AssetPrice.asset_id == asset_id)
        .order_by(AssetPrice.date.desc())
        .first()
    )


def refresh_prices(db: Session, user_id: str) -> int:
    """Fetch the latest price for every asset the user currently holds.

    Returns the number of assets for which prices were successfully refreshed.
    """

    # Find distinct asset IDs held by the user
    held_asset_ids = (
        db.query(InvestmentTransaction.asset_id)
        .join(Account, InvestmentTransaction.account_id == Account.id)
        .filter(Account.user_id == user_id)
        .distinct()
        .all()
    )
    held_asset_ids = [row[0] for row in held_asset_ids]

    if not held_asset_ids:
        return 0

    assets = db.query(Asset).filter(Asset.id.in_(held_asset_ids)).all()
    today = date.today()
    now = datetime.utcnow()
    refreshed = 0

    for asset in assets:
        provider = get_provider(asset.asset_type)
        try:
            price = provider.fetch_price(asset.ticker)
        except Exception:
            logger.exception("Failed to fetch price for %s", asset.ticker)
            continue

        if price is None:
            continue

        # Upsert: update if same asset+date already exists, else insert
        existing = (
            db.query(AssetPrice)
            .filter(
                and_(
                    AssetPrice.asset_id == asset.id,
                    AssetPrice.date == today,
                )
            )
            .first()
        )

        source = "coingecko" if asset.asset_type == "crypto" else "yfinance"
        price_currency = "EUR" if source == "coingecko" else "USD"

        if existing:
            existing.close_price = price
            existing.currency = price_currency
            existing.fetched_at = now
        else:
            db.add(
                AssetPrice(
                    asset_id=asset.id,
                    date=today,
                    close_price=price,
                    source=source,
                    currency=price_currency,
                    fetched_at=now,
                )
            )

        refreshed += 1

    db.commit()
    return refreshed
