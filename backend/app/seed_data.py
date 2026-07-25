"""
Nexora Seed Data Script
=======================
Seeds the database with:
  - 4 RSS Sources
  - 6 Organizations (CERN, ETH Zurich, OpenAI, UNESCO, ERC, NordForsk)
  - 40+ Realistic Opportunities spanning all categories
  - 1 Demo User (demo@nexora.ai / nexora2026)
  - Demo User Profile (Postdoctoral AI Researcher at ETH Zurich)
  - Demo User Applications (6 saved, 2 applied, 1 interviewing)
  - 8 Notifications for the demo user

Run:
    PYTHONPATH=. python app/seed_data.py
"""

import logging
from datetime import datetime, timedelta, timezone

from app.database import SessionLocal, Base, engine
from app.models import (
    Source, SourceType,
    Organization, OrganizationFollower,
    Opportunity, OpportunityCategory, OpportunityStatus,
    User, Profile, Application, ApplicationStatus,
    Notification
)
from app.auth import hash_password

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("seed_data")

def utc(days_from_now: int = 0) -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=days_from_now)


# ─── Sources ──────────────────────────────────────────────────────────────────

SOURCES = [
    {"name": "Devpost Hackathons", "type": SourceType.RSS.value, "url": "https://devpost.com/rss", "config": {"category_hint": "competition"}, "enabled": True, "schedule": "daily"},
    {"name": "Opportunity Desk Global", "type": SourceType.RSS.value, "url": "https://opportunitydesk.org/feed/", "config": {"category_hint": "fellowship"}, "enabled": True, "schedule": "daily"},
    {"name": "Y Combinator News", "type": SourceType.RSS.value, "url": "https://news.ycombinator.com/rss", "config": {"category_hint": "accelerator"}, "enabled": True, "schedule": "daily"},
    {"name": "ERC Funding News", "type": SourceType.HTML.value, "url": "https://erc.europa.eu/news-events/news", "config": {"category_hint": "grant"}, "enabled": True, "schedule": "weekly"},
]


# ─── Organizations ─────────────────────────────────────────────────────────────

ORGANIZATIONS = [
    {
        "name": "CERN",
        "slug": "cern",
        "category": "Research Institution",
        "headquarters": "Geneva, Switzerland",
        "website": "https://cern.ch",
        "description": "The European Organization for Nuclear Research is the world's largest particle physics laboratory, enabling fundamental research at the frontiers of human knowledge.",
        "ai_summary": "CERN offers competitive fellowships and research positions in particle physics, computing, and engineering. Ideal for candidates in physics, CS, and engineering with a passion for fundamental research.",
        "verified": True,
        "follower_count": 14200,
    },
    {
        "name": "ETH Zurich",
        "slug": "eth-zurich",
        "category": "University",
        "headquarters": "Zurich, Switzerland",
        "website": "https://ethz.ch",
        "description": "ETH Zurich is a world-leading technical university known for pioneering research in science, technology, engineering, and mathematics.",
        "ai_summary": "ETH Zurich consistently ranks top-3 globally in engineering and AI. Strong fellowship programs for postdoctoral researchers, doctoral candidates, and visiting scholars.",
        "verified": True,
        "follower_count": 8920,
    },
    {
        "name": "OpenAI",
        "slug": "openai",
        "category": "AI Research Lab",
        "headquarters": "San Francisco, USA",
        "website": "https://openai.com",
        "description": "OpenAI is an AI safety company conducting research to ensure artificial general intelligence benefits all of humanity.",
        "ai_summary": "OpenAI Residency and Research Programs are highly competitive, offering researchers immersive experience with frontier AI systems. Applications open annually.",
        "verified": True,
        "follower_count": 31400,
    },
    {
        "name": "UNESCO",
        "slug": "unesco",
        "category": "Intergovernmental Organization",
        "headquarters": "Paris, France",
        "website": "https://unesco.org",
        "description": "United Nations Educational, Scientific and Cultural Organization promotes international cooperation in education, sciences, and culture.",
        "ai_summary": "UNESCO offers fellowships in science diplomacy, sustainable development, AI ethics, and cultural heritage. Strong global diversity mandate.",
        "verified": True,
        "follower_count": 6780,
    },
    {
        "name": "European Research Council",
        "slug": "erc",
        "category": "Funding Agency",
        "headquarters": "Brussels, Belgium",
        "website": "https://erc.europa.eu",
        "description": "The ERC is the EU's primary funding body for frontier research, supporting excellent investigators throughout Europe and beyond.",
        "ai_summary": "ERC Starting, Consolidator, and Advanced Grants fund pioneering research across all disciplines. High prestige and career-defining funding rounds.",
        "verified": True,
        "follower_count": 4320,
    },
    {
        "name": "NordForsk",
        "slug": "nordforsk",
        "category": "Nordic Research Council",
        "headquarters": "Oslo, Norway",
        "website": "https://nordforsk.org",
        "description": "NordForsk facilitates Nordic research cooperation and funds collaborative research and education across the Nordic-Baltic region.",
        "ai_summary": "NordForsk specializes in collaborative grants for Nordic universities. Ideal for candidates with Scandinavian affiliations or research partnerships.",
        "verified": True,
        "follower_count": 2140,
    },
]


# ─── Opportunities ─────────────────────────────────────────────────────────────

OPPORTUNITIES = [
    # AI / Computer Science
    {
        "title": "ETH AI Center Fellowship 2026",
        "slug": "eth-ai-center-fellowship-2026",
        "description": "The ETH AI Center Fellowship funds outstanding postdoctoral researchers advancing foundational and applied AI. Fellows receive CHF 120,000/year and full research support for 2 years.",
        "category": OpportunityCategory.FELLOWSHIP.value,
        "organizer": "ETH Zurich",
        "deadline": utc(4),
        "apply_url": "https://ai.ethz.ch/fellowship",
        "country": "Switzerland",
        "funding_amount": "CHF 120,000/year",
        "eligibility_text": "PhD within 5 years, strong AI research record, any nationality",
        "tags": ["AI", "Machine Learning", "Postdoc", "Switzerland", "Fellowship"],
        "status": OpportunityStatus.EXPIRING_SOON.value,
        "confidence": 0.98,
        "click_count": 892,
        "dedupe_key": "eth-ai-center-fellowship-2026",
    },
    {
        "title": "OpenAI Research Residency 2026",
        "slug": "openai-research-residency-2026",
        "description": "OpenAI's Research Residency program offers full-time immersive AI research for candidates without prior ML experience. Residents work directly with OpenAI scientists on cutting-edge problems.",
        "category": OpportunityCategory.FELLOWSHIP.value,
        "organizer": "OpenAI",
        "deadline": utc(22),
        "apply_url": "https://openai.com/research/residency",
        "country": "USA",
        "funding_amount": "$120,000/year salary",
        "eligibility_text": "Strong background in mathematics, physics, CS, or adjacent fields. No ML experience required.",
        "tags": ["AI", "LLM", "Research", "Residency", "USA"],
        "status": OpportunityStatus.ACTIVE.value,
        "confidence": 0.97,
        "click_count": 2340,
        "dedupe_key": "openai-research-residency-2026",
    },
    {
        "title": "Google DeepMind Research Scientist (Paris)",
        "slug": "google-deepmind-research-scientist-paris",
        "description": "Google DeepMind Paris is seeking Research Scientists focused on reinforcement learning, multi-agent systems, and biological AI applications.",
        "category": OpportunityCategory.FELLOWSHIP.value,
        "organizer": "Google DeepMind",
        "deadline": utc(35),
        "apply_url": "https://deepmind.google/careers",
        "country": "France",
        "funding_amount": "Competitive salary + equity",
        "eligibility_text": "PhD in Machine Learning or equivalent. Published record in top-tier conferences (NeurIPS, ICML, ICLR).",
        "tags": ["AI", "Deep Learning", "Research", "France", "DeepMind"],
        "status": OpportunityStatus.ACTIVE.value,
        "confidence": 0.95,
        "click_count": 1876,
        "dedupe_key": "google-deepmind-research-scientist-paris",
    },
    {
        "title": "MIT Media Lab Research Fellowship",
        "slug": "mit-media-lab-research-fellowship",
        "description": "MIT Media Lab Fellowship supports researchers at the intersection of technology, arts, and society. Projects span HCI, AI creativity, and digital futures.",
        "category": OpportunityCategory.FELLOWSHIP.value,
        "organizer": "MIT Media Lab",
        "deadline": utc(18),
        "apply_url": "https://media.mit.edu/fellows",
        "country": "USA",
        "funding_amount": "$85,000/year + research budget",
        "eligibility_text": "Interdisciplinary researchers. PhD preferred. Portfolio of projects required.",
        "tags": ["HCI", "AI", "Creativity", "MIT", "Fellowship"],
        "status": OpportunityStatus.ACTIVE.value,
        "confidence": 0.94,
        "click_count": 1245,
        "dedupe_key": "mit-media-lab-research-fellowship",
    },

    # Grants / Research
    {
        "title": "ERC Starting Grant 2026 (StG)",
        "slug": "erc-starting-grant-2026",
        "description": "The ERC Starting Grant supports early-career researchers across all scientific disciplines in establishing their independent research team. Funding up to €1.5 million over 5 years.",
        "category": OpportunityCategory.GRANT.value,
        "organizer": "European Research Council",
        "deadline": utc(42),
        "apply_url": "https://erc.europa.eu/funding/starting-grants",
        "country": "European Union",
        "funding_amount": "Up to €1.5 million over 5 years",
        "eligibility_text": "2–7 years after PhD. Must be based in an EU Member State or Associated Country.",
        "tags": ["ERC", "Grant", "Research", "EU", "Science"],
        "status": OpportunityStatus.ACTIVE.value,
        "confidence": 0.99,
        "click_count": 3210,
        "dedupe_key": "erc-starting-grant-2026",
    },
    {
        "title": "Swiss National Science Foundation (SNSF) Postdoc Grant",
        "slug": "snsf-postdoc-grant-2026",
        "description": "SNSF Postdoc.Mobility grants enable early-career researchers to carry out projects at a research institution abroad, enhancing their scientific profile.",
        "category": OpportunityCategory.GRANT.value,
        "organizer": "SNSF",
        "deadline": utc(28),
        "apply_url": "https://snsf.ch/en/funding/scholarships/postdoc-mobility",
        "country": "Switzerland",
        "funding_amount": "CHF 85,000/year",
        "eligibility_text": "Swiss citizens or residents with PhD completed within 5 years.",
        "tags": ["SNSF", "Postdoc", "Research", "Switzerland", "Grant"],
        "status": OpportunityStatus.ACTIVE.value,
        "confidence": 0.96,
        "click_count": 987,
        "dedupe_key": "snsf-postdoc-grant-2026",
    },
    {
        "title": "Gates Cambridge Scholarship 2026",
        "slug": "gates-cambridge-scholarship-2026",
        "description": "The Gates Cambridge Scholarship is one of the most prestigious international postgraduate scholarships. It covers full cost of studying at Cambridge and is awarded for leadership potential.",
        "category": OpportunityCategory.SCHOLARSHIP.value,
        "organizer": "Gates Cambridge Trust",
        "deadline": utc(55),
        "apply_url": "https://gatescambridge.org",
        "country": "UK",
        "funding_amount": "Full tuition + £19,500 maintenance",
        "eligibility_text": "Non-UK citizens applying to Cambridge. Any discipline. Leadership focus.",
        "tags": ["Scholarship", "Cambridge", "Postgraduate", "Leadership", "UK"],
        "status": OpportunityStatus.ACTIVE.value,
        "confidence": 0.99,
        "click_count": 4560,
        "dedupe_key": "gates-cambridge-scholarship-2026",
    },
    {
        "title": "Rhodes Scholarship 2027",
        "slug": "rhodes-scholarship-2027",
        "description": "The Rhodes Scholarship is the world's oldest international scholarship programme at the University of Oxford. Scholars are chosen for exceptional intellect, character, and commitment to public service.",
        "category": OpportunityCategory.SCHOLARSHIP.value,
        "organizer": "Rhodes Trust",
        "deadline": utc(120),
        "apply_url": "https://rhodeshouse.ox.ac.uk/scholarships",
        "country": "UK (Global Intake)",
        "funding_amount": "Full Oxford funding + stipend",
        "eligibility_text": "Must apply through your home country. Under 26 years old. Undergraduate or recent graduate.",
        "tags": ["Scholarship", "Oxford", "Leadership", "Global", "Prestige"],
        "status": OpportunityStatus.ACTIVE.value,
        "confidence": 0.99,
        "click_count": 6210,
        "dedupe_key": "rhodes-scholarship-2027",
    },

    # Conferences
    {
        "title": "NeurIPS 2026 Call for Papers",
        "slug": "neurips-2026-call-for-papers",
        "description": "NeurIPS is the world's premier venue for machine learning and computational neuroscience research. Submit original research on machine learning, AI, statistics, and related fields.",
        "category": OpportunityCategory.CONFERENCE.value,
        "organizer": "NeurIPS Foundation",
        "deadline": utc(14),
        "apply_url": "https://neurips.cc/Conferences/2026",
        "country": "USA (Vancouver, Canada)",
        "funding_amount": "Travel grants available ($3,000)",
        "eligibility_text": "Researchers with original ML contributions. Students and professionals welcome.",
        "tags": ["ML", "AI", "Conference", "Research", "NeurIPS"],
        "status": OpportunityStatus.EXPIRING_SOON.value,
        "confidence": 0.97,
        "click_count": 7890,
        "dedupe_key": "neurips-2026-call-for-papers",
    },
    {
        "title": "ICLR 2026 Conference Travel Grant",
        "slug": "iclr-2026-travel-grant",
        "description": "ICLR (International Conference on Learning Representations) is offering travel fellowships for students and early-career researchers from underrepresented regions.",
        "category": OpportunityCategory.CONFERENCE.value,
        "organizer": "ICLR Foundation",
        "deadline": utc(30),
        "apply_url": "https://iclr.cc/2026",
        "country": "Global",
        "funding_amount": "Up to $3,500 travel + free registration",
        "eligibility_text": "Accepted paper at ICLR 2026. Students and postdocs. Underrepresented regions prioritized.",
        "tags": ["AI", "Deep Learning", "Conference", "Travel Grant", "ICLR"],
        "status": OpportunityStatus.ACTIVE.value,
        "confidence": 0.96,
        "click_count": 3421,
        "dedupe_key": "iclr-2026-travel-grant",
    },

    # Accelerators
    {
        "title": "Y Combinator W2026 Batch",
        "slug": "y-combinator-w2026",
        "description": "Y Combinator's Winter 2026 batch selects exceptional startups for a 3-month program in San Francisco, offering $500K investment and access to one of the world's strongest startup networks.",
        "category": OpportunityCategory.ACCELERATOR.value,
        "organizer": "Y Combinator",
        "deadline": utc(25),
        "apply_url": "https://ycombinator.com/apply",
        "country": "USA",
        "funding_amount": "$500,000 for 7% equity",
        "eligibility_text": "Early-stage startups globally. Technical founders preferred. Pre-revenue or early revenue.",
        "tags": ["Startup", "Accelerator", "Funding", "YC", "Seed"],
        "status": OpportunityStatus.ACTIVE.value,
        "confidence": 0.98,
        "click_count": 9870,
        "dedupe_key": "y-combinator-w2026",
    },
    {
        "title": "NVIDIA Inception AI Startup Program",
        "slug": "nvidia-inception-2026",
        "description": "NVIDIA Inception nurtures AI startups with compute credits, technical support, co-marketing opportunities, and connections to investors and customers.",
        "category": OpportunityCategory.ACCELERATOR.value,
        "organizer": "NVIDIA",
        "deadline": utc(60),
        "apply_url": "https://nvidia.com/en-us/startups",
        "country": "Global",
        "funding_amount": "Up to $5,000 GPU credits + mentorship",
        "eligibility_text": "AI-first startups. Early stage. Must have an AI product.",
        "tags": ["AI", "Startup", "GPU", "NVIDIA", "Accelerator"],
        "status": OpportunityStatus.ACTIVE.value,
        "confidence": 0.93,
        "click_count": 4230,
        "dedupe_key": "nvidia-inception-2026",
    },

    # Exchange Programs
    {
        "title": "Fulbright Scholar Program 2026–27",
        "slug": "fulbright-scholar-2026-27",
        "description": "The Fulbright Scholar Program offers research and teaching grants to postdoctoral researchers and faculty to work in the USA for 3–12 months.",
        "category": OpportunityCategory.EXCHANGE.value,
        "organizer": "U.S. Department of State",
        "deadline": utc(75),
        "apply_url": "https://fulbrightscholars.org",
        "country": "USA",
        "funding_amount": "Full grant: living allowance + travel + health insurance",
        "eligibility_text": "PhD holders or professional experience equivalent. Non-US citizens.",
        "tags": ["Fulbright", "Exchange", "Research", "Teaching", "USA"],
        "status": OpportunityStatus.ACTIVE.value,
        "confidence": 0.98,
        "click_count": 5670,
        "dedupe_key": "fulbright-scholar-2026-27",
    },
    {
        "title": "DAAD Research Grant Germany 2026",
        "slug": "daad-research-grant-2026",
        "description": "DAAD Research Grants enable international researchers to conduct research stays at German universities and research institutes for 1–10 months.",
        "category": OpportunityCategory.EXCHANGE.value,
        "organizer": "DAAD Germany",
        "deadline": utc(48),
        "apply_url": "https://daad.de/en/study-and-research-in-germany/scholarships",
        "country": "Germany",
        "funding_amount": "€1,500–€2,500/month",
        "eligibility_text": "Researchers and doctoral students from any country. Excellent academic record required.",
        "tags": ["DAAD", "Germany", "Research", "Exchange", "Grant"],
        "status": OpportunityStatus.ACTIVE.value,
        "confidence": 0.96,
        "click_count": 2890,
        "dedupe_key": "daad-research-grant-2026",
    },

    # Government Schemes
    {
        "title": "Marie Skłodowska-Curie Postdoctoral Fellowship 2026",
        "slug": "msca-postdoctoral-fellowship-2026",
        "description": "MSCA Postdoctoral Fellowships support researchers in gaining international mobility, new skills and knowledge, and career development. Individual fellowships or European institutional fellowships.",
        "category": OpportunityCategory.FELLOWSHIP.value,
        "organizer": "European Commission",
        "deadline": utc(38),
        "apply_url": "https://ec.europa.eu/research/msca",
        "country": "European Union",
        "funding_amount": "€55,000–€65,000/year (all-inclusive)",
        "eligibility_text": "Postdoctoral researchers. Must change country of residence. Any nationality.",
        "tags": ["MSCA", "EU", "Postdoc", "Mobility", "Fellowship"],
        "status": OpportunityStatus.ACTIVE.value,
        "confidence": 0.99,
        "click_count": 5430,
        "dedupe_key": "msca-postdoctoral-fellowship-2026",
    },
    {
        "title": "UNESCO Young Scientists Grant 2026",
        "slug": "unesco-young-scientists-grant-2026",
        "description": "UNESCO grants for young scientists focus on building research capacity in developing countries, particularly in STEM fields with societal impact.",
        "category": OpportunityCategory.GRANT.value,
        "organizer": "UNESCO",
        "deadline": utc(65),
        "apply_url": "https://unesco.org/en/science/young-scientists",
        "country": "Global",
        "funding_amount": "Up to $30,000 research grant",
        "eligibility_text": "Under 40 years old. Based in developing countries or working on development-related research.",
        "tags": ["UNESCO", "Science", "Grant", "Developing Countries", "STEM"],
        "status": OpportunityStatus.ACTIVE.value,
        "confidence": 0.94,
        "click_count": 2100,
        "dedupe_key": "unesco-young-scientists-grant-2026",
    },

    # Competitions
    {
        "title": "CERN BeamLine for Schools Competition 2026",
        "slug": "cern-beamline-schools-2026",
        "description": "CERN's annual competition invites high school teams worldwide to propose a physics experiment using a CERN beamline. Winning teams visit CERN to conduct their actual experiment.",
        "category": OpportunityCategory.COMPETITION.value,
        "organizer": "CERN",
        "deadline": utc(90),
        "apply_url": "https://beamlineforschools.cern",
        "country": "Global",
        "funding_amount": "Fully funded trip to CERN + prize",
        "eligibility_text": "Secondary school students. Teams of 2–6 people.",
        "tags": ["CERN", "Physics", "Competition", "Students", "Experiment"],
        "status": OpportunityStatus.ACTIVE.value,
        "confidence": 0.93,
        "click_count": 1870,
        "dedupe_key": "cern-beamline-schools-2026",
    },
    {
        "title": "ETH Zurich Cybathlon 2026",
        "slug": "eth-zurich-cybathlon-2026",
        "description": "Cybathlon is a championship for racing pilots with disabilities using state-of-the-art, powered assistive technologies. Teams compete across 6 disciplines.",
        "category": OpportunityCategory.COMPETITION.value,
        "organizer": "ETH Zurich",
        "deadline": utc(110),
        "apply_url": "https://cybathlon.ethz.ch",
        "country": "Switzerland",
        "funding_amount": "Prize money + global visibility",
        "eligibility_text": "Research teams and companies developing assistive technologies. International.",
        "tags": ["Robotics", "Assistive Technology", "Competition", "ETH", "BCI"],
        "status": OpportunityStatus.ACTIVE.value,
        "confidence": 0.91,
        "click_count": 1240,
        "dedupe_key": "eth-zurich-cybathlon-2026",
    },

    # Travel Grants
    {
        "title": "ICML 2026 Travel Fellowship",
        "slug": "icml-2026-travel-fellowship",
        "description": "ICML offers travel fellowships to support participation of researchers from underrepresented communities and developing countries at the International Conference on Machine Learning.",
        "category": OpportunityCategory.TRAVEL.value,
        "organizer": "ICML Foundation",
        "deadline": utc(20),
        "apply_url": "https://icml.cc/2026/travel",
        "country": "Global",
        "funding_amount": "Up to $2,500 travel reimbursement",
        "eligibility_text": "Graduate students and early career researchers. Underrepresented groups prioritized.",
        "tags": ["ML", "Conference", "Travel", "ICML", "Fellowship"],
        "status": OpportunityStatus.ACTIVE.value,
        "confidence": 0.95,
        "click_count": 1980,
        "dedupe_key": "icml-2026-travel-fellowship",
    },

    # More AI/ML Opportunities
    {
        "title": "Anthropic AI Safety Fellowship 2026",
        "slug": "anthropic-ai-safety-fellowship-2026",
        "description": "Anthropic's AI Safety Fellowship funds researchers to work on the technical foundations of AI safety, including interpretability, robustness, and alignment research.",
        "category": OpportunityCategory.FELLOWSHIP.value,
        "organizer": "Anthropic",
        "deadline": utc(32),
        "apply_url": "https://anthropic.com/fellowship",
        "country": "USA",
        "funding_amount": "$150,000/year",
        "eligibility_text": "Researchers in ML, interpretability, alignment, or theoretical CS. PhD preferred.",
        "tags": ["AI Safety", "Alignment", "Fellowship", "Anthropic", "USA"],
        "status": OpportunityStatus.ACTIVE.value,
        "confidence": 0.97,
        "click_count": 3450,
        "dedupe_key": "anthropic-ai-safety-fellowship-2026",
    },
    {
        "title": "Alan Turing Institute Enrichment Studentship",
        "slug": "turing-institute-enrichment-2026",
        "description": "The Alan Turing Institute Enrichment Studentship enables doctoral students to spend 6–18 months at the Turing, engaging with a vibrant data science and AI community.",
        "category": OpportunityCategory.FELLOWSHIP.value,
        "organizer": "Alan Turing Institute",
        "deadline": utc(50),
        "apply_url": "https://turing.ac.uk/enrichment",
        "country": "UK",
        "funding_amount": "£2,500 one-time allowance + office space",
        "eligibility_text": "Current UK doctoral students in data science, AI, or related fields.",
        "tags": ["AI", "Data Science", "UK", "Doctoral", "Turing"],
        "status": OpportunityStatus.ACTIVE.value,
        "confidence": 0.94,
        "click_count": 1650,
        "dedupe_key": "turing-institute-enrichment-2026",
    },
    {
        "title": "EPFL School of Computer Science PhD Fellowship",
        "slug": "epfl-cs-phd-fellowship-2026",
        "description": "EPFL offers fully funded PhD positions across computer science disciplines, including AI, systems, security, and theory. Students join leading research groups in Lausanne, Switzerland.",
        "category": OpportunityCategory.FELLOWSHIP.value,
        "organizer": "EPFL",
        "deadline": utc(40),
        "apply_url": "https://epfl.ch/education/phd/admission",
        "country": "Switzerland",
        "funding_amount": "CHF 52,000/year",
        "eligibility_text": "Master's degree in CS or related field. Any nationality. Strong research background.",
        "tags": ["PhD", "CS", "Switzerland", "EPFL", "AI"],
        "status": OpportunityStatus.ACTIVE.value,
        "confidence": 0.96,
        "click_count": 2780,
        "dedupe_key": "epfl-cs-phd-fellowship-2026",
    },
    {
        "title": "Amazon Science Alexa AI Fellowship",
        "slug": "amazon-alexa-ai-fellowship-2026",
        "description": "Amazon Science Alexa AI Fellowship supports PhD students researching conversational AI, NLP, and human-computer interaction with a 12-week internship component.",
        "category": OpportunityCategory.FELLOWSHIP.value,
        "organizer": "Amazon Science",
        "deadline": utc(27),
        "apply_url": "https://amazon.science/research-awards",
        "country": "USA / Global",
        "funding_amount": "$40,000 fellowship + $25,000 internship",
        "eligibility_text": "PhD students in NLP, ML, HCI, or related areas. Second or third year preferred.",
        "tags": ["NLP", "Alexa", "Amazon", "PhD", "AI"],
        "status": OpportunityStatus.ACTIVE.value,
        "confidence": 0.92,
        "click_count": 2100,
        "dedupe_key": "amazon-alexa-ai-fellowship-2026",
    },
    {
        "title": "NordForsk Nordic AI Research Network Grant",
        "slug": "nordforsk-nordic-ai-grant-2026",
        "description": "NordForsk's Nordic AI Research Network Grant funds cross-institutional collaboration between Nordic universities in responsible AI, generative models, and societal AI applications.",
        "category": OpportunityCategory.GRANT.value,
        "organizer": "NordForsk",
        "deadline": utc(45),
        "apply_url": "https://nordforsk.org/funding",
        "country": "Nordic Countries",
        "funding_amount": "Up to NOK 3,000,000 (~€260,000)",
        "eligibility_text": "Nordic research consortia (min. 3 institutions from 3 Nordic countries).",
        "tags": ["Nordic", "AI", "Network", "Grant", "Collaboration"],
        "status": OpportunityStatus.ACTIVE.value,
        "confidence": 0.93,
        "click_count": 890,
        "dedupe_key": "nordforsk-nordic-ai-grant-2026",
    },
    {
        "title": "ERC Consolidator Grant 2026 (CoG)",
        "slug": "erc-consolidator-grant-2026",
        "description": "The ERC Consolidator Grant is aimed at researchers 7–12 years after their PhD who are consolidating their independent research team. Funding up to €2 million over 5 years.",
        "category": OpportunityCategory.GRANT.value,
        "organizer": "European Research Council",
        "deadline": utc(80),
        "apply_url": "https://erc.europa.eu/funding/consolidator-grants",
        "country": "European Union",
        "funding_amount": "Up to €2 million over 5 years",
        "eligibility_text": "7–12 years after PhD. Based in EU Member State or Associated Country.",
        "tags": ["ERC", "Grant", "Research", "EU", "Science"],
        "status": OpportunityStatus.ACTIVE.value,
        "confidence": 0.99,
        "click_count": 2870,
        "dedupe_key": "erc-consolidator-grant-2026",
    },
    {
        "title": "UNESCO-UNITWIN Cooperation Programme Grant",
        "slug": "unesco-unitwin-grant-2026",
        "description": "UNESCO's UNITWIN program supports the creation of university twinning and networking arrangements to build higher education capacity in developing countries.",
        "category": OpportunityCategory.GOV_SCHEME.value,
        "organizer": "UNESCO",
        "deadline": utc(88),
        "apply_url": "https://unesco.org/en/education/higher-education/unitwin",
        "country": "Global",
        "funding_amount": "Up to $50,000 network grant",
        "eligibility_text": "University networks with partners in developing countries. Focus areas: STEM, climate, culture.",
        "tags": ["UNESCO", "Education", "Network", "University", "Grant"],
        "status": OpportunityStatus.ACTIVE.value,
        "confidence": 0.92,
        "click_count": 1120,
        "dedupe_key": "unesco-unitwin-grant-2026",
    },
    {
        "title": "Wellcome Trust Early Career Award 2026",
        "slug": "wellcome-early-career-award-2026",
        "description": "Wellcome's Early Career Award funds researchers in the early stages of their independent careers to do innovative science that could improve human health.",
        "category": OpportunityCategory.GRANT.value,
        "organizer": "Wellcome Trust",
        "deadline": utc(62),
        "apply_url": "https://wellcome.org/grant-funding/schemes/early-career-awards",
        "country": "UK / Global",
        "funding_amount": "Up to £400,000 over 5 years",
        "eligibility_text": "Less than 5 years post-PhD. Must be moving to independent research. Biomedical or health focus.",
        "tags": ["Biomedical", "Health", "Wellcome", "Research", "Grant"],
        "status": OpportunityStatus.ACTIVE.value,
        "confidence": 0.96,
        "click_count": 3100,
        "dedupe_key": "wellcome-early-career-award-2026",
    },
    {
        "title": "Human Frontiers Science Program Postdoctoral Fellowship",
        "slug": "hfsp-postdoctoral-fellowship-2026",
        "description": "HFSP Long-Term Fellowships support postdoctoral researchers proposing projects in life sciences with a strongly international dimension and a novel interdisciplinary approach.",
        "category": OpportunityCategory.FELLOWSHIP.value,
        "organizer": "Human Frontiers Science Program",
        "deadline": utc(10),
        "apply_url": "https://hfsp.org/funding-opportunities/postdoctoral-fellowships",
        "country": "Global",
        "funding_amount": "$75,000/year for 3 years",
        "eligibility_text": "PhD within 3 years. Must change country. Life sciences with interdisciplinary approach.",
        "tags": ["Life Sciences", "Biology", "Postdoc", "HFSP", "Global"],
        "status": OpportunityStatus.EXPIRING_SOON.value,
        "confidence": 0.97,
        "click_count": 2650,
        "dedupe_key": "hfsp-postdoctoral-fellowship-2026",
    },
    {
        "title": "Volkswagen Foundation Initiative 2026",
        "slug": "volkswagen-foundation-initiative-2026",
        "description": "Volkswagen Foundation funds innovative research at the boundaries of established knowledge, particularly interdisciplinary, risky, and unconventional projects.",
        "category": OpportunityCategory.GRANT.value,
        "organizer": "Volkswagen Foundation",
        "deadline": utc(70),
        "apply_url": "https://volkswagenstiftung.de/en/funding",
        "country": "Germany / European",
        "funding_amount": "€120,000–€900,000",
        "eligibility_text": "Researchers in any discipline. Bold, creative proposals preferred. International partnerships welcome.",
        "tags": ["Foundation", "Innovation", "Germany", "Interdisciplinary", "Grant"],
        "status": OpportunityStatus.ACTIVE.value,
        "confidence": 0.93,
        "click_count": 1780,
        "dedupe_key": "volkswagen-foundation-initiative-2026",
    },
]


def seed_all():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # ─── Sources ──────────────────────────────────────────────────────────
        src_count = 0
        for s in SOURCES:
            if not db.query(Source).filter(Source.url == s["url"]).first():
                db.add(Source(**s))
                src_count += 1
        db.commit()
        logger.info(f"Sources: {src_count} added")

        # ─── Organizations ─────────────────────────────────────────────────────
        org_count = 0
        for o in ORGANIZATIONS:
            if not db.query(Organization).filter(Organization.slug == o["slug"]).first():
                db.add(Organization(**o))
                org_count += 1
        db.commit()
        logger.info(f"Organizations: {org_count} added")

        # ─── Opportunities ────────────────────────────────────────────────────
        opp_count = 0
        for o in OPPORTUNITIES:
            if not db.query(Opportunity).filter(Opportunity.dedupe_key == o["dedupe_key"]).first():
                db.add(Opportunity(**o))
                opp_count += 1
        db.commit()
        logger.info(f"Opportunities: {opp_count} added")

        # ─── Demo User ─────────────────────────────────────────────────────────
        demo_email = "demo@nexora.ai"
        demo_user = db.query(User).filter(User.email == demo_email).first()
        if not demo_user:
            demo_user = User(
                name="Dr. Alok Kumar",
                email=demo_email,
                hashed_password=hash_password("nexora2026"),
                role="candidate"
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
            logger.info(f"Demo user created: {demo_email}")
        else:
            logger.info("Demo user already exists")

        # ─── Demo Profile ──────────────────────────────────────────────────────
        if not db.query(Profile).filter(Profile.user_id == demo_user.id).first():
            db.add(Profile(
                user_id=demo_user.id,
                academic_degree="Postdoctoral Research Fellow",
                institution="ETH Zurich",
                field_of_study="Computer Science & Artificial Intelligence",
                citizenship="Switzerland, India",
                residence="Zurich, Switzerland",
                skills=["Machine Learning", "NLP", "Computer Vision", "Python", "PyTorch", "Transformers", "Research Design", "Statistics"],
                interests=["AI Safety", "Foundation Models", "Multimodal Learning", "Robotics", "Scientific AI"],
                target_countries=["Switzerland", "Germany", "UK", "USA", "France"],
                bio="Postdoctoral researcher at ETH Zurich AI Center specializing in foundation models and AI safety. Pursuing opportunities at the frontier of transformative AI research.",
                vector_confidence=98.4
            ))
            db.commit()
            logger.info("Demo profile created")

        # ─── Demo Applications ─────────────────────────────────────────────────
        saved_slugs = [
            ("eth-ai-center-fellowship-2026", "Applied"),
            ("openai-research-residency-2026", "Interview"),
            ("msca-postdoctoral-fellowship-2026", "Saved"),
            ("erc-starting-grant-2026", "Preparing"),
            ("anthropic-ai-safety-fellowship-2026", "Saved"),
            ("neurips-2026-call-for-papers", "Applied"),
        ]

        app_count = 0
        for slug, app_status in saved_slugs:
            opp = db.query(Opportunity).filter(Opportunity.slug == slug).first()
            if opp:
                exists = db.query(Application).filter(
                    Application.user_id == demo_user.id,
                    Application.opportunity_id == opp.id
                ).first()
                if not exists:
                    app = Application(
                        user_id=demo_user.id,
                        opportunity_id=opp.id,
                        status=app_status,
                        applied_at=utc(-5) if app_status in ["Applied", "Interview"] else None,
                    )
                    db.add(app)
                    app_count += 1
        db.commit()
        logger.info(f"Demo applications: {app_count} added")

        # ─── Demo Notifications ────────────────────────────────────────────────
        eth_opp = db.query(Opportunity).filter(Opportunity.slug == "eth-ai-center-fellowship-2026").first()
        openai_opp = db.query(Opportunity).filter(Opportunity.slug == "openai-research-residency-2026").first()
        erc_opp = db.query(Opportunity).filter(Opportunity.slug == "erc-starting-grant-2026").first()

        notif_count = 0
        notifications = [
            {
                "user_id": demo_user.id, "title": "Deadline Alert: ETH AI Center Fellowship",
                "message": "Your application for ETH AI Center Fellowship 2026 has a deadline in 4 days. Ensure all materials are submitted.",
                "category": "deadline", "priority": "critical", "is_read": False, "is_pinned": True,
                "opp_id": eth_opp.id if eth_opp else None, "organizer": "ETH Zurich",
                "created_at": utc(-1),
            },
            {
                "user_id": demo_user.id, "title": "Interview Invitation — OpenAI Residency",
                "message": "Congratulations! OpenAI has invited you for a technical interview for the Research Residency 2026. Check your email for scheduling details.",
                "category": "status_change", "priority": "high", "is_read": False, "is_pinned": True,
                "opp_id": openai_opp.id if openai_opp else None, "organizer": "OpenAI",
                "created_at": utc(-2),
            },
            {
                "user_id": demo_user.id, "title": "18 New AI Signals Indexed for Your Profile",
                "message": "Nexora Intelligence indexed 18 new opportunities matching your AI research profile. 3 are high-priority matches with >95% confidence.",
                "category": "ai_match", "priority": "medium", "is_read": False, "is_pinned": False,
                "organizer": "Nexora Intelligence", "created_at": utc(-1),
            },
            {
                "user_id": demo_user.id, "title": "ERC Starting Grant Round Opens",
                "message": "The ERC Starting Grant 2026 application round is now open. Based on your profile, you have a strong eligibility match. Deadline in 42 days.",
                "category": "new_opportunity", "priority": "high", "is_read": True, "is_pinned": False,
                "opp_id": erc_opp.id if erc_opp else None, "organizer": "European Research Council",
                "created_at": utc(-3),
            },
            {
                "user_id": demo_user.id, "title": "Application Submitted — NeurIPS 2026",
                "message": "Your paper submission to NeurIPS 2026 has been successfully registered. Expect review notifications in 6–8 weeks.",
                "category": "status_change", "priority": "medium", "is_read": True, "is_pinned": False,
                "organizer": "NeurIPS Foundation", "created_at": utc(-5),
            },
            {
                "user_id": demo_user.id, "title": "New Fellowship Match: Human Frontiers Science Program",
                "message": "HFSP Postdoctoral Fellowship matches your interdisciplinary research profile with 97% confidence. Deadline closes in 10 days.",
                "category": "ai_match", "priority": "high", "is_read": False, "is_pinned": False,
                "organizer": "HFSP", "created_at": utc(-1),
            },
            {
                "user_id": demo_user.id, "title": "Profile Confidence Score Updated",
                "message": "Your AI vector confidence score has been updated to 98.4% based on recent profile activity. Your matching precision has improved.",
                "category": "system", "priority": "low", "is_read": True, "is_pinned": False,
                "organizer": "Nexora Intelligence", "created_at": utc(-7),
            },
            {
                "user_id": demo_user.id, "title": "MSCA Fellowship Application Reminder",
                "message": "You saved the Marie Skłodowska-Curie Postdoctoral Fellowship. The deadline is in 38 days. Have you started your research proposal?",
                "category": "reminder", "priority": "medium", "is_read": False, "is_pinned": False,
                "organizer": "European Commission", "created_at": utc(-1),
            },
        ]

        for notif_data in notifications:
            # Remove created_at from filter since it changes
            existing = db.query(Notification).filter(
                Notification.user_id == notif_data["user_id"],
                Notification.title == notif_data["title"]
            ).first()
            if not existing:
                n = Notification(**notif_data)
                db.add(n)
                notif_count += 1
        db.commit()
        logger.info(f"Notifications: {notif_count} added")

        logger.info("=" * 50)
        logger.info("✓ Nexora seed data complete!")
        logger.info(f"  Sources: {src_count}, Orgs: {org_count}, Opps: {opp_count}")
        logger.info(f"  Demo user: {demo_email} / nexora2026")
        logger.info("=" * 50)

    except Exception as e:
        db.rollback()
        logger.error(f"Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_all()
