from collections import defaultdict
from pathlib import Path
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.dataset import Dataset
from app.models.alert import Alert
from app.ml.preprocessor import clean_column_names, identify_columns

router = APIRouter(prefix="/topology", tags=["Network Topology"])

@router.get("/{dataset_id}")
def get_topology(dataset_id: str, db: Session = Depends(get_db)):
    """
    Extracts genuine observed network topology nodes and communication edges.
    Returns clear empty state reason if dataset lacks IP address attributes.
    """
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    if not dataset.has_ips:
        return {
            "available": False,
            "reason": (
                "The selected dataset does not contain recognizable Source IP and Destination IP columns. "
                "Network topology visualization requires network endpoints (IP addresses) to map nodes and edges."
            ),
            "nodes": [],
            "edges": [],
        }

    file_path = Path(dataset.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Dataset file missing.")

    # Read up to 1000 rows for performant graph rendering
    df = pd.read_csv(file_path, nrows=1000)
    df = clean_column_names(df)
    roles = identify_columns(df)

    src_col = roles["src_ip_col"]
    dst_col = roles["dst_ip_col"]

    if not src_col or not dst_col or src_col not in df.columns or dst_col not in df.columns:
        return {
            "available": False,
            "reason": "Could not map Source and Destination IP fields in this file.",
            "nodes": [],
            "edges": [],
        }

    # Fetch alerts for this dataset to tag high-risk nodes
    alerts = db.query(Alert).filter(Alert.dataset_id == dataset.id).all()
    high_risk_ips = set()
    for a in alerts:
        if a.risk_level in ["CRITICAL", "HIGH"]:
            if a.source_ip:
                high_risk_ips.add(a.source_ip)
            if a.destination_ip:
                high_risk_ips.add(a.destination_ip)

    # Aggregate communication edges
    edge_counts = defaultdict(lambda: {"count": 0, "protocols": set(), "has_anomaly": False})
    node_traffic = defaultdict(int)

    for _, row in df.iterrows():
        src = str(row[src_col]).strip()
        dst = str(row[dst_col]).strip()
        if not src or not dst or src == "nan" or dst == "nan":
            continue

        pair_key = (src, dst)
        edge_counts[pair_key]["count"] += 1
        if roles["protocol_col"] and pd.notna(row.get(roles["protocol_col"])):
            edge_counts[pair_key]["protocols"].add(str(row[roles["protocol_col"]]))

        if src in high_risk_ips or dst in high_risk_ips:
            edge_counts[pair_key]["has_anomaly"] = True

        node_traffic[src] += 1
        node_traffic[dst] += 1

    # Keep top 30 most active nodes for an uncluttered, responsive React Flow graph
    sorted_nodes = sorted(node_traffic.items(), key=lambda x: x[1], reverse=True)[:30]
    active_ip_set = {ip for ip, _ in sorted_nodes}

    # Build React Flow nodes
    nodes = []
    # Place nodes in a circular or grid layout
    import math
    n = len(active_ip_set)
    radius = 320
    center_x = 450
    center_y = 350

    for idx, (ip, flow_cnt) in enumerate(sorted_nodes):
        angle = (2 * math.pi * idx) / max(n, 1)
        x = center_x + radius * math.cos(angle)
        y = center_y + radius * math.sin(angle)

        is_risk = ip in high_risk_ips

        nodes.append({
            "id": ip,
            "type": "default",
            "position": {"x": round(x, 1), "y": round(y, 1)},
            "data": {
                "label": f"{ip}\n({flow_cnt} flows)",
                "ip": ip,
                "flow_count": flow_cnt,
                "is_risk": is_risk,
                "threat_level": "CRITICAL" if is_risk else "NORMAL",
            },
            "className": "custom-node-risk" if is_risk else "custom-node-normal",
        })

    # Build React Flow edges
    edges = []
    edge_id = 0
    for (src, dst), edge_data in edge_counts.items():
        if src in active_ip_set and dst in active_ip_set:
            edge_id += 1
            has_anomaly = edge_data["has_anomaly"]
            edges.append({
                "id": f"e-{edge_id}",
                "source": src,
                "target": dst,
                "animated": has_anomaly,
                "label": f"{edge_data['count']} flows",
                "style": {
                    "stroke": "#ef4444" if has_anomaly else "#6366f1",
                    "strokeWidth": 2 if has_anomaly else 1,
                },
            })

    return {
        "available": True,
        "reason": None,
        "total_nodes": len(nodes),
        "total_edges": len(edges),
        "nodes": nodes,
        "edges": edges,
    }

