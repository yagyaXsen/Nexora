import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database import SessionLocal
from app.models import ScrapedSource

db = SessionLocal()
sources = db.query(ScrapedSource).all()
if len(sources) >= 3:
    sources[1].url = "https://en.wikipedia.org/wiki/Scholarship"
    db.commit()
    print("Updated NSF URL to Wikipedia successfully!")
else:
    print("Not enough sources found.")
db.close()
