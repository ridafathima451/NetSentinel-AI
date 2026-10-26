from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.alert import AlertResponse

class NoteCreate(BaseModel):
    content: str
    author: str = "Security Analyst"

class NoteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    investigation_id: str
    author: str
    content: str
    note_type: str
    created_at: datetime

class InvestigationCreate(BaseModel):
    title: str
    summary: str | None = None
    priority: str = "MEDIUM" # LOW, MEDIUM, HIGH, CRITICAL
    alert_ids: list[str] = []

class InvestigationUpdate(BaseModel):
    title: str | None = None
    summary: str | None = None
    status: str | None = None # OPEN, INVESTIGATING, RESOLVED, FALSE_POSITIVE
    priority: str | None = None

class InvestigationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    summary: str | None
    status: str
    priority: str
    correlation_reason: str | None
    target_entity: str | None
    alert_count: int
    created_at: datetime
    updated_at: datetime
    notes: list[NoteResponse] = []
    alerts: list[AlertResponse] = []

