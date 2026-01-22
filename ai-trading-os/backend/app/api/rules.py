from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List
from .. import models
from ..core.database import get_db
from pydantic import BaseModel
import logging

router = APIRouter(tags=["rules"])

# Setup logger for audit
logger = logging.getLogger("rules_audit")
logger.setLevel(logging.INFO)

# Valid actions (Buy/Sell/Close)
VALID_ACTIONS = {"Buy", "Sell", "Close"}

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


def validate_rules(rules: List[RuleCreate], db: Session):
    """
    Validate rules before saving:
    1. Each rule must have a valid action (Buy/Sell/Close)
    2. No floating nodes (indicator_id must exist)
    """
    errors = []
    
    for i, rule in enumerate(rules):
        # Validate action
        if rule.action not in VALID_ACTIONS:
            errors.append(f"Rule {i+1}: Invalid action '{rule.action}'. Must be one of: {', '.join(VALID_ACTIONS)}")
        
        # Validate indicator exists (no floating nodes)
        if rule.indicator_id:
            indicator = db.query(models.StrategyPackage).filter(
                models.StrategyPackage.id == rule.indicator_id
            ).first()
            if not indicator:
                errors.append(f"Rule {i+1}: Indicator '{rule.indicator_id}' not found (floating node)")
    
    # Must have at least one terminal action
    has_terminal = any(r.action in VALID_ACTIONS for r in rules)
    if rules and not has_terminal:
        errors.append("Strategy must have at least one terminal action (Buy/Sell/Close)")
    
    return errors


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
    
    # 3. VALIDATION: Check rules before saving
    validation_errors = validate_rules(rules, db)
    if validation_errors:
        raise HTTPException(
            status_code=422,
            detail={"message": "Rule validation failed", "errors": validation_errors}
        )

    # 4. Delete existing rules for this bot (Batch Replace strategy)
    old_count = db.query(models.BotRule).filter(models.BotRule.bot_id == bot_id).delete()
    
    # 5. Create new rules
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
    
    # 6. AUDIT LOG: rules_updated
    logger.info(
        f"rules_updated | bot_id={bot_id} | deleted={old_count} | created={len(new_rules)} | "
        f"actions={[r.action for r in rules]}"
    )
        
    return new_rules

@router.get("/{bot_id}", response_model=List[RuleResponse])
def get_bot_rules(bot_id: str, db: Session = Depends(get_db)):
    rules = db.query(models.BotRule).filter(models.BotRule.bot_id == bot_id).all()
    return rules

