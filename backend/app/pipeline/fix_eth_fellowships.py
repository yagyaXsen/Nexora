"""
Fix ETH AI Center fellowships:
1. Update ID 45 (Doctoral) with correct URL and exact salary
2. Create new opportunity for Postdoctoral fellowship
Run: PYTHONPATH=. python app/pipeline/fix_eth_fellowships.py
"""
import sys
sys.path.insert(0, '.')

from app.database import SessionLocal
from app.models import Opportunity, OpportunityCategory, OpportunityStatus
from datetime import datetime, timezone

db = SessionLocal()

# ── 1. Fix Doctoral (ID 45) ─────────────────────────────────────────────────
doctoral = db.query(Opportunity).filter(Opportunity.id == 45).first()
doctoral.title = 'ETH AI Center Doctoral Fellowship 2026'
doctoral.apply_url = 'https://ai.ethz.ch/research/phd-and-postdoc-programs/phd-fellowships.html'
doctoral.funding_amount = 'CHF 73,100 yr1 / 78,300 yr2 / 83,500 yr3'
doctoral.description = (
    "The ETH AI Center Doctoral Fellowship is one of Europe's premier PhD programs for interdisciplinary AI research. "
    "5 to 8 positions offered annually with flexible start dates, typically September. "
    "Fellows work on self-proposed research projects co-supervised by two ETH professors from different fields, "
    "bridging AI foundations with applications in medicine, robotics, architecture, or social sciences. "
    "Office at the ETH AI Center in Zurich. Transparent salary with automatic annual advancement. "
    "Optional entrepreneurial or industry track available to build real-world impact. "
    "Application portal opens September 2026."
)
doctoral.eligibility_text = (
    "Completed or near-completing an MSc in Computer Science, Machine Learning, Statistics, Physics, "
    "Engineering, Applied Mathematics, or related field. "
    "Excellent academic track record required. Must meet ETH Zurich general doctorate admission requirements. "
    "Strong English proficiency. Open to all nationalities. "
    "Must identify two co-supervisors from ETH AI Center faculty (120+ professors across all ETH departments) before applying."
)
doctoral.tags = ['ETHZurich', 'AI', 'MachineLearning', 'Doctoral', 'PhD', 'Switzerland', 'Interdisciplinary']
print(f"Updated [45] {doctoral.title}")
print(f"  Salary: {doctoral.funding_amount}")
print(f"  URL: {doctoral.apply_url}")

# ── 2. Create Postdoctoral (new) ─────────────────────────────────────────────
existing = db.query(Opportunity).filter(
    Opportunity.title.ilike('%ETH AI Center Postdoctoral%')
).first()

if existing:
    print(f"Postdoctoral already exists as ID {existing.id}, updating...")
    postdoc = existing
else:
    postdoc = Opportunity()
    db.add(postdoc)
    print("Creating new Postdoctoral opportunity...")

postdoc.title = 'ETH AI Center Postdoctoral Fellowship 2026'
postdoc.slug = 'eth-ai-center-postdoctoral-fellowship-2026'

# Ensure slug unique
counter = 1
existing_slug = db.query(Opportunity).filter(
    Opportunity.slug == postdoc.slug,
    Opportunity.id != (postdoc.id if postdoc.id else -1)
).first()
while existing_slug:
    postdoc.slug = f'eth-ai-center-postdoctoral-fellowship-2026-{counter}'
    counter += 1
    existing_slug = db.query(Opportunity).filter(
        Opportunity.slug == postdoc.slug,
        Opportunity.id != (postdoc.id if postdoc.id else -1)
    ).first()

postdoc.description = (
    "The ETH AI Center Postdoctoral Fellowship gives highly motivated researchers with excellent track records "
    "the opportunity to conduct research with real impact at the frontier of AI. "
    "5 to 8 positions per cohort, 2-year duration with flexible start date typically in September. "
    "Fellows propose their own research project, co-supervised by two ETH AI Center professors from different fields. "
    "Salary: CHF 92,500 in year 1 and CHF 97,200 in year 2, with 5 weeks vacation, "
    "4 months paid maternity leave, 10 days paternity leave, and subsidised on-campus childcare. "
    "A recognised stepping stone to R&D lab leadership, faculty positions, or deep-tech startups. "
    "Application portal opens September 2026."
)
postdoc.category = OpportunityCategory.FELLOWSHIP.value
postdoc.organizer = 'ETH Zurich'
postdoc.country = 'Switzerland'
postdoc.funding_amount = 'CHF 92,500 yr1 / 97,200 yr2'
postdoc.apply_url = 'https://ai.ethz.ch/research/phd-and-postdoc-programs/postdoc-fellowships.html'
postdoc.eligibility_text = (
    "PhD completed or near completion in Computer Science, Machine Learning, Statistics, Physics, "
    "Engineering, or related fields. Excellent publication record required. "
    "Must identify two co-supervisors from ETH AI Center faculty (120+ professors across all ETH departments). "
    "Open to all nationalities. Strong English required. "
    "Application portal opens September 2026 at ai.ethz.ch."
)
postdoc.tags = ['ETHZurich', 'AI', 'MachineLearning', 'Postdoc', 'Switzerland', 'Interdisciplinary', 'Research']
postdoc.deadline = datetime(2026, 9, 23, tzinfo=timezone.utc)
postdoc.status = OpportunityStatus.ACTIVE.value
postdoc.confidence = 0.98
postdoc.needs_review = False
postdoc.dedupe_key = 'ai.ethz.ch/research/phd-and-postdoc-programs/postdoc-fellowships.html'

db.commit()
db.refresh(postdoc)
print(f"Saved [ID {postdoc.id}] {postdoc.title}")
print(f"  Salary: {postdoc.funding_amount}")
print(f"  URL: {postdoc.apply_url}")

# ── 3. Verify both ───────────────────────────────────────────────────────────
print()
print("Final ETH AI Center opportunities:")
eth_opps = db.query(Opportunity).filter(
    Opportunity.organizer == 'ETH Zurich'
).all()
for o in eth_opps:
    print(f"  [{o.id}] {o.title}")
    print(f"        Funding : {o.funding_amount}")
    print(f"        URL     : {o.apply_url}")

db.close()
print("\nDone.")
