import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Index, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class BudgetTransaction(Base):
    __tablename__ = "budget_transactions"
    __table_args__ = (
        Index("ix_budget_transactions_user_date", "user_id", "date"),
        Index("ix_budget_transactions_user_category", "user_id", "category_id"),
        Index("ix_budget_transactions_dedup_hash", "dedup_hash"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    import_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("statement_imports.id"), nullable=True)
    category_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("categories.id"), nullable=True)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False)
    reference: Mapped[str | None] = mapped_column(String(200), nullable=True)
    is_investment: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    dedup_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    category = relationship("Category", back_populates="budget_transactions")
    statement_import = relationship("StatementImport", back_populates="transactions")
