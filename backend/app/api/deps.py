"""
Shared API dependencies (T118).

Provides JWT-based ``get_current_user_id`` and an optional variant for
public endpoints.
"""

from typing import Optional

from fastapi import Header, HTTPException, status

from app.services.auth_service import decode_token


def get_current_user_id(authorization: str = Header(None)) -> str:
    """Extract and validate the JWT from the Authorization header.

    Expects ``Authorization: Bearer <token>``.
    Raises ``HTTPException(401)`` when the header is missing or the token
    is invalid / expired.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header",
        )

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format",
        )

    token = parts[1]
    return decode_token(token)


def get_optional_user_id(authorization: str = Header(None)) -> Optional[str]:
    """Like ``get_current_user_id`` but returns ``None`` when no token is
    present instead of raising.  Useful for public-but-personalisable
    endpoints.
    """
    if not authorization:
        return None

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None

    try:
        return decode_token(parts[1])
    except HTTPException:
        return None
