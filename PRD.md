# BhuSync AI — Product Requirements Document (PRD)

**Problem Statement ID:** 26013  
**Title:** Automated Integration and Intelligent Harmonization of Multi-source Geospatial Data for Urban Land Record Management  
**Tagline:** *"Evidence-based geospatial harmonization for urban land records."*

---

## 1. Executive Summary

Urban land governance across municipalities, revenue departments, and planning authorities in India and developing nations suffers from acute data fragmentation. Multiple public departments maintain disjointed records for the exact same physical parcel: revenue survey maps (cadastral), urban local body property tax databases (municipal), high-resolution drone ortho-imagery (ORI/SVAMITVA), digital elevation models (DSM/DTM), utility footprints, and ground-truth GNSS/CORS survey points.

Discrepancies in coordinate reference systems (CRS), local naming conventions, spatial alignment (boundary shifts, overlaps, slivers), and attribute representations lead to protracted litigation, revenue leakage, delayed infrastructure projects, and citizen disputes.

**BhuSync AI** is an intelligent, evidence-based geospatial harmonization platform designed for urban land-record authorities. It ingests disparate multi-source vector and tabular datasets, normalizes spatial and attribute schemas, performs automated topology validation, executes AI/spatial matching using multi-factor evidence weighting, detects legal and spatial conflicts, generates explainable confidence scores, and provides a Human-in-the-Loop (HITL) verification workbench before generating a Single Source of Truth: the **Unified Urban Property Card**.

---

## 2. Problem Definition & Ground Reality

### Core Deficiencies in Existing Systems:
1. **Coordinate Misalignment:** Cadastral maps in local Cassini/Soldner or EPSG:3857 grids do not align with modern WGS84 (EPSG:4326) or UTM Zone projections (e.g., EPSG:32643 / EPSG:32644).
2. **Naming & Attribute Inconsistencies:** Inconsistent spelling, abbreviated initials ("Ramesh K." vs "Ramesh Kumar"), and divergent field names (`PROP_ID`, `PLOT_NO`, `ASSESSMENT_NO`, `SURVEY_NO`).
3. **Area Discrepancies:** Deeds record sale deed deeded area, municipal registers record built-up taxable area, and drone photogrammetry calculates actual ground footprint area.
4. **Spatial Boundary Drift & Slivers:** Legacy vectorization distortion, edge-matching errors, overlapping claims, and encroachment over municipal right-of-way or water bodies.
5. **Lack of Explainability:** Black-box AI or manual subjective adjustments lack verifiable audit trails admissible in land revenue courts or administrative tribunals.

---

## 3. Product Vision & Principles

* **Deterministic & Explainable AI First:** No black-box hallucinations. All matching scores and anomaly detections are mathematically derived from spatial geometry, topology, coordinate proximity, and fuzzy string similarity with explicit component scores.
* **Non-Destructive Ingestion:** Never mutate authoritative primary records. All harmonization happens in a staged harmonization layer.
* **Human-in-the-Loop Authority:** High-confidence matches (≥ 90%) can be auto-approved or batched; moderate (70–89%) and critical conflict cases (< 70%) strictly enforce human review with full audit logging.
* **Government-Grade Spatial UI:** Built to feel like a high-density, authoritative spatial decision support system (SDSS), prioritizing clarity, map interaction, layer comparisons, and dispute triage.

---

## 4. User Personas

| Persona | Role | Key Goal | Pain Points Solved |
|---|---|---|---|
| **Town Planning Officer / Tehsildar** | Reviewing Authority | Rapidly identify land conflicts and validate ownership claims against drone surveys. | Replaces manual cross-referencing across 4 physical registers and mismatched CAD drawings. |
| **Municipal GIS Analyst** | Data Integrator | Ingest raw shapefiles, GeoJSON, CSV survey data, normalize CRS, and run automated topology checks. | Eliminates hours of manual GIS projection transformation and manual spatial joins in desktop GIS. |
| **Land Revenue Commissioner** | Executive Oversight | Review city-wide harmonization health, unresolved conflicts, and audit trail metrics. | Provides transparent executive KPIs, conflict heatmaps, and tamper-evident audit logs. |

---

## 5. End-to-End MVP User Journey

```text
  [1. Upload Datasets]
       │  (Cadastral GeoJSON, Municipal GeoJSON, Revenue CSV, Drone Footprints, GNSS Survey)
       ▼
  [2. Validate & Ingest]
       │  (File integrity check, schema validation, geometry repair)
       ▼
  [3. Normalize CRS & Attributes]
       │  (Transform to project CRS e.g., EPSG:4326/UTM; canonical field mapping)
       ▼
  [4. Execute AI Harmonization Pipeline]
       │  (R-tree spatial indexing, candidate retrieval, IoU & Hausdorff distance,
       │   fuzzy attribute match, GNSS proximity)
       ▼
  [5. Multi-Factor Confidence Scoring]
       │  (Geometry 30%, Area 20%, Location 20%, Attribute 15%, GNSS 15%)
       ▼
  [6. Conflict & Topology Engine]
       │  (Overlap detection, area difference thresholding, name mismatch triage)
       ▼
  [7. Interactive Decision Workbench]
       │  (MapLibre dual-layer comparison, side-by-side evidence card, confidence breakdown)
       ▼
  [8. Human-in-the-Loop Review]
       │  (Approve recommendation, override source boundaries, flag for field re-survey)
       ▼
  [9. Unified Urban Property Record & Audit Trail]
       │  (Downloadable Property Card, JSON API, immutable tamper-evident event log)
```

---

## 6. Detailed Feature Scope (MVP)

### 6.1 Data Ingestion & Pre-processing
- **Multi-format Support:** GeoJSON (polygons, points), CSV (tabular revenue registers and GNSS coordinate points).
- **Automated CRS Detection & Reprojection:** Automatic recognition of coordinate reference systems (EPSG:4326, EPSG:3857, EPSG:32643/44) with normalization to WGS84 (EPSG:4326) / UTM projection for metric computations.
- **Intelligent Attribute Canonicalization:** Fuzzy field mapping dictionary to unify disparate column names (`OWNER_NAME`, `PROP_OWNER`, `KATHEDAR_NAME` → `owner_name`; `PLOT_NO`, `PARCEL_ID`, `GIS_ID` → `parcel_id`).

### 6.2 Spatial & AI Matching Engine
- **R-Tree Spatial Indexing:** High-speed candidate generation avoiding $O(N^2)$ brute-force comparisons.
- **Multi-Factor Quantitative Similarity:**
  - *Geometry IoU & Overlap Score:* Intersection-over-Union ($\text{IoU} = \frac{\text{Area}(A \cap B)}{\text{Area}(A \cup B)}$) and symmetric difference.
  - *Area Similarity Score:* $1.0 - \min\left(1.0, \frac{|Area_A - Area_B|}{\max(Area_A, Area_B)}\right)$.
  - *Location Proximity Score:* Euclidean/Haversine distance between geometric centroids normalized against parcel bounding radius.
  - *Attribute Linguistic Similarity:* Token Sort & Levenshtein similarity via RapidFuzz on owner name, survey number, and ward.
  - *GNSS Ground-Truth Evidence:* Point-in-polygon and distance-to-boundary validation from CORS/RTK ground control points.

### 6.3 Topology & Conflict Engine
- **Topology Defect Detectors:** Polygon self-intersections, slivers, gaps between cadastral neighbors, building footprints extending outside legal parcel boundaries, and duplicate geometries.
- **Conflict Classification:**
  - `AREA_MISMATCH`: Area deviation $> 5\%$.
  - `OWNER_MISMATCH`: Name string similarity $< 80\%$.
  - `GEOMETRY_SHIFT`: Centroid displacement $> 3$ meters with low IoU.
  - `TOPOLOGY_VIOLATION`: Overlap with neighboring parcel $> 10 \text{ m}^2$ or footprint spill.
  - `MISSING_ATTRIBUTES`: Missing survey number or taxpayer identification.

### 6.4 Explainable AI (XAI)
- **Component Breakdown:** Every match exposes individual sub-scores (Geometry, Area, Location, Attributes, GNSS).
- **Natural Language Justification:** Dynamic synthesis of audit-ready rationale (e.g., *"Cadastral and municipal footprints exhibit 94.2% spatial overlap. Owner names 'Ramesh Kumar' and 'Ramesh K' show 88% token similarity. Minor area variance of 3.8% is within drone photogrammetry tolerance."*).

### 6.5 Interactive Spatial Map & Decision Workbench
- **MapLibre GL Vector Map:** Multi-layer switching (Cadastral, Municipal, Drone Buildings, GNSS Survey Points, Conflict Highlights, Harmonized Boundaries).
- **Dual Visual Modes:** Normal view and side-by-side / overlay inspection.
- **Status Color Coding:**
  - 🟢 **High Confidence (90–100%)**: Green overlay.
  - 🟡 **Needs Review (70–89%)**: Amber overlay.
  - 🔴 **Conflict / Low Confidence (< 70%)**: Ruby Red overlay.
- **Inspect on Click:** Real-time parcel inspection drawer with complete provenance, conflict summary, and review actions.

### 6.6 Human-in-the-Loop Review & Audit Log
- **Review Decision Actions:** `APPROVE_HARMONIZATION`, `REJECT_MATCH`, `FLAG_FIELD_RESURVEY`, `OVERRIDE_BOUNDARIES`.
- **Officer Attestation:** Mandatory reviewer remarks and timestamped officer identifier.
- **Unified Property Card:** Consolidated single-view record summarizing agreed geometry, unified area, authoritative owner, tax status, and linked source IDs.
- **Audit Log:** Complete event timeline logging every ingestion, matching run, conflict resolution, and officer review.

### 6.7 Demo Generator & Benchmarking
- **One-Click Synthetic Generator:** Deterministic generation of 100 Cadastral parcels, 100 Municipal properties, 100 Revenue records, 130 Building footprints, and GNSS ground points with seeded realistic errors (5% area shifts, spelling typos, 3 boundary overlaps, 2 missing IDs).

---

## 7. Success Metrics & Acceptance Criteria

1. **Deterministic Accuracy:** Reaches $\ge 90\%$ F1-score on known synthetic benchmark matches without false positive overrides.
2. **Sub-second Response:** R-tree spatial querying matches 100 parcels across 5 layers in $< 3$ seconds.
3. **100% Explainability:** No score presented to the user without sub-component breakdown and generated rationale.
4. **Audit Immutability:** Every decision triggers an entry in the system audit log.
5. **Zero External Lock-In:** Functional offline without paid third-party geocoding or proprietary cloud APIs.
