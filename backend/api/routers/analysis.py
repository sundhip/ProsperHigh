from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.api.deps import get_db, get_current_user
from backend.database.models import User, AnalysisRun, AgentRun
from backend.schemas.analysis import AnalysisRequest, AnalysisResponse
from backend.orchestrator.orchestrator import orchestrator

router = APIRouter(prefix="/api/analyze", tags=["Multi-Agent Intelligence"])


@router.post("", response_model=AnalysisResponse)
@router.post("/", response_model=AnalysisResponse)
async def analyze(
    payload: AnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Run 7-agent investment intelligence analysis for the authenticated user.
    Executes agents concurrently, validates outputs, and records audit trail in database.
    """
    symbol = payload.symbol.strip().upper()
    user_id = current_user.id

    if payload.user_id and payload.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Cannot run analysis for a different user identity."
        )

    res = await orchestrator.aanalyze_stock(symbol, user_id=user_id, db=db)
    return res


@router.get("/history", response_model=List[Dict[str, Any]])
def get_analysis_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List historical AI analyses executed by the authenticated user."""
    runs = (
        db.query(AnalysisRun)
        .filter(AnalysisRun.user_id == current_user.id)
        .order_by(AnalysisRun.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": r.id,
            "symbol": r.symbol,
            "status": r.status,
            "final_decision": r.final_decision,
            "confidence": r.confidence,
            "net_score": r.net_score,
            "conflict_level": r.conflict_level,
            "model_provider": r.model_provider,
            "summary": r.summary,
            "created_at": r.created_at.isoformat() if r.created_at else None
        }
        for r in runs
    ]


@router.get("/{analysis_id}", response_model=AnalysisResponse)
def get_analysis_by_id(
    analysis_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve full analysis record by analysis_id.
    Strictly enforces server-side user ownership authorization (403 on mismatch).
    """
    record = db.query(AnalysisRun).filter(AnalysisRun.id == analysis_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis record '{analysis_id}' not found."
        )

    if record.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You cannot access another user's analysis record."
        )

    if record.full_json:
        return record.full_json

    # Fallback to reconstructing from relational record
    return {
        "analysis_id": record.id,
        "symbol": record.symbol,
        "status": record.status,
        "user_id": record.user_id,
        "final_decision": record.final_decision,
        "confidence": record.confidence,
        "net_score": record.net_score,
        "summary": record.summary,
        "agents": {},
        "conflicts": {"conflict_level": record.conflict_level},
        "positive_factors": [],
        "negative_factors": [],
        "biggest_factor": {},
        "decision_trace": [],
        "counterfactuals": [],
        "thesis_invalidation": [],
        "stock_switcher": [],
        "explanation": record.summary,
        "llm_provider": record.model_provider
    }
