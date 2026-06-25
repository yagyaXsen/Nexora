from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta
from .. import crud, schemas, models
from ..database import get_db
from ..search import search_opportunities_hybrid

router = APIRouter(prefix="/opportunities", tags=["Opportunities"])

@router.get("/", response_model=schemas.OpportunityPaginatedResponse)
def read_opportunities(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    category: Optional[str] = Query("All", description="Filter by category"),
    country: Optional[str] = Query("All", description="Filter by country"),
    db: Session = Depends(get_db)
):
    """Retrieve opportunities with optional category and country filters and pagination."""
    skip = (page - 1) * limit
    total, opportunities = crud.get_opportunities(db, skip=skip, limit=limit, category=category, country=country)
    return schemas.OpportunityPaginatedResponse(
        total=total,
        page=page,
        limit=limit,
        opportunities=opportunities
    )


@router.post("/search", response_model=List[schemas.Opportunity])
def search_opportunities(
    query_in: schemas.SearchQuery,
    db: Session = Depends(get_db)
):
    """Perform a hybrid AI-powered natural language search on opportunities."""
    if not query_in.query.strip():
        _, opportunities = crud.get_opportunities(db, skip=0, limit=50)
        return opportunities
    return search_opportunities_hybrid(db, user_query=query_in.query)


@router.get("/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Fetch aggregated statistics and telemetry data for the dashboard landing page."""
    # 1. Basic counts
    total_opps = db.query(models.Opportunity).count()
    saved_apps = db.query(models.Application).filter(models.Application.status == "Saved").count()
    applied_apps = db.query(models.Application).filter(models.Application.status == "Applied").count()
    accepted_apps = db.query(models.Application).filter(models.Application.status == "Accepted").count()
    
    # 2. Upcoming deadlines in saved opportunities (next 14 days)
    today = datetime.now().date()
    two_weeks_hence = today + timedelta(days=14)
    
    upcoming_deadlines = db.query(models.Opportunity).join(
        models.Application, models.Opportunity.id == models.Application.opportunity_id
    ).filter(
        models.Opportunity.deadline.isnot(None),
        models.Opportunity.deadline >= today,
        models.Opportunity.deadline <= two_weeks_hence
    ).count()

    # 3. Category distribution
    categories = ["Fellowship", "Scholarship", "Grant", "Accelerator", "Hackathon", "Other"]
    cat_dist = {}
    for cat in categories:
        count = db.query(models.Opportunity).filter(models.Opportunity.category == cat).count()
        cat_dist[cat] = count

    # 4. Pipeline stages
    stages = ["Saved", "Planning", "Applied", "Interview", "Accepted", "Rejected"]
    pipeline = {}
    for stage in stages:
        count = db.query(models.Application).filter(models.Application.status == stage).count()
        pipeline[stage] = count

    return schemas.DashboardStats(
        total_opportunities=total_opps,
        saved_applications=db.query(models.Application).count(),
        applied_applications=applied_apps + db.query(models.Application).filter(models.Application.status == "Interview").count(),
        accepted_applications=accepted_apps,
        upcoming_deadlines_count=upcoming_deadlines,
        category_distribution=cat_dist,
        pipeline_stages=pipeline
    )


@router.get("/recommendations", response_model=List[schemas.OpportunityWithMatch])
def get_recommendations(db: Session = Depends(get_db)):
    """Compute personalized recommendations based on the active user profile, returning the top 12 matches with match scores (70%-99%)."""
    profile = crud.get_user_profile(db)
    if not profile:
        default_profile = schemas.UserProfileCreate(
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
        profile = crud.create_user_profile(db, default_profile)

    opportunities = db.query(models.Opportunity).all()
    
    profile_interests = [i.lower() for i in (profile.research_interests or [])]
    profile_academic = (profile.academic_status or "").lower()
    profile_regions = [r.lower() for r in (profile.preferred_regions or [])]
    profile_base = (profile.base_city or "").lower()
    willing_relocate = (profile.willing_to_relocate or "Yes") == "Yes"

    recommended_list = []
    
    for opp in opportunities:
        academic_score = 5
        opp_title_lower = opp.title.lower() if opp.title else ""
        opp_desc_lower = opp.description.lower() if opp.description else ""
        opp_elig_lower = opp.eligibility.lower() if opp.eligibility else ""
        opp_tags_lower = [t.lower() for t in (opp.tags or [])]
        opp_cat_lower = opp.category.lower() if opp.category else ""
        
        has_academic_keyword = False
        if profile_academic:
            if profile_academic in opp_tags_lower or profile_academic in opp_cat_lower:
                academic_score = 30
                has_academic_keyword = True
            else:
                keywords = []
                if "student" in profile_academic or "undergrad" in profile_academic:
                    keywords = ["student", "undergraduate", "bachelor", "scholarship", "intern"]
                elif "phd" in profile_academic or "doctor" in profile_academic:
                    keywords = ["phd", "doctorate", "fellowship", "post-graduate", "researcher"]
                elif "postdoc" in profile_academic or "researcher" in profile_academic:
                    keywords = ["postdoc", "research", "fellowship", "grant", "scientist"]
                elif "graduate" in profile_academic or "master" in profile_academic:
                    keywords = ["graduate", "master", "scholarship", "fellowship"]
                
                for kw in keywords:
                    if kw in opp_title_lower or kw in opp_desc_lower or kw in opp_elig_lower:
                        academic_score = 25
                        has_academic_keyword = True
                        break
        
        if not has_academic_keyword:
            if opp_cat_lower in ["fellowship", "scholarship", "grant"]:
                academic_score = 15
            else:
                academic_score = 10

        interests_score = 10
        intersection_count = 0
        if profile_interests:
            for interest in profile_interests:
                if interest in opp_tags_lower:
                    intersection_count += 1
                elif interest in opp_title_lower or interest in opp_desc_lower:
                    intersection_count += 0.5
            
            if intersection_count > 0:
                interests_score = min(40, 10 + (intersection_count * 10))
        
        location_score = 10
        opp_country_lower = opp.country.lower() if opp.country else "global"
        
        if "global" in opp_country_lower or not opp_country_lower:
            location_score = 30
        else:
            if profile_base and profile_base in opp_country_lower:
                location_score = 30
            else:
                region_matched = False
                for region in profile_regions:
                    if region in opp_country_lower or (opp_desc_lower and region in opp_desc_lower):
                        location_score = 30
                        region_matched = True
                        break
                
                if not region_matched:
                    if willing_relocate:
                        location_score = 20
                    else:
                        location_score = 10
                        
        raw_score = academic_score + interests_score + location_score
        scaled_score = 70 + (29.0 * min(raw_score, 100) / 100.0)
        match_score = int(round(scaled_score))
        match_score = max(70, min(99, match_score))
        
        recommended_list.append((match_score, opp))

    recommended_list.sort(key=lambda x: x[0], reverse=True)
    top_12 = recommended_list[:12]
    
    results = []
    for score, opp in top_12:
        opp_data = schemas.OpportunityWithMatch(
            id=opp.id,
            title=opp.title,
            organization=opp.organization,
            description=opp.description,
            url=opp.url,
            funding=opp.funding,
            deadline=opp.deadline,
            country=opp.country or "Global",
            category=opp.category or "Other",
            tags=opp.tags or [],
            eligibility=opp.eligibility,
            created_at=opp.created_at,
            updated_at=opp.updated_at,
            match_score=score
        )
        results.append(opp_data)
        
    return results


@router.get("/{opportunity_id}", response_model=schemas.Opportunity)
def read_opportunity(opportunity_id: UUID, db: Session = Depends(get_db)):
    """Retrieve details of a single opportunity by ID."""
    db_opportunity = crud.get_opportunity(db, opportunity_id=opportunity_id)
    if db_opportunity is None:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return db_opportunity


from ..ai_service import AIService

ai_service = AIService()

@router.post("/{opportunity_id}/draft", response_model=schemas.ApplicationDraftResponse)
def generate_draft(
    opportunity_id: UUID,
    draft_req: schemas.ApplicationDraftRequest,
    db: Session = Depends(get_db)
):
    """Generate a tailored application draft (SOP, Cover Letter, or Email) based on active profile and opportunity details."""
    db_opportunity = crud.get_opportunity(db, opportunity_id=opportunity_id)
    if db_opportunity is None:
        raise HTTPException(status_code=404, detail="Opportunity not found")
        
    profile = crud.get_user_profile(db)
    if not profile:
        # Create default profile to generate draft
        default_profile = schemas.UserProfileCreate(
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
        profile = crud.create_user_profile(db, default_profile)

    # Convert SQLAlchemy model to Dict
    opp_dict = {
        "title": db_opportunity.title,
        "organization": db_opportunity.organization,
        "description": db_opportunity.description,
        "funding": db_opportunity.funding,
        "deadline": str(db_opportunity.deadline) if db_opportunity.deadline else None,
        "country": db_opportunity.country,
        "category": db_opportunity.category,
        "tags": db_opportunity.tags or [],
        "eligibility": db_opportunity.eligibility
    }
    
    profile_dict = {
        "name": profile.name,
        "email": profile.email,
        "bio": profile.bio,
        "academic_status": profile.academic_status,
        "university": profile.university,
        "research_interests": profile.research_interests or [],
        "base_city": profile.base_city,
        "willing_to_relocate": profile.willing_to_relocate,
        "preferred_regions": profile.preferred_regions or []
    }
    
    draft_text = ai_service.generate_application_draft(profile_dict, opp_dict, draft_req.draft_type)
    return schemas.ApplicationDraftResponse(draft_text=draft_text)

