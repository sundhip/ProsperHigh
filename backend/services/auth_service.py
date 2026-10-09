import uuid
from typing import Dict, Any, Optional
import httpx
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from backend.database.models import User, InvestorProfile, FinancialProfile
from backend.core.security import hash_password, verify_password, create_access_token
from backend.core.config import settings


class AuthService:
    def register_user(self, db: Session, name: str, email: str, password: str) -> Dict[str, Any]:
        email_clean = email.strip().lower()
        
        # Check duplicate email
        existing = db.query(User).filter(User.email == email_clean).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists."
            )
            
        user_id = f"USR-{uuid.uuid4().hex[:8].upper()}"
        pwd_hash = hash_password(password)
        
        new_user = User(
            id=user_id,
            name=name.strip(),
            email=email_clean,
            password_hash=pwd_hash,
            is_active=True
        )
        db.add(new_user)
        
        # Create default empty investor profile
        default_profile = InvestorProfile(
            user_id=user_id,
            risk_score=50,
            risk_category="Balanced Growth",
            onboarding_completed=False
        )
        db.add(default_profile)
        
        default_financial = FinancialProfile(
            user_id=user_id
        )
        db.add(default_financial)
        
        db.commit()
        db.refresh(new_user)
        
        token = create_access_token(
            subject=user_id,
            extra_claims={"email": email_clean, "name": new_user.name}
        )
        
        return {
            "success": True,
            "user": {
                "id": new_user.id,
                "name": new_user.name,
                "email": new_user.email,
                "token": token,
                "hasCompletedOnboarding": False
            },
            "token": token,
            "token_type": "bearer"
        }

    def login_user(self, db: Session, email: str, password: str) -> Dict[str, Any]:
        email_clean = email.strip().lower()
        user = db.query(User).filter(User.email == email_clean).first()
        
        if not user or not user.password_hash or not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email address or password.",
                headers={"WWW-Authenticate": "Bearer"}
            )
            
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is deactivated."
            )
            
        has_completed = False
        if user.investor_profile:
            has_completed = user.investor_profile.onboarding_completed
            
        token = create_access_token(
            subject=user.id,
            extra_claims={"email": user.email, "name": user.name}
        )
        
        return {
            "success": True,
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "token": token,
                "hasCompletedOnboarding": has_completed
            },
            "token": token,
            "token_type": "bearer"
        }

    def verify_google_token(self, id_token: str) -> Dict[str, Any]:
        """Validate Google OpenID Connect ID token against Google tokeninfo endpoint."""
        url = f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.get(url)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Unable to contact Google OAuth verification servers."
            )

        if resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired Google ID token.",
                headers={"WWW-Authenticate": "Bearer"}
            )

        data = resp.json()

        # Validate token issuer
        iss = data.get("iss", "")
        if iss not in ["accounts.google.com", "https://accounts.google.com"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Google token issuer.",
                headers={"WWW-Authenticate": "Bearer"}
            )

        # Validate audience if client ID is configured
        if settings.GOOGLE_CLIENT_ID:
            aud = data.get("aud", "")
            if aud != settings.GOOGLE_CLIENT_ID:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Google client ID audience mismatch.",
                    headers={"WWW-Authenticate": "Bearer"}
                )

        # Ensure email is verified by Google
        email_verified = data.get("email_verified")
        if email_verified not in [True, "true", "True"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google account email is not verified."
            )

        return data

    def authenticate_google_user(self, db: Session, id_token: str) -> Dict[str, Any]:
        """Verify Google ID token, find or link account by stable sub/email, and issue app JWT."""
        google_data = self.verify_google_token(id_token)
        google_sub = google_data.get("sub")
        email = google_data.get("email", "").strip().lower()
        name = google_data.get("name", "").strip() or "Google User"

        if not google_sub or not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incomplete identity information returned by Google."
            )

        # 1. Look up user by stable Google subject identifier (prevents email spoofing)
        user = db.query(User).filter(User.google_id == google_sub).first()
        is_new_user = False

        if not user:
            # 2. Safe account linking: Check existing user with verified Google email
            user = db.query(User).filter(User.email == email).first()
            if user:
                user.google_id = google_sub
                if not user.name and name:
                    user.name = name
                db.commit()
                db.refresh(user)
            else:
                # 3. Create new user with Google external identity
                user_id = f"USR-{uuid.uuid4().hex[:8].upper()}"
                user = User(
                    id=user_id,
                    name=name,
                    email=email,
                    google_id=google_sub,
                    auth_provider="google",
                    password_hash=None,
                    is_active=True
                )
                db.add(user)

                default_profile = InvestorProfile(
                    user_id=user_id,
                    risk_score=50,
                    risk_category="Balanced Growth",
                    onboarding_completed=False
                )
                db.add(default_profile)

                default_financial = FinancialProfile(
                    user_id=user_id
                )
                db.add(default_financial)

                db.commit()
                db.refresh(user)
                is_new_user = True

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is deactivated."
            )

        has_completed = False
        if user.investor_profile:
            has_completed = user.investor_profile.onboarding_completed

        token = create_access_token(
            subject=user.id,
            extra_claims={"email": user.email, "name": user.name}
        )

        return {
            "success": True,
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "token": token,
                "hasCompletedOnboarding": has_completed
            },
            "token": token,
            "token_type": "bearer",
            "is_new_user": is_new_user
        }


auth_service = AuthService()
