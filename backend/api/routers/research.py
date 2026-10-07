from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.api.deps import get_db, get_current_user, get_current_user_optional
from backend.database.models import User
from backend.schemas.research import (
    ResearchRequest,
    ResearchResponse,
    ResearchHistoryItem,
    DocumentSummary,
)
from backend.services.rag.service import rag_service

router = APIRouter(prefix="/api/research", tags=["Research Terminal"])


@router.post("/ask", response_model=ResearchResponse)
def ask_research(
    payload: ResearchRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """
    Query official filings and disclosures backed by citation-verified chunk retrieval.
    Persists query to user history if authenticated.
    """
    symbol = payload.symbol.strip().upper()
    query = payload.query.strip()
    user_id = current_user.id if current_user else None
    return rag_service.query_filings(symbol=symbol, query=query, user_id=user_id, db=db)


@router.get("/history", response_model=List[ResearchHistoryItem])
def get_research_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve audit history of past research queries for the authenticated user.
    Strictly isolated to user's own data.
    """
    return rag_service.get_user_history(user_id=current_user.id, db=db)


@router.get("/documents", response_model=List[DocumentSummary])
def get_indexed_documents(db: Session = Depends(get_db)):
    """List all indexed documents with metadata and chunk count."""
    return rag_service.list_documents(db=db)


@router.post("/ingest", status_code=status.HTTP_200_OK)
def ingest_filings(db: Session = Depends(get_db)):
    """Re-index corporate filings into the vector store."""
    count = rag_service.ingest_default_documents(db=db)
    return {"message": "Corporate filings indexed successfully.", "documents_indexed": count}
