import sys
import os
import random
from datetime import date, timedelta

# Ensure the app path is in sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import Opportunity

# Define high-fidelity templates for realistic opportunity generation
ORGANIZATIONS = [
    "Google DeepMind", "Microsoft Research", "Meta AI Research", "OpenAI Foundation",
    "MIT Media Lab", "Stanford School of Engineering", "Harvard Kennedy School",
    "Y Combinator", "Techstars Global", "Sequoia Capital Founders", "NSF (National Science Foundation)",
    "European Research Council", "Bill & Melinda Gates Foundation", "Wellcome Trust",
    "Knight Foundation", "Thiel Foundation", "CERN Science Division", "NASA Space Tech",
    "WHO Innovation Hub", "UNICEF Youth Ventures", "Rotary International", "Schmidt Futures",
    "Ford Foundation", "Amina Venture Group", "Earth Alliance Foundation", "Global AI Foundation",
    "Global Educational Institute", "Chevron Climate Tech", "Oxford Martin School",
    "Singapore Enterprise Agency", "SoftBank Vision Fund Hub", "Andreessen Horowitz Alpha",
    "Biomedical Research Center", "Tech Climbers Europe", "Berkeley AI Lab"
]

SUBJECTS = [
    {"name": "Artificial Intelligence", "tags": ["AI", "Machine Learning", "Tech", "Research"]},
    {"name": "Climate & CleanTech Solutions", "tags": ["Climate", "CleanTech", "Sustainability", "Environment"]},
    {"name": "Quantum Computing Innovations", "tags": ["Quantum", "Physics", "Computer Science", "Research"]},
    {"name": "SaaS & Software Enterprise", "tags": ["SaaS", "Software", "Startup", "Developer"]},
    {"name": "Women in STEM & Leadership", "tags": ["Women", "STEM", "Diversity", "Leadership"]},
    {"name": "Global Health & Digital Therapeutics", "tags": ["Health", "Biotech", "Global Health", "Medicine"]},
    {"name": "Cybersecurity & Cryptography", "tags": ["Cybersecurity", "Security", "CS", "Developer"]},
    {"name": "Autonomous Robotics & Drones", "tags": ["Robotics", "Engineering", "Hardware", "Research"]},
    {"name": "Social Impact & Civic Tech", "tags": ["Social Impact", "Civic Tech", "Community", "Nonprofit"]},
    {"name": "Bioinformatics & Genomic Sequencing", "tags": ["Biotech", "Bioinformatics", "Research", "Science"]},
    {"name": "Deep Space Exploration & Satellite Systems", "tags": ["Space", "Engineering", "Physics", "Research"]},
    {"name": "Educational Equity & Tech Access", "tags": ["Education", "EdTech", "Social Impact", "Student"]},
]

CATEGORIES = [
    {"name": "Fellowship", "tags": ["Fellowship", "Research", "PhD"]},
    {"name": "Scholarship", "tags": ["Scholarship", "Student", "University"]},
    {"name": "Grant", "tags": ["Grant", "Funding", "Research"]},
    {"name": "Accelerator", "tags": ["Accelerator", "Startup", "Founder"]},
    {"name": "Hackathon", "tags": ["Hackathon", "Developer", "Competition"]}
]

COUNTRIES = [
    "Global", "Global", "USA", "India", "Germany", "Singapore", "Australia", 
    "Canada", "Japan", "United Kingdom", "France", "Switzerland", "Netherlands",
    "South Africa", "Brazil", "Israel", "Sweden", "South Korea"
]

FUNDING_TEMPLATES = {
    "Fellowship": [
        "$50,000 yearly stipend + compute resource credits",
        "$65,000 annual research funding + health coverages",
        "$45,000 stipend + international travel grants",
        "Fully funded: $5,000 monthly living coverage",
        "$75,000 post-doc fellowship award",
    ],
    "Scholarship": [
        "Full tuition waiver + $1,200 monthly stipend",
        "Full tuition coverage + $15,000 yearly living allowance",
        "Partial tuition waiver: $20,000 scholarship award",
        "100% tuition coverage + textbook & visa allowance",
        "Full undergraduate tuition waiver + research assistant stipend",
    ],
    "Grant": [
        "Seed grant ranging from $5,000 to $20,000",
        "$100,000 research project development grant",
        "$25,000 equity-free environmental research grant",
        "$150,000 multi-year research grant package",
        "$50,000 scientific advancement grant",
    ],
    "Accelerator": [
        "$25,000 equity-free grant + expert mentorship",
        "$150,000 standard investment for 7% equity",
        "$50,000 seed funding + SaaS resource allocation",
        "$100,000 uncapped convertible note investment",
        "Equity-free workspace access + $30,000 program credits",
    ],
    "Hackathon": [
        "$15,000 cash prizes + $5,000 API credits",
        "$10,000 first prize + cloud computing access credits",
        "$25,000 total prize pool + VC network intro",
        "$8,000 main award + developer device gift pack",
        "$20,000 global developer grand prize",
    ]
}

ELIGIBILITY_TEMPLATES = {
    "Fellowship": [
        "Open to PhD candidates and postdoctoral scholars in relevant fields. Must submit a 3-page research proposal.",
        "Open to early-career academic researchers with active open-source or paper contributions.",
        "Candidates must hold an MSc or equivalent degree in engineering, sciences, or humanities with a strong GPA.",
        "Open to global researchers with a demonstrated track record of breakthrough investigations.",
    ],
    "Scholarship": [
        "Available to full-time enrolled undergraduate or graduate students. Minimum 3.5 GPA required.",
        "Open to citizens of developing countries pursuing CS, Mathematics, or engineering courses.",
        "Must be enrolled in an accredited higher-education institution with two letters of academic recommendation.",
        "Aimed at first-generation college students pursuing vocational or technical STEM degrees.",
    ],
    "Grant": [
        "Open to academic researchers, non-profit institutions, and community-led scientific organizations.",
        "Available to individual creators and researchers working on open-source scientific solutions.",
        "Open to research groups with pre-existing pilot proofs or publications in environmental fields.",
        "Open to global tech researchers aiming to publish public-domain research datasets.",
    ],
    "Accelerator": [
        "Early-stage technology startups with a working MVP. Must have at least one technical co-founder.",
        "Open to software startup companies with less than $250k in pre-existing external funding.",
        "Aimed at early-stage companies focusing on SaaS, deep tech, climate solutions, or digital health.",
        "Startups with a prototype ready for pilot deployment. Global applicants accepted.",
    ],
    "Hackathon": [
        "Open to university students, software engineers, and designers globally. Teams of 2 to 5 members.",
        "Open to individual software developers and teams of up to 4. Ages 18+.",
        "Open to AI developers, engineers, and researchers worldwide. No registration fee required.",
        "Open to tech hobbyists, students, and professional engineers competing in global tracks.",
    ]
}

def generate_opportunity(index):
    # Select categories and elements
    category_spec = random.choice(CATEGORIES)
    category = category_spec["name"]
    
    org = random.choice(ORGANIZATIONS)
    subject_spec = random.choice(SUBJECTS)
    subject = subject_spec["name"]
    
    # Compose title
    title_styles = [
        f"{org} {subject} {category} 2026",
        f"International {subject} {category} by {org}",
        f"{org} Global {category} in {subject}",
        f"{subject} Excellence {category} - {org}",
    ]
    title = random.choice(title_styles)
    
    # Unique slug URL
    title_slug = title.lower().replace(" ", "-").replace("&", "and")[:35]
    url = f"https://portal.nexora.net/opportunities/{index}-{title_slug}"
    
    # Compose funding
    funding = random.choice(FUNDING_TEMPLATES.get(category, ["Financial coverage provided"]))
    
    # Date calculations
    today = date.today()
    days_offset = random.randint(10, 600)  # dead line spread from 10 days to 20 months in future
    deadline = today + timedelta(days=days_offset)
    
    country = random.choice(COUNTRIES)
    
    # Merge tags
    tags = list(set(category_spec["tags"] + subject_spec["tags"] + [country]))
    # limit to 4 tags
    tags = tags[:4]
    
    # Description
    desc_templates = [
        f"The {title} is designed to accelerate progress in {subject}. Hosted by the prestigious {org}, this program offers outstanding candidates world-class support, mentorship, and extensive global network access. Participating fellows will collaborate with domain experts, utilize high-performance computing systems, and present achievements in international summits.",
        f"The team at {org} is calling for entries for the {title}. This initiative is specifically designed for talented individuals developing next-generation concepts in {subject}. The selected cohort receives financial funding of {funding}, tailored masterclasses, and direct exposure to venture funding and leading research institutions worldwide.",
        f"Are you working on bold solutions in {subject}? The {title} by {org} offers a comprehensive package including {funding} to help turn concepts into real-world impact. We welcome applicants of high promise to join our intensive cohort. Explore detailed eligibility and register today before the deadline."
    ]
    description = random.choice(desc_templates)
    
    eligibility = random.choice(ELIGIBILITY_TEMPLATES.get(category, ["Open to global candidates of outstanding promise."]))
    
    return Opportunity(
        title=title,
        organization=org,
        description=description,
        url=url,
        funding=funding,
        deadline=deadline,
        country=country,
        category=category,
        tags=tags,
        eligibility=eligibility
    )

def main():
    print("--- NEXORA BIG DATABASE SEEDING ENGINE ---")
    print("Initializing Database Connection...")
    db = SessionLocal()
    
    try:
        # Check current count
        current_count = db.query(Opportunity).count()
        print(f"Current database opportunity count: {current_count}")
        
        target = 10100
        needed = target - current_count
        if needed <= 0:
            print("Database already has 10,000+ opportunities. Seeding bypassed!")
            return
            
        print(f"Generating {needed} high-fidelity opportunities in batches...")
        
        batch_size = 2000
        generated_count = 0
        
        while generated_count < needed:
            chunk_size = min(batch_size, needed - generated_count)
            batch_objects = []
            
            for i in range(chunk_size):
                global_index = current_count + generated_count + i
                batch_objects.append(generate_opportunity(global_index))
                
            db.bulk_save_objects(batch_objects)
            db.commit()
            
            generated_count += chunk_size
            print(f"Successfully committed batch: {generated_count} / {needed} opportunities added.")
            
        final_count = db.query(Opportunity).count()
        print(f"Database successfully scaled! New Total Count: {final_count}")
        
    except Exception as e:
        db.rollback()
        print(f"ERROR during seeding: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()
