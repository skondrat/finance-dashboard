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
        if acct.currency == currency:
            converted = acct.balance
        else:
            rate = fx_service.get_rate(db, base=acct.currency, target=currency)
            converted = fx_service.convert(acct.balance, acct.currency, currency, rate) if rate else acct.balance

        converted = converted.quantize(_QUANT_2, rounding=ROUND_HALF_UP)
        manual_total += converted

        breakdown.append({
            "name": acct.name,
            "balance": float(converted),
            "source": "manual",
            "account_type": acct.account_type,
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
        })

    total_networth = (manual_total + investment_total).quantize(_QUANT_2, rounding=ROUND_HALF_UP)

    # Skip snapshot if no accounts exist and total is zero
    if not manual_accounts and not portfolio_accounts:
        return

    # Upsert: find existing snapshot for this month or create new
    existing = (
        db.query(NetworthSnapshot)
        .filter(
            NetworthSnapshot.user_id == user_id,
            NetworthSnapshot.snapshot_month == snapshot_month,
        )
        .first()
    )

    if existing:
        existing.total_networth = total_networth
        existing.currency = currency
        existing.breakdown = breakdown
        existing.updated_at = datetime.utcnow()
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
