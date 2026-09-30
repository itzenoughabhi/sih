from shapely.geometry import shape, mapping, Polygon, MultiPolygon
from shapely.validation import make_valid
from typing import Dict, Any, Tuple
from backend.app.gis.crs import calculate_metric_distance

def validate_and_repair_geometry(geom_dict: Dict[str, Any]) -> Tuple[Dict[str, Any], bool]:
    """
    Validates and repairs a GeoJSON geometry.
    Returns (repaired_geom_dict, was_modified).
    """
    try:
        geom = shape(geom_dict)
        if geom.is_valid and not geom.is_empty:
            return geom_dict, False

        # Attempt repair
        repaired = make_valid(geom)
        
        # If repair produced a GeometryCollection, extract largest Polygon
        if repaired.geom_type == "GeometryCollection":
            polys = [g for g in repaired.geoms if g.geom_type in ("Polygon", "MultiPolygon")]
            if polys:
                repaired = max(polys, key=lambda p: p.area)
            else:
                return geom_dict, False

        return mapping(repaired), True
    except Exception:
        return geom_dict, False

def calculate_iou(geom_a_dict: Dict[str, Any], geom_b_dict: Dict[str, Any]) -> float:
    """Calculate Intersection-over-Union (IoU) between two geometries."""
    try:
        ga = shape(geom_a_dict)
        gb = shape(geom_b_dict)
        
        if not ga.is_valid:
            ga = make_valid(ga)
        if not gb.is_valid:
            gb = make_valid(gb)

        if not ga.intersects(gb):
            return 0.0

        inter_area = ga.intersection(gb).area
        union_area = ga.union(gb).area

        if union_area <= 0:
            return 0.0

        return round(float(inter_area / union_area), 4)
    except Exception:
        return 0.0

def calculate_area_similarity(area_a: float, area_b: float) -> float:
    """Calculate area similarity ratio between 0.0 and 1.0."""
    max_area = max(area_a, area_b)
    if max_area <= 0:
        return 1.0
    diff = abs(area_a - area_b)
    ratio = 1.0 - min(1.0, diff / max_area)
    return round(ratio, 4)

def calculate_centroid_offset(geom_a_dict: Dict[str, Any], geom_b_dict: Dict[str, Any]) -> float:
    """Compute centroid displacement in meters."""
    try:
        ga = shape(geom_a_dict).centroid
        gb = shape(geom_b_dict).centroid
        return calculate_metric_distance(ga, gb)
    except Exception:
        return 0.0
