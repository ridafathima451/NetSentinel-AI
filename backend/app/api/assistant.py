from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.alert import Alert
from app.models.dataset import Dataset
from app.models.investigation import Investigation
from app.schemas.ai_assistant import AIAssistantRequest, AIAssistantResponse
from app.services.ai_assistant import AIAssistantService

router = APIRouter(prefix="/assistant", tags=["AI Investigation Assistant"])

@router.post("/query", response_model=AIAssistantResponse)
def query_assistant(payload: AIAssistantRequest, db: Session = Depends(get_db)):
    """
    Evidence-grounded cybersecurity assistant query.
    Extracts genuine record attributes and synthesizes facts, model predictions,
    and investigation hypotheses without executing untrusted instructions.
    """
    alert_dict = None
    dataset_dict = None

    if payload.alert_id:
        alert = db.query(Alert).filter(Alert.id == payload.alert_id).first()
        if alert:
            alert_dict = {
                "id": alert.id,
                "source_ip": alert.source_ip,
                "destination_ip": alert.destination_ip,
                "source_port": alert.source_port,
                "destination_port": alert.destination_port,
                "protocol": alert.protocol,
                "predicted_label": alert.predicted_label,
                "anomaly_score": alert.anomaly_score,
                "risk_level": alert.risk_level,
                "timestamp_str": alert.timestamp_str,
                "features_payload": alert.features_payload,
            }

    if payload.dataset_id:
        ds = db.query(Dataset).filter(Dataset.id == payload.dataset_id).first()
        if ds:
            dataset_dict = {
                "name": ds.original_filename,
                "rows": ds.row_count,
                "columns": ds.column_count,
            }

    result = AIAssistantService.generate_investigation_guidance(
        alert_data=alert_dict,
        dataset_meta=dataset_dict,
        custom_query=payload.query,
    )

    return AIAssistantResponse(**result)

