from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.api.deps import get_db, get_current_user
from backend.database.models import User, AnalysisRun, AgentRun
from backend.schemas.analysis import (
    AnalysisRequest,
    AnalysisResponse,
    AnalysisComparisonRequest,
    CounterfactualRequest
)
from backend.orchestrator.orchestrator import orchestrator
from backend.services.analysis_comparison_service import analysis_comparison_service
from backend.services.counterfactual_engine import counterfactual_engine

router = APIRouter(prefix="/api/analyze", tags=["Multi-Agent Intelligence"])


@router.post("", response_model=AnalysisResponse)
@router.post("/", response_model=AnalysisResponse)
async def analyze(
    payload: AnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Run 7-agent investment intelligence analysis with personalized suitability assessment.
    Executes agents concurrently, validates outputs, and records full audit trail.
    """
    symbol = payload.symbol.strip().upper()
    user_id = current_user.id

    if payload.user_id and payload.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Cannot run analysis for a different user identity."
        )

    res = await orchestrator.aanalyze_stock(
        symbol,
        user_id=user_id,
        db=db,
        personalized=payload.personalized,
        proposed_investment_amount=payload.proposed_investment_amount
    )
    return res


@router.post("/compare")
def compare_analyses(
    payload: AnalysisComparisonRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Compare two historical analysis runs and explain what changed in plain language.
    Strictly verifies ownership of both runs.
    """
    return analysis_comparison_service.compare_runs(
        db=db,
        user_id=current_user.id,
        run_id_a=payload.run_id_a,
        run_id_b=payload.run_id_b
    )


@router.post("/counterfactual")
def run_counterfactual(
    payload: CounterfactualRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Runs sensitivity scenarios on an existing analysis record.
    """
    record = db.query(AnalysisRun).filter(AnalysisRun.id == payload.analysis_id, AnalysisRun.user_id == current_user.id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis record not found.")

    if record.counterfactuals_json:
        return record.counterfactuals_json

    agents = (record.full_json or {}).get("agents", {})
    return counterfactual_engine.run_counterfactual_scenarios(
        symbol=record.symbol,
        baseline_net_score=record.net_score,
        baseline_decision=record.final_decision,
        agent_outputs=agents
    )


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
            "is_personalized": bool(getattr(r, "is_personalized", False)),
            "suitability_verdict": getattr(r, "suitability_verdict", None),
            "created_at": r.created_at.isoformat() if r.created_at else None
        }
        for r in runs
    ]


@router.get("/{analysis_id}/debate")
def get_analysis_debate(
    analysis_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve detailed multi-agent debate and unresolved disagreements for an analysis."""
    record = db.query(AnalysisRun).filter(AnalysisRun.id == analysis_id, AnalysisRun.user_id == current_user.id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis record not found.")
    return getattr(record, "debate_json", None) or (record.full_json or {}).get("ai_debate") or {}


@router.get("/{analysis_id}/thesis")
def get_analysis_thesis(
    analysis_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve structured investment thesis and invalidation criteria for an analysis."""
    record = db.query(AnalysisRun).filter(AnalysisRun.id == analysis_id, AnalysisRun.user_id == current_user.id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis record not found.")
    return getattr(record, "thesis_json", None) or (record.full_json or {}).get("investment_thesis") or {}


@router.get("/{analysis_id}", response_model=AnalysisResponse)
def get_analysis_by_id(
    analysis_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve full analysis record by analysis_id with strict user ownership authorization.
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
        "is_personalized": bool(getattr(record, "is_personalized", False)),
        "profile_version": getattr(record, "profile_version", None),
        "investment_assessment": None,
        "suitability_assessment": getattr(record, "suitability_json", None),
        "ai_debate": getattr(record, "debate_json", None),
        "investment_thesis": getattr(record, "thesis_json", None),
        "counterfactual_scenarios": getattr(record, "counterfactuals_json", []),
        "counterfactuals": [],
        "thesis_invalidation": [],
        "stock_switcher": [],
        "explanation": record.summary,
        "llm_provider": record.model_provider
    }
