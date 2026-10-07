import pytest
import math
from backend.services.rag.embeddings.deterministic import DeterministicEmbeddingProvider
from backend.services.rag.chunker import SectionChunker
from backend.services.rag.vector_store import VectorStore
from backend.services.rag.service import RAGService
from backend.database.models import Document, DocumentChunk


def test_deterministic_embedding_properties():
    provider = DeterministicEmbeddingProvider(dimension=256)
    assert provider.dimension == 256

    text = "Reliance Industries green hydrogen capex and national mission compliance"
    vec = provider.embed_text(text)
    assert len(vec) == 256

    # Verify L2 normalization: sum(x^2) should be close to 1.0
    norm_sq = sum(x * x for x in vec)
    assert abs(norm_sq - 1.0) < 0.01

    # Determinism: exact same vector for same input
    vec2 = provider.embed_text(text)
    assert vec == vec2

    # Semantic similarity: related queries have positive cosine similarity
    related = "Capex allocation for Gigafactories and hydrogen energy"
    unrelated = "Art history and Renaissance painting techniques in Florence"
    vec_related = provider.embed_text(related)
    vec_unrelated = provider.embed_text(unrelated)

    sim_related = sum(a * b for a, b in zip(vec, vec_related))
    sim_unrelated = sum(a * b for a, b in zip(vec, vec_unrelated))

    assert sim_related > sim_unrelated


def test_section_chunker():
    chunker = SectionChunker(target_chunk_size=10, overlap_size=3)
    text = (
        "Operating cash flow was strong. "
        "Capex was elevated in network buildout. "
        "Retail revenues expanded significantly. "
        "Debt metrics remain stable and safe."
    )
    chunks = chunker.chunk_document(
        content=text,
        section="Financial Analysis",
        page_number=42,
        extra_metadata={"source": "AR2026"}
    )

    assert len(chunks) >= 1
    for chunk in chunks:
        assert chunk.section == "Financial Analysis"
        assert chunk.page_number == 42
        assert len(chunk.content) > 0


def test_vector_store_indexing_and_search(db_session):
    store = VectorStore(db_session)

    # Index two documents
    store.index_document(
        doc_id="DOC-TEST-001",
        title="Annual Report 2026",
        source="NSE Filing",
        company="RELIANCE",
        document_type="Annual Report",
        content="Regulatory scrutiny surrounding telecom tariff hikes and green hydrogen capex has increased.",
        year="2026",
        page=42,
        section="Risk Factors",
    )

    store.index_document(
        doc_id="DOC-TEST-002",
        title="Annual Report 2026",
        source="BSE Filing",
        company="TCS",
        document_type="Annual Report",
        content="Enterprise AI Cloud bookings surged to 1.5 billion dollars with healthy operating margins.",
        year="2026",
        page=24,
        section="Strategic Overview",
    )

    # Search for Reliance query
    results_rel = store.search(query="telecom tariffs and hydrogen capex", symbol="RELIANCE", top_k=2)
    assert len(results_rel) > 0
    assert results_rel[0].company == "RELIANCE"
    assert "telecom tariff" in results_rel[0].content.lower()
    assert results_rel[0].page == 42

    # Search for TCS query
    results_tcs = store.search(query="Enterprise AI bookings", symbol="TCS", top_k=2)
    assert len(results_tcs) > 0
    assert results_tcs[0].company == "TCS"
    assert "ai cloud" in results_tcs[0].content.lower()


def test_rag_service_grounded_citations(db_session):
    rag = RAGService()
    rag.ingest_default_documents(db_session)

    # Verify documents were indexed into db
    doc_count = db_session.query(Document).count()
    assert doc_count >= 4

    # Ask query about Reliance green hydrogen
    res = rag.query_filings(
        symbol="RELIANCE",
        query="green hydrogen and gigafactories capex",
        db=db_session
    )

    assert res["symbol"] == "RELIANCE"
    assert res["insufficient_evidence"] is False
    assert len(res["citations"]) > 0
    assert res["retrieval_confidence"] > 0.5

    # Check citation contents
    first_cit = res["citations"][0]
    assert "document" in first_cit
    assert "page" in first_cit
    assert "section" in first_cit
    assert "citation_string" in first_cit

    # Ensure answer directly cites official disclosures
    assert "verified exchange filings" in res["answer"].lower()
    assert "gigafactories" in res["answer"].lower() or "hydrogen" in res["answer"].lower()


def test_rag_service_insufficient_evidence_handling(db_session):
    rag = RAGService()
    rag.ingest_default_documents(db_session)

    # Ask a completely nonsensical query for a non-existent company
    res = rag.query_filings(
        symbol="NONEXISTENT_XYZ",
        query="quantum teleportation warp drive patent filings",
        db=db_session
    )

    # Must flag insufficient evidence and not hallucinate facts
    assert res["insufficient_evidence"] is True
    assert "Insufficient verified documentary evidence" in res["answer"]
    assert res["citations"] == []
