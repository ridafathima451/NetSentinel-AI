# NetSentinel AI — System Architecture & Methodology

## 1. High-Level Architecture

NetSentinel AI is organized into decoupled layers:

```
┌─────────────────────────────────────────────────────────────┐
│                       React Frontend                        │
│   (Vite + TypeScript + Tailwind CSS + Recharts + React Flow)│
└──────────────────────────────┬──────────────────────────────┘
                               │ REST / JSON (CORS localhost)
┌──────────────────────────────▼──────────────────────────────┐
│                    FastAPI Backend Engine                   │
│   - API Routers: /datasets, /analysis, /models, /alerts,    │
│                  /investigations, /assistant, /topology     │
│   - Security & Validation (Pydantic v2)                     │
│   - Relational Database (SQLAlchemy + SQLite)               │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
┌──────────────▼──────────────┐┌──────────────▼───────────────┐
│     Machine Learning Core   ││     Incident Response Core   │
│ - Traffic Preprocessor      ││ - Transparent Correlation    │
│ - Isolation Forest Detector ││ - Investigation Timeline     │
│ - Random Forest Classifier  ││ - Evidence-Grounded Copilot  │
│ - Explainability (Z-Scores) ││ - Printable Report Engine    │
│ - Joblib Artifact Storage   ││ - Passive Monitoring Adapter │
└─────────────────────────────┘└──────────────────────────────┘
```

---

## 2. Machine Learning Methodology

### A. Unsupervised Anomaly Detection (Isolation Forest)
- **Algorithm**: `sklearn.ensemble.IsolationForest`
- **Purpose**: Identifies outlier network behaviors without assuming labels exist.
- **Normalization**: Scikit-learn's `decision_function` returns raw anomaly scores (lower = more anomalous). NetSentinel AI normalizes these into $[0.0, 1.0]$ where:
  - $\ge 0.85$: **CRITICAL** Risk
  - $0.70 - 0.84$: **HIGH** Risk
  - $0.50 - 0.69$: **MEDIUM** Risk
  - $< 0.50$: **LOW** Risk

### B. Supervised Classification (Random Forest)
- **Algorithm**: `sklearn.ensemble.RandomForestClassifier`
- **Validation**: Train/Test splitting (configurable default 25%) with stratified sampling.
- **Metrics Reported**:
  - Accuracy (Test partition)
  - Macro & Weighted Precision, Recall, F1-Score
  - Multi-class / Binary ROC-AUC
  - Confusion Matrix heatmap
  - Class-wise performance reports

### C. Explainable AI (XAI)
- **Global Feature Importance**: Derived from Gini impurity reduction across tree splits.
- **Per-Event Attribution**: Computes standard deviation score ($z$-score) against reference baseline distributions:
  $$z = \frac{|x_i - \mu_i|}{\sigma_i}$$
- **Domain Rationale**: Matches anomalous features (e.g. forward packet burst, zero flow duration) to documented cybersecurity attack patterns.

---

## 3. Incident Correlation Rules

NetSentinel AI uses deterministic correlation rules:
1. **Port Probing**: Same Source IP touching $\ge 3$ distinct destination ports.
2. **Volumetric Flood**: Same Source IP generating multiple high-risk anomalies.
3. **Targeted Entity**: Same Destination IP receiving anomalies from multiple distinct sources.
