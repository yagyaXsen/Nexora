import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database import SessionLocal
from app.models import ScrapedSource

db = SessionLocal()
db.query(ScrapedSource).delete()

sources = [
    ScrapedSource(
        name="Unstop (All Opportunities)",
        url="https://unstop.com/",
        scraper_type="playwright_html"
    )
]

db.bulk_save_objects(sources)
db.commit()
print("Updated database to use only Unstop!")
db.close()
