import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from typing import Tuple

class AnomalyDetector:
    """Unsupervised network traffic anomaly detector using Isolation Forest."""
    def __init__(self, contamination: float = 0.05, random_state: int = 42, n_estimators: int = 100):
        self.contamination = contamination
        self.random_state = random_state
        self.n_estimators = n_estimators
        self.model = IsolationForest(
            contamination=contamination,
            random_state=random_state,
            n_estimators=n_estimators,
            n_jobs=-1,
        )
        self.is_fitted = False
        self.min_score: float = -0.5
        self.max_score: float = 0.5

    def fit(self, X: np.ndarray) -> "AnomalyDetector":
        self.model.fit(X)
        self.is_fitted = True
        raw_scores = self.model.decision_function(X)
        # Store empirical score range for min-max scaling
        self.min_score = float(np.percentile(raw_scores, 1))
        self.max_score = float(np.percentile(raw_scores, 99))
        if self.min_score >= self.max_score:
            self.max_score = self.min_score + 1e-4
        return self

    def score_samples(self, X: np.ndarray) -> Tuple[np.ndarray, np.ndarray, list[str]]:
        """
        Computes anomaly predictions and normalized anomaly scores [0.0, 1.0].
        Higher score = more anomalous.
        Returns:
            - is_anomaly_array (1 for anomaly, 0 for normal)
            - normalized_scores (float array 0.0 to 1.0)
            - risk_levels (list of strings: LOW, MEDIUM, HIGH, CRITICAL)
        """
        if not self.is_fitted:
            raise ValueError("AnomalyDetector is not fitted yet.")

        raw_preds = self.model.predict(X) # 1 for inlier, -1 for outlier
        is_anomaly = np.where(raw_preds == -1, 1, 0)

        raw_scores = self.model.decision_function(X) # lower means more anomalous

        # Invert and normalize so that lowest raw score -> highest anomaly score (1.0)
        # Decision function typically ranges roughly from -0.5 to 0.5
        clipped = np.clip(raw_scores, self.min_score, self.max_score)
        normalized_scores = 1.0 - (clipped - self.min_score) / (self.max_score - self.min_score)
        normalized_scores = np.round(np.clip(normalized_scores, 0.0, 1.0), 4)

        # Map to risk levels using transparent documented heuristics
        risk_levels = []
        for score, anomaly in zip(normalized_scores, is_anomaly):
            if anomaly == 1:
                if score >= 0.85:
                    risk_levels.append("CRITICAL")
                elif score >= 0.70:
                    risk_levels.append("HIGH")
                elif score >= 0.50:
                    risk_levels.append("MEDIUM")
                else:
                    risk_levels.append("LOW")
            else:
                if score >= 0.75:
                    risk_levels.append("MEDIUM")
                else:
                    risk_levels.append("LOW")

        return is_anomaly, normalized_scores, risk_levels
