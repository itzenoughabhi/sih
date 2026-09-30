from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum

class DatasetTypeEnum(str, Enum):
    CADASTRAL = "CADASTRAL"
    MUNICIPAL = "MUNICIPAL"
    REVENUE = "REVENUE"
    DRONE_FOOTPRINT = "DRONE_FOOTPRINT"
    GNSS_SURVEY = "GNSS_SURVEY"

class HarmonizationStatusEnum(str, Enum):
    HIGH_CONFIDENCE = "HIGH_CONFIDENCE"
    NEEDS_REVIEW = "NEEDS_REVIEW"
    CONFLICT = "CONFLICT"

class ConflictTypeEnum(str, Enum):
    AREA_MISMATCH = "AREA_MISMATCH"
    OWNER_MISMATCH = "OWNER_MISMATCH"
    GEOMETRY_SHIFT = "GEOMETRY_SHIFT"
    TOPOLOGY_VIOLATION = "TOPOLOGY_VIOLATION"
    MISSING_ATTRIBUTES = "MISSING_ATTRIBUTES"

class ConflictSeverityEnum(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class ConflictStatusEnum(str, Enum):
    OPEN = "OPEN"
    RESOLVED = "RESOLVED"
    REJECTED = "REJECTED"
    FLAGGED_RESURVEY = "FLAGGED_RESURVEY"

class ReviewDecisionEnum(str, Enum):
    APPROVE_RECOMMENDATION = "APPROVE_RECOMMENDATION"
    REJECT_MATCH = "REJECT_MATCH"
    OVERRIDE_GEOMETRY = "OVERRIDE_GEOMETRY"
    FLAG_FIELD_RESURVEY = "FLAG_FIELD_RESURVEY"

# Dataset Schemas
class DatasetOut(BaseModel):
    id: str
    name: str
    dataset_type: str
    source_agency: str
    file_format: str
    crs: str
    feature_count: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Harmonization Schemas
class HarmonizationWeights(BaseModel):
    geometry: float = 0.30
    area: float = 0.20
    location: float = 0.20
    attributes: float = 0.15
    gnss: float = 0.15

class HarmonizationRunRequest(BaseModel):
    cadastral_dataset_id: Optional[str] = None
    municipal_dataset_id: Optional[str] = None
    weights: HarmonizationWeights = Field(default_factory=HarmonizationWeights)
    area_threshold_pct: float = 5.0
    owner_similarity_threshold: float = 0.80

class HarmonizationRunResponse(BaseModel):
    job_id: str
    status: str
    total_processed: int
    high_confidence_matches: int
    review_required: int
    conflicts_detected: int
    topology_issues: int
    duration_seconds: float

# Confidence & Evidence
class ConfidenceBreakdown(BaseModel):
    overall: float
    geometry: float
    area: float
    location: float
    attributes: float
    gnss: float

class ParcelListItem(BaseModel):
    id: str
    parcel_id: str
    survey_number: Optional[str] = None
    owner_name: Optional[str] = None
    area: float
    land_use: str
    ward: Optional[str] = None
    municipality: Optional[str] = None
    confidence: Optional[float] = None
    status: str
    has_conflict: bool

class ParcelListResponse(BaseModel):
    total: int
    page: int
    limit: int
    items: List[ParcelListItem]

class ParcelDetailOut(BaseModel):
    id: str
    parcel_id: str
    survey_number: Optional[str] = None
    owner_name: Optional[str] = None
    area: float
    land_use: str
    ward: Optional[str] = None
    municipality: Optional[str] = None
    sources: Dict[str, Any]
    confidence: ConfidenceBreakdown
    explanation: str
    conflicts: List[Dict[str, Any]]
    reviews: List[Dict[str, Any]]
    geometry: Dict[str, Any]
    unified_geometry: Optional[Dict[str, Any]] = None

# Conflict Schemas
class ConflictOut(BaseModel):
    id: str
    parcel_id: str
    parcel_identifier: Optional[str] = None
    conflict_type: str
    severity: str
    description: str
    source_a: str
    source_b: str
    difference: str
    status: str
    resolution: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ConflictResolveRequest(BaseModel):
    decision: ReviewDecisionEnum
    resolution_notes: str
    reviewer: str

# Review Schemas
class ReviewCreateRequest(BaseModel):
    parcel_id: str
    conflict_id: Optional[str] = None
    reviewer: str
    decision: ReviewDecisionEnum
    comment: str

class ReviewOut(BaseModel):
    id: str
    parcel_id: str
    conflict_id: Optional[str] = None
    reviewer: str
    decision: str
    comment: str
    created_at: datetime

    class Config:
        from_attributes = True

# Dashboard
class DashboardStats(BaseModel):
    datasets_count: int
    parcels_count: int
    high_confidence_count: int
    needs_review_count: int
    conflicts_count: int
    topology_issues_count: int
    conflicts_by_type: Dict[str, int]
    confidence_distribution: List[Dict[str, Any]]

# Demo Data Generator
class DemoGenerateRequest(BaseModel):
    seed: int = 42
    parcel_count: int = 100
    anomaly_rate: float = 0.15

class DemoGenerateResponse(BaseModel):
    message: str
    datasets: List[Dict[str, Any]]
