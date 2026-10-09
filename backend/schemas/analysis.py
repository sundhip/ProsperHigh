from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class AnalysisRequest(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=30)
    user_id: Optional[str] = None
    personalized: bool = Field(default=True, description="Whether to include personalized profile and portfolio suitability")
    proposed_investment_amount: Optional[float] = Field(default=None, description="Hypothetical trade amount to evaluate pre-trade impact")


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
    
    # Phase 4 Personalization & Advanced Intelligence
    is_personalized: bool = False
    profile_version: Optional[int] = None
    investment_assessment: Optional[Dict[str, Any]] = None
    suitability_assessment: Optional[Dict[str, Any]] = None
    ai_debate: Optional[Dict[str, Any]] = None
    investment_thesis: Optional[Dict[str, Any]] = None
    counterfactual_scenarios: Optional[List[Dict[str, Any]]] = Field(default_factory=list)

    # Backward compatibility
    counterfactuals: List[str] = Field(default_factory=list)
    thesis_invalidation: List[str] = Field(default_factory=list)
    stock_switcher: List[Dict[str, Any]] = Field(default_factory=list)
    explanation: Optional[str] = None
    uncertainty: Optional[str] = None
    evidence: List[Dict[str, Any]] = Field(default_factory=list)
    llm_provider: Optional[str] = None
    warnings: List[str] = Field(default_factory=list)


class AnalysisComparisonRequest(BaseModel):
    run_id_a: str = Field(..., description="First analysis run ID")
    run_id_b: str = Field(..., description="Second analysis run ID")


class CounterfactualRequest(BaseModel):
    analysis_id: str = Field(..., description="Reference analysis ID to simulate counterfactuals on")
