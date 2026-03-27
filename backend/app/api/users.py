"""
User preference endpoints (T114).
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id
from app.database import get_db
from app.models.user import User

router = APIRouter(prefix="/api/v1", tags=["users"])


class ThemeUpdate(BaseModel):
    theme: str

    @field_validator("theme")
    @classmethod
    def validate_theme(cls, v: str) -> str:
        if v not in ("light", "dark"):
            raise ValueError("theme must be 'light' or 'dark'")
        return v


@router.patch("/users/me/theme", status_code=status.HTTP_200_OK)
def update_user_theme(
    body: ThemeUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Update the current user's theme preference."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    user.theme = body.theme
    db.commit()
    db.refresh(user)
    return {"theme": user.theme}
