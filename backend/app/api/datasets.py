import json
import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import Dataset, Parcel, AuditLog
from backend.app.schemas.schemas import DatasetOut
from backend.app.config import settings
from backend.app.gis.crs import detect_crs, reproject_geometry, calculate_metric_area
from backend.app.gis.geometry import validate_and_repair_geometry
from backend.app.gis.attributes import normalize_attribute_keys

router = APIRouter(prefix="/datasets", tags=["Datasets"])

@router.get("", response_model=List[DatasetOut])
def list_datasets(db: Session = Depends(get_db)):
    datasets = db.query(Dataset).order_by(Dataset.created_at.desc()).all()
    return datasets

@router.get("/{dataset_id}")
def get_dataset(dataset_id: str, db: Session = Depends(get_db)):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    parcels_sample = db.query(Parcel).filter(Parcel.dataset_id == dataset_id).limit(10).all()
    return {
        "id": ds.id,
        "name": ds.name,
        "dataset_type": ds.dataset_type,
        "source_agency": ds.source_agency,
        "file_format": ds.file_format,
        "crs": ds.crs,
        "feature_count": ds.feature_count,
        "status": ds.status,
        "created_at": ds.created_at,
        "sample_features": [
            {
                "parcel_id": p.parcel_id,
                "survey_number": p.survey_number,
                "owner_name": p.owner_name,
                "area": p.area,
                "land_use": p.land_use
            }
            for p in parcels_sample
        ]
    }

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_dataset(
    file: UploadFile = File(...),
    name: str = Form(...),
    dataset_type: str = Form(...),
    source_agency: str = Form("Urban Local Body"),
    target_crs: Optional[str] = Form("EPSG:4326"),
    db: Session = Depends(get_db)
):
    filename = file.filename or "unknown.geojson"
    ext = os.path.splitext(filename)[1].lower()

    if ext not in [".geojson", ".json", ".csv"]:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload GeoJSON or CSV.")

    content = await file.read()
    save_id = str(uuid.uuid4())
    stored_path = os.path.join(settings.UPLOAD_DIR, f"{save_id}_{filename}")
    with open(stored_path, "wb") as f:
        f.write(content)

    feature_count = 0
    detected_crs_val = "EPSG:4326"

    # Ingest GeoJSON
    if ext in [".geojson", ".json"]:
        try:
            geo_data = json.loads(content.decode("utf-8"))
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid GeoJSON content.")

        detected_crs_val = detect_crs(geo_data.get("crs"))

        dataset_record = Dataset(
            id=save_id,
            name=name,
            dataset_type=dataset_type,
            source_agency=source_agency,
            file_format="GeoJSON",
            crs=detected_crs_val,
            status="NORMALIZED",
            file_path=stored_path
        )
        db.add(dataset_record)
        db.flush()

        features = geo_data.get("features", [])
        for feat in features:
            raw_geom = feat.get("geometry")
            if not raw_geom:
                continue

            # Reproject to EPSG:4326 if different
            reproj_geom = reproject_geometry(raw_geom, detected_crs_val, target_crs)
            repaired_geom, _ = validate_and_repair_geometry(reproj_geom)
            
            raw_props = feat.get("properties", {})
            norm_props = normalize_attribute_keys(raw_props)

            # Area calculation if missing
            area_m2 = norm_props.get("area")
            if not area_m2 or area_m2 <= 0:
                area_m2 = calculate_metric_area(repaired_geom)

            pid = norm_props.get("parcel_id") or f"P-{save_id[:6]}-{feature_count+1:03d}"

            parcel = Parcel(
                dataset_id=dataset_record.id,
                parcel_id=pid,
                survey_number=norm_props.get("survey_number"),
                geometry=json.dumps(repaired_geom),
                area=area_m2,
                owner_name=norm_props.get("owner_name"),
                land_use=norm_props.get("land_use", "RESIDENTIAL"),
                ward=norm_props.get("ward", "Ward 1"),
                municipality=norm_props.get("municipality", "Municipal Corporation"),
                attributes=json.dumps(raw_props)
            )
            db.add(parcel)
            feature_count += 1

        dataset_record.feature_count = feature_count
        
        # Log Audit
        db.add(AuditLog(
            action="DATASET_UPLOADED",
            entity="DATASET",
            entity_id=dataset_record.id,
            user="SYSTEM",
            details=json.dumps({"name": name, "features": feature_count, "crs": detected_crs_val})
        ))
        db.commit()

        return {
            "id": dataset_record.id,
            "name": dataset_record.name,
            "dataset_type": dataset_record.dataset_type,
            "crs": detected_crs_val,
            "feature_count": feature_count,
            "status": "NORMALIZED"
        }

    else:
        # CSV ingestion (tabular / GNSS points)
        dataset_record = Dataset(
            id=save_id,
            name=name,
            dataset_type=dataset_type,
            source_agency=source_agency,
            file_format="CSV",
            crs="EPSG:4326",
            status="NORMALIZED",
            file_path=stored_path
        )
        db.add(dataset_record)
        db.commit()

        return {
            "id": dataset_record.id,
            "name": dataset_record.name,
            "dataset_type": dataset_record.dataset_type,
            "crs": "EPSG:4326",
            "feature_count": 0,
            "status": "NORMALIZED"
        }

@router.delete("/{dataset_id}")
def delete_dataset(dataset_id: str, db: Session = Depends(get_db)):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    db.delete(ds)
    db.add(AuditLog(
        action="DATASET_DELETED",
        entity="DATASET",
        entity_id=dataset_id,
        user="SYSTEM",
        details=json.dumps({"name": ds.name})
    ))
    db.commit()
    return {"message": "Dataset successfully deleted", "id": dataset_id}
