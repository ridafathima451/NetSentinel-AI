import json
from pathlib import Path
from typing import Any
from datetime import datetime

class ReportGenerator:
    """Generates professional HTML/printable and CSV incident investigation reports."""

    @staticmethod
    def generate_html_report(
        analysis_job: dict[str, Any],
        dataset: dict[str, Any],
        model_info: dict[str, Any] | None,
        alerts: list[dict[str, Any]],
        investigation: dict[str, Any] | None = None,
    ) -> str:
        """Constructs a comprehensive, cyber-themed standalone HTML report."""
        now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

        # Alerts summary count
        critical_count = sum(1 for a in alerts if a.get("risk_level") == "CRITICAL")
        high_count = sum(1 for a in alerts if a.get("risk_level") == "HIGH")
        medium_count = sum(1 for a in alerts if a.get("risk_level") == "MEDIUM")
        low_count = sum(1 for a in alerts if a.get("risk_level") == "LOW")

        # Metrics display
        metrics_html = ""
        if model_info:
            acc = model_info.get("accuracy")
            f1 = model_info.get("f1_macro")
            prec = model_info.get("precision_macro")
            rec = model_info.get("recall_macro")
            metrics_html = f"""
            <div class="metrics-grid">
                <div class="metric-card">
                    <span class="label">Accuracy [Measured on Test Split]</span>
                    <span class="val">{f"{acc:.2%}" if acc is not None else "N/A"}</span>
                </div>
                <div class="metric-card">
                    <span class="label">Macro F1-Score [Measured]</span>
                    <span class="val">{f"{f1:.4f}" if f1 is not None else "N/A"}</span>
                </div>
                <div class="metric-card">
                    <span class="label">Macro Precision [Measured]</span>
                    <span class="val">{f"{prec:.4f}" if prec is not None else "N/A"}</span>
                </div>
                <div class="metric-card">
                    <span class="label">Macro Recall [Measured]</span>
                    <span class="val">{f"{rec:.4f}" if rec is not None else "N/A"}</span>
                </div>
            </div>
            """
        else:
            metrics_html = """
            <p class="note">Unsupervised Anomaly Detection mode (Isolation Forest) was executed. Supervised test metrics (F1/Accuracy) are Not Applicable (N/A) without ground-truth labels.</p>
            """

        # Alerts rows
        alerts_rows = ""
        for a in alerts[:25]:
            alerts_rows += f"""
            <tr>
                <td><code>{a.get('id', '')[:8]}</code></td>
                <td>{a.get('timestamp_str') or 'N/A'}</td>
                <td>{a.get('source_ip') or 'N/A'}:{a.get('source_port') or ''}</td>
                <td>{a.get('destination_ip') or 'N/A'}:{a.get('destination_port') or ''}</td>
                <td><span class="badge badge-{a.get('risk_level', 'LOW').lower()}">{a.get('risk_level')}</span></td>
                <td>{a.get('anomaly_score', 0.0):.4f}</td>
                <td>{a.get('predicted_label', 'Unknown')}</td>
                <td>{a.get('status', 'NEW')}</td>
            </tr>
            """

        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>NetSentinel AI - Cybersecurity Investigation Report</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #0b0f19;
            color: #e2e8f0;
            margin: 0;
            padding: 30px;
            line-height: 1.6;
        }}
        .header {{
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }}
        .title {{ font-size: 24px; font-weight: 700; color: #60a5fa; margin: 0; }}
        .subtitle {{ font-size: 14px; color: #94a3b8; margin-top: 4px; }}
        .section {{ background: #1e293b; border-radius: 8px; padding: 20px; margin-bottom: 25px; border: 1px solid #334155; }}
        .section-title {{ font-size: 18px; font-weight: 600; color: #93c5fd; margin-top: 0; border-bottom: 1px solid #334155; padding-bottom: 8px; }}
        .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px; }}
        .metric-card {{ background: #0f172a; padding: 15px; border-radius: 6px; border: 1px solid #1e293b; }}
        .metrics-grid {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 15px; }}
        .label {{ font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; display: block; }}
        .val {{ font-size: 20px; font-weight: 700; color: #38bdf8; margin-top: 4px; display: block; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }}
        th, td {{ padding: 10px 12px; text-align: left; border-bottom: 1px solid #334155; }}
        th {{ background: #0f172a; color: #94a3b8; font-weight: 600; text-transform: uppercase; font-size: 11px; }}
        .badge {{ padding: 3px 8px; border-radius: 4px; font-weight: 600; font-size: 11px; }}
        .badge-critical {{ background: #7f1d1d; color: #fecaca; }}
        .badge-high {{ background: #9a3412; color: #fed7aa; }}
        .badge-medium {{ background: #854d0e; color: #fef08a; }}
        .badge-low {{ background: #14532d; color: #bbf7d0; }}
        .disclaimer {{ background: #1e1b4b; border-left: 4px solid #6366f1; padding: 15px; border-radius: 4px; margin-top: 30px; font-size: 13px; color: #c7d2fe; }}
        @media print {{
            body {{ background: #ffffff; color: #000000; padding: 0; }}
            .section {{ background: #ffffff; border: 1px solid #cccccc; color: #000000; }}
            .metric-card {{ background: #f8fafc; border: 1px solid #cccccc; color: #000000; }}
            th {{ background: #f1f5f9; color: #000000; }}
            .title {{ color: #1e40af; }}
        }}
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h1 class="title">NetSentinel AI — Cybersecurity Investigation Report</h1>
            <div class="subtitle">Intelligent Network Anomaly Detection and Threat Analytics Platform</div>
        </div>
        <div style="text-align: right; font-size: 13px; color: #94a3b8;">
            <div>Generated: {now_str}</div>
            <div>Classification: Research / Incident Triage</div>
        </div>
    </div>

    <div class="section">
        <h2 class="section-title">1. Executive & Dataset Summary</h2>
        <div class="grid">
            <div class="metric-card"><span class="label">Dataset Name</span><span class="val" style="font-size: 15px;">{dataset.get('original_filename', 'N/A')}</span></div>
            <div class="metric-card"><span class="label">Total Records Evaluated</span><span class="val">{analysis_job.get('total_records', 0):,}</span></div>
            <div class="metric-card"><span class="label">Anomalies Flagged</span><span class="val" style="color: #f87171;">{analysis_job.get('anomalies_detected', 0):,}</span></div>
            <div class="metric-card"><span class="label">Critical / High Alerts</span><span class="val" style="color: #fb923c;">{critical_count + high_count:,}</span></div>
        </div>
    </div>

    <div class="section">
        <h2 class="section-title">2. Model Details & Performance Metrics</h2>
        <p><strong>Pipeline Mode:</strong> {analysis_job.get('pipeline_type', 'Hybrid / Anomaly Detection')}</p>
        <p><strong>Model Engine:</strong> {model_info.get('algorithm', 'Isolation Forest') if model_info else 'Isolation Forest'}</p>
        {metrics_html}
    </div>

    <div class="section">
        <h2 class="section-title">3. Priority Alerts & Evidence Sampling (Top 25)</h2>
        <table>
            <thead>
                <tr>
                    <th>Alert ID</th>
                    <th>Timestamp</th>
                    <th>Source Entity</th>
                    <th>Destination Entity</th>
                    <th>Risk Priority</th>
                    <th>Anomaly Score</th>
                    <th>Predicted Class</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                {alerts_rows if alerts_rows else '<tr><td colspan="8">No alerts generated for this dataset.</td></tr>'}
            </tbody>
        </table>
    </div>

    <div class="disclaimer">
        <strong>Academic Research & Demonstration Disclaimer:</strong><br>
        NetSentinel AI is built for educational, research, and proof-of-concept cybersecurity triage purposes. Model performance metrics reflect evaluation on specific dataset partitions and do not guarantee detection efficacy against novel zero-day attacks or evolving production threats. Prioritization risk scores represent heuristic statistical indicators and require verification by certified incident response personnel.
    </div>
</body>
</html>
"""
        return html
