"""
Statement import and bank profile endpoints (T063 + T064).
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id
from app.database import get_db
from app.models.bank_profile import BankProfile
from app.models.statement_import import StatementImport
from app.schemas.budget import (
    BankProfileCreate,
    BankProfileResponse,
    ImportDetailResponse,
    ImportUploadResponse,
)
from app.services import import_service

router = APIRouter(prefix="/api/v1", tags=["import"])


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
    bank_profile_id: Optional[str] = None,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Upload a bank statement file for parsing and preview."""
    result = await import_service.create_import(
        db, user_id=user_id, file=file, bank_profile_id=bank_profile_id
    )
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

    import_service.confirm_import(db, stmt_import)
    return {"status": "confirmed"}


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

    import_service.discard_import(db, stmt_import)
    return {"status": "discarded"}


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
