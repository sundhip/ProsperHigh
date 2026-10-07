import pytest
from backend.services.rag.service import rag_service
from backend.database.models import User, ResearchHistory


def test_research_ask_unauthenticated(client, db_session):
    rag_service.ingest_default_documents(db_session)

    resp = client.post(
        "/api/research/ask",
        json={"symbol": "RELIANCE", "query": "green hydrogen capex"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["symbol"] == "RELIANCE"
    assert len(data["citations"]) > 0
    assert "answer" in data


def test_research_ask_authenticated_persists_history(client, test_user_a, auth_headers_user_a, db_session):
    rag_service.ingest_default_documents(db_session)

    # Initial history count for test_user_a
    history_before = db_session.query(ResearchHistory).filter(ResearchHistory.user_id == test_user_a.id).count()

    resp = client.post(
        "/api/research/ask",
        json={"symbol": "TCS", "query": "cloud AI order book run rate"},
        headers=auth_headers_user_a,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["symbol"] == "TCS"
    assert len(data["citations"]) > 0

    # Verify history item is persisted in DB
    history_after = db_session.query(ResearchHistory).filter(ResearchHistory.user_id == test_user_a.id).count()
    assert history_after == history_before + 1


def test_research_history_isolation(client, test_user_a, auth_headers_user_a, test_user_b, auth_headers_user_b, db_session):
    rag_service.ingest_default_documents(db_session)

    # User A asks a research query
    client.post(
        "/api/research/ask",
        json={"symbol": "INFY", "query": "operating margins and digital services"},
        headers=auth_headers_user_a,
    )

    # User A fetches history -> sees 1 entry
    resp_a = client.get("/api/research/history", headers=auth_headers_user_a)
    assert resp_a.status_code == 200
    data_a = resp_a.json()
    assert len(data_a) == 1
    assert data_a[0]["symbol"] == "INFY"

    # User B fetches history -> sees 0 entries (isolated)
    resp_b = client.get("/api/research/history", headers=auth_headers_user_b)
    assert resp_b.status_code == 200
    data_b = resp_b.json()
    assert len(data_b) == 0

    # Unauthenticated fetch -> 401
    resp_anon = client.get("/api/research/history")
    assert resp_anon.status_code == 401


def test_research_documents_and_ingest(client, db_session):
    # Test Ingestion endpoint
    resp_ingest = client.post("/api/research/ingest")
    assert resp_ingest.status_code == 200
    data_ingest = resp_ingest.json()
    assert data_ingest["documents_indexed"] > 0

    # Test Documents listing endpoint
    resp_docs = client.get("/api/research/documents")
    assert resp_docs.status_code == 200
    docs = resp_docs.json()
    assert len(docs) > 0
    assert "chunk_count" in docs[0]
    assert docs[0]["chunk_count"] > 0
