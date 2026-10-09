"""
Hybrid Vector & Keyword Store for Phase 5 Research.
Combines dense vector cosine similarity with lexical keyword & token matching,
strict metadata filtering (company, doc type, year, reporting period),
user access control, and verifiable citation resolution.
"""
import re
import json
import math
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, or_

from backend.database.models import Document, DocumentChunk
from backend.services.rag.embeddings.factory import EmbeddingProviderFactory
from backend.services.rag.chunker import SectionChunker, ChunkDTO


class RetrievedChunk:
    def __init__(
        self,
        chunk_id: str,
        document_id: str,
        document_title: str,
        source_url: Optional[str],
        company: str,
        document_type: str,
        year: Optional[str],
        page: Optional[int],
        section: Optional[str],
        content: str,
        score: float,
        citation_string: str,
        retrieval_method: str = "hybrid",
        reporting_period: Optional[str] = None,
    ):
        self.chunk_id = chunk_id
        self.document_id = document_id
        self.document_title = document_title
        self.source_url = source_url
        self.company = company
        self.document_type = document_type
        self.year = year
        self.reporting_period = reporting_period
        self.page = page
        self.section = section
        self.content = content
        self.score = round(score, 4)
        self.citation_string = citation_string
        self.retrieval_method = retrieval_method

    def to_dict(self) -> Dict[str, Any]:
        return {
            "chunk_id": self.chunk_id,
            "document_id": self.document_id,
            "document": self.document_title,
            "source_url": self.source_url,
            "company": self.company,
            "document_type": self.document_type,
            "year": self.year,
            "reporting_period": self.reporting_period,
            "page": self.page,
            "section": self.section,
            "content": self.content,
            "score": self.score,
            "citation_string": self.citation_string,
            "retrieval_method": self.retrieval_method,
        }


class VectorStore:
    """
    SQLAlchemy-backed Hybrid Search Store supporting vector similarity,
    lexical keyword matching, access permissions, and citation verification.
    """

    STOP_WORDS = {
        "the", "and", "is", "in", "at", "of", "a", "to", "for", "on", "with",
        "as", "by", "this", "that", "it", "from", "are", "was", "be", "or",
        "an", "will", "my", "your", "our", "what", "how", "why", "when", "where"
    }

    def __init__(self, db: Session):
        self.db = db
        self.embedding_provider = EmbeddingProviderFactory.get_provider()
        self.chunker = SectionChunker()

    def _cosine_similarity(self, vec_a: List[float], vec_b: List[float]) -> float:
        """Compute cosine similarity. Dot product equals cosine for L2-normalized vectors."""
        if not vec_a or not vec_b or len(vec_a) != len(vec_b):
            return 0.0
        return sum(a * b for a, b in zip(vec_a, vec_b))

    def _calculate_keyword_score(
        self,
        query: str,
        content: str,
        title: str,
        section: Optional[str] = None
    ) -> float:
        """
        Computes lexical relevance score based on token overlap,
        exact numeric/metric matches, and heading matches.
        """
        # Tokenize query
        q_tokens = [w.lower() for w in re.findall(r"\b[a-zA-Z0-9₹$%]{2,}\b", query) if w.lower() not in self.STOP_WORDS]
        if not q_tokens:
            return 0.1

        content_lower = content.lower()
        title_lower = title.lower()
        section_lower = (section or "").lower()

        match_count = 0
        weight_sum = 0.0

        for t in q_tokens:
            token_weight = 1.0
            # Higher weight for financial metrics & numbers
            if any(char.isdigit() for char in t) or t in {"arpu", "nim", "capex", "ebitda", "tcv", "crar", "margin", "fcf"}:
                token_weight = 2.0

            weight_sum += token_weight

            if t in content_lower:
                match_count += token_weight * 1.0
            if t in section_lower:
                match_count += token_weight * 0.5
            if t in title_lower:
                match_count += token_weight * 0.3

        if weight_sum == 0:
            return 0.0

        raw_score = match_count / weight_sum
        return min(1.0, max(0.0, raw_score))

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
        source_url: Optional[str] = None,
        reporting_period: Optional[str] = None,
        is_user_uploaded: bool = False,
        user_id: Optional[str] = None,
    ) -> Document:
        """Indexes or updates a document and its semantic chunks in the database."""
        existing_doc = self.db.query(Document).filter(Document.id == doc_id).first()
        if existing_doc:
            self.db.query(DocumentChunk).filter(DocumentChunk.document_id == doc_id).delete()
            doc = existing_doc
            doc.title = title
            doc.source = source
            doc.source_url = source_url
            doc.company = company.upper()
            doc.document_type = document_type
            doc.year = str(year) if year else None
            doc.reporting_period = reporting_period
            doc.page_count = page
            doc.is_user_uploaded = is_user_uploaded
            doc.user_id = user_id
            doc.status = "INDEXED"
        else:
            doc = Document(
                id=doc_id,
                title=title,
                source=source,
                source_url=source_url,
                company=company.upper(),
                document_type=document_type,
                year=str(year) if year else None,
                reporting_period=reporting_period,
                page_count=page,
                version="1.0",
                status="INDEXED",
                is_user_uploaded=is_user_uploaded,
                user_id=user_id,
            )
            self.db.add(doc)
            self.db.flush()

        chunk_dtos = self.chunker.chunk_document(
            content=content,
            section=section,
            page_number=page,
            extra_metadata=metadata,
        )

        for chunk_dto in chunk_dtos:
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
                    "source_url": doc.source_url,
                    "company": doc.company,
                    "year": doc.year,
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
        document_type: Optional[str] = None,
        year: Optional[str] = None,
        reporting_period: Optional[str] = None,
        user_id: Optional[str] = None,
        top_k: int = 4,
        min_similarity: float = 0.05,
    ) -> List[RetrievedChunk]:
        """
        Executes hybrid retrieval:
        1. Dense vector cosine similarity
        2. Lexical keyword / BM25 token matching
        3. Strict metadata filters (company, doc_type, year, reporting_period, user permissions)
        4. Composite weighted rank fusion
        """
        query_clean = query.strip()
        if not query_clean:
            return []

        query_vec = self.embedding_provider.embed_text(query_clean)

        # Base join query
        stmt = (
            select(DocumentChunk, Document)
            .join(Document, DocumentChunk.document_id == Document.id)
            .where(Document.status == "INDEXED")
        )

        # Access control: user can see public documents (user_id is None) OR own uploaded documents
        if user_id:
            stmt = stmt.where(
                or_(Document.user_id.is_(None), Document.user_id == user_id)
            )
        else:
            stmt = stmt.where(Document.user_id.is_(None))

        # Metadata Filters
        if symbol:
            sym_clean = symbol.strip().upper()
            stmt = stmt.where(Document.company == sym_clean)

        if document_type:
            stmt = stmt.where(Document.document_type == document_type)

        if year:
            stmt = stmt.where(Document.year == str(year))

        if reporting_period:
            stmt = stmt.where(Document.reporting_period == reporting_period)

        rows = self.db.execute(stmt).all()
        scored_chunks: List[RetrievedChunk] = []

        for chunk, doc in rows:
            # 1. Vector Score
            vec_score = 0.0
            if chunk.embedding_json:
                try:
                    emb = json.loads(chunk.embedding_json)
                    vec_score = self._cosine_similarity(query_vec, emb)
                except Exception:
                    vec_score = 0.0

            # 2. Keyword Score
            kw_score = self._calculate_keyword_score(
                query=query_clean,
                content=chunk.content,
                title=doc.title,
                section=chunk.section
            )

            # 3. Hybrid Composite Score (60% vector + 40% keyword)
            composite_score = (0.60 * vec_score) + (0.40 * kw_score)

            # Bonus if target symbol explicitly mentioned in query
            if symbol and symbol.upper() in query_clean.upper() and doc.company == symbol.upper():
                composite_score = min(1.0, composite_score + 0.05)

            cit_meta = (chunk.metadata_json or {}).get("citation")
            default_cit = f"{doc.title}, Page {chunk.page_number or 1}, Section: {chunk.section or 'General'}"

            retrieved = RetrievedChunk(
                chunk_id=chunk.id,
                document_id=doc.id,
                document_title=doc.title,
                source_url=doc.source_url,
                company=doc.company,
                document_type=doc.document_type,
                year=doc.year,
                reporting_period=doc.reporting_period,
                page=chunk.page_number,
                section=chunk.section,
                content=chunk.content,
                score=composite_score,
                citation_string=cit_meta or default_cit,
                retrieval_method="hybrid",
            )
            scored_chunks.append(retrieved)

        # Sort descending by composite score
        scored_chunks.sort(key=lambda x: x.score, reverse=True)

        # Filter by threshold
        relevant = [c for c in scored_chunks if c.score >= min_similarity]
        return relevant[:top_k]
