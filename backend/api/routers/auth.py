from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.api.deps import get_db, get_current_user
from backend.database.models import User
from backend.schemas.auth import UserRegisterRequest, UserLoginRequest, AuthResponse, UserResponse
from backend.services.auth_service import auth_service

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    """Register a new user, hash password securely, initialize profile, and return JWT."""
    res = auth_service.register_user(db, payload.name, payload.email, payload.password)
    return res


@router.post("/login", response_model=AuthResponse)
def login(payload: UserLoginRequest, db: Session = Depends(get_db)):
    """Authenticate with email and password, returning JWT and user session data."""
    res = auth_service.login_user(db, payload.email, payload.password)
    return res


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Get profile information for the authenticated user."""
    has_completed = False
    if current_user.investor_profile:
        has_completed = current_user.investor_profile.onboarding_completed

    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        hasCompletedOnboarding=has_completed
    )
