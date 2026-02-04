"""
AI Strategy Planner - วางแผนกลยุทธ์และแนะนำ Indicators
"""
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
from dataclasses import dataclass
from enum import Enum
from sqlalchemy.orm import Session

from app.models import AIRecommendation, TradingJournal, JournalEntryType
from app.services.ai_reporter import AIReporter

logger = logging.getLogger(__name__)


class MarketCondition(str, Enum):
    """สภาพตลาด"""
    TRENDING_UP = "trending_up"       # แนวโน้มขาขึ้น
    TRENDING_DOWN = "trending_down"   # แนวโน้มขาลง
    RANGING = "ranging"               # ไซด์เวย์
    VOLATILE = "volatile"             # ผันผวนสูง
    QUIET = "quiet"                   # นิ่ง


class TradingStyle(str, Enum):
    """สไตล์การเทรด"""
    SCALPING = "scalping"             # เทรดสั้นมาก
    DAY_TRADING = "day_trading"       # เทรดรายวัน
    SWING = "swing"                   # เทรดสวิง
    POSITION = "position"             # ถือยาว


@dataclass
class MarketAnalysis:
    """ผลการวิเคราะห์ตลาด"""
    condition: MarketCondition
    trend_strength: float  # 0-1
    volatility: float      # 0-1
    suggested_style: TradingStyle
    summary_th: str


@dataclass
class IndicatorRecommendation:
    """คำแนะนำ Indicator"""
    indicator_type: str
    name: str
    params: Dict[str, Any]
    reason_th: str
    confidence: float  # 0-1


@dataclass
class TradingPlan:
    """แผนการเทรด"""
    name: str
    indicators: List[IndicatorRecommendation]
    entry_rules_th: List[str]
    exit_rules_th: List[str]
    risk_per_trade: float
    daily_target_usd: float
    summary_th: str


class AIStrategyPlanner:
    """
    AI Strategy Planner - วางแผนกลยุทธ์อัตโนมัติ
    """
    
    def __init__(self, db: Session = None):
        self.db = db
        self.reporter = AIReporter(db) if db else None
    
    # ============================================
    # Market Analysis
    # ============================================
    
    def analyze_market(
        self,
        symbol: str = "XAUUSD",
        timeframe: str = "H1"
    ) -> MarketAnalysis:
        """วิเคราะห์สภาพตลาด"""
        # TODO: Integrate with MT5 to get real market data
        # For now, return mock analysis
        
        analysis = MarketAnalysis(
            condition=MarketCondition.TRENDING_UP,
            trend_strength=0.75,
            volatility=0.5,
            suggested_style=TradingStyle.DAY_TRADING,
            summary_th="📊 ตลาดทองคำ (XAUUSD) กำลังอยู่ในแนวโน้มขาขึ้น "
                       "ความแข็งแรงของแนวโน้ม 75% "
                       "ความผันผวนปานกลาง แนะนำเทรดรายวัน"
        )
        
        return analysis
    
    # ============================================
    # Indicator Recommendations
    # ============================================
    
    def suggest_indicators(
        self,
        market_condition: MarketCondition,
        trading_style: TradingStyle
    ) -> List[IndicatorRecommendation]:
        """แนะนำ Indicators ที่เหมาะสม"""
        
        recommendations = []
        
        # Trend indicators for trending markets
        if market_condition in [MarketCondition.TRENDING_UP, MarketCondition.TRENDING_DOWN]:
            recommendations.append(IndicatorRecommendation(
                indicator_type="EMA",
                name="EMA Cross",
                params={"fast_period": 9, "slow_period": 21, "source": "close"},
                reason_th="📈 EMA Cross (9, 21) เหมาะสำหรับตลาดที่มีแนวโน้ม ช่วยระบุทิศทางและจุด entry",
                confidence=0.85
            ))
            
            recommendations.append(IndicatorRecommendation(
                indicator_type="RSI",
                name="RSI Trend Filter",
                params={"period": 14, "overbought": 70, "oversold": 30},
                reason_th="📉 RSI (14) ช่วยกรองสัญญาณ เข้า BUY เมื่อ RSI > 50 ในตลาดขาขึ้น",
                confidence=0.80
            ))
        
        # Volatility indicators for ranging markets
        elif market_condition == MarketCondition.RANGING:
            recommendations.append(IndicatorRecommendation(
                indicator_type="BB",
                name="Bollinger Bands",
                params={"period": 20, "std_dev": 2, "source": "close"},
                reason_th="📊 Bollinger Bands (20, 2) เหมาะสำหรับตลาดไซด์เวย์ ซื้อที่ Lower Band, ขายที่ Upper Band",
                confidence=0.80
            ))
            
            recommendations.append(IndicatorRecommendation(
                indicator_type="Stochastic",
                name="Stochastic Oscillator",
                params={"k_period": 14, "d_period": 3, "slowing": 3},
                reason_th="📈 Stochastic (14, 3, 3) ช่วยหาจุด overbought/oversold ในตลาดไซด์เวย์",
                confidence=0.75
            ))
        
        # High volatility - momentum indicators
        elif market_condition == MarketCondition.VOLATILE:
            recommendations.append(IndicatorRecommendation(
                indicator_type="ATR",
                name="Average True Range",
                params={"period": 14},
                reason_th="📊 ATR (14) ช่วยกำหนด Stop Loss ที่เหมาะสมในตลาดผันผวน",
                confidence=0.90
            ))
            
            recommendations.append(IndicatorRecommendation(
                indicator_type="MACD",
                name="MACD",
                params={"fast": 12, "slow": 26, "signal": 9},
                reason_th="📉 MACD (12, 26, 9) ช่วยจับ momentum และสัญญาณกลับตัว",
                confidence=0.85
            ))
        
        # Add session indicator for gold trading
        if trading_style in [TradingStyle.DAY_TRADING, TradingStyle.SCALPING]:
            recommendations.append(IndicatorRecommendation(
                indicator_type="SessionMarker",
                name="FX Market Sessions",
                params={"show_london": True, "show_ny": True, "show_asian": True},
                reason_th="🌍 Session Marker ช่วยระบุช่วงเวลาที่ดีที่สุดในการเทรด โดยเฉพาะ London-NY overlap",
                confidence=0.70
            ))
        
        return recommendations
    
    # ============================================
    # Trading Plan Generator
    # ============================================
    
    def generate_trading_plan(
        self,
        bot_id: str,
        user_id: int,
        symbol: str = "XAUUSD",
        daily_target: float = 100
    ) -> TradingPlan:
        """สร้างแผนการเทรด"""
        
        # Step 1: Analyze market
        analysis = self.analyze_market(symbol)
        
        # Step 2: Get indicator recommendations
        indicators = self.suggest_indicators(
            analysis.condition, 
            analysis.suggested_style
        )
        
        # Step 3: Generate entry/exit rules
        entry_rules = self._generate_entry_rules(indicators, analysis.condition)
        exit_rules = self._generate_exit_rules(indicators, daily_target)
        
        # Step 4: Create trading plan
        plan = TradingPlan(
            name=f"Master Bot Alpha - {symbol}",
            indicators=indicators,
            entry_rules_th=entry_rules,
            exit_rules_th=exit_rules,
            risk_per_trade=1.0,  # 1% risk per trade
            daily_target_usd=daily_target,
            summary_th=self._generate_plan_summary(analysis, indicators, daily_target)
        )
        
        # Step 5: Log to journal
        if self.reporter and self.db:
            self.reporter.create_journal_entry(
                bot_id=bot_id,
                user_id=user_id,
                entry_type=JournalEntryType.STRATEGY_PLAN,
                title=f"แผนเทรด {symbol} - เป้าหมาย ${daily_target}/วัน",
                content={
                    "plan_name": plan.name,
                    "indicators": [{"name": i.name, "params": i.params} for i in indicators],
                    "entry_rules": entry_rules,
                    "exit_rules": exit_rules,
                    "market_condition": analysis.condition.value
                }
            )
        
        # Step 6: Save recommendation
        if self.db:
            recommendation = AIRecommendation(
                bot_id=bot_id,
                user_id=user_id,
                recommendation_type="strategy",
                title_th=f"แผนเทรด {symbol} อัตโนมัติ",
                description_th=plan.summary_th,
                suggested_config={
                    "indicators": [{"name": i.name, "params": i.params} for i in indicators],
                    "daily_target": daily_target
                },
                confidence=sum(i.confidence for i in indicators) / len(indicators) if indicators else 0
            )
            self.db.add(recommendation)
            self.db.commit()
        
        return plan
    
    def _generate_entry_rules(
        self,
        indicators: List[IndicatorRecommendation],
        condition: MarketCondition
    ) -> List[str]:
        """สร้างกฎเข้าเทรด"""
        rules = []
        
        for ind in indicators:
            if ind.indicator_type == "EMA":
                if condition == MarketCondition.TRENDING_UP:
                    rules.append(f"✅ BUY เมื่อ EMA {ind.params.get('fast_period', 9)} ตัดขึ้นเหนือ EMA {ind.params.get('slow_period', 21)}")
                else:
                    rules.append(f"✅ SELL เมื่อ EMA {ind.params.get('fast_period', 9)} ตัดลงต่ำกว่า EMA {ind.params.get('slow_period', 21)}")
            
            elif ind.indicator_type == "RSI":
                rules.append(f"🔍 ยืนยัน RSI > 50 สำหรับ BUY, RSI < 50 สำหรับ SELL")
            
            elif ind.indicator_type == "BB":
                rules.append(f"✅ BUY เมื่อราคาแตะ Lower Band + RSI < 30")
                rules.append(f"✅ SELL เมื่อราคาแตะ Upper Band + RSI > 70")
        
        rules.append("⏰ เทรดเฉพาะช่วง London-NY (14:00-23:00 เวลาไทย)")
        
        return rules
    
    def _generate_exit_rules(
        self,
        indicators: List[IndicatorRecommendation],
        daily_target: float
    ) -> List[str]:
        """สร้างกฎออกจากเทรด"""
        rules = [
            f"🎯 Take Profit: Fixed 20 pips หรือ RR 1:2",
            f"🛡️ Stop Loss: ATR x 1.5 หรือ Fixed 15 pips",
            f"💰 หยุดเทรดอัตโนมัติเมื่อกำไรถึง ${daily_target}",
            f"⚠️ หยุดเทรดทันทีหากขาดทุน 3 ครั้งติดต่อกัน"
        ]
        
        return rules
    
    def _generate_plan_summary(
        self,
        analysis: MarketAnalysis,
        indicators: List[IndicatorRecommendation],
        daily_target: float
    ) -> str:
        """สร้างสรุปแผนเป็นภาษาไทย"""
        indicator_names = ", ".join([i.name for i in indicators])
        
        return f"""📋 **แผนเทรดอัตโนมัติ Master Bot Alpha**

🌍 **สภาพตลาด:** {analysis.summary_th}

📊 **Indicators ที่ใช้:** {indicator_names}

💰 **เป้าหมาย:** กำไร ${daily_target} ต่อวัน

⚙️ **Risk Management:**
- Risk ต่อเทรด: 1% ของทุน
- Max Drawdown: 3%
- หยุดอัตโนมัติเมื่อถึงเป้า

✅ **พร้อมเริ่มเทรดเมื่อ AI อนุมัติ**"""


# Singleton instance
ai_strategy_planner = AIStrategyPlanner()
