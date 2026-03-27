import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class StatementImport(Base):
    __tablename__ = "statement_imports"
    __table_args__ = (
        Index("ix_statement_imports_user_uploaded", "user_id", "uploaded_at"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    format: Mapped[str] = mapped_column(String(10), nullable=False)  # csv, ofx, mt940
    bank_profile_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("bank_profiles.id"), nullable=True)
    row_count: Mapped[int] = mapped_column(Integer, nullable=False)
    duplicate_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[str] = mapped_column(String(20), nullable=False)  # parsing, preview, confirmed, discarded
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    transactions = relationship("BudgetTransaction", back_populates="statement_import")
    bank_profile = relationship("BankProfile")
