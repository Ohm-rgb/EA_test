from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core import get_current_user # Added import

# ...

@router.get("", response_model=List[IndicatorResponse])
def get_indicators(
    bot_id: Optional[str] = None, 
    status: Optional[str] = None, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    query = db.query(models.StrategyPackage).filter(models.StrategyPackage.user_id == current_user.id)
    if bot_id:
        query = query.filter(models.StrategyPackage.bot_id == bot_id)
    if status:
        query = query.filter(models.StrategyPackage.status == status)
    return query.all()

@router.post("", response_model=IndicatorResponse)
def create_indicator(
    ind: IndicatorCreate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    db_ind = models.StrategyPackage(
        id=ind.id,
        name=ind.name,
        type=ind.type,
        source=ind.source,
        period=ind.period,
        params=ind.params,
        status=ind.status,
        bot_id=ind.bot_id,
        user_id=current_user.id
    )
    db.add(db_ind)
    db.commit()
    db.refresh(db_ind)
    return db_ind

@router.put("/{ind_id}/status")
def update_indicator_status(ind_id: str, status: str, db: Session = Depends(get_db)):
    ind = db.query(models.StrategyPackage).filter(models.StrategyPackage.id == ind_id).first()
    if not ind:
        raise HTTPException(status_code=404, detail="Indicator not found")
    
    # Validation: Cannot activate if not ready? (Optional logic here)
    old_status = ind.status
    ind.status = status
    
    # Audit Log
    audit_log = models.AuditLog(
        action="update_status",
        target_table="indicators",
        target_id=str(ind.id),
        old_value={"status": old_status},
        new_value={"status": status},
        performed_by="system_dev", # Placeholder until Auth is restored
        performed_at=datetime.utcnow()
    )
    db.add(audit_log)

    db.commit()
    return ind

class IndicatorConfigUpdate(BaseModel):
    config: dict
    context: Optional[dict] = None

import hashlib
import json

def generate_config_hash(config: dict) -> str:
    """Generate SHA256 hash of config for version tracking"""
    config_str = json.dumps(config, sort_keys=True)
    return hashlib.sha256(config_str.encode()).hexdigest()[:16]

@router.patch("/{ind_id}/config")
def update_indicator_config(ind_id: str, payload: IndicatorConfigUpdate, db: Session = Depends(get_db)):
    # 1. Fetch Indicator with Bot relationship
    ind = db.query(models.StrategyPackage).filter(models.StrategyPackage.id == ind_id).first()
    if not ind:
        raise HTTPException(status_code=404, detail="Indicator not found")
    
    # 2. Guard: Check Bound Bot Status
    if ind.bot_id:
        bot = db.query(models.Bot).filter(models.Bot.id == ind.bot_id).first()
        if bot and bot.status == "running":
             raise HTTPException(
                status_code=409, 
                detail=f"Cannot update indicator '{ind.name}': Bound bot '{bot.name}' is currently RUNNING."
            )

    # 3. Store old hash for comparison
    old_hash = ind.config_hash
    
    # 4. Update Configuration
    ind.params = payload.config
    
    # 5. Generate new config hash
    new_hash = generate_config_hash(payload.config)
    ind.config_hash = new_hash
    
    # Note: updated_at is handled by SQLAlchemy onupdate
    
    db.commit()
    db.refresh(ind)
    
    # 6. Return with invalidation flag
    return {
        "indicator": ind,
        "config_hash": new_hash,
        "config_changed": old_hash != new_hash,
        "message": "Config updated. Backtest cache should be invalidated." if old_hash != new_hash else "No change detected."
    }
