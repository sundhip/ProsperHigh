from fastapi import APIRouter
from backend.schemas.research import ResearchRequest, ResearchResponse
from backend.services.rag_service import rag_service

router = APIRouter(prefix="/api/research", tags=["Research Terminal"])


@router.post("/ask", response_model=ResearchResponse)
def ask_research(payload: ResearchRequest):
    """Query filings and official disclosures backed by citations."""
    symbol = payload.symbol.strip().upper()
    query = payload.query.strip()
    return rag_service.query_filings(symbol, query)
