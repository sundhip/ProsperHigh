from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class AnalysisRequest(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=30)
    user_id: Optional[str] = None


class AnalysisResponse(BaseModel):
    analysis_id: Optional[str] = None
    symbol: str
    status: str = "SUCCESS"
    user_id: Optional[str] = None
    user_name: Optional[str] = None
    final_decision: str
    confidence: int
    net_score: int
    agents: Dict[str, Any]
    conflicts: Dict[str, Any]
    positive_factors: List[str] = Field(default_factory=list)
    negative_factors: List[str] = Field(default_factory=list)
    biggest_factor: Dict[str, Any] = Field(default_factory=dict)
    decision_trace: List[Dict[str, Any]] = Field(default_factory=list)
    counterfactuals: List[str] = Field(default_factory=list)
    thesis_invalidation: List[str] = Field(default_factory=list)
    stock_switcher: List[Dict[str, Any]] = Field(default_factory=list)
    explanation: Optional[str] = None
    uncertainty: Optional[str] = None
    evidence: List[Dict[str, Any]] = Field(default_factory=list)
    llm_provider: Optional[str] = None
    warnings: List[str] = Field(default_factory=list)
