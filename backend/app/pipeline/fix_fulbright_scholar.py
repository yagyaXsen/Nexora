"""
Fix Fulbright Scholar (ID 13):
- ID 13: Change to Fulbright Visiting Scholar Program (Non-US scholars coming TO USA)
- Add new: Fulbright US Scholar Program (US scholars going ABROAD)
Run: PYTHONPATH=. python app/pipeline/fix_fulbright_scholar.py
"""
import sys
sys.path.insert(0, '.')

from app.database import SessionLocal
from app.models import Opportunity, OpportunityCategory, OpportunityStatus
from datetime import datetime, timezone

db = SessionLocal()

# ── Fix ID 13: Fulbright Visiting Scholar (Non-US → USA) ─────────────────────
visiting = db.query(Opportunity).filter(Opportunity.id == 13).first()
visiting.title = 'Fulbright Visiting Scholar Program 2026-27 (Non-US Scholars)'
visiting.apply_url = 'https://fulbrightscholars.org/non-us-scholars'
visiting.description = (
    "The Fulbright Visiting Scholar Program brings approximately 900 faculty and professionals "
    "from around the world to US universities and research institutions for advanced research "
    "and university lecturing. Individual grants are available to scholars from over 100 countries. "
    "Awards cover round-trip travel, living stipend, health insurance, and research allowance. "
    "Duration is typically one semester or one full academic year. "
    "Apply through the Fulbright Commission or US Embassy Public Affairs section in your home country."
)
visiting.eligibility_text = (
    "Non-US citizens. PhD or equivalent professional expertise required. "
    "Must apply through the Fulbright Commission or US Embassy in home country. "
    "Excellent academic record and demonstrated leadership. "
    "Open to all disciplines including STEM, social sciences, humanities, arts, and professional fields."
)
visiting.tags = ['Fulbright', 'VisitingScholar', 'USA', 'Research', 'Teaching', 'NonUS', 'FullyFunded']
print(f"Updated [13] {visiting.title}")

# ── Create new: Fulbright US Scholar Program (US scholars → Abroad) ──────────
existing = db.query(Opportunity).filter(
    Opportunity.title.ilike('%Fulbright US Scholar%')
).first()

if existing:
    print(f"US Scholar already exists as ID {existing.id}, updating...")
    us_scholar = existing
else:
    us_scholar = Opportunity()
    db.add(us_scholar)
    print("Creating new US Scholar opportunity...")

us_scholar.title = 'Fulbright U.S. Scholar Program 2026-27 (US Citizens Abroad)'
us_scholar.slug = 'fulbright-us-scholar-program-2026-27'

# Ensure slug unique
counter = 1
existing_slug = db.query(Opportunity).filter(
    Opportunity.slug == us_scholar.slug,
    Opportunity.id != (us_scholar.id if us_scholar.id else -1)
).first()
while existing_slug:
    us_scholar.slug = f'fulbright-us-scholar-program-2026-27-{counter}'
    counter += 1
    existing_slug = db.query(Opportunity).filter(
        Opportunity.slug == us_scholar.slug,
        Opportunity.id != (us_scholar.id if us_scholar.id else -1)
    ).first()

us_scholar.description = (
    "The Fulbright U.S. Scholar Program sends over 800 American scholars and professionals "
    "to more than 120 countries annually to teach, conduct research, and carry out professional projects. "
    "Eligible applicants include college and university faculty, research professionals, artists, and practitioners. "
    "Awards cover international travel, living stipend, health insurance, and professional development funds. "
    "Duration ranges from a few weeks to a full academic year depending on the country and award type. "
    "Join the 450,000+ Fulbrighters who have strengthened global connections and advanced their careers."
)
us_scholar.category = OpportunityCategory.EXCHANGE.value
us_scholar.organizer = 'U.S. Department of State'
us_scholar.country = '120+ Countries Worldwide'
us_scholar.funding_amount = 'Full grant: travel + living stipend + health insurance'
us_scholar.apply_url = 'https://fulbrightscholars.org/us-scholar-awards'
us_scholar.eligibility_text = (
    "US citizens only. College/university faculty, research professionals, artists, and practitioners. "
    "Must demonstrate excellence and leadership in their field. "
    "Available in 120+ countries across all disciplines. "
    "Apply directly via fulbrightscholars.org. Each country has specific requirements and deadlines."
)
us_scholar.tags = ['Fulbright', 'USScholar', 'USCitizen', 'Research', 'Teaching', 'International', 'Exchange']
us_scholar.deadline = datetime(2026, 10, 7, tzinfo=timezone.utc)
us_scholar.status = OpportunityStatus.ACTIVE.value
us_scholar.confidence = 0.98
us_scholar.needs_review = False
us_scholar.dedupe_key = 'fulbrightscholars.org/us-scholar-awards'

db.commit()
db.refresh(us_scholar)
print(f"Saved [ID {us_scholar.id}] {us_scholar.title}")

# ── Also check SNSF (ID 6) — points to generic 'get-a-grant' ─────────────────
# The actual Postdoc.Mobility page is at a different URL — let's find it
print()
print("Checking SNSF Postdoc.Mobility specific URL...")
db.close()

from app.pipeline.fetcher import _fetch_page
page = _fetch_page('https://www.snf.ch/en/funding/careers/postdoc-mobility')
if page and len(page.text) > 200:
    titles = page._soup.css('title')
    print(f"SNSF Postdoc.Mobility URL works: {titles[0].text if titles else 'no title'}")
else:
    # Try alternate URL
    page2 = _fetch_page('https://www.snf.ch/en/msYa7rLn4sSyHjd1/funding/careers/postdoc-mobility')
    if page2 and len(page2.text) > 200:
        titles2 = page2._soup.css('title')
        print(f"Alternate URL: {titles2[0].text if titles2 else 'no title'}")
    else:
        print("SNSF Postdoc.Mobility specific page not found — current generic URL is best available")

print("\nDone.")
