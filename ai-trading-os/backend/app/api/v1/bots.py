"""
Bot Profiles API Router
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core import get_db, get_current_user
from app.models import BotProfile, BotRule

router = APIRouter()


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
    confidence_score: Optional[float]

    class Config:
        from_attributes = True


@router.get("/", response_model=List[BotProfileResponse])
async def list_bots(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """List all bot profiles"""
    bots = db.query(BotProfile).all()
    return bots


@router.post("/", response_model=BotProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_bot(
    bot_data: BotProfileCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new bot profile"""
    bot = BotProfile(**bot_data.model_dump())
    bot.user_id = 1  # Single-user mode
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


@router.post("/{bot_id}/activate")
async def activate_bot(
    bot_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Activate bot for trading"""
    bot = db.query(BotProfile).filter(BotProfile.id == bot_id).first()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    
    bot.is_active = True
    db.commit()
    return {"message": f"Bot '{bot.name}' activated", "is_active": True}


@router.post("/{bot_id}/deactivate")
async def deactivate_bot(
    bot_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Deactivate bot"""
    bot = db.query(BotProfile).filter(BotProfile.id == bot_id).first()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    
    bot.is_active = False
    db.commit()
    return {"message": f"Bot '{bot.name}' deactivated", "is_active": False}


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
