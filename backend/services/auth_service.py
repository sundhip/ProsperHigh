import uuid
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from backend.database.models import User, InvestorProfile, FinancialProfile
from backend.core.security import hash_password, verify_password, create_access_token


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
        
        if not user or not verify_password(password, user.password_hash):
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


auth_service = AuthService()
