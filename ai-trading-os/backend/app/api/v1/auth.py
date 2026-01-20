"""
Authentication API Router
"""
from datetime import datetime, timedelta
from typing import Dict, List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core import get_db, get_password_hash, verify_password, create_access_token
from app.core.security import get_current_user
from app.models import User, Settings
from app.services.audit_service import audit_service

router = APIRouter()


# Rate limiting storage
_login_rate_limit: Dict[str, List[datetime]] = {}
LOGIN_RATE_LIMIT = 5  # Max attempts
LOGIN_RATE_WINDOW = 60  # seconds


def check_login_rate_limit(identifier: str) -> bool:
    """Check if login attempts are within rate limit."""
    now = datetime.utcnow()
    window_start = now - timedelta(seconds=LOGIN_RATE_WINDOW)
    
    if identifier not in _login_rate_limit:
        _login_rate_limit[identifier] = []
    
    # Remove old entries
    _login_rate_limit[identifier] = [
        ts for ts in _login_rate_limit[identifier] 
        if ts > window_start
    ]
    
    if len(_login_rate_limit[identifier]) >= LOGIN_RATE_LIMIT:
        return False
    
    _login_rate_limit[identifier].append(now)
    return True


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
async def login(
    request: LoginRequest, 
    req: Request,
    db: Session = Depends(get_db)
):
    """Login endpoint with rate limiting"""
    client_ip = req.client.host if req.client else "unknown"
    rate_key = f"{client_ip}:{request.username}"
    
    # Check rate limit
    if not check_login_rate_limit(rate_key):
        audit_service.log_auth_event(
            event_type="login",
            username=request.username,
            result="rate_limited",
            ip_address=client_ip,
            error_message="Too many login attempts"
        )
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Please wait 1 minute.",
        )
    
    user = db.query(User).filter(User.username == request.username).first()
    
    if not user:
        audit_service.log_auth_event(
            event_type="login",
            username=request.username,
            result="failed",
            ip_address=client_ip,
            error_message="User not found"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    
    if not verify_password(request.password, user.password_hash):
        audit_service.log_auth_event(
            event_type="login",
            username=request.username,
            result="failed",
            ip_address=client_ip,
            error_message="Invalid password"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Create token
    access_token = create_access_token(data={"sub": user.username})
    
    audit_service.log_auth_event(
        event_type="login",
        username=request.username,
        result="success",
        ip_address=client_ip
    )
    
    return LoginResponse(
        access_token=access_token,
        username=user.username
    )


@router.post("/logout")
async def logout(
    req: Request,
    current_user: dict = Depends(get_current_user)
):
    """Logout endpoint"""
    client_ip = req.client.host if req.client else "unknown"
    audit_service.log_auth_event(
        event_type="logout",
        username=current_user.get("username", "unknown"),
        result="success",
        ip_address=client_ip
    )
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

