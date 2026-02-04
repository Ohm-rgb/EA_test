"""
EA Controller - ควบคุม EA Bot และ Auto-stop
"""
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, date
from dataclasses import dataclass
from enum import Enum
from sqlalchemy.orm import Session

from app.services.mt5_service import mt5_service
from app.models import DailyTarget, TradingJournal, JournalEntryType

logger = logging.getLogger(__name__)


class EAStatus(str, Enum):
    """สถานะของ EA"""
    STOPPED = "stopped"
    RUNNING = "running"
    PAUSED = "paused"
    TARGET_REACHED = "target_reached"
    ERROR = "error"


@dataclass
class EAState:
    """สถานะปัจจุบันของ EA"""
    status: EAStatus
    daily_profit: float
    daily_target: float
    target_reached: bool
    total_trades: int
    open_positions: int
    message_th: str


class EAController:
    """
    EA Controller - ควบคุมการทำงานของ EA Bot
    
    Features:
    - Start/Stop/Pause trading
    - Monitor daily profit
    - Auto-stop when target reached ($100)
    - Close all positions
    """
    
    def __init__(self, db: Session = None):
        self.db = db
        self._running_bots: Dict[str, bool] = {}  # bot_id -> is_running
    
    # ============================================
    # EA Control Commands
    # ============================================
    
    def start_trading(
        self,
        bot_id: str,
        user_id: int,
        daily_target: float = 100
    ) -> EAState:
        """เริ่มเทรด"""
        
        # Initialize daily target
        self._ensure_daily_target(bot_id, user_id, daily_target)
        
        # Check if MT5 is connected
        if not mt5_service.is_connected:
            return EAState(
                status=EAStatus.ERROR,
                daily_profit=0,
                daily_target=daily_target,
                target_reached=False,
                total_trades=0,
                open_positions=0,
                message_th="❌ ไม่สามารถเชื่อมต่อ MT5 กรุณาตรวจสอบการเชื่อมต่อ"
            )
        
        # Check if already reached target
        target = self._get_daily_target(bot_id)
        if target and target.target_reached:
            return EAState(
                status=EAStatus.TARGET_REACHED,
                daily_profit=target.current_profit_usd,
                daily_target=target.target_profit_usd,
                target_reached=True,
                total_trades=target.total_trades,
                open_positions=len(mt5_service.get_positions()),
                message_th=f"🎯 ถึงเป้าหมาย ${target.target_profit_usd} แล้ววันนี้! หยุดเทรดอัตโนมัติ"
            )
        
        # Start trading
        self._running_bots[bot_id] = True
        
        # Log to journal
        self._log_action(bot_id, user_id, "start", f"เริ่มเทรดด้วยเป้าหมาย ${daily_target}")
        
        positions = mt5_service.get_positions()
        current_profit = target.current_profit_usd if target else 0
        
        return EAState(
            status=EAStatus.RUNNING,
            daily_profit=current_profit,
            daily_target=daily_target,
            target_reached=False,
            total_trades=target.total_trades if target else 0,
            open_positions=len(positions),
            message_th=f"✅ เริ่มเทรดแล้ว! เป้าหมาย: ${daily_target}"
        )
    
    def stop_trading(
        self,
        bot_id: str,
        user_id: int,
        reason: str = "manual"
    ) -> EAState:
        """หยุดเทรด"""
        
        self._running_bots[bot_id] = False
        
        target = self._get_daily_target(bot_id)
        positions = mt5_service.get_positions() if mt5_service.is_connected else []
        
        # Log to journal
        self._log_action(bot_id, user_id, "stop", f"หยุดเทรด - เหตุผล: {reason}")
        
        return EAState(
            status=EAStatus.STOPPED,
            daily_profit=target.current_profit_usd if target else 0,
            daily_target=target.target_profit_usd if target else 100,
            target_reached=target.target_reached if target else False,
            total_trades=target.total_trades if target else 0,
            open_positions=len(positions),
            message_th=f"⏹️ หยุดเทรดแล้ว ({reason})"
        )
    
    def pause_trading(
        self,
        bot_id: str,
        user_id: int
    ) -> EAState:
        """พักการเทรดชั่วคราว"""
        
        self._running_bots[bot_id] = False
        
        target = self._get_daily_target(bot_id)
        
        self._log_action(bot_id, user_id, "pause", "พักการเทรดชั่วคราว")
        
        return EAState(
            status=EAStatus.PAUSED,
            daily_profit=target.current_profit_usd if target else 0,
            daily_target=target.target_profit_usd if target else 100,
            target_reached=False,
            total_trades=target.total_trades if target else 0,
            open_positions=len(mt5_service.get_positions()) if mt5_service.is_connected else 0,
            message_th="⏸️ พักการเทรดชั่วคราว"
        )
    
    # ============================================
    # Daily Target & Auto-stop
    # ============================================
    
    def check_daily_target(
        self,
        bot_id: str,
        user_id: int
    ) -> Dict[str, Any]:
        """ตรวจสอบเป้าหมายประจำวัน และ auto-stop ถ้าถึง"""
        
        # Get current profit from MT5
        account_info = mt5_service.get_account_info()
        if not account_info:
            return {"error": "ไม่สามารถดึงข้อมูลบัญชีจาก MT5"}
        
        current_profit = account_info.get("profit", 0)
        
        # Get daily target
        target = self._get_daily_target(bot_id)
        if not target:
            target = self._ensure_daily_target(bot_id, user_id, 100)
        
        # Update current profit
        target.current_profit_usd = current_profit
        
        # Check if target reached
        should_stop = False
        if current_profit >= target.target_profit_usd and not target.target_reached:
            target.target_reached = True
            target.reached_at = datetime.utcnow()
            target.auto_stopped = True
            should_stop = True
            
            # Auto-stop trading
            self._running_bots[bot_id] = False
            
            # Log achievement
            self._log_action(
                bot_id, user_id, "target_reached",
                f"🎉 ถึงเป้าหมาย ${target.target_profit_usd}! หยุดเทรดอัตโนมัติ"
            )
        
        if self.db:
            self.db.commit()
        
        progress = (current_profit / target.target_profit_usd * 100) if target.target_profit_usd > 0 else 0
        
        return {
            "current_profit_usd": current_profit,
            "target_profit_usd": target.target_profit_usd,
            "progress_percent": min(progress, 100),
            "target_reached": target.target_reached,
            "auto_stopped": should_stop,
            "is_running": self._running_bots.get(bot_id, False),
            "message_th": f"{'🎯 ถึงเป้าหมายแล้ว! หยุดเทรดอัตโนมัติ' if should_stop else f'💰 กำไร: ${current_profit:.2f} / ${target.target_profit_usd:.2f} ({progress:.1f}%)'}"
        }
    
    def set_daily_target(
        self,
        bot_id: str,
        user_id: int,
        target_usd: float
    ) -> Dict[str, Any]:
        """ตั้งเป้าหมายประจำวัน"""
        
        target = self._ensure_daily_target(bot_id, user_id, target_usd)
        target.target_profit_usd = target_usd
        
        if self.db:
            self.db.commit()
        
        return {
            "message_th": f"✅ ตั้งเป้าหมายวันนี้: ${target_usd:.2f}",
            "target_profit_usd": target_usd
        }
    
    # ============================================
    # Position Management
    # ============================================
    
    def close_all_positions(
        self,
        bot_id: str,
        user_id: int
    ) -> Dict[str, Any]:
        """ปิดทุก Position"""
        
        if not mt5_service.is_connected:
            return {"error": "ไม่สามารถเชื่อมต่อ MT5"}
        
        positions = mt5_service.get_positions()
        
        # TODO: Implement actual closing via MT5 API
        # For now, just log the action
        
        self._log_action(
            bot_id, user_id, "close_all",
            f"สั่งปิดทุก Position ({len(positions)} รายการ)"
        )
        
        return {
            "message_th": f"📤 สั่งปิดทุก Position ({len(positions)} รายการ)",
            "positions_closed": len(positions),
            "note": "กรุณาตรวจสอบใน MT5 Terminal"
        }
    
    def get_open_positions(self) -> List[Dict[str, Any]]:
        """ดึง Open Positions"""
        
        if not mt5_service.is_connected:
            return []
        
        return mt5_service.get_positions()
    
    # ============================================
    # Status
    # ============================================
    
    def get_status(
        self,
        bot_id: str,
        user_id: int
    ) -> EAState:
        """ดึงสถานะปัจจุบัน"""
        
        is_running = self._running_bots.get(bot_id, False)
        target = self._get_daily_target(bot_id)
        positions = mt5_service.get_positions() if mt5_service.is_connected else []
        
        if target and target.target_reached:
            status = EAStatus.TARGET_REACHED
            message = f"🎯 ถึงเป้าหมาย ${target.target_profit_usd} แล้ว!"
        elif is_running:
            status = EAStatus.RUNNING
            message = f"🟢 กำลังเทรด... กำไร: ${target.current_profit_usd if target else 0:.2f}"
        else:
            status = EAStatus.STOPPED
            message = "⏹️ หยุดอยู่"
        
        return EAState(
            status=status,
            daily_profit=target.current_profit_usd if target else 0,
            daily_target=target.target_profit_usd if target else 100,
            target_reached=target.target_reached if target else False,
            total_trades=target.total_trades if target else 0,
            open_positions=len(positions),
            message_th=message
        )
    
    # ============================================
    # Internal Helpers
    # ============================================
    
    def _ensure_daily_target(
        self,
        bot_id: str,
        user_id: int,
        target_usd: float
    ) -> Optional[DailyTarget]:
        """สร้าง/ดึง DailyTarget"""
        
        if not self.db:
            return None
        
        date_str = date.today().strftime("%Y-%m-%d")
        
        target = self.db.query(DailyTarget).filter(
            DailyTarget.bot_id == bot_id,
            DailyTarget.date == date_str
        ).first()
        
        if not target:
            target = DailyTarget(
                bot_id=bot_id,
                user_id=user_id,
                date=date_str,
                target_profit_usd=target_usd
            )
            self.db.add(target)
            self.db.commit()
            self.db.refresh(target)
        
        return target
    
    def _get_daily_target(self, bot_id: str) -> Optional[DailyTarget]:
        """ดึง DailyTarget วันนี้"""
        
        if not self.db:
            return None
        
        date_str = date.today().strftime("%Y-%m-%d")
        
        return self.db.query(DailyTarget).filter(
            DailyTarget.bot_id == bot_id,
            DailyTarget.date == date_str
        ).first()
    
    def _log_action(
        self,
        bot_id: str,
        user_id: int,
        action: str,
        detail: str
    ):
        """บันทึก action ลง Journal"""
        
        if not self.db:
            return
        
        entry = TradingJournal(
            bot_id=bot_id,
            user_id=user_id,
            entry_type=JournalEntryType.AI_ANALYSIS.value,
            title=f"EA Control: {action}",
            content={"action": action, "detail": detail},
            ai_summary_th=detail
        )
        
        self.db.add(entry)
        self.db.commit()


# Singleton instance
ea_controller = EAController()
