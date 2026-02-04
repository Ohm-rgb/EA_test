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
    """Get portfolio overview - Balance, Equity, P/L from MT5"""
    from app.services.mt5_service import mt5_service
    
    # Try to get real data from MT5
    account_info = mt5_service.get_account_info()
    
    if account_info:
        # Real MT5 data
        balance = account_info.get("balance", 0)
        equity = account_info.get("equity", 0)
        margin = account_info.get("margin", 0)
        margin_free = account_info.get("margin_free", 0)
        profit = account_info.get("profit", 0)
        
        # Calculate daily P/L from trades
        today = datetime.utcnow().date()
        trades = db.query(Trade).filter(Trade.status == "closed").all()
        today_trades = [t for t in trades if t.closed_at and t.closed_at.date() == today]
        daily_pnl = sum(t.profit or 0 for t in today_trades)
        
        return PortfolioOverview(
            balance=round(balance, 2),
            equity=round(equity, 2),
            margin_used=round(margin, 2),
            free_margin=round(margin_free, 2),
            daily_pnl=round(daily_pnl + profit, 2),  # Include unrealized P/L
            daily_pnl_percent=round(((daily_pnl + profit) / balance) * 100, 2) if balance else 0,
            total_pnl=round(profit, 2)  # Current unrealized P/L
        )
    else:
        # Fallback to mock data if MT5 not connected
        trades = db.query(Trade).filter(Trade.status == "closed").all()
        total_pnl = sum(t.profit or 0 for t in trades)
        
        today = datetime.utcnow().date()
        today_trades = [t for t in trades if t.closed_at and t.closed_at.date() == today]
        daily_pnl = sum(t.profit or 0 for t in today_trades)
        
        initial_balance = 10000.0
        balance = initial_balance + total_pnl
        
        return PortfolioOverview(
            balance=round(balance, 2),
            equity=round(balance, 2),
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
    """Get current market exposure from MT5"""
    from app.services.mt5_service import mt5_service
    
    # Try to get real positions from MT5
    mt5_positions = mt5_service.get_positions()
    
    if mt5_positions:
        # Group by symbol
        exposure_map = {}
        for pos in mt5_positions:
            symbol = pos.get("symbol", "UNKNOWN")
            if symbol not in exposure_map:
                exposure_map[symbol] = {"long": 0, "short": 0, "pnl": 0}
            
            if pos.get("type") == "buy":
                exposure_map[symbol]["long"] += pos.get("volume", 0)
            else:
                exposure_map[symbol]["short"] += pos.get("volume", 0)
            
            exposure_map[symbol]["pnl"] += pos.get("profit", 0)
        
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
    else:
        # Fallback to database
        open_trades = db.query(Trade).filter(Trade.status == "open").all()
        
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


@router.get("/positions")
async def get_mt5_positions(
    current_user: dict = Depends(get_current_user)
):
    """Get open positions directly from MT5"""
    from app.services.mt5_service import mt5_service
    
    positions = mt5_service.get_positions()
    
    return {
        "connected": mt5_service.is_connected,
        "positions": positions,
        "total_positions": len(positions)
    }
