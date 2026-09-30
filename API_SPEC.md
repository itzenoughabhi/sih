# BhuSync AI — REST API Specification

---

## 1. Global Conventions

- **Base URL:** `http://localhost:8000/api`
- **Content-Type:** `application/json` (except file uploads which use `multipart/form-data`)
- **Status Codes:**
  - `200 OK`: Successful retrieval or synchronous operation
  - `201 Created`: Entity created successfully
  - `400 Bad Request`: Validation failure or malformed payload
  - `404 Not Found`: Target resource does not exist
  - `422 Unprocessable Entity`: Schema validation failure
  - `500 Internal Server Error`: Server-side unhandled exception

---

## 2. API Endpoints

### 2.1 System Health
#### `GET /api/health`
Check service health and database connectivity.
- **Response (200 OK):**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "database": "connected",
  "crs_engine": "pyproj 3.6.1",
  "shapely_geos": "GEOS 3.12.0"
}
```

---

### 2.2 Dataset Management

#### `POST /api/datasets/upload`
Upload a GeoJSON or CSV dataset.
- **Content-Type:** `multipart/form-data`
- **Form Parameters:**
  - `file`: File upload (`.geojson`, `.json`, `.csv`)
  - `name`: String (e.g., "Ward 12 Cadastral Survey")
  - `dataset_type`: Enum (`CADASTRAL`, `MUNICIPAL`, `REVENUE`, `DRONE_FOOTPRINT`, `GNSS_SURVEY`)
  - `source_agency`: String (e.g., "Directorate of Land Records")
  - `target_crs`: Optional string (default: `"EPSG:4326"`)
- **Response (201 Created):**
```json
{
  "id": "d98f7e2a-1b4c-4e8a-9f12-0987654321ab",
  "name": "Ward 12 Cadastral Survey",
  "dataset_type": "CADASTRAL",
  "source_agency": "Directorate of Land Records",
  "file_format": "GeoJSON",
  "crs": "EPSG:4326",
  "feature_count": 100,
  "status": "NORMALIZED",
  "created_at": "2026-09-30T08:00:00Z"
}
```

#### `GET /api/datasets`
List all ingested datasets.
- **Response (200 OK):**
```json
[
  {
    "id": "d98f7e2a-1b4c-4e8a-9f12-0987654321ab",
    "name": "Ward 12 Cadastral Survey",
    "dataset_type": "CADASTRAL",
    "feature_count": 100,
    "status": "NORMALIZED",
    "created_at": "2026-09-30T08:00:00Z"
  }
]
```

#### `GET /api/datasets/{id}`
Retrieve dataset metadata and feature sample.
- **Response (200 OK):**
```json
{
  "id": "d98f7e2a-1b4c-4e8a-9f12-0987654321ab",
  "name": "Ward 12 Cadastral Survey",
  "dataset_type": "CADASTRAL",
  "feature_count": 100,
  "fields": ["parcel_id", "survey_number", "owner_name", "area", "land_use"],
  "status": "NORMALIZED"
}
```

#### `DELETE /api/datasets/{id}`
Delete a dataset and its cascading features.
- **Response (200 OK):**
```json
{ "message": "Dataset successfully deleted", "id": "d98f7e2a-1b4c-4e8a-9f12-0987654321ab" }
```

---

### 2.3 Harmonization & Matching

#### `POST /api/harmonization/run`
Execute the AI/Spatial matching pipeline across ingested datasets.
- **Request Body (JSON):**
```json
{
  "cadastral_dataset_id": "d98f7e2a-1b4c-4e8a-9f12-0987654321ab",
  "municipal_dataset_id": "e12a4b5c-6d7e-8f90-1234-567890abcdef",
  "weights": {
    "geometry": 0.30,
    "area": 0.20,
    "location": 0.20,
    "attributes": 0.15,
    "gnss": 0.15
  },
  "area_threshold_pct": 5.0,
  "owner_similarity_threshold": 0.80
}
```
- **Response (200 OK):**
```json
{
  "job_id": "harm-job-7712",
  "status": "COMPLETED",
  "total_processed": 100,
  "high_confidence_matches": 82,
  "review_required": 13,
  "conflicts_detected": 5,
  "topology_issues": 7,
  "duration_seconds": 1.42
}
```

#### `GET /api/harmonization/{id}`
Fetch harmonization job details or result summary.
- **Response (200 OK):**
```json
{
  "id": "harm-job-7712",
  "status": "COMPLETED",
  "high_confidence_matches": 82,
  "needs_review": 13,
  "conflicts": 5
}
```

---

### 2.4 Parcels

#### `GET /api/parcels`
List parcels with optional filtering by status, search keyword, and pagination.
- **Query Parameters:**
  - `status`: Optional (`HIGH_CONFIDENCE`, `NEEDS_REVIEW`, `CONFLICT`)
  - `search`: Optional string (search in `parcel_id`, `owner_name`, `survey_number`)
  - `page`: Integer (default: 1)
  - `limit`: Integer (default: 50)
- **Response (200 OK):**
```json
{
  "total": 100,
  "page": 1,
  "limit": 50,
  "items": [
    {
      "id": "p-001",
      "parcel_id": "CAD-001",
      "survey_number": "SY-104/1",
      "owner_name": "Ramesh Kumar Sharma",
      "area": 845.2,
      "land_use": "RESIDENTIAL",
      "ward": "Ward 14",
      "municipality": "Bengaluru Urban",
      "confidence": 0.94,
      "status": "HIGH_CONFIDENCE",
      "has_conflict": false
    }
  ]
}
```

#### `GET /api/parcels/{id}`
Get full detail for a parcel including evidence from multiple datasets, sub-scores, conflicts, and reviews.
- **Response (200 OK):**
```json
{
  "id": "p-001",
  "parcel_id": "CAD-001",
  "survey_number": "SY-104/1",
  "owner_name": "Ramesh Kumar Sharma",
  "area": 845.2,
  "land_use": "RESIDENTIAL",
  "ward": "Ward 14",
  "municipality": "Bengaluru Urban",
  "sources": {
    "cadastral": { "id": "CAD-001", "area": 845.2, "owner": "Ramesh Kumar Sharma" },
    "municipal": { "id": "MUN-001", "area": 838.0, "owner": "Ramesh K. Sharma" },
    "revenue": { "survey_no": "SY-104/1", "khata": "KH-8921", "owner": "Ramesh Kumar Sharma" },
    "drone": { "building_count": 1, "footprint_area": 320.5 },
    "gnss": { "point_id": "GNSS-101", "offset_meters": 0.35 }
  },
  "confidence": {
    "overall": 0.94,
    "geometry": 0.96,
    "area": 0.92,
    "location": 0.98,
    "attributes": 0.89,
    "gnss": 0.95
  },
  "explanation": "Parcel boundaries and GNSS survey points show strong spatial concordance (0.35m offset). Owner names 'Ramesh Kumar Sharma' and 'Ramesh K. Sharma' share 89% linguistic token similarity. Area variance of 0.85% is well within photogrammetric survey tolerance.",
  "conflicts": [],
  "review_status": "APPROVED",
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[77.5945, 12.9716], [77.5955, 12.9716], [77.5955, 12.9725], [77.5945, 12.9725], [77.5945, 12.9716]]]
  }
}
```

---

### 2.5 Conflict Management

#### `GET /api/conflicts`
List all detected conflicts.
- **Query Parameters:**
  - `status`: Optional (`OPEN`, `RESOLVED`, `REJECTED`, `FLAGGED_RESURVEY`)
  - `severity`: Optional (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
  - `type`: Optional (`AREA_MISMATCH`, `OWNER_MISMATCH`, `GEOMETRY_SHIFT`, `TOPOLOGY_VIOLATION`, `MISSING_ATTRIBUTES`)
- **Response (200 OK):**
```json
[
  {
    "id": "conf-004",
    "parcel_id": "p-004",
    "conflict_type": "AREA_MISMATCH",
    "severity": "HIGH",
    "description": "Area discrepancy exceeds 5% threshold between Cadastral and Municipal registers.",
    "source_a": "Cadastral Survey (850 m²)",
    "source_b": "Municipal Property Tax (742 m²)",
    "difference": "108 m² (12.7% deviation)",
    "status": "OPEN",
    "resolution": null,
    "created_at": "2026-09-30T08:05:00Z"
  }
]
```

#### `POST /api/conflicts/{id}/resolve`
Resolve or update a conflict decision.
- **Request Body (JSON):**
```json
{
  "decision": "APPROVE_RECOMMENDATION",
  "resolution_notes": "Ground drone verification confirms 848 m² actual ground footprint. Cadastral record accepted; municipal tax assessment flagged for revision.",
  "reviewer": "officer_sharma"
}
```
- **Response (200 OK):**
```json
{
  "id": "conf-004",
  "status": "RESOLVED",
  "resolution": "Ground drone verification confirms 848 m² actual ground footprint. Cadastral record accepted; municipal tax assessment flagged for revision.",
  "updated_at": "2026-09-30T08:15:00Z"
}
```

---

### 2.6 Human-in-the-Loop Reviews

#### `POST /api/reviews`
Submit an officer review and decision for a parcel.
- **Request Body (JSON):**
```json
{
  "parcel_id": "p-004",
  "conflict_id": "conf-004",
  "reviewer": "officer_sharma",
  "decision": "APPROVE_RECOMMENDATION",
  "comment": "Cadastral boundary upheld after drone overlay verification."
}
```
- **Response (201 Created):**
```json
{
  "id": "rev-9921",
  "parcel_id": "p-004",
  "reviewer": "officer_sharma",
  "decision": "APPROVE_RECOMMENDATION",
  "created_at": "2026-09-30T08:15:00Z"
}
```

#### `GET /api/reviews`
List all submitted reviews with officer comments.

---

### 2.7 Dashboard & Map Feeds

#### `GET /api/dashboard/stats`
Get aggregated statistics computed from live backend database records.
- **Response (200 OK):**
```json
{
  "datasets_count": 5,
  "parcels_count": 100,
  "high_confidence_count": 82,
  "needs_review_count": 13,
  "conflicts_count": 5,
  "topology_issues_count": 7,
  "conflicts_by_type": {
    "AREA_MISMATCH": 2,
    "OWNER_MISMATCH": 1,
    "GEOMETRY_SHIFT": 1,
    "TOPOLOGY_VIOLATION": 1
  },
  "confidence_distribution": [
    { "bracket": "90-100% (High)", "count": 82 },
    { "bracket": "70-89% (Review)", "count": 13 },
    { "bracket": "<70% (Conflict)", "count": 5 }
  ]
}
```

#### `GET /api/map/parcels`
Return GeoJSON FeatureCollection of all parcels with confidence status, area, owner, and conflict flags embedded in properties for MapLibre rendering.
- **Response (200 OK):** GeoJSON `FeatureCollection`

#### `GET /api/map/conflicts`
Return GeoJSON FeatureCollection highlighting conflict geometries (overlaps, shifted boundaries, building footprint violations).
- **Response (200 OK):** GeoJSON `FeatureCollection`

---

### 2.8 Demo Dataset Generator

#### `POST /api/demo/generate`
Generate synthetic benchmark dataset (100 Cadastral, 100 Municipal, 100 Revenue, 130 Drone Footprints, 80 GNSS points) with reproducible seeded anomalies.
- **Request Body (JSON):**
```json
{
  "seed": 42,
  "parcel_count": 100,
  "anomaly_rate": 0.15
}
```
- **Response (201 Created):**
```json
{
  "message": "Demo datasets successfully generated and ingested",
  "datasets": [
    { "name": "Demo Cadastral Layer", "count": 100 },
    { "name": "Demo Municipal Layer", "count": 100 },
    { "name": "Demo Revenue Registry", "count": 100 },
    { "name": "Demo Drone Footprints", "count": 130 },
    { "name": "Demo GNSS Survey Control", "count": 80 }
  ]
}
```
