import pytest
from backend.services.rag.service import rag_service
from backend.orchestrator.orchestrator import orchestrator


def test_rag_retrieve_evidence_helper(db_session):
    rag_service.ingest_default_documents(db_session)

    evidence = rag_service.retrieve_evidence(
        symbol="RELIANCE",
        topic="green hydrogen capex and gigafactories",
        max_chunks=2,
        db=db_session
    )
    assert len(evidence) > 0
    item = evidence[0]
    assert "document_id" in item
    assert "title" in item
    assert "citation" in item
    assert "excerpt" in item
    assert len(item["excerpt"]) > 0


def test_orchestrator_rag_enrichment(db_session):
    rag_service.ingest_default_documents(db_session)

    result = orchestrator.analyze_stock(
        symbol="RELIANCE",
        user_id=None,
        db=db_session,
        personalized=False
    )

    assert "agents" in result
    regulatory_agent = result["agents"].get("regulatory")
    fundamental_agent = result["agents"].get("fundamental")

    assert regulatory_agent is not None
    assert fundamental_agent is not None

    # Check evidence lists contain statutory filing evidence
    reg_evidence_sources = [ev.get("source", "") for ev in regulatory_agent.get("evidence", [])]
    fund_evidence_sources = [ev.get("source", "") for ev in fundamental_agent.get("evidence", [])]

    # At least one of the agents contains filing citation evidence
    has_statutory_evidence = any(
        "Filing" in s or "Annual Report" in s or "BSE" in s or "NSE" in s
        for s in (reg_evidence_sources + fund_evidence_sources)
    )
    assert has_statutory_evidence is True
