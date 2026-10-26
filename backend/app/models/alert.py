import datetime
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, JSON, Text
from sqlalchemy.orm import relationship
from app.db.session import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(36), primary_key=True, index=True)
    analysis_id = Column(String(36), ForeignKey("analysis_jobs.id"), nullable=False)
    dataset_id = Column(String(36), ForeignKey("datasets.id"), nullable=False)
    row_index = Column(Integer, nullable=False)
    timestamp_str = Column(String(100), nullable=True)
    
    # Network entities if present
    source_ip = Column(String(50), nullable=True, index=True)
    destination_ip = Column(String(50), nullable=True, index=True)
    source_port = Column(Integer, nullable=True)
    destination_port = Column(Integer, nullable=True)
    protocol = Column(String(20), nullable=True)

    # Classification & Anomaly status
    predicted_label = Column(String(100), nullable=False)
    anomaly_score = Column(Float, nullable=False) # Normalized 0.0 - 1.0 (1.0 = highly anomalous)
    is_anomaly = Column(Integer, default=1)
    risk_level = Column(String(20), default="MEDIUM", index=True) # LOW, MEDIUM, HIGH, CRITICAL
    
    # Investigation status
    status = Column(String(30), default="NEW", index=True) # NEW, INVESTIGATING, RESOLVED, FALSE_POSITIVE
    analyst_notes = Column(Text, nullable=True)
    features_payload = Column(JSON, nullable=True) # Key contributing features
    top_explanations = Column(JSON, nullable=True) # Human readable explanation factors
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    analysis = relationship("AnalysisJob", back_populates="alerts")
    dataset = relationship("Dataset", back_populates="alerts")

