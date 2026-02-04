"""
Trading Journal Models
บันทึกประวัติการเทรดและการวิเคราะห์ของ AI
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, JSON, ForeignKey, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.core.database import Base


class JournalEntryType(str, enum.Enum):
    """ประเภทของ Journal Entry"""
    INDICATOR_USAGE = "indicator_usage"      # บันทึกการใช้ indicator
    STRATEGY_PLAN = "strategy_plan"          # แผนกลยุทธ์
    TRADE_RESULT = "trade_result"            # ผลการเทรด
    AI_ANALYSIS = "ai_analysis"              # การวิเคราะห์ของ AI
    PARAMETER_TEST = "parameter_test"        # ผลทดสอบ parameters
    DAILY_SUMMARY = "daily_summary"          # สรุปประจำวัน


class TradingJournal(Base):
    """
    Trading Journal - บันทึกกิจกรรมและการวิเคราะห์ทั้งหมด
    """
    __tablename__ = "trading_journals"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Link to bot
    bot_id = Column(String, ForeignKey("bots.id"), nullable=False, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    
    # Entry type and content
    entry_type = Column(String, nullable=False)  # JournalEntryType value
    title = Column(String, nullable=False)       # หัวข้อ (ภาษาไทย)
    content = Column(JSON, default={})           # เนื้อหาละเอียด
    
    # AI generated summary (Thai)
    ai_summary_th = Column(Text, nullable=True)  # สรุปจาก AI เป็นภาษาไทย
    
    # Performance metrics
    profit_usd = Column(Float, default=0)        # กำไร/ขาดทุน
    win_rate = Column(Float, nullable=True)      # อัตราชนะ %
    indicator_score = Column(Float, nullable=True) # คะแนน indicator
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    bot = relationship("Bot", backref="journal_entries")


class DailyTarget(Base):
    """
    เป้าหมายรายวัน - ติดตาม daily profit target
    """
    __tablename__ = "daily_targets"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    bot_id = Column(String, ForeignKey("bots.id"), nullable=False, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    
    # Date
    date = Column(String, nullable=False, index=True)  # YYYY-MM-DD
    
    # Target settings
    target_profit_usd = Column(Float, default=100)     # เป้าหมาย $100
    current_profit_usd = Column(Float, default=0)      # กำไรปัจจุบัน
    
    # Status
    target_reached = Column(Boolean, default=False)    # ถึงเป้าหรือยัง
    auto_stopped = Column(Boolean, default=False)      # หยุดเทรดอัตโนมัติแล้ว
    reached_at = Column(DateTime, nullable=True)       # เวลาที่ถึงเป้า
    
    # Trading stats
    total_trades = Column(Integer, default=0)
    winning_trades = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AIRecommendation(Base):
    """
    คำแนะนำจาก AI - indicators และ strategy
    """
    __tablename__ = "ai_recommendations"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    bot_id = Column(String, ForeignKey("bots.id"), nullable=False, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    
    # Recommendation type
    recommendation_type = Column(String, nullable=False)  # indicator, strategy, parameter
    
    # Content (Thai)
    title_th = Column(String, nullable=False)        # หัวข้อคำแนะนำ
    description_th = Column(Text, nullable=False)    # คำอธิบายละเอียด
    
    # Suggested configuration
    suggested_config = Column(JSON, default={})      # การตั้งค่าที่แนะนำ
    
    # Confidence score
    confidence = Column(Float, default=0.5)          # ความมั่นใจ 0-1
    
    # Status
    is_applied = Column(Boolean, default=False)      # ใช้งานแล้วหรือยัง
    applied_at = Column(DateTime, nullable=True)
    
    # Result after applying
    result_profit = Column(Float, nullable=True)     # ผลลัพธ์หลังใช้
    result_notes = Column(Text, nullable=True)       # หมายเหตุผลลัพธ์
    
    created_at = Column(DateTime, default=datetime.utcnow)
