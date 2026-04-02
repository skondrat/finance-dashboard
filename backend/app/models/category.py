import random
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

_VIBRANT_COLORS = [
    "#3B82F6", "#22C55E", "#EAB308", "#A855F7", "#EF4444",
    "#F97316", "#06B6D4", "#EC4899", "#10B981", "#8B5CF6",
    "#14B8A6", "#F59E0B", "#6366F1", "#84CC16", "#D946EF",
]


def _random_vibrant_color() -> str:
    return random.choice(_VIBRANT_COLORS)


class Category(Base):
    __tablename__ = "categories"
    __table_args__ = (
        Index("ix_categories_user_archived", "user_id", "is_archived"),
        UniqueConstraint("user_id", "name", name="uq_categories_user_name"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    color: Mapped[str] = mapped_column(String(7), nullable=False, default=_random_vibrant_color)
    monthly_budget: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    is_archived: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_default: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    merged_into_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("categories.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    rules = relationship("AutoCatRule", back_populates="category", cascade="all, delete-orphan")
    budget_transactions = relationship("BudgetTransaction", back_populates="category")
    merged_into = relationship("Category", remote_side="Category.id")
