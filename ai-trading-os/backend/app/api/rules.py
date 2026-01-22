from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List
from .. import models
from ..core.database import get_db
from pydantic import BaseModel

router = APIRouter(tags=["rules"])

# Pydantic Schemas
class RuleBase(BaseModel):
    indicator_id: str
    operator: str
    value: float
    action: str
    is_enabled: bool = True

class RuleCreate(RuleBase):
    pass

class RuleResponse(RuleBase):
    id: int
    bot_id: str

    class Config:
        orm_mode = True

# Batch Update Rules for a Bot
@router.post("/batch", response_model=List[RuleResponse])
def batch_update_rules(
    bot_id: str = Body(..., embed=True), 
    rules: List[RuleCreate] = Body(..., embed=True), 
    db: Session = Depends(get_db)
):
    # 1. Fetch Bot to check existence and status
    bot = db.query(models.Bot).filter(models.Bot.id == bot_id).first()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    
    # 2. SAFETY LOCK: Check if bot is running or paused
    if bot.status in ["running", "paused"]:
        raise HTTPException(
            status_code=403, 
            detail="Cannot modify rules while bot is running or paused. Please stop the bot first."
        )

    # 3. Delete existing rules for this bot (Replace strategy)
    db.query(models.BotRule).filter(models.BotRule.bot_id == bot_id).delete()
    
    # 4. Create new rules
    new_rules = []
    for r in rules:
        db_rule = models.BotRule(
            bot_id=bot_id,
            indicator_id=r.indicator_id,
            operator=r.operator,
            value=r.value,
            action=r.action,
            is_enabled=r.is_enabled
        )
        db.add(db_rule)
        new_rules.append(db_rule)
    
    db.commit()
    
    # Refresh to get IDs
    for r in new_rules:
        db.refresh(r)
        
    return new_rules

@router.get("/{bot_id}", response_model=List[RuleResponse])
def get_bot_rules(bot_id: str, db: Session = Depends(get_db)):
    rules = db.query(models.BotRule).filter(models.BotRule.bot_id == bot_id).all()
    return rules
