import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database import SessionLocal
from app.models import ScrapedSource

db = SessionLocal()
db.query(ScrapedSource).delete()

sources = [
    ScrapedSource(
        name="Opportunity Desk",
        url="https://opportunitydesk.org/",
        scraper_type="playwright_html"
    ),
    ScrapedSource(
        name="Devpost Hackathons",
        url="https://devpost.com/hackathons",
        scraper_type="playwright_html"
    )
]

db.bulk_save_objects(sources)
db.commit()
print("Updated database to only have the two requested URLs!")
db.close()
