import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database import SessionLocal
from app.models import ScrapedSource

db = SessionLocal()
sources = db.query(ScrapedSource).all()

# Check if it already exists to avoid duplicates
exists = False
for s in sources:
    if "job" in s.url:
        exists = True
        break

if not exists:
    new_source = ScrapedSource(
        name="Unstop (Open Jobs)",
        url="https://unstop.com/job?oppstatus=open",
        scraper_type="playwright_html"
    )
    db.add(new_source)
    db.commit()
    print("Added Unstop Open Jobs to the database!")
else:
    print("Unstop Open Jobs is already in the database.")
db.close()
