import datetime
from sqlalchemy import Column, DateTime, Integer, String, JSON, Text
from sqlalchemy.orm import relationship
from app.db.session import Base

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(String(36), primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size_bytes = Column(Integer, nullable=False, default=0)
    row_count = Column(Integer, nullable=False, default=0)
    column_count = Column(Integer, nullable=False, default=0)
    columns_metadata = Column(JSON, nullable=True)  # list of {name, dtype, missing_count, sample_values}
    has_labels = Column(Integer, default=0)         # 1 if label-like column detected
    has_ips = Column(Integer, default=0)            # 1 if source/dest IP detected
    has_timestamps = Column(Integer, default=0)     # 1 if timestamp detected
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    analyses = relationship("AnalysisJob", back_populates="dataset", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="dataset", cascade="all, delete-orphan")

