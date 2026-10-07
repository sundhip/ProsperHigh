from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class ResearchRequest(BaseModel):
    symbol: str = Field(default="RELIANCE", min_length=1, max_length=30)
    query: str = Field(..., min_length=2, max_length=500)


class CitationItem(BaseModel):
    document: Optional[str] = None
    year: Optional[str] = None
    page: Optional[int] = None
    section: Optional[str] = None
    citation_string: Optional[str] = None


class ResearchResponse(BaseModel):
    symbol: str
    query: str
    answer: str
    citations: List[CitationItem] = Field(default_factory=list)
    retrieval_confidence: float = 0.88
