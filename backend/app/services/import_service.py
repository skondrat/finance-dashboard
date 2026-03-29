"""
Statement import service – parse, de-duplicate, preview, and confirm (T057).
Extended for PDF imports with source config and categorization (T014, T019, T020).
"""

from __future__ import annotations

import hashlib
import logging
import uuid
from datetime import datetime
from decimal import Decimal, InvalidOperation

from sqlalchemy.orm import Session

from app.models.bank_profile import BankProfile
from app.models.budget_transaction import BudgetTransaction
from app.models.category import Category
from app.models.statement_import import StatementImport
from app.parsers.registry import StatementFormat, get_parser
from app.services.categorization_service import categorize_transaction

logger = logging.getLogger(__name__)


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


async def create_import(
    db: Session,
    user_id: str,
    filename: str,
    file_content: bytes,
    fmt: str,
    bank_profile_id: str | None = None,
    currency: str = "EUR",
    source: str | None = None,
    source_config: dict | None = None,
    on_categorization_progress: object | None = None,
) -> dict:
    """Parse a statement file and create a preview import.

    Returns a dict with import metadata, rows (with categorization info), and counts.
    on_categorization_progress: Optional callback(done, total) for progress reporting.
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
        source=source,
        row_count=0,
        duplicate_count=0,
        status="parsing",
    )
    db.add(import_record)
    db.flush()

    # Parse the file
    parser = get_parser(statement_format)

    if statement_format == StatementFormat.PDF:
        parsed_rows = parser.parse(file_content, bank_profile=bank_profile, source_config=source_config)
    else:
        parsed_rows = parser.parse(file_content, bank_profile=bank_profile)

    # Exclude internal transfers (e.g., "Transfer between balances")
    excluded_count = 0
    filtered_rows = []
    for row in parsed_rows:
        desc = row.get("description", "").lower().strip()
        if desc.startswith("transfer between balances"):
            excluded_count += 1
        else:
            filtered_rows.append(row)
    parsed_rows = filtered_rows

    # For PDF imports, run enhanced categorization
    is_pdf = statement_format == StatementFormat.PDF
    category_results: dict[int, dict] = {}

    if is_pdf:
        from app.services import categorization_service
        category_results = await categorization_service.categorize_transactions_batch_async(
            db, user_id, [row.get("description", "") for row in parsed_rows],
            on_progress=on_categorization_progress,
        )

    # Compute dedup hashes
    row_hashes = [
        _compute_dedup_hash(row["date"], row["amount"], row.get("reference"))
        for row in parsed_rows
    ]

    existing = _existing_hashes(db, user_id, row_hashes)

    # Create BudgetTransaction rows in preview state
    duplicate_count = 0
    skipped_count = 0
    created_transactions: list[BudgetTransaction] = []
    response_rows: list[dict] = []

    for idx, (row, dedup_hash) in enumerate(zip(parsed_rows, row_hashes)):
        is_duplicate = dedup_hash in existing

        if is_duplicate:
            duplicate_count += 1
            continue

        # Parse amount
        try:
            amount = Decimal(row["amount"])
        except (InvalidOperation, ValueError):
            skipped_count += 1
            continue

        # Parse date
        try:
            tx_date = datetime.strptime(row["date"], "%Y-%m-%d").date()
        except ValueError:
            skipped_count += 1
            continue

        # Determine category
        category_id = None
        category_name = None
        category_source = "none"

        if is_pdf and idx in category_results:
            cat_result = category_results[idx]
            category_id = cat_result.get("category_id")
            category_name = cat_result.get("category_name")
            category_source = cat_result.get("category_source", "none")
        else:
            # Legacy: keyword-only categorization for non-PDF
            category_id = categorize_transaction(db, user_id, row.get("description", ""))

        # Use currency from parsed row (PDF provides it per-row) or default
        tx_currency = row.get("currency", currency)

        tx = BudgetTransaction(
            id=str(uuid.uuid4()),
            user_id=user_id,
            import_id=import_record.id,
            category_id=category_id,
            date=tx_date,
            description=row.get("description", ""),
            amount=amount,
            currency=tx_currency,
            reference=row.get("reference"),
            is_investment=False,
            dedup_hash=dedup_hash,
        )
        db.add(tx)
        created_transactions.append(tx)

        response_rows.append({
            "date": row["date"],
            "description": row.get("description", ""),
            "amount": amount,
            "currency": tx_currency,
            "type": row.get("type", "debit" if amount < 0 else "credit"),
            "category_id": category_id,
            "category_name": category_name,
            "category_source": category_source,
            "category_guess": category_name,  # backward compat for frontend
        })

        # Track the hash so intra-file duplicates are also caught
        existing.add(dedup_hash)

    import_record.row_count = len(created_transactions)
    import_record.duplicate_count = duplicate_count
    import_record.status = "preview"

    db.commit()
    db.refresh(import_record)

    return {
        "id": import_record.id,
        "status": import_record.status,
        "file_name": filename,
        "source": source,
        "row_count": len(created_transactions),
        "duplicate_count": duplicate_count,
        "skipped_count": skipped_count,
        "excluded_count": excluded_count,
        "rows": response_rows,
    }


def get_import(db: Session, import_id: str) -> StatementImport | None:
    """Return a statement import with its parsed transaction rows."""
    return (
        db.query(StatementImport)
        .filter(StatementImport.id == import_id)
        .first()
    )


def confirm_import(
    db: Session,
    import_record: StatementImport,
    category_overrides: list[dict] | None = None,
    splits: list[dict] | None = None,
) -> dict:
    """Mark an import as confirmed – its transactions become permanent.

    Applies any category overrides and splits, then saves mappings to the MD file.
    """
    if import_record.status != "preview":
        raise ValueError(f"Cannot confirm import with status '{import_record.status}'")

    # Load transactions for this import
    transactions = (
        db.query(BudgetTransaction)
        .filter(BudgetTransaction.import_id == import_record.id)
        .all()
    )

    # Apply category overrides
    if category_overrides:
        for override in category_overrides:
            row_index = override.get("row_index")
            new_category_id = override.get("category_id")
            if row_index is not None and 0 <= row_index < len(transactions):
                transactions[row_index].category_id = new_category_id

    # Apply ATM cash splits
    if splits:
        for split in splits:
            row_index = split.get("row_index")
            split_items = split.get("items", [])
            if row_index is None or row_index < 0 or row_index >= len(transactions):
                continue

            original_tx = transactions[row_index]

            # Create new transactions for each split item
            for item in split_items:
                item_amount = Decimal(str(item["amount"]))
                # Make amount negative if the original was negative (expenses)
                if original_tx.amount < 0:
                    item_amount = -abs(item_amount)

                new_tx = BudgetTransaction(
                    id=str(uuid.uuid4()),
                    user_id=import_record.user_id,
                    import_id=import_record.id,
                    category_id=item.get("category_id"),
                    date=original_tx.date,
                    description=item["description"],
                    amount=item_amount,
                    currency=original_tx.currency,
                    reference=original_tx.reference,
                    is_investment=False,
                    dedup_hash=_compute_dedup_hash(
                        str(original_tx.date),
                        str(item_amount),
                        item["description"],
                    ),
                )
                db.add(new_tx)

            # Delete the original ATM transaction
            db.delete(original_tx)

        # Update row count
        db.flush()
        new_count = (
            db.query(BudgetTransaction)
            .filter(BudgetTransaction.import_id == import_record.id)
            .count()
        )
        import_record.row_count = new_count

    # Reload transactions after splits (list may have changed)
    transactions = (
        db.query(BudgetTransaction)
        .filter(BudgetTransaction.import_id == import_record.id)
        .all()
    )

    # Save description->category mappings to MD file
    mappings_updated = 0
    if import_record.format == "pdf":
        from app.services.mapping_file_service import save_bulk_mappings

        mappings: dict[str, str] = {}
        for tx in transactions:
            if tx.category_id and tx.description:
                # Look up category name
                cat = db.query(Category).filter(Category.id == tx.category_id).first()
                if cat:
                    mappings[tx.description.lower().strip()] = cat.name

        if mappings:
            mappings_updated = save_bulk_mappings(mappings)

    # Auto-create Income Sources from positive (income) transactions
    income_created = 0
    transfers_cat = (
        db.query(Category)
        .filter(
            Category.user_id == import_record.user_id,
            Category.name == "Transfers",
        )
        .first()
    )
    transfers_cat_id = transfers_cat.id if transfers_cat else None

    for tx in transactions:
        if tx.amount <= 0:
            continue
        # Skip self-transfers
        desc_lower = (tx.description or "").lower().strip()
        if "transfer between" in desc_lower:
            continue
        if transfers_cat_id and tx.category_id == transfers_cat_id:
            continue

        from app.models.income_source import IncomeSource

        income = IncomeSource(
            user_id=import_record.user_id,
            label=tx.description,
            amount=tx.amount,
            currency=tx.currency,
            month=tx.date.month,
            year=tx.date.year,
        )
        db.add(income)
        income_created += 1

    import_record.status = "confirmed"
    db.commit()
    db.refresh(import_record)

    return {
        "id": import_record.id,
        "status": "confirmed",
        "row_count": import_record.row_count,
        "mappings_updated": mappings_updated,
        "income_created": income_created,
    }


def discard_import(db: Session, import_record: StatementImport) -> dict:
    """Mark an import as discarded and remove its uncommitted transactions."""
    if import_record.status != "preview":
        raise ValueError(f"Cannot discard import with status '{import_record.status}'")

    # Remove preview transactions
    db.query(BudgetTransaction).filter(
        BudgetTransaction.import_id == import_record.id,
    ).delete(synchronize_session="fetch")

    import_record.status = "discarded"
    import_record.row_count = 0
    db.commit()
    db.refresh(import_record)

    return {"id": import_record.id, "status": "discarded"}
