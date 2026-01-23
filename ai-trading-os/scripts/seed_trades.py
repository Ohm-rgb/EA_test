import sys
import os
import random
from datetime import datetime, timedelta

# Add backend directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models import Trade, Bot, StrategyPackage, BotRule # Import from package
from app.core.database import SessionLocal, engine

def seed_data():
    db = SessionLocal()
    print("🌱 Starting Factory Seed Process...")
    
    try:
        # 1. Clear existing trades (Factory Reset)
        deleted_rows = db.query(Trade).delete()
        print(f"🧹 Cleared {deleted_rows} existing trades.")
        
        # 2. Ensure Context Indicators Exist
        indicators = {
            "context_rsi": {
                "name": "RSI Divergence",
                "type": "RSI",
                "win_rate": 0.65,
                "r_r": 1.5,
                "time_bias": [9, 10, 11, 14, 15] # London/NY Open
            },
            "context_smc": {
                "name": "Smart Money Concepts",
                "type": "SMC",
                "win_rate": 0.45,
                "r_r": 3.0,
                "time_bias": [8, 9, 13, 14] # Session Opens
            }
        }
        
        for ind_id, config in indicators.items():
            ind = db.query(StrategyPackage).filter(StrategyPackage.id == ind_id).first()
            if not ind:
                ind = StrategyPackage(
                    id=ind_id,
                    name=config['name'],
                    type=config['type'],
                    status="active",
                    source="Close",
                    period=14,
                    config_hash="initial_seed_hash"
                )
                db.add(ind)
                print(f"➕ Created Indicator: {config['name']}")
            else:
                print(f"✅ Found Indicator: {config['name']}")
        
        db.commit()

        # 3. Generate Trades
        start_date = datetime.utcnow() - timedelta(days=30)
        
        total_trades = 0
        
        for ind_id, config in indicators.items():
            print(f"🏭 Manufacturing trades for {config['name']}...")
            current_time = start_date
            
            while current_time < datetime.utcnow():
                # Randomize gaps between trades (4-12 hours)
                current_time += timedelta(hours=random.randint(4, 12))
                
                if current_time > datetime.utcnow():
                    break
                    
                # Time of Day Bias
                hour = current_time.hour
                if hour not in config['time_bias'] and random.random() > 0.2:
                    continue # Skip if not in prime time (80% chance)
                
                # Win/Loss Logic
                is_win = random.random() < config['win_rate']
                trade_type = random.choice(["buy", "sell"])
                
                # Price Simulation
                open_price = 2000 + (random.random() * 100)
                risk = 100 # $100 risk per trade
                reward = risk * config['r_r']
                
                if is_win:
                    profit = reward
                    close_price = open_price + (10 if trade_type == "buy" else -10) # Mock
                    status = "closed"
                else:
                    profit = -risk
                    close_price = open_price - (5 if trade_type == "buy" else -5) # Mock
                    status = "closed"

                trade = Trade(
                    symbol="XAUUSD",
                    trade_type=trade_type,
                    lot_size=0.1,
                    open_price=open_price,
                    close_price=close_price,
                    profit=profit,
                    status=status,
                    opened_at=current_time,
                    closed_at=current_time + timedelta(minutes=random.randint(15, 240)),
                    source_indicator_id=ind_id, # Linking to Context!
                    user_id=1 
                )
                db.add(trade)
                total_trades += 1
                
        db.commit()
        print(f"✅ Successfully seeded {total_trades} trades across {len(indicators)} contexts.")
        
    except Exception as e:
        print(f"❌ Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
