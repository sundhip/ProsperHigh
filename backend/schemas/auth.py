from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Full name of user")
    email: EmailStr = Field(..., description="Valid unique email address")
    password: str = Field(..., min_length=6, max_length=128, description="Secure user password")


class UserLoginRequest(BaseModel):
    email: EmailStr = Field(..., description="Registered email address")
    password: str = Field(..., description="Account password")


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: str
    token: Optional[str] = None
    hasCompletedOnboarding: Optional[bool] = False


class AuthResponse(BaseModel):
    success: bool
    user: UserResponse
    token: str
    token_type: str = "bearer"
