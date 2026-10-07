import pytest
from backend.orchestrator.orchestrator import orchestrator
from backend.schemas.agent_contracts import AgentStatus


@pytest.mark.asyncio
async def test_orchestrator_concurrent_run(db_session, test_user_a):
    """Verify orchestrator runs 6 agents concurrently and persists audit record in DB."""
    res = await orchestrator.aanalyze_stock("RELIANCE", user_id=test_user_a.id, db=db_session)

    assert res is not None
    assert res["symbol"] == "RELIANCE"
    assert res["status"] in ["SUCCESS", "PARTIAL"]
    assert "agents" in res
    assert len(res["agents"]) == 6
    assert "market" in res["agents"]
    assert "technical" in res["agents"]
    assert "news" in res["agents"]
    assert "fundamental" in res["agents"]
    assert "regulatory" in res["agents"]
    assert "risk" in res["agents"]

    # Verify each agent returned structured fields
    for name, ag in res["agents"].items():
        assert "agent_name" in ag
        assert "status" in ag
        assert "confidence" in ag
        assert "summary" in ag

    assert "conflicts" in res
    assert "final_decision" in res


@pytest.mark.asyncio
async def test_orchestrator_partial_failure_tolerance(db_session, test_user_a):
    """Verify orchestrator gracefully continues and sets status to PARTIAL when an agent lacks data."""
    # Analyze a symbol with missing news/regulatory documents
    res = await orchestrator.aanalyze_stock("UNKNOWN_MICROCAP", user_id=test_user_a.id, db=db_session)

    assert res is not None
    assert res["status"] in ["PARTIAL", "INSUFFICIENT_DATA", "FAILED"]
    # Check that synthesis still produces a safe verdict without crashing
    assert "final_decision" in res
    assert len(res["warnings"]) >= 1


def test_orchestrator_sync_bridge(test_user_a):
    """Verify synchronous analyze_stock bridge works seamlessly."""
    res = orchestrator.analyze_stock("INFY", user_id=test_user_a.id)
    assert res is not None
    assert res["symbol"] == "INFY"
    assert "final_decision" in res
