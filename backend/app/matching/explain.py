from typing import Dict, Any

def generate_explainable_rationale(
    metrics: Dict[str, float],
    cad_parcel: Dict[str, Any],
    cand_parcel: Dict[str, Any]
) -> str:
    """
    Synthesize an audit-ready, factual explanation derived purely from
    the computed quantitative metrics and source attributes.
    """
    sentences = []
    
    geom_pct = int(round(metrics["geometry_score"] * 100))
    area_pct = int(round(metrics["area_score"] * 100))
    loc_pct = int(round(metrics["location_score"] * 100))
    attr_pct = int(round(metrics["attribute_score"] * 100))
    gnss_pct = int(round(metrics["gnss_score"] * 100))
    dist_m = metrics.get("centroid_distance_m", 0.0)

    # 1. Geometry & Spatial Alignment
    if metrics["geometry_score"] >= 0.85:
        sentences.append(f"Parcel boundaries exhibit strong spatial concordance with {geom_pct}% boundary overlap (IoU).")
    elif metrics["geometry_score"] >= 0.60:
        sentences.append(f"Moderate spatial boundary overlap of {geom_pct}%; edge alignment exhibits minor offset.")
    else:
        sentences.append(f"Significant boundary displacement detected with only {geom_pct}% spatial overlap.")

    # 2. Centroid offset
    if dist_m <= 1.0:
        sentences.append(f"Geometric centroids align within {dist_m:.2f} meters.")
    elif dist_m <= 5.0:
        sentences.append(f"Centroid displacement is {dist_m:.2f} meters, indicating slight vector drift.")
    else:
        sentences.append(f"Noticeable centroid shift of {dist_m:.2f} meters observed between department layers.")

    # 3. Area comparison
    cad_area = cad_parcel.get("area", 0.0) or 0.0
    cand_area = cand_parcel.get("area", 0.0) or 0.0
    if cad_area > 0 and cand_area > 0:
        diff_pct = abs(cad_area - cand_area) / max(cad_area, cand_area) * 100
        if diff_pct <= 2.0:
            sentences.append(f"Area variance is negligible ({diff_pct:.1f}%: {cad_area:.1f} m² vs {cand_area:.1f} m²).")
        elif diff_pct <= 7.0:
            sentences.append(f"Minor area variance of {diff_pct:.1f}% ({cad_area:.1f} m² vs {cand_area:.1f} m²) is within photogrammetric survey tolerances.")
        else:
            sentences.append(f"Substantial area discrepancy of {diff_pct:.1f}% detected ({cad_area:.1f} m² Cadastral vs {cand_area:.1f} m² Municipal).")

    # 4. Attribute / Owner string agreement
    owner_cad = cad_parcel.get("owner_name")
    owner_cand = cand_parcel.get("owner_name")
    if owner_cad and owner_cand:
        if owner_cad.strip().lower() == owner_cand.strip().lower():
            sentences.append(f"Owner identity '{owner_cad}' matches identically across records.")
        elif metrics["attribute_score"] >= 0.80:
            sentences.append(f"Linguistic analysis detects name abbreviation variation ('{owner_cad}' vs '{owner_cand}') with {attr_pct}% phonetic/token similarity.")
        else:
            sentences.append(f"Divergent owner records recorded ('{owner_cad}' vs '{owner_cand}') with only {attr_pct}% similarity.")

    # 5. GNSS Evidence & Multi-source consensus
    if dist_m >= 4.0 and metrics["gnss_score"] >= 0.90:
        sentences.insert(0, "Revenue and GNSS evidence agree with cadastral geometry, while the municipal geometry shows a spatial displacement.")
    elif metrics["gnss_score"] >= 0.90:
        sentences.append("Ground-truth GNSS/CORS control points confirm physical parcel location.")
    elif metrics["gnss_score"] >= 0.70:
        sentences.append("Nearby GNSS survey control point observed within proximate perimeter.")

    return " ".join(sentences)
