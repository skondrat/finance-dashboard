import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class BankProfile(Base):
    __tablename__ = "bank_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    delimiter: Mapped[str] = mapped_column(String(1), nullable=False, default=",")
    date_column: Mapped[str] = mapped_column(String(50), nullable=False)
    amount_column: Mapped[str] = mapped_column(String(50), nullable=False)
    description_column: Mapped[str] = mapped_column(String(50), nullable=False)
    reference_column: Mapped[str | None] = mapped_column(String(50), nullable=True)
    date_format: Mapped[str] = mapped_column(String(20), nullable=False, default="%Y-%m-%d")
    encoding: Mapped[str] = mapped_column(String(20), nullable=False, default="utf-8")
    skip_rows: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
