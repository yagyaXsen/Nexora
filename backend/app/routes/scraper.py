import asyncio
import json
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Dict
from .. import crud, schemas
from ..database import get_db
from ..scraper import OpportunityScraper
from ..ai_service import AIService
from datetime import datetime
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/scraper", tags=["Scraper Controls"])

scraper_engine = OpportunityScraper()
ai_service = AIService()

# Enhanced source list for better coverage
ENHANCED_SOURCES = [
    # Academic & Research Opportunities
    {
        "name": "MIT Research Opportunities",
        "url": "https://research.mit.edu/research-opportunities",
        "category": "Research"
    },
    {
        "name": "Stanford Research Programs",
        "url": "https://researchtraining.stanford.edu/opportunities",
        "category": "Research"
    },
    {
        "name": "Harvard Opportunities",
        "url": "https://gsas.harvard.edu/funding-opportunities",
        "category": "Fellowship"
    },
    {
        "name": "Oxford Scholarships",
        "url": "https://www.ox.ac.uk/students/fees-funding/fees-and-funding-support",
        "category": "Scholarship"
    },
    {
        "name": "Cambridge Funding",
        "url": "https://www.cambridge.org/international/programmes-and-qualifications/funding",
        "category": "Funding"
    },
    {
        "name": "Yale Fellowships",
        "url": "https://cpsc.yale.edu/other-opportunities",
        "category": "Fellowship"
    },
    {
        "name": "Berkeley Research",
        "url": "https://grad.berkeley.edu/funding/",
        "category": "Research"
    },
    {
        "name": "Princeton Opportunities",
        "url": "https://gradschool.princeton.edu/funding",
        "category": "Fellowship"
    },
    {
        "name": "Columbia Fellowships",
        "url": "https://www.columbia.edu/content/fellowships",
        "category": "Fellowship"
    },
    {
        "name": "University of Toronto Funding",
        "url": "https://www.sgs.utoronto.ca/funding/",
        "category": "Funding"
    },
    {
        "name": "ETH Zurich Opportunities",
        "url": "https://www.ethz.ch/en/research/funding-opportunities.html",
        "category": "Research"
    },
    {
        "name": "Imperial College London",
        "url": "https://www.imperial.ac.uk/research-fellowships/",
        "category": "Fellowship"
    },
    {
        "name": "University of Melbourne",
        "url": "https://research.unimelb.edu.au/funding",
        "category": "Research"
    },
    {
        "name": "National University of Singapore",
        "url": "https://nus.edu.sg/gro/funding-opportunities",
        "category": "Funding"
    },
    {
        "name": "University of Tokyo",
        "url": "https://www.u-tokyo.ac.jp/en/prospective-students/scholarships.html",
        "category": "Scholarship"
    },
    {
        "name": "Max Planck Society",
        "url": "https://www.mpg.de/career",
        "category": "Research"
    },
    {
        "name": "CERN Opportunities",
        "url": "https://careers.cern/",
        "category": "Research"
    },
    {
        "name": "NASA Internships",
        "url": "https://intern.nasa.gov/",
        "category": "Internship"
    },
    {
        "name": "Google Research",
        "url": "https://research.google/outreach/",
        "category": "Research"
    },
    {
        "name": "Microsoft Research",
        "url": "https://www.microsoft.com/en-us/research/academic-program/",
        "category": "Research"
    },
    {
        "name": "Facebook Research",
        "url": "https://research.fb.com/programs/",
        "category": "Research"
    },
    {
        "name": "Amazon Research",
        "url": "https://www.amazon.science/",
        "category": "Research"
    },
    {
        "name": "Apple Research",
        "url": "https://research.apple.com/",
        "category": "Research"
    },
    {
        "name": "OpenAI Research",
        "url": "https://openai.com/research",
        "category": "Research"
    },
    {
        "name": "DeepMind Opportunities",
        "url": "https://www.deepmind.com/research",
        "category": "Research"
    },
    {
        "name": "Anthropic Research",
        "url": "https://www.anthropic.com/",
        "category": "Research"
    },
    {
        "name": "Y Combinator",
        "url": "https://www.ycombinator.com/",
        "category": "Accelerator"
    },
    {
        "name": "Techstars",
        "url": "https://www.techstars.com/",
        "category": "Accelerator"
    },
    {
        "name": "500 Startups",
        "url": "https://500.co/",
        "category": "Accelerator"
    },
    {
        "name": "Seedcamp",
        "url": "https://seedcamp.com/",
        "category": "Accelerator"
    },
    {
        "name": "Plug and Play",
        "url": "https://www.plugandplaytechcenter.com/",
        "category": "Accelerator"
    },
    {
        "name": "Indie Hackers",
        "url": "https://www.indiehackers.com/",
        "category": "Community"
    },
    {
        "name": "Devpost",
        "url": "https://devpost.com/",
        "category": "Hackathon"
    },
    {
        "name": "Kaggle Competitions",
        "url": "https://www.kaggle.com/competitions",
        "category": "Competition"
    },
    {
        "name": "HackerEarth",
        "url": "https://www.hackerearth.com/",
        "category": "Hackathon"
    },
    {
        "name": "TopCoder",
        "url": "https://www.topcoder.com/",
        "category": "Competition"
    },
    {
        "name": "Codeforces",
        "url": "https://codeforces.com/",
        "category": "Competition"
    },
    {
        "name": "LeetCode",
        "url": "https://leetcode.com/",
        "category": "Competition"
    },
    {
        "name": "HackerRank",
        "url": "https://www.hackerrank.com/",
        "category": "Competition"
    },
    {
        "name": "CodeChef",
        "url": "https://www.codechef.com/",
        "category": "Competition"
    },
    {
        "name": "GeeksforGeeks",
        "url": "https://www.geeksforgeeks.org/",
        "category": "Competition"
    },
    {
        "name": "Project Euler",
        "url": "https://projecteuler.net/",
        "category": "Competition"
    },
    {
        "name": "Google Summer of Code",
        "url": "https://summerofcode.withgoogle.com/",
        "category": "Internship"
    },
    {
        "name": "Outreachy",
        "url": "https://www.outreachy.org/",
        "category": "Internship"
    },
    {
        "name": "Rails Girls Summer of Code",
        "url": "https://railsgirlssummerofcode.org/",
        "category": "Internship"
    },
    {
        "name": "Linux Foundation",
        "url": "https://mentorship.lfx.linuxfoundation.org/",
        "category": "Internship"
    },
    {
        "name": "Major League Hacking",
        "url": "https://fellowship.mlh.io/",
        "category": "Internship"
    },
    {
        "name": "Jane Street",
        "url": "https://www.janestreet.com/join-jane-street/",
        "category": "Internship"
    },
    {
        "name": "Two Sigma",
        "url": "https://www.twosigma.com/",
        "category": "Internship"
    },
    {
        "name": "Jane Street Research",
        "url": "https://www.janestreet.com/research/",
        "category": "Research"
    },
    {
        "name": "Two Sigma Research",
        "url": "https://www.twosigma.com/insights/",
        "category": "Research"
    }
]

@router.get("/sources", response_model=List[schemas.ScrapedSource])
def read_sources(db: Session = Depends(get_db)):
    """Retrieve all monitored scraper sources."""
    sources = crud.get_scraped_sources(db)
    # Auto-seed if empty for easy trial out of the box
    if not sources:
        # Add more comprehensive sources for better coverage
        seed_sources = []
        for source_data in ENHANCED_SOURCES[:10]:  # Limit to first 10 for initial seeding
            seed_sources.append(schemas.ScrapedSourceCreate(
                name=source_data["name"],
                url=source_data["url"],
                scraper_type="playwright_html"
            ))

        for src in seed_sources:
            crud.create_scraped_source(db, src)
        sources = crud.get_scraped_sources(db)
    return sources

@router.get("/run")
def run_scraper(db: Session = Depends(get_db)):
    """Streams real-time scraping progress logs via Server-Sent Events (SSE)."""
    async def log_generator():
        # Retrieve active sources
        sources = crud.get_scraped_sources(db)
        if not sources:
            # Re-seed if empty
            read_sources(db)
            sources = crud.get_scraped_sources(db)

        yield f"data: {json.dumps({'status': 'info', 'message': f'Found {len(sources)} registered scrapers. Starting daily pipeline...'})}\n\n"
        await asyncio.sleep(0.5)

        new_count = 0
        duplicate_count = 0
        error_count = 0

        for source in sources:
            yield f"data: {json.dumps({'status': 'crawler', 'message': f'[{source.name}] Fetching webpage text from: {source.url}'})}\n\n"
            await asyncio.sleep(0.8)

            try:
                # 1. Scrape the URL with enhanced error handling
                scraped_data = await scraper_engine.scrape_url(source.url)
                raw_text = scraped_data["raw_text"]
                crawler_source = scraped_data["source"]

                yield f"data: {json.dumps({'status': 'crawler', 'message': f'[{source.name}] Raw content fetched via {crawler_source}. Character count: {len(raw_text)}'})}\n\n"
                await asyncio.sleep(0.6)

                # 2. Extract structured fields using AI with better error handling
                yield f"data: {json.dumps({'status': 'ai', 'message': f'[{source.name}] Invoking AI Extractor to structure raw text into clean JSON arrays...'})}\n\n"
                await asyncio.sleep(0.8)

                # Enhanced error handling for AI extraction
                try:
                    extracted_json_list = await asyncio.to_thread(
                        ai_service.extract_opportunities, raw_text, source.url
                    )
                except Exception as ai_error:
                    logger.error(f"AI extraction failed for {source.name}: {str(ai_error)}")
                    yield f"data: {json.dumps({'status': 'error', 'message': f'[{source.name}] AI extraction failed: {str(ai_error)}'})}\n\n"
                    await asyncio.sleep(0.5)
                    continue

                yield f"data: {json.dumps({'status': 'ai', 'message': f'[{source.name}] AI extracted {len(extracted_json_list)} opportunities. Saving to database...'})}\n\n"
                await asyncio.sleep(0.6)

                # 3. Duplicate Detection & SQL Insertion with enhanced error handling
                for extracted_json in extracted_json_list:
                    try:
                        # Append index to URL to differentiate multiple opportunities from the same feed URL
                        title_slug = extracted_json.get("title", "").lower().replace(" ", "-")[:30]
                        unique_url = f"{extracted_json['url']}#{title_slug}"
                        extracted_json["url"] = unique_url

                        existing_opp = crud.get_opportunity_by_url(db, extracted_json["url"])
                        if existing_opp:
                            # Update existing record
                            opp_update = schemas.OpportunityUpdate(**extracted_json)
                            crud.update_opportunity(db, existing_opp.id, opp_update)
                            duplicate_count += 1
                        else:
                            # Insert new record
                            opp_create = schemas.OpportunityCreate(**extracted_json)
                            crud.create_opportunity(db, opp_create)
                            new_count += 1
                    except Exception as db_error:
                        logger.error(f"Database operation failed for {source.name}: {str(db_error)}")
                        error_count += 1
                        yield f"data: {json.dumps({'status': 'error', 'message': f'[{source.name}] Database operation failed: {str(db_error)}'})}\n\n"
                        await asyncio.sleep(0.3)

                crud.update_scraped_source_status(db, source.id, "Success", datetime.now())

                yield f"data: {json.dumps({'status': 'db', 'message': f'[{source.name}] Batch saved successfully!'})}\n\n"
                await asyncio.sleep(0.5)

            except Exception as e:
                crud.update_scraped_source_status(db, source.id, "Failed", datetime.now())
                yield f"data: {json.dumps({'status': 'error', 'message': f'[{source.name}] Scraping pipeline crashed: {str(e)}'})}\n\n"
                error_count += 1
                await asyncio.sleep(0.5)

        # Pipeline complete message
        yield f"data: {json.dumps({'status': 'done', 'message': f'Scraper pipeline completed. Added: {new_count} new, Updated: {duplicate_count} existing, Errors: {error_count} opportunities!'})}\n\n"

    return StreamingResponse(log_generator(), media_type="text/event-stream")