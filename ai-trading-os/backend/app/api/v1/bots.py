"""
Bot Profiles API Router
"""
from datetime import datetime, timedelta
from typing import List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core import get_db, get_current_user
from app.models import BotProfile, BotRule
from app.services.audit_service import audit_service

router = APIRouter()


# Rate limiting storage (in production, use Redis)
_rate_limit_store: Dict[str, List[datetime]] = {}
RATE_LIMIT_REQUESTS = 10
RATE_LIMIT_WINDOW = 60  # seconds


def check_rate_limit(user_id: str) -> bool:
    """Check if user has exceeded rate limit for bot control endpoints."""
    now = datetime.utcnow()
    window_start = now - timedelta(seconds=RATE_LIMIT_WINDOW)
    
    if user_id not in _rate_limit_store:
        _rate_limit_store[user_id] = []
    
    # Remove old entries
    _rate_limit_store[user_id] = [
        ts for ts in _rate_limit_store[user_id] 
        if ts > window_start
    ]
    
    if len(_rate_limit_store[user_id]) >= RATE_LIMIT_REQUESTS:
        return False
    
    _rate_limit_store[user_id].append(now)
    return True


# Valid state transitions
VALID_TRANSITIONS = {
    "stopped": ["start"],
    "running": ["stop", "pause"],
    "paused": ["start", "stop"],
}


def validate_transition(current_state: str, action: str) -> bool:
    """Check if state transition is valid."""
    allowed = VALID_TRANSITIONS.get(current_state, [])
    return action in allowed


# Pydantic Schemas
class BotRuleSchema(BaseModel):
    rule_order: int
    indicator: str
    operator: str
    value: Optional[float] = None
    action: str
    is_enabled: bool = True


class BotProfileCreate(BaseModel):
    name: str
    personality: str  # conservative/aggressive/balanced
    strategy_type: Optional[str] = None
    confirmation_level: int = 2
    risk_per_trade: float = 1.0
    max_daily_trades: int = 10
    stop_on_consecutive_loss: int = 3
    primary_timeframe: str = "H1"
    volatility_response: str = "reduce"


class BotProfileResponse(BaseModel):
    id: int
    name: str
    personality: str
    strategy_type: Optional[str]
    confirmation_level: int
    risk_per_trade: float
    max_daily_trades: int
    stop_on_consecutive_loss: int
    primary_timeframe: str
    volatility_response: str
    is_active: bool
    bot_state: str
    confidence_score: Optional[float]

    class Config:
        from_attributes = True


class BotStatusResponse(BaseModel):
    id: int
    name: str
    bot_state: str
    is_active: bool


@router.get("/", response_model=List[BotProfileResponse])
async def list_bots(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """List all bot profiles"""
    bots = db.query(BotProfile).all()
    return bots


@router.get("/status", response_model=List[BotStatusResponse])
async def get_all_bot_status(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get real-time status of all bots"""
    bots = db.query(BotProfile).all()
    return [{"id": b.id, "name": b.name, "bot_state": b.bot_state or "stopped", "is_active": b.is_active} for b in bots]


@router.post("/", response_model=BotProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_bot(
    bot_data: BotProfileCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new bot profile"""
    bot = BotProfile(**bot_data.model_dump())
    bot.user_id = 1  # Single-user mode
    bot.bot_state = "stopped"
    db.add(bot)
    db.commit()
    db.refresh(bot)
    return bot


@router.get("/{bot_id}", response_model=BotProfileResponse)
async def get_bot(
    bot_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get bot profile by ID"""
    bot = db.query(BotProfile).filter(BotProfile.id == bot_id).first()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    return bot


@router.put("/{bot_id}", response_model=BotProfileResponse)
async def update_bot(
    bot_id: int,
    bot_data: BotProfileCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update bot profile"""
    bot = db.query(BotProfile).filter(BotProfile.id == bot_id).first()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    
    for key, value in bot_data.model_dump().items():
        setattr(bot, key, value)
    
    db.commit()
    db.refresh(bot)
    return bot


@router.delete("/{bot_id}")
async def delete_bot(
    bot_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete bot profile"""
    bot = db.query(BotProfile).filter(BotProfile.id == bot_id).first()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    
    db.delete(bot)
    db.commit()
    return {"message": "Bot deleted successfully"}


# === BOT CONTROL ENDPOINTS ===

@router.post("/{bot_id}/start")
async def start_bot(
    bot_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Start a bot - validates state transition"""
    user_key = str(current_user.get("user_id", "anonymous"))
    
    # Rate limiting
    if not check_rate_limit(user_key):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Max 10 requests per minute."
        )
    
    bot = db.query(BotProfile).filter(BotProfile.id == bot_id).first()
    if not bot:
        audit_service.log_bot_control(
            user_id=current_user.get("user_id", 0),
            username=current_user.get("username", "unknown"),
            action="start",
            bot_id=bot_id,
            result="failed",
            error_message="Bot not found",
            ip_address=request.client.host if request.client else None
        )
        raise HTTPException(status_code=404, detail="Bot not found")
    
    current_state = bot.bot_state or "stopped"
    
    # Validate state transition
    if not validate_transition(current_state, "start"):
        audit_service.log_bot_control(
            user_id=current_user.get("user_id", 0),
            username=current_user.get("username", "unknown"),
            action="start",
            bot_id=bot_id,
            bot_name=bot.name,
            result="rejected",
            error_message=f"Invalid transition: {current_state} -> start",
            ip_address=request.client.host if request.client else None
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot start: bot is already {current_state}"
        )
    
    bot.bot_state = "running"
    bot.is_active = True
    db.commit()
    
    audit_service.log_bot_control(
        user_id=current_user.get("user_id", 0),
        username=current_user.get("username", "unknown"),
        action="start",
        bot_id=bot_id,
        bot_name=bot.name,
        result="success",
        ip_address=request.client.host if request.client else None
    )
    
    return {"message": f"Bot '{bot.name}' started", "bot_state": "running"}


@router.post("/{bot_id}/stop")
async def stop_bot(
    bot_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Stop a bot - validates state transition"""
    user_key = str(current_user.get("user_id", "anonymous"))
    
    if not check_rate_limit(user_key):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Max 10 requests per minute."
        )
    
    bot = db.query(BotProfile).filter(BotProfile.id == bot_id).first()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    
    current_state = bot.bot_state or "stopped"
    
    if not validate_transition(current_state, "stop"):
        audit_service.log_bot_control(
            user_id=current_user.get("user_id", 0),
            username=current_user.get("username", "unknown"),
            action="stop",
            bot_id=bot_id,
            bot_name=bot.name,
            result="rejected",
            error_message=f"Invalid transition: {current_state} -> stop",
            ip_address=request.client.host if request.client else None
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot stop: bot is already {current_state}"
        )
    
    bot.bot_state = "stopped"
    bot.is_active = False
    db.commit()
    
    audit_service.log_bot_control(
        user_id=current_user.get("user_id", 0),
        username=current_user.get("username", "unknown"),
        action="stop",
        bot_id=bot_id,
        bot_name=bot.name,
        result="success",
        ip_address=request.client.host if request.client else None
    )
    
    return {"message": f"Bot '{bot.name}' stopped", "bot_state": "stopped"}


@router.post("/{bot_id}/pause")
async def pause_bot(
    bot_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Pause a bot - validates state transition"""
    user_key = str(current_user.get("user_id", "anonymous"))
    
    if not check_rate_limit(user_key):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Max 10 requests per minute."
        )
    
    bot = db.query(BotProfile).filter(BotProfile.id == bot_id).first()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    
    current_state = bot.bot_state or "stopped"
    
    if not validate_transition(current_state, "pause"):
        audit_service.log_bot_control(
            user_id=current_user.get("user_id", 0),
            username=current_user.get("username", "unknown"),
            action="pause",
            bot_id=bot_id,
            bot_name=bot.name,
            result="rejected",
            error_message=f"Invalid transition: {current_state} -> pause",
            ip_address=request.client.host if request.client else None
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot pause: bot is {current_state}"
        )
    
    bot.bot_state = "paused"
    db.commit()
    
    audit_service.log_bot_control(
        user_id=current_user.get("user_id", 0),
        username=current_user.get("username", "unknown"),
        action="pause",
        bot_id=bot_id,
        bot_name=bot.name,
        result="success",
        ip_address=request.client.host if request.client else None
    )
    
    return {"message": f"Bot '{bot.name}' paused", "bot_state": "paused"}


@router.post("/emergency-stop")
async def emergency_stop(
    request: Request,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Emergency stop all bots - KILL SWITCH"""
    user_key = str(current_user.get("user_id", "anonymous"))
    
    # Stricter rate limit for emergency stop (3 per minute)
    if not check_rate_limit(f"emergency_{user_key}"):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Emergency stop rate limit exceeded."
        )
    
    # Stop all bots
    bots = db.query(BotProfile).filter(BotProfile.bot_state != "stopped").all()
    stopped_bots = []
    
    for bot in bots:
        bot.bot_state = "stopped"
        bot.is_active = False
        stopped_bots.append({"id": bot.id, "name": bot.name})
    
    db.commit()
    
    audit_service.log_bot_control(
        user_id=current_user.get("user_id", 0),
        username=current_user.get("username", "unknown"),
        action="emergency_stop",
        result="success",
        ip_address=request.client.host if request.client else None,
        extra={"stopped_bots": stopped_bots}
    )
    
    return {
        "message": f"Emergency stop executed. {len(stopped_bots)} bot(s) stopped.",
        "stopped_bots": stopped_bots
    }


# === LEGACY ENDPOINTS (kept for backwards compatibility) ===

@router.post("/{bot_id}/activate")
async def activate_bot(
    bot_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Activate bot for trading (legacy - use /start instead)"""
    return await start_bot(bot_id, request, db, current_user)


@router.post("/{bot_id}/deactivate")
async def deactivate_bot(
    bot_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Deactivate bot (legacy - use /stop instead)"""
    return await stop_bot(bot_id, request, db, current_user)


@router.get("/{bot_id}/rules", response_model=List[BotRuleSchema])
async def get_bot_rules(
    bot_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get bot trading rules"""
    rules = db.query(BotRule).filter(BotRule.bot_profile_id == bot_id).order_by(BotRule.rule_order).all()
    return rules


@router.put("/{bot_id}/rules")
async def update_bot_rules(
    bot_id: int,
    rules: List[BotRuleSchema],
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update bot trading rules"""
    # Delete existing rules
    db.query(BotRule).filter(BotRule.bot_profile_id == bot_id).delete()
    
    # Add new rules
    for rule_data in rules:
        rule = BotRule(bot_profile_id=bot_id, **rule_data.model_dump())
        db.add(rule)
    
    db.commit()
    return {"message": "Rules updated successfully", "count": len(rules)}

