from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func, cast, String, desc
from typing import List
from . import models, schemas
from .ai_service import AIService

ai_service = AIService()

def search_opportunities_hybrid(db: Session, user_query: str) -> List[models.Opportunity]:
    """Uses LLM intent extraction combined with dynamic SQL filtering for semantic search."""
    # 1. Parse search query using AI Service
    parsed_filters = ai_service.parse_search_query(user_query)

    category = parsed_filters.get("category")
    country = parsed_filters.get("country")
    tags = parsed_filters.get("tags", [])
    keywords = parsed_filters.get("keywords", [])
    funding_required = parsed_filters.get("funding_required", False)

    print(f"[Search Engine] Parsed Intent: Category={category}, Country={country}, Tags={tags}, Keywords={keywords}, FundingRequired={funding_required}")

    # 2. Build Dynamic Database Query
    query = db.query(models.Opportunity)
    conditions = []

    # Category Filter
    if category and category != "All":
        conditions.append(models.Opportunity.category == category)

    # Country Filter (Indian students are eligible for both "India" AND "Global" opportunities!)
    if country:
        if country.lower() == "global":
            conditions.append(models.Opportunity.country.ilike("%global%"))
        else:
            # Match specific country OR general Global availability
            conditions.append(or_(
                models.Opportunity.country.ilike(f"%{country}%"),
                models.Opportunity.country.ilike("%global%")
            ))

    # Tags Filter
    if tags:
        tag_conditions = []
        for tag in tags:
            # Use SQLAlchemy cast to match inside the JSON stringified text safely and portably
            tag_conditions.append(cast(models.Opportunity.tags, String).ilike(f"%{tag}%"))
        if tag_conditions:
            conditions.append(or_(*tag_conditions))

    # Funding Filter
    if funding_required:
        conditions.append(and_(
            models.Opportunity.funding.isnot(None),
            ~models.Opportunity.funding.ilike("%no funding%"),
            ~models.Opportunity.funding.ilike("%unfunded%")
        ))

    # Keyword Search (Across Title, Organization, Description, and Eligibility)
    if keywords:
        keyword_conditions = []
        for kw in keywords:
            kw_clean = kw.strip()
            if len(kw_clean) >= 2:
                keyword_conditions.append(or_(
                    models.Opportunity.title.ilike(f"%{kw_clean}%"),
                    models.Opportunity.organization.ilike(f"%{kw_clean}%"),
                    models.Opportunity.description.ilike(f"%{kw_clean}%"),
                    models.Opportunity.eligibility.ilike(f"%{kw_clean}%")
                ))
        if keyword_conditions:
            conditions.append(and_(*keyword_conditions))

    # Apply conditions
    if conditions:
        query = query.filter(and_(*conditions))

    # Return top 50 matches sorted by newest
    results = query.order_by(models.Opportunity.created_at.desc()).limit(50).all()

    # If no results matched the rigid filters, fall back to broad keyword search on the original query text
    if not results and user_query:
        print("[Search Engine] No results on strict filter. Falling back to broad keyword search.")
        query_fallback = db.query(models.Opportunity).filter(
            or_(
                models.Opportunity.title.ilike(f"%{user_query}%"),
                models.Opportunity.organization.ilike(f"%{user_query}%"),
                models.Opportunity.description.ilike(f"%{user_query}%"),
                models.Opportunity.category.ilike(f"%{user_query}%")
            )
        )
        results = query_fallback.order_by(models.Opportunity.created_at.desc()).limit(50).all()

    return results
