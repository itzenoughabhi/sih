from typing import List, Dict, Any, Tuple
from shapely.geometry import shape, mapping
from shapely.ops import unary_union
from backend.app.gis.geometry import calculate_iou
from backend.app.gis.crs import calculate_metric_area

def detect_overlapping_parcels(parcels: List[Dict[str, Any]], threshold_m2: float = 5.0) -> List[Dict[str, Any]]:
    """
    Detect spatial overlaps between parcels in the same dataset using spatial indexing.
    Returns list of conflict descriptor dicts.
    """
    overlaps = []
    if not parcels:
        return overlaps

    geoms = [shape(p["geometry"]) for p in parcels]
    from shapely.strtree import STRtree
    tree = STRtree(geoms)

    seen_pairs = set()

    for i, g1 in enumerate(geoms):
        p1 = parcels[i]
        # Query candidates that intersect the bounding box
        candidate_indices = tree.query(g1, predicate="overlaps")
        for j in candidate_indices:
            if i >= j:
                continue
            pair_key = (min(i, j), max(i, j))
            if pair_key in seen_pairs:
                continue
            seen_pairs.add(pair_key)

            p2 = parcels[j]
            g2 = geoms[j]
            inter = g1.intersection(g2)
            if not inter.is_empty and inter.geom_type in ("Polygon", "MultiPolygon"):
                inter_area_m2 = calculate_metric_area(inter)
                if inter_area_m2 >= threshold_m2:
                    overlaps.append({
                        "type": "TOPOLOGY_VIOLATION",
                        "severity": "HIGH",
                        "parcel_a": p1.get("parcel_id", f"P-{i}"),
                        "parcel_b": p2.get("parcel_id", f"P-{j}"),
                        "overlap_area_m2": inter_area_m2,
                        "description": f"Parcels {p1.get('parcel_id')} and {p2.get('parcel_id')} overlap by {inter_area_m2:.1f} m².",
                        "suggested_correction": "Edge-match boundaries along median split or retain senior revenue survey line."
                    })
    return overlaps

def detect_duplicate_geometries(parcels: List[Dict[str, Any]], iou_threshold: float = 0.98) -> List[Dict[str, Any]]:
    """Detect near-identical duplicate geometries within a dataset."""
    duplicates = []
    if not parcels:
        return duplicates

    geoms = [shape(p["geometry"]) for p in parcels]
    from shapely.strtree import STRtree
    tree = STRtree(geoms)

    seen_pairs = set()

    for i, g1 in enumerate(geoms):
        # Candidates whose envelope overlaps g1
        candidates = tree.query(g1, predicate="intersects")
        for j in candidates:
            if i >= j:
                continue
            pair_key = (min(i, j), max(i, j))
            if pair_key in seen_pairs:
                continue
            seen_pairs.add(pair_key)

            iou = calculate_iou(parcels[i]["geometry"], parcels[j]["geometry"])
            if iou >= iou_threshold:
                duplicates.append({
                    "type": "TOPOLOGY_VIOLATION",
                    "severity": "CRITICAL",
                    "parcel_a": parcels[i].get("parcel_id"),
                    "parcel_b": parcels[j].get("parcel_id"),
                    "iou": iou,
                    "description": f"Duplicate geometry detected between {parcels[i].get('parcel_id')} and {parcels[j].get('parcel_id')} (IoU {iou:.2%}).",
                    "suggested_correction": "Deduplicate and merge property tax assessment IDs."
                })
    return duplicates

def check_building_encroachment(
    building_geom_dict: Dict[str, Any],
    parcel_geom_dict: Dict[str, Any],
    buffer_tolerance_m: float = 0.5
) -> Tuple[bool, float, str]:
    """
    Check if a building footprint spills outside the legal parcel boundary.
    Returns (is_encroaching, spill_percentage, suggestion).
    """
    b_geom = shape(building_geom_dict)
    p_geom = shape(parcel_geom_dict)

    if not b_geom.intersects(p_geom):
        return True, 100.0, "Building footprint lies entirely outside the parcel boundary."

    intersection = b_geom.intersection(p_geom)
    b_area = b_geom.area
    if b_area <= 0:
        return False, 0.0, "Valid footprint"

    contained_ratio = intersection.area / b_area
    spill_pct = (1.0 - contained_ratio) * 100.0

    if spill_pct > 5.0:
        return True, round(spill_pct, 1), f"Building footprint extends outside legal parcel boundary by {spill_pct:.1f}%."

    return False, 0.0, "Footprint contained within parcel"
