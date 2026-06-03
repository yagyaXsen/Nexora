import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database import SessionLocal
from app.models import Opportunity, Application

db = SessionLocal()
db.query(Application).delete()
db.query(Opportunity).delete()
db.commit()
print("Wiped fake opportunities and tracker applications!")
db.close()
