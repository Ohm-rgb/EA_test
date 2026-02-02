
from app.core.database import SessionLocal
from app.models.bot import StrategyPackage

db = SessionLocal()
inds = db.query(StrategyPackage).filter(StrategyPackage.name.contains('FX Market Sessions')).all()

print(f"Found {len(inds)} indicators")
for ind in inds:
    print(f"--- Checking ID: {ind.id} ---")
    if not ind.params:
        print("  Params: None")
        continue

    has_cap = 'capability_schema' in ind.params
    print(f"  Has 'capability_schema': {has_cap}")
    
    if has_cap:
        cap = ind.params['capability_schema']
        print(f"  Schema ID: {cap.get('id', 'N/A')}")
        print(f"  Versions: {cap.get('ui_version', 'N/A')}")
        print(f"  Sections: {len(cap.get('sections', []))}")
    else:
        print(f"  Keys present: {list(ind.params.keys())}")

db.close()
