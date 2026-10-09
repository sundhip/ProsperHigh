import pytest
from backend.services.rag.service import rag_service
from backend.database.models import Document, DocumentChunk


def test_citation_inspection_endpoint(client, db_session):
    """Test that citing a document provides verifiable chunk details via API."""
    rag_service.ingest_default_documents(db_session)

    # Fetch any chunk
    chunk = db_session.query(DocumentChunk).first()
    assert chunk is not None

    resp = client.get(f"/api/research/citations/{chunk.id}")
    assert resp.status_code == 200
    data = resp.json()

    assert data["chunk_id"] == chunk.id
    assert data["document_id"] == chunk.document_id
    assert "document_title" in data
    assert "source_url" in data
    assert "content" in data
    assert len(data["content"]) > 0
    assert data["page_number"] is not None or data["section"] is not None


def test_citation_inspection_not_found(client, db_session):
    resp = client.get("/api/research/citations/non_existent_chunk_999")
    assert resp.status_code == 404


def test_document_detail_endpoint(client, db_session):
    rag_service.ingest_default_documents(db_session)

    doc = db_session.query(Document).filter(Document.company == "RELIANCE").first()
    assert doc is not None

    resp = client.get(f"/api/research/documents/{doc.id}")
    assert resp.status_code == 200
    data = resp.json()

    assert data["id"] == doc.id
    assert data["company"] == "RELIANCE"
    assert len(data["chunks"]) > 0
    assert "versions" in data
    assert data["source_url"] is not None


def test_grounded_answer_generation(client, db_session):
    """Test that queries generate strictly grounded answers with verifiable citations."""
    rag_service.ingest_default_documents(db_session)

    resp = client.post(
        "/api/research/ask",
        json={"symbol": "RELIANCE", "query": "Jio subscriber base and ARPU tariff rationalization"}
    )
    assert resp.status_code == 200
    data = resp.json()

    assert data["symbol"] == "RELIANCE"
    assert data["insufficient_evidence"] is False
    assert len(data["citations"]) > 0
    assert "ARPU" in data["answer"] or "481 million" in data["answer"] or "tariff" in data["answer"]

    # Verify each citation has required grounding fields
    for cit in data["citations"]:
        assert "citation_id" in cit
        assert "document_id" in cit
        assert "document" in cit
        assert "source_url" in cit
        assert "snippet" in cit


def test_honest_insufficient_evidence(client, db_session):
    """Test that unrelated queries honestly return insufficient_evidence without hallucinating."""
    rag_service.ingest_default_documents(db_session)

    resp = client.post(
        "/api/research/ask",
        json={"symbol": "RELIANCE", "query": "Quantum teleportation algorithms on Mars colonies in year 3000"}
    )
    assert resp.status_code == 200
    data = resp.json()

    assert data["insufficient_evidence"] is True
    assert "insufficient" in data["answer"].lower() or "cannot verify" in data["answer"].lower() or "no official disclosures" in data["answer"].lower()
