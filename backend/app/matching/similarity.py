import math
from typing import Dict, Any, List, Optional
from shapely.geometry import shape, Point
from rapidfuzz import fuzz
from backend.app.gis.geometry import calculate_iou, calculate_area_similarity, calculate_centroid_offset
from backend.app.gis.crs import calculate_metric_distance

def compute_string_similarity(str_a: Optional[str], str_b: Optional[str]) -> float:
    """Computes normalized fuzzy similarity (0.0 to 1.0) using token sort and token set ratios."""
    if not str_a or not str_b:
        return 0.5  # Neutral default if one attribute is missing
    
    clean_a = str_a.strip().lower().replace(".", " ")
    clean_b = str_b.strip().lower().replace(".", " ")
    if clean_a.replace(" ", "") == clean_b.replace(" ", ""):
        return 1.0
        
    # Check if identifiers have matching numeric digits (e.g. CAD-001 vs MUN-001 or VVR-23-00142 vs VVMC-23-0142)
    digits_a = "".join(filter(str.isdigit, clean_a)).lstrip("0")
    digits_b = "".join(filter(str.isdigit, clean_b)).lstrip("0")
    if digits_a and digits_b and (digits_a == digits_b or digits_a.endswith(digits_b) or digits_b.endswith(digits_a)):
        return 0.98

    tokens_a = clean_a.split()
    tokens_b = clean_b.split()
    if len(tokens_a) >= 2 and len(tokens_b) >= 2:
        # Check matching surname with initial abbreviation (e.g. Rajesh Prakash Patil vs R. P. Patil or Rajesh P. Patil)
        if tokens_a[-1] == tokens_b[-1]:
            match_initials = True
            for i in range(min(len(tokens_a)-1, len(tokens_b)-1)):
                if not (tokens_a[i] == tokens_b[i] or tokens_a[i].startswith(tokens_b[i]) or tokens_b[i].startswith(tokens_a[i])):
                    match_initials = False
                    break
            if match_initials:
                return 0.94
        elif tokens_a[0] == tokens_b[0] and (tokens_a[1].startswith(tokens_b[1]) or tokens_b[1].startswith(tokens_a[1])):
            return 0.95

    s_sort = fuzz.token_sort_ratio(clean_a, clean_b)
    s_set = fuzz.token_set_ratio(clean_a, clean_b)
    best_score = max(s_sort, s_set)
    return round(best_score / 100.0, 4)

def compute_gnss_proximity_score(parcel_geom_dict: Dict[str, Any], gnss_points: Optional[List[Dict[str, Any]]]) -> float:
    """
    Computes GNSS proximity score (0.0 to 1.0).
    If a GNSS point is inside or within 2 meters, score is high (~0.95 - 1.0).
    """
    if not gnss_points:
        return 0.85  # Neutral default when GNSS layer is absent
        
    p_geom = shape(parcel_geom_dict)
    minx, miny, maxx, maxy = p_geom.bounds
    # Buffer bbox by ~0.0003 deg (~30m)
    buf = 0.0003
    b_minx, b_miny, b_maxx, b_maxy = minx - buf, miny - buf, maxx + buf, maxy + buf

    min_dist_m = float("inf")
    found_inside = False

    for pt_item in gnss_points:
        coords = pt_item["geometry"].get("coordinates", [])
        if len(coords) >= 2:
            px, py = coords[0], coords[1]
            if not (b_minx <= px <= b_maxx and b_miny <= py <= b_maxy):
                continue

        pt_geom = shape(pt_item["geometry"])
        if p_geom.contains(pt_geom):
            found_inside = True
            min_dist_m = 0.0
            break
        dist = calculate_metric_distance(p_geom, pt_geom)
        if dist < min_dist_m:
            min_dist_m = dist

    if found_inside:
        return 0.98
    
    if min_dist_m <= 2.0:
        return 0.92
    elif min_dist_m <= 5.0:
        return 0.80
    elif min_dist_m <= 15.0:
        return 0.60
    else:
        return max(0.20, round(math.exp(-min_dist_m / 20.0), 2))

def compute_pairwise_similarity(
    cad_parcel: Dict[str, Any],
    candidate_parcel: Dict[str, Any],
    gnss_points: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, float]:
    """
    Compute full multi-factor similarity vector between a primary cadastral parcel
    and a candidate parcel (e.g., municipal).
    """
    g_cad = cad_parcel["geometry"]
    g_cand = candidate_parcel["geometry"]

    # 1. Geometry IoU
    iou = calculate_iou(g_cad, g_cand)

    # 2. Area Similarity
    area_cad = cad_parcel.get("area", 0.0) or 0.0
    area_cand = candidate_parcel.get("area", 0.0) or 0.0
    area_score = calculate_area_similarity(area_cad, area_cand)

    # 3. Location Proximity (Centroid distance)
    dist_m = calculate_centroid_offset(g_cad, g_cand)
    # 0 meters -> 1.0; 5 meters -> ~0.70; 15 meters -> ~0.35
    loc_score = round(math.exp(-dist_m / 12.0), 4)

    # 4. Attribute Similarity (Owner & Survey/Parcel ID)
    owner_cad = cad_parcel.get("owner_name")
    owner_cand = candidate_parcel.get("owner_name")
    owner_sim = compute_string_similarity(owner_cad, owner_cand)

    id_cad = cad_parcel.get("parcel_id") or cad_parcel.get("survey_number")
    id_cand = candidate_parcel.get("parcel_id") or candidate_parcel.get("survey_number")
    id_sim = compute_string_similarity(id_cad, id_cand)
    
    attr_score = round(0.7 * owner_sim + 0.3 * id_sim, 4)

    # 5. GNSS Ground Truth Proximity
    gnss_score = compute_gnss_proximity_score(g_cad, gnss_points)

    return {
        "geometry_score": iou,
        "area_score": area_score,
        "location_score": loc_score,
        "attribute_score": attr_score,
        "owner_similarity": owner_sim,
        "gnss_score": gnss_score,
        "centroid_distance_m": dist_m
    }
