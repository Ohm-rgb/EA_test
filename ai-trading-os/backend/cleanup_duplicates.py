"""Script to clean up duplicate indicators"""
from app.core.database import SessionLocal
from app import models

db = SessionLocal()

# Get all indicators
indicators = db.query(models.StrategyPackage).all()
print(f"Total indicators: {len(indicators)}")
for ind in indicators:
    print(f"  - ID: {ind.id}, Name: {ind.name}")

# Keep only the first one, delete duplicates by name
seen_names = set()
to_delete = []

for ind in indicators:
    if ind.name in seen_names:
        to_delete.append(ind)
    else:
        seen_names.add(ind.name)

print(f"\nDuplicates to delete: {len(to_delete)}")
for ind in to_delete:
    print(f"  Deleting: {ind.id}")
    db.delete(ind)

db.commit()
print("Done! Duplicates removed.")
db.close()
