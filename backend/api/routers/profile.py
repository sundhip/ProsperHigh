from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.api.deps import get_db, get_current_user
from backend.database.models import User
from backend.schemas.profile import OnboardingRequest, ProfileResponse, ProfileUpdateRequest
from backend.services.profile_engine import profile_engine
from backend.services.portfolio_service import portfolio_service

router = APIRouter(prefix="/api/profile", tags=["Investor Profile"])


@router.get("/me", response_model=ProfileResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve the authenticated user's investor profile and financial context."""
    return profile_engine.get_full_profile(db, current_user.id)


@router.put("/me", response_model=ProfileResponse)
def update_my_profile(
    payload: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update investment profile preferences with validation."""
    updates = payload.model_dump(exclude_unset=True)
    return profile_engine.update_user_profile(db, current_user.id, updates)


@router.get("/{user_id}", response_model=ProfileResponse)
def get_profile_by_id(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve profile by user_id with server-side ownership authorization.
    Cross-user access is strictly forbidden (403).
    """
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You cannot access another user's financial profile."
        )
    return profile_engine.get_full_profile(db, current_user.id)


@router.post("/onboarding")
def save_onboarding(
    payload: OnboardingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Save results of the 10-step onboarding wizard.
    Always binds to the verified server-side identity of current_user.
    """
    profile_data = payload.profile
    financial_data = payload.financial
    holdings = payload.holdings

    # Save Investor & Financial Profile in DB
    res = profile_engine.save_full_profile(db, current_user.id, profile_data, financial_data)

    # Save Initial Portfolio Holdings if provided
    if holdings:
        for h in holdings:
            sym = h.get("symbol", "").strip()
            qty = float(h.get("quantity", 1))
            price = float(h.get("price", 100.0))
            if sym:
                portfolio_service.add_holding(db, current_user.id, sym, qty, price)

    return res
