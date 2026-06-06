import sys
import os

# Adjust paths to import backend app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import ScrapedSource, Opportunity

def main():
    db = SessionLocal()
    try:
        print("Starting Unstop cleanup from the database...")

        # 1. Delete Scraped Sources matching Unstop
        sources_to_delete = db.query(ScrapedSource).filter(
            (ScrapedSource.url.like("%unstop.com%")) | 
            (ScrapedSource.name.like("%Unstop%"))
        ).all()
        
        sources_count = len(sources_to_delete)
        for s in sources_to_delete:
            print(f"Deleting ScrapedSource: {s.name} ({s.url})")
            db.delete(s)

        # 2. Delete Opportunities matching Unstop
        opportunities_to_delete = db.query(Opportunity).filter(
            (Opportunity.url.like("%unstop.com%")) |
            (Opportunity.organization.like("%Unstop%"))
        ).all()

        opportunities_count = len(opportunities_to_delete)
        for o in opportunities_to_delete:
            print(f"Deleting Opportunity: {o.title} from {o.organization}")
            db.delete(o)

        db.commit()
        print("\nCleanup Completed successfully!")
        print(f"Removed {sources_count} source(s).")
        print(f"Removed {opportunities_count} opportunity/opportunities.")
        
    except Exception as e:
        db.rollback()
        print(f"An error occurred during cleanup: {e}", file=sys.stderr)
    finally:
        db.close()

if __name__ == "__main__":
    main()
