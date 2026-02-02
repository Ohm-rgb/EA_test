
from app.core.database import SessionLocal
from app.models.bot import StrategyPackage
import json

db = SessionLocal()
ind = db.query(StrategyPackage).filter(StrategyPackage.name == 'FX Market Sessions').first()

if ind:
    # 1. Define Capability Schema (UI Definition)
    capability_schema = {
        "id": "fx_market_sessions_v6",
        "ui_version": "1.0.0",
        "sections": [
            {
                "id": "general",
                "title": "General Settings",
                "controls": [
                    {
                        "id": "timezone",
                        "type": "select",
                        "label": "Timezone",
                        "bind": "timezone",
                        "default": "GMT+0",
                        "options": [
                             {"label": "GMT-5 (New York)", "value": "GMT-5"},
                             {"label": "GMT+0 (London)", "value": "GMT+0"},
                             {"label": "GMT+1", "value": "GMT+1"},
                             {"label": "GMT+2", "value": "GMT+2"},
                             {"label": "GMT+3", "value": "GMT+3"},
                             {"label": "GMT+7 (Bangkok)", "value": "GMT+7"},
                             {"label": "GMT+8 (Singapore)", "value": "GMT+8"},
                             {"label": "GMT+9 (Tokyo)", "value": "GMT+9"}
                        ]
                    },
                    {
                        "id": "history",
                        "type": "number",
                        "label": "History (Days)",
                        "bind": "history",
                        "default": 10,
                        "min": 1,
                        "max": 500
                    }
                ]
            },
            {
                "id": "session_1",
                "title": "Session 1 (London)",
                "controls": [
                    { "id": "s1_show", "type": "toggle", "label": "Show Session", "bind": "s1_show", "default": True },
                    { "id": "s1_name", "type": "text", "label": "Label", "bind": "s1_name", "default": "London" },
                    { "id": "s1_color", "type": "color", "label": "Color", "bind": "s1_color", "default": "#66D9EF" },
                    { "id": "s1_time", "type": "text", "label": "Time (HHMM-HHMM)", "bind": "s1_time", "default": "0800-1700", "placeholder": "0800-1700" },
                    { "id": "s1_extend", "type": "toggle", "label": "Extend", "bind": "s1_extend", "default": False }
                ]
            },
            {
                "id": "session_2",
                "title": "Session 2 (New York)",
                "controls": [
                    { "id": "s2_show", "type": "toggle", "label": "Show Session", "bind": "s2_show", "default": True },
                    { "id": "s2_name", "type": "text", "label": "Label", "bind": "s2_name", "default": "New York" },
                    { "id": "s2_color", "type": "color", "label": "Color", "bind": "s2_color", "default": "#FD971F" },
                    { "id": "s2_time", "type": "text", "label": "Time (HHMM-HHMM)", "bind": "s2_time", "default": "1300-2200", "placeholder": "1300-2200" },
                    { "id": "s2_extend", "type": "toggle", "label": "Extend", "bind": "s2_extend", "default": False }
                ]
            },
            {
                "id": "session_3",
                "title": "Session 3 (Tokyo)",
                "controls": [
                    { "id": "s3_show", "type": "toggle", "label": "Show Session", "bind": "s3_show", "default": True },
                    { "id": "s3_name", "type": "text", "label": "Label", "bind": "s3_name", "default": "Tokyo" },
                    { "id": "s3_color", "type": "color", "label": "Color", "bind": "s3_color", "default": "#AE81FF" },
                    { "id": "s3_time", "type": "text", "label": "Time (HHMM-HHMM)", "bind": "s3_time", "default": "0000-0900", "placeholder": "0000-0900" },
                    { "id": "s3_extend", "type": "toggle", "label": "Extend", "bind": "s3_extend", "default": False }
                ]
            },
            {
                "id": "session_4",
                "title": "Session 4 (Sydney)",
                "controls": [
                    { "id": "s4_show", "type": "toggle", "label": "Show Session", "bind": "s4_show", "default": False },
                    { "id": "s4_name", "type": "text", "label": "Label", "bind": "s4_name", "default": "Sydney" },
                    { "id": "s4_color", "type": "color", "label": "Color", "bind": "s4_color", "default": "#FB71A3" },
                    { "id": "s4_time", "type": "text", "label": "Time (HHMM-HHMM)", "bind": "s4_time", "default": "2000-0500", "placeholder": "2000-0500" },
                    { "id": "s4_extend", "type": "toggle", "label": "Extend", "bind": "s4_extend", "default": False }
                ]
            }
        ]
    }

    # 2. Define Initial Config (Values)
    initial_config = {
        "timezone": "GMT+0",
        "history": 10,
        "s1_show": True, "s1_name": "London", "s1_color": "#66D9EF", "s1_time": "0800-1700", "s1_extend": False,
        "s2_show": True, "s2_name": "New York", "s2_color": "#FD971F", "s2_time": "1300-2200", "s2_extend": False,
        "s3_show": True, "s3_name": "Tokyo", "s3_color": "#AE81FF", "s3_time": "0000-0900", "s3_extend": False,
        "s4_show": False,"s4_name": "Sydney", "s4_color": "#FB71A3", "s4_time": "2000-0500", "s4_extend": False
    }


# 3. Update Params for ALL matching indicators
inds = db.query(StrategyPackage).filter(StrategyPackage.name.contains('FX Market Sessions')).all()
print(f"Found {len(inds)} indicators to update.")

for ind in inds:
    current_params = ind.params or {}
    current_params['capability_schema'] = capability_schema
    current_params['config'] = initial_config # Default config values
    
    # Preserve code and signals
    if 'code' not in current_params and 'pine_code' in current_params:
         current_params['code'] = current_params['pine_code']

    ind.params = current_params
    
    # 4. Remove Analysis Failed tag if present
    if "(Analysis Failed)" in ind.name:
        ind.name = ind.name.replace("(Analysis Failed)", "").strip()

    print(f"Updated UI Schema for {ind.name} (ID: {ind.id})")
    
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(ind, "params")

db.commit()
db.close()
