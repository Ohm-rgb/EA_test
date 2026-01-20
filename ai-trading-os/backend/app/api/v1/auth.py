"""
Authentication API Router
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core import get_db, get_password_hash, verify_password, create_access_token
from app.core.security import get_current_user
from app.models import User, Settings

router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str


class SessionResponse(BaseModel):
    authenticated: bool
    username: str | None = None


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login endpoint (Single-user mode)"""
    user = db.query(User).filter(User.username == request.username).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    
    if not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Create token
    access_token = create_access_token(data={"sub": user.username})
    
    return LoginResponse(
        access_token=access_token,
        username=user.username
    )


@router.post("/logout")
async def logout():
    """Logout endpoint"""
    # In JWT-based auth, logout is handled client-side by removing the token
    return {"message": "Logged out successfully"}


@router.get("/session", response_model=SessionResponse)
async def check_session(current_user: dict = Depends(get_current_user)):
    """Check if session is valid"""
    return SessionResponse(
        authenticated=True,
        username=current_user.get("username")
    )


@router.post("/setup")
async def setup_user(request: LoginRequest, db: Session = Depends(get_db)):
    """Initial user setup (run once)"""
    # Check if user already exists
    existing = db.query(User).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists. Single-user mode allows only one user.",
        )
    
    # Create user
    user = User(
        username=request.username,
        password_hash=get_password_hash(request.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create default settings
    settings = Settings(user_id=user.id)
    db.add(settings)
    db.commit()
    
    return {"message": "User created successfully", "username": user.username}
