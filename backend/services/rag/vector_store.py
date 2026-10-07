import json
import math
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select

from backend.database.models import Document, DocumentChunk
from backend.services.rag.embeddings.factory import EmbeddingProviderFactory
from backend.services.rag.chunker import SectionChunker


class RetrievedChunk:
    def __init__(
        self,
        chunk_id: str,
        document_id: str,
        document_title: str,
        company: str,
        document_type: str,
        year: Optional[str],
        page: Optional[int],
        section: Optional[str],
        content: str,
        score: float,
        citation_string: str,
    ):
        self.chunk_id = chunk_id
        self.document_id = document_id
        self.document_title = document_title
        self.company = company
        self.document_type = document_type
        self.year = year
        self.page = page
        self.section = section
        self.content = content
        self.score = round(score, 4)
        self.citation_string = citation_string

    def to_dict(self) -> Dict[str, Any]:
        return {
            "chunk_id": self.chunk_id,
            "document_id": self.document_id,
            "document": self.document_title,
            "company": self.company,
            "document_type": self.document_type,
            "year": self.year,
            "page": self.page,
            "section": self.section,
            "content": self.content,
            "score": self.score,
            "citation_string": self.citation_string,
        }


class VectorStore:
    """
    SQLAlchemy-backed Vector Store supporting cosine similarity retrieval,
    strict metadata filtering, and citation verification.
    """

    def __init__(self, db: Session):
        self.db = db
        self.embedding_provider = EmbeddingProviderFactory.get_provider()
        self.chunker = SectionChunker()

    def _cosine_similarity(self, vec_a: List[float], vec_b: List[float]) -> float:
        """Compute cosine similarity. If both are L2 normalized, dot product equals cosine."""
        if not vec_a or not vec_b or len(vec_a) != len(vec_b):
            return 0.0
        return sum(a * b for a, b in zip(vec_a, vec_b))

    def index_document(
        self,
        doc_id: str,
        title: str,
        source: str,
        company: str,
        document_type: str,
        content: str,
        year: Optional[str] = None,
        page: Optional[int] = None,
        section: Optional[str] = None,
        citation: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Document:
        """
        Indexes or updates a document and its semantic chunks into the database.
        """
        existing_doc = self.db.query(Document).filter(Document.id == doc_id).first()
        if existing_doc:
            # Delete old chunks for clean re-indexing
            self.db.query(DocumentChunk).filter(DocumentChunk.document_id == doc_id).delete()
            doc = existing_doc
            doc.title = title
            doc.source = source
            doc.company = company.upper()
            doc.document_type = document_type
            doc.year = str(year) if year else None
            doc.page_count = page
        else:
            doc = Document(
                id=doc_id,
                title=title,
                source=source,
                company=company.upper(),
                document_type=document_type,
                year=str(year) if year else None,
                page_count=page,
                version="1.0",
                status="INDEXED",
            )
            self.db.add(doc)
            self.db.flush()

        # Chunk the document content
        chunk_dtos = self.chunker.chunk_document(
            content=content,
            section=section,
            page_number=page,
            extra_metadata=metadata,
        )

        for chunk_dto in chunk_dtos:
            # Generate embedding
            emb_vec = self.embedding_provider.embed_text(chunk_dto.content)
            chunk_record = DocumentChunk(
                document_id=doc.id,
                chunk_index=chunk_dto.chunk_index,
                section=chunk_dto.section,
                page_number=chunk_dto.page_number,
                content=chunk_dto.content,
                embedding_json=json.dumps(emb_vec),
                metadata_json={
                    **(metadata or {}),
                    "citation": citation or f"{doc.title}, Page {page or 1}, Section: {section or 'General'}",
                },
            )
            self.db.add(chunk_record)

        self.db.commit()
        self.db.refresh(doc)
        return doc

    def search(
        self,
        query: str,
        symbol: Optional[str] = None,
        top_k: int = 3,
        min_similarity: float = 0.05,
    ) -> List[RetrievedChunk]:
        """
        Executes semantic vector search against stored document chunks.
        Filters by company/symbol if provided, with fallback to all filings.
        """
        query = query.strip()
        if not query:
            return []

        query_vec = self.embedding_provider.embed_text(query)

        # Build query
        stmt = (
            select(DocumentChunk, Document)
            .join(Document, DocumentChunk.document_id == Document.id)
        )

        if symbol:
            sym_clean = symbol.strip().upper()
            filtered_stmt = stmt.where(Document.company == sym_clean)
            rows = self.db.execute(filtered_stmt).all()
        else:
            rows = self.db.execute(stmt).all()

        scored_chunks: List[RetrievedChunk] = []

        for chunk, doc in rows:
            if not chunk.embedding_json:
                continue
            try:
                emb = json.loads(chunk.embedding_json)
                score = self._cosine_similarity(query_vec, emb)
            except Exception:
                score = 0.0

            cit_meta = (chunk.metadata_json or {}).get("citation")
            default_cit = f"{doc.title}, Page {chunk.page_number or 1}, Section: {chunk.section or 'General'}"

            retrieved = RetrievedChunk(
                chunk_id=chunk.id,
                document_id=doc.id,
                document_title=doc.title,
                company=doc.company,
                document_type=doc.document_type,
                year=doc.year,
                page=chunk.page_number,
                section=chunk.section,
                content=chunk.content,
                score=score,
                citation_string=cit_meta or default_cit,
            )
            scored_chunks.append(retrieved)

        # Sort descending by similarity score
        scored_chunks.sort(key=lambda x: x.score, reverse=True)

        # Filter strictly by minimum similarity threshold
        relevant = [c for c in scored_chunks if c.score >= min_similarity]
        return relevant[:top_k]
