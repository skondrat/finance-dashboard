"""
Networth snapshot service — captures monthly net worth snapshots.
"""

from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.networth_account import NetworthAccount
from app.models.networth_snapshot import NetworthSnapshot
from app.services import fx_service, portfolio_service

_ZERO = Decimal("0")
_QUANT_2 = Decimal("0.01")


def capture_snapshot(db: Session, user_id: str, currency: str = "EUR") -> None:
    """Compute current net worth and upsert the snapshot for this month."""

    snapshot_month = datetime.utcnow().strftime("%Y-%m")

    # --- Manual accounts ---
    manual_accounts = (
        db.query(NetworthAccount)
        .filter(NetworthAccount.user_id == user_id)
        .order_by(NetworthAccount.created_at)
        .all()
    )

    manual_total = _ZERO
    breakdown = []

    for acct in manual_accounts:
        original_balance = acct.balance.quantize(_QUANT_2, rounding=ROUND_HALF_UP)

        if acct.currency == currency:
            converted = original_balance
        else:
            rate = fx_service.get_rate(db, base=acct.currency, target=currency)
            converted = fx_service.convert(acct.balance, acct.currency, currency, rate) if rate else acct.balance
            converted = converted.quantize(_QUANT_2, rounding=ROUND_HALF_UP)

        manual_total += converted

        breakdown.append({
            "name": acct.name,
            "balance": float(original_balance),
            "source": "manual",
            "account_type": acct.account_type,
            "currency": acct.currency,
        })

    # --- Investment accounts ---
    portfolio_accounts = (
        db.query(Account)
        .filter(Account.user_id == user_id)
        .order_by(Account.created_at)
        .all()
    )

    investment_total = _ZERO
    for pa in portfolio_accounts:
        positions = portfolio_service.get_positions(
            db, user_id, account_id=pa.id, currency=currency
        )
        account_value = sum(
            (Decimal(str(p["current_value"])) for p in positions), _ZERO
        ).quantize(_QUANT_2, rounding=ROUND_HALF_UP)
        investment_total += account_value

        breakdown.append({
            "name": pa.name,
            "balance": float(account_value),
            "source": "investment",
            "account_type": None,
            "currency": currency,
        })

    total_networth = (manual_total + investment_total).quantize(_QUANT_2, rounding=ROUND_HALF_UP)

    # Skip snapshot if no accounts exist and total is zero
    if not manual_accounts and not portfolio_accounts:
        return

    # Upsert: find existing auto snapshots for this month, keep one, delete duplicates
    existing_all = (
        db.query(NetworthSnapshot)
        .filter(
            NetworthSnapshot.user_id == user_id,
            NetworthSnapshot.snapshot_month == snapshot_month,
            NetworthSnapshot.source != "manual",
        )
        .order_by(NetworthSnapshot.updated_at.desc())
        .all()
    )

    if existing_all:
        existing = existing_all[0]
        existing.total_networth = total_networth
        existing.currency = currency
        existing.breakdown = breakdown
        existing.updated_at = datetime.utcnow()
        # Remove duplicates for the same month
        for dup in existing_all[1:]:
            db.delete(dup)
    else:
        snapshot = NetworthSnapshot(
            user_id=user_id,
            snapshot_month=snapshot_month,
            total_networth=total_networth,
            currency=currency,
            breakdown=breakdown,
        )
        db.add(snapshot)

    db.commit()


def get_composition(
    db: Session, user_id: str, group_by: str = "account", currency: str = "EUR"
) -> dict:
    """Return networth composition for the donut chart.

    group_by: "account" — one segment per account
              "type"    — grouped by account_type / asset_type
    """

    segments: list[dict] = []

    # --- Manual accounts ---
    manual_accounts = (
        db.query(NetworthAccount)
        .filter(NetworthAccount.user_id == user_id)
        .order_by(NetworthAccount.created_at)
        .all()
    )

    for acct in manual_accounts:
        if acct.currency == currency:
            converted = acct.balance
        else:
            rate = fx_service.get_rate(db, base=acct.currency, target=currency)
            converted = fx_service.convert(acct.balance, acct.currency, currency, rate) if rate else acct.balance
        converted = converted.quantize(_QUANT_2, rounding=ROUND_HALF_UP)

        if group_by == "account":
            segments.append({"label": acct.name, "value": float(converted), "type_key": acct.account_type or "other"})
        else:
            type_key = (acct.account_type or "other").capitalize()
            segments.append({"label": type_key, "value": float(converted), "type_key": type_key})

    # --- Investment accounts ---
    portfolio_accounts = (
        db.query(Account)
        .filter(Account.user_id == user_id)
        .order_by(Account.created_at)
        .all()
    )

    for pa in portfolio_accounts:
        positions = portfolio_service.get_positions(
            db, user_id, account_id=pa.id, currency=currency
        )

        if group_by == "account":
            account_value = sum((Decimal(str(p["current_value"])) for p in positions), _ZERO)
            account_value = account_value.quantize(_QUANT_2, rounding=ROUND_HALF_UP)
            if account_value > _ZERO:
                segments.append({"label": pa.name, "value": float(account_value), "type_key": "investment"})
        else:
            # Group by asset type within this account
            for p in positions:
                asset_type = (p["asset"].get("asset_type") or "other").upper()
                # Normalize common names
                type_map = {"STOCK": "Stock", "ETF": "ETF", "CRYPTO": "Crypto", "BOND": "Bond"}
                type_label = type_map.get(asset_type, asset_type.capitalize())
                segments.append({"label": type_label, "value": float(p["current_value"]), "type_key": type_label})

    # --- Aggregate by label if group_by=type ---
    if group_by == "type":
        from collections import defaultdict
        grouped: dict[str, float] = defaultdict(float)
        for seg in segments:
            grouped[seg["label"]] += seg["value"]
        segments = [{"label": k, "value": v} for k, v in grouped.items()]

    # Compute total and percentages
    total = sum(s["value"] for s in segments)
    result_segments = []
    for s in sorted(segments, key=lambda x: x["value"], reverse=True):
        percentage = round((s["value"] / total) * 100, 1) if total > 0 else 0
        result_segments.append({
            "label": s["label"],
            "value": round(s["value"], 2),
            "percentage": percentage,
        })

    return {
        "group_by": group_by,
        "total": round(total, 2),
        "currency": currency,
        "segments": result_segments,
    }
