"""
Statement import and bank profile endpoints (T063 + T064).
Extended for PDF import with source selection and categorization.
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id
from app.database import get_db
from app.models.bank_profile import BankProfile
from app.models.category import Category
from app.models.statement_import import StatementImport
from app.schemas.budget import (
    BankProfileCreate,
    BankProfileResponse,
    ConfirmImportRequest,
    ImportDetailResponse,
    ImportUploadResponse,
    SeedCategoriesResponse,
)
from app.services import import_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["import"])

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
    response_model=ImportUploadResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def upload_import(
    file: UploadFile,
    source: Optional[str] = Form(default=None),
    bank_profile_id: Optional[str] = Form(default=None),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Upload a bank statement file for parsing and preview."""
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

    try:
        result = import_service.create_import(
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
            {"id": c.id, "name": c.name, "color": c.color}
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
    return import_service.confirm_import(db, stmt_import, category_overrides=category_overrides)


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
