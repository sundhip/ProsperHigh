import uuid
from datetime import datetime, timezone
from typing import List, Optional, Any
from sqlalchemy import (
    String, Integer, Float, Boolean, Text, DateTime, JSON, ForeignKey, func, Enum
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: f"USR-{uuid.uuid4().hex[:8].upper()}")
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    investor_profile: Mapped[Optional["InvestorProfile"]] = relationship(
        "InvestorProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    financial_profile: Mapped[Optional["FinancialProfile"]] = relationship(
        "FinancialProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    portfolios: Mapped[List["Portfolio"]] = relationship(
        "Portfolio", back_populates="user", cascade="all, delete-orphan"
    )
    holdings: Mapped[List["Holding"]] = relationship(
        "Holding", back_populates="user", cascade="all, delete-orphan"
    )
    transactions: Mapped[List["Transaction"]] = relationship(
        "Transaction", back_populates="user", cascade="all, delete-orphan"
    )
    analyses: Mapped[List["AnalysisHistory"]] = relationship(
        "AnalysisHistory", back_populates="user", cascade="all, delete-orphan"
    )


class InvestorProfile(Base):
    __tablename__ = "investor_profiles"

    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True, index=True
    )
    country: Mapped[str] = mapped_column(String(50), default="India", nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    market_preference: Mapped[str] = mapped_column(String(50), default="NSE", nullable=False)
    experience_level: Mapped[str] = mapped_column(String(50), default="Learning Investor", nullable=False)
    past_assets: Mapped[Any] = mapped_column(JSON, default=list, nullable=False)
    primary_goals: Mapped[Any] = mapped_column(JSON, default=list, nullable=False)
    primary_goal_top: Mapped[str] = mapped_column(String(100), default="Wealth Growth", nullable=False)
    investment_horizon: Mapped[str] = mapped_column(String(50), default="3–5 Years", nullable=False)
    loss_reaction: Mapped[str] = mapped_column(String(50), default="Wait and monitor", nullable=False)
    volatility_comfort: Mapped[int] = mapped_column(Integer, default=50, nullable=False)
    risk_score: Mapped[int] = mapped_column(Integer, default=58, nullable=False)
    risk_category: Mapped[str] = mapped_column(String(50), default="Balanced Growth", nullable=False)
    explanation_style: Mapped[str] = mapped_column(String(50), default="Standard", nullable=False)
    max_stock_exposure_pct: Mapped[float] = mapped_column(Float, default=20.0, nullable=False)
    avoided_sectors: Mapped[Any] = mapped_column(JSON, default=list, nullable=False)
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="investor_profile")


class FinancialProfile(Base):
    __tablename__ = "financial_profiles"

    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True, index=True
    )
    planned_investment: Mapped[str] = mapped_column(String(50), default="₹25,000 – ₹1 Lakh", nullable=False)
    current_invested: Mapped[str] = mapped_column(String(50), default="₹25,000", nullable=False)
    monthly_capacity: Mapped[str] = mapped_column(String(50), default="₹5,000 – ₹15,000", nullable=False)
    emergency_savings: Mapped[str] = mapped_column(String(20), default="Yes", nullable=False)
    financial_obligations: Mapped[Any] = mapped_column(JSON, default=list, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="financial_profile")


class Security(Base):
    __tablename__ = "securities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    symbol: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    exchange: Mapped[str] = mapped_column(String(20), default="NSE", nullable=False)
    sector: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    asset_class: Mapped[str] = mapped_column(String(50), default="Equity", nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class Portfolio(Base):
    __tablename__ = "portfolios"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: f"PORT-{uuid.uuid4().hex[:8].upper()}")
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), default="Main Portfolio", nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="portfolios")
    holdings: Mapped[List["Holding"]] = relationship("Holding", back_populates="portfolio", cascade="all, delete-orphan")
    transactions: Mapped[List["Transaction"]] = relationship("Transaction", back_populates="portfolio", cascade="all, delete-orphan")


class Holding(Base):
    __tablename__ = "holdings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    portfolio_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("portfolios.id", ondelete="CASCADE"), index=True, nullable=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    symbol: Mapped[str] = mapped_column(String(30), index=True, nullable=False)
    name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    sector: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    quantity: Mapped[float] = mapped_column(Float, nullable=False)
    average_price: Mapped[float] = mapped_column(Float, nullable=False)  # Cost basis per unit
    security_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("securities.id", ondelete="SET NULL"), nullable=True)
    purchase_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="holdings")
    portfolio: Mapped[Optional["Portfolio"]] = relationship("Portfolio", back_populates="holdings")
    security: Mapped[Optional["Security"]] = relationship("Security")


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: f"TXN-{uuid.uuid4().hex[:10].upper()}")
    portfolio_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("portfolios.id", ondelete="CASCADE"), index=True, nullable=False
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    symbol: Mapped[str] = mapped_column(String(30), index=True, nullable=False)
    transaction_type: Mapped[str] = mapped_column(String(20), default="BUY", nullable=False)  # BUY, SELL, DIVIDEND
    quantity: Mapped[float] = mapped_column(Float, nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    fees: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    total_amount: Mapped[float] = mapped_column(Float, nullable=False)  # quantity * price (+/- fees)
    executed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="transactions")
    portfolio: Mapped["Portfolio"] = relationship("Portfolio", back_populates="transactions")


class AnalysisHistory(Base):
    __tablename__ = "analyses"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"ANL-{uuid.uuid4().hex[:12].upper()}")
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    symbol: Mapped[str] = mapped_column(String(30), index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="SUCCESS", nullable=False)
    final_decision: Mapped[str] = mapped_column(String(50), nullable=False)
    confidence: Mapped[int] = mapped_column(Integer, nullable=False)
    net_score: Mapped[int] = mapped_column(Integer, nullable=False)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    conflict_level: Mapped[str] = mapped_column(String(32), default="LOW", nullable=False)
    model_provider: Mapped[str] = mapped_column(String(64), default="deterministic", nullable=False)
    execution_time_ms: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    full_json: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="analyses")
    agent_runs: Mapped[List["AgentRun"]] = relationship("AgentRun", back_populates="analysis", cascade="all, delete-orphan")


AnalysisRun = AnalysisHistory


class AgentRun(Base):
    __tablename__ = "agent_runs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"AGR-{uuid.uuid4().hex[:12].upper()}")
    analysis_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("analyses.id", ondelete="CASCADE"), index=True, nullable=False
    )
    agent_name: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="SUCCESS", nullable=False)
    signal: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    confidence: Mapped[float] = mapped_column(Float, default=0.8, nullable=False)
    impact_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    findings_json: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    evidence_json: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    warnings_json: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    model_used: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    execution_time_ms: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    analysis: Mapped["AnalysisHistory"] = relationship("AnalysisHistory", back_populates="agent_runs")

