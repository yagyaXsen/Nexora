import sys
import os
sys.path.append(os.getcwd())
from app.database import SessionLocal
from app.models import Opportunity

db = SessionLocal()
count = db.query(Opportunity).delete()
db.commit()
db.close()
print(f"Successfully deleted {count} old opportunities from the database!")
