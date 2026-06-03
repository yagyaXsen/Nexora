from app.database import SessionLocal
from app import schemas, crud

db = SessionLocal()
new_src = schemas.ScrapedSourceCreate(
    name="ProFellow (Global Fellowships)",
    url="https://www.profellow.com/fellowships",
    scraper_type="playwright_html"
)
crud.create_scraped_source(db, new_src)
db.close()
print("New source added successfully!")
