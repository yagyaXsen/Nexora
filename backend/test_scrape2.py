import sys
import os
import asyncio
sys.path.append(os.getcwd())
from app.scraper import OpportunityScraper

async def test():
    scraper = OpportunityScraper()
    data = await scraper.scrape_url("https://unstop.com/internship?oppstatus=open")
    print("TEXT:")
    print(data["raw_text"][:2000])

asyncio.run(test())
