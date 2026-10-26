import numpy as np
import pandas as pd
from typing import Any

# Domain knowledge explanations for common network traffic indicators
CYBER_FEATURE_KNOWLEDGE = {
    "flow bytes/s": "Extremely high byte transfer rates often indicate data exfiltration, volumetric DoS, or large file transfers.",
    "flow packets/s": "Abnormally high packet rates are a primary symptom of SYN flooding, UDP amplification, or automated scanning.",
    "fwd packet length max": "Unusually large forward packets can indicate buffer overflow attempts or tunneling payloads.",
    "bwd packet length mean": "Asymmetric backward packet sizes can suggest unauthorized data leakage or command-and-control heartbeats.",
    "flow duration": "Zero or near-zero flow duration with multiple attempts is typical of rapid TCP port probing.",
    "total fwd packets": "A high count of forward packets without corresponding responses suggests connection bombing or unanswered probes.",
    "destination port": "Known attack-targeted ports (e.g., 21 FTP, 22 SSH, 80 HTTP, 443 HTTPS, 445 SMB, 3389 RDP, 4444 Metasploit).",
}

class ExplainabilityEngine:
    """Generates genuine mathematical and rule-grounded explanations for traffic anomalies."""

    def __init__(self, feature_names: list[str], baseline_means: dict[str, float] | None = None, baseline_stds: dict[str, float] | None = None):
        self.feature_names = feature_names
        self.baseline_means = baseline_means or {}
        self.baseline_stds = baseline_stds or {}
        self.explanation_method = "Statistical Feature Attribution & Z-Score Deviation"

    def fit_baseline(self, df: pd.DataFrame, feature_names: list[str]):
        """Computes reference baseline statistics for feature deviation analysis."""
        self.feature_names = feature_names
        for col in feature_names:
            if col in df.columns and pd.api.types.is_numeric_dtype(df[col]):
                mean_val = float(df[col].mean())
                std_val = float(df[col].std())
                self.baseline_means[col] = mean_val if not np.isnan(mean_val) else 0.0
                self.baseline_stds[col] = std_val if not np.isnan(std_val) and std_val > 1e-6 else 1.0

    def explain_sample(self, sample_dict: dict[str, Any], top_k: int = 5) -> list[dict[str, Any]]:
        """
        Analyzes individual record features to identify top contributors to anomaly status.
        Uses standardized z-score deviation from reference baseline.
        """
        explanations = []

        for feature in self.feature_names:
            if feature not in sample_dict:
                continue

            val = sample_dict[feature]
            try:
                numeric_val = float(val)
            except (ValueError, TypeError):
                continue

            mean = self.baseline_means.get(feature, 0.0)
            std = self.baseline_stds.get(feature, 1.0)
            if std <= 0:
                std = 1.0

            z_score = abs(numeric_val - mean) / std

            # Plain English interpretation
            lower_feat = feature.lower().strip()
            rationale = CYBER_FEATURE_KNOWLEDGE.get(
                lower_feat,
                f"Feature value ({numeric_val:.2f}) deviates significantly by {z_score:.1f} standard deviations from dataset baseline mean ({mean:.2f})."
            )

            explanations.append({
                "feature": feature,
                "value": round(numeric_val, 4),
                "baseline_mean": round(mean, 4),
                "z_score": round(float(z_score), 2),
                "contribution_score": round(min(float(z_score) / 10.0, 1.0), 3),
                "rationale": rationale,
                "method": self.explanation_method,
            })

        # Sort by highest z-score deviation
        explanations.sort(key=lambda x: x["z_score"], reverse=True)
        return explanations[:top_k]
