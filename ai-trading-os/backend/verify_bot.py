from app.core.database import SessionLocal
from app.models.models import BotProfile, ProfileBotRule, Settings
import json

def verify():
    db = SessionLocal()
    try:
        # Check Bot
        bot = db.query(BotProfile).filter(BotProfile.name == "Master Bot Alpha").first()
        bot_status = "NOT FOUND"
        indicators = []
        
        if bot:
            bot_status = f"FOUND (ID: {bot.id}, State: {bot.bot_state}, Active: {bot.is_active})"
            # Check Rules
            rules = db.query(ProfileBotRule).filter(ProfileBotRule.bot_profile_id == bot.id).all()
            for r in rules:
                indicators.append(f"{r.indicator} {r.operator} {r.value}")
        
        # Check Settings
        settings = db.query(Settings).first()
        ai_status = "NO SETTINGS"
        if settings:
            ai_status = f"Primary: {settings.primary_ai_provider}, Key: {'YES' if settings.gemini_api_key else 'NO'}"

        result = {
            "bot": bot_status,
            "indicators": indicators,
            "ai": ai_status
        }
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    verify()
