from sqlalchemy import Column, Integer, String, Boolean, JSON, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base

class Bot(Base):
    __tablename__ = "bots"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    name = Column(String, index=True)
    status = Column(String, default="draft")  # draft, active, running, paused
    
    # Configuration stored as JSON for flexibility
    # { personality, riskPerTrade, maxDailyTrades, stopOnLoss, timeframe }
    configuration = Column(JSON, default={})
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    indicators = relationship("StrategyPackage", back_populates="bot")
    rules = relationship("BotRule", back_populates="bot")

class StrategyPackage(Base):
    __tablename__ = "indicators"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    name = Column(String) # Display name
    type = Column(String, index=True)  # RSI, EMA, etc.
    source = Column(String)  # Close, Open, etc.
    period = Column(Integer, default=0)
    
    # Extended configuration (for complex indicators)
    params = Column(JSON, default={})
    
    # Lifecycle
    status = Column(String, default="draft")  # draft, ready, active, disabled
    
    # Config version tracking (for cache invalidation)
    config_hash = Column(String, nullable=True)  # SHA256 hash of params
    
    # Binding (Optional: an indicator might be bound to a specific bot, or global)
    # For now, we allow binding to a bot. If null, it could be a 'global' template.
    bot_id = Column(String, ForeignKey("bots.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    bot = relationship("Bot", back_populates="indicators")
    rules = relationship("BotRule", back_populates="indicator")

class BotRule(Base):
    __tablename__ = "rules"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    bot_id = Column(String, ForeignKey("bots.id"))
    indicator_id = Column(String, ForeignKey("indicators.id"))
    
    operator = Column(String)  # crosses_above, etc.
    value = Column(Integer)
    action = Column(String)    # Buy, Sell
    is_enabled = Column(Boolean, default=True)
    
    bot = relationship("Bot", back_populates="rules")
    indicator = relationship("StrategyPackage", back_populates="rules")

from sqlalchemy import UniqueConstraint

class BotIndicator(Base):
    __tablename__ = "bot_indicators"

    id = Column(String, primary_key=True, index=True)
    bot_id = Column(String, ForeignKey("bots.id"), nullable=False)
    indicator_id = Column(String, ForeignKey("indicators.id"), nullable=False)
    
    is_enabled = Column(Boolean, default=True)
    order = Column(Integer, default=0)        # For Flow Node ordering
    bound_at = Column(DateTime, default=datetime.utcnow)  # Audit / Timeline

    __table_args__ = (UniqueConstraint("bot_id", "indicator_id", name="_bot_indicator_uc"),)

    # Relationships
    bot = relationship("Bot", back_populates="bot_indicators")
    indicator = relationship("StrategyPackage", back_populates="bot_associations")

# Extend Bot and StrategyPackage with relationships
Bot.bot_indicators = relationship("BotIndicator", back_populates="bot", cascade="all, delete-orphan")
StrategyPackage.bot_associations = relationship("BotIndicator", back_populates="indicator", cascade="all, delete-orphan")
