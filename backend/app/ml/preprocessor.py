import re
import numpy as np
import pandas as pd
from typing import Any, Tuple
from sklearn.preprocessing import StandardScaler, LabelEncoder

# Common patterns for label / target columns
LABEL_CANDIDATE_PATTERNS = [
    r"^label$", r"^class$", r"^attack$", r"^target$", r"^attack_cat$",
    r"^attack_type$", r"^traffic_type$", r"^category$", r"^label\.1$"
]

# Common patterns for network identifiers (flexible for spaces, underscores, hyphens)
SRC_IP_PATTERNS = [r"^src[_\s\-]?ip", r"^source[_\s\-]?ip", r"^srcip", r"^ip[_\s\-]?src", r"^source[_\s\-]?address"]
DST_IP_PATTERNS = [r"^dst[_\s\-]?ip", r"^dest(ination)?[_\s\-]?ip", r"^dstip", r"^ip[_\s\-]?dst", r"^destination[_\s\-]?address"]
SRC_PORT_PATTERNS = [r"^src[_\s\-]?port", r"^source[_\s\-]?port", r"^sport"]
DST_PORT_PATTERNS = [r"^dst[_\s\-]?port", r"^dest(ination)?[_\s\-]?port", r"^dport"]
PROTOCOL_PATTERNS = [r"^proto(col)?$"]
TIMESTAMP_PATTERNS = [r"^time(stamp)?$", r"^date$", r"^flow[_\s\-]?start[_\s\-]?time", r"^start[_\s\-]?time"]

BENIGN_LABELS = {"benign", "normal", "0", 0, "legitimate", "good", "clear"}

def clean_column_names(df: pd.DataFrame) -> pd.DataFrame:
    """Strip whitespace, special characters, and lowercase column names for matching."""
    cleaned = df.copy()
    cleaned.columns = [c.strip() for c in cleaned.columns]
    return cleaned

def identify_columns(df: pd.DataFrame) -> dict[str, Any]:
    """Identifies the roles of various columns in a network traffic DataFrame."""
    cols = df.columns
    roles = {
        "label_col": None,
        "src_ip_col": None,
        "dst_ip_col": None,
        "src_port_col": None,
        "dst_port_col": None,
        "protocol_col": None,
        "timestamp_col": None,
        "candidate_features": [],
    }

    lower_to_orig = {c.lower(): c for c in cols}

    for c_lower, c_orig in lower_to_orig.items():
        if not roles["label_col"] and any(re.match(p, c_lower) for p in LABEL_CANDIDATE_PATTERNS):
            roles["label_col"] = c_orig
        elif not roles["src_ip_col"] and any(re.match(p, c_lower) for p in SRC_IP_PATTERNS):
            roles["src_ip_col"] = c_orig
        elif not roles["dst_ip_col"] and any(re.match(p, c_lower) for p in DST_IP_PATTERNS):
            roles["dst_ip_col"] = c_orig
        elif not roles["src_port_col"] and any(re.match(p, c_lower) for p in SRC_PORT_PATTERNS):
            roles["src_port_col"] = c_orig
        elif not roles["dst_port_col"] and any(re.match(p, c_lower) for p in DST_PORT_PATTERNS):
            roles["dst_port_col"] = c_orig
        elif not roles["protocol_col"] and any(re.match(p, c_lower) for p in PROTOCOL_PATTERNS):
            roles["protocol_col"] = c_orig
        elif not roles["timestamp_col"] and any(re.match(p, c_lower) for p in TIMESTAMP_PATTERNS):
            roles["timestamp_col"] = c_orig

    # Candidate feature columns are non-identifier, non-label columns
    identified_id_cols = {
        roles["label_col"], roles["src_ip_col"], roles["dst_ip_col"],
        roles["timestamp_col"]
    } - {None}

    roles["candidate_features"] = [c for c in cols if c not in identified_id_cols]
    return roles

def clean_and_impute_dataframe(df: pd.DataFrame, feature_cols: list[str]) -> Tuple[pd.DataFrame, dict[str, float]]:
    """
    Cleans infinite and NaN values, converting numeric columns safely.
    Returns the processed DataFrame and a dictionary of column medians for inference imputation.
    """
    cleaned_df = df[feature_cols].copy()
    medians = {}

    for col in feature_cols:
        # If column is numeric or can be coerced to numeric
        if pd.api.types.is_numeric_dtype(cleaned_df[col]):
            # Replace inf, -inf with NaN
            cleaned_df[col] = cleaned_df[col].replace([np.inf, -np.inf], np.nan)
            col_median = float(cleaned_df[col].median(skipna=True))
            if np.isnan(col_median):
                col_median = 0.0
            cleaned_df[col] = cleaned_df[col].fillna(col_median)
            medians[col] = col_median
        else:
            # Categorical column - try numeric conversion, else label encode
            converted = pd.to_numeric(cleaned_df[col], errors="coerce")
            if converted.notna().sum() > len(cleaned_df) * 0.7:
                converted = converted.replace([np.inf, -np.inf], np.nan)
                col_median = float(converted.median(skipna=True))
                if np.isnan(col_median):
                    col_median = 0.0
                cleaned_df[col] = converted.fillna(col_median)
                medians[col] = col_median
            else:
                # String / Categorical: label encode
                le = LabelEncoder()
                cleaned_df[col] = le.fit_transform(cleaned_df[col].astype(str).fillna("unknown"))
                medians[col] = 0.0

    return cleaned_df, medians

class TrafficPreprocessor:
    """Reusable preprocessor for network traffic datasets."""
    def __init__(self, feature_cols: list[str] | None = None):
        self.feature_cols = feature_cols
        self.medians: dict[str, float] = {}
        self.scaler = StandardScaler()
        self.is_fitted = False

    def fit_transform(self, df: pd.DataFrame, feature_cols: list[str]) -> Tuple[np.ndarray, list[str]]:
        self.feature_cols = feature_cols
        cleaned_df, self.medians = clean_and_impute_dataframe(df, self.feature_cols)
        X = self.scaler.fit_transform(cleaned_df)
        self.is_fitted = True
        return X, self.feature_cols

    def transform(self, df: pd.DataFrame) -> np.ndarray:
        if not self.is_fitted or not self.feature_cols:
            raise ValueError("Preprocessor is not fitted yet.")
        cleaned_df = df.copy()
        for col in self.feature_cols:
            if col not in cleaned_df.columns:
                cleaned_df[col] = self.medians.get(col, 0.0)
            else:
                if pd.api.types.is_numeric_dtype(cleaned_df[col]):
                    cleaned_df[col] = cleaned_df[col].replace([np.inf, -np.inf], np.nan).fillna(self.medians.get(col, 0.0))
                else:
                    converted = pd.to_numeric(cleaned_df[col], errors="coerce")
                    cleaned_df[col] = converted.replace([np.inf, -np.inf], np.nan).fillna(self.medians.get(col, 0.0))
        return self.scaler.transform(cleaned_df[self.feature_cols])
