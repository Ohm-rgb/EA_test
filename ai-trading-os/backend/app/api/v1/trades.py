"""
Trading API Router
"""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core import get_db, get_current_user
from app.models import Trade

router = APIRouter()


class TradeResponse(BaseModel):
    id: int
    ticket_number: Optional[str]
    symbol: str
    trade_type: str
    lot_size: float
    open_price: float
    close_price: Optional[float]
    stop_loss: Optional[float]
    take_profit: Optional[float]
    profit: Optional[float]
    status: str
    source_indicator_id: Optional[str]  # For context-filtered backtest
    opened_at: datetime
    closed_at: Optional[datetime]

    class Config:
        from_attributes = True


class TradeStats(BaseModel):
    total_trades: int
    open_trades: int
    closed_trades: int
    total_profit: float
    win_rate: float
    avg_profit: float


@router.get("/", response_model=List[TradeResponse])
async def list_trades(
    status: Optional[str] = Query(None, description="Filter by status: open/closed"),
    symbol: Optional[str] = Query(None, description="Filter by symbol"),
    source_indicator_id: Optional[str] = Query(None, description="Filter by source indicator (for backtest context)"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """List trades with optional filters (context-aware for backtest)"""
    query = db.query(Trade)
    
    if status:
        query = query.filter(Trade.status == status)
    if symbol:
        query = query.filter(Trade.symbol == symbol)
    if source_indicator_id:
        query = query.filter(Trade.source_indicator_id == source_indicator_id)
    
    trades = query.order_by(Trade.opened_at.desc()).limit(limit).all()
    return trades


@router.get("/stats", response_model=TradeStats)
async def get_trade_stats(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get trading statistics"""
    all_trades = db.query(Trade).all()
    closed_trades = [t for t in all_trades if t.status == "closed"]
    
    total_profit = sum(t.profit or 0 for t in closed_trades)
    winning_trades = len([t for t in closed_trades if (t.profit or 0) > 0])
    win_rate = (winning_trades / len(closed_trades) * 100) if closed_trades else 0
    avg_profit = total_profit / len(closed_trades) if closed_trades else 0
    
    return TradeStats(
        total_trades=len(all_trades),
        open_trades=len([t for t in all_trades if t.status == "open"]),
        closed_trades=len(closed_trades),
        total_profit=total_profit,
        win_rate=round(win_rate, 2),
        avg_profit=round(avg_profit, 2)
    )


@router.get("/{trade_id}", response_model=TradeResponse)
async def get_trade(
    trade_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get trade by ID"""
    trade = db.query(Trade).filter(Trade.id == trade_id).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    return trade


@router.post("/close-all")
async def close_all_trades(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Emergency close all open trades (Kill Switch)"""
    open_trades = db.query(Trade).filter(Trade.status == "open").all()
    
    closed_count = 0
    for trade in open_trades:
        trade.status = "closed"
        trade.closed_at = datetime.utcnow()
        # In real implementation, this would call MT5 to close the position
        closed_count += 1
    
    db.commit()
    
    return {
        "message": "Emergency close executed",
        "closed_trades": closed_count
    }
