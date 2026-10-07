from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class ResearchRequest(BaseModel):
    symbol: str = Field(default="RELIANCE", min_length=1, max_length=30)
    query: str = Field(..., min_length=2, max_length=500)


class CitationItem(BaseModel):
    chunk_id: Optional[str] = None
    document: Optional[str] = None
    year: Optional[str] = None
    page: Optional[int] = None
    section: Optional[str] = None
    citation_string: Optional[str] = None
    similarity_score: Optional[float] = None


class ResearchResponse(BaseModel):
    symbol: str
    query: str
    answer: str
    citations: List[CitationItem] = Field(default_factory=list)
    retrieval_confidence: float = 0.88
    insufficient_evidence: bool = False


class ResearchHistoryItem(BaseModel):
    id: str
    symbol: Optional[str] = None
    query: str
    answer: str
    confidence: float
    citations: List[CitationItem] = Field(default_factory=list)
    created_at: Optional[str] = None


class DocumentSummary(BaseModel):
    id: str
    title: str
    source: str
    company: str
    document_type: str
    year: Optional[str] = None
    page_count: Optional[int] = None
    status: str
    chunk_count: int
