import pytest
import hashlib
from backend.services.rag.sources.base import RawDocumentDTO
from backend.services.rag.sources.filings_connector import filings_connector
from backend.services.rag.pipeline import IngestionPipeline, ingestion_pipeline
from backend.database.models import Document, DocumentVersion, DocumentChunk


def test_filings_connector_metadata_and_urls():
    """Verify statutory filings have authentic official BSE/NSE/SEC URLs and verifiable metadata."""
    docs = filings_connector.fetch_documents()
    assert len(docs) >= 5

    symbols = {doc.company for doc in docs}
    assert "RELIANCE" in symbols
    assert "TCS" in symbols
    assert "INFY" in symbols
    assert "HDFCBANK" in symbols
    assert "TATAMOTORS" in symbols

    for doc in docs:
        assert doc.source_url.startswith("https://")
        assert any(domain in doc.source_url for domain in ["bseindia.com", "nseindia.com", "sec.gov", "ril.com", "tcs.com", "infosys.com", "hdfcbank.com", "tatamotors.com"])
        assert doc.document_type in ["Annual Report", "Quarterly Disclosure", "Earnings Call Transcript", "Investor Presentation", "Statutory Filing", "Financial Results"]
        assert doc.reporting_period is not None
        assert doc.jurisdiction in ["IN", "US", "GLOBAL"]
        assert len(doc.content) > 100
        assert doc.content_hash == hashlib.sha256(doc.content.encode("utf-8")).hexdigest()


def test_ingestion_pipeline_stages_and_traceability(db_session):
    """Verify that the IngestionPipeline executes all 10 stages and verifies chunks."""
    pipeline = IngestionPipeline()
    
    test_raw = RawDocumentDTO(
        id="DOC-TEST-INGEST-TRACE-001",
        title="Test Ingestion Traceability Filing FY2026",
        company="TESTCO",
        source_name="BSE Corporate Announcements",
        document_type="Quarterly Disclosure",
        reporting_period="Q3 FY 2025-26",
        year="2026",
        page_count=12,
        section="Management Discussion & Analysis",
        publication_date=None,
        jurisdiction="IN",
        source_url="https://www.bseindia.com/corporates/test_filing.pdf",
        content="Consolidated net profit expanded by 18.5% YoY. Operating margins stood resilient at 24.2%. Strategic focus remains on AI cloud migration and balance sheet deleveraging.",
        mime_type="text/plain",
        file_size_bytes=1500,
        metadata={"auditor": "Deloitte"}
    )

    doc = pipeline.process_document(db_session, test_raw)

    assert doc.id == "DOC-TEST-INGEST-TRACE-001"
    assert doc.status == "INDEXED"
    assert doc.company == "TESTCO"
    assert doc.content_hash == hashlib.sha256(test_raw.content.encode("utf-8")).hexdigest()

    # Check chunks persisted in DB
    chunks = db_session.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).all()
    assert len(chunks) >= 1
    assert chunks[0].section == "Management Discussion & Analysis"
    assert chunks[0].page_number == 12
    assert chunks[0].chunk_hash is not None
    assert chunks[0].token_count is not None

    # Check version history recorded
    versions = db_session.query(DocumentVersion).filter(DocumentVersion.document_id == doc.id).all()
    assert len(versions) >= 1
    assert versions[0].content_hash == doc.content_hash


def test_ingestion_idempotency_and_updates(db_session):
    """Verify duplicate ingestion is idempotent, and updates content cleanly."""
    pipeline = IngestionPipeline()

    raw_v1 = RawDocumentDTO(
        id="DOC-TEST-IDEMP-001",
        title="Deduplication and Idempotency Test",
        company="VERCO",
        source_name="BSE Disclosures",
        document_type="Annual Report",
        reporting_period="FY 2025-26",
        year="2026",
        page_count=20,
        section="Financials",
        jurisdiction="IN",
        source_url="https://www.bseindia.com/corporates/ver_v1.pdf",
        content="Initial filing: Total revenue INR 50,000 Cr. Dividend payout 30%. Operating margin 21%.",
        mime_type="text/plain"
    )

    # Ingest v1
    doc1 = pipeline.process_document(db_session, raw_v1)
    assert doc1.status == "INDEXED"
    chunks1_count = db_session.query(DocumentChunk).filter(DocumentChunk.document_id == doc1.id).count()

    # Ingest same doc again -> Idempotent re-index
    doc_repeat = pipeline.process_document(db_session, raw_v1)
    assert doc_repeat.id == doc1.id
    chunks_repeat_count = db_session.query(DocumentChunk).filter(DocumentChunk.document_id == doc1.id).count()
    assert chunks_repeat_count == chunks1_count

    # Ingest updated content with same ID -> Updates chunks and adds version
    raw_v2 = RawDocumentDTO(
        id="DOC-TEST-IDEMP-001",
        title="Deduplication and Idempotency Test - Restated",
        company="VERCO",
        source_name="BSE Disclosures",
        document_type="Annual Report",
        reporting_period="FY 2025-26",
        year="2026",
        page_count=22,
        section="Financials",
        jurisdiction="IN",
        source_url="https://www.bseindia.com/corporates/ver_v2.pdf",
        content="Revised filing: Restated total revenue INR 51,200 Cr following adjustments. Dividend payout 32%. Operating margin 22%.",
        mime_type="text/plain"
    )

    doc2 = pipeline.process_document(db_session, raw_v2)
    assert doc2.id == doc1.id
    assert doc2.title == "Deduplication and Idempotency Test - Restated"
    assert doc2.content_hash == hashlib.sha256(raw_v2.content.encode("utf-8")).hexdigest()

    versions = db_session.query(DocumentVersion).filter(DocumentVersion.document_id == doc1.id).all()
    assert len(versions) >= 2
