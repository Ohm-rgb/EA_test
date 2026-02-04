"""
Script to create Master Bot Alpha
"""
import sys
sys.path.insert(0, '.')

from app.core.database import SessionLocal
from app.models.bot import Bot

def create_master_bot():
    db = SessionLocal()
    
    try:
        # Check if Master Bot Alpha exists
        existing = db.query(Bot).filter(Bot.id == "master-bot-alpha").first()
        
        if existing:
            print(f"[OK] Master Bot Alpha already exists: {existing.name}")
            return
        
        # Create Master Bot Alpha
        bot = Bot(
            id="master-bot-alpha",
            user_id=1,
            name="Master Bot Alpha",
            status="active",
            configuration={
                "personality": "AI-Controlled",
                "riskPerTrade": 1.0,
                "maxDailyTrades": 10,
                "stopOnLoss": 3,
                "timeframe": "H1",
                "dailyTarget": 100,
                "symbol": "XAUUSD",
                "autoStop": True,
                "aiControlled": True
            }
        )
        
        db.add(bot)
        db.commit()
        
        print(f"[OK] Created Master Bot Alpha")
        print(f"     ID: {bot.id}")
        print(f"     Name: {bot.name}")
        print(f"     Daily Target: $100")
        print(f"     Symbol: XAUUSD")
        
    finally:
        db.close()

if __name__ == "__main__":
    create_master_bot()
