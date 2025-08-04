from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from datetime import datetime, timedelta
import os
from typing import List

from models.schemas import (
    UserCreate, UserLogin, UserResponse, ProfileCreate, ProfileUpdate,
    ProfileResponse, Token, SuccessResponse, ErrorResponse
)
from models.database_ops import (
    create_user, get_user_by_email, verify_user_password,
    create_profile, get_profile_by_email, update_profile, upsert_profile
)

# Use environment variable for JWT secret
JWT_SECRET = os.getenv("JWT_SECRET", "sldfjghas43053oddskfj")
JWT_ALGORITHM = "HS256" # SHA - 256 algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = 60

router = APIRouter()
security = HTTPBearer()

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return email
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/register", response_model=Token)
async def register(user: UserCreate):
    """Register a new user"""
    try:
        # Check if user already exists
        existing_user = await get_user_by_email(user.email)
        if existing_user:
            raise HTTPException(
                status_code=400, 
                detail="Email already registered"
            )
        
        # Create user in database
        await create_user(user)
        
        # Create access token
        access_token = create_access_token(data={"sub": user.email})
        return {"access_token": access_token, "token_type": "bearer"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login", response_model=Token)
async def login(user: UserLogin):
    """Login user"""
    try:
        # Verify user credentials
        if not await verify_user_password(user.email, user.password):
            raise HTTPException(
                status_code=401, 
                detail="Invalid credentials"
            )
        
        # Create access token
        access_token = create_access_token(data={"sub": user.email})
        return {"access_token": access_token, "token_type": "bearer"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Login failed: {str(e)}"
        )

@router.get("/profile", response_model=ProfileResponse)
async def get_profile(email: str = Depends(verify_token)):
    """Get user profile"""
    try:
        profile = await get_profile_by_email(email)
        if not profile:
            # Return minimal profile if not set
            return ProfileResponse(
                email=email,
                first_name="",
                last_name="",
                gender=None,
                age=None,
                style_preferences=[],
                updated_at=datetime.utcnow()
            )
        profile_dict = profile.model_dump(by_alias=True)
        if "_id" in profile_dict:
            profile_dict["id"] = profile_dict.pop("_id")
        return ProfileResponse(**profile_dict)
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get profile: {str(e)}"
        )

@router.put("/profile", response_model=ProfileResponse)
async def update_profile_endpoint(
    profile_update: ProfileUpdate,
    email: str = Depends(verify_token)
):
    """Update user profile (creates profile if it doesn't exist)"""
    try:
        # Convert ProfileUpdate to ProfileCreate for upsert
        profile_create = ProfileCreate(
            first_name=profile_update.first_name or "",
            last_name=profile_update.last_name or "",
            gender=profile_update.gender,
            age=profile_update.age,
            style_preferences=profile_update.style_preferences or []
        )
        
        # Use upsert to create or update profile
        updated_profile = await upsert_profile(email, profile_create)
        
        profile_dict = updated_profile.model_dump(by_alias=True)
        if "_id" in profile_dict:
            profile_dict["id"] = profile_dict.pop("_id")
        return ProfileResponse(**profile_dict)
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update profile: {str(e)}"
        )

@router.post("/profile", response_model=ProfileResponse)
async def create_profile_endpoint(
    profile: ProfileCreate,
    email: str = Depends(verify_token)
):
    """Create or update user profile"""
    try:
        profile_data = await upsert_profile(email, profile)
        profile_dict = profile_data.model_dump(by_alias=True)
        if "_id" in profile_dict:
            profile_dict["id"] = profile_dict.pop("_id")
        return ProfileResponse(**profile_dict)
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create profile: {str(e)}"
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user(email: str = Depends(verify_token)):
    """Get current user information"""
    try:
        user = await get_user_by_email(email)
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
        return UserResponse(
            email=user.email,
            created_at=user.created_at,
            is_active=user.is_active
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get user: {str(e)}"
        )

@router.delete("/account", response_model=SuccessResponse)
async def delete_account(email: str = Depends(verify_token)):
    """Delete user account (placeholder for future implementation)"""
    # This is a placeholder - in a real implementation, you would:
    # 1. Delete user from database
    # 2. Delete all associated data (wardrobe items, try-on sessions, etc.)
    # 3. Handle cleanup of uploaded files
    return SuccessResponse(
        success=True,
        message="Account deletion endpoint - implementation pending"
    )
