from typing import Dict, List, Any
from pydantic import BaseModel, Field
from backend.schemas.agent_contracts import AgentOutput, AgentStatus, SignalType, ConflictReport


class DecisionResult(BaseModel):
    final_decision: SignalType
    net_score: int
    confidence: int = Field(ge=0, le=100)
    methodology_version: str
    traceability: Dict[str, Any]
    summary_explanation: str


class DecisionEngine:
    """
    Deterministic Decision Engine:
    Transforms validated agent analytical findings and conflict signals into a transparent,
    versioned, reproducible decision output separate from LLM synthesis prompts.
    """
    METHODOLOGY_VERSION = "v3.1.0"

    # Normalized weighting per domain specialist
    AGENT_WEIGHTS: Dict[str, float] = {
        "Fundamental": 1.5,
        "Risk": 1.4,
        "Technical": 1.2,
        "Regulatory": 1.1,
        "Market": 1.0,
        "News": 0.8,
    }

    # Thresholds for final synthesis signal
    BUY_THRESHOLD = 12
    AVOID_THRESHOLD = -4

    def evaluate(
        self,
        symbol: str,
        valid_agents: Dict[str, AgentOutput],
        conflict_report: ConflictReport,
        missing_agents: List[str],
        failed_agents: List[str]
    ) -> DecisionResult:
        """
        Executes reproducible deterministic decision assessment:
        1. Multiplies agent impact scores by domain weights.
        2. Applies conflict-level friction deductions.
        3. Applies penalties for missing/failed agent domains.
        4. Calculates calibrated heuristic confidence score.
        5. Produces step-by-step mathematical traceability.
        """
        traceability_records = []
        raw_weighted_sum = 0.0

        for name, agent in valid_agents.items():
            weight = self.AGENT_WEIGHTS.get(name, 1.0)
            weighted_impact = agent.impact_score * weight
            raw_weighted_sum += weighted_impact
            traceability_records.append({
                "agent": name,
                "signal": agent.signal.value,
                "raw_impact": agent.impact_score,
                "weight": weight,
                "weighted_impact": round(weighted_impact, 2)
            })

        # Net score integer rounding
        net_score = int(round(raw_weighted_sum))

        # Conflict friction deduction
        conflict_penalty = 0
        if conflict_report.conflict_level == "HIGH":
            conflict_penalty = 4
            net_score -= conflict_penalty
        elif conflict_report.conflict_level == "MODERATE":
            conflict_penalty = 2
            net_score -= conflict_penalty

        # Decision classification
        if net_score >= self.BUY_THRESHOLD:
            decision = SignalType.BUY
        elif net_score >= self.AVOID_THRESHOLD:
            decision = SignalType.HOLD
        else:
            decision = SignalType.AVOID

        # Confidence calculation (Base 88, adjusted for friction and gaps)
        base_confidence = 88
        conflict_conf_penalty = 15 if conflict_report.conflict_level == "HIGH" else (8 if conflict_report.conflict_level == "MODERATE" else 0)
        missing_conf_penalty = len(missing_agents) * 6
        failed_conf_penalty = len(failed_agents) * 10

        confidence = base_confidence - conflict_conf_penalty - missing_conf_penalty - failed_conf_penalty
        confidence = max(20, min(95, confidence))

        explanation = (
            f"Methodology {self.METHODOLOGY_VERSION} evaluated {len(valid_agents)} active agents. "
            f"Weighted score: {net_score:+d} (Conflict penalty: -{conflict_penalty}). "
            f"Verdict: {decision.value} at {confidence}% evidence strength."
        )

        traceability = {
            "methodology_version": self.METHODOLOGY_VERSION,
            "agent_evaluations": traceability_records,
            "raw_weighted_sum": round(raw_weighted_sum, 2),
            "conflict_penalty_applied": conflict_penalty,
            "net_score": net_score,
            "thresholds": {
                "buy_threshold": self.BUY_THRESHOLD,
                "avoid_threshold": self.AVOID_THRESHOLD
            },
            "confidence_derivation": {
                "base": base_confidence,
                "conflict_deduction": conflict_conf_penalty,
                "missing_agents_deduction": missing_conf_penalty,
                "failed_agents_deduction": failed_conf_penalty,
                "final_confidence": confidence
            }
        }

        return DecisionResult(
            final_decision=decision,
            net_score=net_score,
            confidence=confidence,
            methodology_version=self.METHODOLOGY_VERSION,
            traceability=traceability,
            summary_explanation=explanation
        )


decision_engine = DecisionEngine()
