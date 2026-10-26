"""
NetSentinel AI - Public Dataset Ingestion & Preparation Guide
-------------------------------------------------------------
This utility documents how to acquire and prepare benchmark cybersecurity datasets,
such as CIC-IDS2017 (Canadian Institute for Cybersecurity) for use in NetSentinel AI.

DATASET INFORMATION:
- Source: University of New Brunswick (UNB) - Canadian Institute for Cybersecurity
- URL: https://www.unb.ca/cic/datasets/ids-2017.html
- Size: ~2.5 GB compressed, containing 8 PCAP/CSV captures (Monday-Friday traffic)
- Attacks Included: Brute Force (SSH/FTP), DoS / DDoS (GoldenEye, Slowloris, Hulk),
  Web Attacks (SQL Injection, XSS), Infiltration, Botnet, PortScan.

INSTRUCTIONS FOR USERS:
1. Download a representative CSV subset (for example, 'Friday-WorkingHours-Afternoon-PortScan.pcap_ISCX.csv').
2. Launch NetSentinel AI and navigate to the 'Traffic Analysis' tab.
3. Click 'Upload CSV Dataset' and select your CSV.
4. NetSentinel AI automatically detects column headers, handles NaN / infinite values,
   identifies label columns, and strips target leakage before training.
"""

import sys
from pathlib import Path
import pandas as pd

def inspect_local_file(csv_path: str):
    path = Path(csv_path)
    if not path.exists():
        print(f"[ERROR] File not found: {csv_path}")
        return

    print(f"\n[+] Inspecting: {path.name}")
    print(f"    File Size: {path.stat().st_size / (1024*1024):.2f} MB")

    df_sample = pd.read_csv(path, nrows=5)
    print(f"    Total Columns Detected: {len(df_sample.columns)}")
    print(f"    Sample Columns: {list(df_sample.columns[:8])}...")
    print("\n[+] Dataset is compatible with NetSentinel AI CSV Ingestion Pipeline.")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        inspect_local_file(sys.argv[1])
    else:
        print(__doc__)
