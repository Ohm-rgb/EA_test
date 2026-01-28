from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from sqlalchemy.orm import Session
from typing import List
from ..core.security import get_current_user

from app import models
from app.core.database import get_db
from pydantic import BaseModel
from typing import Dict, Any

router = APIRouter()

class BotConfigSchema(BaseModel):
    risk_level: str = "medium"
    active_pairs: List[str] = []
    max_positions: int = 3
    
    class Config:
        extra = "allow"

class BotCreate(BaseModel):
    id: str
    name: str
    status: str = 'stopped'
    configuration: BotConfigSchema

class BotResponse(BaseModel):
    id: str
    name: str
    status: str
    configuration: Dict[str, Any]
    user_id: int

    class Config:
        orm_mode = True

def format_bot_response(bot):
    # Helper to ensure configuration is returned as dict (if stored as string/JSON)
    return bot


@router.get("", response_model=List[BotResponse])
def get_bots(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    bots = db.query(models.Bot).filter(models.Bot.user_id == current_user.id).all()
    return [format_bot_response(b) for b in bots]

class AvailableIndicatorResponse(BaseModel):
    indicator_id: str
    name: str
    type: str # RSI, SMC, etc.
    status: str
    is_bound: bool
    is_enabled: bool # The *binding* enabled status
    bot_indicator_id: str | None
    order: int

    class Config:
        orm_mode = True

@router.get("/{bot_id}/available-indicators", response_model=List[AvailableIndicatorResponse])
def get_available_indicators(
    bot_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    List all indicators for the user, with binding status for the specific bot.
    """
    # 1. Verify Bot Ownership
    bot = db.query(models.Bot).filter(models.Bot.id == bot_id, models.Bot.user_id == current_user.id).first()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")

    # 2. Get User's Indicators (excluding archived)
    indicators = db.query(models.StrategyPackage).filter(
        models.StrategyPackage.user_id == current_user.id,
        models.StrategyPackage.status != 'archived'
    ).all()

    # 3. Get Existing Bindings
    bindings = db.query(models.BotIndicator).filter(models.BotIndicator.bot_id == bot_id).all()
    binding_map = {b.indicator_id: b for b in bindings}

    response = []
    for ind in indicators:
        binding = binding_map.get(ind.id)
        response.append(AvailableIndicatorResponse(
            indicator_id=ind.id,
            name=ind.name,
            type=ind.type,
            status=ind.status,
            is_bound=binding is not None,
            is_enabled=binding.is_enabled if binding else False,
            bot_indicator_id=binding.id if binding else None,
            order=binding.order if binding else 0
        ))
    
    return response

@router.post("/{bot_id}/indicators/{indicator_id}")
def bind_indicator(
    bot_id: str,
    indicator_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Bind an indicator to a bot"""
    # 1. Verify Ownership
    bot = db.query(models.Bot).filter(models.Bot.id == bot_id, models.Bot.user_id == current_user.id).first()
    ind = db.query(models.StrategyPackage).filter(models.StrategyPackage.id == indicator_id, models.StrategyPackage.user_id == current_user.id).first()
    
    if not bot or not ind:
        raise HTTPException(status_code=404, detail="Bot or Indicator not found")

    # 2. Check for existing binding
    existing = db.query(models.BotIndicator).filter(
        models.BotIndicator.bot_id == bot_id,
        models.BotIndicator.indicator_id == indicator_id
    ).first()
    
    if existing:
        return {"message": "Already bound", "bot_indicator_id": existing.id}

    # 2.5. Draft Guard : Prevent binding if status is draft
    if ind.status == 'draft':
        raise HTTPException(status_code=400, detail="Cannot bind a DRAFT indicator. Please verify and change status to Ready first.")

    # 3. Create Binding
    import uuid
    new_binding = models.BotIndicator(
        id=f"bi_{uuid.uuid4().hex[:8]}", # Simple ID generation
        bot_id=bot_id,
        indicator_id=indicator_id,
        is_enabled=True
    )
    db.add(new_binding)
    
    # 4. Audit Log
    audit_log = models.AuditLog(
        action="bind_indicator",
        target_table="bot_indicators",
        target_id=indicator_id, # Linking to indicator
        old_value=None,
        new_value={"bot_id": bot_id},
        performed_by=current_user.username,
        performed_at=datetime.utcnow()
    )
    db.add(audit_log)

    db.commit()
    return {"message": "Indicator bound successfully", "bot_indicator_id": new_binding.id}

@router.delete("/{bot_id}/indicators/{indicator_id}")
def unbind_indicator(
    bot_id: str,
    indicator_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Unbind an indicator"""
    # 1. Verify Ownership (Implicit via query filters)
    bot = db.query(models.Bot).filter(models.Bot.id == bot_id, models.Bot.user_id == current_user.id).first()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")

    binding = db.query(models.BotIndicator).filter(
        models.BotIndicator.bot_id == bot_id,
        models.BotIndicator.indicator_id == indicator_id
    ).first()

    if not binding:
        raise HTTPException(status_code=404, detail="Binding not found")

    db.delete(binding)
    
    # Audit Log
    audit_log = models.AuditLog(
        action="unbind_indicator",
        target_table="bot_indicators",
        target_id=indicator_id,
        old_value={"bot_id": bot_id},
        new_value=None,
        performed_by=current_user.username,
        performed_at=datetime.utcnow()
    )
    db.add(audit_log)
    
    db.commit()
    return {"message": "Indicator unbound successfully"}

@router.get("/{bot_id}/active-indicators")
def get_active_indicators(
    bot_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get active indicators for Flow Engine"""
    # Join BotIndicator with StrategyPackage to filter by both binding.is_enabled AND indicator.status
    results = db.query(models.StrategyPackage).join(
        models.BotIndicator, models.StrategyPackage.id == models.BotIndicator.indicator_id
    ).filter(
        models.BotIndicator.bot_id == bot_id,
        models.BotIndicator.is_enabled == True,
        models.StrategyPackage.status.in_(['ready', 'active']) 
    ).all()
    
    return results

@router.post("", response_model=BotResponse)
def create_bot(
    bot: BotCreate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    db_bot = models.Bot(
        id=bot.id,
        name=bot.name,
        status=bot.status,
        configuration=bot.configuration.dict(),
        user_id=current_user.id
    )
    db.add(db_bot)
    db.commit()
    db.refresh(db_bot)
    return format_bot_response(db_bot)

@router.get("/{bot_id}", response_model=BotResponse)
def get_bot(bot_id: str, db: Session = Depends(get_db)):
    bot = db.query(models.Bot).filter(models.Bot.id == bot_id).first()
    if bot is None:
        raise HTTPException(status_code=404, detail="Bot not found")
    return format_bot_response(bot)

@router.put("/{bot_id}")
def update_bot(bot_id: str, config: BotConfigSchema, db: Session = Depends(get_db)):
    bot = db.query(models.Bot).filter(models.Bot.id == bot_id).first()
    if bot is None:
        raise HTTPException(status_code=404, detail="Bot not found")
    
    # SAFETY LOCK: If bot is running, do not allow config changes
    if bot.status == "running":
         raise HTTPException(status_code=403, detail="Cannot modify configuration while bot is running")

    bot.configuration = config.dict()
    db.commit()
    return format_bot_response(bot)

@router.put("/{bot_id}/activate")
def activate_bot(bot_id: str, status: str, db: Session = Depends(get_db)):
    bot = db.query(models.Bot).filter(models.Bot.id == bot_id).first()
    if bot is None:
        raise HTTPException(status_code=404, detail="Bot not found")
    
    bot.status = status
    db.commit()
    return format_bot_response(bot)
