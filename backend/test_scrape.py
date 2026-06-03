import sys
import os
import asyncio
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.scraper import OpportunityScraper
from app.ai_service import AIService

async def main():
    scraper = OpportunityScraper()
    ai = AIService()
    url = "https://unstop.com/internship?oppstatus=open"
    print("Scraping URL...")
    data = await scraper.scrape_url(url)
    print(f"Scrape source: {data['source']}")
    print(f"Raw text length: {len(data['raw_text'])}")
    print("AI Extracting...")
    try:
        opps = ai.extract_opportunities(data["raw_text"], url)
        print(f"Extracted {len(opps)} opportunities.")
        print(opps[0] if opps else "Empty")
    except Exception as e:
        print(f"AI Exception: {e}")

asyncio.run(main())
