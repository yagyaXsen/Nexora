import asyncio
import json
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas, models
from ..database import get_db
from ..scraper import OpportunityScraper
from ..ai_service import AIService
from datetime import datetime

router = APIRouter(prefix="/scraper", tags=["Scraper Controls"])

scraper_engine = OpportunityScraper()
ai_service = AIService()

@router.get("/sources", response_model=List[schemas.ScrapedSource])
def read_sources(db: Session = Depends(get_db)):
    """Retrieve all monitored scraper sources."""
    sources = crud.get_scraped_sources(db)
    # Auto-seed if empty for easy trial out of the box
    if not sources:
        seed_sources = [
            schemas.ScrapedSourceCreate(
                name="Opportunity Desk (Fellowships)",
                url="https://www.opportunitydesk.org/google-fellowship",
                scraper_type="playwright_html"
            ),
            schemas.ScrapedSourceCreate(
                name="Youth Opportunities (Accelerators)",
                url="https://www.youthop.com/amina-women-founders-accelerator",
                scraper_type="playwright_html"
            ),
            schemas.ScrapedSourceCreate(
                name="Hackathon IO (AI Hackathons)",
                url="https://www.hackathon.io/global-ai-hackathon",
                scraper_type="playwright_html"
            )
        ]
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

        for source in sources:
            yield f"data: {json.dumps({'status': 'crawler', 'message': f'[{source.name}] Fetching webpage text from: {source.url}'})}\n\n"
            await asyncio.sleep(0.8)

            try:
                # 1. Scrape the URL
                scraped_data = await scraper_engine.scrape_url(source.url)
                raw_text = scraped_data["raw_text"]
                crawler_source = scraped_data["source"]
                
                yield f"data: {json.dumps({'status': 'crawler', 'message': f'[{source.name}] Raw content fetched via {crawler_source}. Character count: {len(raw_text)}'})}\n\n"
                await asyncio.sleep(0.6)

                # 2. Extract structured fields using AI
                yield f"data: {json.dumps({'status': 'ai', 'message': f'[{source.name}] Invoking AI Extractor to structure raw text into clean JSON arrays...'})}\n\n"
                await asyncio.sleep(0.8)
                extracted_json_list = await asyncio.to_thread(
                    ai_service.extract_opportunities, raw_text, source.url
                )
                
                yield f"data: {json.dumps({'status': 'ai', 'message': f'[{source.name}] AI extracted {len(extracted_json_list)} opportunities. Saving to database...'})}\n\n"
                await asyncio.sleep(0.6)

                # 3. Duplicate Detection & SQL Insertion
                for extracted_json in extracted_json_list:
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
                        
                crud.update_scraped_source_status(db, source.id, "Success", datetime.now())
                
                yield f"data: {json.dumps({'status': 'db', 'message': f'[{source.name}] Batch saved successfully!'})}\n\n"
                await asyncio.sleep(0.5)

            except Exception as e:
                crud.update_scraped_source_status(db, source.id, "Failed", datetime.now())
                yield f"data: {json.dumps({'status': 'error', 'message': f'[{source.name}] Scraping pipeline crashed: {str(e)}'})}\n\n"
                await asyncio.sleep(0.5)

        # Pipeline complete message
        yield f"data: {json.dumps({'status': 'done', 'message': f'Scraper pipeline completed. Added: {new_count} new, Updated: {duplicate_count} existing opportunities!'})}\n\n"

    return StreamingResponse(log_generator(), media_type="text/event-stream")
