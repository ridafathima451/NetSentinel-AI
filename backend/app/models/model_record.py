import datetime
from sqlalchemy import Column, DateTime, Float, Integer, String, JSON, Text
from app.db.session import Base

class TrainedModel(Base):
    __tablename__ = "trained_models"

    id = Column(String(36), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    algorithm = Column(String(50), nullable=False) # 'random_forest', 'isolation_forest'
    task_type = Column(String(50), nullable=False) # 'classification', 'anomaly_detection'
    dataset_name = Column(String(255), nullable=True)
    training_rows = Column(Integer, default=0)
    test_rows = Column(Integer, default=0)
    features_used = Column(JSON, nullable=False) # list of feature names
    target_column = Column(String(100), nullable=True)
    classes = Column(JSON, nullable=True) # list of distinct class names
    
    # Evaluation metrics
    accuracy = Column(Float, nullable=True)
    precision_macro = Column(Float, nullable=True)
    recall_macro = Column(Float, nullable=True)
    f1_macro = Column(Float, nullable=True)
    roc_auc = Column(Float, nullable=True)
    confusion_matrix = Column(JSON, nullable=True)
    class_report = Column(JSON, nullable=True)
    feature_importances = Column(JSON, nullable=True) # list of {feature, importance}

    artifact_path = Column(String(500), nullable=False)
    parameters = Column(JSON, nullable=True)
    status = Column(String(30), default="ACTIVE")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

