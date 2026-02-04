from app.core.database import SessionLocal
from app.models.models import BotProfile, ProfileBotRule

def seed_master_bot():
    db = SessionLocal()
    try:
        # Check if exists
        existing = db.query(BotProfile).filter(BotProfile.name == "Master Bot Alpha").first()
        if existing:
            print(f"Master Bot Alpha already exists (ID: {existing.id})")
            return

        print("Creating Master Bot Alpha...")
        bot = BotProfile(
            name="Master Bot Alpha",
            user_id=1,
            personality="balanced",
            strategy_type="hybrid",
            confirmation_level=2,
            risk_per_trade=1.0,
            bot_state="stopped",
            is_active=True
        )
        db.add(bot)
        db.commit()
        db.refresh(bot)
        print(f"✅ Bot Created: ID {bot.id}")

        # Add Rules
        rules = [
            {"indicator": "RSI", "operator": "<", "value": 30, "action": "Buy"},
            {"indicator": "RSI", "operator": ">", "value": 70, "action": "Sell"},
            {"indicator": "Price", "operator": "cross_above", "value": 0, "action": "Wait"} # Placeholder
        ]
        
        for idx, r in enumerate(rules):
            rule = ProfileBotRule(
                bot_profile_id=bot.id,
                rule_order=idx+1,
                indicator=r["indicator"],
                operator=r["operator"],
                value=r["value"],
                action=r["action"],
                is_enabled=True
            )
            db.add(rule)
        
        db.commit()
        print(f"✅ Added {len(rules)} default rules")

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_master_bot()
