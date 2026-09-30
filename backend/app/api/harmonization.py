import time
import json
import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import Dataset, Parcel, HarmonizationResult, Conflict, AuditLog
from backend.app.schemas.schemas import HarmonizationRunRequest, HarmonizationRunResponse
from backend.app.matching.index import SpatialIndexMatcher
from backend.app.matching.similarity import compute_pairwise_similarity
from backend.app.matching.confidence import calculate_overall_confidence
from backend.app.matching.explain import generate_explainable_rationale
from backend.app.conflicts.detector import detect_parcel_conflicts
from backend.app.gis.topology import detect_overlapping_parcels, detect_duplicate_geometries

router = APIRouter(prefix="/harmonization", tags=["Harmonization"])

@router.post("/run", response_model=HarmonizationRunResponse)
def run_harmonization(request: HarmonizationRunRequest = None, db: Session = Depends(get_db)):
    start_time = time.time()
    req = request or HarmonizationRunRequest()

    # Find Cadastral (primary) dataset
    cadastral_query = db.query(Dataset).filter(Dataset.dataset_type == "CADASTRAL")
    if req.cadastral_dataset_id:
        cadastral_ds = cadastral_query.filter(Dataset.id == req.cadastral_dataset_id).first()
    else:
        cadastral_ds = cadastral_query.first()

    if not cadastral_ds:
        raise HTTPException(
            status_code=400,
            detail="No Cadastral dataset found. Please upload or generate demo datasets first."
        )

    # Find Municipal (target) dataset
    municipal_query = db.query(Dataset).filter(Dataset.dataset_type == "MUNICIPAL")
    if req.municipal_dataset_id:
        municipal_ds = municipal_query.filter(Dataset.id == req.municipal_dataset_id).first()
    else:
        municipal_ds = municipal_query.first()

    # Fetch GNSS survey points if available
    gnss_ds = db.query(Dataset).filter(Dataset.dataset_type == "GNSS_SURVEY").first()
    gnss_points = []
    if gnss_ds:
        # Parcels under GNSS dataset store point geometries
        g_records = db.query(Parcel).filter(Parcel.dataset_id == gnss_ds.id).all()
        gnss_points = [{"geometry": json.loads(g.geometry), "parcel_id": g.parcel_id} for g in g_records]

    # Clear prior results and conflicts
    db.query(HarmonizationResult).delete()
    db.query(Conflict).delete()
    db.commit()

    cad_parcels = db.query(Parcel).filter(Parcel.dataset_id == cadastral_ds.id).all()
    mun_parcels = db.query(Parcel).filter(Parcel.dataset_id == municipal_ds.id).all() if municipal_ds else []

    # Prepare candidate parcel dictionaries
    mun_list = []
    for m in mun_parcels:
        try:
            geom = json.loads(m.geometry)
            mun_list.append({
                "id": m.id,
                "parcel_id": m.parcel_id,
                "survey_number": m.survey_number,
                "owner_name": m.owner_name,
                "area": m.area,
                "geometry": geom
            })
        except Exception:
            continue

    # Initialize R-Tree spatial index
    spatial_matcher = SpatialIndexMatcher(mun_list)

    total_processed = 0
    high_conf = 0
    needs_rev = 0
    conflict_count = 0
    topology_count = 0

    # Check topology within Cadastral layer itself (overlaps & duplicates)
    cad_dicts = []
    for c in cad_parcels:
        try:
            cad_dicts.append({
                "id": c.id,
                "parcel_id": c.parcel_id,
                "geometry": json.loads(c.geometry)
            })
        except Exception:
            pass

    overlaps = detect_overlapping_parcels(cad_dicts, threshold_m2=5.0)
    duplicates = detect_duplicate_geometries(cad_dicts, iou_threshold=0.98)
    topology_issues = overlaps + duplicates
    topology_count = len(topology_issues)

    for top in topology_issues:
        matched_c = next((c for c in cad_parcels if c.parcel_id == top.get("parcel_a")), None)
        if matched_c:
            db.add(Conflict(
                parcel_id=matched_c.id,
                conflict_type="TOPOLOGY_VIOLATION",
                severity=top["severity"],
                description=top["description"],
                source_a=f"Cadastral {top.get('parcel_a')}",
                source_b=f"Cadastral {top.get('parcel_b')}",
                difference=f"Overlap / Duplication: {top.get('suggested_correction')}",
                status="OPEN"
            ))

    # Perform parcel-by-parcel spatial matching
    for cad in cad_parcels:
        total_processed += 1
        cad_geom = json.loads(cad.geometry)
        cad_data = {
            "id": cad.id,
            "parcel_id": cad.parcel_id,
            "survey_number": cad.survey_number,
            "owner_name": cad.owner_name,
            "area": cad.area,
            "geometry": cad_geom
        }

        # Query candidates from R-Tree
        candidates = spatial_matcher.query_candidates(cad_geom, buffer_deg=0.00015)

        best_cand = None
        best_metrics = None
        best_score = -1.0

        if candidates:
            # Score each candidate
            for cand in candidates:
                metrics = compute_pairwise_similarity(cad_data, cand, gnss_points)
                score, _ = calculate_overall_confidence(metrics, req.weights)
                if score > best_score:
                    best_score = score
                    best_cand = cand
                    best_metrics = metrics

        if not best_cand or not best_metrics:
            # No candidate found in spatial vicinity
            best_metrics = {
                "geometry_score": 0.0,
                "area_score": 0.0,
                "location_score": 0.0,
                "attribute_score": 0.0,
                "gnss_score": 0.5,
                "centroid_distance_m": 99.0
            }
            best_score = 0.25
            status_val = "CONFLICT"
            explanation_val = f"No spatial matching candidate found within buffer for parcel {cad.parcel_id}."
        else:
            best_score, status_val = calculate_overall_confidence(best_metrics, req.weights)
            explanation_val = generate_explainable_rationale(best_metrics, cad_data, best_cand)

        # Detect conflicts
        conflicts = detect_parcel_conflicts(
            cad_data,
            best_cand,
            best_metrics,
            area_threshold_pct=req.area_threshold_pct,
            owner_similarity_threshold=req.owner_similarity_threshold
        )

        if conflicts:
            conflict_count += len(conflicts)
            if status_val == "HIGH_CONFIDENCE":
                status_val = "NEEDS_REVIEW"

        for conf in conflicts:
            db.add(Conflict(
                parcel_id=cad.id,
                conflict_type=conf["conflict_type"],
                severity=conf["severity"],
                description=conf["description"],
                source_a=conf["source_a"],
                source_b=conf["source_b"],
                difference=conf["difference"],
                status="OPEN"
            ))

        # Record counts
        if status_val == "HIGH_CONFIDENCE":
            high_conf += 1
        elif status_val == "NEEDS_REVIEW":
            needs_rev += 1
        else:
            conflict_count += 1

        # Harmonization result record
        harm_result = HarmonizationResult(
            source_parcel_id=cad.id,
            matched_parcel_id=best_cand["id"] if best_cand else None,
            geometry_score=best_metrics["geometry_score"],
            area_score=best_metrics["area_score"],
            location_score=best_metrics["location_score"],
            attribute_score=best_metrics["attribute_score"],
            gnss_score=best_metrics["gnss_score"],
            overall_confidence=best_score,
            status=status_val,
            explanation=explanation_val,
            unified_geometry=cad.geometry
        )
        db.add(harm_result)

    # Record Audit Log
    db.add(AuditLog(
        action="HARMONIZATION_EXECUTED",
        entity="SYSTEM",
        entity_id=cadastral_ds.id,
        user="SYSTEM",
        details=json.dumps({
            "total_processed": total_processed,
            "high_confidence": high_conf,
            "needs_review": needs_rev,
            "conflicts": conflict_count
        })
    ))
    db.commit()

    duration = round(time.time() - start_time, 2)
    job_id = f"harm-{uuid.uuid4().hex[:8]}"

    return {
        "job_id": job_id,
        "status": "COMPLETED",
        "total_processed": total_processed,
        "high_confidence_matches": high_conf,
        "review_required": needs_rev,
        "conflicts_detected": conflict_count,
        "topology_issues": topology_count,
        "duration_seconds": duration
    }

@router.get("/{id}")
def get_harmonization_job(id: str, db: Session = Depends(get_db)):
    results = db.query(HarmonizationResult).all()
    high = sum(1 for r in results if r.status == "HIGH_CONFIDENCE")
    review = sum(1 for r in results if r.status == "NEEDS_REVIEW")
    conflict = sum(1 for r in results if r.status == "CONFLICT")

    return {
        "id": id,
        "status": "COMPLETED",
        "total": len(results),
        "high_confidence_matches": high,
        "needs_review": review,
        "conflicts": conflict
    }
