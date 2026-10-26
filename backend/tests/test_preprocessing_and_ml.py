import numpy as np
import pandas as pd
import pytest
from backend.app.ml.preprocessor import clean_and_impute_dataframe, TrafficPreprocessor, identify_columns
from backend.app.ml.detector import AnomalyDetector
from backend.app.ml.trainer import ModelTrainer
from backend.app.ml.explainability import ExplainabilityEngine

def test_identify_columns():
    df = pd.DataFrame({
        "Source IP": ["192.168.1.5"],
        "Destination IP": ["10.0.0.1"],
        "Source Port": [443],
        "Destination Port": [80],
        "Protocol": ["TCP"],
        "Flow Duration": [1000],
        "Flow Bytes/s": [50000.0],
        "Label": ["BENIGN"]
    })
    roles = identify_columns(df)
    assert roles["label_col"] == "Label"
    assert roles["src_ip_col"] == "Source IP"
    assert roles["dst_ip_col"] == "Destination IP"
    assert roles["protocol_col"] == "Protocol"
    assert "Flow Duration" in roles["candidate_features"]
    assert "Flow Bytes/s" in roles["candidate_features"]

def test_clean_and_impute_infinite_and_nan():
    df = pd.DataFrame({
        "feat1": [1.0, np.inf, 3.0, -np.inf, np.nan],
        "feat2": [10.0, 20.0, 30.0, 40.0, 50.0],
    })
    cleaned, medians = clean_and_impute_dataframe(df, ["feat1", "feat2"])
    assert not np.isinf(cleaned["feat1"]).any()
    assert not cleaned["feat1"].isna().any()
    assert len(cleaned) == 5

def test_anomaly_detector_isolation_forest():
    np.random.seed(42)
    # 100 normal points, 5 extreme outliers
    normal_data = np.random.normal(0, 1, (100, 4))
    outliers = np.random.normal(10, 1, (5, 4))
    X = np.vstack([normal_data, outliers])

    detector = AnomalyDetector(contamination=0.05, random_state=42)
    detector.fit(X)
    is_anomaly, scores, risks = detector.score_samples(X)

    assert len(is_anomaly) == 105
    assert len(scores) == 105
    assert len(risks) == 105
    # Outliers should have higher anomaly scores
    assert np.mean(scores[-5:]) > np.mean(scores[:100])
    assert all(0.0 <= s <= 1.0 for s in scores)

def test_model_trainer_evaluation():
    np.random.seed(42)
    n = 120
    # Synthetic test fixture specifically for unit testing
    df = pd.DataFrame({
        "f1": np.random.uniform(0, 100, n),
        "f2": np.random.uniform(10, 50, n),
        "f3": np.random.uniform(0, 5, n),
        "Label": ["BENIGN" if i < 80 else "PortScan" for i in range(n)]
    })

    trainer = ModelTrainer(algorithm="random_forest", n_estimators=15, max_depth=5, random_state=42)
    results = trainer.train_and_evaluate(df, feature_cols=["f1", "f2", "f3"], target_col="Label", test_size=0.25)

    assert "accuracy" in results
    assert "f1_macro" in results
    assert "precision_macro" in results
    assert "recall_macro" in results
    assert "confusion_matrix" in results
    assert "feature_importances" in results
    assert len(results["feature_importances"]) == 3

def test_explainability_zscore():
    df = pd.DataFrame({
        "pkt_rate": [10.0, 12.0, 11.0, 10.5, 1000.0],
    })
    explainer = ExplainabilityEngine(feature_names=["pkt_rate"])
    explainer.fit_baseline(df, ["pkt_rate"])
    sample = {"pkt_rate": 1000.0}
    exps = explainer.explain_sample(sample)

    assert len(exps) == 1
    assert exps[0]["feature"] == "pkt_rate"
    assert exps[0]["z_score"] > 1.0
