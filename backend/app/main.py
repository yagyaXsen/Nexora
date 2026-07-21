import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.scheduler import start_scheduler, stop_scheduler
from app.routes import opportunities, sources, pipeline

logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("nexora")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Nexora Discovery Engine lifespan...")
    start_scheduler()
    yield
    logger.info("Stopping Nexora Discovery Engine lifespan...")
    stop_scheduler()

app = FastAPI(
    title=settings.APP_NAME,
    version="2.0.0",
    description="Nexora AI-Assisted Opportunity Discovery & Pipeline Engine",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(opportunities.router)
app.include_router(sources.router)
app.include_router(pipeline.router)

@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "mock_ai": settings.USE_MOCK_AI,
        "database": settings.DATABASE_URL.split("://")[0]
    }
