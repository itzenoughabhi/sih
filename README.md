# BhuSync AI — Automated Geospatial Data Harmonization

> **Problem Statement ID: 26013**  
> *Automated Integration and Intelligent Harmonization of Multi-source Geospatial Data for Urban Land Record Management.*  
> **Tagline:** *"Evidence-based geospatial harmonization for urban land records."*

---

## 📌 Overview

**BhuSync AI** is a specialized GIS and decision-support platform that ingests, normalizes, spatially correlates, and harmonizes disparate urban land records across cadastral maps, municipal property tax layers, revenue registers, drone photogrammetry (SVAMITVA/ORI), and ground-truth GNSS/CORS survey points.

Rather than relying on black-box probabilistic models or manual comparisons, BhuSync AI uses a **deterministic multi-factor spatial matching engine** (R-Tree indexed IoU, area delta, centroid displacement, RapidFuzz token matching, and GNSS control point proximity), producing an **explainable confidence score**, flagging topology and attribute conflicts, and enforcing **Human-in-the-Loop (HITL)** legal review.

---

## 🏛️ System Architecture

```text
  Frontend: Next.js 14 App Router, TypeScript, Tailwind CSS, MapLibre GL JS, Recharts
      │
      ▼ REST APIs (JSON / GeoJSON)
  Backend: FastAPI (Python 3.11+), Pydantic v2, Shapely 2.0, PyProj, GeoPandas, RapidFuzz
      │
      ▼ Spatial Engine & Persistence
  Database: PostgreSQL 16 + PostGIS (with automatic SQLite/JSON fallback for zero-setup demo)
```

---

## ⚡ Quick Start (Evaluation Mode)

### Prerequisites
- **Python 3.10+** (Python 3.11/3.12/3.13 supported)
- **Node.js 18+** (Node 20/22/24 supported)
- **Git**
- *(Optional)* Docker & Docker Compose

---

### Method 1: Local Development (Recommended for Fast Local Run)

#### Step 1: Clone and Set Up Environment
```bash
git clone <repo-url> bhusync-ai
cd bhusync-ai
```

#### Step 2: Backend Setup
```bash
cd backend
python -m venv venv

# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The backend API will be live at: `http://localhost:8000` (Interactive Swagger Docs at `http://localhost:8000/docs`).

#### Step 3: Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
The frontend portal will be live at: `http://localhost:3000`.

---

### Method 2: Docker Compose (Single Command)
```bash
docker compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- Swagger Docs: `http://localhost:8000/docs`

---

## 📂 Project Structure

```text
bhusync-ai/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI REST endpoints
│   │   ├── core/            # Config, security, database session
│   │   ├── gis/             # CRS reprojection, geometry validation, topology
│   │   ├── matching/        # R-Tree indexing, IoU, RapidFuzz, confidence engine
│   │   ├── conflicts/       # Conflict classifier, area & geometry shifts
│   │   ├── demo/            # Seeded synthetic dataset generator (100 parcels)
│   │   ├── models/          # SQL database models
│   │   └── schemas/         # Pydantic validation schemas
│   ├── tests/               # Pytest automated test suites
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── app/                 # Next.js 14 App Router pages
│   │   ├── dashboard/       # Executive summary & live metrics
│   │   ├── datasets/        # Ingestion & file management
│   │   ├── harmonization/   # AI matching parameters & execution
│   │   ├── map/             # MapLibre GL full interactive GIS viewer
│   │   ├── conflicts/       # Conflict resolution center
│   │   ├── parcels/         # Parcel detail, evidence & property card
│   │   └── audit-log/       # Tamper-evident event timeline
│   ├── components/          # Reusable UI cards, tables, maps, modals
│   ├── lib/                 # API client, types, map utilities
│   ├── package.json
│   └── Dockerfile
│
├── data/
│   └── demo/                # Synthetic GeoJSON & CSV datasets
├── docker-compose.yml
├── .env.example
├── PRD.md                   # Product Requirements Document
├── ARCHITECTURE.md          # Architecture & data flow
├── IMPLEMENTATION_PLAN.md   # Phased delivery plan
├── DATA_MODEL.md            # Schema and entity relationships
├── API_SPEC.md              # OpenAPI endpoint specification
├── DEMO_SCENARIO.md         # 3-minute judge script
└── README.md                # System documentation
```

---

## 🎯 3-Minute Hackathon Demo Workflow

1. **Dashboard (`/dashboard`):** Notice the live executive metrics.
2. **Datasets (`/datasets`):** Click **"Generate Seeded Demo Datasets"**. Instantly loads:
   - 100 Cadastral revenue parcels (EPSG:4326)
   - 100 Municipal property tax footprints (EPSG:3857)
   - 100 Revenue records (CSV)
   - 130 Drone photogrammetry building footprints (GeoJSON)
   - 80 CORS/RTK GNSS ground truth survey points (CSV)
3. **Harmonization (`/harmonization`):** Review evidence weights (Geometry 30%, Area 20%, Location 20%, Attributes 15%, GNSS 15%). Click **"Run Intelligent Harmonization"**. Completes in $< 2$ seconds.
4. **Interactive Map (`/map`):** Inspect color-coded parcels:
   - 🟢 **Green:** High Confidence ($\ge 90\%$)
   - 🟡 **Yellow:** Review Required ($70–89\%$)
   - 🔴 **Red:** Conflict ($< 70\%$)
   - Toggle layers (Cadastral, Municipal, Drone, GNSS, Conflicts).
5. **Inspect High-Confidence Parcel (`/parcels/p-001`):** Observe 94% composite confidence with complete sub-component breakdown and natural-language rationale.
6. **Triage Conflict (`/conflicts` & `/parcels/p-004`):** Inspect a 12.7% area mismatch between Cadastral and Municipal tax registers. Review drone evidence and submit officer approval.
7. **Unified Property Card:** Generate and view the verified property card with single authoritative geometry, area, and owner.
8. **Audit Log (`/audit-log`):** View the immutable audit trail verifying officer attestation.

---

## 🧪 Running Automated Tests

```bash
cd backend
pytest -v
```
Tests cover:
- CRS reprojection & transformations (EPSG:3857, EPSG:32643 to EPSG:4326)
- Geometry validity and repair (`make_valid`)
- R-Tree spatial indexing & IoU intersection calculation
- RapidFuzz token sort string similarity
- Multi-factor confidence scoring formula
- Area and geometry shift conflict classification
- API endpoints (upload, run, resolve, stats)

---

## 🛡️ Limitations & Scope Boundaries (Prototype)

- **Prototype Scope:** Designed as an intelligent decision-support prototype for hackathon validation; not a legally binding registry.
- **Local Fallback:** PostGIS is fully supported for production, with embedded SQLite + GeoJSON serialization enabled by default for zero-setup execution.
- **File Upload Limits:** Capped at 25MB for prototype memory safety.

---

## 🗺️ Roadmap Beyond Hackathon

1. **Direct SVAMITVA / DILRMP Integration:** Direct connectors to state land record APIs (Bhoomi, AnyRoR, Dharani, Meebhoomi).
2. **LiDAR 3D Mesh Support:** Integration of 3D Digital Surface Models (DSM) and volumetric building extraction.
3. **Smart Contract Attestation:** Anchoring finalized property card hashes onto an immutable permissioned ledger.
4. **Mobile Field App:** React Native mobile interface for ground surveyors equipped with RTK receivers.
