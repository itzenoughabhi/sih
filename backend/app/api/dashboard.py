from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import Dataset, Parcel, HarmonizationResult, Conflict
from backend.app.schemas.schemas import DashboardStats

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    datasets_count = db.query(Dataset).count()
    
    # Cadastral primary parcels
    cad_ds = db.query(Dataset).filter(Dataset.dataset_type == "CADASTRAL").first()
    if cad_ds:
        parcels_count = db.query(Parcel).filter(Parcel.dataset_id == cad_ds.id).count()
    else:
        parcels_count = db.query(Parcel).count()

    # Results
    results = db.query(HarmonizationResult).all()
    high_conf = sum(1 for r in results if r.status == "HIGH_CONFIDENCE")
    needs_rev = sum(1 for r in results if r.status == "NEEDS_REVIEW")
    conflicts_harm = sum(1 for r in results if r.status == "CONFLICT")

    # Distinct open conflicts
    open_conflicts = db.query(Conflict).filter(Conflict.status == "OPEN").all()
    conflicts_count = len(open_conflicts) if open_conflicts else conflicts_harm

    # Count topology issues specifically
    topology_count = sum(1 for c in open_conflicts if c.conflict_type == "TOPOLOGY_VIOLATION")

    # Group conflicts by type
    conflicts_by_type = {}
    for c in open_conflicts:
        conflicts_by_type[c.conflict_type] = conflicts_by_type.get(c.conflict_type, 0) + 1

    if not conflicts_by_type:
        conflicts_by_type = {
            "AREA_MISMATCH": 0,
            "OWNER_MISMATCH": 0,
            "GEOMETRY_SHIFT": 0,
            "TOPOLOGY_VIOLATION": 0,
            "MISSING_ATTRIBUTES": 0
        }

    # Confidence distribution histogram buckets
    b_90_100 = high_conf
    b_70_89 = needs_rev
    b_under_70 = conflicts_harm

    # If results not yet computed, provide initial default representation
    if not results and parcels_count > 0:
        b_70_89 = parcels_count
        needs_rev = parcels_count

    confidence_distribution = [
        {"bracket": "90–100% (High Confidence)", "count": b_90_100, "color": "#10B981"},
        {"bracket": "70–89% (Needs Review)", "count": b_70_89, "color": "#F59E0B"},
        {"bracket": "<70% (Conflict / Risk)", "count": b_under_70, "color": "#EF4444"}
    ]

    return DashboardStats(
        datasets_count=datasets_count,
        parcels_count=parcels_count,
        high_confidence_count=high_conf,
        needs_review_count=needs_rev,
        conflicts_count=conflicts_count,
        topology_issues_count=topology_count,
        conflicts_by_type=conflicts_by_type,
        confidence_distribution=confidence_distribution
    )
