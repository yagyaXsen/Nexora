import sys
import os
sys.path.append(os.getcwd())
from app.database import SessionLocal
from app.models import ScrapedSource, Opportunity

db = SessionLocal()

print("--- SCRAPER TARGET STATUS ---")
sources = db.query(ScrapedSource).all()
for s in sources:
    print(f"Name: {s.name}")
    print(f"URL: {s.url}")
    print(f"Status: {s.status}")
    print(f"Last Scraped: {s.last_scraped}")
    print("-" * 20)

print("\n--- OPPORTUNITIES IN DATABASE ---")
count = db.query(Opportunity).count()
print(f"Total opportunities extracted and saved: {count}")

db.close()
