import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from backend.database.models import Goal
from backend.services.portfolio_service import portfolio_service


class GoalService:
    """
    Goal-Aware Intelligence Service:
    Links user-defined financial targets with real portfolio progress.
    Evaluates required savings trajectories with deterministic formulas and transparent assumptions.
    """

    def create_goal(
        self,
        db: Session,
        user_id: str,
        name: str,
        target_amount: float,
        target_date: Optional[datetime] = None,
        monthly_contribution: float = 0.0,
        description: Optional[str] = None,
        portfolio_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Creates and stores a new user financial goal."""
        goal_id = f"GOL-{uuid.uuid4().hex[:8].upper()}"
        goal = Goal(
            id=goal_id,
            user_id=user_id,
            name=name.strip(),
            description=description,
            target_amount=float(target_amount),
            target_date=target_date,
            monthly_contribution=float(monthly_contribution),
            portfolio_id=portfolio_id
        )
        db.add(goal)
        db.commit()
        db.refresh(goal)
        return self._format_goal(db, goal, user_id)

    def list_goals(self, db: Session, user_id: str) -> List[Dict[str, Any]]:
        """Lists all goals for the authenticated user."""
        goals = db.query(Goal).filter(Goal.user_id == user_id).order_by(Goal.created_at.desc()).all()
        return [self._format_goal(db, g, user_id) for g in goals]

    def get_goal(self, db: Session, user_id: str, goal_id: str) -> Dict[str, Any]:
        """Retrieves a single goal enforcing user ownership."""
        goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user_id).first()
        if not goal:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found or access denied.")
        return self._format_goal(db, goal, user_id)

    def update_goal(
        self,
        db: Session,
        user_id: str,
        goal_id: str,
        updates: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Updates goal parameters enforcing user ownership."""
        goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user_id).first()
        if not goal:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found or access denied.")

        for k, v in updates.items():
            if hasattr(goal, k) and k not in ["id", "user_id", "created_at"]:
                setattr(goal, k, v)

        db.commit()
        db.refresh(goal)
        return self._format_goal(db, goal, user_id)

    def delete_goal(self, db: Session, user_id: str, goal_id: str) -> bool:
        """Deletes a goal enforcing user ownership."""
        goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user_id).first()
        if not goal:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found or access denied.")
        db.delete(goal)
        db.commit()
        return True

    def _format_goal(self, db: Session, goal: Goal, user_id: str) -> Dict[str, Any]:
        """Computes deterministic progress and savings trajectory."""
        port_metrics = portfolio_service.get_user_portfolio_metrics(db, user_id, goal.portfolio_id)
        current_val = float(port_metrics.get("total_portfolio_value", 0.0))
        target_val = float(goal.target_amount)

        progress_pct = round((current_val / max(0.01, target_val)) * 100.0, 2)
        gap = round(max(0.0, target_val - current_val), 2)

        # Time remaining
        months_remaining = None
        required_monthly = None
        if goal.target_date:
            now = datetime.now(timezone.utc)
            td = goal.target_date
            if td.tzinfo is None:
                td = td.replace(tzinfo=timezone.utc)
            days = (td - now).days
            if days > 0:
                months_remaining = max(1, round(days / 30.4))
                required_monthly = round(gap / months_remaining, 2)

        return {
            "id": goal.id,
            "name": goal.name,
            "description": goal.description,
            "target_amount": target_val,
            "currency": goal.currency,
            "current_portfolio_value": current_val,
            "progress_percentage": min(100.0, progress_pct),
            "funding_gap": gap,
            "monthly_contribution": goal.monthly_contribution,
            "target_date": goal.target_date.isoformat() if goal.target_date else None,
            "months_remaining": months_remaining,
            "required_monthly_savings_at_zero_growth": required_monthly,
            "status": "COMPLETED" if current_val >= target_val else ("ON_TRACK" if (required_monthly and goal.monthly_contribution >= required_monthly) else "GAP_IDENTIFIED"),
            "created_at": goal.created_at.isoformat() if goal.created_at else None,
            "disclaimer": "Goal tracking calculations are illustrative arithmetic projections, not investment performance guarantees."
        }


goal_service = GoalService()
