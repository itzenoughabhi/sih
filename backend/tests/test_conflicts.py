import pytest
from backend.app.conflicts.detector import detect_parcel_conflicts

def test_area_conflict_detection():
    cad = {"parcel_id": "CAD-004", "survey_number": "SY-104", "owner_name": "Ramesh Kumar", "area": 850.0}
    cand = {"parcel_id": "MUN-004", "owner_name": "Ramesh Kumar", "area": 742.0}
    metrics = {"attribute_score": 1.0, "geometry_score": 0.85, "centroid_distance_m": 0.5}

    conflicts = detect_parcel_conflicts(cad, cand, metrics, area_threshold_pct=5.0)
    assert len(conflicts) >= 1
    assert any(c["conflict_type"] == "AREA_MISMATCH" for c in conflicts)

def test_missing_attribute_detection():
    cad = {"parcel_id": "CAD-040", "survey_number": None, "owner_name": "Priya Sharma", "area": 800.0}
    cand = {"parcel_id": "MUN-040", "owner_name": "Priya Sharma", "area": 800.0}
    metrics = {"attribute_score": 1.0, "geometry_score": 0.95, "centroid_distance_m": 0.2}

    conflicts = detect_parcel_conflicts(cad, cand, metrics)
    assert any(c["conflict_type"] == "MISSING_ATTRIBUTES" for c in conflicts)
