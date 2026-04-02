"""
Statement import and bank profile endpoints (T063 + T064).
Extended for PDF import with source selection, categorization, and SSE progress.
"""

import asyncio
import json as json_mod
import logging
from typing import Optional

from fastapi import APIRouter, Depends, Form, HTTPException, Request, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id
from app.database import get_db
from app.models.auto_cat_rule import AutoCatRule
from app.models.bank_profile import BankProfile
from app.models.budget_transaction import BudgetTransaction
from app.models.category import Category
from app.models.statement_import import StatementImport
from app.schemas.budget import (
    BankProfileCreate,
    BankProfileResponse,
    ConfirmImportRequest,
    ImportDetailResponse,
    ImportUploadResponse,
    SeedCategoriesResponse,
    SplitAtmRequest,
    SplitAtmResponse,
    CashSplitItem,
)
from app.services import import_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["import"])


def _sse_event(data: dict) -> str:
    """Format a dict as an SSE data line."""
    return f"data: {json_mod.dumps(data)}\n\n"

_FORMAT_MAP = {
    ".csv": "csv",
    ".ofx": "ofx",
    ".qfx": "ofx",
    ".mt940": "mt940",
    ".sta": "mt940",
    ".pdf": "pdf",
}


# ---------------------------------------------------------------------------
# Upload
# ---------------------------------------------------------------------------


@router.post(
    "/budget/import/upload",
    status_code=status.HTTP_202_ACCEPTED,
)
async def upload_import(
    file: UploadFile,
    source: Optional[str] = Form(default=None),
    bank_profile_id: Optional[str] = Form(default=None),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Upload a bank statement file for parsing and preview.

    For PDF imports, returns an SSE stream with progress events.
    For non-PDF imports, returns ImportUploadResponse JSON directly.
    """
    filename = file.filename or "unknown"
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    fmt = _FORMAT_MAP.get(ext)

    if fmt is None:
        raise HTTPException(
            status_code=400,
            detail={"error_type": "invalid_format", "message": f"Unsupported file format: {ext}", "action": "Upload a CSV, OFX, MT940, or PDF file."},
        )

    # PDF-specific validation
    source_config = None
    if fmt == "pdf":
        if not source:
            raise HTTPException(
                status_code=400,
                detail={"error_type": "missing_source", "message": "Source is required for PDF imports.", "action": "Select a source (Payoneer, Monobank, Millenium, or Other)."},
            )

        # LLM is required for all PDF imports
        from app.services import llm_service
        if not llm_service.is_available():
            raise HTTPException(
                status_code=503,
                detail={"error_type": "ai_unavailable", "message": "AI service is required for PDF imports.", "action": "Set ANTHROPIC_API_KEY in your environment."},
            )

        # Pass source as a hint to the LLM-based parser
        source_config = {"source_hint": source}

    file_content = await file.read()

    # File size check for PDF (FR-002)
    if fmt == "pdf" and len(file_content) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail={"error_type": "file_too_large", "message": "PDF file exceeds 10 MB size limit.", "action": "Upload a smaller PDF file."},
        )

    # For PDF imports, stream progress via SSE
    if fmt == "pdf":
        progress_queue: asyncio.Queue[dict] = asyncio.Queue()

        def on_progress(done: int, total: int) -> None:
            progress_queue.put_nowait({"stage": "categorizing", "total": total, "done": done})

        async def sse_generator():
            try:
                yield _sse_event({"stage": "extracting"})

                # Run import as a background task so we can drain progress events
                import_task = asyncio.create_task(import_service.create_import(
                    db,
                    user_id=user_id,
                    filename=filename,
                    file_content=file_content,
                    fmt=fmt,
                    bank_profile_id=bank_profile_id,
                    source=source,
                    source_config=source_config,
                    on_categorization_progress=on_progress,
                ))

                # Yield progress events as they arrive while import runs
                while not import_task.done():
                    try:
                        evt = await asyncio.wait_for(progress_queue.get(), timeout=0.5)
                        yield _sse_event(evt)
                    except asyncio.TimeoutError:
                        continue

                # Drain any remaining queued events
                while not progress_queue.empty():
                    evt = progress_queue.get_nowait()
                    yield _sse_event(evt)

                result = import_task.result()

                yield _sse_event({"stage": "saving"})

                # Convert Decimal amounts to float for JSON serialization
                for row in result.get("rows", []):
                    if hasattr(row.get("amount"), "__float__") and not isinstance(row.get("amount"), (int, float)):
                        row["amount"] = float(row["amount"])

                yield _sse_event({"stage": "complete", "result": result})

            except ValueError as e:
                yield _sse_event({"stage": "error", "message": str(e), "error_type": "parse_error"})
            except Exception as e:
                logger.exception("SSE import failed")
                yield _sse_event({"stage": "error", "message": str(e), "error_type": "server_error"})

        return StreamingResponse(sse_generator(), media_type="text/event-stream")

    # Non-PDF: standard JSON response
    try:
        result = await import_service.create_import(
            db,
            user_id=user_id,
            filename=filename,
            file_content=file_content,
            fmt=fmt,
            bank_profile_id=bank_profile_id,
            source=source,
            source_config=source_config,
        )
    except ValueError as e:
        error_msg = str(e)
        if "password" in error_msg.lower():
            raise HTTPException(
                status_code=400,
                detail={"error_type": "password_protected", "message": error_msg, "action": "Remove password protection from the PDF."},
            )
        if "no extractable" in error_msg.lower() or "failed to extract" in error_msg.lower():
            raise HTTPException(
                status_code=422,
                detail={"error_type": "no_tables", "message": error_msg, "action": "Ensure the PDF contains readable transaction data."},
            )
        raise HTTPException(
            status_code=400,
            detail={"error_type": "parse_error", "message": error_msg, "action": "Check the file format and try again."},
        )

    return result


# ---------------------------------------------------------------------------
# Categories for import review (must be before {import_id} routes)
# ---------------------------------------------------------------------------


@router.get("/budget/import/categories", response_model=dict)
def list_import_categories(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Return all known categories for the import review category selector."""
    categories = (
        db.query(Category)
        .filter(Category.user_id == user_id, Category.is_archived == False)  # noqa: E712
        .order_by(Category.name)
        .all()
    )
    return {
        "categories": [
            {
                "id": c.id,
                "name": c.name,
                "color": c.color,
                "monthly_budget": float(c.monthly_budget) if c.monthly_budget else None,
            }
            for c in categories
        ]
    }


# ---------------------------------------------------------------------------
# Seed categories upload (must be before {import_id} routes)
# ---------------------------------------------------------------------------


@router.post(
    "/budget/import/seed-categories",
    response_model=SeedCategoriesResponse,
    status_code=status.HTTP_200_OK,
)
async def upload_seed_categories(
    file: UploadFile,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Upload a seed categories CSV file."""
    from app.services.seed_service import parse_seed_csv, load_seed_categories

    file_content = await file.read()

    try:
        parsed = parse_seed_csv(file_content)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail={"error_type": "invalid_csv", "message": str(e), "action": "Ensure CSV has a 'Categories' column."},
        )

    result = load_seed_categories(db, user_id, parsed)
    return result


# ---------------------------------------------------------------------------
# Split ATM cash
# ---------------------------------------------------------------------------


@router.post(
    "/budget/import/{import_id}/split-atm-cash",
    response_model=SplitAtmResponse,
    status_code=status.HTTP_200_OK,
)
def split_atm_cash(
    import_id: str,
    payload: SplitAtmRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Parse cash spending notes for an ATM Withdrawal row via LLM."""
    import re
    from decimal import Decimal

    from app.services import llm_service

    # Validate import exists and is in preview
    stmt_import = (
        db.query(StatementImport)
        .filter(StatementImport.id == import_id, StatementImport.user_id == user_id)
        .first()
    )
    if stmt_import is None or stmt_import.status != "preview":
        raise HTTPException(status_code=404, detail="Import not found or not in preview status")

    # Validate notes contain at least one numeric amount
    if not re.search(r"\d+", payload.notes):
        raise HTTPException(status_code=400, detail="Notes must contain at least one numeric amount")

    # Load transactions for this import
    from app.models.budget_transaction import BudgetTransaction

    transactions = (
        db.query(BudgetTransaction)
        .filter(BudgetTransaction.import_id == import_id)
        .all()
    )

    if payload.row_index < 0 or payload.row_index >= len(transactions):
        raise HTTPException(status_code=400, detail="Row index out of range")

    tx = transactions[payload.row_index]

    # Validate the row is ATM Withdrawal
    atm_category = (
        db.query(Category)
        .filter(Category.user_id == user_id, Category.name == "ATM Withdrawal")
        .first()
    )
    if not atm_category or tx.category_id != atm_category.id:
        raise HTTPException(status_code=400, detail="Row is not an ATM Withdrawal transaction")

    atm_amount = abs(float(tx.amount))

    # Load user's categories for matching
    categories = (
        db.query(Category)
        .filter(Category.user_id == user_id, Category.is_archived == False)  # noqa: E712
        .all()
    )
    known_categories = [c.name for c in categories]
    cat_by_name = {c.name.lower(): c for c in categories}

    # Call LLM to parse notes
    parsed = llm_service.parse_cash_notes(payload.notes, atm_amount, known_categories)
    if parsed is None:
        raise HTTPException(status_code=502, detail="Failed to parse cash notes — LLM call failed or timed out")

    # Build response items and validate total
    items: list[CashSplitItem] = []
    total = Decimal("0")

    for exp in parsed:
        amount = Decimal(str(exp["amount"])).quantize(Decimal("0.01"))
        total += amount

        # Match category name to ID
        cat_name = exp.get("category_name", "Other")
        matched_cat = cat_by_name.get(cat_name.lower())
        if not matched_cat:
            # Fall back to "Other"
            matched_cat = cat_by_name.get("other")

        items.append(CashSplitItem(
            description=exp["description"],
            amount=amount,
            category_id=matched_cat.id if matched_cat else None,
            category_name=matched_cat.name if matched_cat else "Other",
        ))

    original_amount = abs(tx.amount)
    if total > original_amount:
        raise HTTPException(
            status_code=400,
            detail=f"Split total ({total}) exceeds ATM withdrawal amount ({original_amount})",
        )

    remainder = (original_amount - total).quantize(Decimal("0.01"))

    return SplitAtmResponse(items=items, remainder=remainder)


# ---------------------------------------------------------------------------
# Import status / preview
# ---------------------------------------------------------------------------


@router.get("/budget/import/{import_id}", response_model=ImportDetailResponse)
def get_import(
    import_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Return import status and row preview."""
    stmt_import = (
        db.query(StatementImport)
        .filter(StatementImport.id == import_id, StatementImport.user_id == user_id)
        .first()
    )
    if stmt_import is None:
        raise HTTPException(status_code=404, detail="Import not found")
    return stmt_import


# ---------------------------------------------------------------------------
# Confirm import
# ---------------------------------------------------------------------------


@router.post("/budget/import/{import_id}/confirm", status_code=status.HTTP_200_OK)
def confirm_import(
    import_id: str,
    payload: Optional[ConfirmImportRequest] = None,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Confirm the import and persist transactions."""
    stmt_import = (
        db.query(StatementImport)
        .filter(StatementImport.id == import_id, StatementImport.user_id == user_id)
        .first()
    )
    if stmt_import is None:
        raise HTTPException(status_code=404, detail="Import not found")

    category_overrides = payload.category_overrides if payload else None
    splits = None
    if payload and payload.splits:
        splits = [s.model_dump() for s in payload.splits]
    excluded_rows = payload.excluded_rows if payload else None
    amount_overrides = None
    if payload and payload.amount_overrides:
        amount_overrides = [o.model_dump() for o in payload.amount_overrides]
    return import_service.confirm_import(
        db, stmt_import,
        category_overrides=category_overrides,
        splits=splits,
        excluded_rows=excluded_rows,
        amount_overrides=amount_overrides,
    )


# ---------------------------------------------------------------------------
# Discard import
# ---------------------------------------------------------------------------


@router.post("/budget/import/{import_id}/discard", status_code=status.HTTP_200_OK)
def discard_import(
    import_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Discard the import and remove any preview data."""
    stmt_import = (
        db.query(StatementImport)
        .filter(StatementImport.id == import_id, StatementImport.user_id == user_id)
        .first()
    )
    if stmt_import is None:
        raise HTTPException(status_code=404, detail="Import not found")

    return import_service.discard_import(db, stmt_import)


# ---------------------------------------------------------------------------
# Bank profiles – list
# ---------------------------------------------------------------------------


@router.get("/budget/bank-profiles", response_model=list[BankProfileResponse])
def list_bank_profiles(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Return all bank profiles for the current user."""
    return (
        db.query(BankProfile)
        .filter(BankProfile.user_id == user_id)
        .order_by(BankProfile.name)
        .all()
    )


# ---------------------------------------------------------------------------
# Bank profiles – create
# ---------------------------------------------------------------------------


@router.post(
    "/budget/bank-profiles",
    response_model=BankProfileResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_bank_profile(
    payload: BankProfileCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Create a new bank profile."""
    profile = BankProfile(
        user_id=user_id,
        name=payload.name,
        delimiter=payload.delimiter,
        date_column=payload.date_column,
        amount_column=payload.amount_column,
        description_column=payload.description_column,
        reference_column=payload.reference_column,
        date_format=payload.date_format,
        encoding=payload.encoding,
        skip_rows=payload.skip_rows,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


# ---------------------------------------------------------------------------
# Bank profiles – update
# ---------------------------------------------------------------------------


@router.patch("/budget/bank-profiles/{profile_id}", response_model=BankProfileResponse)
def update_bank_profile(
    profile_id: str,
    payload: BankProfileCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Update a bank profile."""
    profile = (
        db.query(BankProfile)
        .filter(BankProfile.id == profile_id, BankProfile.user_id == user_id)
        .first()
    )
    if profile is None:
        raise HTTPException(status_code=404, detail="Bank profile not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return profile


# ---------------------------------------------------------------------------
# Bank profiles – delete
# ---------------------------------------------------------------------------


@router.delete(
    "/budget/bank-profiles/{profile_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_bank_profile(
    profile_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Delete a bank profile."""
    profile = (
        db.query(BankProfile)
        .filter(BankProfile.id == profile_id, BankProfile.user_id == user_id)
        .first()
    )
    if profile is None:
        raise HTTPException(status_code=404, detail="Bank profile not found")

    db.delete(profile)
    db.commit()


# ---------------------------------------------------------------------------
# Debug – reset all budget data
# ---------------------------------------------------------------------------


@router.post("/budget/debug/reset", status_code=status.HTTP_200_OK)
def debug_reset(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Delete all transactions, rules, categories, and imports for the user. Clears mappings file."""
    from app.services.mapping_file_service import save_bulk_mappings

    tx = db.query(BudgetTransaction).filter(BudgetTransaction.user_id == user_id).delete()
    rules = db.query(AutoCatRule).filter(
        AutoCatRule.category_id.in_(
            db.query(Category.id).filter(Category.user_id == user_id)
        )
    ).delete(synchronize_session="fetch")
    imps = db.query(StatementImport).filter(StatementImport.user_id == user_id).delete()
    cats = db.query(Category).filter(Category.user_id == user_id).delete()
    db.commit()

    save_bulk_mappings({})

    return {
        "transactions_deleted": tx,
        "rules_deleted": rules,
        "categories_deleted": cats,
        "imports_deleted": imps,
    }


# ---------------------------------------------------------------------------
# Debug – LLM model selector
# ---------------------------------------------------------------------------

AVAILABLE_MODELS = ["claude-haiku-4-5", "claude-sonnet-4-6"]


@router.get("/budget/debug/model", status_code=status.HTTP_200_OK)
def get_llm_model():
    """Return the currently active LLM model and available options."""
    from app.services import llm_service

    return {
        "model": llm_service.get_model(),
        "available_models": AVAILABLE_MODELS,
    }


@router.put("/budget/debug/model", status_code=status.HTTP_200_OK)
def set_llm_model(payload: dict):
    """Set the active LLM model."""
    from app.services import llm_service

    model = payload.get("model")
    if model not in AVAILABLE_MODELS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid model. Must be one of: {', '.join(AVAILABLE_MODELS)}",
        )

    llm_service.set_model(model)
    return {"model": model}
