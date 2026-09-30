import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import Review, Conflict, Parcel, HarmonizationResult, AuditLog
from backend.app.schemas.schemas import ReviewCreateRequest, ReviewOut

router = APIRouter(tags=["Reviews & Audit"])

@router.get("/reviews", response_model=List[ReviewOut])
def list_reviews(db: Session = Depends(get_db)):
    return db.query(Review).order_by(Review.created_at.desc()).all()

@router.post("/reviews", status_code=201, response_model=ReviewOut)
def create_review(payload: ReviewCreateRequest, db: Session = Depends(get_db)):
    parcel = db.query(Parcel).filter(Parcel.id == payload.parcel_id).first()
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")

    review = Review(
        parcel_id=payload.parcel_id,
        conflict_id=payload.conflict_id,
        reviewer=payload.reviewer,
        decision=payload.decision.value,
        comment=payload.comment
    )
    db.add(review)

    # If linked to a conflict, mark conflict resolved
    if payload.conflict_id:
        conflict = db.query(Conflict).filter(Conflict.id == payload.conflict_id).first()
        if conflict:
            conflict.status = "RESOLVED"
            conflict.resolution = f"Reviewed by {payload.reviewer}: {payload.comment}"

    # Update parcel harmonization result status to HIGH_CONFIDENCE on approval
    if payload.decision.value == "APPROVE_RECOMMENDATION":
        harm = db.query(HarmonizationResult).filter(
            HarmonizationResult.source_parcel_id == payload.parcel_id
        ).first()
        if harm:
            harm.status = "HIGH_CONFIDENCE"
            harm.explanation += f" [Approved by {payload.reviewer}]"

    # Add to Audit Log
    db.add(AuditLog(
        action="REVIEW_SUBMITTED",
        entity="PARCEL",
        entity_id=payload.parcel_id,
        user=payload.reviewer,
        details=json.dumps({
            "decision": payload.decision.value,
            "comment": payload.comment,
            "conflict_id": payload.conflict_id
        })
    ))
    db.commit()
    db.refresh(review)
    return review

@router.get("/audit-log")
def get_audit_logs(limit: int = Query(100, ge=1, le=500), db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": log.id,
            "action": log.action,
            "entity": log.entity,
            "entity_id": log.entity_id,
            "user": log.user,
            "details": json.loads(log.details) if log.details else {},
            "timestamp": log.timestamp
        }
        for log in logs
    ]
