from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class WhatIfAction(BaseModel):
    action: str = Field(..., description="'ADD', 'TRIM', or 'SELL'")
    symbol: str = Field(..., min_length=1, max_length=30)
    quantity: float = Field(..., gt=0)
    price: Optional[float] = Field(default=None, gt=0)


class WhatIfSimulateRequest(BaseModel):
    actions: List[WhatIfAction]
    portfolio_id: Optional[str] = None


class StressTestRequest(BaseModel):
    scenario_key: Optional[str] = Field(default=None, description="Pre-set scenario key, e.g. MARKET_CORRECTION_10, MARKET_CRASH_20, TECH_SELLOFF_15")
    custom_market_shock_pct: Optional[float] = Field(default=None, ge=-100.0, le=100.0)
    custom_sector_shocks: Optional[Dict[str, float]] = Field(default=None)
    portfolio_id: Optional[str] = None


class SaveScenarioRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    scenario_type: str = Field(..., description="'what_if' or 'stress_test'")
    description: Optional[str] = None
    parameters: Dict[str, Any]
    results: Dict[str, Any]


class SavedScenarioResponse(BaseModel):
    id: str
    name: str
    scenario_type: str
    description: Optional[str] = None
    parameters: Dict[str, Any]
    results: Dict[str, Any]
    created_at: str
