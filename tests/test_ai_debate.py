import pytest
from backend.services.debate_engine import debate_engine
from backend.schemas.agent_contracts import AgentOutput, SignalType


def test_debate_engine_detects_momentum_vs_valuation_tension():
    """Verify Debate Engine extracts sharp divergence between technical momentum and fundamental valuation."""
    outputs = {
        "technical": AgentOutput(
            agent_name="technical",
            symbol="TITAN",
            signal=SignalType.BUY,
            impact_score=8,
            summary="Strong breakout above 50-day and 200-day moving averages with rising RSI.",
            evidence=[{"claim": "RSI at 68 with MACD bullish crossover", "source": "Daily Price Chart", "timestamp": "2026-10", "reference": "Chart"}]
        ),
        "fundamental": AgentOutput(
            agent_name="fundamental",
            symbol="TITAN",
            signal=SignalType.AVOID,
            impact_score=-6,
            summary="Stretched valuation multiples with trailing P/E at 85x and compressed quarterly EBITDA margins.",
            evidence=[{"claim": "P/E multiple at 85x exceeds 5-year average", "source": "Quarterly Disclosures", "timestamp": "2026-10", "reference": "P/L"}]
        ),
        "risk": AgentOutput(
            agent_name="risk",
            symbol="TITAN",
            signal=SignalType.HOLD,
            impact_score=0,
            summary="Moderate volatility."
        )
    }

    debate = debate_engine.analyze_disagreements("TITAN", outputs)

    assert debate["has_material_disagreement"] is True
    assert debate["disagreement_count"] >= 1

    first_thread = debate["threads"][0]
    assert "Momentum" in first_thread["topic"] or "Valuation" in first_thread["topic"]
    assert first_thread["conflict_type"] == "INTERPRETIVE"
    assert "Technical Analysis" in first_thread["bull_perspective"]["agent"]
    assert "Fundamental Health" in first_thread["bear_perspective"]["agent"]
    assert len(first_thread["information_gap"]) > 10
    assert len(first_thread["resolution_summary"]) > 10


def test_debate_engine_handles_consensus_cleanly():
    """Verify Debate Engine reports consensus when specialist agents are in agreement."""
    outputs = {
        "technical": AgentOutput(agent_name="technical", symbol="HDFC", signal=SignalType.BUY, impact_score=4, summary="Moderate trend."),
        "fundamental": AgentOutput(agent_name="fundamental", symbol="HDFC", signal=SignalType.BUY, impact_score=5, summary="Solid earnings."),
        "market": AgentOutput(agent_name="market", symbol="HDFC", signal=SignalType.BUY, impact_score=3, summary="Positive liquidity.")
    }

    debate = debate_engine.analyze_disagreements("HDFC", outputs)
    assert debate["has_material_disagreement"] is False
    assert "consensus" in debate["threads"][0]["resolution_summary"].lower()
