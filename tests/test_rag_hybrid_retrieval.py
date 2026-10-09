import pytest
from backend.services.rag.vector_store import VectorStore
from backend.services.rag.pipeline import IngestionPipeline
from backend.services.rag.sources.base import RawDocumentDTO
from backend.database.models import User


def test_hybrid_retrieval_vector_plus_lexical(db_session):
    """Test that hybrid retrieval ranks chunks using both semantic similarity and keyword presence."""
    store = VectorStore(db_session)

    # Document 1: Contains exact keyword and theme
    store.index_document(
        doc_id="DOC-HYB-001",
        title="Automotive EV Transition FY2026",
        source="NSE",
        company="TATAMOTORS",
        document_type="Quarterly Disclosure",
        content="Commercial vehicle margins expanded to 11.2% while Jaguar Land Rover EBIT reached record levels of 9.5%. Electric vehicle battery plant progress is accelerating.",
        year="2026",
        reporting_period="Q3 FY 2025-26",
        page=15,
        section="Commercial Vehicles",
    )

    # Document 2: Same company, different topic
    store.index_document(
        doc_id="DOC-HYB-002",
        title="Tata Motors Balance Sheet Restructuring",
        source="BSE",
        company="TATAMOTORS",
        document_type="Annual Report",
        content="Net automotive debt reduced significantly towards zero-debt target through steady operating free cash flows across domestic operations.",
        year="2026",
        reporting_period="FY 2025-26",
        page=34,
        section="Capital Management",
    )

    # Search with keyword 'Electric vehicle battery'
    results = store.search(query="Electric vehicle battery plant progress", symbol="TATAMOTORS", top_k=2)
    assert len(results) > 0
    top_result = results[0]
    assert top_result.company == "TATAMOTORS"
    assert "battery" in top_result.content.lower()
    assert top_result.document_id == "DOC-HYB-001"
    assert top_result.score > 0.3


def test_retrieval_metadata_filters(db_session):
    """Test filtering by document_type, year, and reporting_period."""
    store = VectorStore(db_session)

    store.index_document(
        doc_id="DOC-FILT-001",
        title="Infosys Annual Report 2025",
        source="NSE",
        company="INFY",
        document_type="Annual Report",
        content="FY2025 witnessed broad-based digital transformation and cloud revenues growing 14% year over year.",
        year="2025",
        reporting_period="FY 2024-25",
        page=10,
        section="Overview",
    )

    store.index_document(
        doc_id="DOC-FILT-002",
        title="Infosys Annual Report 2026",
        source="NSE",
        company="INFY",
        document_type="Annual Report",
        content="FY2026 generative AI order pipeline reached $4.2B with large deal signings accelerating across financial services.",
        year="2026",
        reporting_period="FY 2025-26",
        page=12,
        section="Overview",
    )

    # Filter by year=2026
    results_2026 = store.search(query="generative AI order pipeline", symbol="INFY", year="2026")
    assert len(results_2026) == 1
    assert results_2026[0].document_id == "DOC-FILT-002"
    assert results_2026[0].year == "2026"

    # Filter by year=2025
    results_2025 = store.search(query="digital transformation and cloud", symbol="INFY", year="2025")
    assert len(results_2025) == 1
    assert results_2025[0].document_id == "DOC-FILT-001"
    assert results_2025[0].year == "2025"

    # Filter by document_type='Quarterly Disclosure' -> Should return empty
    results_empty = store.search(query="generative AI", symbol="INFY", document_type="Quarterly Disclosure")
    assert len(results_empty) == 0


def test_user_document_isolation_in_retrieval(db_session, test_user_a, test_user_b):
    """Test that private uploaded documents are only retrieved when the matching user_id is allowed."""
    pipeline = IngestionPipeline()
    store = VectorStore(db_session)

    # User 1 private doc
    doc_user_1 = RawDocumentDTO(
        id="DOC-PRIVATE-USER1",
        title="User 1 Private Portfolio Review",
        company="HDFCBANK",
        source_name="Private Upload",
        document_type="Research Note",
        year="2026",
        content="Confidential analysis: HDFC Bank net interest margin compression bottomed out in Q3 with retail deposit accretion stabilizing.",
        is_user_uploaded=True,
        user_id=test_user_a.id,
    )
    pipeline.process_document(db_session, doc_user_1)

    # Public doc
    doc_public = RawDocumentDTO(
        id="DOC-PUBLIC-HDFC",
        title="HDFC Bank Q3 FY26 Disclosures",
        company="HDFCBANK",
        source_name="BSE",
        document_type="Statutory Filing",
        year="2026",
        content="Public statutory disclosure: Gross NPA reduced to 1.24% while capital adequacy ratio CRAR stood strong at 19.8%.",
        is_user_uploaded=False,
        user_id=None,
    )
    pipeline.process_document(db_session, doc_public)

    # Search as User 1 with private document terms -> User 1 finds their private doc
    results_user_1 = store.search(query="net interest margin compression and retail deposit", symbol="HDFCBANK", user_id=test_user_a.id)
    doc_ids_user_1 = [r.document_id for r in results_user_1]
    assert "DOC-PRIVATE-USER1" in doc_ids_user_1

    # Search as User 2 with the same private terms -> User 2 CANNOT see User 1's private doc
    results_user_2 = store.search(query="net interest margin compression and retail deposit", symbol="HDFCBANK", user_id=test_user_b.id)
    doc_ids_user_2 = [r.document_id for r in results_user_2]
    assert "DOC-PRIVATE-USER1" not in doc_ids_user_2

    # Search with public document terms -> Both User 1 and User 2 can see public doc
    pub_res_1 = store.search(query="Gross NPA and capital adequacy ratio CRAR", symbol="HDFCBANK", user_id=test_user_a.id)
    assert any(r.document_id == "DOC-PUBLIC-HDFC" for r in pub_res_1)

    pub_res_2 = store.search(query="Gross NPA and capital adequacy ratio CRAR", symbol="HDFCBANK", user_id=test_user_b.id)
    assert any(r.document_id == "DOC-PUBLIC-HDFC" for r in pub_res_2)
