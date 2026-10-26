from typing import Any
from datetime import datetime
from pydantic import BaseModel, Field

class AnalysisRequest(BaseModel):
    dataset_id: str
    model_id: str | None = None # Optional trained model, if omitted auto-selects or uses Isolation Forest
    mode: str = "auto" # 'auto', 'supervised', 'unsupervised', 'hybrid'
    contamination: float = Field(default=0.05, ge=0.001, le=0.5)
    selected_features: list[str] | None = None

class AnalysisJobResponse(BaseModel):
    id: str
    dataset_id: str
    pipeline_type: str
    status: str
    total_records: int
    anomalies_detected: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    execution_time_seconds: float
    summary_metrics: dict[str, Any] | None = None
    created_at: datetime
    error_message: str | None = None

class DashboardStats(BaseModel):
    total_records_analyzed: int
    total_anomalies_detected: int
    high_risk_alerts: int
    active_models_count: int
    datasets_count: int
    last_analysis_time: datetime | None = None
    traffic_class_distribution: list[dict[str, Any]] = []
    risk_level_distribution: list[dict[str, Any]] = []
    anomaly_score_bins: list[dict[str, Any]] = []
    timeline_trend: list[dict[str, Any]] = []
