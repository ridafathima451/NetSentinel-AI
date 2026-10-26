import uuid
from pathlib import Path
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import get_db
from app.models.dataset import Dataset
from app.models.model_record import TrainedModel
from app.schemas.model_record import ModelTrainRequest, TrainedModelSummary
from app.ml.preprocessor import clean_column_names, identify_columns
from app.ml.trainer import ModelTrainer

router = APIRouter(prefix="/models", tags=["Model Training & Evaluation"])

@router.post("/train", response_model=TrainedModelSummary)
def train_model(payload: ModelTrainRequest, db: Session = Depends(get_db)):
    """Trains a supervised classifier (e.g. Random Forest) and computes evaluation metrics."""
    dataset = db.query(Dataset).filter(Dataset.id == payload.dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    file_path = Path(dataset.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Dataset file missing on disk.")

    df = pd.read_csv(file_path, nrows=settings.MAX_ANALYSIS_ROWS)
    df = clean_column_names(df)

    roles = identify_columns(df)
    target_col = payload.target_column or roles["label_col"]
    if not target_col or target_col not in df.columns:
        raise HTTPException(
            status_code=400,
            detail=f"Target label column '{target_col}' not found. Supervised training requires a valid label column."
        )

    # Determine feature columns
    feature_cols = payload.feature_columns or roles["candidate_features"]
    feature_cols = [c for c in feature_cols if c in df.columns and c != target_col]
    if len(feature_cols) < 2:
        raise HTTPException(status_code=400, detail="At least 2 feature columns are required for training.")

    trainer = ModelTrainer(
        algorithm=payload.algorithm,
        n_estimators=payload.n_estimators,
        max_depth=payload.max_depth,
        random_state=payload.random_state,
    )

    try:
        eval_results = trainer.train_and_evaluate(
            df=df,
            feature_cols=feature_cols,
            target_col=target_col,
            test_size=payload.test_size,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Model training error: {str(e)}")

    model_id = str(uuid.uuid4())
    artifact_path = settings.MODELS_DIR / f"{model_id}.joblib"

    metadata = {
        "model_id": model_id,
        "algorithm": payload.algorithm,
        "dataset_name": dataset.original_filename,
        "feature_cols": feature_cols,
        "target_col": target_col,
    }
    trainer.save_artifact(artifact_path, metadata)

    model_record = TrainedModel(
        id=model_id,
        name=f"Random Forest ({target_col}) - {dataset.original_filename[:20]}",
        algorithm=payload.algorithm,
        task_type="classification",
        dataset_name=dataset.original_filename,
        training_rows=eval_results["training_rows"],
        test_rows=eval_results["test_rows"],
        features_used=eval_results["features_used"],
        target_column=target_col,
        classes=eval_results["classes"],
        accuracy=eval_results["accuracy"],
        precision_macro=eval_results["precision_macro"],
        recall_macro=eval_results["recall_macro"],
        f1_macro=eval_results["f1_macro"],
        roc_auc=eval_results["roc_auc"],
        confusion_matrix=eval_results["confusion_matrix"],
        class_report=eval_results["class_report"],
        feature_importances=eval_results["feature_importances"],
        artifact_path=str(artifact_path),
        parameters={
            "n_estimators": payload.n_estimators,
            "max_depth": payload.max_depth,
            "test_size": payload.test_size,
        },
        status="ACTIVE",
    )

    db.add(model_record)
    db.commit()
    db.refresh(model_record)

    return model_record

@router.get("", response_model=list[TrainedModelSummary])
def list_models(db: Session = Depends(get_db)):
    """Lists all saved trained models."""
    return db.query(TrainedModel).order_by(TrainedModel.created_at.desc()).all()

@router.get("/{model_id}", response_model=TrainedModelSummary)
def get_model(model_id: str, db: Session = Depends(get_db)):
    """Retrieves full evaluation metrics, confusion matrix, and feature importances for a model."""
    model = db.query(TrainedModel).filter(TrainedModel.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found.")
    return model

@router.delete("/{model_id}")
def delete_model(model_id: str, db: Session = Depends(get_db)):
    """Deletes model entry and its persisted joblib artifact."""
    model = db.query(TrainedModel).filter(TrainedModel.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found.")

    artifact_file = Path(model.artifact_path)
    artifact_file.unlink(missing_ok=True)

    db.delete(model)
    db.commit()
    return {"message": "Model deleted successfully."}

