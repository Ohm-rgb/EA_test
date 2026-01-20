"""
Settings API Router
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.core import get_db, get_current_user
from app.models import Settings

router = APIRouter()


class SettingsResponse(BaseModel):
    risk_profile: str
    max_drawdown_percent: float
    daily_loss_limit: Optional[float]
    news_sensitivity: str
    local_ai_model: str
    external_ai_provider: str
    external_ai_model: str
    monthly_token_limit: int
    mt5_server: Optional[str]
    mt5_account_type: str

    class Config:
        from_attributes = True


class SettingsUpdate(BaseModel):
    risk_profile: Optional[str] = None
    max_drawdown_percent: Optional[float] = None
    daily_loss_limit: Optional[float] = None
    news_sensitivity: Optional[str] = None


class AISettingsUpdate(BaseModel):
    local_ai_model: Optional[str] = None
    external_ai_provider: Optional[str] = None
    external_ai_model: Optional[str] = None
    monthly_token_limit: Optional[int] = None


class MT5ConnectionTest(BaseModel):
    server: str
    login: str
    password: str


@router.get("/", response_model=SettingsResponse)
async def get_settings(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all settings"""
    settings = db.query(Settings).first()
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")
    return settings


@router.put("/")
async def update_settings(
    data: SettingsUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update trading settings"""
    settings = db.query(Settings).first()
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")
    
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(settings, key, value)
    
    db.commit()
    return {"message": "Settings updated successfully"}


@router.get("/ai")
async def get_ai_settings(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get AI-specific settings"""
    settings = db.query(Settings).first()
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")
    
    return {
        "local_ai_model": settings.local_ai_model,
        "external_ai_provider": settings.external_ai_provider,
        "external_ai_model": settings.external_ai_model,
        "monthly_token_limit": settings.monthly_token_limit
    }


@router.put("/ai")
async def update_ai_settings(
    data: AISettingsUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update AI settings"""
    settings = db.query(Settings).first()
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")
    
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(settings, key, value)
    
    db.commit()
    return {"message": "AI settings updated successfully"}


@router.post("/test-mt5")
async def test_mt5_connection(
    data: MT5ConnectionTest,
    current_user: dict = Depends(get_current_user)
):
    """Test MT5 connection"""
    # In real implementation, this would test actual MT5 connection
    # For now, return mock response
    
    # Simulate connection test
    import asyncio
    await asyncio.sleep(1)  # Simulate network delay
    
    return {
        "status": "connected",
        "message": "Successfully connected to MT5 server",
        "account_info": {
            "server": data.server,
            "login": data.login,
            "balance": 10000.00,
            "currency": "USD"
        }
    }


@router.post("/test-ai")
async def test_ai_connection(
    current_user: dict = Depends(get_current_user)
):
    """Test AI connections (Ollama + Gemini)"""
    results = {
        "ollama": {"status": "unknown", "message": ""},
        "gemini": {"status": "unknown", "message": ""}
    }
    
    # Test Ollama
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.get("http://localhost:11434/api/tags", timeout=5.0)
            if response.status_code == 200:
                results["ollama"] = {"status": "connected", "message": "Ollama is running"}
            else:
                results["ollama"] = {"status": "error", "message": f"Status: {response.status_code}"}
    except Exception as e:
        results["ollama"] = {"status": "disconnected", "message": str(e)}
    
    # Test Gemini (would require API key)
    from app.core.config import settings
    if settings.GEMINI_API_KEY:
        results["gemini"] = {"status": "configured", "message": "API key is set"}
    else:
        results["gemini"] = {"status": "not_configured", "message": "API key not set"}
    
    return results
