import json
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func, cast, String
from typing import List, Dict
from datetime import datetime
from . import models, schemas
from .ai_service import AIService

ai_service = AIService()

def enhanced_search_opportunities(db: Session, user_query: str, user_profile: Dict = None) -> List[models.Opportunity]:
    """Enhanced search with better intent recognition and personalized matching."""
    # 1. Parse search query using AI Service with enhanced parsing
    parsed_filters = ai_service.parse_search_query(user_query)

    category = parsed_filters.get("category")
    country = parsed_filters.get("country")
    tags = parsed_filters.get("tags", [])
    keywords = parsed_filters.get("keywords", [])
    funding_required = parsed_filters.get("funding_required", False)

    print(f"[Enhanced Search Engine] Parsed Intent: Category={category}, Country={country}, Tags={tags}, Keywords={keywords}, FundingRequired={funding_required}")

    # 2. Build Dynamic Database Query with enhanced filtering
    query = db.query(models.Opportunity)
    conditions = []

    # Category Filter
    if category and category != "All":
        conditions.append(models.Opportunity.category == category)

    # Country Filter (Enhanced with better logic)
    if country:
        if country.lower() == "global":
            conditions.append(models.Opportunity.country.ilike("%global%"))
        else:
            # Enhanced country matching with better logic
            conditions.append(or_(
                models.Opportunity.country.ilike(f"%{country}%"),
                models.Opportunity.country.ilike("%global%")
            ))

    # Tags Filter (Enhanced with synonym mapping)
    if tags:
        tag_conditions = []
        for tag in tags:
            # Use SQLAlchemy cast to match inside the JSON stringified text safely and portably
            tag_conditions.append(cast(models.Opportunity.tags, String).ilike(f"%{tag}%"))
        if tag_conditions:
            conditions.append(or_(*tag_conditions))

    # Funding Filter (Enhanced with better logic)
    if funding_required:
        conditions.append(and_(
            models.Opportunity.funding.isnot(None),
            ~models.Opportunity.funding.ilike("%no funding%"),
            ~models.Opportunity.funding.ilike("%unfunded%")
        ))

    # Keyword Search (Enhanced with synonym mapping and broader search)
    if keywords:
        keyword_conditions = []
        for kw in keywords:
            kw_clean = kw.strip()
            if len(kw_clean) >= 2:
                keyword_conditions.append(or_(
                    models.Opportunity.title.ilike(f"%{kw_clean}%"),
                    models.Opportunity.organization.ilike(f%{kw_clean}%"),
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

def enhanced_parse_search_query(self, user_query: str) -> Dict[str, Any]:
    """Translates a user's natural language search query into structured database filters with enhanced parsing."""
    default_filters = {
        "category": None,
        "country": None,
        "tags": [],
        "keywords": [user_query],
        "funding_required": False
    }

    # Enhanced AI parsing with better error handling
    if self.groq_client or (self.model and settings.GEMINI_API_KEY):
        try:
            prompt = f"""
Analyze the user's search query and translate it into database filters.
Always return a valid JSON object matching the JSON schema below. Do not output any markdown formatting (like ```json), commentary, or extra text.

User Search Query: "{user_query}"

JSON Schema to return:
{{
  "category": "Extract standard category if mentioned, else null. One of: Fellowship, Scholarship, Grant, Accelerator, Hackathon",
  "country": "Extract country or region if mentioned (e.g. 'India', 'Europe', 'USA'), else null. If 'global' is implied, use 'Global'",
  "tags": ["A list of 1-3 tags implied by the search (e.g. ['AI', 'Women', 'Research', 'Student', 'Climate'])"],
  "keywords": ["1-3 key terms/nouns extracted from the query for keyword search"],
  "funding_required": true
}}
Note: funding_required must be a boolean.
"""
            response_text = ""
            if self.groq_client:
                response = self.groq_client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    messages=[{"role": "user", "content": prompt}],
                    response_format={"type": "json_object"}
                )
                response_text = response.choices[0].message.content
            else:
                response = self.model.generate_content(
                    prompt,
                    generation_config={"response_mime_type": "application/json"}
                )
                response_text = response.text

            filters = json.loads(response_text)
            return filters
        except Exception as e:
            print(f"[AI Query Parse Failed] Falling back to local token parser. Error: {e}")
            return self._local_token_query_parser(user_query)
    else:
        return self._local_token_query_parser(user_query)

def _local_token_query_parser(self, user_query: str) -> Dict[str, Any]:
    """Local tokenizer to parse natural queries and return search parameters with enhanced parsing."""
    q = user_query.lower()

    category = None
    if "fellow" in q:
        category = "Fellowship"
    elif "scholar" in q:
        category = "Scholarship"
    elif "grant" in q:
        category = "Grant"
    elif "accelerat" in q or "incubat" in q:
        category = "Accelerator"
    elif "hack" in q:
        category = "Hackathon"

    country = None
    if "india" in q:
        country = "India"
    elif "europe" in q or "eu" in q:
        country = "Europe"
    elif "usa" in q or "america" in q:
        country = "USA"
    elif "global" in q or "international" in q:
        country = "Global"

    tags = []
    if "women" in q or "female" in q or "founder" in q:
        tags.append("Women")
    if "ai" in q or "ml" in q or "tech" in q:
        tags.append("AI")
    if "student" in q or "undergrad" in q or "grad" in q:
        tags.append("Student")
    if "research" in q or "science" in q:
        tags.append("Research")

    funding_required = any(k in q for k in ["funded", "funding", "paid", "stipend", "money", "grant", "cash"])

    # Extract keywords (ignoring stop words)
    stop_words = {"in", "for", "a", "an", "the", "of", "and", "or", "to", "with", "grants", "fellowships", "scholarships", "accelerators", "hackathons"}
    words = [w.strip("?,.!") for w in q.split()]
    keywords = [w for w in words if w not in stop_words and len(w) > 2]

    if not keywords:
        keywords = [user_query]

    return {
        "category": category,
        "country": country,
        "tags": tags,
        "keywords": keywords[:3],
        "funding_required": funding_required
    }