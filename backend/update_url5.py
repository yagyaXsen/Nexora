import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database import SessionLocal
from app.models import ScrapedSource

db = SessionLocal()
sources = db.query(ScrapedSource).all()
if sources:
    sources[0].url = "https://unstop.com/internship?oppstatus=open"
    sources[0].name = "Unstop (Open Internships)"
    db.commit()
    print("Updated database to use Unstop Open Internships!")
else:
    print("No sources found.")
db.close()
