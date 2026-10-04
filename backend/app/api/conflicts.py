import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import Conflict, Parcel, Review, AuditLog, HarmonizationResult
from backend.app.schemas.schemas import ConflictOut, ConflictResolveRequest

router = APIRouter(prefix="/conflicts", tags=["Conflicts"])

@router.get("", response_model=List[ConflictOut])
def list_conflicts(
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Conflict).order_by(Conflict.created_at.desc())

    if status:
        query = query.filter(Conflict.status == status)
    if severity:
        query = query.filter(Conflict.severity == severity)
    if type:
        query = query.filter(Conflict.conflict_type == type)

    results = query.all()
    for item in results:
        if item.parcel:
            item.parcel_identifier = item.parcel.parcel_id
        else:
            item.parcel_identifier = item.parcel_id
    return results

@router.get("/{conflict_id}", response_model=ConflictOut)
def get_conflict(conflict_id: str, db: Session = Depends(get_db)):
    c = db.query(Conflict).filter(Conflict.id == conflict_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Conflict not found")
    if c.parcel:
        c.parcel_identifier = c.parcel.parcel_id
    else:
        c.parcel_identifier = c.parcel_id
    return c

@router.post("/{conflict_id}/resolve")
def resolve_conflict(
    conflict_id: str,
    payload: ConflictResolveRequest,
    db: Session = Depends(get_db)
):
    conflict = db.query(Conflict).filter(Conflict.id == conflict_id).first()
    if not conflict:
        raise HTTPException(status_code=404, detail="Conflict not found")

    conflict.status = "RESOLVED"
    conflict.resolution = payload.resolution_notes

    # Create Review Record
    review = Review(
        parcel_id=conflict.parcel_id,
        conflict_id=conflict.id,
        reviewer=payload.reviewer,
        decision=payload.decision.value,
        comment=payload.resolution_notes
    )
    db.add(review)

    # If all conflicts for this parcel are resolved, upgrade harmonization status to HIGH_CONFIDENCE
    remaining_conflicts = db.query(Conflict).filter(
        Conflict.parcel_id == conflict.parcel_id,
        Conflict.id != conflict.id,
        Conflict.status == "OPEN"
    ).count()

    if remaining_conflicts == 0:
        harm = db.query(HarmonizationResult).filter(
            HarmonizationResult.source_parcel_id == conflict.parcel_id
        ).first()
        if harm:
            harm.status = "HIGH_CONFIDENCE"
            harm.explanation += f" [Resolved by {payload.reviewer}: {payload.resolution_notes}]"

    # Insert into Audit Log
    db.add(AuditLog(
        action="CONFLICT_RESOLVED",
        entity="CONFLICT",
        entity_id=conflict.id,
        user=payload.reviewer,
        details=json.dumps({
            "decision": payload.decision.value,
            "resolution": payload.resolution_notes,
            "parcel_id": conflict.parcel_id
        })
    ))
    db.commit()

    return {
        "id": conflict.id,
        "status": conflict.status,
        "resolution": conflict.resolution,
        "decision": payload.decision.value,
        "reviewer": payload.reviewer
    }

@router.post("/{conflict_id}/ai-advise")
def get_ai_advice(conflict_id: str, db: Session = Depends(get_db)):
    from backend.app.ai.advisor import generate_ai_dispute_advice
    conflict = db.query(Conflict).filter(Conflict.id == conflict_id).first()
    if not conflict:
        raise HTTPException(status_code=404, detail="Conflict not found")

    parcel_data = {}
    if conflict.parcel:
        parcel_data = {
            "parcel_id": conflict.parcel.parcel_id,
            "survey_number": conflict.parcel.survey_number,
            "owner_name": conflict.parcel.owner_name,
            "area": conflict.parcel.area
        }

    advice = generate_ai_dispute_advice(
        conflict_type=conflict.conflict_type,
        severity=conflict.severity,
        description=conflict.description,
        difference=conflict.difference,
        source_a=conflict.source_a,
        source_b=conflict.source_b,
        parcel_data=parcel_data
    )
    return advice
