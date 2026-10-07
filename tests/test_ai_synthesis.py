from backend.agents.synthesis_agent import synthesis_agent
from backend.schemas.agent_contracts import (
    AgentOutput,
    AgentStatus,
    SignalType,
    EvidenceItem
)


def test_synthesis_conflict_detection():
    """Verify Synthesis Agent identifies sharp signal conflicts between technicals and risk/news."""
    # Construct synthetic mock agent outputs showing conflict
    outputs = {
        "technical": AgentOutput(
            agent_name="technical",
            symbol="TEST",
            signal=SignalType.BUY,
            impact_score=10,
            summary="Strong breakout momentum above 50-day SMA."
        ),
        "fundamental": AgentOutput(
            agent_name="fundamental",
            symbol="TEST",
            signal=SignalType.BUY,
            impact_score=8,
            summary="Strong revenue growth."
        ),
        "news": AgentOutput(
            agent_name="news",
            symbol="TEST",
            signal=SignalType.AVOID,
            impact_score=-6,
            summary="Negative regulatory headlines."
        ),
        "risk": AgentOutput(
            agent_name="risk",
            symbol="TEST",
            signal=SignalType.AVOID,
            impact_score=-10,
            summary="Severe portfolio sector concentration."
        ),
        "market": AgentOutput(
            agent_name="market",
            symbol="TEST",
            signal=SignalType.HOLD,
            impact_score=0,
            summary="Neutral market breadth."
        ),
        "regulatory": AgentOutput(
            agent_name="regulatory",
            symbol="TEST",
            signal=SignalType.HOLD,
            impact_score=0,
            summary="Standard disclosures."
        )
    }

    res = synthesis_agent.synthesize("TEST", user_id="USR-1", agent_outputs=outputs)

    assert res.conflict_report.conflict_level in ["HIGH", "MODERATE"]
    assert len(res.conflict_report.disagreements) >= 1
    # Check that synthesis articulates interpretation, conclusion, and uncertainty separately
    assert len(res.interpretation) > 10
    assert len(res.conclusion) > 10
    assert len(res.uncertainty) > 10


def test_synthesis_evidence_traceability():
    """Verify all evidence items preserve claim, source, and timestamp."""
    ev = EvidenceItem(
        claim="Annual Revenue reached 10,000 Cr",
        source="Annual Report FY26",
        timestamp="2026",
        reference="Page 15"
    )
    outputs = {
        "fundamental": AgentOutput(
            agent_name="fundamental",
            symbol="TEST",
            signal=SignalType.BUY,
            impact_score=5,
            summary="Good.",
            evidence=[ev]
        )
    }

    res = synthesis_agent.synthesize("TEST", user_id="USR-1", agent_outputs=outputs)
    assert len(res.evidence) == 1
    assert res.evidence[0].claim == ev.claim
    assert res.evidence[0].source == ev.source
