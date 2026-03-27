"""
Auth endpoints – register, login, refresh, me (T119).
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id
from app.database import get_db
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
)
from app.services.auth_service import login_user, refresh_tokens, register_user

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user and return access/refresh tokens."""
    tokens = register_user(
        db,
        email=payload.email,
        password=payload.password,
        display_name=payload.display_name,
    )
    return tokens


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate a user and return access/refresh tokens."""
    tokens = login_user(db, email=payload.email, password=payload.password)
    return tokens


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)):
    """Exchange a refresh token for a new access/refresh token pair."""
    tokens = refresh_tokens(db, refresh_token=payload.refresh_token)
    return tokens


@router.get("/me")
def me(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Return the current authenticated user's profile."""
    user = db.query(User).filter(User.id == user_id).first()
    return {
        "id": user.id,
        "email": user.email,
        "display_name": user.display_name,
        "preferred_currency": user.preferred_currency,
        "theme": user.theme,
    }
