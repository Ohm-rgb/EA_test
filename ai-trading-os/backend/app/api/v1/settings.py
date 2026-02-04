"""
Settings API Router
SECURITY: API keys are NEVER returned to frontend
"""
import re
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, field_validator

from app.core import get_db, get_current_user
from app.core.ai_models import (
    ALLOWED_LOCAL_MODELS, DEFAULT_LOCAL_MODEL,
    validate_local_model, normalize_local_model,
    get_available_local_models,
    ALLOWED_GEMINI_MODELS, DEFAULT_GEMINI_MODEL
)
from app.models import Settings

router = APIRouter()


# API Key format validators
GEMINI_KEY_PATTERN = re.compile(r"^AIza[A-Za-z0-9_-]{35}$")
OPENAI_KEY_PATTERN = re.compile(r"^sk-[A-Za-z0-9]{48}$")


def validate_gemini_key(key: str) -> bool:
    """Validate Gemini API key format."""
    if not key:
        return True
    return bool(GEMINI_KEY_PATTERN.match(key))


def validate_openai_key(key: str) -> bool:
    """Validate OpenAI API key format."""
    if not key:
        return True
    # OpenAI keys have variable length, simplified check
    return key.startswith("sk-") and len(key) >= 40


class SettingsResponse(BaseModel):
    """Response model - NEVER includes actual API keys"""
    risk_profile: Optional[str] = "balanced"
    max_drawdown_percent: Optional[float] = 10.0
    daily_loss_limit: Optional[float] = None
    news_sensitivity: Optional[str] = "soft_filter"
    primary_ai_provider: Optional[str] = "ollama"
    local_ai_model: Optional[str] = DEFAULT_LOCAL_MODEL
    external_ai_provider: Optional[str] = "gemini"
    external_ai_model: Optional[str] = DEFAULT_GEMINI_MODEL
    # Boolean flags instead of actual keys
    has_gemini_key: bool = False
    has_openai_key: bool = False
    monthly_token_limit: Optional[int] = 100000
    mt5_server: Optional[str] = None
    mt5_account_type: Optional[str] = "demo"
    # Available models for frontend
    available_local_models: List[str] = []
    available_gemini_models: List[str] = []

    class Config:
        from_attributes = True


class SettingsUpdate(BaseModel):
    risk_profile: Optional[str] = None
    max_drawdown_percent: Optional[float] = None
    daily_loss_limit: Optional[float] = None
    news_sensitivity: Optional[str] = None
    # Support updating AI settings here too
    primary_ai_provider: Optional[str] = None
    local_ai_model: Optional[str] = None
    external_ai_provider: Optional[str] = None
    external_ai_model: Optional[str] = None
    gemini_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    monthly_token_limit: Optional[int] = None

    @field_validator('gemini_api_key')
    @classmethod
    def validate_gemini(cls, v):
        if v and not validate_gemini_key(v):
            raise ValueError('Invalid Gemini API key format')
        return v

    @field_validator('openai_api_key')
    @classmethod
    def validate_openai(cls, v):
        if v and not validate_openai_key(v):
            raise ValueError('Invalid OpenAI API key format')
        return v


class AISettingsUpdate(BaseModel):
    primary_ai_provider: Optional[str] = None
    local_ai_model: Optional[str] = None
    external_ai_provider: Optional[str] = None
    external_ai_model: Optional[str] = None
    gemini_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    monthly_token_limit: Optional[int] = None

    @field_validator('gemini_api_key')
    @classmethod
    def validate_gemini(cls, v):
        if v and not validate_gemini_key(v):
            raise ValueError('Invalid Gemini API key format')
        return v

    @field_validator('openai_api_key')
    @classmethod
    def validate_openai(cls, v):
        if v and not validate_openai_key(v):
            raise ValueError('Invalid OpenAI API key format')
        return v


class AISettingsResponse(BaseModel):
    """AI Settings response - NEVER includes actual API keys"""
    primary_ai_provider: Optional[str] = None
    local_ai_model: Optional[str] = None
    external_ai_provider: Optional[str] = None
    external_ai_model: Optional[str] = None
    has_gemini_key: bool = False
    has_openai_key: bool = False
    has_ollama: bool = False
    monthly_token_limit: Optional[int] = None
    # Connection state
    external_ai_status: Optional[str] = None  # not_tested, connected, error
    external_ai_last_checked: Optional[str] = None  # ISO datetime string
    external_ai_error: Optional[str] = None
    # Available models for dropdowns
    default_local_model: str = DEFAULT_LOCAL_MODEL
    available_local_models: List[str] = []
    default_gemini_model: str = DEFAULT_GEMINI_MODEL
    available_gemini_models: List[str] = []


class MT5ConnectionTest(BaseModel):
    server: str
    login: str
    password: str


def settings_to_response(settings: Settings) -> dict:
    """Convert Settings model to safe response (no API keys)."""
    return {
        "risk_profile": settings.risk_profile,
        "max_drawdown_percent": settings.max_drawdown_percent,
        "daily_loss_limit": settings.daily_loss_limit,
        "news_sensitivity": settings.news_sensitivity,
        "primary_ai_provider": settings.primary_ai_provider,
        "local_ai_model": settings.local_ai_model,
        "external_ai_provider": settings.external_ai_provider,
        "external_ai_model": settings.external_ai_model,
        "has_gemini_key": bool(settings.gemini_api_key),
        "has_openai_key": bool(settings.openai_api_key),
        "monthly_token_limit": settings.monthly_token_limit,
        "external_ai_status": getattr(settings, 'external_ai_status', 'not_tested'),
        "external_ai_last_checked": settings.external_ai_last_checked.isoformat() if getattr(settings, 'external_ai_last_checked', None) else None,
        "external_ai_error": getattr(settings, 'external_ai_error', None),
        "mt5_server": settings.mt5_server,
        "mt5_account_type": settings.mt5_account_type,
    }


@router.get("/", response_model=SettingsResponse)
async def get_settings(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all settings (API keys are NOT returned)"""
    settings = db.query(Settings).first()
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")
    return settings_to_response(settings)


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


@router.get("/ai", response_model=AISettingsResponse)
async def get_ai_settings(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get AI-specific settings (API keys are NOT returned)"""
    settings = db.query(Settings).first()
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")
    
    # Check if Ollama is available
    has_ollama = False
    try:
        import httpx
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get("http://localhost:11434/api/tags")
            has_ollama = resp.status_code == 200
    except Exception:
        pass
    
    return {
        "primary_ai_provider": settings.primary_ai_provider or "ollama",
        "local_ai_model": settings.local_ai_model or DEFAULT_LOCAL_MODEL,
        "external_ai_provider": settings.external_ai_provider or "gemini",
        "external_ai_model": settings.external_ai_model or DEFAULT_GEMINI_MODEL,
        "has_gemini_key": bool(settings.gemini_api_key),
        "has_openai_key": bool(settings.openai_api_key),
        "has_ollama": has_ollama,
        "monthly_token_limit": settings.monthly_token_limit,
        # Available models for frontend dropdowns
        "default_local_model": DEFAULT_LOCAL_MODEL,
        "available_local_models": get_available_local_models(),
        "default_gemini_model": DEFAULT_GEMINI_MODEL,
        "available_gemini_models": sorted(list(ALLOWED_GEMINI_MODELS)),
        "external_ai_status": getattr(settings, 'external_ai_status', 'not_tested'),
        "external_ai_last_checked": settings.external_ai_last_checked.isoformat() if getattr(settings, 'external_ai_last_checked', None) else None,
        "external_ai_error": getattr(settings, 'external_ai_error', None)
    }


@router.put("/ai")
async def update_ai_settings(
    data: AISettingsUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update AI settings with model validation"""
    settings = db.query(Settings).first()
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")
    
    updates = data.model_dump(exclude_unset=True)
    
    # Validate and normalize local_ai_model if provided
    if "local_ai_model" in updates and updates["local_ai_model"]:
        model = updates["local_ai_model"]
        if not validate_local_model(model):
            # Log the invalid attempt
            from app.services.audit_service import audit_service
            audit_service.log_auth_event(
                event_type="invalid_model",
                username=current_user.get("username", "unknown"),
                result="rejected",
                error_message=f"Invalid model: {model}. Allowed: {', '.join(get_available_local_models())}"
            )
            raise HTTPException(
                status_code=400,
                detail=f"Invalid local AI model '{model}'. Allowed models: {', '.join(get_available_local_models())}"
            )
        # Normalize the model name
        updates["local_ai_model"] = normalize_local_model(model)
    
    # Apply updates
    for key, value in updates.items():
        setattr(settings, key, value)
    
    db.commit()
    
    # Update active AI service
    from app.services.ai_service import ai_service
    ai_service.update_settings(updates)
    
    return {"message": "AI settings updated successfully"}


@router.delete("/ai/gemini-key")
async def remove_gemini_key(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Remove Gemini API key"""
    settings = db.query(Settings).first()
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")
    
    settings.gemini_api_key = None
    db.commit()
    return {"message": "Gemini API key removed"}


@router.delete("/ai/openai-key")
async def remove_openai_key(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Remove OpenAI API key"""
    settings = db.query(Settings).first()
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")
    
    settings.openai_api_key = None
    db.commit()
    return {"message": "OpenAI API key removed"}


@router.post("/test-mt5")
async def test_mt5_connection(
    data: MT5ConnectionTest,
    current_user: dict = Depends(get_current_user)
):
    """Test MT5 connection with real MetaTrader 5 terminal"""
    from app.services.mt5_service import mt5_service
    
    # Convert login to int if it's a string
    try:
        login_id = int(data.login)
    except ValueError:
        return {
            "status": "error",
            "message": "Login ID must be a valid number"
        }
    
    # Test real connection
    result = mt5_service.test_connection(
        server=data.server,
        login=login_id,
        password=data.password
    )
    
    # Build response
    response = {
        "status": result.status.value,
        "message": result.message
    }
    
    if result.account_info:
        response["account_info"] = {
            "server": result.account_info.server,
            "login": result.account_info.login,
            "balance": result.account_info.balance,
            "equity": result.account_info.equity,
            "margin_free": result.account_info.margin_free,
            "currency": result.account_info.currency,
            "leverage": result.account_info.leverage,
            "name": result.account_info.name,
            "company": result.account_info.company
        }
    
    if result.error_code:
        response["error_code"] = result.error_code
    
    return response


# API Key format validators
GEMINI_KEY_PATTERN = re.compile(r"^AIza[A-Za-z0-9_-]{30,}$")  # Relaxed validation
OPENAI_KEY_PATTERN = re.compile(r"^sk-[A-Za-z0-9]{30,}$")    # Relaxed validation

# ... (omitted middle parts) ...

@router.post("/test-ai")
async def test_ai_connection(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
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
    
    # Test Gemini (Real Connection Test)
    settings = db.query(Settings).first()
    if settings and settings.gemini_api_key:
        try:
            from app.services.gemini_client import GeminiClient
            from datetime import datetime
            # Create temporary client for testing
            client = GeminiClient(api_key=settings.gemini_api_key)
            # Use a lightweight model for the test if possible, or the configured one
            if settings.external_ai_model:
                client.model = settings.external_ai_model
                
            # Try a minimal generation
            await client.generate("Ping", context=None)
            
            # Persist success status to DB
            settings.external_ai_status = "connected"
            settings.external_ai_last_checked = datetime.utcnow()
            settings.external_ai_error = None
            db.commit()
            
            results["gemini"] = {"status": "connected", "message": "Successfully connected to Gemini API"}
        except Exception as e:
            # Persist error status to DB
            from datetime import datetime
            settings.external_ai_status = "error"
            settings.external_ai_last_checked = datetime.utcnow()
            settings.external_ai_error = str(e)[:250]  # Truncate to fit column
            db.commit()
            
            results["gemini"] = {"status": "error", "message": f"Connection Failed: {str(e)}"}
    else:
        results["gemini"] = {"status": "not_configured", "message": "API key not set"}
    
    return results

