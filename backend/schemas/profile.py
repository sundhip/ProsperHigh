from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class InvestorProfileSchema(BaseModel):
    country: str = "India"
    currency: str = "INR"
    market_preference: str = "NSE"
    experience_level: str = "Learning Investor"
    past_assets: List[str] = Field(default_factory=list)
    primary_goals: List[str] = Field(default_factory=lambda: ["Wealth Growth"])
    primary_goal_top: str = "Wealth Growth"
    investment_horizon: str = "3–5 Years"
    loss_reaction: str = "Wait and monitor"
    volatility_comfort: int = Field(default=50, ge=0, le=100)
    risk_score: Optional[int] = 58
    risk_category: Optional[str] = "Balanced Growth"
    max_stock_exposure_pct: Optional[float] = 20.0
    avoided_sectors: List[str] = Field(default_factory=list)


class ProfileUpdateRequest(BaseModel):
    country: Optional[str] = None
    currency: Optional[str] = None
    market_preference: Optional[str] = None
    experience_level: Optional[str] = None
    past_assets: Optional[List[str]] = None
    primary_goals: Optional[List[str]] = None
    primary_goal_top: Optional[str] = None
    investment_horizon: Optional[str] = None
    loss_reaction: Optional[str] = None
    volatility_comfort: Optional[int] = Field(default=None, ge=0, le=100)
    risk_score: Optional[int] = None
    risk_category: Optional[str] = None
    max_stock_exposure_pct: Optional[float] = None
    avoided_sectors: Optional[List[str]] = None


class FinancialProfileSchema(BaseModel):
    planned_investment: str = "₹25,000 – ₹1 Lakh"
    current_invested: str = "₹25,000"
    monthly_capacity: str = "₹5,000 – ₹15,000"
    emergency_savings: str = "Yes"
    financial_obligations: List[str] = Field(default_factory=list)


class OnboardingRequest(BaseModel):
    user_id: Optional[str] = None
    profile: Dict[str, Any] = Field(default_factory=dict)
    financial: Dict[str, Any] = Field(default_factory=dict)
    holdings: List[Dict[str, Any]] = Field(default_factory=list)


class ProfileResponse(BaseModel):
    user_id: str
    onboarding_completed: bool
    country: str = "India"
    currency: str = "INR"
    market_preference: str = "NSE"
    experience_level: str = "Learning Investor"
    past_assets: List[str] = Field(default_factory=list)
    primary_goals: List[str] = Field(default_factory=list)
    primary_goal_top: str = "Wealth Growth"
    investment_horizon: str = "3–5 Years"
    loss_reaction: str = "Wait and monitor"
    volatility_comfort: int = 50
    risk_score: int = 58
    risk_category: str = "Balanced Growth"
    max_stock_exposure_pct: float = 25.0
    financial: Dict[str, Any] = Field(default_factory=dict)
