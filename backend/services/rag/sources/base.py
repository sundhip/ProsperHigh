"""
Base Document Connector abstraction for financial document ingestion.
"""
from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class RawDocumentDTO(BaseModel):
    id: str
    title: str
    source_name: str
    source_url: Optional[str] = None
    company: str
    document_type: str = "Annual Report"
    year: Optional[str] = None
    reporting_period: Optional[str] = None
    publication_date: Optional[datetime] = None
    jurisdiction: str = "IN"
    content: str
    content_hash: Optional[str] = None
    file_size_bytes: Optional[int] = None
    mime_type: str = "text/plain"
    page_count: Optional[int] = None
    section: Optional[str] = None
    citation: Optional[str] = None
    is_user_uploaded: bool = False
    user_id: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class BaseSourceConnector(ABC):
    """Abstract connector for discovering and retrieving financial documents."""

    @abstractmethod
    def fetch_documents(self) -> List[RawDocumentDTO]:
        """Fetch or discover documents from this source."""
        pass
