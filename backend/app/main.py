from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import date, datetime
from .database import engine, Base, get_db
from .config import settings
from .routes import opportunities, applications, scraper, profile, reminders, community, auth
from . import crud, schemas, models

# 1. Initialize Database Tables
Base.metadata.create_all(bind=engine)

# 2. Initialize FastAPI App
app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered central discovery engine and workflow management tool for international fellowships, grants, accelerators, and scholarships.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# 3. Configure CORS (Cross-Origin Resource Sharing)
# Enable requests from the Vite React frontend (typically port 5173 or 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local development simplicity
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Register API Routers
app.include_router(auth.router, prefix="/api")
app.include_router(opportunities.router, prefix="/api")
app.include_router(applications.router, prefix="/api")
app.include_router(scraper.router, prefix="/api")
app.include_router(profile.router, prefix="/api")
app.include_router(reminders.router, prefix="/api")
app.include_router(community.router, prefix="/api")

# 5. Core Health Check Endpoint
@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "database": "connected",
        "gemini_api": "enabled" if settings.GEMINI_API_KEY else "disabled"
    }

# 6. Automatic Seed Data on Startup
@app.on_event("startup")
def seed_database():
    db = next(get_db())
    try:
        # Check if opportunities table is empty
        opp_count = db.query(models.Opportunity).count()
        if opp_count == 0:
            print("[Startup] Seeding database with high-quality initial opportunities...")
            
            seeds = [
                models.Opportunity(
                    title="Google AI Graduate Fellowship 2026",
                    organization="Google DeepMind",
                    description="Google AI Graduate Fellowship supports outstanding graduate students doing exceptional research in computer science, machine learning, and artificial intelligence. The program provides financial coverage, computer resource allocations, and connects fellows with an elite team of research mentors.",
                    url="https://www.opportunitydesk.org/google-fellowship",
                    funding="$50,000 yearly stipend + compute resource credits",
                    deadline=date(2026, 7, 31),
                    country="Global",
                    category="Fellowship",
                    tags=["AI", "Research", "Student", "Computer Science"],
                    eligibility="Enrolled in a PhD program in computer science or machine learning. Active open-source contribution is valued."
                ),
                models.Opportunity(
                    title="Amina Women Founders Tech Accelerator",
                    organization="Amina Venture Group",
                    description="A highly selective 12-week intensive accelerator supporting outstanding female entrepreneurship in software technologies. Focuses on AI-enabled platforms, SaaS, ClimateTech, and deep science projects.",
                    url="https://www.youthop.com/amina-women-founders-accelerator",
                    funding="$25,000 equity-free grant + expert mentorship",
                    deadline=date(2026, 8, 15),
                    country="Europe",
                    category="Accelerator",
                    tags=["Women", "Startup", "Accelerator", "Grant"],
                    eligibility="Early-stage tech startups with at least one woman co-founder. Operations based in Europe or UK."
                ),
                models.Opportunity(
                    title="Global AI Autonomous Agents Hackathon",
                    organization="Global AI Foundation",
                    description="Build the next generation of autonomous AI assistants and agents in a 48-hour global sprint. Developers, designers, and students compete in tracks like Healthcare AI, Open Dev Tools, and Decentralized Networks.",
                    url="https://www.hackathon.io/global-ai-hackathon",
                    funding="$15,000 cash prizes + $5,000 API credits",
                    deadline=date(2026, 6, 30),
                    country="Global",
                    category="Hackathon",
                    tags=["AI", "Developer", "Hackathon", "Student"],
                    eligibility="Open to students and software engineers globally. Teams of 2 to 5 members."
                ),
                models.Opportunity(
                    title="Climate Innovation & Ecosystem Grant",
                    organization="Earth Alliance Foundation",
                    description="Providing seed funding and organizational support to bold individuals, nonprofits, and research institutions implementing real-world carbon removal initiatives or environmental restoration programs.",
                    url="https://www.earthalliance.org/climate-grant-2026",
                    funding="Grants ranging from $5,000 to $20,000",
                    deadline=date(2026, 9, 30),
                    country="USA",
                    category="Grant",
                    tags=["Climate", "Research", "Grant", "Nonprofit"],
                    eligibility="Non-profit institutions, local community organizations, and academic researchers."
                ),
                models.Opportunity(
                    title="International Excellence CS Scholarship 2026",
                    organization="Global Educational Institute",
                    description="Full-tuition waivers and living expense coverages awarded to international computer science students from developing nations who show exceptional promise in academic and engineering pursuits.",
                    url="https://www.globaledu.org/cs-scholarship",
                    funding="Full tuition waiver + $1,200 monthly stipend",
                    deadline=date(2026, 10, 15),
                    country="Global",
                    category="Scholarship",
                    tags=["Scholarship", "Student", "Global", "CS"],
                    eligibility="Open to citizens of developing countries pursuing undergraduate or graduate CS courses."
                )
            ]
            
            db.bulk_save_objects(seeds)
            db.commit()
            print(f"[Startup] Successfully seeded {len(seeds)} opportunities.")

            # Seed application tracker database with 2 initial saved statuses
            # to make the Kanban board look interactive immediately
            saved_opps = db.query(models.Opportunity).all()
            if saved_opps:
                app_seeds = [
                    models.Application(
                        opportunity_id=saved_opps[0].id,
                        status="Saved",
                        priority="High",
                        notes="Google Fellowship: PhD reference letters requested."
                    ),
                    models.Application(
                        opportunity_id=saved_opps[1].id,
                        status="Planning",
                        priority="Medium",
                        notes="Amina Accelerator: Working on pitch deck draft."
                    )
                ]
                db.bulk_save_objects(app_seeds)
                db.commit()
                print(f"[Startup] Successfully seeded 2 application tracker cards.")
        
        # Check if user profile is empty and seed default
        profile_count = db.query(models.UserProfile).count()
        if profile_count == 0:
            print("[Startup] Seeding default User Profile...")
            default_profile = models.UserProfile(
                name="Dr. Julian Sterling",
                email="julian.sterling@ethz.ch",
                bio="Post-doctoral researcher in Quantum Computing & Artificial Intelligence at ETH Zürich. Focused on scalable quantum algorithms and neural network architectures.",
                academic_status="Postdoc / Researcher",
                university="ETH Zürich",
                verified_academic_id="ETH-8849-STERLING",
                research_interests=["Quantum Computing", "AI", "Machine Learning", "Physics", "Computer Science"],
                base_city="Zürich",
                willing_to_relocate="Yes",
                preferred_regions=["Europe", "Switzerland", "North America", "United Kingdom"]
            )
            db.add(default_profile)
            db.commit()
            print("[Startup] Successfully seeded default User Profile.")

    except Exception as e:
        print(f"[Startup] Database seeding failed: {e}")
    finally:
        db.close()
