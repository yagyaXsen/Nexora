import asyncio
import json
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas, models
from ..database import get_db
from ..scraper_enhanced import EnhancedOpportunityScraper
from ..ai_service import AIService
from datetime import datetime

# Enhanced scraper route with better error handling and monitoring
router = APIRouter(prefix="/scraper", tags=["Scraper Controls"])

# Enhanced scraping with better error handling
async def enhanced_scraper_with_monitoring(scraper_engine, ai_service, db):
    """Enhanced scraper with better monitoring and error handling"""
    pass

# Enhanced version of scraper.py with better error handling and more sources
import asyncio
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from .. import crud, schemas, models
from ..database import get_db
from ..ai_service import AIService
from ..scraper import OpportunityScraper