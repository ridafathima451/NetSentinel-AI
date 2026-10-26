from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.analysis import AnalysisJob
from app.models.dataset import Dataset
from app.models.model_record import TrainedModel
from app.models.alert import Alert
from app.services.report_generator import ReportGenerator

router = APIRouter(prefix="/reports", tags=["Reports & Exports"])

@router.get("/analysis/{analysis_id}/html", response_class=HTMLResponse)
def get_html_report(analysis_id: str, db: Session = Depends(get_db)):
    """Generates an executive / analyst incident report as a styled standalone HTML page."""
    job = db.query(AnalysisJob).filter(AnalysisJob.id == analysis_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Analysis job not found.")

    dataset = db.query(Dataset).filter(Dataset.id == job.dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Associated dataset not found.")

    model_info = None
    if job.model_id:
        m = db.query(TrainedModel).filter(TrainedModel.id == job.model_id).first()
        if m:
            model_info = {
                "algorithm": m.algorithm,
                "accuracy": m.accuracy,
                "f1_macro": m.f1_macro,
                "precision_macro": m.precision_macro,
                "recall_macro": m.recall_macro,
            }

    alerts = db.query(Alert).filter(Alert.analysis_id == job.id).order_by(Alert.anomaly_score.desc()).limit(50).all()
    alerts_data = [
        {
            "id": a.id,
            "timestamp_str": a.timestamp_str,
            "source_ip": a.source_ip,
            "destination_ip": a.destination_ip,
            "source_port": a.source_port,
            "destination_port": a.destination_port,
            "risk_level": a.risk_level,
            "anomaly_score": a.anomaly_score,
            "predicted_label": a.predicted_label,
            "status": a.status,
        }
        for a in alerts
    ]

    html_content = ReportGenerator.generate_html_report(
        analysis_job={
            "id": job.id,
            "pipeline_type": job.pipeline_type,
            "total_records": job.total_records,
            "anomalies_detected": job.anomalies_detected,
        },
        dataset={
            "original_filename": dataset.original_filename,
            "row_count": dataset.row_count,
            "column_count": dataset.column_count,
        },
        model_info=model_info,
        alerts=alerts_data,
    )

    return HTMLResponse(content=html_content)

