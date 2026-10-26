from typing import Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

class ModelTrainRequest(BaseModel):
    dataset_id: str
    algorithm: str = "random_forest" # 'random_forest' or 'isolation_forest'
    target_column: str | None = None
    feature_columns: list[str] | None = None
    test_size: float = Field(default=0.25, ge=0.1, le=0.5)
    random_state: int = 42
    n_estimators: int = Field(default=100, ge=10, le=500)
    max_depth: int | None = Field(default=15, ge=2, le=50)

class TrainedModelSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    algorithm: str
    task_type: str
    dataset_name: str | None
    training_rows: int
    test_rows: int
    features_used: list[str]
    target_column: str | None
    classes: list[str] | None
    accuracy: float | None
    precision_macro: float | None
    recall_macro: float | None
    f1_macro: float | None
    roc_auc: float | None
    confusion_matrix: list[list[int]] | None
    class_report: dict[str, Any] | None
    feature_importances: list[dict[str, Any]] | None
    created_at: datetime
    status: str
