from typing import Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    analysis_id: str
    dataset_id: str
    row_index: int
    timestamp_str: str | None
    source_ip: str | None
    destination_ip: str | None
    source_port: int | None
    destination_port: int | None
    protocol: str | None
    predicted_label: str
    anomaly_score: float
    is_anomaly: int
    risk_level: str
    status: str
    analyst_notes: str | None
    features_payload: dict[str, Any] | None
    top_explanations: list[dict[str, Any]] | None
    created_at: datetime

class AlertStatusUpdate(BaseModel):
    status: str # NEW, INVESTIGATING, RESOLVED, FALSE_POSITIVE
    analyst_notes: str | None = None

class AlertListResponse(BaseModel):
    alerts: list[AlertResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
