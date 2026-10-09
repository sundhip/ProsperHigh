from typing import Optional, List
from pydantic import BaseModel, Field


class AlertCreateRequest(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=30)
    alert_type: str = Field(default="PRICE_TARGET", description="PRICE_TARGET, THESIS_CHANGE, VOLATILITY, CONCENTRATION")
    condition_type: str = Field(default="ABOVE", description="ABOVE, BELOW, CHANGE_PCT, TRIGGERED")
    threshold_value: Optional[float] = None
    message: Optional[str] = None


class AlertResponse(BaseModel):
    id: str
    symbol: str
    alert_type: str
    condition_type: str
    threshold_value: Optional[float] = None
    status: str
    message: Optional[str] = None
    triggered_at: Optional[str] = None
    created_at: str


class AlertsListResponse(BaseModel):
    alerts: List[AlertResponse]
    active_count: int
    triggered_count: int
