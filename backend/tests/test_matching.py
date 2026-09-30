import pytest
from backend.app.matching.similarity import compute_pairwise_similarity, compute_string_similarity
from backend.app.matching.confidence import calculate_overall_confidence
from backend.app.matching.explain import generate_explainable_rationale
from backend.app.schemas.schemas import HarmonizationWeights

def test_string_similarity():
    assert compute_string_similarity("Ramesh Kumar", "Ramesh Kumar") == 1.0
    # Abbreviation match
    sim = compute_string_similarity("Ramesh Kumar", "Ramesh K.")
    assert sim >= 0.80

def test_confidence_scoring():
    metrics = {
        "geometry_score": 0.95,
        "area_score": 0.92,
        "location_score": 0.98,
        "attribute_score": 0.90,
        "gnss_score": 0.95,
        "centroid_distance_m": 0.35
    }
    weights = HarmonizationWeights(
        geometry=0.30,
        area=0.20,
        location=0.20,
        attributes=0.15,
        gnss=0.15
    )
    score, status = calculate_overall_confidence(metrics, weights)
    assert score >= 0.90
    assert status == "HIGH_CONFIDENCE"

def test_explainable_rationale():
    metrics = {
        "geometry_score": 0.94,
        "area_score": 0.91,
        "location_score": 0.95,
        "attribute_score": 0.88,
        "gnss_score": 0.95,
        "centroid_distance_m": 0.45
    }
    cad = {"parcel_id": "CAD-001", "owner_name": "Ramesh Kumar Sharma", "area": 845.0}
    cand = {"parcel_id": "MUN-001", "owner_name": "Ramesh K. Sharma", "area": 838.0}
    
    rationale = generate_explainable_rationale(metrics, cad, cand)
    assert "concordance" in rationale.lower() or "overlap" in rationale.lower()
    assert "ramesh" in rationale.lower()
    assert "area" in rationale.lower()
