import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.core.database import SessionLocal
from app import models

try:
    db = SessionLocal()
    print("Database connection successful")
    bots = db.query(models.Bot).all()
    print(f"Bots found: {len(bots)}")
    for bot in bots:
        print(f"Bot: {bot.name}, Owner: {bot.user_id}")
    db.close()
except Exception as e:
    print(f"Database Error: {e}")
