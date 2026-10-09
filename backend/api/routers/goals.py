from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.api.deps import get_db, get_current_user
from backend.database.models import User
from backend.schemas.goals import GoalCreateRequest, GoalUpdateRequest, GoalResponse
from backend.services.goal_service import goal_service

router = APIRouter(prefix="/api/goals", tags=["Financial Goals"])


@router.get("", response_model=List[GoalResponse])
def list_goals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List financial goals for authenticated user with deterministic progress metrics."""
    return goal_service.list_goals(db, current_user.id)


@router.post("", response_model=GoalResponse)
def create_goal(
    payload: GoalCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new user-defined financial goal."""
    return goal_service.create_goal(
        db=db,
        user_id=current_user.id,
        name=payload.name,
        target_amount=payload.target_amount,
        target_date=payload.target_date,
        monthly_contribution=payload.monthly_contribution,
        description=payload.description,
        portfolio_id=payload.portfolio_id
    )


@router.get("/{goal_id}", response_model=GoalResponse)
def get_goal(
    goal_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve details for a specific goal with user ownership validation."""
    return goal_service.get_goal(db, current_user.id, goal_id)


@router.put("/{goal_id}", response_model=GoalResponse)
def update_goal(
    goal_id: str,
    payload: GoalUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update goal parameters enforcing ownership."""
    updates = payload.model_dump(exclude_unset=True)
    return goal_service.update_goal(db, current_user.id, goal_id, updates)


@router.delete("/{goal_id}")
def delete_goal(
    goal_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a goal enforcing user ownership."""
    return {"success": goal_service.delete_goal(db, current_user.id, goal_id)}
