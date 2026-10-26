# NetSentinel AI — Intelligent Network Anomaly Detection and Cybersecurity Investigation Platform

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite%20%2B%20TypeScript-61DAFB.svg)](https://vitejs.dev)
[![scikit-learn](https://img.shields.io/badge/ML-scikit--learn-F7931E.svg)](https://scikit-learn.org)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC.svg)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**NetSentinel AI** is an intelligent, full-stack cybersecurity platform built to analyze network traffic telemetry, detect malicious and anomalous behaviors, prioritize security events, explain machine learning predictions through transparent mathematical feature attributions, and assist security analysts during incident investigations.

---

## 📑 Table of Contents
1. [Key Features](#-key-features)
2. [Project Architecture](#-project-architecture)
3. [Windows Setup & Quickstart](#-windows-setup--quickstart)
4. [Running the Application](#-running-the-application)
5. [Dataset Ingestion & Preparation](#-dataset-ingestion--preparation)
6. [Machine Learning Workflow](#-machine-learning-workflow)
7. [Running Tests](#-running-tests)
8. [Troubleshooting Common Issues](#-troubleshooting-common-issues)
9. [Academic Research Limitations](#-academic-research-limitations)
10. [Future Roadmap](#-future-roadmap)

---

## 🛡️ Key Features

- **Multi-Paradigm Anomaly Detection**:
  - **Unsupervised Anomaly Detection**: Utilizes **Isolation Forests** to isolate statistical anomalies without needing prior attack labels.
  - **Supervised Classification**: Uses **Random Forest Ensembles** for multi-class threat identification when labeled training data exists.
  - **Hybrid Ensemble Mode**: Combines unsupervised outlier scores with supervised threat classification.
- **Explainable AI (XAI)**:
  - Global feature importance ranking (Gini impurity).
  - Per-event statistical attribution: Computes standardized standard deviation deviations ($z$-scores) against dataset baselines.
  - Plain-English cybersecurity domain interpretations (e.g. why packet bursts, zero flow durations, or specific port numbers trigger alerts).
- **Incident Investigation Workspace**:
  - Automated correlation engine clusters individual alerts into incidents using transparent deterministic rules (e.g. port scan detection, volumetric floods).
  - Chronological timeline of evidence and notes.
- **Interactive Network Topology**:
  - Visualizes communicating IP endpoints and flow densities using **React Flow**.
  - Suspicious nodes and anomalous traffic edges glow red with animated alert signals.
- **Evidence-Grounded AI Copilot**:
  - Summarizes alerts, separates verified facts from model predictions and hypotheses, and suggests investigation steps without auto-executing commands.
  - Supports **Google Gemini API** when `GEMINI_API_KEY` is provided; automatically falls back to an intelligent local rule synthesis engine when no key is set.
- **Reports & Tabular Exports**:
  - Generates downloadable CSV analytical results.
  - Standalone styled HTML / printable PDF incident reports.

---

## 🏛️ Project Architecture

```
NetSentinel-AI/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── api/              # REST Endpoints (health, datasets, models, analysis, alerts, etc.)
│   │   ├── core/             # Configuration & path management
│   │   ├── db/               # SQLite database session and table initializers
│   │   ├── ml/               # Preprocessor, Isolation Forest, Random Forest, XAI, Correlation
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── schemas/          # Pydantic v2 validation schemas
│   │   └── services/         # AI Assistant, Report generator, Monitoring adapter
│   ├── tests/                # Pytest unit and integration test suite
│   └── requirements.txt      # Python dependencies
├── frontend/                 # React + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/       # Reusable UI cards, badges, sidebar
│   │   ├── pages/            # 10 core application pages
│   │   ├── services/         # API fetch client
│   │   └── types/            # TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts
├── data/                     # Uploads, sample datasets, SQLite database
├── artifacts/                # Persisted Joblib trained model binaries
├── reports/                  # Generated CSV and HTML reports
├── scripts/                  # Windows launch scripts (.bat / .ps1) and dataset utilities
├── docs/                     # Architecture and dataset documentation
├── .env.example              # Environment variables template
├── .gitignore
└── README.md
```

---

## 💻 Windows Setup & Quickstart

### Prerequisites
- **Python 3.10+** (Tested on Python 3.14.0 64-bit on Windows)
- **Node.js v18+** (Tested on v22.19.0)
- **PowerShell** or **Command Prompt**

### Step 1: Clone or Navigate to Project
```powershell
cd c:\Users\MY-HP\OneDrive\Desktop\NetSentinel-AI
```

### Step 2: Set Up Python Virtual Environment
Open PowerShell inside `NetSentinel-AI` and run:
```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install --upgrade pip
.\.venv\Scripts\python -m pip install -r backend\requirements.txt
```

### Step 3: Install Frontend Dependencies
```powershell
cd frontend
npm install
cd ..
```

### Step 4 (Optional): Configure Environment Variables
Copy `.env.example` to `.env`:
```powershell
Copy-Item .env.example .env
```
*(Optional: If you wish to use Google Gemini for enhanced AI incident analysis, open `.env` and set `GEMINI_API_KEY=your_key_here`. If omitted, the local rule-grounded synthesis engine runs automatically).*

---

## 🚀 Running the Application

### Option A: Using the One-Click Windows Launcher (Recommended)
Run the batch script:
```powershell
.\scripts\start-windows.bat
```
or via PowerShell:
```powershell
.\scripts\start-windows.ps1
```

### Option B: Running Manually in Separate Terminals

**Terminal 1 — Backend (FastAPI)**:
```powershell
cd c:\Users\MY-HP\OneDrive\Desktop\NetSentinel-AI
.\.venv\Scripts\python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend URL*: `http://127.0.0.1:8000`  
*API Documentation (Swagger UI)*: `http://127.0.0.1:8000/docs`

**Terminal 2 — Frontend (Vite + React)**:
```powershell
cd c:\Users\MY-HP\OneDrive\Desktop\NetSentinel-AI\frontend
npm run dev
```
*Frontend URL*: `http://localhost:5173`

---

## 📊 Dataset Ingestion & Preparation

1. Open `http://localhost:5173` in your browser.
2. Navigate to **Traffic Analysis** in the left sidebar.
3. If you do not have a live CIC-IDS2017 dataset on your computer, click **"Generate Research Sample"**:
   - Creates a 400-row synthetic flow capture simulating realistic benign web browsing, SSH brute-force attempts, and SYN port scans.
4. If you have a custom or CIC-IDS2017 CSV file:
   - Click **"Upload CSV Dataset"** and select your file.
   - NetSentinel AI automatically detects header roles, validates file size (up to 100MB), strips target leakage, cleans infinite/NaN values, and loads an interactive 50-row preview.

Detailed dataset documentation is located in [`docs/DATASET_GUIDE.md`](file:///c:/Users/MY-HP/OneDrive/Desktop/NetSentinel-AI/docs/DATASET_GUIDE.md).

---

## 🤖 Machine Learning Workflow

1. **Preprocessing & Leakage Prevention**:
   - Identifies candidate feature columns while strictly excluding labels, IP addresses, and timestamps from the training feature matrix $X$.
   - Replaces `inf` and `NaN` with feature medians and normalizes numeric scales using `StandardScaler`.
2. **Model Training**:
   - Navigate to **Anomaly & ML Engine**.
   - Select your dataset and target label.
   - Adjust the train/test split slider (default 25%) and tree depth.
   - Click **Train Model & Benchmark** to compute accuracy, macro precision, recall, F1-score, confusion matrix, and feature importances.
   - The trained pipeline is saved to `artifacts/models/<model_id>.joblib`.
3. **Execution & Alert Generation**:
   - In **Traffic Analysis**, click **Run ML Pipeline**.
   - Choose your mode (Auto, Unsupervised Isolation Forest, Supervised, or Hybrid).
   - Flagged outliers are routed into the **Alert Center** with normalized anomaly scores and top contributing factors.
4. **Correlation & Triage**:
   - In **Incident Workspace**, click **Run Auto-Correlation Engine** to group alerts into investigations.

---

## 🧪 Running Tests

To verify the entire backend ML pipeline, database initialization, API endpoints, and data validation, execute:

```powershell
cd c:\Users\MY-HP\OneDrive\Desktop\NetSentinel-AI
.\.venv\Scripts\python -m pytest backend\tests
```

To verify the frontend TypeScript and production bundle compilation:
```powershell
cd c:\Users\MY-HP\OneDrive\Desktop\NetSentinel-AI\frontend
npm run build
```

---

## 🔍 Troubleshooting Common Issues

| Issue | Cause | Resolution |
| :--- | :--- | :--- |
| `uvicorn: command not found` | Virtual environment is not activated | Run via `.\.venv\Scripts\python -m uvicorn ...` |
| `Connecting to API...` stays yellow | Backend server is not running on port 8000 | Verify Terminal 1 is running `uvicorn` on `127.0.0.1:8000` |
| `Topology Unavailable` | Uploaded dataset lacks IP addresses | Topology requires `Source IP` and `Destination IP` columns. Click "Generate Research Sample" or upload a dataset with IP fields. |
| CSV upload fails with 413 | File exceeds upload size limit | Increase `MAX_UPLOAD_SIZE_MB` in `backend/app/core/config.py` |

---

## ⚠️ Academic Research Limitations

- **Research / Demonstration Scope**: NetSentinel AI was developed as an undergraduate academic engineering project inspired by research into network anomaly detection. It is designed for demonstration, educational triage, and proof-of-concept experimentation.
- **Not a Production SIEM/EDR**: It does not replace enterprise perimeter firewalls, commercial SIEMs (e.g. Splunk, Microsoft Sentinel), or certified endpoint detection agents.
- **Statistical Scores vs Proof**: Anomaly scores and risk indicators represent statistical deviation from baseline traffic distributions and should be treated as heuristic triage hints, not legal or definitive proof of a breach.

---

## 🔮 Future Roadmap

- Integration with streaming message brokers (Apache Kafka / RabbitMQ).
- Support for live PCAP packet taps via eBPF on Linux kernels.
- Deep Learning autoencoders (LSTM / Transformers) for sequential flow modeling.
- Exporting incident alerts to standard STIX/TAXII threat intelligence formats.
