"""
Script to create FX Market Sessions indicator manually
"""
import os
from app.core.database import SessionLocal
from app.models.bot import StrategyPackage
import uuid
import hashlib
import json

def get_pine_code():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    pine_path = os.path.join(current_dir, 'fx_sessions.pine')
    try:
        with open(pine_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"Error reading pine file: {e}")
        return None

def main():
    db = SessionLocal()
    
    # Read Pine Script
    pine_code = get_pine_code()
    if not pine_code:
        print("Could not read pine code.")
        return

    # Check if already exists
    existing = db.query(StrategyPackage).filter(StrategyPackage.name == 'FX Market Sessions').first()
    
    # Define Params
    params = {
        'schemaVersion': '1.0',
        'sourceType': 'pine_script',
        'pineVersion': 6,
        'sessions': [
            {'id': 'london', 'name': 'London', 'time': '08:00-17:00', 'color': '#66D9EF', 'enabled': True},
            {'id': 'newyork', 'name': 'New York', 'time': '13:00-22:00', 'color': '#FD971F', 'enabled': True},
            {'id': 'tokyo', 'name': 'Tokyo', 'time': '00:00-09:00', 'color': '#AE81FF', 'enabled': True},
            {'id': 'sydney', 'name': 'Sydney', 'time': '20:00-05:00', 'color': '#FB71A3', 'enabled': False}
        ],
        'timezone': 'GMT+7',
        'signals': [
            {'id': 1, 'name': 'London Start', 'type': 'session_start', 'session': 'london', 'enabled': True},
            {'id': 2, 'name': 'London End', 'type': 'session_end', 'session': 'london', 'enabled': True},
            {'id': 3, 'name': 'NY Start', 'type': 'session_start', 'session': 'newyork', 'enabled': True},
            {'id': 4, 'name': 'NY End', 'type': 'session_end', 'session': 'newyork', 'enabled': True},
            {'id': 5, 'name': 'Tokyo Start', 'type': 'session_start', 'session': 'tokyo', 'enabled': True},
            {'id': 6, 'name': 'Tokyo End', 'type': 'session_end', 'session': 'tokyo', 'enabled': True},
            {'id': 7, 'name': 'Sydney Start', 'type': 'session_start', 'session': 'sydney', 'enabled': True},
            {'id': 8, 'name': 'Sydney End', 'type': 'session_end', 'session': 'sydney', 'enabled': True},
            {'id': 9, 'name': 'Session High Breakout', 'type': 'breakout_high', 'enabled': True},
            {'id': 10, 'name': 'Session Low Breakout', 'type': 'breakout_low', 'enabled': True}
        ],
        'features': ['opening_range', 'fibonacci_levels', 'session_boxes', 'session_labels'],
        'pine_code': pine_code
    }
    
    config_hash = hashlib.sha256(json.dumps(params, sort_keys=True).encode()).hexdigest()[:16]

    if existing:
        print(f'Updating existing indicator: {existing.id}')
        existing.params = params
        existing.config_hash = config_hash
        existing.status = 'active'
        db.commit()
        db.refresh(existing)
        print(f'Updated {existing.name}')
    else:
        indicator = StrategyPackage(
            id=f'fx_sessions_{uuid.uuid4().hex[:8]}',
            user_id=1,
            name='FX Market Sessions',
            type='Session',
            source='Time',
            period=0,
            params=params,
            status='active',
            config_hash=config_hash,
            bot_id=None
        )
        
        db.add(indicator)
        db.commit()
        db.refresh(indicator)
        print(f'Created indicator: {indicator.id}')
        print(f'Name: {indicator.name}')
        print(f'Signals: {len(params["signals"])}')

    db.close()

if __name__ == "__main__":
    main()
