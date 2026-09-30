from typing import List, Dict, Any, Optional

def detect_parcel_conflicts(
    cad_parcel: Dict[str, Any],
    cand_parcel: Optional[Dict[str, Any]],
    metrics: Optional[Dict[str, float]],
    area_threshold_pct: float = 5.0,
    owner_similarity_threshold: float = 0.80
) -> List[Dict[str, Any]]:
    """
    Detect explicit conflicts across area, geometry, owner identity, and completeness.
    """
    conflicts = []
    cad_id = cad_parcel.get("parcel_id", "Unknown")

    # 1. Missing Critical Attributes
    if not cad_parcel.get("survey_number"):
        conflicts.append({
            "conflict_type": "MISSING_ATTRIBUTES",
            "severity": "MEDIUM",
            "description": f"Parcel {cad_id} is missing an authoritative Survey / Khasra number.",
            "source_a": "Cadastral Layer",
            "source_b": "Revenue Register",
            "difference": "Survey Number is NULL",
            "suggested_action": "Cross-reference with Tahsil settlement register."
        })

    if not cad_parcel.get("owner_name"):
        conflicts.append({
            "conflict_type": "MISSING_ATTRIBUTES",
            "severity": "HIGH",
            "description": f"Parcel {cad_id} has unrecorded ownership information.",
            "source_a": "Cadastral Layer",
            "source_b": "Municipal Property Tax",
            "difference": "Owner Name is NULL",
            "suggested_action": "Request mutation deed verification."
        })

    if not cand_parcel:
        conflicts.append({
            "conflict_type": "GEOMETRY_SHIFT",
            "severity": "HIGH",
            "description": f"No corresponding municipal or drone parcel found within spatial buffer of {cad_id}.",
            "source_a": "Cadastral Survey",
            "source_b": "Municipal GIS",
            "difference": "Spatial candidate missing",
            "suggested_action": "Flag for ground-truthing survey."
        })
        return conflicts

    cand_id = cand_parcel.get("parcel_id", "Unknown")

    # 2. Area Discrepancy Conflict
    area_cad = cad_parcel.get("area", 0.0) or 0.0
    area_cand = cand_parcel.get("area", 0.0) or 0.0
    if area_cad > 0 and area_cand > 0:
        max_area = max(area_cad, area_cand)
        diff_area = abs(area_cad - area_cand)
        diff_pct = (diff_area / max_area) * 100.0

        if diff_pct > area_threshold_pct:
            severity = "CRITICAL" if diff_pct > 15.0 else ("HIGH" if diff_pct > 10.0 else "MEDIUM")
            conflicts.append({
                "conflict_type": "AREA_MISMATCH",
                "severity": severity,
                "description": f"Area variance of {diff_pct:.1f}% exceeds the {area_threshold_pct:.1f}% threshold between Cadastral and Municipal records.",
                "source_a": f"Cadastral Survey ({area_cad:.1f} m²)",
                "source_b": f"Municipal Tax ({area_cand:.1f} m²)",
                "difference": f"Δ {diff_area:.1f} m² ({diff_pct:.1f}%)",
                "suggested_action": "Verify against high-resolution drone orthophoto footprint."
            })

    # 3. Ownership Conflict (Distinguish benign abbreviations from true disputes)
    owner_cad = cad_parcel.get("owner_name")
    owner_cand = cand_parcel.get("owner_name")
    if owner_cad and owner_cand and metrics:
        sim = metrics.get("owner_similarity", metrics.get("attribute_score", 1.0))
        if sim < owner_similarity_threshold:
            conflicts.append({
                "conflict_type": "OWNER_MISMATCH",
                "severity": "HIGH",
                "description": f"Disparate ownership claims recorded for parcel {cad_id}.",
                "source_a": f"Revenue: '{owner_cad}'",
                "source_b": f"Municipal: '{owner_cand}'",
                "difference": f"Linguistic similarity {int(sim * 100)}%",
                "suggested_action": "Inspect latest Registered Sale Deed and Khatoni mutation entry."
            })

    # 4. Geometry Shift Conflict
    if metrics:
        iou = metrics.get("geometry_score", 1.0)
        dist_m = metrics.get("centroid_distance_m", 0.0)
        if dist_m > 3.0 or iou < 0.65:
            severity = "CRITICAL" if dist_m > 8.0 else "HIGH"
            conflicts.append({
                "conflict_type": "GEOMETRY_SHIFT",
                "severity": severity,
                "description": f"Cadastral and municipal parcel boundaries are physically shifted by {dist_m:.1f} meters (IoU {int(iou * 100)}%).",
                "source_a": f"Cadastral {cad_id}",
                "source_b": f"Municipal {cand_id}",
                "difference": f"Shift: {dist_m:.1f}m, IoU: {int(iou * 100)}%",
                "suggested_action": "Realign vector layer using RTK/CORS ground control markers."
            })

    return conflicts
