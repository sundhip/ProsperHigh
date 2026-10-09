from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class GoalCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    target_amount: float = Field(..., gt=0)
    currency: str = Field(default="INR", max_length=10)
    target_date: Optional[datetime] = None
    monthly_contribution: float = Field(default=0.0, ge=0)
    description: Optional[str] = None
    portfolio_id: Optional[str] = None


class GoalUpdateRequest(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[float] = Field(default=None, gt=0)
    currency: Optional[str] = None
    target_date: Optional[datetime] = None
    monthly_contribution: Optional[float] = Field(default=None, ge=0)
    description: Optional[str] = None
    portfolio_id: Optional[str] = None


class GoalResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    target_amount: float
    currency: str = "INR"
    current_portfolio_value: float = 0.0
    progress_percentage: float = 0.0
    funding_gap: float = 0.0
    monthly_contribution: float = 0.0
    target_date: Optional[str] = None
    months_remaining: Optional[int] = None
    required_monthly_savings_at_zero_growth: Optional[float] = None
    status: str
    created_at: Optional[str] = None
    disclaimer: str
