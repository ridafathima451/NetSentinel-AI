import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.db.init_db import init_db
from app.api import (
    health,
    datasets,
    analysis,
    models,
    alerts,
    investigations,
    assistant,
    reports,
    topology,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("netsentinel")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "Intelligent Network Anomaly Detection and Cybersecurity Investigation Platform. "
        "Provides machine learning analytics, unsupervised anomaly detection (Isolation Forest), "
        "supervised classification (Random Forest), explainable AI (feature attribution), "
        "incident correlation, and evidence-grounded AI assistance."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)

# Strict CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    logger.info("Initializing NetSentinel AI backend...")
    init_db()
    logger.info("Database initialized successfully.")

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error processing {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please consult backend logs."},
    )

# Register routers
api_prefix = settings.API_PREFIX
app.include_router(health.router, prefix=api_prefix)
app.include_router(datasets.router, prefix=api_prefix)
app.include_router(analysis.router, prefix=api_prefix)
app.include_router(models.router, prefix=api_prefix)
app.include_router(alerts.router, prefix=api_prefix)
app.include_router(investigations.router, prefix=api_prefix)
app.include_router(assistant.router, prefix=api_prefix)
app.include_router(reports.router, prefix=api_prefix)
app.include_router(topology.router, prefix=api_prefix)

@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "health": f"{api_prefix}/health",
    }

