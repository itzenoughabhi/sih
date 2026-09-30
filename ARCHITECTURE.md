# BhuSync AI — System Architecture & Technical Design

---

## 1. System Overview & Architectural Diagram

BhuSync AI employs a decoupled, modular service-oriented architecture designed for deterministic spatial processing, high-density geospatial visualization, and explainable decision support.

```text
                            ┌─────────────────────────────────────────┐
                            │               CLIENT TIER               │
                            │      Next.js 14+ (App Router) + TS      │
                            │  Tailwind CSS · MapLibre GL · Recharts  │
                            └───────────────────┬─────────────────────┘
                                                │ HTTPS / REST JSON
                                                ▼
                            ┌─────────────────────────────────────────┐
                            │               API GATEWAY               │
                            │            FastAPI (Python 3.11+)       │
                            │   Pydantic v2 · CORS · OpenTelemetry    │
                            └─────────┬───────────────────┬───────────┘
                                      │                   │
                ┌─────────────────────┴───────┐           │
                ▼                             ▼           ▼
┌───────────────────────────────┐ ┌─────────────────────────────┐ ┌───────────────────────────────┐
│        DATASET SERVICE        │ │        GIS CORE ENGINE      │ │       AI MATCHING ENGINE      │
│  · File Ingestion & Parsing   │ │  · CRS Reprojection (PyProj)│ │  · R-Tree Spatial Querying    │
│  · GeoJSON / Shape / CSV      │ │  · Geometry Repair (Shapely)│ │  · IoU / Hausdorff Distance   │
│  · Schema Canonicalization    │ │  · Metric Area Calculation  │ │  · RapidFuzz String Similarity│
│  · Validation & Sanitization  │ │  · Topology Validation      │ │  · Multi-Factor Confidence    │
└───────────────┬───────────────┘ └─────────────┬───────────────┘ └───────────────┬───────────────┘
                │                               │                                 │
                └───────────────────────┬───────┴─────────────────────────────────┘
                                        ▼
                        ┌───────────────────────────────┐
                        │        CONFLICT ENGINE        │
                        │  · Area Discrepancy Filter    │
                        │  · Boundary Drift Detector    │
                        │  · Building Overlap Checker   │
                        │  · Human Review Orchestrator  │
                        └───────────────┬───────────────┘
                                        ▼
                        ┌───────────────────────────────┐
                        │        PERSISTENCE TIER       │
                        │    PostgreSQL 16 + PostGIS    │
                        │ (SQLite+GeoJSON Fallback Mode)│
                        │    Audit Log & Property DB    │
                        └───────────────────────────────┘
```

---

## 2. Component Breakdown

### 2.1 Frontend Tier (`/frontend`)
- **Framework:** Next.js 14 (React 18/19, App Router, TypeScript).
- **Styling:** Tailwind CSS with custom geospatial design tokens: restrained slate/navy palettes, clean typography (Inter / Outfit), high-density data tables, accessible status badges.
- **Mapping:** MapLibre GL JS providing hardware-accelerated 60fps vector tile/GeoJSON rendering with dual-source raster/vector overlays, interactive polygon picking, and dynamic styling based on confidence status.
- **Analytics & Graphs:** Recharts for confidence score distribution, conflict breakdowns, and progress tracking.
- **Icons:** Lucide React for consistent, crisp government portal iconography.

### 2.2 Backend API Tier (`/backend`)
- **Runtime:** Python 3.11+ powered by FastAPI and Uvicorn.
- **Validation:** Pydantic v2 providing strict request/response data contracts and serialization.
- **Asynchronous Processing:** Long-running dataset ingestion and spatial matching tasks run asynchronously or via deterministic batch workers with task progress tracking.
- **Security:** Standard CORS filtering, payload size constraints, strict path traversal guards for file storage, and audit logging interceptors.

### 2.3 GIS Core Engine (`/backend/app/gis`)
- **Shapely 2.0+:** Vector geometry operations (intersections, unions, convex hulls, exterior rings, sliver/gap computation, buffering, validity fixing via `make_valid`).
- **PyProj:** Coordinate reference system identification, transformation grids, and metric reprojection (e.g., EPSG:4326 to UTM Zone 43N/44N EPSG:32643/32644 for sub-meter accurate area and distance metrics).
- **GeoPandas:** Fast dataframe-based vectorized spatial joins and bulk format transformations.

### 2.4 AI Matching & Confidence Engine (`/backend/app/matching`)
- **Spatial Indexing:** `rtree` / `shapely.STRtree` for candidate pair pruning. Instead of comparing $N \times M$ pairs ($100 \times 100 = 10,000$ computations), the spatial index reduces candidates to overlapping bounding boxes ($O(N \log M)$).
- **Composite Scoring Formulation:**
  $$\text{Confidence} = w_g \cdot S_{\text{geom}} + w_a \cdot S_{\text{area}} + w_l \cdot S_{\text{loc}} + w_n \cdot S_{\text{attr}} + w_p \cdot S_{\text{gnss}}$$
  *Defaults:* $w_g = 0.30$, $w_a = 0.20$, $w_l = 0.20$, $w_n = 0.15$, $w_p = 0.15$.
- **Linguistic Matching:** RapidFuzz token sort ratio, partial ratio, and normalized edit distance for names and addresses.
- **Ground Truth Proximity:** GNSS RTK/CORS point-in-polygon verification and distance-to-edge calculation.

### 2.5 Conflict & Topology Engine (`/backend/app/conflicts`)
- **Topology Defect Detectors:**
  1. *Self-intersection & Non-closed Rings:* Detected via `shapely.is_valid`.
  2. *Duplicate Geometries:* Hausdorff distance $\le 0.05$ m and IoU $\ge 0.99$.
  3. *Overlap with Neighboring Parcels:* Intersecting polygons with area $> 5 \text{ m}^2$.
  4. *Encroachments:* Building footprint centroid outside any cadastral parcel or spanning multiple legal boundaries.
- **Conflict Thresholds:**
  - Area Variance: $> 5\%$ triggers Warning; $> 15\%$ triggers High Severity Conflict.
  - Centroid Drift: $> 3.0$ meters triggers Warning; $> 7.0$ meters triggers Geometry Shift Conflict.
  - Owner Name Similarity: $< 80\%$ triggers Mismatch Conflict.

### 2.6 Persistence Layer
- **Primary Database:** PostgreSQL 16 with PostGIS extension enabled (`geometry(MultiPolygon, 4326)`).
- **Fallback / Standalone Mode:** Embedded SQLite with SpatiaLite / JSON geometry storage for instant zero-dependency execution during hackathon evaluations.
- **File Ingestion Storage:** Local storage staging directory (`/data/uploads` and `/data/demo`).

---

## 3. Data Flow & Execution Sequence

```text
User Action            FastAPI Gateway           GIS / AI Engine           Storage / PostGIS
    │                         │                         │                          │
    ├── Upload GeoJSON/CSV ──►│                         │                          │
    │                         ├── Parse & Validate ────►│                          │
    │                         │                         ├── CRS Transform ────────►│ Persist Dataset
    │                         │◄── Dataset ID & Status ─┤                          │
    │                         │                         │                          │
    ├── Run Harmonization ───►│                         │                          │
    │                         ├── Trigger Matching ────►│                          │
    │                         │                         ├── Query STRtree Candidates
    │                         │                         ├── Compute IoU, Area, Loc
    │                         │                         ├── Run RapidFuzz on Names
    │                         │                         ├── Check GNSS Proximity
    │                         │                         ├── Derive XAI Explanation
    │                         │                         ├── Detect Conflicts & Topology
    │                         │                         ├── Classify Confidence (H/M/L)
    │                         │◄── Match & Conflict JSON┤                          │
    │                         │                         ├─────────────────────────►│ Persist Results
    │◄── Harmonization Done ──┤                         │                          │
    │                         │                         │                          │
    ├── View Map & Details ──►│◄── Fetch GeoJSON Layers ───────────────────────────┤
    │                         │                         │                          │
    ├── Submit Review Action ─►│                         │                          │
    │   (Approve / Override)  ├── Update Record Status ─┼─────────────────────────►│ Update Status
    │                         │                         ├─────────────────────────►│ Insert AuditLog
    │◄── Status Confirmed ────┤                         │                          │
```

---

## 4. Security & Robustness Considerations

1. **Input Validation:** Strict file type validation (GeoJSON, JSON, CSV). Size capped at 25MB per upload for prototype safety.
2. **Path Sanitization:** File uploads saved to hashed UUID paths, preventing directory traversal.
3. **Graceful Degradation:** If GNSS dataset is missing, the confidence model automatically renormalizes weights among available evidence components:
   $$w'_i = \frac{w_i}{\sum_{k \in \text{Available}} w_k}$$
4. **Coordinate Bounds Enclosure:** Validates that coordinates fall within realistic global/national latitude/longitude boundaries (lat $-90$ to $90$, lon $-180$ to $180$).
5. **No Secrets in Client:** Environment variables decoupled between server (`DATABASE_URL`, `SECRET_KEY`) and public client (`NEXT_PUBLIC_API_URL`).

---

## 5. Technology Stack Matrix

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend Framework** | Next.js | 14.2+ | React server/client components, routing |
| **Language** | TypeScript | 5.3+ | Type safety across GIS schemas |
| **UI Components** | Tailwind CSS + Lucide | 3.4+ / 0.350+ | Geospatial control aesthetics |
| **GIS Map Rendering** | MapLibre GL JS | 4.1+ | Hardware accelerated vector tiles & GeoJSON |
| **Charts** | Recharts | 2.12+ | Confidence & conflict breakdown charts |
| **Backend Framework** | FastAPI | 0.110+ | High-performance async REST API |
| **GIS & Geometry** | Shapely / PyProj | 2.0+ / 3.6+ | Vector geometry, topology, projections |
| **Spatial Joins** | GeoPandas | 0.14+ | Vector manipulation & file I/O |
| **Fuzzy Matching** | RapidFuzz | 3.6+ | Fast C++ optimized string distance |
| **Database** | PostgreSQL + PostGIS | 16 / 3.4 | Authoritative spatial DB (with SQLite fallback) |
| **Containerization** | Docker + Docker Compose | 24+ | Single-command reproducible evaluation |
