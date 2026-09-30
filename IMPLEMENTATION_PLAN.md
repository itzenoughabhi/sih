# BhuSync AI — Phased Implementation Plan

---

## 1. Overview & Strategy

This implementation plan outlines the engineering roadmap for building **BhuSync AI** from zero to a fully functional hackathon prototype. Development proceeds strictly in sequential phases, validating each milestone with unit tests or automated scripts before proceeding to the next.

```text
  Phase 1: Project Documentation (Source of Truth)
     │
  Phase 2: Backend Foundation & Persistence Setup
     │
  Phase 3: Core GIS Engine & Coordinate Normalization
     │
  Phase 4: AI Spatial Matching & Explainable Scoring
     │
  Phase 5: Topology Validation & Conflict Detection Engine
     │
  Phase 6: Realistic Seeded Demo Dataset Generator
     │
  Phase 7: Frontend Architecture & Dashboard
     │
  Phase 8: MapLibre Interactive GIS Workspace
     │
  Phase 9: Parcel Inspector, Conflict Triage & HITL Review
     │
  Phase 10: End-to-End Integration & Unit Testing
     │
  Phase 11: Geospatial UI/UX Polish & Design Tokens
     │
  Phase 12: Containerization & Live Demo Rehearsal
```

---

## 2. Phase-by-Phase Roadmap

### Phase 1: Documentation & Specifications (Current Phase)
- [x] `PRD.md` — Product vision, user journey, acceptance criteria.
- [x] `ARCHITECTURE.md` — High-level diagrams, tech stack, data flows.
- [x] `IMPLEMENTATION_PLAN.md` — Detailed step-by-step roadmap.
- [ ] `DATA_MODEL.md` — Exact database schemas, relationships, Pydantic & PostGIS models.
- [ ] `API_SPEC.md` — OpenAPI REST endpoints, payloads, status codes.
- [ ] `DEMO_SCENARIO.md` — 3-minute judge script with exact parcel IDs and talking points.
- [ ] `README.md` — Quickstart, environment setup, docker instructions.

### Phase 2: Backend Foundation & API Gateway
- Setup Python project structure: `/backend/app/...`
- Initialize FastAPI app with CORS middleware, lifespan events, and error handlers.
- Configure Database connection (PostgreSQL/PostGIS with embedded SQLite/JSON fallback).
- Build Database models: `Dataset`, `Parcel`, `HarmonizationResult`, `Conflict`, `Review`, `AuditLog`.
- Implement basic health check endpoint (`GET /api/health`).
- Implement Dataset Management endpoints (`POST /api/datasets/upload`, `GET /api/datasets`, `GET /api/datasets/{id}`, `DELETE /api/datasets/{id}`).
- *Validation:* Execute curl / pytest verifying file upload and metadata storage.

### Phase 3: Core GIS Engine
- Implement CRS Detection & Transformation module using `pyproj`.
- Standardize all geometries to WGS84 (`EPSG:4326`) for display and UTM 43N/44N (`EPSG:32643`/`32644`) for high-precision metric calculations ($m^2$, meters).
- Implement Geometry Sanitization (`shapely.validation.make_valid`, exterior ring extraction, non-polygon filtering).
- Implement Intelligent Field Mapping dictionary (`OWNER_NAME`, `KATHEDAR`, `PROP_OWNER` → `owner_name`, etc.).
- Implement R-Tree spatial indexing (`shapely.STRtree`) for rapid candidate spatial retrieval.
- *Validation:* Test reprojecting known points and polygon validity repairs with pytest.

### Phase 4: AI Matching & Confidence Scoring
- Implement Candidate Pair Generator (BBox spatial query with 5m buffer expansion).
- Implement Metric Similarity Functions:
  - `Geometry IoU` ($\frac{\text{Area}(A \cap B)}{\text{Area}(A \cup B)}$).
  - `Area Similarity` ($1.0 - \min(1.0, \frac{|\Delta A|}{\max(A_1, A_2)})$).
  - `Centroid Distance Score` ($e^{-d / 10.0}$).
  - `Attribute String Similarity` (RapidFuzz token sort ratio on Owner & Survey No).
  - `GNSS Proximity Score` (Distance from RTK/CORS points to parcel boundary).
- Implement Explainable Multi-Factor Weighted Aggregator:
  - Configurable weights: Geom 30%, Area 20%, Loc 20%, Attr 15%, GNSS 15%.
  - High Confidence ($\ge 90\%$), Review Required ($70-89\%$), Conflict ($< 70\%$).
- Implement Natural Language Explanation Generator with quantitative justifications.
- *Validation:* Test matching on known synthetic pairs with expected confidence scores.

### Phase 5: Conflict Engine & Topology Validation
- Build Topology Validator:
  - Overlapping parcels ($> 5 m^2$).
  - Gaps and slivers.
  - Self-intersections and duplicate geometries.
  - Building footprint spilling outside cadastral boundary.
- Build Conflict Classifier:
  - `AREA_MISMATCH` (variance $> 5\%$).
  - `OWNER_MISMATCH` (RapidFuzz score $< 80\%$).
  - `GEOMETRY_SHIFT` (centroid offset $> 3$ m with IoU $< 0.85$).
  - `TOPOLOGY_VIOLATION` (overlap or invalid polygon).
- Implement Conflict Resolution endpoints (`POST /api/conflicts/{id}/resolve`).
- *Validation:* Feed deliberately distorted polygons and assert correct conflict detection.

### Phase 6: Seeded Demo Dataset Generator
- Create Python demo data generator:
  - 100 Cadastral parcels (`cadastral.geojson`).
  - 100 Municipal property records (`municipal.geojson`).
  - 100 Revenue records (`revenue.csv`).
  - 130 Drone-derived building footprints (`buildings.geojson`).
  - 80 Ground-truth GNSS CORS points (`gnss.csv`).
- Inject controlled, realistic anomalies:
  - 5% area discrepancies.
  - Owner spelling variations (e.g., "Suresh Patel" vs "Suresh R. Patel").
  - 4 shifted parcel boundaries (simulating legacy chain survey distortion).
  - 2 overlapping parcels (boundary dispute).
  - 3 building footprints encroaching setback lines.
- Expose via `POST /api/demo/generate`.
- *Validation:* Verify that the generated demo dataset loads and produces deterministic results.

### Phase 7: Frontend Application Architecture & Dashboard
- Initialize Next.js 14 project in `/frontend` with TypeScript and Tailwind CSS.
- Configure UI layout: Top navigation bar, system status indicator, quick action bar.
- Build Executive Dashboard (`/dashboard`):
  - KPI Stat cards: Datasets, Total Parcels, High Confidence Matches, Needs Review, Conflicts, Topology Issues.
  - Interactive Recharts charts: Confidence Distribution, Conflict by Type, Harmonization Progress.
  - Recent Ingestion table and quick run button.
- Build Dataset Management view (`/datasets` and `/datasets/[id]`).

### Phase 8: Interactive MapLibre GIS Workspace
- Build full-featured GIS Viewer component (`/map`):
  - Layer toggles: Cadastral, Municipal, Drone Buildings, GNSS Points, Harmonized Layer, Conflicts.
  - Dynamic polygon styling: Green (High Confidence), Amber (Needs Review), Red (Conflict).
  - Hover tooltip with Parcel ID, Owner Name, and Status.
  - Click-to-inspect opening a side inspection panel.
  - Measure tool and base map selector (Satellite / Vector Carto / Dark).

### Phase 9: Parcel Detail Page & Conflict Review Center
- Build Parcel Detail view (`/parcels/[id]`):
  - Multi-source evidence comparison table (Cadastral vs Municipal vs Revenue vs Drone).
  - Explainable Confidence breakdown with progress bars.
  - Natural language reasoning card.
  - Quick action buttons: `Approve`, `Flag for Resurvey`, `Override Boundary`.
- Build Conflict Triage Center (`/conflicts`):
  - Filterable conflict table (Severity, Type, Status).
  - Side-by-side diff viewer.
  - Resolution modal with reviewer remarks and audit logging.
- Build Audit Log viewer (`/audit-log`):
  - Searchable timeline of all officer actions and system events.

### Phase 10: Automated Testing & Validation
- Backend tests:
  - `tests/test_gis.py`: CRS transforms, area calculations, topology.
  - `tests/test_matching.py`: Candidate generation, scoring, explainability.
  - `tests/test_conflicts.py`: Area, owner, and geometry conflict detection.
  - `tests/test_api.py`: Upload, harmonization run, conflict resolution, dashboard stats.
- Frontend build check: `npm run build` with zero TypeScript errors.

### Phase 11: Geospatial UI/UX Polish
- Refine color palette to professional government GIS aesthetic (Deep Navy, Slate Gray, Emerald Green, Amber, Crimson).
- Eliminate any garish animations or generic consumer AI styling.
- Ensure high information density, clear tabular alignments, and responsive layout.

### Phase 12: Containerization & Live Demo Rehearsal
- Create multi-stage `Dockerfile` for backend and frontend.
- Create `docker-compose.yml` linking frontend, backend, and PostgreSQL/PostGIS.
- Provide zero-dependency direct launch scripts for instant local evaluation (`run_backend.bat`, `run_frontend.bat`).
- Validate end-to-end 3-minute demo flow against `DEMO_SCENARIO.md`.

---

## 3. Milestones & Checkpoints

| Milestone | Deliverables | Verification Criteria |
|---|---|---|
| **M1: Source of Truth** | All 7 Markdown docs created and aligned | Complete documentation approved |
| **M2: Backend & GIS Engine** | FastAPI, GIS modules, Spatial matching | Pytest passes with $> 85\%$ coverage |
| **M3: Demo Generator** | Deterministic synthetic dataset generator | Demo datasets generated with seeded conflicts |
| **M4: Frontend Map & Dashboard** | Next.js App, MapLibre layer viewer, Recharts | Interactive map renders all layers with selection |
| **M5: Conflict & Review Flow** | HITL triage, parcel detail, audit log | Full resolution lifecycle functions end-to-end |
| **M6: Final Polish & Packaging** | Docker compose, quickstart scripts, demo verified | 3-minute demo runs flawlessly |
