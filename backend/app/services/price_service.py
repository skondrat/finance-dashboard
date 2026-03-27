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
# Finnhub provider (stocks / ETFs)
# ---------------------------------------------------------------------------


class FinnhubProvider(PriceProvider):
    """Fetch prices from Finnhub for stocks and ETFs."""

    def __init__(self) -> None:
        try:
            import finnhub  # type: ignore[import-untyped]

            self._client = finnhub.Client(api_key=settings.FINNHUB_API_KEY)
        except Exception:
            logger.warning("finnhub-python SDK not available or API key missing")
            self._client = None

    # -- public interface ----------------------------------------------------

    def fetch_price(self, ticker: str) -> Decimal | None:
        if self._client is None:
            return None
        try:
            quote = self._client.quote(ticker)
            current = quote.get("c")  # current price
            if current is not None and current > 0:
                return Decimal(str(current))
        except Exception:
            logger.exception("Finnhub: error fetching quote for %s", ticker)
        return None

    def fetch_historical(
        self, ticker: str, from_date: date, to_date: date
    ) -> list[dict]:
        if self._client is None:
            return []
        try:
            import time as _time

            res = self._client.stock_candles(
                ticker,
                "D",
                int(_time.mktime(from_date.timetuple())),
                int(_time.mktime(to_date.timetuple())),
            )
            if res.get("s") != "ok":
                return []
            timestamps = res.get("t", [])
            closes = res.get("c", [])
            results: list[dict] = []
            for ts, c in zip(timestamps, closes):
                d = date.fromtimestamp(ts)
                results.append({"date": d, "close_price": Decimal(str(c))})
            return results
        except Exception:
            logger.exception(
                "Finnhub: error fetching historical for %s", ticker
            )
        return []


# ---------------------------------------------------------------------------
# CoinGecko provider (crypto)
# ---------------------------------------------------------------------------


class CoinGeckoProvider(PriceProvider):
    """Fetch prices from CoinGecko for crypto assets."""

    def __init__(self) -> None:
        try:
            from pycoingecko import CoinGeckoAPI  # type: ignore[import-untyped]

            self._cg = CoinGeckoAPI()
        except Exception:
            logger.warning("pycoingecko SDK not available")
            self._cg = None

    # -- public interface ----------------------------------------------------

    def fetch_price(self, ticker: str) -> Decimal | None:
        if self._cg is None:
            return None
        try:
            # CoinGecko expects ids like "bitcoin", not "BTC".
            # We lower-case the ticker as a simple heuristic; a real mapping
            # table would be used in production.
            cg_id = ticker.lower()
            data = self._cg.get_price(ids=cg_id, vs_currencies="usd")
            price = data.get(cg_id, {}).get("usd")
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
            cg_id = ticker.lower()
            days = (to_date - from_date).days or 1
            data = self._cg.get_coin_market_chart_by_id(
                id=cg_id, vs_currency="usd", days=days
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
_finnhub_provider: FinnhubProvider | None = None
_coingecko_provider: CoinGeckoProvider | None = None


def get_provider(asset_type: str) -> PriceProvider:
    """Return the appropriate PriceProvider based on asset type."""
    global _finnhub_provider, _coingecko_provider

    if asset_type == "crypto":
        if _coingecko_provider is None:
            _coingecko_provider = CoinGeckoProvider()
        return _coingecko_provider

    # stock, etf, bond → Finnhub
    if _finnhub_provider is None:
        _finnhub_provider = FinnhubProvider()
    return _finnhub_provider


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

        if existing:
            existing.close_price = price
            existing.fetched_at = now
        else:
            db.add(
                AssetPrice(
                    asset_id=asset.id,
                    date=today,
                    close_price=price,
                    source=("coingecko" if asset.asset_type == "crypto" else "finnhub"),
                    fetched_at=now,
                )
            )

        refreshed += 1

    db.commit()
    return refreshed
