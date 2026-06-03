import sys
import os
import asyncio
sys.path.append(os.getcwd())
from app.scraper import OpportunityScraper
from app.ai_service import AIService

async def test():
    scraper = OpportunityScraper()
    ai = AIService()
    url = "https://unstop.com/internship?oppstatus=open"
    print("Scraping URL...")
    data = await scraper.scrape_url(url)
    print("AI Extracting with Groq...")
    try:
        opps = ai.extract_opportunities(data["raw_text"], url)
        print(f"Extracted {len(opps)} opportunities.")
        if opps:
            print("First opp:", opps[0]["title"])
    except Exception as e:
        print(f"AI Exception: {e}")

asyncio.run(test())
