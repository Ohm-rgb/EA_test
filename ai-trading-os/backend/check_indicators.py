import os
import sys

# Change to backend directory first
backend_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(backend_dir)

# Add backend to path
sys.path.insert(0, backend_dir)

from app import models
from app.core.database import SessionLocal

try:
    db = SessionLocal()
    print("Database connection successful\n")

    # Check indicators
    indicators = db.query(models.StrategyPackage).all()
    print(f"=== Indicators found: {len(indicators)} ===\n")

    for ind in indicators:
        print(f"ID: {ind.id}")
        print(f"  Name: {ind.name}")
        print(f"  Type: {ind.type}")
        print(f"  Status: {ind.status}")
        # Limit source output to first 100 chars
        source_preview = (
            (ind.source[:100] + "...")
            if ind.source and len(ind.source) > 100
            else ind.source
        )
        print(f"  Source (preview): {source_preview}")
        print(f"  Period: {ind.period}")
        print(f"  Params: {ind.params}")
        print(f"  Params Type: {type(ind.params)}")
        print(f"  Config Hash: {ind.config_hash}")
        print(f"  User ID: {ind.user_id}")
        print(f"  Bot ID: {ind.bot_id}")
        print("-" * 50)

    # Check bot_indicators bindings
    print(f"\n=== Bot Indicator Bindings ===\n")
    bindings = db.query(models.BotIndicator).all()
    print(f"Bindings found: {len(bindings)}")

    for b in bindings:
        print(f"Binding ID: {b.id}")
        print(f"  Bot ID: {b.bot_id}")
        print(f"  Indicator ID: {b.indicator_id}")
        print(f"  Is Enabled: {b.is_enabled}")
        print(f"  Order: {b.order}")
        print("-" * 50)

    db.close()
except Exception as e:
    print(f"Database Error: {e}")
    import traceback

    traceback.print_exc()
