"""
Security Utilities - JWT and Password Hashing
"""
from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.config import settings

# Password hashing
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# JWT Bearer (auto_error=False for DEV mode - allows requests without token)
security = HTTPBearer(auto_error=False)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRE_HOURS)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.JWT_SECRET, 
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def decode_token(token: str) -> dict:
    """Decode and verify a JWT token"""
    try:
        payload = jwt.decode(
            token, 
            settings.JWT_SECRET, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


from pydantic import BaseModel

class UserContext(BaseModel):
    id: int
    username: str

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> UserContext:
    """
    Dependency to get current user from JWT token.
    
    DEV MODE: Authentication is DISABLED
    Always returns a default admin user for development convenience.
    """
    # ========================================
    # ⚠️  DEV MODE: AUTH DISABLED
    # ========================================
    # To re-enable authentication, remove this return statement
    # and uncomment the token validation logic below.
    return UserContext(id=1, username="admin")
    
    # --- Original Auth Logic (Commented Out) ---
    # token = credentials.credentials
    # 
    # # DEV MODE: Allow mock-token for development/testing
    # if token == "mock-token":
    #     return UserContext(id=1, username="dev_user")
    # 
    # payload = decode_token(token)
    # 
    # username = payload.get("sub")
    # user_id = payload.get("id")
    # 
    # if username is None or user_id is None:
    #     raise HTTPException(
    #         status_code=status.HTTP_401_UNAUTHORIZED,
    #         detail="Invalid token payload: missing sub or id",
    #     )
    # 
    # return UserContext(id=user_id, username=username)
