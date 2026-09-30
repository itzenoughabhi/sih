import os
import json
import csv
import math
import random
from typing import Dict, Any, List
import pyproj
from shapely.geometry import Polygon, Point, LineString, mapping, shape
from shapely.ops import transform
from backend.app.config import settings

# Fictionalized Vasai-Virar Urban Study Zone coordinates (Palghar District, Maharashtra)
BASE_LAT = 19.417842
BASE_LON = 72.823194
WGS84 = "EPSG:4326"
UTM43N = "EPSG:32643"

tr_to_metric = pyproj.Transformer.from_crs(WGS84, UTM43N, always_xy=True).transform
tr_to_wgs = pyproj.Transformer.from_crs(UTM43N, WGS84, always_xy=True).transform

# Origin point in UTM Zone 43N
OX, OY = tr_to_metric(BASE_LON, BASE_LAT)

FIRST_NAMES = [
    "Rajesh", "Sanjay", "Priya", "Amit", "Neha", "Vijay", "Pooja", "Nitin",
    "Sachin", "Sunil", "Ramesh", "Sunita", "Deepak", "Manoj", "Archana",
    "Sneha", "Sandeep", "Nilesh", "Sujata", "Aniket", "Kavita", "Mahesh",
    "Rahul", "Vandana", "Prakash", "Swati", "Ganesh", "Manisha", "Kishor", "Shweta"
]

MIDDLE_NAMES = [
    "Prakash", "Ashok", "Mahesh", "Sunil", "Ramesh", "Dattatray", "Anil", "Suresh",
    "Vasant", "Shantaram", "Gajanan", "Prabhakar", "Bhaskar", "Vinayak", "Narayan", "Manohar"
]

LAST_NAMES = [
    "Patil", "More", "Kulkarni", "Jadhav", "Deshmukh", "Shinde", "Pawar", "Chavan",
    "Sawant", "Joshi", "Thakur", "Mhatre", "Bhoir", "Raut", "Naik", "Kadam",
    "Gaikwad", "Vartak", "Tare", "Keni"
]

LAND_USES = ["Residential", "Residential", "Commercial", "Residential", "Mixed-Use", "Residential"]

def generate_synthetic_data(seed: int = 42, num_parcels: int = 100) -> Dict[str, Any]:
    """
    Generate reproducible, high-fidelity synthetic Indian urban geospatial data
    modeled on the Vasai-Virar Urban Study Zone (Maharashtra).

    Strictly synthetic demonstration data for hackathons & prototype evaluation.
    Not an official land record.
    """
    random.seed(seed)
    
    cadastral_features: List[Dict[str, Any]] = []
    municipal_features: List[Dict[str, Any]] = []
    revenue_rows: List[Dict[str, Any]] = []
    building_features: List[Dict[str, Any]] = []
    gnss_rows: List[Dict[str, Any]] = []
    
    # Controlled data error indices (Section 11)
    # 1. 10% area mismatch
    area_mismatch_indices = {2, 14, 23, 33, 41, 58, 66, 76, 83, 97}
    # 2. 8% owner name variation
    owner_var_indices = {11, 23, 36, 49, 61, 74, 83, 95}
    # 3. 5% geometry displacement
    geom_shift_indices = {2, 14, 41, 66, 83}
    # Severe conflicts (to ensure 5-15 conflicts where score < 0.70)
    severe_conflict_indices = {14, 23, 41, 49, 66, 83, 97}
    # 4. 5% missing attributes
    missing_attr_indices = {14, 38, 51, 70, 83}
    # 5. 5% GNSS displacement
    gnss_disp_indices = {14, 29, 41, 66, 89}
    # 6. 3% boundary overlap (topology)
    overlap_indices = {51, 63, 81}
    # 7. 3% duplicate records (topology)
    duplicate_indices = {35, 78, 92}
    
    # 5 vacant parcels (parcels with 0 buildings)
    vacant_parcel_indices = {3, 10, 20, 30, 50}

    parcel_idx = 0
    non_vacant_counter = 0

    # 4 urban sectors / blocks separated by primary arterial avenues
    for block_id in range(4):
        if block_id == 0:
            bx, by = OX - 140.0, OY + 18.0
            block_loc, block_ward = "Nalasopara West", "14"
        elif block_id == 1:
            bx, by = OX + 15.0, OY + 18.0
            block_loc, block_ward = "Nalasopara East", "23" # Hero Ward
        elif block_id == 2:
            bx, by = OX - 140.0, OY - 150.0
            block_loc, block_ward = "Achole", "21"
        else:
            bx, by = OX + 15.0, OY - 150.0
            block_loc, block_ward = "Navghar", "12"

        for r in range(5):
            for c in range(5):
                parcel_idx += 1
                
                # Base plot geometry dimensions
                pw = 18.0 + ((c + r) % 3) * 1.0
                ph = 21.0 + ((c * r) % 3) * 1.0
                px = bx + c * 26.0
                py = by + r * 28.0

                first = FIRST_NAMES[(parcel_idx * 7) % len(FIRST_NAMES)]
                mid = MIDDLE_NAMES[(parcel_idx * 5) % len(MIDDLE_NAMES)]
                last = LAST_NAMES[(parcel_idx * 3) % len(LAST_NAMES)]
                full_owner = f"{first} {mid} {last}"

                survey_no = f"{110 + block_id * 5 + r}/{c + 1}{'A' if (r + c) % 2 == 0 else 'B'}"
                land_use = LAND_USES[parcel_idx % len(LAND_USES)]
                pid_str = f"VVR-{block_ward}-{parcel_idx:05d}"
                mun_id_str = f"VVMC-{block_ward}-{parcel_idx:04d}"
                rev_id_str = f"RV-{block_ward}-{800 + parcel_idx:05d}"

                # SECTION 13: REALISTIC PROPERTY EXAMPLE (HERO PARCEL)
                is_hero = (parcel_idx == 1)
                # SECTION 14: CONFLICT DEMO PARCEL
                is_conflict = (parcel_idx == 2)

                if is_hero:
                    pid_str = "VVR-23-00142"
                    mun_id_str = "VVMC-23-0142"
                    rev_id_str = "RV-23-00871"
                    survey_no = "118/3A"
                    block_ward = "23"
                    block_loc = "Nalasopara East"
                    land_use = "Residential"
                    full_owner = "Rajesh Prakash Patil"
                    pw = 18.5
                    ph = 428.60 / pw
                    # Position hero parcel at origin
                    px = OX - 5.0
                    py = OY - 5.0

                elif is_conflict:
                    pid_str = "VVR-23-00217"
                    mun_id_str = "VVMC-23-0217"
                    rev_id_str = "RV-23-00912"
                    survey_no = "124/2B"
                    block_ward = "23"
                    block_loc = "Nalasopara East"
                    land_use = "Commercial"
                    full_owner = "Vijay Dattatray Shinde"
                    pw = 22.0
                    ph = 612.40 / pw
                    px = bx + c * 26.0
                    py = by + r * 28.0

                cad_metric_poly = Polygon([
                    [px, py],
                    [px + pw, py],
                    [px + pw, py + ph],
                    [px, py + ph],
                    [px, py]
                ])

                # Intentional boundary overlap in cadastral layer (parcels 51, 63, 81)
                if parcel_idx in overlap_indices:
                    cad_metric_poly = Polygon([
                        [px, py],
                        [px + pw + 8.0, py],
                        [px + pw + 8.0, py + ph],
                        [px, py + ph],
                        [px, py]
                    ])

                # Intentional duplicate cadastral geometry (parcels 35, 78, 92)
                if parcel_idx in duplicate_indices and cadastral_features:
                    cad_wgs_geom = cadastral_features[-1]["geometry"]
                    cad_metric_poly = transform(tr_to_metric, shape(cad_wgs_geom))
                else:
                    cad_wgs_poly = transform(tr_to_wgs, cad_metric_poly)
                    cad_wgs_geom = mapping(cad_wgs_poly)

                cad_area = round(cad_metric_poly.area, 2)

                # Municipal attributes & geometry setup
                mun_owner = f"{first} {mid[0]}. {last}"
                mun_w, mun_h = pw, ph
                mun_px, mun_py = px, py

                if is_hero:
                    mun_owner = "Rajesh P. Patil"
                    mun_area = 423.90
                    mun_w = 18.4
                    mun_h = 423.90 / mun_w
                elif is_conflict:
                    mun_owner = "Vijay D. Shinde"
                    mun_area = 574.20
                    mun_w = 21.5
                    mun_h = 574.20 / mun_w
                    # Shift municipal boundary by approximately 6.0 meters
                    mun_px = px + 11.0 + 4.2426 - (mun_w / 2.0)
                    mun_py = py + (ph / 2.0) + 4.2426 - (mun_h / 2.0)
                elif parcel_idx in severe_conflict_indices:
                    # Severe displacement & area mismatch (score drops < 0.70)
                    s_m = 8.5
                    mun_px += s_m / 1.414
                    mun_py += s_m / 1.414
                    delta_pct = 0.22
                    mun_area = round(cad_area * (1.0 - delta_pct), 2)
                    mun_w = pw * math.sqrt(1.0 - delta_pct)
                    mun_h = ph * math.sqrt(1.0 - delta_pct)
                    if parcel_idx in (23, 49):
                        mun_owner = "Nitin Suresh Chavan" if parcel_idx == 23 else "Kishor Pandurang Gaikwad"
                elif parcel_idx in area_mismatch_indices:
                    delta_pct = 0.08 + (parcel_idx % 4) * 0.015
                    mun_area = round(cad_area * (1.0 - delta_pct), 2)
                    mun_w = pw * math.sqrt(1.0 - delta_pct)
                    mun_h = ph * math.sqrt(1.0 - delta_pct)
                else:
                    # Minor variance within normal municipal assessment tolerance
                    mun_area = round(cad_area * (1.0 - (parcel_idx % 5) * 0.002), 2)
                    mun_w = pw
                    mun_h = mun_area / mun_w

                if parcel_idx in geom_shift_indices and not is_conflict and parcel_idx not in severe_conflict_indices:
                    s_m = 4.0
                    mun_px += s_m / 1.414
                    mun_py += s_m / 1.414

                if parcel_idx in owner_var_indices and not is_hero and not is_conflict and parcel_idx not in severe_conflict_indices:
                    mun_owner = f"{first[0]}. {mid[0]}. {last}"

                mun_metric_poly = Polygon([
                    [mun_px, mun_py],
                    [mun_px + mun_w, mun_py],
                    [mun_px + mun_w, mun_py + mun_h],
                    [mun_px, mun_py + mun_h],
                    [mun_px, mun_py]
                ])
                mun_wgs_poly = transform(tr_to_wgs, mun_metric_poly)
                mun_wgs_geom = mapping(mun_wgs_poly)

                # Revenue Register Record
                if is_hero:
                    rev_area = 428.40
                    rev_owner = "Rajesh Prakash Patil"
                elif is_conflict:
                    rev_area = 611.80
                    rev_owner = "Vijay Dattatray Shinde"
                elif parcel_idx in area_mismatch_indices:
                    rev_area = round(cad_area * 0.998, 2)
                    rev_owner = full_owner
                else:
                    rev_area = round(cad_area * 0.999, 2)
                    rev_owner = full_owner

                # Missing attribute anomalies
                cad_sy = survey_no
                cad_o = full_owner
                cad_a = cad_area
                if parcel_idx in missing_attr_indices:
                    if parcel_idx in (15, 70):
                        cad_sy = None
                    elif parcel_idx in (38, 85):
                        cad_o = None
                    elif parcel_idx == 57:
                        cad_a = 0.0

                # 1. CADASTRAL GEOJSON FEATURE
                cadastral_features.append({
                    "type": "Feature",
                    "properties": {
                        "parcel_id": pid_str,
                        "survey_number": cad_sy,
                        "owner_name": cad_o,
                        "plot_area_sqm": cad_a,
                        "land_use": land_use,
                        "ward": block_ward,
                        "locality": block_loc,
                        "source_dataset": "synthetic_cadastral_2026",
                        "source_type": "CADASTRAL",
                        "generated_at": "2026-09-18T10:30:00Z",
                        "is_simulated": True
                    },
                    "geometry": cad_wgs_geom
                })

                # 2. MUNICIPAL GEOJSON FEATURE
                address_str = f"{'Shivaji Nagar' if (r + c) % 2 == 0 else 'Ganesh Nagar'}, {block_loc}"
                tax_z = f"R{1 + parcel_idx % 3}" if land_use == "Residential" else "C1"
                municipal_features.append({
                    "type": "Feature",
                    "properties": {
                        "property_id": mun_id_str,
                        "parcel_reference": pid_str,
                        "owner_name": mun_owner,
                        "property_use": land_use,
                        "tax_zone": tax_z,
                        "assessed_area_sqm": mun_area,
                        "address": address_str,
                        "ward": block_ward,
                        "locality": block_loc,
                        "source_dataset": "synthetic_municipal_2026",
                        "source_type": "MUNICIPAL",
                        "generated_at": "2026-09-18T10:30:00Z",
                        "is_simulated": True
                    },
                    "geometry": mun_wgs_geom
                })

                # 3. REVENUE REGISTER ROW
                revenue_rows.append({
                    "revenue_id": rev_id_str,
                    "survey_number": survey_no,
                    "recorded_owner": rev_owner,
                    "recorded_area_sqm": rev_area,
                    "land_class": land_use,
                    "village": "Nalasopara" if "Nalasopara" in block_loc else ("Vasai" if "Vasai" in block_loc else "Virar"),
                    "taluka": "Vasai",
                    "district": "Palghar",
                    "record_year": 2025,
                    "source_dataset": "synthetic_revenue_2026",
                    "source_type": "REVENUE",
                    "generated_at": "2026-09-18T10:30:00Z",
                    "is_simulated": True
                })

                # 4. BUILDING FOOTPRINTS (EXACTLY 150 BUILDINGS)
                # Distribution:
                # 5 vacant parcels (0 buildings)
                # 40 parcels with 1 building = 40
                # 55 parcels with 2 buildings = 110
                # Total = 40 + 110 = 150 buildings
                if is_hero or is_conflict:
                    num_bldgs = 1
                    non_vacant_counter += 1
                elif parcel_idx in vacant_parcel_indices:
                    num_bldgs = 0
                else:
                    non_vacant_counter += 1
                    # First 40 non-vacant parcels have 1 building, remaining 55 have 2 buildings
                    num_bldgs = 1 if non_vacant_counter <= 40 else 2

                if num_bldgs == 1:
                    bw = 12.0
                    bh = 186.42 / bw if is_hero else round((cad_area * 0.45) / bw, 2)
                    b_area = 186.42 if is_hero else round(bw * bh, 2)
                    b_poly_metric = Polygon([
                        [px + 3.0, py + 3.0],
                        [px + 3.0 + bw, py + 3.0],
                        [px + 3.0 + bw, py + 3.0 + bh],
                        [px + 3.0, py + 3.0 + bh],
                        [px + 3.0, py + 3.0]
                    ])
                    b_wgs = transform(tr_to_wgs, b_poly_metric)
                    b_id = "BLD-VVR-00142" if is_hero else f"BLD-VVR-{len(building_features) + 1:05d}"
                    building_features.append({
                        "type": "Feature",
                        "properties": {
                            "building_id": b_id,
                            "parcel_id": pid_str,
                            "building_type": land_use,
                            "floors": 2 if is_hero else random.randint(1, 3),
                            "footprint_area_sqm": b_area,
                            "source_dataset": "synthetic_drone_2026",
                            "source_type": "DRONE_FOOTPRINT",
                            "generated_at": "2026-09-18T10:30:00Z",
                            "is_simulated": True
                        },
                        "geometry": mapping(b_wgs)
                    })
                elif num_bldgs == 2:
                    bw = pw * 0.40
                    bh = ph * 0.35
                    # Front structure
                    b1_metric = Polygon([
                        [px + 1.2, py + 1.2],
                        [px + 1.2 + bw, py + 1.2],
                        [px + 1.2 + bw, py + 1.2 + bh],
                        [px + 1.2, py + 1.2 + bh],
                        [px + 1.2, py + 1.2]
                    ])
                    b1_wgs = transform(tr_to_wgs, b1_metric)
                    building_features.append({
                        "type": "Feature",
                        "properties": {
                            "building_id": f"BLD-VVR-{len(building_features) + 1:05d}",
                            "parcel_id": pid_str,
                            "building_type": land_use,
                            "floors": random.randint(1, 2),
                            "footprint_area_sqm": round(bw * bh, 2),
                            "source_dataset": "synthetic_drone_2026",
                            "source_type": "DRONE_FOOTPRINT",
                            "generated_at": "2026-09-18T10:30:00Z",
                            "is_simulated": True
                        },
                        "geometry": mapping(b1_wgs)
                    })
                    # Rear structure
                    b2_metric = Polygon([
                        [px + 1.2, py + ph - bh - 1.2],
                        [px + 1.2 + bw, py + ph - bh - 1.2],
                        [px + 1.2 + bw, py + ph - 1.2],
                        [px + 1.2, py + ph - 1.2],
                        [px + 1.2, py + ph - 1.2]
                    ])
                    b2_wgs = transform(tr_to_wgs, b2_metric)
                    building_features.append({
                        "type": "Feature",
                        "properties": {
                            "building_id": f"BLD-VVR-{len(building_features) + 1:05d}",
                            "parcel_id": pid_str,
                            "building_type": land_use,
                            "floors": random.randint(1, 4),
                            "footprint_area_sqm": round(bw * bh, 2),
                            "source_dataset": "synthetic_drone_2026",
                            "source_type": "DRONE_FOOTPRINT",
                            "generated_at": "2026-09-18T10:30:00Z",
                            "is_simulated": True
                        },
                        "geometry": mapping(b2_wgs)
                    })

                # 5. GNSS SURVEY POINTS (EXACTLY 100 POINTS)
                c_x = px + pw / 2.0
                c_y = py + ph / 2.0
                acc_m = round(random.uniform(0.04, 0.20), 2)

                if is_hero:
                    g_lon = BASE_LON
                    g_lat = BASE_LAT
                    acc_m = 0.08
                    gnss_id = "GNSS-VVR-00142"
                    operator = "Field Survey Team A"
                    survey_date = "2026-09-18"
                elif is_conflict:
                    pt_wgs = transform(tr_to_wgs, Point(c_x, c_y))
                    g_lon = round(pt_wgs.x, 6)
                    g_lat = round(pt_wgs.y, 6)
                    acc_m = 0.09
                    gnss_id = "GNSS-VVR-00217"
                    operator = "Field Survey Team A"
                    survey_date = "2026-09-18"
                elif parcel_idx in gnss_disp_indices:
                    s_d = 2.5
                    pt_wgs = transform(tr_to_wgs, Point(c_x + s_d, c_y + s_d))
                    g_lon = round(pt_wgs.x, 6)
                    g_lat = round(pt_wgs.y, 6)
                    acc_m = round(random.uniform(0.30, 0.45), 2)
                    gnss_id = f"GNSS-VVR-{parcel_idx:05d}"
                    operator = "Field Survey Team C"
                    survey_date = f"2026-09-{12 + (parcel_idx % 14):02d}"
                else:
                    pt_wgs = transform(tr_to_wgs, Point(c_x, c_y))
                    g_lon = round(pt_wgs.x, 6)
                    g_lat = round(pt_wgs.y, 6)
                    gnss_id = f"GNSS-VVR-{parcel_idx:05d}"
                    operator = f"Field Survey Team {chr(65 + (parcel_idx % 3))}"
                    survey_date = f"2026-09-{12 + (parcel_idx % 16):02d}"

                gnss_rows.append({
                    "gnss_id": gnss_id,
                    "parcel_id": pid_str,
                    "latitude": g_lat,
                    "longitude": g_lon,
                    "accuracy_m": acc_m,
                    "survey_date": survey_date,
                    "operator": operator,
                    "source_dataset": "synthetic_gnss_2026",
                    "source_type": "GNSS_SURVEY",
                    "generated_at": "2026-09-18T10:30:00Z",
                    "is_simulated": True
                })

    # 6. ROAD DATA (EXACTLY 20 FEATURES)
    road_specs = [
        ("RD-VVR-001", "Station Road", "Major Arterial", 24.0, [(-150, 0), (150, 0)]),
        ("RD-VVR-002", "Vasai Link Road", "Major Arterial", 24.0, [(0, -170), (0, 160)]),
        ("RD-VVR-003", "East-West Connector", "Major Arterial", 20.0, [(-150, 70), (150, 70)]),
        ("RD-VVR-004", "Tulinj Bypass Road", "Major Arterial", 20.0, [(-150, -70), (150, -70)]),
        ("RD-VVR-005", "Market Road", "Collector", 18.0, [(70, -170), (70, 160)]),
        ("RD-VVR-006", "Ganesh Nagar Road", "Collector", 16.0, [(-70, -170), (-70, 160)]),
        ("RD-VVR-007", "Shivaji Marg", "Collector", 16.0, [(-150, 150), (150, 150)]),
        ("RD-VVR-008", "Dr. Ambedkar Road", "Collector", 16.0, [(-150, -160), (150, -160)]),
        ("RD-VVR-009", "North Perimeter Road", "Collector", 16.0, [(-160, 165), (160, 165)]),
        ("RD-VVR-010", "Nalasopara Creek View Road", "Collector", 15.0, [(150, -170), (150, 160)]),
        ("RD-VVR-011", "Evershine Boulevard", "Collector", 18.0, [(-150, -170), (-150, 160)]),
        ("RD-VVR-012", "Municipal Ward 23 Main Street", "Collector", 16.0, [(15, 18), (145, 18)]),
        ("RD-VVR-013", "Achole Link Road", "Local Road", 12.0, [(-140, -18), (-5, -18)]),
        ("RD-VVR-014", "Navghar Access Road", "Local Road", 12.0, [(15, -18), (145, -18)]),
        ("RD-VVR-015", "Sector 1 Internal Lane", "Internal Street", 8.0, [(-140, 46), (-5, 46)]),
        ("RD-VVR-016", "Sector 2 Ring Street", "Internal Street", 10.0, [(15, 46), (145, 46)]),
        ("RD-VVR-017", "Bolinj Cross Road", "Local Road", 12.0, [(-140, 102), (-5, 102)]),
        ("RD-VVR-018", "Hanuman Mandir Lane", "Internal Street", 7.0, [(15, 102), (145, 102)]),
        ("RD-VVR-019", "Sai Baba Nagar Road", "Local Road", 10.0, [(-140, -102), (-5, -102)]),
        ("RD-VVR-020", "Taluka Office Approach Road", "Local Road", 12.0, [(15, -102), (145, -102)]),
    ]

    roads_features: List[Dict[str, Any]] = []
    for r_id, r_name, r_type, r_w, pts in road_specs:
        m_line = LineString([(OX + x, OY + y) for x, y in pts])
        wgs_line = transform(tr_to_wgs, m_line)
        roads_features.append({
            "type": "Feature",
            "properties": {
                "road_id": r_id,
                "road_name": r_name,
                "road_type": r_type,
                "width_m": r_w,
                "source_dataset": "synthetic_roads_2026",
                "source_type": "ROADS",
                "generated_at": "2026-09-18T10:30:00Z",
                "is_simulated": True
            },
            "geometry": mapping(wgs_line)
        })

    # 7. UTILITY DATA (EXACTLY 10 FEATURES)
    utility_specs = [
        ("UT-W-0012", "Water", "Active", [(-150, -5), (150, -5)]),
        ("UT-W-0013", "Water", "Active", [(5, -170), (5, 160)]),
        ("UT-W-0014", "Water", "Active", [(-140, 85), (140, 85)]),
        ("UT-W-0015", "Water", "Active", [(-140, -85), (140, -85)]),
        ("UT-S-0001", "Sewer", "Active", [(-150, -12), (150, -12)]),
        ("UT-S-0002", "Sewer", "Active", [(-12, -170), (-12, 160)]),
        ("UT-S-0003", "Sewer", "Active", [(55, -150), (55, 150)]),
        ("UT-E-0001", "Electricity", "Active", [(-145, 30), (145, 30)]),
        ("UT-E-0002", "Electricity", "Active", [(-145, -30), (145, -30)]),
        ("UT-E-0003", "Electricity", "Active", [(30, -150), (30, 150)]),
    ]

    utilities_features: List[Dict[str, Any]] = []
    for u_id, u_type, u_stat, pts in utility_specs:
        m_line = LineString([(OX + x, OY + y) for x, y in pts])
        wgs_line = transform(tr_to_wgs, m_line)
        utilities_features.append({
            "type": "Feature",
            "properties": {
                "utility_id": u_id,
                "utility_type": u_type,
                "status": u_stat,
                "source_dataset": "synthetic_utilities_2026",
                "source_type": "UTILITIES",
                "generated_at": "2026-09-18T10:30:00Z",
                "is_simulated": True
            },
            "geometry": mapping(wgs_line)
        })

    cadastral_geojson = {
        "type": "FeatureCollection",
        "name": "SIMULATED DEMONSTRATION DATA — NOT AN OFFICIAL LAND RECORD",
        "crs": {"type": "name", "properties": {"name": "EPSG:4326"}},
        "features": cadastral_features
    }
    municipal_geojson = {
        "type": "FeatureCollection",
        "name": "SIMULATED DEMONSTRATION DATA — NOT AN OFFICIAL LAND RECORD",
        "crs": {"type": "name", "properties": {"name": "EPSG:4326"}},
        "features": municipal_features
    }
    buildings_geojson = {
        "type": "FeatureCollection",
        "name": "SIMULATED DEMONSTRATION DATA — NOT AN OFFICIAL LAND RECORD",
        "crs": {"type": "name", "properties": {"name": "EPSG:4326"}},
        "features": building_features
    }
    roads_geojson = {
        "type": "FeatureCollection",
        "name": "SIMULATED DEMONSTRATION DATA — NOT AN OFFICIAL LAND RECORD",
        "crs": {"type": "name", "properties": {"name": "EPSG:4326"}},
        "features": roads_features
    }
    utilities_geojson = {
        "type": "FeatureCollection",
        "name": "SIMULATED DEMONSTRATION DATA — NOT AN OFFICIAL LAND RECORD",
        "crs": {"type": "name", "properties": {"name": "EPSG:4326"}},
        "features": utilities_features
    }

    # Save all datasets to data/demo/
    demo_dir = settings.DEMO_DIR
    os.makedirs(demo_dir, exist_ok=True)

    with open(os.path.join(demo_dir, "cadastral.geojson"), "w", encoding="utf-8") as f:
        json.dump(cadastral_geojson, f, indent=2)

    with open(os.path.join(demo_dir, "municipal.geojson"), "w", encoding="utf-8") as f:
        json.dump(municipal_geojson, f, indent=2)

    with open(os.path.join(demo_dir, "buildings.geojson"), "w", encoding="utf-8") as f:
        json.dump(buildings_geojson, f, indent=2)

    with open(os.path.join(demo_dir, "roads.geojson"), "w", encoding="utf-8") as f:
        json.dump(roads_geojson, f, indent=2)

    with open(os.path.join(demo_dir, "utilities.geojson"), "w", encoding="utf-8") as f:
        json.dump(utilities_geojson, f, indent=2)

    with open(os.path.join(demo_dir, "revenue.csv"), "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(revenue_rows[0].keys()))
        writer.writeheader()
        writer.writerows(revenue_rows)

    with open(os.path.join(demo_dir, "gnss.csv"), "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(gnss_rows[0].keys()))
        writer.writeheader()
        writer.writerows(gnss_rows)

    return {
        "cadastral": cadastral_geojson,
        "municipal": municipal_geojson,
        "buildings": buildings_geojson,
        "revenue": revenue_rows,
        "gnss": gnss_rows,
        "roads": roads_geojson,
        "utilities": utilities_geojson
    }
