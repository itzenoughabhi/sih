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
