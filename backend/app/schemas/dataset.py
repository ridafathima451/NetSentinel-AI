from typing import Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

class ColumnMeta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    dtype: str
    missing_count: int
    is_numeric: bool
    unique_count: int
    sample_values: list[Any] = []
    suggested_role: str = "feature" # 'feature', 'target', 'source_ip', 'dest_ip', 'port', 'timestamp', 'ignore'

class DatasetSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    filename: str
    original_filename: str
    file_size_bytes: int
    row_count: int
    column_count: int
    has_labels: bool
    has_ips: bool
    has_timestamps: bool
    created_at: datetime
    columns_metadata: list[ColumnMeta] | None = None

class DatasetPreviewResponse(BaseModel):
    dataset: DatasetSummary
    preview_rows: list[dict[str, Any]]
    total_rows: int
    total_columns: int
    missing_summary: dict[str, int]
    duplicate_rows_count: int
