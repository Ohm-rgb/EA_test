"""
Database Models
"""
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, 
    Float, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    """User model (Single-user, prepared for future)"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)
    
    # Relationships
    bot_profiles = relationship("BotProfile", back_populates="user")
    trades = relationship("Trade", back_populates="user")
    settings = relationship("Settings", back_populates="user", uselist=False)


class Settings(Base):
    """User settings"""
    __tablename__ = "settings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    
    # Trading Guardrails
    risk_profile = Column(String(20), default="balanced")
    max_drawdown_percent = Column(Float, default=10.0)
    daily_loss_limit = Column(Float, nullable=True)
    news_sensitivity = Column(String(20), default="soft_filter")
    
    # AI Settings
    local_ai_model = Column(String(50), default="llama3.2")
    external_ai_provider = Column(String(20), default="gemini")
    external_ai_model = Column(String(50), default="gemini-1.5-flash")
    monthly_token_limit = Column(Integer, default=100000)
    
    # MT5 Connection
    mt5_server = Column(String(100), nullable=True)
    mt5_login = Column(String(50), nullable=True)
    mt5_password_encrypted = Column(Text, nullable=True)
    mt5_account_type = Column(String(10), default="demo")
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="settings")


class BotProfile(Base):
    """Trading bot profile"""
    __tablename__ = "bot_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String(100), nullable=False)
    personality = Column(String(20), nullable=False)  # conservative/aggressive/balanced
    
    # Decision Style
    strategy_type = Column(String(30), nullable=True)
    confirmation_level = Column(Integer, default=2)
    
    # Risk Behavior
    risk_per_trade = Column(Float, default=1.0)
    max_daily_trades = Column(Integer, default=10)
    stop_on_consecutive_loss = Column(Integer, default=3)
    
    # Market Awareness 
    primary_timeframe = Column(String(10), default="H1")
    volatility_response = Column(String(20), default="reduce")
    
    # Status
    is_active = Column(Boolean, default=False)
    confidence_score = Column(Float, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="bot_profiles")
    rules = relationship("BotRule", back_populates="bot_profile", cascade="all, delete-orphan")
    trades = relationship("Trade", back_populates="bot_profile")
    simulations = relationship("Simulation", back_populates="bot_profile")


class BotRule(Base):
    """Bot trading rules (If-Then logic)"""
    __tablename__ = "bot_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    bot_profile_id = Column(Integer, ForeignKey("bot_profiles.id"))
    rule_order = Column(Integer, nullable=False)
    indicator = Column(String(50), nullable=False)
    operator = Column(String(20), nullable=False)
    value = Column(Float, nullable=True)
    action = Column(String(20), nullable=False)
    is_enabled = Column(Boolean, default=True)
    
    # Relationships
    bot_profile = relationship("BotProfile", back_populates="rules")


class Trade(Base):
    """Trade records"""
    __tablename__ = "trades"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    bot_profile_id = Column(Integer, ForeignKey("bot_profiles.id"), nullable=True)
    
    ticket_number = Column(String(50), nullable=True)
    symbol = Column(String(20), nullable=False)
    trade_type = Column(String(10), nullable=False)  # buy/sell
    lot_size = Column(Float, nullable=False)
    open_price = Column(Float, nullable=False)
    close_price = Column(Float, nullable=True)
    stop_loss = Column(Float, nullable=True)
    take_profit = Column(Float, nullable=True)
    profit = Column(Float, nullable=True)
    status = Column(String(20), default="open")  # open/closed/cancelled
    
    opened_at = Column(DateTime, default=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)
    decision_reason = Column(JSON, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="trades")
    bot_profile = relationship("BotProfile", back_populates="trades")


class Simulation(Base):
    """Simulation results"""
    __tablename__ = "simulations"
    
    id = Column(Integer, primary_key=True, index=True)
    bot_profile_id = Column(Integer, ForeignKey("bot_profiles.id"))
    
    scenario_type = Column(String(50), nullable=True)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    initial_balance = Column(Float, nullable=True)
    final_balance = Column(Float, nullable=True)
    total_trades = Column(Integer, nullable=True)
    win_rate = Column(Float, nullable=True)
    max_drawdown = Column(Float, nullable=True)
    ai_analysis = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    bot_profile = relationship("BotProfile", back_populates="simulations")


class ErrorLog(Base):
    """System error logs"""
    __tablename__ = "error_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    error_type = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False)
    message = Column(Text, nullable=False)
    affected_trades = Column(JSON, nullable=True)
    impact_assessment = Column(Text, nullable=True)
    occurred_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)


class AuditLog(Base):
    """Audit trail for system changes"""
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(50), nullable=False)
    target_table = Column(String(50), nullable=True)
    target_id = Column(Integer, nullable=True)
    old_value = Column(JSON, nullable=True)
    new_value = Column(JSON, nullable=True)
    performed_by = Column(String(50), nullable=True)
    performed_at = Column(DateTime, default=datetime.utcnow)


class AISession(Base):
    """AI chat sessions"""
    __tablename__ = "ai_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    context_page = Column(String(20), nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    total_tokens_used = Column(Integer, default=0)
    
    # Relationships
    messages = relationship("AIMessage", back_populates="session", cascade="all, delete-orphan")


class AIMessage(Base):
    """AI chat messages"""
    __tablename__ = "ai_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("ai_sessions.id"))
    role = Column(String(20), nullable=False)  # user/local_ai/external_ai
    content = Column(Text, nullable=False)
    tokens_used = Column(Integer, nullable=True)
    model_used = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    session = relationship("AISession", back_populates="messages")
