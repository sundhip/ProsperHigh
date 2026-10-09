"""
Pydantic Schemas for Phase 5 Research Terminal, Grounded RAG, and Document Reader.
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class ResearchRequest(BaseModel):
    symbol: str = Field(default="RELIANCE", min_length=1, max_length=30)
    query: str = Field(..., min_length=2, max_length=500)
    document_type: Optional[str] = None
    year: Optional[str] = None
    reporting_period: Optional[str] = None
    session_id: Optional[str] = None


class CitationItem(BaseModel):
    citation_id: Optional[str] = None
    chunk_id: Optional[str] = None
    document_id: Optional[str] = None
    document: Optional[str] = None
    source_url: Optional[str] = None
    year: Optional[str] = None
    reporting_period: Optional[str] = None
    page: Optional[int] = None
    section: Optional[str] = None
    snippet: Optional[str] = None
    citation_string: Optional[str] = None
    similarity_score: Optional[float] = None
    retrieval_method: Optional[str] = "hybrid"
    verified: bool = True


class ResearchResponse(BaseModel):
    symbol: str
    query: str
    answer: str
    citations: List[CitationItem] = Field(default_factory=list)
    retrieval_confidence: float = 0.88
    insufficient_evidence: bool = False
    session_id: Optional[str] = None
    suggested_query: Optional[str] = None


class ResearchHistoryItem(BaseModel):
    id: str
    symbol: Optional[str] = None
    session_id: Optional[str] = None
    query: str
    answer: str
    confidence: float
    citations: List[CitationItem] = Field(default_factory=list)
    created_at: Optional[str] = None


class DocumentSummary(BaseModel):
    id: str
    title: str
    source: str
    source_url: Optional[str] = None
    company: str
    document_type: str
    year: Optional[str] = None
    reporting_period: Optional[str] = None
    page_count: Optional[int] = None
    status: str
    chunk_count: int
    is_user_uploaded: bool = False


class DocumentChunkDetail(BaseModel):
    id: str
    chunk_index: int
    section: Optional[str] = None
    page_number: Optional[int] = None
    content: str
    citation: Optional[str] = None


class DocumentVersionSummary(BaseModel):
    id: str
    version_number: str
    source_url: Optional[str] = None
    change_notes: Optional[str] = None
    created_at: Optional[str] = None


class DocumentDetailResponse(BaseModel):
    id: str
    title: str
    source: str
    source_url: Optional[str] = None
    company: str
    document_type: str
    year: Optional[str] = None
    reporting_period: Optional[str] = None
    publication_date: Optional[str] = None
    jurisdiction: str = "IN"
    content_hash: Optional[str] = None
    file_size_bytes: Optional[int] = None
    mime_type: Optional[str] = None
    status: str
    version: str
    chunk_count: int
    chunks: List[DocumentChunkDetail] = Field(default_factory=list)
    versions: List[DocumentVersionSummary] = Field(default_factory=list)


class CitationInspectionResponse(BaseModel):
    chunk_id: str
    document_id: str
    document_title: str
    source_url: Optional[str] = None
    company: str
    year: Optional[str] = None
    reporting_period: Optional[str] = None
    page_number: int = 1
    section: str = "General"
    content: str
    citation_string: str
    content_hash: Optional[str] = None
    verified: bool = True


class DriveStatusResponse(BaseModel):
    enabled: bool
    provider: str
    scope: str
    status: str
    message: str
    activation_requirements: List[str] = Field(default_factory=list)
