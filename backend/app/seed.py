import logging
from app.database import SessionLocal, Base, engine
from app.models import Source, SourceType

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed")

SEED_SOURCES = [
    {
        "name": "CERN Careers Portal",
        "type": SourceType.HTML.value,
        "url": "https://careers.cern/",
        "config": {"category_hint": "fellowship"},
        "enabled": True,
        "schedule": "daily"
    },
    {
        "name": "DAAD Scholarship Database",
        "type": SourceType.HTML.value,
        "url": "https://www.daad.de/en/study-and-research-in-germany/scholarships/",
        "config": {"category_hint": "grant"},
        "enabled": True,
        "schedule": "daily"
    },
    {
        "name": "Opportunity Desk Fellowships",
        "type": SourceType.HTML.value,
        "url": "https://opportunitydesk.org/category/fellowships/",
        "config": {"category_hint": "fellowship"},
        "enabled": True,
        "schedule": "daily"
    },
    {
        "name": "Y Combinator Applications",
        "type": SourceType.HTML.value,
        "url": "https://www.ycombinator.com/apply",
        "config": {"category_hint": "accelerator"},
        "enabled": True,
        "schedule": "daily"
    }
]

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        added_count = 0
        for src_data in SEED_SOURCES:
            existing = db.query(Source).filter(Source.url == src_data["url"]).first()
            if not existing:
                src = Source(**src_data)
                db.add(src)
                added_count += 1
        db.commit()
        logger.info(f"Seeding completed. {added_count} new sources registered.")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
