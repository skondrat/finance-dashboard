import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Index, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class InvestmentTransaction(Base):
    __tablename__ = "investment_transactions"
    __table_args__ = (
        Index("ix_investment_transactions_account_date", "account_id", "date"),
        Index("ix_investment_transactions_asset_date", "asset_id", "date"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    account_id: Mapped[str] = mapped_column(String(36), ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False)
    asset_id: Mapped[str] = mapped_column(String(36), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    type: Mapped[str] = mapped_column(String(4), nullable=False)  # buy, sell
    quantity: Mapped[Decimal] = mapped_column(Numeric(18, 8), nullable=False)
    price_per_unit: Mapped[Decimal] = mapped_column(Numeric(18, 8), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False)
    fees: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    account = relationship("Account", back_populates="investment_transactions")
    asset = relationship("Asset", back_populates="investment_transactions")
