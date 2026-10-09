from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from backend.database.models import AnalysisRun


class AnalysisComparisonService:
    """
    Analysis Comparison Service:
    Compares two historical analysis runs for a given symbol and explains what changed in plain language.
    Strictly verifies user ownership and avoids fabricating causal attributions unsupported by evidence.
    """

    def compare_runs(
        self,
        db: Session,
        user_id: str,
        run_id_a: str,
        run_id_b: str
    ) -> Dict[str, Any]:
        """
        Compares Run A (earlier/reference) against Run B (later/target).
        """
        run_a = db.query(AnalysisRun).filter(AnalysisRun.id == run_id_a, AnalysisRun.user_id == user_id).first()
        run_b = db.query(AnalysisRun).filter(AnalysisRun.id == run_id_b, AnalysisRun.user_id == user_id).first()

        if not run_a or not run_b:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="One or both analysis records were not found or access is denied."
            )

        # Order chronologically (A = older, B = newer)
        if run_a.created_at and run_b.created_at and run_a.created_at > run_b.created_at:
            run_a, run_b = run_b, run_a

        json_a = run_a.full_json or {}
        json_b = run_b.full_json or {}

        score_a = int(run_a.net_score)
        score_b = int(run_b.net_score)
        score_delta = score_b - score_a

        verdict_a = run_a.final_decision
        verdict_b = run_b.final_decision
        verdict_changed = verdict_a != verdict_b

        # Agent-by-agent diff
        agents_a = json_a.get("agents", {})
        agents_b = json_b.get("agents", {})
        agent_diffs: List[Dict[str, Any]] = []

        material_causes: List[str] = []

        for name in ["fundamental", "technical", "risk", "news", "regulatory", "market"]:
            a_data = agents_a.get(name, {})
            b_data = agents_b.get(name, {})

            impact_a = int(a_data.get("impact_score", 0)) if isinstance(a_data, dict) else 0
            impact_b = int(b_data.get("impact_score", 0)) if isinstance(b_data, dict) else 0
            sig_a = a_data.get("signal", "NEUTRAL") if isinstance(a_data, dict) else "NEUTRAL"
            sig_b = b_data.get("signal", "NEUTRAL") if isinstance(b_data, dict) else "NEUTRAL"

            delta = impact_b - impact_a

            agent_diffs.append({
                "agent": name,
                "impact_a": impact_a,
                "impact_b": impact_b,
                "impact_delta": delta,
                "signal_a": sig_a,
                "signal_b": sig_b,
                "signal_changed": sig_a != sig_b
            })

            if abs(delta) >= 3:
                dir_str = "improved" if delta > 0 else "deteriorated"
                material_causes.append(
                    f"{name.capitalize()} impact {dir_str} by {abs(delta)} points (from {impact_a:+d} to {impact_b:+d})"
                )

        # Suitability comparison
        suit_a = run_a.suitability_verdict or "NOT_EVALUATED"
        suit_b = run_b.suitability_verdict or "NOT_EVALUATED"

        # Summary narrative
        if score_delta == 0 and not verdict_changed:
            narrative = f"Overall recommendation remained steady at {verdict_b} (Net score: {score_b:+d}) with no net change across runs."
        else:
            cause_text = f" driven primarily by: {', '.join(material_causes)}" if material_causes else ""
            narrative = (
                f"Net score shifted by {score_delta:+d} points (from {score_a:+d} to {score_b:+d}). "
                f"Verdict transitioned from {verdict_a} to {verdict_b}{cause_text}."
            )

        return {
            "symbol": run_b.symbol,
            "run_a": {
                "id": run_a.id,
                "timestamp": run_a.created_at.isoformat() if run_a.created_at else None,
                "verdict": verdict_a,
                "net_score": score_a,
                "suitability": suit_a
            },
            "run_b": {
                "id": run_b.id,
                "timestamp": run_b.created_at.isoformat() if run_b.created_at else None,
                "verdict": verdict_b,
                "net_score": score_b,
                "suitability": suit_b
            },
            "changes": {
                "score_delta": score_delta,
                "verdict_changed": verdict_changed,
                "suitability_changed": suit_a != suit_b,
                "agent_diffs": agent_diffs,
                "material_causes": material_causes,
                "narrative_explanation": narrative
            }
        }


analysis_comparison_service = AnalysisComparisonService()
