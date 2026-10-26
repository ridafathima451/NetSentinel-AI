import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Any, Tuple
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report,
)
from app.ml.preprocessor import TrafficPreprocessor

class ModelTrainer:
    """Trains, evaluates, and persists supervised classifiers for network traffic analysis."""

    def __init__(
        self,
        algorithm: str = "random_forest",
        n_estimators: int = 100,
        max_depth: int | None = 15,
        random_state: int = 42,
    ):
        self.algorithm = algorithm
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.random_state = random_state

        if algorithm == "random_forest":
            self.model = RandomForestClassifier(
                n_estimators=n_estimators,
                max_depth=max_depth,
                random_state=random_state,
                n_jobs=-1,
                class_weight="balanced_subsample",
            )
        else:
            raise ValueError(f"Unsupported algorithm: {algorithm}")

        self.preprocessor = TrafficPreprocessor()
        self.feature_names: list[str] = []
        self.class_names: list[str] = []

    def train_and_evaluate(
        self,
        df: pd.DataFrame,
        feature_cols: list[str],
        target_col: str,
        test_size: float = 0.25,
    ) -> dict[str, Any]:
        """
        Splits data, fits preprocessor and model, computes rigorous evaluation metrics.
        Guarantees no target leakage by stripping target_col from feature input.
        """
        # Ensure target is not in feature_cols
        safe_feature_cols = [c for c in feature_cols if c != target_col]
        if not safe_feature_cols:
            raise ValueError("No valid feature columns provided for training.")

        y_raw = df[target_col].astype(str).str.strip()
        unique_classes = np.unique(y_raw)
        self.class_names = [str(c) for c in unique_classes]

        if len(unique_classes) < 2:
            raise ValueError("Training requires at least two distinct classes in the target column.")

        # Train/Test Split with stratification if class distribution permits
        try:
            train_df, test_df, y_train, y_test = train_test_split(
                df[safe_feature_cols],
                y_raw,
                test_size=test_size,
                random_state=self.random_state,
                stratify=y_raw,
            )
        except ValueError:
            # Fallback to non-stratified split if some classes have only 1 sample
            train_df, test_df, y_train, y_test = train_test_split(
                df[safe_feature_cols],
                y_raw,
                test_size=test_size,
                random_state=self.random_state,
            )

        # Preprocess features
        X_train, self.feature_names = self.preprocessor.fit_transform(train_df, safe_feature_cols)
        X_test = self.preprocessor.transform(test_df)

        # Train model
        self.model.fit(X_train, y_train)

        # Evaluate on unseen test set
        y_pred = self.model.predict(X_test)
        
        acc = float(accuracy_score(y_test, y_pred))
        prec_macro = float(precision_score(y_test, y_pred, average="macro", zero_division=0))
        rec_macro = float(recall_score(y_test, y_pred, average="macro", zero_division=0))
        f1_macro = float(f1_score(y_test, y_pred, average="macro", zero_division=0))

        # ROC-AUC calculation when mathematically valid
        roc_auc_val: float | None = None
        try:
            if hasattr(self.model, "predict_proba"):
                y_proba = self.model.predict_proba(X_test)
                if len(unique_classes) == 2:
                    roc_auc_val = float(roc_auc_score(y_test, y_proba[:, 1]))
                elif len(unique_classes) > 2 and y_proba.shape[1] == len(unique_classes):
                    roc_auc_val = float(roc_auc_score(y_test, y_proba, multi_class="ovr", average="macro"))
        except Exception:
            roc_auc_val = None

        cm = confusion_matrix(y_test, y_pred, labels=self.class_names).tolist()
        report = classification_report(y_test, y_pred, labels=self.class_names, output_dict=True, zero_division=0)

        # Global feature importance
        importances = []
        if hasattr(self.model, "feature_importances_"):
            raw_imp = self.model.feature_importances_
            sorted_indices = np.argsort(raw_imp)[::-1]
            for idx in sorted_indices:
                importances.append({
                    "feature": self.feature_names[idx],
                    "importance": round(float(raw_imp[idx]), 4),
                })

        return {
            "training_rows": len(train_df),
            "test_rows": len(test_df),
            "accuracy": round(acc, 4),
            "precision_macro": round(prec_macro, 4),
            "recall_macro": round(rec_macro, 4),
            "f1_macro": round(f1_macro, 4),
            "roc_auc": round(roc_auc_val, 4) if roc_auc_val is not None else None,
            "confusion_matrix": cm,
            "class_report": report,
            "feature_importances": importances,
            "classes": self.class_names,
            "features_used": self.feature_names,
        }

    def save_artifact(self, filepath: Path, metadata: dict[str, Any]) -> str:
        """Persists trained model pipeline and metadata to disk via joblib."""
        filepath.parent.mkdir(parents=True, exist_ok=True)
        bundle = {
            "model": self.model,
            "preprocessor": self.preprocessor,
            "feature_names": self.feature_names,
            "class_names": self.class_names,
            "metadata": metadata,
        }
        joblib.dump(bundle, filepath)
        return str(filepath)

    @classmethod
    def load_artifact(cls, filepath: Path) -> dict[str, Any]:
        """Loads model bundle from disk."""
        return joblib.load(filepath)

