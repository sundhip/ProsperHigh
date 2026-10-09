from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class InvestorProfileSchema(BaseModel):
    country: str = "India"
    currency: str = "INR"
    market_preference: str = "NSE"
    experience_level: Optional[str] = "Learning Investor"
    past_assets: List[str] = Field(default_factory=list)
    primary_goals: List[str] = Field(default_factory=list)
    primary_goal_top: Optional[str] = "Wealth Growth"
    investment_horizon: Optional[str] = "3–5 Years"
    loss_reaction: Optional[str] = "Wait and monitor"
    volatility_comfort: Optional[int] = Field(default=50, ge=0, le=100)
    risk_score: Optional[int] = None
    risk_category: Optional[str] = None
    max_stock_exposure_pct: Optional[float] = 20.0
    avoided_sectors: List[str] = Field(default_factory=list)
    target_allocations: Dict[str, float] = Field(default_factory=dict)
    liquidity_needs: Optional[str] = None
    investment_preferences: Dict[str, Any] = Field(default_factory=dict)
    profile_version: int = 1
    is_complete: bool = False


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
    target_allocations: Optional[Dict[str, float]] = None
    liquidity_needs: Optional[str] = None
    investment_preferences: Optional[Dict[str, Any]] = None


class FinancialProfileSchema(BaseModel):
    planned_investment: Optional[str] = "₹25,000 – ₹1 Lakh"
    current_invested: Optional[str] = "₹25,000"
    monthly_capacity: Optional[str] = "₹5,000 – ₹15,000"
    emergency_savings: Optional[str] = "Yes"
    financial_obligations: List[str] = Field(default_factory=list)


class OnboardingRequest(BaseModel):
    user_id: Optional[str] = None
    profile: Dict[str, Any] = Field(default_factory=dict)
    financial: Dict[str, Any] = Field(default_factory=dict)
    holdings: List[Dict[str, Any]] = Field(default_factory=list)


class ProfileResponse(BaseModel):
    user_id: str
    onboarding_completed: bool
    is_complete: bool = False
    profile_version: int = 1
    country: str = "India"
    currency: str = "INR"
    market_preference: str = "NSE"
    experience_level: Optional[str] = None
    past_assets: List[str] = Field(default_factory=list)
    primary_goals: List[str] = Field(default_factory=list)
    primary_goal_top: Optional[str] = None
    investment_horizon: Optional[str] = None
    loss_reaction: Optional[str] = None
    volatility_comfort: Optional[int] = None
    risk_score: Optional[int] = None
    risk_category: Optional[str] = None
    max_stock_exposure_pct: float = 20.0
    avoided_sectors: List[str] = Field(default_factory=list)
    target_allocations: Dict[str, float] = Field(default_factory=dict)
    liquidity_needs: Optional[str] = None
    investment_preferences: Dict[str, Any] = Field(default_factory=dict)
    financial: Dict[str, Any] = Field(default_factory=dict)
