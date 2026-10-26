import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, JSON, Text, Table
from sqlalchemy.orm import relationship
from app.db.session import Base

# Association table between Investigations and Alerts
investigation_alerts = Table(
    "investigation_alerts",
    Base.metadata,
    Column("investigation_id", String(36), ForeignKey("investigations.id"), primary_key=True),
    Column("alert_id", String(36), ForeignKey("alerts.id"), primary_key=True),
)

class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(String(36), primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    summary = Column(Text, nullable=True)
    status = Column(String(30), default="OPEN", index=True) # OPEN, INVESTIGATING, RESOLVED, FALSE_POSITIVE
    priority = Column(String(20), default="MEDIUM") # LOW, MEDIUM, HIGH, CRITICAL
    correlation_reason = Column(String(255), nullable=True) # e.g. "Shared destination IP: 192.168.10.50 (Port Scan pattern)"
    target_entity = Column(String(100), nullable=True) # e.g. IP or Subnet
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    notes = relationship("InvestigationNote", back_populates="investigation", cascade="all, delete-orphan", order_by="InvestigationNote.created_at.desc()")
    alerts = relationship("Alert", secondary=investigation_alerts, backref="investigations")

class InvestigationNote(Base):
    __tablename__ = "investigation_notes"

    id = Column(String(36), primary_key=True, index=True)
    investigation_id = Column(String(36), ForeignKey("investigations.id"), nullable=False)
    author = Column(String(100), default="Security Analyst")
    content = Column(Text, nullable=False)
    note_type = Column(String(30), default="USER") # USER or AI_ASSISTANT
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    investigation = relationship("Investigation", back_populates="notes")

