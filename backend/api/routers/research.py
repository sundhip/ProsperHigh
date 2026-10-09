from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from backend.api.deps import get_db, get_current_user, get_current_user_optional
from backend.database.models import User
from backend.schemas.research import (
    ResearchRequest,
    ResearchResponse,
    ResearchHistoryItem,
    DocumentSummary,
    DocumentDetailResponse,
    CitationInspectionResponse,
    DriveStatusResponse,
)
from backend.services.rag.service import rag_service
from backend.services.rag.sources.drive_connector import drive_connector
from backend.services.rag.sources.upload_connector import UploadSecurityException

router = APIRouter(prefix="/api/research", tags=["Research Terminal"])


@router.post("/ask", response_model=ResearchResponse)
def ask_research(
    payload: ResearchRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """
    Query official filings and disclosures backed by citation-verified chunk retrieval.
    Supports metadata filters (document_type, year, reporting_period) and session continuity.
    Persists query to user history if authenticated.
    """
    symbol = payload.symbol.strip().upper()
    query = payload.query.strip()
    user_id = current_user.id if current_user else None

    return rag_service.query_filings(
        symbol=symbol,
        query=query,
        user_id=user_id,
        document_type=payload.document_type,
        year=payload.year,
        reporting_period=payload.reporting_period,
        session_id=payload.session_id,
        db=db,
    )


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
def get_indexed_documents(
    symbol: Optional[str] = None,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """List all indexed documents with metadata and chunk count."""
    user_id = current_user.id if current_user else None
    return rag_service.list_documents(db=db, symbol=symbol, user_id=user_id)


@router.get("/documents/{document_id}", response_model=DocumentDetailResponse)
def get_document_by_id(
    document_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """
    Retrieve full document metadata, version history, and chunk text for the Document Reader.
    """
    detail = rag_service.get_document_detail(document_id=document_id, db=db)
    if not detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID '{document_id}' not found.",
        )
    return detail


@router.get("/citations/{chunk_id}", response_model=CitationInspectionResponse)
def inspect_citation(
    chunk_id: str,
    db: Session = Depends(get_db),
):
    """
    Validate and inspect supporting citation passage, page, section, and verified source anchors.
    """
    inspection = rag_service.inspect_citation(chunk_id=chunk_id, db=db)
    if not inspection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Citation reference chunk '{chunk_id}' not found or invalid.",
        )
    return inspection


@router.post("/upload", response_model=DocumentSummary)
async def upload_document(
    file: UploadFile = File(...),
    company: str = Form("CUSTOM"),
    document_type: str = Form("Corporate Disclosure"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Upload and index a user-provided financial document (PDF, TXT, MD) with validation,
    anti-prompt injection defenses, and user-isolated storage.
    """
    file_bytes = await file.read()
    try:
        doc = rag_service.upload_user_document(
            db=db,
            filename=file.filename or "upload.txt",
            file_bytes=file_bytes,
            company=company,
            user_id=current_user.id,
            document_type=document_type,
        )
        return DocumentSummary(
            id=doc.id,
            title=doc.title,
            source=doc.source,
            source_url=doc.source_url,
            company=doc.company,
            document_type=doc.document_type,
            year=doc.year,
            reporting_period=doc.reporting_period,
            page_count=doc.page_count,
            status=doc.status,
            chunk_count=len(doc.chunks),
            is_user_uploaded=doc.is_user_uploaded,
        )
    except UploadSecurityException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Document ingestion failed: {str(e)}")


@router.get("/drive/status", response_model=DriveStatusResponse)
def get_drive_status():
    """Retrieve Google Drive integration configuration status and activation instructions."""
    return drive_connector.get_status()


@router.post("/ingest", status_code=status.HTTP_200_OK)
def ingest_filings(db: Session = Depends(get_db)):
    """Re-index corporate filings into the vector store."""
    count = rag_service.ingest_default_documents(db=db)
    return {"message": "Corporate filings indexed successfully.", "documents_indexed": count}
