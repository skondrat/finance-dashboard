"""
Portfolio service – positions, summary, and performance calculations (T032).
"""

from __future__ import annotations

from collections import defaultdict
from datetime import date, timedelta
from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy import func, and_
from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.asset import Asset
from app.models.asset_price import AssetPrice
from app.models.investment_transaction import InvestmentTransaction
from app.services import fx_service

from datetime import datetime


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_ZERO = Decimal("0")
_ONE = Decimal("1")
_HUNDRED = Decimal("100")
_QUANT_8 = Decimal("0.00000001")
_QUANT_2 = Decimal("0.01")


def _get_fx_rate(
    db: Session,
    from_currency: str,
    to_currency: str,
) -> Decimal:
    """Return the exchange rate from *from_currency* to *to_currency*.

    Falls back to 1.0 if currencies match or no rate is available.
    Ensures a rate is fetched/cached for today if not already present.
    """
    if from_currency == to_currency:
        return _ONE

    # Try to fetch (caches automatically)
    row = fx_service.fetch_daily_rate(db, base=from_currency, target=to_currency)
    if row is not None:
        return row.rate

    # Fallback: try cached historical rate
    rate = fx_service.get_rate(db, base=from_currency, target=to_currency)
    if rate is not None:
        return rate

    # Try inverse
    inverse_rate = fx_service.get_rate(db, base=to_currency, target=from_currency)
    if inverse_rate is not None and inverse_rate > _ZERO:
        return (_ONE / inverse_rate).quantize(_QUANT_8, rounding=ROUND_HALF_UP)

    return _ONE  # ultimate fallback


def _latest_prices_map(db: Session, asset_ids: list[str]) -> dict[str, tuple[Decimal, str]]:
    """Return a mapping of asset_id → (latest close_price, currency) for the given IDs."""
    if not asset_ids:
        return {}

    # Sub-query: max date per asset
    latest_date_sq = (
        db.query(
            AssetPrice.asset_id,
            func.max(AssetPrice.date).label("max_date"),
        )
        .filter(AssetPrice.asset_id.in_(asset_ids))
        .group_by(AssetPrice.asset_id)
        .subquery()
    )

    rows = (
        db.query(AssetPrice.asset_id, AssetPrice.close_price, AssetPrice.currency)
        .join(
            latest_date_sq,
            and_(
                AssetPrice.asset_id == latest_date_sq.c.asset_id,
                AssetPrice.date == latest_date_sq.c.max_date,
            ),
        )
        .all()
    )
    return {r.asset_id: (r.close_price, r.currency) for r in rows}


def _date_range_start(range_str: str) -> date:
    """Return the start date for a given range string."""
    today = date.today()
    mapping = {
        "1D": today - timedelta(days=1),
        "1W": today - timedelta(weeks=1),
        "1M": today - timedelta(days=30),
        "YTD": date(today.year, 1, 1),
        "1Y": today - timedelta(days=365),
    }
    return mapping.get(range_str, date(2000, 1, 1))  # MAX falls through


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def get_positions(
    db: Session,
    user_id: str,
    account_id: str | None = None,
    currency: str = "EUR",
) -> list[dict]:
    """Aggregate positions from investment transactions.

    Uses the average-cost method: buys update the weighted average cost;
    sells reduce quantity but leave the average cost unchanged.
    """

    # Fetch relevant transactions ordered by date
    q = (
        db.query(InvestmentTransaction)
        .join(Account, InvestmentTransaction.account_id == Account.id)
        .filter(Account.user_id == user_id)
        .order_by(InvestmentTransaction.date, InvestmentTransaction.created_at)
    )
    if account_id is not None:
        q = q.filter(InvestmentTransaction.account_id == account_id)

    transactions = q.all()

    # Group key: (account_id, asset_id) when account_id is specified,
    # otherwise just (asset_id,) to aggregate across accounts.
    Position = dict  # alias for readability

    positions: dict[tuple, Position] = defaultdict(
        lambda: {"quantity": _ZERO, "total_cost": _ZERO, "avg_cost_basis": _ZERO}
    )

    for tx in transactions:
        key = (tx.account_id, tx.asset_id) if account_id else (tx.asset_id,)
        pos = positions[key]

        qty = tx.quantity
        price = tx.price_per_unit

        if tx.type == "buy":
            old_total_cost = pos["avg_cost_basis"] * pos["quantity"]
            new_total_cost = old_total_cost + (price * qty)
            pos["quantity"] += qty
            if pos["quantity"] > _ZERO:
                pos["avg_cost_basis"] = (new_total_cost / pos["quantity"]).quantize(
                    _QUANT_8, rounding=ROUND_HALF_UP
                )
            pos["total_cost"] = (pos["avg_cost_basis"] * pos["quantity"]).quantize(
                _QUANT_2, rounding=ROUND_HALF_UP
            )
        elif tx.type == "sell":
            pos["quantity"] -= qty
            if pos["quantity"] < _ZERO:
                pos["quantity"] = _ZERO
            pos["total_cost"] = (pos["avg_cost_basis"] * pos["quantity"]).quantize(
                _QUANT_2, rounding=ROUND_HALF_UP
            )

        # Attach asset_id (always needed) and optionally account_id
        pos["asset_id"] = tx.asset_id
        if account_id:
            pos["account_id"] = tx.account_id

    # Remove positions with zero quantity
    positions = {k: v for k, v in positions.items() if v["quantity"] > _ZERO}

    if not positions:
        return []

    # Fetch latest prices (now returns (price, price_currency) tuples)
    asset_ids = list({p["asset_id"] for p in positions.values()})
    price_map = _latest_prices_map(db, asset_ids)

    # Fetch asset objects for response
    asset_objs = {a.id: a for a in db.query(Asset).filter(Asset.id.in_(asset_ids)).all()}

    # Pre-compute FX rates for each native currency → display currency
    fx_cache: dict[str, Decimal] = {}

    def _fx(from_ccy: str) -> Decimal:
        if from_ccy not in fx_cache:
            fx_cache[from_ccy] = _get_fx_rate(db, from_ccy, currency)
        return fx_cache[from_ccy]

    # Compute total portfolio value for weight calculation
    total_value = _ZERO
    results: list[dict] = []
    for pos in positions.values():
        price_entry = price_map.get(pos["asset_id"])
        raw_price = price_entry[0] if price_entry else _ZERO
        price_ccy = price_entry[1] if price_entry else currency
        rate = _fx(price_ccy)
        current_price = (raw_price * rate).quantize(_QUANT_8, rounding=ROUND_HALF_UP)
        current_value = (pos["quantity"] * current_price).quantize(_QUANT_2, rounding=ROUND_HALF_UP)
        total_value += current_value

    for pos in positions.values():
        asset = asset_objs.get(pos["asset_id"])
        if asset is None:
            continue

        # Convert current price from its native currency to display currency
        price_entry = price_map.get(pos["asset_id"])
        raw_price = price_entry[0] if price_entry else _ZERO
        price_ccy = price_entry[1] if price_entry else currency
        price_rate = _fx(price_ccy)
        current_price = (raw_price * price_rate).quantize(_QUANT_8, rounding=ROUND_HALF_UP)
        current_value = (pos["quantity"] * current_price).quantize(_QUANT_2, rounding=ROUND_HALF_UP)

        # Convert cost basis from transaction currency to display currency
        # Cost basis is tracked in the transaction's original currency
        # For simplicity, use the asset's trading currency as the cost basis currency
        cost_rate = _fx(asset.currency)
        avg_cost_display = (pos["avg_cost_basis"] * cost_rate).quantize(_QUANT_8, rounding=ROUND_HALF_UP)
        total_cost_display = (pos["total_cost"] * cost_rate).quantize(_QUANT_2, rounding=ROUND_HALF_UP)

        pnl_absolute = current_value - total_cost_display
        pnl_percent = (
            ((pnl_absolute / total_cost_display) * _HUNDRED).quantize(_QUANT_2, rounding=ROUND_HALF_UP)
            if total_cost_display > _ZERO
            else _ZERO
        )
        weight = (
            ((current_value / total_value) * _HUNDRED).quantize(_QUANT_2, rounding=ROUND_HALF_UP)
            if total_value > _ZERO
            else _ZERO
        )

        results.append(
            {
                "asset": {
                    "id": asset.id,
                    "ticker": asset.ticker,
                    "name": asset.name,
                    "asset_type": asset.asset_type,
                },
                "quantity": pos["quantity"],
                "avg_cost_basis": avg_cost_display,
                "total_cost": total_cost_display,
                "current_price": current_price,
                "current_value": current_value,
                "pnl_absolute": pnl_absolute,
                "pnl_percent": pnl_percent,
                "weight": weight,
                "currency": currency,
            }
        )

    return results


def get_summary(
    db: Session,
    user_id: str,
    currency: str = "EUR",
) -> dict:
    """Calculate portfolio-level KPIs."""

    positions = get_positions(db, user_id, currency=currency)

    net_worth = sum((p["current_value"] for p in positions), _ZERO)
    invested_capital = sum((p["total_cost"] for p in positions), _ZERO)
    total_return = net_worth - invested_capital
    return_pct = (
        ((total_return / invested_capital) * _HUNDRED).quantize(_QUANT_2, rounding=ROUND_HALF_UP)
        if invested_capital > _ZERO
        else _ZERO
    )

    # Find the most recent price fetch time for the user's assets
    asset_ids = [p["asset"]["id"] for p in positions] if positions else []
    last_refreshed_at: datetime | None = None
    if asset_ids:
        row = (
            db.query(func.max(AssetPrice.fetched_at))
            .filter(AssetPrice.asset_id.in_(asset_ids))
            .scalar()
        )
        last_refreshed_at = row

    return {
        "net_worth": net_worth,
        "total_return": total_return,
        "return_pct": return_pct,
        "saving_rate": _ZERO,       # computed properly in Phase 5
        "investment_rate": _ZERO,    # computed properly in Phase 5
        "invested_capital": invested_capital,
        "currency": currency,
        "last_refreshed_at": last_refreshed_at,
    }


def get_performance(
    db: Session,
    user_id: str,
    range_str: str = "1Y",
    currency: str = "EUR",
) -> dict:
    """Generate a time series of portfolio value over time.

    For each date in the range that has price data, compute the portfolio
    value using the holdings *as of that date* and the available prices.
    """

    start_date = _date_range_start(range_str)
    today = date.today()

    # 1. Get all user transactions up to today, ordered by date
    txns = (
        db.query(InvestmentTransaction)
        .join(Account, InvestmentTransaction.account_id == Account.id)
        .filter(Account.user_id == user_id)
        .order_by(InvestmentTransaction.date, InvestmentTransaction.created_at)
        .all()
    )

    if not txns:
        return {"range": range_str, "data_points": []}

    # 2. Build a timeline of holdings: date → { asset_id: quantity }
    # We replay transactions chronologically.
    holdings_by_date: dict[date, dict[str, Decimal]] = {}
    current_holdings: dict[str, Decimal] = defaultdict(lambda: _ZERO)

    for tx in txns:
        if tx.type == "buy":
            current_holdings[tx.asset_id] += tx.quantity
        elif tx.type == "sell":
            current_holdings[tx.asset_id] -= tx.quantity
            if current_holdings[tx.asset_id] <= _ZERO:
                current_holdings.pop(tx.asset_id, None)
        # Snapshot (copy) after this date
        holdings_by_date[tx.date] = dict(current_holdings)

    # 3. Get all asset prices in the date range
    all_asset_ids = list(
        {tx.asset_id for tx in txns}
    )

    prices_rows = (
        db.query(AssetPrice)
        .filter(
            AssetPrice.asset_id.in_(all_asset_ids),
            AssetPrice.date >= start_date,
            AssetPrice.date <= today,
        )
        .order_by(AssetPrice.date)
        .all()
    )

    # Build price lookup: date → { asset_id: close_price }
    # Also track each price's native currency for conversion
    price_lookup: dict[date, dict[str, Decimal]] = defaultdict(dict)
    price_currency_map: dict[str, str] = {}  # asset_id → currency
    for row in prices_rows:
        price_lookup[row.date][row.asset_id] = row.close_price
        price_currency_map[row.asset_id] = row.currency

    # 4. Build the time-series data points
    # Collect all unique price dates in range
    price_dates = sorted(d for d in price_lookup if d >= start_date)

    data_points: list[dict] = []
    # Track the most-recent holdings snapshot
    last_snapshot: dict[str, Decimal] = {}
    sorted_holding_dates = sorted(holdings_by_date.keys())
    snap_idx = 0

    for d in price_dates:
        # Advance the holdings snapshot to this date
        while snap_idx < len(sorted_holding_dates) and sorted_holding_dates[snap_idx] <= d:
            last_snapshot = holdings_by_date[sorted_holding_dates[snap_idx]]
            snap_idx += 1

        if not last_snapshot:
            continue

        # Compute portfolio value for this date (converted to display currency)
        day_prices = price_lookup.get(d, {})
        day_value = _ZERO
        for asset_id, qty in last_snapshot.items():
            p = day_prices.get(asset_id)
            if p is not None:
                p_ccy = price_currency_map.get(asset_id, currency)
                rate = _get_fx_rate(db, p_ccy, currency)
                day_value += qty * p * rate

        data_points.append(
            {
                "date": d,
                "value": day_value.quantize(_QUANT_2, rounding=ROUND_HALF_UP),
            }
        )

    return {"range": range_str, "data_points": data_points}


# ---------------------------------------------------------------------------
# Allocation (T107)
# ---------------------------------------------------------------------------

_VALID_GROUP_BY = {"type", "positions", "regions", "sectors", "industries"}

# Maps group_by key → Asset model attribute (or special "positions" mode)
_GROUP_FIELD_MAP = {
    "type": "asset_type",
    "regions": "region",
    "sectors": "sector",
    "industries": "industry",
}


def get_allocation(
    db: Session,
    user_id: str,
    group_by: str = "type",
    currency: str = "EUR",
) -> dict:
    """Group current positions by an asset attribute and return allocation
    breakdown with value and percentage for each segment."""

    if group_by not in _VALID_GROUP_BY:
        group_by = "type"

    positions = get_positions(db, user_id, currency=currency)
    if not positions:
        return {"group_by": group_by, "total": _ZERO, "segments": []}

    total_value = sum((p["current_value"] for p in positions), _ZERO)

    if group_by == "positions":
        # Each position is its own segment
        segments = []
        for p in positions:
            pct = (
                ((p["current_value"] / total_value) * _HUNDRED).quantize(
                    _QUANT_2, rounding=ROUND_HALF_UP
                )
                if total_value > _ZERO
                else _ZERO
            )
            segments.append(
                {
                    "label": p["asset"]["ticker"],
                    "value": p["current_value"],
                    "percentage": pct,
                }
            )
    else:
        # Group by an asset attribute
        field_name = _GROUP_FIELD_MAP[group_by]
        asset_ids = [p["asset"]["id"] for p in positions]
        asset_objs = {
            a.id: a
            for a in db.query(Asset).filter(Asset.id.in_(asset_ids)).all()
        }

        buckets: dict[str, Decimal] = defaultdict(lambda: _ZERO)
        for p in positions:
            asset = asset_objs.get(p["asset"]["id"])
            label = (
                getattr(asset, field_name, None) or "Unknown"
            ) if asset else "Unknown"
            buckets[label] += p["current_value"]

        segments = []
        for label, value in buckets.items():
            pct = (
                ((value / total_value) * _HUNDRED).quantize(
                    _QUANT_2, rounding=ROUND_HALF_UP
                )
                if total_value > _ZERO
                else _ZERO
            )
            segments.append({"label": label, "value": value, "percentage": pct})

    # Sort descending by value
    segments.sort(key=lambda s: s["value"], reverse=True)

    return {
        "group_by": group_by,
        "total": total_value,
        "segments": segments,
    }


# ---------------------------------------------------------------------------
# Performance Breakdown (T107)
# ---------------------------------------------------------------------------


def calculate_irr(cashflows: list[tuple[date, Decimal]], max_iter: int = 200, tol: float = 1e-8) -> Decimal:
    """Compute the internal rate of return using Newton-Raphson.

    cashflows is a list of (date, amount) tuples. Negative amounts are
    investments (outflows), positive amounts are returns (inflows).
    Returns annualised IRR as a decimal (e.g. 0.12 for 12%).
    """
    if not cashflows or len(cashflows) < 2:
        return _ZERO

    # Normalise dates to year fractions from the first cashflow
    base_date = cashflows[0][0]
    cf_pairs: list[tuple[float, float]] = []
    for d, amount in cashflows:
        t = (d - base_date).days / 365.25
        cf_pairs.append((t, float(amount)))

    rate = 0.1  # initial guess

    for _ in range(max_iter):
        npv = 0.0
        d_npv = 0.0
        for t, c in cf_pairs:
            denom = (1 + rate) ** t
            if denom == 0:
                break
            npv += c / denom
            if t != 0:
                d_npv -= t * c / ((1 + rate) ** (t + 1))

        if abs(d_npv) < 1e-14:
            break

        new_rate = rate - npv / d_npv
        if abs(new_rate - rate) < tol:
            rate = new_rate
            break
        rate = new_rate

    return Decimal(str(round(rate * 100, 2)))


def calculate_twr(
    db: Session,
    user_id: str,
    currency: str = "EUR",
) -> Decimal:
    """Compute the time-weighted return as product of (1 + HPR_i) - 1.

    Sub-periods are defined by transaction dates. Between transactions
    the portfolio grows based on price changes alone.
    """
    txns = (
        db.query(InvestmentTransaction)
        .join(Account, InvestmentTransaction.account_id == Account.id)
        .filter(Account.user_id == user_id)
        .order_by(InvestmentTransaction.date, InvestmentTransaction.created_at)
        .all()
    )

    if not txns:
        return _ZERO

    # Collect unique transaction dates as sub-period boundaries
    tx_dates = sorted({tx.date for tx in txns})
    if len(tx_dates) < 1:
        return _ZERO

    # Build holdings snapshots per sub-period
    holdings: dict[str, Decimal] = defaultdict(lambda: _ZERO)
    tx_by_date: dict[date, list] = defaultdict(list)
    for tx in txns:
        tx_by_date[tx.date].append(tx)

    # Get all asset IDs
    all_asset_ids = list({tx.asset_id for tx in txns})
    if not all_asset_ids:
        return _ZERO

    # Fetch all prices
    price_rows = (
        db.query(AssetPrice)
        .filter(AssetPrice.asset_id.in_(all_asset_ids))
        .order_by(AssetPrice.date)
        .all()
    )

    price_lookup: dict[date, dict[str, Decimal]] = defaultdict(dict)
    for row in price_rows:
        price_lookup[row.date][row.asset_id] = row.close_price

    # Collect all dates with prices
    all_dates = sorted(price_lookup.keys())
    if not all_dates:
        return _ZERO

    product = Decimal("1")
    prev_value: Decimal | None = None

    for d in all_dates:
        # Compute portfolio value BEFORE any transactions on this day
        day_prices = price_lookup.get(d, {})
        value_before = _ZERO
        for asset_id, qty in holdings.items():
            p = day_prices.get(asset_id)
            if p is not None:
                value_before += qty * p

        # If we have a previous value and it's > 0, compute HPR
        if prev_value is not None and prev_value > _ZERO:
            hpr = value_before / prev_value
            product *= hpr

        # Apply transactions for this day
        if d in tx_by_date:
            for tx in tx_by_date[d]:
                if tx.type == "buy":
                    holdings[tx.asset_id] += tx.quantity
                elif tx.type == "sell":
                    holdings[tx.asset_id] -= tx.quantity
                    if holdings[tx.asset_id] <= _ZERO:
                        holdings.pop(tx.asset_id, None)

        # Compute value AFTER transactions
        value_after = _ZERO
        for asset_id, qty in holdings.items():
            p = day_prices.get(asset_id)
            if p is not None:
                value_after += qty * p

        if value_after > _ZERO:
            prev_value = value_after
        elif prev_value is not None:
            prev_value = value_after

    twr = (product - Decimal("1")) * _HUNDRED
    return twr.quantize(_QUANT_2, rounding=ROUND_HALF_UP)


def get_performance_breakdown(
    db: Session,
    user_id: str,
    currency: str = "EUR",
) -> dict:
    """Compute a detailed performance breakdown including IRR and TWR."""

    positions = get_positions(db, user_id, currency=currency)

    capital = sum((p["total_cost"] for p in positions), _ZERO)
    net_worth = sum((p["current_value"] for p in positions), _ZERO)
    price_gain = net_worth - capital
    price_gain_pct = (
        ((price_gain / capital) * _HUNDRED).quantize(_QUANT_2, rounding=ROUND_HALF_UP)
        if capital > _ZERO
        else _ZERO
    )

    # Dividends placeholder (phase for dividend tracking not yet implemented)
    dividends = _ZERO
    dividends_pct = _ZERO

    # Realized losses placeholder (requires closed-position tracking)
    realized_losses = _ZERO
    realized_losses_pct = _ZERO

    # Transaction costs: sum of all fees (converted to display currency)
    txns = (
        db.query(InvestmentTransaction)
        .join(Account, InvestmentTransaction.account_id == Account.id)
        .filter(Account.user_id == user_id)
        .all()
    )
    transaction_costs = _ZERO
    for tx in txns:
        fee_rate = _get_fx_rate(db, tx.currency, currency)
        transaction_costs += (tx.fees * fee_rate).quantize(_QUANT_2, rounding=ROUND_HALF_UP)

    total_return = price_gain + dividends + realized_losses - transaction_costs
    total_return_pct = (
        ((total_return / capital) * _HUNDRED).quantize(_QUANT_2, rounding=ROUND_HALF_UP)
        if capital > _ZERO
        else _ZERO
    )

    # IRR: build cashflows from transactions + current portfolio value (in display currency)
    cashflows: list[tuple[date, Decimal]] = []
    for tx in txns:
        tx_rate = _get_fx_rate(db, tx.currency, currency)
        if tx.type == "buy":
            cashflows.append((tx.date, -(tx.quantity * tx.price_per_unit + tx.fees) * tx_rate))
        elif tx.type == "sell":
            cashflows.append((tx.date, (tx.quantity * tx.price_per_unit - tx.fees) * tx_rate))

    # Add current portfolio value as a positive terminal cashflow
    if net_worth > _ZERO:
        cashflows.append((date.today(), net_worth))

    cashflows.sort(key=lambda cf: cf[0])
    irr = calculate_irr(cashflows)

    # TWR
    twr = calculate_twr(db, user_id, currency=currency)

    return {
        "capital": capital,
        "price_gain": price_gain,
        "price_gain_pct": price_gain_pct,
        "dividends": dividends,
        "dividends_pct": dividends_pct,
        "realized_losses": realized_losses,
        "realized_losses_pct": realized_losses_pct,
        "transaction_costs": transaction_costs,
        "total_return": total_return,
        "total_return_pct": total_return_pct,
        "irr": irr,
        "twr": twr,
        "currency": currency,
    }
