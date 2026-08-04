import logging
import time
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.scheduler import start_scheduler, stop_scheduler
from app.routes import opportunities, sources, pipeline, auth, applications
from app.routes import profile, notifications, organizations, admin, published, contact
from app.core.exceptions import NexoraException

logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("nexora")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Nexora Discovery Engine...")

    # ── Bootstrap the database ──────────────────────────────────────────
    # Run migrations, seed initial data, and backfill slugs so the API is
    # ready to serve requests immediately. Idempotent — safe on every boot.
    from app.startup import run_startup
    run_startup()

    # ── Scheduler ───────────────────────────────────────────────────────
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

# ── Rate Limiting ──────────────────────────────────────────────────────────────

# Best-effort in-memory flood protection. Intentionally resets on restart;
# durable multi-instance rate limiting belongs behind a shared store once the
# product has that budget.
_rate_limit_hits: dict[str, deque] = defaultdict(deque)
_RATE_LIMIT = 100       # requests per window (also the hard cutoff)
_RATE_WINDOW = 60       # seconds


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Only rate-limit public GET endpoints (opportunities, sources, health)
    path = request.url.path
    if request.method != "GET" or not (
        path.startswith("/api/opportunities")
        or path.startswith("/api/sources")
        or path.startswith("/api/health")
        or path.startswith("/api/organizations")
    ):
        return await call_next(request)

    # Use IP or forwarded-for header
    client_ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "unknown")
    key = f"{client_ip}:{path.split('/')[3] if len(path.split('/')) > 3 else 'root'}"

    now = time.monotonic()
    hits = _rate_limit_hits[key]

    # Prune expired entries
    while hits and hits[0] <= now - _RATE_WINDOW:
        hits.popleft()

    if len(hits) >= _RATE_LIMIT:
        return JSONResponse(
            status_code=429,
            content={
                "success": False,
                "data": None,
                "meta": {},
                "error": {
                    "code": "RATE_LIMITED",
                    "message": "Too many requests. Please slow down.",
                    "details": [f"Max {_RATE_LIMIT} requests per {_RATE_WINDOW}s per endpoint"],
                },
            },
            headers={"Retry-After": str(_RATE_WINDOW)},
        )

    hits.append(now)

    # Add informative headers
    response = await call_next(request)
    response.headers["X-RateLimit-Limit"] = str(_RATE_LIMIT)
    response.headers["X-RateLimit-Remaining"] = str(max(0, _RATE_LIMIT - len(hits)))
    return response


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
    allow_origin_regex=r"https://.*\.pages\.dev|https://.*\.vercel\.app|https://.*\.onrender\.com|http://localhost(:\d+)?|http://127\.0\.0\.1(:\d+)?",
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
app.include_router(published.router)
app.include_router(sources.router)
app.include_router(pipeline.router)
app.include_router(admin.router)
app.include_router(contact.router)

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
