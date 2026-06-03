import sys
import os
sys.path.append(os.getcwd())
from app.database import SessionLocal
from app.models import ScrapedSource

db = SessionLocal()
sources = db.query(ScrapedSource).all()
for s in sources:
    print(f"- {s.name}: {s.url}")
db.close()
