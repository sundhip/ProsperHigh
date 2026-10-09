import time
import json
from datetime import datetime
from typing import Dict, Any, List, Optional

from backend.schemas.agent_contracts import (
    AgentOutput,
    AgentStatus,
    SignalType,
    EvidenceItem,
    ConflictReport,
    SynthesisOutput
)
from backend.services.conflict_service import conflict_service
from backend.services.decision_engine import decision_engine
from backend.services.ai_provider.service import ai_provider_service
from backend.services.ai_provider.base import ModelRequest


class SynthesisAgent:
    """
    Synthesis Agent: High-level reasoning and multi-agent evidence aggregator.
    Consumes structured domain agent outputs, identifies consensus and conflicts,
    synthesizes a thesis, and clearly distinguishes:
    Evidence | Interpretation | Conclusion | Uncertainty.
    """

    def synthesize(
        self,
        symbol: str,
        user_id: Optional[str],
        agent_outputs: Dict[str, AgentOutput]
    ) -> SynthesisOutput:
        start_time = time.time()
        warnings: List[str] = []

        # 1. Inspect valid vs failed/insufficient data agents
        valid_agents = {}
        missing_agents = []
        failed_agents = []

        for name, output in agent_outputs.items():
            if output.status == AgentStatus.SUCCESS:
                valid_agents[name] = output
            elif output.status == AgentStatus.INSUFFICIENT_DATA:
                missing_agents.append(name)
                warnings.append(f"Agent '{name}' reported insufficient underlying data.")
            else:
                failed_agents.append(name)
                warnings.append(f"Agent '{name}' encountered an execution failure.")

        # Determine overall analysis status
        if len(valid_agents) == 0:
            overall_status = AgentStatus.FAILED
        elif missing_agents or failed_agents:
            overall_status = AgentStatus.PARTIAL
        else:
            overall_status = AgentStatus.SUCCESS

        # 2. Extract signals and run Conflict Detection
        signals_map = {}
        for name, output in valid_agents.items():
            signals_map[name] = output.signal.value

        raw_conflict = conflict_service.detect_conflicts(
            {name: {"signal": s} for name, s in signals_map.items()}
        )
        conflict_report = ConflictReport(
            conflict_level=raw_conflict.get("conflict_level", "LOW"),
            badge=raw_conflict.get("badge", "Agreement"),
            summary=raw_conflict.get("summary", "Signals aligned."),
            disagreements=raw_conflict.get("disagreements", []),
            signals_breakdown=signals_map
        )

        # 3. Deterministic Decision Engine (Independent of LLM synthesis prompt)
        decision_result = decision_engine.evaluate(
            symbol=symbol,
            valid_agents=valid_agents,
            conflict_report=conflict_report,
            missing_agents=missing_agents,
            failed_agents=failed_agents
        )
        final_decision = decision_result.final_decision
        net_score = decision_result.net_score
        confidence = decision_result.confidence
        decision_traceability = decision_result.traceability

        # 4. Aggregate strictly verified evidence
        all_evidence: List[EvidenceItem] = []
        for agent in valid_agents.values():
            all_evidence.extend(agent.evidence)

        # 5. Formulate Evidence, Interpretation, Conclusion, and Uncertainty
        # Check if external AI provider is configured for synthesized prose
        provider_name = ai_provider_service.get_active_provider_name()

        # Build prompt facts for model synthesis
        agent_summaries = {name: agent.summary for name, agent in valid_agents.items()}
        prompt_content = {
            "symbol": symbol,
            "net_score": net_score,
            "final_decision": final_decision.value,
            "conflict_level": conflict_report.conflict_level,
            "disagreements": conflict_report.disagreements,
            "agent_summaries": agent_summaries,
            "missing_data": missing_agents
        }

        # Deterministic base synthesis
        interpretation = (
            f"Cross-agent telemetry indicates {conflict_report.badge.lower()} (net score: {net_score:+d}). "
            f"Technical and fundamental factors contribute {valid_agents.get('technical', AgentOutput(agent_name='', symbol='', summary='', impact_score=0)).impact_score:+d} and "
            f"{valid_agents.get('fundamental', AgentOutput(agent_name='', symbol='', summary='', impact_score=0)).impact_score:+d} points respectively. "
            f"{conflict_report.summary}"
        )

        conclusion = (
            f"Based on evaluated evidence, the synthesized recommendation is {final_decision.value} "
            f"with {confidence}% confidence. Net impact weighting reflects combined momentum, fundamental quality, "
            f"and portfolio risk constraints."
        )

        uncertainty_elements = []
        if missing_agents:
            uncertainty_elements.append(f"Missing data from {', '.join(missing_agents)}")
        if conflict_report.conflict_level in ["MODERATE", "HIGH"]:
            uncertainty_elements.append("Cross-domain signal friction between technicals, sentiment, and risk")
        uncertainty_elements.append("Broad market macro rate decisions and raw material margin sensitivity")
        uncertainty = "; ".join(uncertainty_elements) + "."

        summary = (
            f"Synthesized {len(valid_agents)} domain specialists for {symbol}: {final_decision.value} "
            f"({net_score:+d} net points, {confidence}% confidence). {conflict_report.summary}"
        )

        # If an external provider is available and not deterministic, attempt AI prose enhancement
        if provider_name != "deterministic":
            try:
                system_prompt = (
                    "You are the ProsperHigh Chief Investment Intelligence Synthesis Agent. "
                    "Analyze the provided structured domain agent outputs. "
                    "Do NOT invent any financial numbers or fake facts absent from the input. "
                    "Return a JSON object with keys: 'interpretation', 'conclusion', 'uncertainty', 'thesis'."
                )
                req = ModelRequest(
                    messages=[{"role": "user", "content": json.dumps(prompt_content)}],
                    system_prompt=system_prompt,
                    temperature=0.2,
                    max_tokens=600,
                    json_mode=True
                )
                model_resp = ai_provider_service.generate(req)
                if model_resp.parsed_json:
                    p = model_resp.parsed_json
                    interpretation = p.get("interpretation", interpretation)
                    conclusion = p.get("conclusion", conclusion)
                    uncertainty = p.get("uncertainty", uncertainty)
                    if "thesis" in p:
                        summary = p["thesis"]
            except Exception as e:
                warnings.append(f"AI prose generation routed to deterministic synthesis: {str(e)}")

        latency_ms = int((time.time() - start_time) * 1000)

        return SynthesisOutput(
            symbol=symbol,
            status=overall_status,
            final_decision=final_decision,
            confidence=confidence,
            net_score=net_score,
            summary=summary,
            evidence=all_evidence,
            interpretation=interpretation,
            conclusion=conclusion,
            uncertainty=uncertainty,
            conflict_report=conflict_report,
            agent_outputs=agent_outputs,
            execution_time_ms=latency_ms,
            model_provider=provider_name,
            methodology_version=decision_result.methodology_version,
            decision_traceability=decision_traceability,
            warnings=warnings
        )


synthesis_agent = SynthesisAgent()
