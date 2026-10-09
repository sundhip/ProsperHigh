"""
Traceable 10-Stage Document Ingestion Pipeline for Phase 5 Research.
Stages: Discover -> Fetch -> Validate -> Parse -> Normalize -> Chunk -> Embed -> Index -> Verify -> Publish.
Guarantees idempotency via content hashing and updates document lifecycle status.
"""
import json
import hashlib
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from backend.database.models import Document, DocumentChunk, DocumentVersion
from backend.services.rag.sources.base import RawDocumentDTO
from backend.services.rag.chunker import SectionChunker, ChunkDTO
from backend.services.rag.embeddings.factory import EmbeddingProviderFactory


class PipelineStageException(Exception):
    def __init__(self, stage: str, message: str):
        super().__init__(f"Ingestion Pipeline Failed at [{stage}]: {message}")
        self.stage = stage
        self.message = message


class IngestionPipeline:
    """
    Executes end-to-end traceable financial document ingestion.
    """

    def __init__(self):
        self.chunker = SectionChunker()
        self.embedding_provider = EmbeddingProviderFactory.get_provider()

    def process_document(self, db: Session, raw_doc: RawDocumentDTO) -> Document:
        """
        Executes all 10 stages sequentially for a single document.
        Idempotent: updates existing document if content hash or ID matches.
        """
        stage = "1. Discover"
        if not raw_doc.id or not raw_doc.title:
            raise PipelineStageException(stage, "Document missing stable ID or Title.")

        stage = "2. Fetch"
        raw_text = raw_doc.content
        if not raw_text:
            raise PipelineStageException(stage, "Document content is empty.")

        stage = "3. Validate"
        if raw_doc.file_size_bytes and raw_doc.file_size_bytes > 10 * 1024 * 1024:
            raise PipelineStageException(stage, "Document exceeds maximum size limit of 10MB.")

        stage = "4. Parse"
        content_hash = raw_doc.content_hash or hashlib.sha256(raw_text.encode("utf-8")).hexdigest()

        stage = "5. Normalize"
        normalized_content = " ".join(raw_text.split())
        if len(normalized_content) < 10:
            raise PipelineStageException(stage, "Normalized document text is too short (< 10 chars).")

        stage = "6. Chunk"
        chunk_dtos: List[ChunkDTO] = self.chunker.chunk_document(
            content=raw_text,
            section=raw_doc.section or "Statutory Filing",
            page_number=raw_doc.page_count or 1,
            extra_metadata=raw_doc.metadata,
        )
        if not chunk_dtos:
            raise PipelineStageException(stage, "Chunker generated zero chunks from document content.")

        stage = "7. Embed"
        embedded_chunks = []
        for chk in chunk_dtos:
            emb_vec = self.embedding_provider.embed_text(chk.content)
            chunk_hash = hashlib.sha256(chk.content.encode("utf-8")).hexdigest()
            embedded_chunks.append({
                "dto": chk,
                "embedding": emb_vec,
                "chunk_hash": chunk_hash,
                "token_count": len(chk.content.split()),
            })

        stage = "8. Index"
        try:
            # Check for existing document
            doc = db.query(Document).filter(Document.id == raw_doc.id).first()
            if not doc:
                # Deduplication by content hash for non-user docs
                if not raw_doc.is_user_uploaded:
                    doc = db.query(Document).filter(Document.content_hash == content_hash).first()

            if doc:
                # Remove existing chunks for re-indexing
                db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).delete()
                doc.title = raw_doc.title
                doc.source = raw_doc.source_name
                doc.source_url = raw_doc.source_url
                doc.company = raw_doc.company.upper()
                doc.document_type = raw_doc.document_type
                doc.year = raw_doc.year
                doc.reporting_period = raw_doc.reporting_period
                doc.publication_date = raw_doc.publication_date
                doc.jurisdiction = raw_doc.jurisdiction
                doc.content_hash = content_hash
                doc.file_size_bytes = raw_doc.file_size_bytes or len(raw_text.encode("utf-8"))
                doc.status = "INDEXING"
            else:
                doc = Document(
                    id=raw_doc.id,
                    title=raw_doc.title,
                    source=raw_doc.source_name,
                    source_url=raw_doc.source_url,
                    company=raw_doc.company.upper(),
                    document_type=raw_doc.document_type,
                    year=raw_doc.year,
                    reporting_period=raw_doc.reporting_period,
                    publication_date=raw_doc.publication_date,
                    jurisdiction=raw_doc.jurisdiction,
                    content_hash=content_hash,
                    file_size_bytes=raw_doc.file_size_bytes or len(raw_text.encode("utf-8")),
                    mime_type=raw_doc.mime_type,
                    parser_version="1.0",
                    is_user_uploaded=raw_doc.is_user_uploaded,
                    user_id=raw_doc.user_id,
                    page_count=raw_doc.page_count,
                    version="1.0",
                    status="INDEXING",
                )
                db.add(doc)
                db.flush()

            # Insert version record
            version_record = DocumentVersion(
                document_id=doc.id,
                version_number=doc.version,
                source_url=doc.source_url,
                content_hash=content_hash,
                file_size_bytes=doc.file_size_bytes or 0,
                parsed_text=normalized_content[:5000],  # snapshot first 5k
                change_notes="Indexed via Ingestion Pipeline v1.0",
            )
            db.add(version_record)

            # Insert chunk records
            for item in embedded_chunks:
                chk = item["dto"]
                chunk_record = DocumentChunk(
                    document_id=doc.id,
                    chunk_index=chk.chunk_index,
                    section=chk.section,
                    page_number=chk.page_number,
                    content=chk.content,
                    chunk_hash=item["chunk_hash"],
                    token_count=item["token_count"],
                    embedding_json=json.dumps(item["embedding"]),
                    metadata_json={
                        **chk.metadata,
                        "citation": raw_doc.citation or f"{doc.title}, Page {chk.page_number or 1}, Section: {chk.section or 'General'}",
                        "source_url": doc.source_url,
                        "company": doc.company,
                        "year": doc.year,
                    },
                )
                db.add(chunk_record)

            db.flush()
        except Exception as e:
            db.rollback()
            raise PipelineStageException(stage, f"Database transaction failed: {str(e)}")

        stage = "9. Verify"
        persisted_chunk_count = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).count()
        if persisted_chunk_count == 0 or persisted_chunk_count != len(embedded_chunks):
            doc.status = "FAILED"
            doc.error_message = f"Chunk count mismatch during verification ({persisted_chunk_count} != {len(embedded_chunks)})"
            db.commit()
            raise PipelineStageException(stage, "Verification failed: Chunk persistence count mismatch.")

        stage = "10. Publish"
        doc.status = "INDEXED"
        doc.error_message = None
        db.commit()
        db.refresh(doc)
        return doc


ingestion_pipeline = IngestionPipeline()
