"""
AI Reporter Service - สรุปผลการเทรดเป็นภาษาไทย
"""
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, date
from sqlalchemy.orm import Session

from app.models import TradingJournal, DailyTarget, AIRecommendation, JournalEntryType

logger = logging.getLogger(__name__)


class AIReporter:
    """
    AI Reporter - สร้างรายงานและสรุปผลเป็นภาษาไทย
    """
    
    def __init__(self, db: Session = None):
        self.db = db
    
    def create_journal_entry(
        self,
        bot_id: str,
        user_id: int,
        entry_type: JournalEntryType,
        title: str,
        content: Dict[str, Any],
        profit_usd: float = 0
    ) -> TradingJournal:
        """สร้าง Journal Entry ใหม่พร้อมสรุป AI"""
        
        # Generate AI summary in Thai
        ai_summary = self._generate_thai_summary(entry_type, title, content, profit_usd)
        
        entry = TradingJournal(
            bot_id=bot_id,
            user_id=user_id,
            entry_type=entry_type.value,
            title=title,
            content=content,
            ai_summary_th=ai_summary,
            profit_usd=profit_usd
        )
        
        if self.db:
            self.db.add(entry)
            self.db.commit()
            self.db.refresh(entry)
        
        return entry
    
    def _generate_thai_summary(
        self,
        entry_type: JournalEntryType,
        title: str,
        content: Dict[str, Any],
        profit_usd: float
    ) -> str:
        """สร้างสรุปเป็นภาษาไทย"""
        
        if entry_type == JournalEntryType.INDICATOR_USAGE:
            indicator_name = content.get("indicator", "Unknown")
            params = content.get("params", {})
            result = content.get("result", "")
            return f"📊 ใช้งาน {indicator_name}\n" \
                   f"การตั้งค่า: {params}\n" \
                   f"ผลลัพธ์: {result}"
        
        elif entry_type == JournalEntryType.STRATEGY_PLAN:
            strategy = content.get("strategy", "")
            indicators = content.get("indicators", [])
            return f"📋 แผนกลยุทธ์: {strategy}\n" \
                   f"Indicators ที่ใช้: {', '.join(indicators)}"
        
        elif entry_type == JournalEntryType.TRADE_RESULT:
            symbol = content.get("symbol", "Unknown")
            trade_type = content.get("type", "")
            profit_loss = "กำไร" if profit_usd >= 0 else "ขาดทุน"
            return f"💰 ผลการเทรด {symbol}\n" \
                   f"ประเภท: {trade_type}\n" \
                   f"ผลลัพธ์: {profit_loss} ${abs(profit_usd):.2f}"
        
        elif entry_type == JournalEntryType.AI_ANALYSIS:
            analysis = content.get("analysis", "")
            recommendation = content.get("recommendation", "")
            return f"🤖 การวิเคราะห์ของ AI\n" \
                   f"{analysis}\n" \
                   f"คำแนะนำ: {recommendation}"
        
        elif entry_type == JournalEntryType.PARAMETER_TEST:
            indicator = content.get("indicator", "Unknown")
            old_params = content.get("old_params", {})
            new_params = content.get("new_params", {})
            improvement = content.get("improvement", 0)
            return f"🔧 ทดสอบ parameters สำหรับ {indicator}\n" \
                   f"ค่าเดิม: {old_params}\n" \
                   f"ค่าใหม่: {new_params}\n" \
                   f"ผลลัพธ์: {'ดีขึ้น' if improvement > 0 else 'แย่ลง'} {abs(improvement):.1f}%"
        
        elif entry_type == JournalEntryType.DAILY_SUMMARY:
            total_trades = content.get("total_trades", 0)
            win_rate = content.get("win_rate", 0)
            target_reached = content.get("target_reached", False)
            return f"📅 สรุปประจำวัน\n" \
                   f"จำนวนเทรด: {total_trades}\n" \
                   f"อัตราชนะ: {win_rate:.1f}%\n" \
                   f"กำไรสุทธิ: ${profit_usd:.2f}\n" \
                   f"เป้าหมาย: {'✅ ถึงแล้ว!' if target_reached else '⏳ ยังไม่ถึง'}"
        
        return f"📝 {title}"
    
    def get_daily_summary(
        self,
        bot_id: str,
        user_id: int,
        target_date: date = None
    ) -> Dict[str, Any]:
        """ดึงสรุปประจำวัน"""
        if target_date is None:
            target_date = date.today()
        
        date_str = target_date.strftime("%Y-%m-%d")
        
        if not self.db:
            return {}
        
        # Get or create daily target
        daily_target = self.db.query(DailyTarget).filter(
            DailyTarget.bot_id == bot_id,
            DailyTarget.date == date_str
        ).first()
        
        if not daily_target:
            daily_target = DailyTarget(
                bot_id=bot_id,
                user_id=user_id,
                date=date_str,
                target_profit_usd=100
            )
            self.db.add(daily_target)
            self.db.commit()
            self.db.refresh(daily_target)
        
        return {
            "date": date_str,
            "target_profit_usd": daily_target.target_profit_usd,
            "current_profit_usd": daily_target.current_profit_usd,
            "progress_percent": min(
                (daily_target.current_profit_usd / daily_target.target_profit_usd) * 100, 
                100
            ) if daily_target.target_profit_usd > 0 else 0,
            "target_reached": daily_target.target_reached,
            "auto_stopped": daily_target.auto_stopped,
            "total_trades": daily_target.total_trades,
            "winning_trades": daily_target.winning_trades,
            "win_rate": (daily_target.winning_trades / daily_target.total_trades * 100) 
                        if daily_target.total_trades > 0 else 0
        }
    
    def update_daily_profit(
        self,
        bot_id: str,
        user_id: int,
        profit_change: float,
        is_win: bool = True
    ) -> Dict[str, Any]:
        """อัปเดตกำไรประจำวันและตรวจสอบเป้าหมาย"""
        date_str = date.today().strftime("%Y-%m-%d")
        
        if not self.db:
            return {"error": "No database connection"}
        
        daily_target = self.db.query(DailyTarget).filter(
            DailyTarget.bot_id == bot_id,
            DailyTarget.date == date_str
        ).first()
        
        if not daily_target:
            daily_target = DailyTarget(
                bot_id=bot_id,
                user_id=user_id,
                date=date_str,
                target_profit_usd=100
            )
            self.db.add(daily_target)
        
        # Update stats
        daily_target.current_profit_usd += profit_change
        daily_target.total_trades += 1
        if is_win:
            daily_target.winning_trades += 1
        
        # Check if target reached
        should_stop = False
        if daily_target.current_profit_usd >= daily_target.target_profit_usd:
            if not daily_target.target_reached:
                daily_target.target_reached = True
                daily_target.reached_at = datetime.utcnow()
                should_stop = True
        
        self.db.commit()
        self.db.refresh(daily_target)
        
        return {
            "current_profit_usd": daily_target.current_profit_usd,
            "target_profit_usd": daily_target.target_profit_usd,
            "target_reached": daily_target.target_reached,
            "should_stop": should_stop,
            "message_th": f"💰 กำไรปัจจุบัน: ${daily_target.current_profit_usd:.2f} / ${daily_target.target_profit_usd:.2f}" + 
                          ("\n✅ ถึงเป้าหมายแล้ว! หยุดเทรดอัตโนมัติ" if should_stop else "")
        }
    
    def get_journal_entries(
        self,
        bot_id: str,
        limit: int = 20,
        entry_type: JournalEntryType = None
    ) -> List[Dict[str, Any]]:
        """ดึงรายการ journal entries"""
        if not self.db:
            return []
        
        query = self.db.query(TradingJournal).filter(
            TradingJournal.bot_id == bot_id
        )
        
        if entry_type:
            query = query.filter(TradingJournal.entry_type == entry_type.value)
        
        entries = query.order_by(TradingJournal.created_at.desc()).limit(limit).all()
        
        return [
            {
                "id": e.id,
                "entry_type": e.entry_type,
                "title": e.title,
                "ai_summary_th": e.ai_summary_th,
                "profit_usd": e.profit_usd,
                "created_at": e.created_at.isoformat() if e.created_at else None
            }
            for e in entries
        ]


# Singleton instance
ai_reporter = AIReporter()
