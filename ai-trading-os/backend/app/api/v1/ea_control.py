"""
EA Control API Router
ควบคุม EA Bot ผ่าน API
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.core import get_db, get_current_user
from app.services.ea_controller import EAController, EAStatus
from app.services.ai_strategy_planner import AIStrategyPlanner

router = APIRouter()


class StartTradingRequest(BaseModel):
    daily_target: float = 100


class SetTargetRequest(BaseModel):
    target_usd: float = 100


class EAStatusResponse(BaseModel):
    status: str
    daily_profit: float
    daily_target: float
    target_reached: bool
    total_trades: int
    open_positions: int
    message_th: str


# ============================================
# EA Control Endpoints
# ============================================

@router.post("/{bot_id}/control/start", response_model=EAStatusResponse)
async def start_trading(
    bot_id: str,
    request: StartTradingRequest = StartTradingRequest(),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """เริ่มเทรด"""
    controller = EAController(db)
    
    state = controller.start_trading(
        bot_id=bot_id,
        user_id=current_user.get("user_id", 1),
        daily_target=request.daily_target
    )
    
    return EAStatusResponse(
        status=state.status.value,
        daily_profit=state.daily_profit,
        daily_target=state.daily_target,
        target_reached=state.target_reached,
        total_trades=state.total_trades,
        open_positions=state.open_positions,
        message_th=state.message_th
    )


@router.post("/{bot_id}/control/stop", response_model=EAStatusResponse)
async def stop_trading(
    bot_id: str,
    reason: str = "manual",
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """หยุดเทรด"""
    controller = EAController(db)
    
    state = controller.stop_trading(
        bot_id=bot_id,
        user_id=current_user.get("user_id", 1),
        reason=reason
    )
    
    return EAStatusResponse(
        status=state.status.value,
        daily_profit=state.daily_profit,
        daily_target=state.daily_target,
        target_reached=state.target_reached,
        total_trades=state.total_trades,
        open_positions=state.open_positions,
        message_th=state.message_th
    )


@router.post("/{bot_id}/control/pause", response_model=EAStatusResponse)
async def pause_trading(
    bot_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """พักการเทรดชั่วคราว"""
    controller = EAController(db)
    
    state = controller.pause_trading(
        bot_id=bot_id,
        user_id=current_user.get("user_id", 1)
    )
    
    return EAStatusResponse(
        status=state.status.value,
        daily_profit=state.daily_profit,
        daily_target=state.daily_target,
        target_reached=state.target_reached,
        total_trades=state.total_trades,
        open_positions=state.open_positions,
        message_th=state.message_th
    )


@router.get("/{bot_id}/control/status", response_model=EAStatusResponse)
async def get_ea_status(
    bot_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """ดึงสถานะ EA"""
    controller = EAController(db)
    
    state = controller.get_status(
        bot_id=bot_id,
        user_id=current_user.get("user_id", 1)
    )
    
    return EAStatusResponse(
        status=state.status.value,
        daily_profit=state.daily_profit,
        daily_target=state.daily_target,
        target_reached=state.target_reached,
        total_trades=state.total_trades,
        open_positions=state.open_positions,
        message_th=state.message_th
    )


@router.post("/{bot_id}/control/check-target")
async def check_daily_target(
    bot_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """ตรวจสอบเป้าหมายประจำวัน (และ auto-stop ถ้าถึง)"""
    controller = EAController(db)
    
    result = controller.check_daily_target(
        bot_id=bot_id,
        user_id=current_user.get("user_id", 1)
    )
    
    return result


@router.post("/{bot_id}/control/set-target")
async def set_daily_target(
    bot_id: str,
    request: SetTargetRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """ตั้งเป้าหมายประจำวัน"""
    controller = EAController(db)
    
    result = controller.set_daily_target(
        bot_id=bot_id,
        user_id=current_user.get("user_id", 1),
        target_usd=request.target_usd
    )
    
    return result


@router.post("/{bot_id}/control/close-all")
async def close_all_positions(
    bot_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """ปิดทุก Position"""
    controller = EAController(db)
    
    result = controller.close_all_positions(
        bot_id=bot_id,
        user_id=current_user.get("user_id", 1)
    )
    
    return result


# ============================================
# AI Strategy Endpoints
# ============================================

@router.post("/{bot_id}/ai/generate-plan")
async def generate_trading_plan(
    bot_id: str,
    symbol: str = "XAUUSD",
    daily_target: float = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """AI สร้างแผนเทรดอัตโนมัติ"""
    planner = AIStrategyPlanner(db)
    
    plan = planner.generate_trading_plan(
        bot_id=bot_id,
        user_id=current_user.get("user_id", 1),
        symbol=symbol,
        daily_target=daily_target
    )
    
    return {
        "plan_name": plan.name,
        "indicators": [
            {
                "name": i.name,
                "type": i.indicator_type,
                "params": i.params,
                "reason_th": i.reason_th,
                "confidence": i.confidence
            }
            for i in plan.indicators
        ],
        "entry_rules_th": plan.entry_rules_th,
        "exit_rules_th": plan.exit_rules_th,
        "risk_per_trade": plan.risk_per_trade,
        "daily_target_usd": plan.daily_target_usd,
        "summary_th": plan.summary_th
    }


@router.get("/{bot_id}/ai/analyze-market")
async def analyze_market(
    bot_id: str,
    symbol: str = "XAUUSD",
    timeframe: str = "H1",
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """AI วิเคราะห์สภาพตลาด"""
    planner = AIStrategyPlanner(db)
    
    analysis = planner.analyze_market(symbol, timeframe)
    
    return {
        "condition": analysis.condition.value,
        "trend_strength": analysis.trend_strength,
        "volatility": analysis.volatility,
        "suggested_style": analysis.suggested_style.value,
        "summary_th": analysis.summary_th
    }
