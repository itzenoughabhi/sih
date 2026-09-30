import json
import uuid
from typing import Dict, Any
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import Dataset, Parcel, HarmonizationResult, Conflict, Review, AuditLog
from backend.app.demo.generator import generate_synthetic_data, BASE_LAT, BASE_LON
from backend.app.schemas.schemas import DemoGenerateRequest, DemoGenerateResponse
from backend.app.gis.attributes import normalize_attribute_keys

router = APIRouter(prefix="/demo", tags=["Demo"])

@router.post("/generate", status_code=status.HTTP_201_CREATED)
def generate_and_seed_demo(payload: DemoGenerateRequest = None, db: Session = Depends(get_db)):
    req = payload or DemoGenerateRequest()
    
    # Clean previous demo datasets
    db.query(Conflict).delete()
    db.query(Review).delete()
    db.query(HarmonizationResult).delete()
    db.query(Parcel).delete()
    db.query(Dataset).delete()
    db.commit()

    # Generate synthetic data with fixed seed
    synth = generate_synthetic_data(seed=req.seed, num_parcels=req.parcel_count)

    created_datasets = []

    # 1. Ingest Cadastral Dataset (Vasai-Virar Survey)
    cad_ds_id = str(uuid.uuid4())
    cad_features = synth["cadastral"]["features"]
    cad_dataset = Dataset(
        id=cad_ds_id,
        name="Vasai-Virar Cadastral Land Survey",
        dataset_type="CADASTRAL",
        source_agency="Directorate of Survey, Settlement & Land Records (Palghar District)",
        file_format="GeoJSON",
        crs="EPSG:4326",
        feature_count=len(cad_features),
        status="NORMALIZED"
    )
    db.add(cad_dataset)
    db.flush()

    for feat in cad_features:
        props = feat["properties"]
        db.add(Parcel(
            dataset_id=cad_dataset.id,
            parcel_id=props["parcel_id"],
            survey_number=props.get("survey_number"),
            geometry=json.dumps(feat["geometry"]),
            area=float(props.get("plot_area_sqm", props.get("area", 0.0))),
            owner_name=props.get("owner_name"),
            land_use=props.get("land_use", "Residential"),
            ward=props.get("ward", "23"),
            municipality=props.get("locality", "Vasai-Virar Urban Study Zone"),
            attributes=json.dumps(props)
        ))

    created_datasets.append({"name": cad_dataset.name, "type": "CADASTRAL", "count": len(cad_features)})

    # 2. Ingest Municipal Dataset (VVMC Property Tax)
    mun_ds_id = str(uuid.uuid4())
    mun_features = synth["municipal"]["features"]
    mun_dataset = Dataset(
        id=mun_ds_id,
        name="VVMC Property Tax GIS Register",
        dataset_type="MUNICIPAL",
        source_agency="Vasai-Virar City Municipal Corporation (VVMC)",
        file_format="GeoJSON",
        crs="EPSG:4326",
        feature_count=len(mun_features),
        status="NORMALIZED"
    )
    db.add(mun_dataset)
    db.flush()

    for feat in mun_features:
        raw_props = feat["properties"]
        norm_props = normalize_attribute_keys(raw_props)
        db.add(Parcel(
            dataset_id=mun_dataset.id,
            parcel_id=raw_props.get("property_id") or norm_props.get("parcel_id", "VVMC-000"),
            survey_number=norm_props.get("survey_number"),
            geometry=json.dumps(feat["geometry"]),
            area=float(raw_props.get("assessed_area_sqm", norm_props.get("area", 0.0) or 0.0)),
            owner_name=raw_props.get("owner_name") or norm_props.get("owner_name"),
            land_use=raw_props.get("property_use") or norm_props.get("land_use", "Residential"),
            ward=raw_props.get("ward", "23"),
            municipality="Vasai-Virar City Municipal Corporation",
            attributes=json.dumps(raw_props)
        ))

    created_datasets.append({"name": mun_dataset.name, "type": "MUNICIPAL", "count": len(mun_features)})

    # 3. Ingest Revenue Register (Mahabhumi)
    rev_ds_id = str(uuid.uuid4())
    rev_rows = synth["revenue"]
    rev_dataset = Dataset(
        id=rev_ds_id,
        name="Tahsil Land Revenue Record (7/12 & Khata)",
        dataset_type="REVENUE",
        source_agency="Department of Revenue (Mahabhumi, Vasai Taluka)",
        file_format="CSV",
        crs="EPSG:4326",
        feature_count=len(rev_rows),
        status="NORMALIZED"
    )
    db.add(rev_dataset)
    db.flush()

    for r in rev_rows:
        db.add(Parcel(
            dataset_id=rev_dataset.id,
            parcel_id=r.get("revenue_id", "RV-000"),
            survey_number=r.get("survey_number"),
            geometry=json.dumps({"type": "Point", "coordinates": [BASE_LON, BASE_LAT]}),
            area=float(r.get("recorded_area_sqm", 0.0) or 0.0),
            owner_name=r.get("recorded_owner"),
            land_use=r.get("land_class", "Residential"),
            ward="23",
            municipality=f"{r.get('village', 'Vasai')}, Taluka {r.get('taluka', 'Vasai')}",
            attributes=json.dumps(r)
        ))

    created_datasets.append({"name": rev_dataset.name, "type": "REVENUE", "count": len(rev_rows)})

    # 4. Ingest Drone Building Footprints (SVAMITVA)
    bldg_ds_id = str(uuid.uuid4())
    bldg_features = synth["buildings"]["features"]
    bldg_dataset = Dataset(
        id=bldg_ds_id,
        name="High-Resolution Drone Photogrammetry Footprints",
        dataset_type="DRONE_FOOTPRINT",
        source_agency="Survey of India (SVAMITVA Scheme - Vasai Zone)",
        file_format="GeoJSON",
        crs="EPSG:4326",
        feature_count=len(bldg_features),
        status="NORMALIZED"
    )
    db.add(bldg_dataset)
    db.flush()

    for feat in bldg_features:
        b_props = feat["properties"]
        db.add(Parcel(
            dataset_id=bldg_dataset.id,
            parcel_id=b_props["building_id"],
            survey_number=None,
            geometry=json.dumps(feat["geometry"]),
            area=float(b_props.get("footprint_area_sqm", 0.0) or 0.0),
            owner_name=None,
            land_use=b_props.get("building_type", "Residential"),
            ward="23",
            municipality="Vasai-Virar Urban Study Zone",
            attributes=json.dumps(b_props)
        ))

    created_datasets.append({"name": bldg_dataset.name, "type": "DRONE_FOOTPRINT", "count": len(bldg_features)})

    # 5. Ingest GNSS CORS Survey Points
    gnss_ds_id = str(uuid.uuid4())
    gnss_rows = synth["gnss"]
    gnss_dataset = Dataset(
        id=gnss_ds_id,
        name="Ground-Truth GNSS / CORS Field Survey Control",
        dataset_type="GNSS_SURVEY",
        source_agency="National Geodetic Network (SoI - Vasai Station)",
        file_format="CSV",
        crs="EPSG:4326",
        feature_count=len(gnss_rows),
        status="NORMALIZED"
    )
    db.add(gnss_dataset)
    db.flush()

    for g in gnss_rows:
        point_geom = {"type": "Point", "coordinates": [float(g["longitude"]), float(g["latitude"])]}
        db.add(Parcel(
            dataset_id=gnss_dataset.id,
            parcel_id=g.get("gnss_id", "GNSS-000"),
            survey_number=None,
            geometry=json.dumps(point_geom),
            area=0.0,
            owner_name=None,
            land_use="SURVEY_CONTROL",
            ward="23",
            municipality="Vasai-Virar Urban Study Zone",
            attributes=json.dumps(g)
        ))

    created_datasets.append({"name": gnss_dataset.name, "type": "GNSS_SURVEY", "count": len(gnss_rows)})

    # 6. Ingest Road Network Layer
    roads_ds_id = str(uuid.uuid4())
    roads_features = synth.get("roads", {}).get("features", [])
    if roads_features:
        roads_dataset = Dataset(
            id=roads_ds_id,
            name="Vasai-Virar Urban Road Network Layer",
            dataset_type="ROADS",
            source_agency="VVMC Town Planning & Public Works Department",
            file_format="GeoJSON",
            crs="EPSG:4326",
            feature_count=len(roads_features),
            status="NORMALIZED"
        )
        db.add(roads_dataset)
        db.flush()

        for feat in roads_features:
            r_props = feat["properties"]
            db.add(Parcel(
                dataset_id=roads_dataset.id,
                parcel_id=r_props["road_id"],
                survey_number=None,
                geometry=json.dumps(feat["geometry"]),
                area=float(r_props.get("width_m", 0.0)),
                owner_name=r_props.get("road_name"),
                land_use="TRANSPORT_NETWORK",
                ward="23",
                municipality="Vasai-Virar Urban Study Zone",
                attributes=json.dumps(r_props)
            ))

        created_datasets.append({"name": roads_dataset.name, "type": "ROADS", "count": len(roads_features)})

    # 7. Ingest Utility Network Layer
    util_ds_id = str(uuid.uuid4())
    util_features = synth.get("utilities", {}).get("features", [])
    if util_features:
        util_dataset = Dataset(
            id=util_ds_id,
            name="Vasai-Virar Municipal Utility & Lifeline Network",
            dataset_type="UTILITIES",
            source_agency="VVMC Water Supply & Sewerage Board",
            file_format="GeoJSON",
            crs="EPSG:4326",
            feature_count=len(util_features),
            status="NORMALIZED"
        )
        db.add(util_dataset)
        db.flush()

        for feat in util_features:
            u_props = feat["properties"]
            db.add(Parcel(
                dataset_id=util_dataset.id,
                parcel_id=u_props["utility_id"],
                survey_number=None,
                geometry=json.dumps(feat["geometry"]),
                area=0.0,
                owner_name=u_props.get("utility_type"),
                land_use="UTILITY_NETWORK",
                ward="23",
                municipality="Vasai-Virar Urban Study Zone",
                attributes=json.dumps(u_props)
            ))

        created_datasets.append({"name": util_dataset.name, "type": "UTILITIES", "count": len(util_features)})

    # Add Audit Log
    db.add(AuditLog(
        action="DEMO_DATA_GENERATED",
        entity="SYSTEM",
        entity_id=cad_ds_id,
        user="SYSTEM",
        details=json.dumps({
            "seed": req.seed,
            "datasets_created": len(created_datasets),
            "study_zone": "Vasai-Virar Urban Study Zone",
            "parcels_count": req.parcel_count
        })
    ))
    db.commit()

    return {
        "message": "Vasai-Virar demo datasets successfully generated and ingested (SIMULATED DEMONSTRATION DATA)",
        "datasets": created_datasets
    }

def random_area_from_geom(geom_dict: Dict[str, Any]) -> float:
    coords = geom_dict.get("coordinates", [[]])[0]
    if len(coords) < 3:
        return 120.0
    dx = abs(coords[1][0] - coords[0][0]) * 111320
    dy = abs(coords[2][1] - coords[1][1]) * 111320
    return round(dx * dy, 1)
