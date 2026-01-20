"""
Portfolio API Router
"""
from typing import List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core import get_db, get_current_user
from app.models import Trade, BotProfile

router = APIRouter()


class PortfolioOverview(BaseModel):
    balance: float
    equity: float
    margin_used: float
    free_margin: float
    daily_pnl: float
    daily_pnl_percent: float
    total_pnl: float


class EquityPoint(BaseModel):
    timestamp: datetime
    equity: float


class BotPerformance(BaseModel):
    bot_id: int
    bot_name: str
    total_trades: int
    win_rate: float
    profit: float
    roi: float
    is_active: bool


class ExposureInfo(BaseModel):
    symbol: str
    direction: str  # long/short
    lots: float
    current_pnl: float


@router.get("/overview", response_model=PortfolioOverview)
async def get_portfolio_overview(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get portfolio overview - Balance, Equity, P/L"""
    # In real implementation, this would fetch from MT5
    # For now, return mock data
    trades = db.query(Trade).filter(Trade.status == "closed").all()
    total_pnl = sum(t.profit or 0 for t in trades)
    
    # Calculate daily P/L
    today = datetime.utcnow().date()
    today_trades = [t for t in trades if t.closed_at and t.closed_at.date() == today]
    daily_pnl = sum(t.profit or 0 for t in today_trades)
    
    # Mock balance (would come from MT5)
    initial_balance = 10000.0
    balance = initial_balance + total_pnl
    
    return PortfolioOverview(
        balance=round(balance, 2),
        equity=round(balance, 2),  # Equity = Balance when no open trades
        margin_used=0.0,
        free_margin=round(balance, 2),
        daily_pnl=round(daily_pnl, 2),
        daily_pnl_percent=round((daily_pnl / initial_balance) * 100, 2) if initial_balance else 0,
        total_pnl=round(total_pnl, 2)
    )


@router.get("/equity-curve", response_model=List[EquityPoint])
async def get_equity_curve(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get equity curve data for charting"""
    # In real implementation, this would be calculated from trade history
    # For now, return mock data
    points = []
    start_equity = 10000.0
    current = start_equity
    
    for i in range(days):
        date = datetime.utcnow() - timedelta(days=days - i)
        # Random walk simulation for demo
        import random
        change = random.uniform(-100, 150)
        current += change
        points.append(EquityPoint(timestamp=date, equity=round(current, 2)))
    
    return points


@router.get("/performance", response_model=List[BotPerformance])
async def get_bot_performance(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get performance metrics per bot"""
    bots = db.query(BotProfile).all()
    results = []
    
    for bot in bots:
        bot_trades = db.query(Trade).filter(
            Trade.bot_profile_id == bot.id,
            Trade.status == "closed"
        ).all()
        
        total_trades = len(bot_trades)
        if total_trades > 0:
            winning = len([t for t in bot_trades if (t.profit or 0) > 0])
            win_rate = (winning / total_trades) * 100
            profit = sum(t.profit or 0 for t in bot_trades)
            roi = (profit / 10000) * 100  # Assuming 10000 initial
        else:
            win_rate = 0
            profit = 0
            roi = 0
        
        results.append(BotPerformance(
            bot_id=bot.id,
            bot_name=bot.name,
            total_trades=total_trades,
            win_rate=round(win_rate, 2),
            profit=round(profit, 2),
            roi=round(roi, 2),
            is_active=bot.is_active
        ))
    
    return results


@router.get("/exposure", response_model=List[ExposureInfo])
async def get_current_exposure(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get current market exposure"""
    open_trades = db.query(Trade).filter(Trade.status == "open").all()
    
    # Group by symbol
    exposure_map = {}
    for trade in open_trades:
        if trade.symbol not in exposure_map:
            exposure_map[trade.symbol] = {"long": 0, "short": 0, "pnl": 0}
        
        if trade.trade_type == "buy":
            exposure_map[trade.symbol]["long"] += trade.lot_size
        else:
            exposure_map[trade.symbol]["short"] += trade.lot_size
        
        exposure_map[trade.symbol]["pnl"] += trade.profit or 0
    
    results = []
    for symbol, data in exposure_map.items():
        net_lots = data["long"] - data["short"]
        direction = "long" if net_lots > 0 else "short" if net_lots < 0 else "neutral"
        results.append(ExposureInfo(
            symbol=symbol,
            direction=direction,
            lots=abs(net_lots),
            current_pnl=round(data["pnl"], 2)
        ))
    
    return results
