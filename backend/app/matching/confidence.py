from typing import Dict, Any, Tuple
from backend.app.schemas.schemas import HarmonizationWeights

DEFAULT_WEIGHTS = {
    "geometry": 0.30,
    "area": 0.20,
    "location": 0.20,
    "attributes": 0.15,
    "gnss": 0.15
}

def calculate_overall_confidence(
    metrics: Dict[str, float],
    weights: HarmonizationWeights = None
) -> Tuple[float, str]:
    """
    Compute overall confidence (0.0 to 1.0) and status classification
    (HIGH_CONFIDENCE, NEEDS_REVIEW, CONFLICT) using weighted evidence components.
    """
    w_geom = weights.geometry if weights else DEFAULT_WEIGHTS["geometry"]
    w_area = weights.area if weights else DEFAULT_WEIGHTS["area"]
    w_loc = weights.location if weights else DEFAULT_WEIGHTS["location"]
    w_attr = weights.attributes if weights else DEFAULT_WEIGHTS["attributes"]
    w_gnss = weights.gnss if weights else DEFAULT_WEIGHTS["gnss"]

    total_weight = w_geom + w_area + w_loc + w_attr + w_gnss
    if total_weight <= 0:
        total_weight = 1.0

    # Weighted sum
    score = (
        metrics["geometry_score"] * w_geom +
        metrics["area_score"] * w_area +
        metrics["location_score"] * w_loc +
        metrics["attribute_score"] * w_attr +
        metrics["gnss_score"] * w_gnss
    ) / total_weight

    score = round(max(0.0, min(1.0, score)), 4)

    # Classification
    if score >= 0.90:
        status = "HIGH_CONFIDENCE"
    elif score >= 0.70:
        status = "NEEDS_REVIEW"
    else:
        status = "CONFLICT"

    return score, status
