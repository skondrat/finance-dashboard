import random
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

_VIBRANT_COLORS = [
    "#3B82F6",  # blue
    "#22C55E",  # green
    "#EAB308",  # yellow
    "#A855F7",  # purple
    "#EF4444",  # red
    "#F97316",  # orange
    "#06B6D4",  # cyan
    "#EC4899",  # pink
    "#10B981",  # emerald
    "#8B5CF6",  # violet
    "#14B8A6",  # teal
    "#F59E0B",  # amber
    "#6366F1",  # indigo
    "#84CC16",  # lime
    "#D946EF",  # fuchsia
    "#0EA5E9",  # sky
    "#E11D48",  # rose
    "#059669",  # green-700
    "#7C3AED",  # violet-600
    "#DC2626",  # red-600
    "#EA580C",  # orange-600
    "#0891B2",  # cyan-600
    "#DB2777",  # pink-600
    "#2563EB",  # blue-600
    "#65A30D",  # lime-600
    "#CA8A04",  # yellow-600
    "#9333EA",  # purple-600
    "#0D9488",  # teal-600
    "#C026D3",  # fuchsia-600
    "#4F46E5",  # indigo-600
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
