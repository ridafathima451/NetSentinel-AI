import uuid
import shutil
from pathlib import Path
import pandas as pd
import numpy as np
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import get_db
from app.models.dataset import Dataset
from app.schemas.dataset import DatasetSummary, DatasetPreviewResponse, ColumnMeta
from app.ml.preprocessor import clean_column_names, identify_columns

router = APIRouter(prefix="/datasets", tags=["Datasets"])

@router.post("/upload", response_model=DatasetSummary)
async def upload_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Uploads and analyzes a network traffic CSV dataset safely."""
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    dataset_id = str(uuid.uuid4())
    safe_name = f"{dataset_id}_{Path(file.filename).name}"
    file_path = settings.UPLOAD_DIR / safe_name

    # Save file safely with size check
    bytes_written = 0
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    with open(file_path, "wb") as f_out:
        while chunk := await file.read(1024 * 1024):
            bytes_written += len(chunk)
            if bytes_written > max_bytes:
                file_path.unlink(missing_ok=True)
                raise HTTPException(status_code=413, detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB.")
            f_out.write(chunk)

    try:
        # Inspect CSV structure
        df_sample = pd.read_csv(file_path, nrows=500)
        df_sample = clean_column_names(df_sample)
        
        # Estimate or count total rows safely
        # Count lines efficiently
        with open(file_path, "rb") as f:
            total_lines = sum(1 for _ in f)
        row_count = max(0, total_lines - 1) # minus header

        roles = identify_columns(df_sample)

        # Build column metadata
        columns_meta = []
        for col in df_sample.columns:
            is_num = bool(pd.api.types.is_numeric_dtype(df_sample[col]))
            missing_cnt = int(df_sample[col].isna().sum())
            unique_cnt = int(df_sample[col].nunique())
            samples = [str(x) for x in df_sample[col].dropna().head(3).tolist()]

            # Determine role
            role = "feature"
            if col == roles["label_col"]:
                role = "target"
            elif col == roles["src_ip_col"]:
                role = "source_ip"
            elif col == roles["dst_ip_col"]:
                role = "dest_ip"
            elif col == roles["src_port_col"] or col == roles["dst_port_col"]:
                role = "port"
            elif col == roles["timestamp_col"]:
                role = "timestamp"

            columns_meta.append(
                ColumnMeta(
                    name=col,
                    dtype=str(df_sample[col].dtype),
                    missing_count=missing_cnt,
                    is_numeric=is_num,
                    unique_count=unique_cnt,
                    sample_values=samples,
                    suggested_role=role,
                )
            )

        dataset = Dataset(
            id=dataset_id,
            filename=safe_name,
            original_filename=file.filename,
            file_path=str(file_path),
            file_size_bytes=bytes_written,
            row_count=row_count,
            column_count=len(df_sample.columns),
            columns_metadata=[c.dict() for c in columns_meta],
            has_labels=1 if roles["label_col"] else 0,
            has_ips=1 if (roles["src_ip_col"] and roles["dst_ip_col"]) else 0,
            has_timestamps=1 if roles["timestamp_col"] else 0,
        )

        db.add(dataset)
        db.commit()
        db.refresh(dataset)

        return DatasetSummary(
            id=dataset.id,
            filename=dataset.filename,
            original_filename=dataset.original_filename,
            file_size_bytes=dataset.file_size_bytes,
            row_count=dataset.row_count,
            column_count=dataset.column_count,
            has_labels=bool(dataset.has_labels),
            has_ips=bool(dataset.has_ips),
            has_timestamps=bool(dataset.has_timestamps),
            created_at=dataset.created_at,
            columns_metadata=columns_meta,
        )
    except Exception as e:
        file_path.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail=f"Failed to inspect CSV dataset: {str(e)}")

@router.get("", response_model=list[DatasetSummary])
def list_datasets(db: Session = Depends(get_db)):
    """Lists all registered network traffic datasets."""
    datasets = db.query(Dataset).order_by(Dataset.created_at.desc()).all()
    res = []
    for d in datasets:
        cols_meta = [ColumnMeta(**c) for c in (d.columns_metadata or [])]
        res.append(
            DatasetSummary(
                id=d.id,
                filename=d.filename,
                original_filename=d.original_filename,
                file_size_bytes=d.file_size_bytes,
                row_count=d.row_count,
                column_count=d.column_count,
                has_labels=bool(d.has_labels),
                has_ips=bool(d.has_ips),
                has_timestamps=bool(d.has_timestamps),
                created_at=d.created_at,
                columns_metadata=cols_meta,
            )
        )
    return res

@router.get("/{dataset_id}/preview", response_model=DatasetPreviewResponse)
def preview_dataset(dataset_id: str, db: Session = Depends(get_db)):
    """Returns row preview, missing values summary, and duplicate counts."""
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    file_path = Path(dataset.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Dataset file missing on disk.")

    df_preview = pd.read_csv(file_path, nrows=settings.MAX_PREVIEW_ROWS)
    df_preview = clean_column_names(df_preview)

    missing_summary = {str(k): int(v) for k, v in df_preview.isna().sum().items()}
    dup_count = int(df_preview.duplicated().sum())

    cols_meta = [ColumnMeta(**c) for c in (dataset.columns_metadata or [])]

    return DatasetPreviewResponse(
        dataset=DatasetSummary(
            id=dataset.id,
            filename=dataset.filename,
            original_filename=dataset.original_filename,
            file_size_bytes=dataset.file_size_bytes,
            row_count=dataset.row_count,
            column_count=dataset.column_count,
            has_labels=bool(dataset.has_labels),
            has_ips=bool(dataset.has_ips),
            has_timestamps=bool(dataset.has_timestamps),
            created_at=dataset.created_at,
            columns_metadata=cols_meta,
        ),
        preview_rows=df_preview.fillna("").to_dict(orient="records"),
        total_rows=dataset.row_count,
        total_columns=dataset.column_count,
        missing_summary=missing_summary,
        duplicate_rows_count=dup_count,
    )

@router.post("/generate-sample", response_model=DatasetSummary)
def generate_sample_dataset(db: Session = Depends(get_db)):
    """
    Generates a realistic synthetic network traffic dataset fixture for research & testing.
    Clearly labeled as synthetic data simulating benign web traffic, SSH brute-force, and SYN scanning.
    """
    dataset_id = str(uuid.uuid4())
    filename = f"synthetic_cic_ids_sample_{dataset_id[:8]}.csv"
    file_path = settings.SAMPLES_DIR / filename

    np.random.seed(42)
    n_rows = 400

    # Simulate realistic network flow features modeled after CIC-IDS2017
    src_ips = ["192.168.1.105", "192.168.1.110", "192.168.1.115", "10.0.0.45", "172.16.0.12"]
    dst_ips = ["192.168.1.1", "172.217.16.206", "104.244.42.1", "192.168.1.200", "192.168.1.50"]
    dst_ports = [80, 443, 22, 53, 8080, 445, 3389, 21]

    data = []
    for i in range(n_rows):
        is_attack = (i % 7 == 0) or (i > 350)
        attack_type = "BENIGN"
        if is_attack:
            attack_type = "PortScan" if i % 2 == 0 else "SSH-Patator"

        src = np.random.choice(src_ips) if not is_attack else "192.168.1.199"
        dst = np.random.choice(dst_ips)
        port = int(np.random.choice(dst_ports)) if not is_attack else (22 if attack_type == "SSH-Patator" else int(1000 + (i % 50)))

        flow_duration = float(np.random.exponential(50000)) if not is_attack else float(np.random.uniform(10, 500))
        total_fwd_pkts = int(np.random.poisson(8)) if not is_attack else int(np.random.uniform(50, 400))
        total_bwd_pkts = int(np.random.poisson(6)) if not is_attack else int(np.random.uniform(1, 5))
        flow_bytes_s = float(np.random.normal(5000, 1500)) if not is_attack else float(np.random.normal(95000, 10000))
        flow_pkts_s = float(total_fwd_pkts + total_bwd_pkts) / max(flow_duration / 1e6, 0.001)

        data.append({
            "Source IP": src,
            "Destination IP": dst,
            "Source Port": int(np.random.randint(1024, 65535)),
            "Destination Port": port,
            "Protocol": "TCP" if port != 53 else "UDP",
            "Flow Duration": max(flow_duration, 1.0),
            "Total Fwd Packets": max(total_fwd_pkts, 1),
            "Total Backward Packets": max(total_bwd_pkts, 0),
            "Flow Bytes/s": max(flow_bytes_s, 0.0),
            "Flow Packets/s": max(flow_pkts_s, 0.0),
            "Packet Length Mean": float(np.random.uniform(40, 1200)),
            "Packet Length Std": float(np.random.uniform(10, 300)),
            "SYN Flag Count": 1 if attack_type == "PortScan" else int(np.random.choice([0, 1], p=[0.8, 0.2])),
            "ACK Flag Count": 1 if not is_attack else 0,
            "Timestamp": f"2026-10-24 14:{i//60:02d}:{i%60:02d}",
            "Label": attack_type,
        })

    df = pd.DataFrame(data)
    df.to_csv(file_path, index=False)

    roles = identify_columns(df)
    cols_meta = []
    for col in df.columns:
        cols_meta.append(
            ColumnMeta(
                name=col,
                dtype=str(df[col].dtype),
                missing_count=0,
                is_numeric=bool(pd.api.types.is_numeric_dtype(df[col])),
                unique_count=int(df[col].nunique()),
                sample_values=[str(x) for x in df[col].head(3).tolist()],
                suggested_role="target" if col == "Label" else ("source_ip" if col == "Source IP" else ("dest_ip" if col == "Destination IP" else "feature")),
            )
        )

    dataset = Dataset(
        id=dataset_id,
        filename=filename,
        original_filename="synthetic_cic_ids_sample.csv (Research Synthetic Fixture)",
        file_path=str(file_path),
        file_size_bytes=int(file_path.stat().st_size),
        row_count=n_rows,
        column_count=len(df.columns),
        columns_metadata=[c.dict() for c in cols_meta],
        has_labels=1,
        has_ips=1,
        has_timestamps=1,
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)

    return DatasetSummary(
        id=dataset.id,
        filename=dataset.filename,
        original_filename=dataset.original_filename,
        file_size_bytes=dataset.file_size_bytes,
        row_count=dataset.row_count,
        column_count=dataset.column_count,
        has_labels=True,
        has_ips=True,
        has_timestamps=True,
        created_at=dataset.created_at,
        columns_metadata=cols_meta,
    )

@router.delete("/{dataset_id}")
def delete_dataset(dataset_id: str, db: Session = Depends(get_db)):
    """Deletes dataset entry and associated uploaded file."""
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    file_path = Path(dataset.file_path)
    file_path.unlink(missing_ok=True)

    db.delete(dataset)
    db.commit()
    return {"message": "Dataset deleted successfully."}

