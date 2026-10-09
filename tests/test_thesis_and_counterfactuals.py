import pytest
from backend.services.thesis_engine import thesis_engine
from backend.services.counterfactual_engine import counterfactual_engine
from backend.schemas.agent_contracts import AgentOutput, SignalType


def test_investment_thesis_generation_and_invalidation():
    """Verify thesis engine produces structured thesis with concrete invalidation conditions."""
    agent_outputs = {
        "fundamental": AgentOutput(agent_name="fundamental", symbol="INFY", signal=SignalType.BUY, impact_score=6, summary="Strong operating cash flow."),
        "technical": AgentOutput(agent_name="technical", symbol="INFY", signal=SignalType.BUY, impact_score=4, summary="Support held at 1500.")
    }
    synthesis = {
        "final_decision": "BUY",
        "net_score": 14
    }

    thesis = thesis_engine.generate_thesis("INFY", synthesis, agent_outputs, version="1.0")

    assert thesis["symbol"] == "INFY"
    assert thesis["version"] == "1.0"
    assert "BUY" in thesis["final_verdict"]
    assert len(thesis["supporting_pillars"]) >= 1
    assert len(thesis["core_assumptions"]) >= 2
    assert len(thesis["invalidation_conditions"]) >= 3
    assert len(thesis["monitoring_indicators"]) >= 2

    # Compare against an updated version
    thesis_v2 = dict(thesis)
    thesis_v2["version"] = "2.0"
    thesis_v2["final_verdict"] = "HOLD"
    thesis_v2["net_score"] = 6

    diff = thesis_engine.compare_theses(thesis, thesis_v2)
    assert diff["prior_version"] == "1.0"
    assert diff["current_version"] == "2.0"
    assert diff["score_change"] == -8
    assert diff["invalidation_status"] == "CONVICTION_CHANGED"


def test_counterfactual_sensitivity_scenarios():
    """Verify bounded counterfactuals calculate mathematical score shifts deterministically."""
    agent_outputs = {
        "fundamental": AgentOutput(agent_name="fundamental", symbol="TEST", impact_score=5, summary="Valuation metrics."),
        "technical": AgentOutput(agent_name="technical", symbol="TEST", impact_score=6, summary="Momentum trend."),
        "risk": AgentOutput(agent_name="risk", symbol="TEST", impact_score=-2, summary="Variance metrics.")
    }

    scenarios = counterfactual_engine.run_counterfactual_scenarios(
        symbol="TEST",
        baseline_net_score=15,
        baseline_decision="BUY",
        agent_outputs=agent_outputs
    )

    assert len(scenarios) == 3
    # Check scenario 1: multiple contraction
    s1 = scenarios[0]
    assert "Multiple Contraction" in s1["scenario_name"]
    assert s1["baseline_net_score"] == 15
    assert s1["stressed_net_score"] < 15
    assert s1["score_delta"] < 0
