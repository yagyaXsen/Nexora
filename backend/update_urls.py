import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database import SessionLocal
from app.models import ScrapedSource

db = SessionLocal()
sources = db.query(ScrapedSource).all()
if len(sources) >= 3:
    sources[0].url = "https://www.ycombinator.com/apply"
    sources[1].url = "https://www.nsf.gov/funding/opportunities"
    sources[2].url = "https://fellowship.mit.edu/"
    db.commit()
    print("Updated URLs successfully!")
else:
    print("Not enough sources found.")
db.close()
