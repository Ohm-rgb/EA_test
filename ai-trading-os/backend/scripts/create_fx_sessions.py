"""
Script to create FX Market Sessions indicator manually
"""
from app.core.database import SessionLocal
from app.models.bot import StrategyPackage
import uuid
import hashlib
import json

db = SessionLocal()

# Check if already exists
existing = db.query(StrategyPackage).filter(StrategyPackage.name == 'FX Market Sessions').first()
if existing:
    print(f'Indicator already exists: {existing.id}')
else:
    # Create comprehensive params for the indicator
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
            {'id': 7, 'name': 'Session High Breakout', 'type': 'breakout_high', 'enabled': True},
            {'id': 8, 'name': 'Session Low Breakout', 'type': 'breakout_low', 'enabled': True}
        ],
        'features': ['opening_range', 'fibonacci_levels', 'session_boxes', 'session_labels']
    }
    
    config_hash = hashlib.sha256(json.dumps(params, sort_keys=True).encode()).hexdigest()[:16]
    
    indicator = StrategyPackage(
        id=f'fx_sessions_{uuid.uuid4().hex[:8]}',
        user_id=1,
        name='FX Market Sessions',
        type='Session',
        source='Time',
        period=0,
        params=params,
        status='draft',
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
