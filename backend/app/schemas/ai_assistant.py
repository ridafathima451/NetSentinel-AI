from typing import Any
from pydantic import BaseModel

class AIAssistantRequest(BaseModel):
    alert_id: str | None = None
    investigation_id: str | None = None
    dataset_id: str | None = None
    query: str | None = None

class AIAssistantResponse(BaseModel):
    summary: str
    observed_facts: list[str]
    model_predictions: list[str]
    hypotheses: list[str]
    suggested_steps: list[str]
    provider_used: str # "Gemini-2.5-Flash (API)" or "Local Grounded Engine (Rule-based ML Evidence)"
    limitations_notice: str
