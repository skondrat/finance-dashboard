"""
Statement import service – parse, de-duplicate, preview, and confirm (T057).
"""

from __future__ import annotations

import hashlib
import uuid
from datetime import datetime
from decimal import Decimal, InvalidOperation

from sqlalchemy.orm import Session

from app.models.bank_profile import BankProfile
from app.models.budget_transaction import BudgetTransaction
from app.models.statement_import import StatementImport
from app.parsers.registry import StatementFormat, get_parser
from app.services.categorization_service import categorize_transaction


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _compute_dedup_hash(date_str: str, amount_str: str, reference: str | None) -> str:
    """SHA-256 of normalized (date + amount + reference)."""
    normalized_ref = (reference or "").strip().lower()
    payload = f"{date_str.strip()}|{amount_str.strip()}|{normalized_ref}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _existing_hashes(db: Session, user_id: str, hashes: list[str]) -> set[str]:
    """Return the subset of hashes that already exist for this user."""
    if not hashes:
        return set()
    rows = (
        db.query(BudgetTransaction.dedup_hash)
        .filter(
            BudgetTransaction.user_id == user_id,
            BudgetTransaction.dedup_hash.in_(hashes),
        )
        .all()
    )
    return {r[0] for r in rows}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def create_import(
    db: Session,
    user_id: str,
    filename: str,
    file_content: bytes,
    fmt: str,
    bank_profile_id: str | None = None,
    currency: str = "EUR",
) -> StatementImport:
    """Parse a statement file and create a preview import.

    Returns the StatementImport with associated BudgetTransaction rows
    (not yet confirmed).
    """
    statement_format = StatementFormat(fmt)

    # Optionally load bank profile
    bank_profile = None
    if bank_profile_id:
        bank_profile = db.query(BankProfile).filter(BankProfile.id == bank_profile_id).first()

    # Create the import record
    import_record = StatementImport(
        id=str(uuid.uuid4()),
        user_id=user_id,
        filename=filename,
        format=fmt,
        bank_profile_id=bank_profile_id,
        row_count=0,
        duplicate_count=0,
        status="parsing",
    )
    db.add(import_record)
    db.flush()

    # Parse the file
    parser = get_parser(statement_format)
    parsed_rows = parser.parse(file_content, bank_profile=bank_profile)

    # Compute dedup hashes
    row_hashes = [
        _compute_dedup_hash(row["date"], row["amount"], row.get("reference"))
        for row in parsed_rows
    ]

    existing = _existing_hashes(db, user_id, row_hashes)

    # Create BudgetTransaction rows in preview state
    duplicate_count = 0
    created_transactions: list[BudgetTransaction] = []

    for row, dedup_hash in zip(parsed_rows, row_hashes):
        is_duplicate = dedup_hash in existing

        if is_duplicate:
            duplicate_count += 1
            continue

        # Parse amount
        try:
            amount = Decimal(row["amount"])
        except (InvalidOperation, ValueError):
            continue

        # Parse date
        try:
            tx_date = datetime.strptime(row["date"], "%Y-%m-%d").date()
        except ValueError:
            continue

        # Try auto-categorization
        category_id = categorize_transaction(db, user_id, row.get("description", ""))

        tx = BudgetTransaction(
            id=str(uuid.uuid4()),
            user_id=user_id,
            import_id=import_record.id,
            category_id=category_id,
            date=tx_date,
            description=row.get("description", ""),
            amount=amount,
            currency=currency,
            reference=row.get("reference"),
            is_investment=False,
            dedup_hash=dedup_hash,
        )
        db.add(tx)
        created_transactions.append(tx)

        # Track the hash so intra-file duplicates are also caught
        existing.add(dedup_hash)

    import_record.row_count = len(created_transactions)
    import_record.duplicate_count = duplicate_count
    import_record.status = "preview"

    db.commit()
    db.refresh(import_record)
    return import_record


def get_import(db: Session, import_id: str) -> StatementImport | None:
    """Return a statement import with its parsed transaction rows."""
    return (
        db.query(StatementImport)
        .filter(StatementImport.id == import_id)
        .first()
    )


def confirm_import(db: Session, import_id: str) -> StatementImport | None:
    """Mark an import as confirmed – its transactions become permanent."""
    import_record = (
        db.query(StatementImport)
        .filter(StatementImport.id == import_id)
        .first()
    )
    if import_record is None:
        return None

    if import_record.status != "preview":
        raise ValueError(f"Cannot confirm import with status '{import_record.status}'")

    import_record.status = "confirmed"
    db.commit()
    db.refresh(import_record)
    return import_record


def discard_import(db: Session, import_id: str) -> StatementImport | None:
    """Mark an import as discarded and remove its uncommitted transactions."""
    import_record = (
        db.query(StatementImport)
        .filter(StatementImport.id == import_id)
        .first()
    )
    if import_record is None:
        return None

    if import_record.status != "preview":
        raise ValueError(f"Cannot discard import with status '{import_record.status}'")

    # Remove preview transactions
    db.query(BudgetTransaction).filter(
        BudgetTransaction.import_id == import_id,
    ).delete(synchronize_session="fetch")

    import_record.status = "discarded"
    import_record.row_count = 0
    db.commit()
    db.refresh(import_record)
    return import_record
