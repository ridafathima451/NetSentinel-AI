from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.alert import Alert
from app.schemas.alert import AlertResponse, AlertListResponse, AlertStatusUpdate

router = APIRouter(prefix="/alerts", tags=["Alert Center"])

@router.get("", response_model=AlertListResponse)
def list_alerts(
    risk_level: str | None = None,
    status: str | None = None,
    predicted_label: str | None = None,
    dataset_id: str | None = None,
    search: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=5, le=100),
    db: Session = Depends(get_db),
):
    """Retrieves paginated alerts with multi-dimensional filtering."""
    query = db.query(Alert)

    if risk_level and risk_level.upper() != "ALL":
        query = query.filter(Alert.risk_level == risk_level.upper())
    if status and status.upper() != "ALL":
        query = query.filter(Alert.status == status.upper())
    if predicted_label and predicted_label.upper() != "ALL":
        query = query.filter(Alert.predicted_label == predicted_label)
    if dataset_id:
        query = query.filter(Alert.dataset_id == dataset_id)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Alert.source_ip.ilike(search_pattern)) |
            (Alert.destination_ip.ilike(search_pattern)) |
            (Alert.predicted_label.ilike(search_pattern))
        )

    total = query.count()
    total_pages = max(1, (total + page_size - 1) // page_size)
    alerts = query.order_by(Alert.anomaly_score.desc(), Alert.created_at.desc()) \
                  .offset((page - 1) * page_size) \
                  .limit(page_size) \
                  .all()

    alert_responses = [AlertResponse.model_validate(a) for a in alerts]

    return AlertListResponse(
        alerts=alert_responses,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )

@router.get("/{alert_id}", response_model=AlertResponse)
def get_alert_detail(alert_id: str, db: Session = Depends(get_db)):
    """Retrieves single alert evidence details and explanation factor metrics."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")
    return alert

@router.patch("/{alert_id}", response_model=AlertResponse)
def update_alert_status(alert_id: str, payload: AlertStatusUpdate, db: Session = Depends(get_db)):
    """Allows an analyst to update alert status (e.g. INVESTIGATING, RESOLVED, FALSE_POSITIVE) and notes."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")

    valid_statuses = {"NEW", "INVESTIGATING", "RESOLVED", "FALSE_POSITIVE"}
    if payload.status.upper() not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Choose from {valid_statuses}")

    alert.status = payload.status.upper()
    if payload.analyst_notes is not None:
        alert.analyst_notes = payload.analyst_notes

    db.commit()
    db.refresh(alert)
    return alert

