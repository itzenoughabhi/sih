import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "pyproj_version" in data

def test_demo_and_harmonization_flow():
    # 1. Generate demo dataset
    demo_res = client.post("/api/demo/generate", json={"seed": 42, "parcel_count": 50})
    assert demo_res.status_code == 201
    datasets = demo_res.json()["datasets"]
    assert len(datasets) == 7

    # 2. Check datasets list
    ds_res = client.get("/api/datasets")
    assert ds_res.status_code == 200
    assert len(ds_res.json()) >= 7

    # 3. Run harmonization
    harm_res = client.post("/api/harmonization/run")
    assert harm_res.status_code == 200
    harm_data = harm_res.json()
    assert harm_data["status"] == "COMPLETED"
    assert harm_data["total_processed"] > 0
    assert harm_data["high_confidence_matches"] > 0

    # 4. Check dashboard stats
    dash_res = client.get("/api/dashboard/stats")
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data["datasets_count"] >= 5
    assert dash_data["parcels_count"] > 0

    # 5. Check parcels list and detail
    parcels_res = client.get("/api/parcels")
    assert parcels_res.status_code == 200
    p_items = parcels_res.json()["items"]
    assert len(p_items) > 0
    
    first_p_id = p_items[0]["id"]
    detail_res = client.get(f"/api/parcels/{first_p_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert "confidence" in detail
    assert "sources" in detail

    # 6. Check conflicts list
    conf_res = client.get("/api/conflicts")
    assert conf_res.status_code == 200
    conflicts = conf_res.json()
    if conflicts:
        first_conf = conflicts[0]
        # Resolve conflict
        resolve_res = client.post(f"/api/conflicts/{first_conf['id']}/resolve", json={
            "decision": "APPROVE_RECOMMENDATION",
            "resolution_notes": "Ground verification confirmed boundary alignment.",
            "reviewer": "officer_test"
        })
        assert resolve_res.status_code == 200
        assert resolve_res.json()["status"] == "RESOLVED"

    # 7. Check Map feed
    map_res = client.get("/api/map/parcels")
    assert map_res.status_code == 200
    assert map_res.json()["type"] == "FeatureCollection"
