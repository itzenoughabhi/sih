import json
import os
from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.config import settings
from backend.app.models.models import Dataset, Parcel, HarmonizationResult, Conflict

router = APIRouter(prefix="/map", tags=["Map"])

@router.get("/parcels")
def get_map_parcels(db: Session = Depends(get_db)):
    """
    Returns GeoJSON FeatureCollection of primary parcels with embedded
    harmonization status, confidence score, and map render colors.
    """
    cad_ds = db.query(Dataset).filter(Dataset.dataset_type == "CADASTRAL").first()
    query = db.query(Parcel)
    if cad_ds:
        query = query.filter(Parcel.dataset_id == cad_ds.id)
    parcels = query.all()

    features = []
    for p in parcels:
        harm = db.query(HarmonizationResult).filter(HarmonizationResult.source_parcel_id == p.id).first()
        status_val = harm.status if harm else "NEEDS_REVIEW"
        conf_score = harm.overall_confidence if harm else 0.0

        if status_val == "HIGH_CONFIDENCE":
            color = "#10B981"  # Emerald green
        elif status_val == "NEEDS_REVIEW":
            color = "#F59E0B"  # Amber
        else:
            color = "#EF4444"  # Crimson Red

        try:
            geom = json.loads(p.geometry)
            features.append({
                "type": "Feature",
                "id": p.id,
                "properties": {
                    "id": p.id,
                    "parcel_id": p.parcel_id,
                    "survey_number": p.survey_number or "N/A",
                    "owner_name": p.owner_name or "Unspecified",
                    "area": p.area,
                    "land_use": p.land_use or "RESIDENTIAL",
                    "status": status_val,
                    "confidence": conf_score,
                    "fill_color": color,
                    "stroke_color": color
                },
                "geometry": geom
            })
        except Exception:
            continue

    return {
        "type": "FeatureCollection",
        "features": features
    }

@router.get("/layers")
def get_map_layers(db: Session = Depends(get_db)):
    """
    Returns discrete GeoJSON FeatureCollections for all 5 operational layers:
    cadastral, municipal, buildings, gnss, conflicts, and harmonized consensus.
    """
    layers: Dict[str, Any] = {
        "cadastral": {"type": "FeatureCollection", "features": []},
        "municipal": {"type": "FeatureCollection", "features": []},
        "buildings": {"type": "FeatureCollection", "features": []},
        "gnss": {"type": "FeatureCollection", "features": []},
        "conflicts": {"type": "FeatureCollection", "features": []},
        "harmonized": {"type": "FeatureCollection", "features": []},
        "roads": {"type": "FeatureCollection", "features": []},
        "utilities": {"type": "FeatureCollection", "features": []}
    }

    datasets = db.query(Dataset).all()
    for ds in datasets:
        parcels = db.query(Parcel).filter(Parcel.dataset_id == ds.id).all()
        target_layer = None
        if ds.dataset_type == "CADASTRAL":
            target_layer = "cadastral"
        elif ds.dataset_type == "MUNICIPAL":
            target_layer = "municipal"
        elif ds.dataset_type == "DRONE_FOOTPRINT":
            target_layer = "buildings"
        elif ds.dataset_type == "GNSS_SURVEY":
            target_layer = "gnss"
        elif ds.dataset_type == "ROADS":
            target_layer = "roads"
        elif ds.dataset_type == "UTILITIES":
            target_layer = "utilities"

        if target_layer:
            for p in parcels:
                try:
                    geom = json.loads(p.geometry)
                    layers[target_layer]["features"].append({
                        "type": "Feature",
                        "id": p.id,
                        "properties": {
                            "id": p.id,
                            "parcel_id": p.parcel_id,
                            "owner_name": p.owner_name or "",
                            "area": p.area,
                            "layer": target_layer
                        },
                        "geometry": geom
                    })
                except Exception:
                    continue

    # Harmonized consensus layer & conflict overlays
    harm_results = db.query(HarmonizationResult).all()
    for h in harm_results:
        p = db.query(Parcel).filter(Parcel.id == h.source_parcel_id).first()
        if not p:
            continue
        try:
            geom = json.loads(h.unified_geometry or p.geometry)
            color = "#10B981" if h.status == "HIGH_CONFIDENCE" else ("#F59E0B" if h.status == "NEEDS_REVIEW" else "#EF4444")
            layers["harmonized"]["features"].append({
                "type": "Feature",
                "id": p.id,
                "properties": {
                    "id": p.id,
                    "parcel_id": p.parcel_id,
                    "owner_name": p.owner_name or "",
                    "area": p.area,
                    "status": h.status,
                    "confidence": h.overall_confidence,
                    "fill_color": color
                },
                "geometry": geom
            })
            if h.status == "CONFLICT":
                layers["conflicts"]["features"].append({
                    "type": "Feature",
                    "id": f"conf-{p.id}",
                    "properties": {
                        "parcel_id": p.parcel_id,
                        "description": h.explanation
                    },
                    "geometry": geom
                })
        except Exception:
            continue

    # Fallback to load roads and utilities directly from demo files if not yet ingested in DB
    demo_dir = settings.DEMO_DIR
    if not layers["roads"]["features"] and os.path.exists(os.path.join(demo_dir, "roads.geojson")):
        try:
            with open(os.path.join(demo_dir, "roads.geojson"), "r", encoding="utf-8") as f:
                layers["roads"] = json.load(f)
        except Exception:
            pass

    if not layers["utilities"]["features"] and os.path.exists(os.path.join(demo_dir, "utilities.geojson")):
        try:
            with open(os.path.join(demo_dir, "utilities.geojson"), "r", encoding="utf-8") as f:
                layers["utilities"] = json.load(f)
        except Exception:
            pass

    return layers

@router.get("/conflicts")
def get_map_conflicts(db: Session = Depends(get_db)):
    conflicts = db.query(Conflict).filter(Conflict.status == "OPEN").all()
    features = []
    for c in conflicts:
        p = db.query(Parcel).filter(Parcel.id == c.parcel_id).first()
        if p and p.geometry:
            try:
                geom = json.loads(p.geometry)
                features.append({
                    "type": "Feature",
                    "id": c.id,
                    "properties": {
                        "conflict_id": c.id,
                        "parcel_id": p.parcel_id,
                        "conflict_type": c.conflict_type,
                        "severity": c.severity,
                        "description": c.description,
                        "difference": c.difference
                    },
                    "geometry": geom
                })
            except Exception:
                continue
    return {
        "type": "FeatureCollection",
        "features": features
    }

@router.get("/buffers")
def get_buffer_corridors_and_encroachments(db: Session = Depends(get_db)):
    """
    Automated Environmental, Infrastructure & Road Buffer Analysis.
    Generates buffer polygons and detects cadastral parcel infringements.
    """
    from shapely.geometry import shape, mapping, LineString, Polygon
    from shapely.ops import unary_union

    cad_ds = db.query(Dataset).filter(Dataset.dataset_type == "CADASTRAL").first()
    parcels = db.query(Parcel).filter(Parcel.dataset_id == cad_ds.id).all() if cad_ds else []

    parcel_shapes = []
    for p in parcels:
        try:
            g = json.loads(p.geometry)
            s = shape(g)
            parcel_shapes.append((p, s))
        except Exception:
            continue

    if not parcel_shapes:
        return {"corridors": {"type": "FeatureCollection", "features": []}, "encroachment_count": 0, "encroachments": []}

    b0 = parcel_shapes[0][1].bounds
    min_x, min_y, max_x, max_y = b0[0], b0[1], b0[2], b0[3]
    for p, s in parcel_shapes[1:]:
        b = s.bounds
        min_x = min(min_x, b[0])
        min_y = min(min_y, b[1])
        max_x = max(max_x, b[2])
        max_y = max(max_y, b[3])

    # Define key infrastructural & environmental alignments across the extent
    cx = (min_x + max_x) / 2
    cy = (min_y + max_y) / 2

    # 1. Waterbody River/Nallah centerline (meandering)
    water_line = LineString([
        (min_x, cy + 0.003),
        (min_x + (max_x - min_x) * 0.35, cy + 0.001),
        (cx, cy - 0.002),
        (min_x + (max_x - min_x) * 0.7, cy - 0.001),
        (max_x, cy - 0.003)
    ])
    # ~30m buffer in degrees (~0.00027 deg ~ 30m)
    water_buffer = water_line.buffer(0.00030)

    # 2. Major Arterial Road Corridor (East-West diagonal)
    road_line = LineString([
        (min_x, cy - 0.004),
        (cx, cy + 0.001),
        (max_x, cy + 0.005)
    ])
    # ~20m buffer (~0.00018 deg)
    road_buffer = road_line.buffer(0.00020)

    # 3. High-Tension 132kV Powerline Corridor (North-South)
    power_line = LineString([
        (cx + 0.003, min_y),
        (cx + 0.002, cy),
        (cx + 0.004, max_y)
    ])
    # ~15m buffer (~0.00014 deg)
    power_buffer = power_line.buffer(0.00015)

    buffer_features = [
        {
            "type": "Feature",
            "id": "buf-water-30m",
            "properties": {
                "name": "River / Nallah 30m Eco-Sensitive Buffer",
                "buffer_type": "WATERBODY_BUFFER",
                "statutory_distance_m": 30,
                "regulatory_body": "National Green Tribunal (NGT) & Water Act",
                "color": "#06B6D4",
                "stroke": "#0891B2"
            },
            "geometry": mapping(water_buffer)
        },
        {
            "type": "Feature",
            "id": "buf-road-20m",
            "properties": {
                "name": "Master Plan Arterial Road 20m Right-of-Way (RoW)",
                "buffer_type": "ROAD_ROW_BUFFER",
                "statutory_distance_m": 20,
                "regulatory_body": "Urban Development Authority (UDA)",
                "color": "#F97316",
                "stroke": "#EA580C"
            },
            "geometry": mapping(road_buffer)
        },
        {
            "type": "Feature",
            "id": "buf-power-15m",
            "properties": {
                "name": "132kV High Tension Powerline 15m Safety Corridor",
                "buffer_type": "HIGH_TENSION_BUFFER",
                "statutory_distance_m": 15,
                "regulatory_body": "State Electricity Board / Central Electricity Authority",
                "color": "#A855F7",
                "stroke": "#9333EA"
            },
            "geometry": mapping(power_buffer)
        }
    ]

    # Intersect buffers with all cadastral parcels to detect violations
    encroachments = []
    corridors = [
        ("WATERBODY_BUFFER", "30m Waterbody Reserve", water_buffer, "CRITICAL"),
        ("ROAD_ROW_BUFFER", "20m Master Plan Road RoW", road_buffer, "HIGH"),
        ("HIGH_TENSION_BUFFER", "15m Powerline Safety Zone", power_buffer, "MEDIUM")
    ]

    for p, p_geom in parcel_shapes:
        for c_type, c_name, c_buf, severity in corridors:
            if p_geom.intersects(c_buf):
                inter = p_geom.intersection(c_buf)
                if not inter.is_empty:
                    # Estimate approximate area in sqm
                    infringing_area = round(inter.area * (111000 * 111000 * 0.9), 1)
                    if infringing_area > 5.0:
                        encroachments.append({
                            "parcel_id": p.parcel_id,
                            "survey_number": p.survey_number or "N/A",
                            "owner_name": p.owner_name or "Unspecified",
                            "total_parcel_area": p.area,
                            "violation_type": c_type,
                            "corridor_name": c_name,
                            "severity": severity,
                            "infringing_area_sqm": infringing_area,
                            "infringing_pct": round(min(100.0, (infringing_area / max(p.area, 1.0)) * 100), 1),
                            "action_required": "Demarcation & Notice under Public Premises Act"
                        })

    return {
        "corridors": {
            "type": "FeatureCollection",
            "features": buffer_features
        },
        "encroachment_count": len(encroachments),
        "encroachments": sorted(encroachments, key=lambda x: x["infringing_area_sqm"], reverse=True)
    }
