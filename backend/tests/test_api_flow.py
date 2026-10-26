def test_end_to_end_analysis_and_triage(client):
    # 1. Generate sample synthetic dataset
    resp_sample = client.post("/api/datasets/generate-sample")
    assert resp_sample.status_code == 200
    dataset = resp_sample.json()
    dataset_id = dataset["id"]
    assert dataset["row_count"] > 0

    # 2. Preview dataset
    resp_prev = client.get(f"/api/datasets/{dataset_id}/preview")
    assert resp_prev.status_code == 200
    preview = resp_prev.json()
    assert len(preview["preview_rows"]) > 0

    # 3. Train a supervised model on the sample dataset
    resp_train = client.post("/api/models/train", json={
        "dataset_id": dataset_id,
        "algorithm": "random_forest",
        "target_column": "Label",
        "n_estimators": 20,
        "max_depth": 5,
        "test_size": 0.25,
    })
    assert resp_train.status_code == 200
    model = resp_train.json()
    assert model["accuracy"] is not None
    assert "confusion_matrix" in model
    model_id = model["id"]

    # 4. Run Analysis Pipeline
    resp_analysis = client.post("/api/analysis/run", json={
        "dataset_id": dataset_id,
        "model_id": model_id,
        "mode": "hybrid",
        "contamination": 0.08,
    })
    assert resp_analysis.status_code == 200
    job = resp_analysis.json()
    assert job["total_records"] > 0
    assert job["status"] == "COMPLETED"
    analysis_id = job["id"]

    # 5. Check Dashboard Stats
    resp_dash = client.get("/api/analysis/dashboard")
    assert resp_dash.status_code == 200
    stats = resp_dash.json()
    assert stats["total_records_analyzed"] > 0

    # 6. List and Triage Alerts
    resp_alerts = client.get(f"/api/alerts?dataset_id={dataset_id}")
    assert resp_alerts.status_code == 200
    alerts_data = resp_alerts.json()
    assert alerts_data["total"] > 0
    first_alert = alerts_data["alerts"][0]
    alert_id = first_alert["id"]

    # Update alert status
    resp_patch = client.patch(f"/api/alerts/{alert_id}", json={
        "status": "INVESTIGATING",
        "analyst_notes": "Triage verified: anomaly in flow packet length."
    })
    assert resp_patch.status_code == 200
    assert resp_patch.json()["status"] == "INVESTIGATING"

    # 7. Create Investigation and Append Note
    resp_inv = client.post("/api/investigations", json={
        "title": "Incident Test Investigation",
        "summary": "Suspected port reconnaissance",
        "priority": "HIGH",
        "alert_ids": [alert_id],
    })
    assert resp_inv.status_code == 200
    inv_id = resp_inv.json()["id"]

    resp_note = client.post(f"/api/investigations/{inv_id}/notes", json={
        "content": "Analyst verified host 192.168.1.199 is outside allowed subnet.",
        "author": "SecOps Tester"
    })
    assert resp_note.status_code == 200

    # 8. AI Assistant grounded triage query
    resp_ai = client.post("/api/assistant/query", json={
        "alert_id": alert_id,
        "query": "Assess observed flow anomalies and suggest next triage steps."
    })
    assert resp_ai.status_code == 200
    ai_data = resp_ai.json()
    assert len(ai_data["observed_facts"]) > 0
    assert len(ai_data["suggested_steps"]) > 0

    # 9. Verify Topology
    resp_topo = client.get(f"/api/topology/{dataset_id}")
    assert resp_topo.status_code == 200
    topo = resp_topo.json()
    assert topo["available"] is True
    assert len(topo["nodes"]) > 0

    # 10. Verify Report generation
    resp_rep = client.get(f"/api/reports/analysis/{analysis_id}/html")
    assert resp_rep.status_code == 200
    assert "NetSentinel AI" in resp_rep.text
