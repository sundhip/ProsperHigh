from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class AgentStatus(str, Enum):
    SUCCESS = "SUCCESS"
    PARTIAL = "PARTIAL"
    FAILED = "FAILED"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"


class SignalType(str, Enum):
    BUY = "BUY"
    HOLD = "HOLD"
    AVOID = "AVOID"
    NEUTRAL = "NEUTRAL"


class EvidenceItem(BaseModel):
    claim: str
    source: str
    metric_value: Optional[str] = None
    timestamp: str
    reference: Optional[str] = None


class AgentFinding(BaseModel):
    title: str
    description: str
    sentiment: str = "NEUTRAL"
    impact_score: int = 0


class AgentOutput(BaseModel):
    agent_name: str
    symbol: str
    status: AgentStatus = AgentStatus.SUCCESS
    signal: SignalType = SignalType.NEUTRAL
    confidence: float = Field(0.8, ge=0.0, le=1.0)
    impact_score: int = 0
    summary: str
    findings: List[AgentFinding] = Field(default_factory=list)
    evidence: List[EvidenceItem] = Field(default_factory=list)
    risks: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    limitations: List[str] = Field(default_factory=list)
    data_timestamp: str = Field(default="")
    execution_metadata: Dict[str, Any] = Field(default_factory=dict)


class ConflictReport(BaseModel):
    conflict_level: str = "LOW"
    badge: str = "Strong Agreement"
    summary: str = "Primary intelligence signals are aligned."
    disagreements: List[str] = Field(default_factory=list)
    signals_breakdown: Dict[str, str] = Field(default_factory=dict)


class SynthesisOutput(BaseModel):
    symbol: str
    status: AgentStatus = AgentStatus.SUCCESS
    final_decision: SignalType = SignalType.HOLD
    confidence: int = Field(75, ge=0, le=100)
    net_score: int = 0
    summary: str
    evidence: List[EvidenceItem] = Field(default_factory=list)
    interpretation: str
    conclusion: str
    uncertainty: str
    conflict_report: ConflictReport = Field(default_factory=ConflictReport)
    agent_outputs: Dict[str, AgentOutput] = Field(default_factory=dict)
    execution_time_ms: int = 0
    model_provider: str = "deterministic"
    warnings: List[str] = Field(default_factory=list)
