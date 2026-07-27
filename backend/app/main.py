import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.scheduler import start_scheduler, stop_scheduler
from app.routes import opportunities, sources, pipeline, auth, applications
from app.routes import profile, notifications, organizations
from app.core.exceptions import NexoraException

logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("nexora")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Nexora Discovery Engine...")
    # In-process cron only fires while the process is awake. Deployed on a free
    # host that spins down when idle, the midnight jobs would never run — so
    # those environments set ENABLE_INTERNAL_SCHEDULER=false and drive ingestion
    # from an external cron hitting /api/pipeline/cron/*.
    if settings.ENABLE_INTERNAL_SCHEDULER:
        start_scheduler()
    else:
        logger.info("Internal scheduler disabled — expecting external cron.")
    yield
    logger.info("Shutting down Nexora Discovery Engine...")
    if settings.ENABLE_INTERNAL_SCHEDULER:
        stop_scheduler()

app = FastAPI(
    title=settings.APP_NAME,
    version="2.0.0",
    description="Nexora AI-Powered Opportunity Intelligence Platform",
    lifespan=lifespan
)

# ── Exception Handlers ─────────────────────────────────────────────────────────

@app.exception_handler(NexoraException)
async def nexora_exception_handler(request: Request, exc: NexoraException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "data": None,
            "meta": {},
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
            }
        }
    )

# ── CORS ───────────────────────────────────────────────────────────────────────

# allow_origins=["*"] is invalid alongside allow_credentials=True — browsers
# reject credentialed cross-origin requests against a wildcard. The $0 stack puts
# the frontend on static hosting and the API on a separate host, so the real
# origins have to be listed explicitly.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ─────────────────────────────────────────────────────────────────────

app.include_router(auth.router)
app.include_router(auth.legacy_router)
app.include_router(profile.router)
app.include_router(notifications.router)
app.include_router(organizations.router)
app.include_router(applications.router)
app.include_router(opportunities.router)
app.include_router(sources.router)
app.include_router(pipeline.router)

@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "success": True,
        "data": {
            "status": "healthy",
            "app_name": settings.APP_NAME,
            "version": "2.0.0",
            "database": settings.DATABASE_URL.split("://")[0],
        }
    }
