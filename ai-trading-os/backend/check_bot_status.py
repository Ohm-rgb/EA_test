from app.core.database import SessionLocal
from app.models.models import BotProfile, ProfileBotRule, Settings
import sys

def check_bot_status():
    print("--- Verifying Master Bot Alpha Status ---")
    
    db = SessionLocal()
    try:
        # 1. Check Bot Existence
        bots = db.query(BotProfile).all()
        master_bot = None
        for bot in bots:
            print(f"Found Bot: ID={bot.id}, Name='{bot.name}', Active={bot.is_active}")
            if "Master" in bot.name or "Alpha" in bot.name:
                master_bot = bot
        
        if not master_bot:
            print("❌ Master Bot Alpha NOT found in database.")
        else:
            print(f"✅ Master Bot Alpha found (ID: {master_bot.id})")
            
            # 2. Check Indicators (Rules)
            rules = db.query(ProfileBotRule).filter(ProfileBotRule.bot_profile_id == master_bot.id).all()
            print(f"\n--- Indicators / Rules ({len(rules)}) ---")
            if not rules:
                print("⚠️ No indicators bound to this bot.")
            else:
                for r in rules:
                    print(f"  - {r.indicator} {r.operator} {r.value} -> {r.action} (Enabled: {r.is_enabled})")

        # 3. Check AI Connection Settings
        settings = db.query(Settings).first()
        print("\n--- AI Connection Status ---")
        if settings:
             print(f"  - Primary AI: {settings.primary_ai_provider}")
             print(f"  - External AI: {settings.external_ai_provider} ({settings.external_ai_status})")
             print(f"  - Has Gemini Key: {bool(settings.gemini_api_key)}")
             print(f"  - Has OpenAI Key: {bool(settings.openai_api_key)}")
        else:
            print("❌ No Global Settings found.")

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_bot_status()
