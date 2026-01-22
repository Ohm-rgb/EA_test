from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models
from ..core.database import get_db
from pydantic import BaseModel

router = APIRouter(tags=["bots"])

# Pydantic Schemas
class BotConfigSchema(BaseModel):
    personality: str
    riskPerTrade: float
    maxDailyTrades: int
    stopOnLoss: int
    timeframe: str

class BotBase(BaseModel):
    name: str
    status: str
    configuration: BotConfigSchema

class BotCreate(BotBase):
    id: str

class BotResponse(BotBase):
    id: str
    boundIndicators: List[str] = []

    class Config:
        orm_mode = True

# Helper to format response
def format_bot_response(bot):
    return {
        "id": bot.id,
        "name": bot.name,
        "status": bot.status,
        "configuration": bot.configuration,
        "boundIndicators": [ind.id for ind in bot.indicators]
    }

@router.get("", response_model=List[BotResponse])
def get_bots(db: Session = Depends(get_db)):
    bots = db.query(models.Bot).all()
    return [format_bot_response(b) for b in bots]

@router.post("", response_model=BotResponse)
def create_bot(bot: BotCreate, db: Session = Depends(get_db)):
    db_bot = models.Bot(
        id=bot.id,
        name=bot.name,
        status=bot.status,
        configuration=bot.configuration.dict()
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
