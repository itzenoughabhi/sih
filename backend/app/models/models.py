import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from backend.app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    dataset_type = Column(String(50), nullable=False)
    source_agency = Column(String(100), nullable=False, default="Urban Local Body")
    file_format = Column(String(20), nullable=False, default="GeoJSON")
    crs = Column(String(50), nullable=False, default="EPSG:4326")
    feature_count = Column(Integer, default=0)
    status = Column(String(30), nullable=False, default="UPLOADED")
    file_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    parcels = relationship("Parcel", back_populates="dataset", cascade="all, delete-orphan")

class Parcel(Base):
    __tablename__ = "parcels"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    dataset_id = Column(String(36), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=True)
    parcel_id = Column(String(100), nullable=False, index=True)
    survey_number = Column(String(100), nullable=True, index=True)
    geometry = Column(Text, nullable=False)  # GeoJSON string
    area = Column(Float, nullable=False, default=0.0)
    owner_name = Column(String(255), nullable=True, index=True)
    land_use = Column(String(100), default="RESIDENTIAL")
    ward = Column(String(50), nullable=True)
    municipality = Column(String(100), nullable=True)
    attributes = Column(Text, default="{}")  # JSON string of raw properties
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    dataset = relationship("Dataset", back_populates="parcels")
    harmonization_results = relationship(
        "HarmonizationResult",
        foreign_keys="HarmonizationResult.source_parcel_id",
        back_populates="source_parcel",
        cascade="all, delete-orphan"
    )
    conflicts = relationship("Conflict", back_populates="parcel", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="parcel", cascade="all, delete-orphan")

class HarmonizationResult(Base):
    __tablename__ = "harmonization_results"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    source_parcel_id = Column(String(36), ForeignKey("parcels.id", ondelete="CASCADE"), nullable=False)
    matched_parcel_id = Column(String(36), nullable=True)
    geometry_score = Column(Float, nullable=False, default=0.0)
    area_score = Column(Float, nullable=False, default=0.0)
    location_score = Column(Float, nullable=False, default=0.0)
    attribute_score = Column(Float, nullable=False, default=0.0)
    gnss_score = Column(Float, nullable=False, default=0.0)
    overall_confidence = Column(Float, nullable=False, default=0.0)
    status = Column(String(30), nullable=False, default="NEEDS_REVIEW")
    explanation = Column(Text, nullable=False, default="")
    unified_geometry = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    source_parcel = relationship("Parcel", foreign_keys=[source_parcel_id], back_populates="harmonization_results")

class Conflict(Base):
    __tablename__ = "conflicts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    parcel_id = Column(String(36), ForeignKey("parcels.id", ondelete="CASCADE"), nullable=False)
    conflict_type = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False, default="MEDIUM")
    description = Column(Text, nullable=False)
    source_a = Column(String(100), nullable=False)
    source_b = Column(String(100), nullable=False)
    difference = Column(Text, nullable=False)
    status = Column(String(30), nullable=False, default="OPEN")
    resolution = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    parcel = relationship("Parcel", back_populates="conflicts")
    reviews = relationship("Review", back_populates="conflict")

class Review(Base):
    __tablename__ = "reviews"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    parcel_id = Column(String(36), ForeignKey("parcels.id", ondelete="CASCADE"), nullable=False)
    conflict_id = Column(String(36), ForeignKey("conflicts.id", ondelete="SET NULL"), nullable=True)
    reviewer = Column(String(100), nullable=False)
    decision = Column(String(50), nullable=False)
    comment = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    parcel = relationship("Parcel", back_populates="reviews")
    conflict = relationship("Conflict", back_populates="reviews")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    action = Column(String(50), nullable=False)
    entity = Column(String(50), nullable=False)
    entity_id = Column(String(36), nullable=False)
    user = Column(String(100), nullable=False, default="SYSTEM")
    details = Column(Text, default="{}")
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
