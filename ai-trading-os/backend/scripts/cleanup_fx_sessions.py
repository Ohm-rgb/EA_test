"""
Script to clean duplicate FX Market Sessions and update with proper params
"""
from app.core.database import SessionLocal
from app.models.bot import StrategyPackage
import hashlib
import json

db = SessionLocal()

# Get all FX Market Sessions
inds = db.query(StrategyPackage).filter(StrategyPackage.name == 'FX Market Sessions').all()
print(f'Found {len(inds)} FX Market Sessions indicators')

if len(inds) > 0:
    # Keep the first one, delete the rest
    keep = inds[0]
    
    # Delete duplicates
    for ind in inds[1:]:
        print(f'Deleting duplicate: {ind.id}')
        db.delete(ind)
    
    # Update the kept one with proper params
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
    
    keep.params = params
    keep.type = 'Session'
    keep.source = 'Time'
    keep.status = 'draft'
    keep.config_hash = hashlib.sha256(json.dumps(params, sort_keys=True).encode()).hexdigest()[:16]
    keep.bot_id = None  # Unbind
    
    db.commit()
    print(f'Updated indicator: {keep.id}')
    print(f'Status: {keep.status}')
    print(f'Signals count: {len(params["signals"])}')
    print('DONE!')

db.close()
