"""
Journal API Router
รายงานและ Journal สำหรับ AI Trading
"""
from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core import get_db, get_current_user
from app.models import TradingJournal, DailyTarget, JournalEntryType
from app.services.ai_reporter import AIReporter

router = APIRouter()


class JournalEntryCreate(BaseModel):
    """สร้าง Journal Entry ใหม่"""
    entry_type: str  # indicator_usage, strategy_plan, trade_result, etc.
    title: str
    content: dict = {}
    profit_usd: float = 0


class JournalEntryResponse(BaseModel):
    id: int
    bot_id: str
    entry_type: str
    title: str
    ai_summary_th: Optional[str]
    profit_usd: float
    created_at: Optional[str]


class DailySummaryResponse(BaseModel):
    date: str
    target_profit_usd: float
    current_profit_usd: float
    progress_percent: float
    target_reached: bool
    auto_stopped: bool
    total_trades: int
    winning_trades: int
    win_rate: float


class UpdateProfitRequest(BaseModel):
    profit_change: float
    is_win: bool = True


@router.get("/{bot_id}/journal", response_model=List[JournalEntryResponse])
async def get_journal_entries(
    bot_id: str,
    limit: int = 20,
    entry_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """ดึงรายการ Journal entries ของ bot"""
    reporter = AIReporter(db)
    
    filter_type = None
    if entry_type:
        try:
            filter_type = JournalEntryType(entry_type)
        except ValueError:
            pass
    
    entries = reporter.get_journal_entries(bot_id, limit, filter_type)
    return entries


@router.post("/{bot_id}/journal", response_model=JournalEntryResponse)
async def create_journal_entry(
    bot_id: str,
    entry: JournalEntryCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """สร้าง Journal Entry ใหม่"""
    reporter = AIReporter(db)
    
    try:
        entry_type = JournalEntryType(entry.entry_type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid entry_type: {entry.entry_type}")
    
    journal_entry = reporter.create_journal_entry(
        bot_id=bot_id,
        user_id=current_user.get("user_id", 1),
        entry_type=entry_type,
        title=entry.title,
        content=entry.content,
        profit_usd=entry.profit_usd
    )
    
    return {
        "id": journal_entry.id,
        "bot_id": journal_entry.bot_id,
        "entry_type": journal_entry.entry_type,
        "title": journal_entry.title,
        "ai_summary_th": journal_entry.ai_summary_th,
        "profit_usd": journal_entry.profit_usd,
        "created_at": journal_entry.created_at.isoformat() if journal_entry.created_at else None
    }


@router.get("/{bot_id}/daily-target", response_model=DailySummaryResponse)
async def get_daily_target(
    bot_id: str,
    target_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """ดึงสรุปเป้าหมายประจำวัน"""
    reporter = AIReporter(db)
    
    date_obj = None
    if target_date:
        try:
            date_obj = date.fromisoformat(target_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    summary = reporter.get_daily_summary(
        bot_id=bot_id,
        user_id=current_user.get("user_id", 1),
        target_date=date_obj
    )
    
    return summary


@router.post("/{bot_id}/daily-target/update-profit")
async def update_daily_profit(
    bot_id: str,
    request: UpdateProfitRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """อัปเดตกำไรประจำวันและตรวจสอบเป้าหมาย"""
    reporter = AIReporter(db)
    
    result = reporter.update_daily_profit(
        bot_id=bot_id,
        user_id=current_user.get("user_id", 1),
        profit_change=request.profit_change,
        is_win=request.is_win
    )
    
    return result


@router.post("/{bot_id}/daily-target/set")
async def set_daily_target(
    bot_id: str,
    target_usd: float = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """ตั้งค่าเป้าหมายประจำวัน"""
    date_str = date.today().strftime("%Y-%m-%d")
    
    daily_target = db.query(DailyTarget).filter(
        DailyTarget.bot_id == bot_id,
        DailyTarget.date == date_str
    ).first()
    
    if not daily_target:
        daily_target = DailyTarget(
            bot_id=bot_id,
            user_id=current_user.get("user_id", 1),
            date=date_str,
            target_profit_usd=target_usd
        )
        db.add(daily_target)
    else:
        daily_target.target_profit_usd = target_usd
    
    db.commit()
    
    return {
        "message_th": f"✅ ตั้งเป้าหมายวันนี้: ${target_usd:.2f}",
        "date": date_str,
        "target_profit_usd": target_usd
    }
