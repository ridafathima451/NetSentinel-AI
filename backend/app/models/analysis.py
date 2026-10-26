import datetime
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, JSON, Text
from sqlalchemy.orm import relationship
from app.db.session import Base

class AnalysisJob(Base):
    __tablename__ = "analysis_jobs"

    id = Column(String(36), primary_key=True, index=True)
    dataset_id = Column(String(36), ForeignKey("datasets.id"), nullable=False)
    model_id = Column(String(36), nullable=True) # ID of TrainedModel if used
    pipeline_type = Column(String(50), nullable=False) # 'supervised_rf', 'unsupervised_iforest', 'hybrid'
    status = Column(String(30), default="COMPLETED") # PENDING, PROCESSING, COMPLETED, FAILED
    total_records = Column(Integer, default=0)
    anomalies_detected = Column(Integer, default=0)
    high_risk_count = Column(Integer, default=0)
    medium_risk_count = Column(Integer, default=0)
    low_risk_count = Column(Integer, default=0)
    execution_time_seconds = Column(Float, default=0.0)
    summary_metrics = Column(JSON, nullable=True)
    results_csv_path = Column(String(500), nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    dataset = relationship("Dataset", back_populates="analyses")
    alerts = relationship("Alert", back_populates="analysis", cascade="all, delete-orphan")

