from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.config import settings
from app.db.session import get_db
from app.models.dataset import Dataset
from app.models.model_record import TrainedModel
from app.models.analysis import AnalysisJob
from app.models.alert import Alert
from app.services.monitoring_adapter import monitoring_adapter

router = APIRouter(tags=["System & Health"])

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    """Validates backend service and database connectivity."""
    db_ok = False
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    return {
        "status": "online" if db_ok else "degraded",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database_connected": db_ok,
    }

@router.get("/system/status")
def get_system_status(db: Session = Depends(get_db)):
    """Returns comprehensive system metrics, model availability, and configuration status."""
    db_connected = False
    dataset_count = 0
    model_count = 0
    analysis_count = 0
    alert_count = 0

    try:
        db.execute(text("SELECT 1"))
        db_connected = True
        dataset_count = db.query(Dataset).count()
        model_count = db.query(TrainedModel).count()
        analysis_count = db.query(AnalysisJob).count()
        alert_count = db.query(Alert).count()
    except Exception:
        pass

    gemini_configured = bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip())

    return {
        "project_name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": {
            "type": "SQLite",
            "connected": db_connected,
            "url": "sqlite:///data/netsentinel.db",
        },
        "inventory": {
            "datasets_count": dataset_count,
            "trained_models_count": model_count,
            "analyses_executed": analysis_count,
            "total_alerts": alert_count,
        },
        "integrations": {
            "gemini_api_configured": gemini_configured,
            "gemini_model": "gemini-2.5-flash" if gemini_configured else "None (Local Fallback Active)",
        },
        "monitoring": monitoring_adapter.get_status(),
        "limitations": [
            "NetSentinel AI is an educational / research triage tool, not a certified production SIEM/EDR.",
            "Predictions are derived from statistical model evaluations and require human analyst validation.",
            "No live network traffic is intercepted without explicit system privileges and authorized configuration."
        ]
    }

