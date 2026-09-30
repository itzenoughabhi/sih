# BhuSync AI — 3-Minute Judge Demonstration Script

**Problem Statement ID:** 26013  
**Objective:** Convincingly demonstrate automated multi-source geospatial data harmonization, explainable AI matching, spatial conflict detection, and human-in-the-loop approval resulting in a Unified Urban Property Card.

---

## ⏱️ Timeline Overview

| Timestamp | Phase / Action | Key Visual Focus | Core Message |
|---|---|---|---|
| **0:00 – 0:35** | **The Crisis & Dashboard Ingestion** | `/dashboard` & `/datasets` | Fragmentation of 5 government departments; click "Generate Demo" |
| **0:35 – 1:15** | **Automated Harmonization & Map** | `/harmonization` & `/map` | CRS reprojected, R-tree spatial match in $< 2$ seconds; 3-color status map |
| **1:15 – 1:55** | **Explainable AI on Parcel P001** | `/parcels/p-001` | 94% confidence with 5 sub-factors; explainable audit trail |
| **1:55 – 2:35** | **Conflict Detection & HITL Review** | `/conflicts` & `/parcels/p-004` | Area discrepancy (12.7%) flagged; officer reviews drone evidence & approves |
| **2:35 – 3:00** | **Unified Property Card & Audit Log** | Unified Property Card & `/audit-log` | Tamper-evident single source of truth for urban land governance |

---

## 🎬 Step-by-Step Script & Actions

### Act 1: The Fragmentation Crisis & Ingestion (0:00 – 0:35)
1. **Screen:** Open `http://localhost:3000/dashboard`.
2. **Narration:**
   > *"Good morning judges. In every Indian city today, land records are fractured across five different silos: legacy revenue maps, municipal property tax grids, drone photogrammetry, building footprints, and GNSS surveys. They use different coordinate projections, have shifted boundaries, and disagree on who owns what."*
3. **Action:** Navigate to **Datasets** tab (`/datasets`).
4. **Action:** Click **"Generate Seeded Demo Datasets"**.
   - Watch the 5 datasets populate instantly:
     1. `Cadastral Survey (Revenue Dept) - 100 features - EPSG:4326`
     2. `Municipal Property Tax GIS - 100 features - EPSG:3857`
     3. `Revenue Register Khata - 100 records - Tabular CSV`
     4. `Drone Photogrammetry Building Footprints - 130 polygons`
     5. `CORS/RTK GNSS Ground Truth Survey - 80 points`
5. **Narration:**
   > *"BhuSync AI ingests these files, auto-detects coordinate systems, normalizes divergent attributes like OWNER_NAME vs PROP_OWNER, and prepares the spatial index."*

---

### Act 2: Automated AI Harmonization (0:35 – 1:15)
1. **Screen:** Navigate to **Harmonization** tab (`/harmonization`).
2. **Action:** Show the configurable evidence weights:
   - Geometry (30%) · Area (20%) · Location (20%) · Attributes (15%) · GNSS (15%).
3. **Action:** Click **"Run Intelligent Harmonization"**.
   - Processing animation runs; within 1.5 seconds, the summary cards update:
     - **100 Parcels Processed**
     - **82 High-Confidence Matches (≥ 90%)**
     - **13 Review Required (70–89%)**
     - **5 Critical Conflicts (< 70%)**
     - **7 Topology Issues Detected**
4. **Screen:** Click **"Open GIS Map"** (`/map`).
5. **Action:** Show the MapLibre GL viewer:
   - Toggle layers: `Cadastral`, `Municipal`, `Drone Buildings`, `GNSS Points`.
   - Highlight the color-coded confidence:
     - 🟢 **Green:** High Confidence consensus.
     - 🟡 **Yellow:** Review required (minor name/area variance).
     - 🔴 **Red:** Spatial or ownership conflict.

---

### Act 3: Explainable AI — Inspecting Parcel P-001 (1:15 – 1:55)
1. **Action:** On the map or parcel table, click parcel **`CAD-001` (Parcel ID: `p-001`)**.
2. **Screen:** Opens **Parcel Details Page** (`/parcels/p-001`).
3. **Narration:**
   > *"Notice that BhuSync AI never presents a black-box percentage. Parcel CAD-001 achieves 94% confidence, but look at the explainable breakdown:"*
4. **Point Out Evidence Breakdown:**
   - **Geometry Alignment:** 96% (IoU 0.94)
   - **Area Similarity:** 92% (Cadastral 845 m² vs Municipal 838 m² — 0.8% variance)
   - **Location Proximity:** 98% (0.35m centroid displacement)
   - **Attribute Agreement:** 89% (RapidFuzz matches 'Ramesh Kumar Sharma' to 'Ramesh K. Sharma')
   - **GNSS Ground Evidence:** 95% (CORS point located inside boundary)
5. **Read Explainable Natural Language Reason:**
   > *"Our XAI engine automatically synthesizes legal-ready narrative: 'Parcel boundaries and GNSS survey points show strong spatial concordance. Minor owner name abbreviation detected with 89% linguistic token similarity.'"*

---

### Act 4: Spatial Conflict Detection & Human-in-the-Loop Review (1:55 – 2:35)
1. **Screen:** Navigate to **Conflict Center** (`/conflicts`).
2. **Action:** Click on conflict **`CONF-004` (Parcel `p-004`)**.
3. **Narration:**
   > *"Here is where real urban disputes happen. On parcel p-004, Cadastral records claim 850 m², but the Municipal tax register only assesses 742 m² — an alarming 12.7% difference that creates revenue leakage and boundary disputes."*
4. **Action:** Show the dual-source comparison card:
   - Cadastral boundary vs Municipal boundary vs Drone Footprint.
5. **Action:** Open Review Decision dialog:
   - Select **"Approve Recommendation (Cadastral Base with Drone Footprint)"**.
   - Input Officer Remark: *"Confirmed via high-resolution drone ortho-imagery; municipal tax assessment flagged for revision."*
   - Reviewer: `Officer Sharma (Tehsildar, Ward 14)`.
   - Click **"Submit & Seal Decision"**.
6. **Narration:**
   > *"The AI never silently overwrote government records. The officer verified the ground truth, attested the resolution, and sealed it."*

---

### Act 5: The Unified Urban Property Card & Audit Trail (2:35 – 3:00)
1. **Screen:** Click **"Generate Unified Property Card"** for `p-004`.
2. **Action:** Display the clean, authoritative **Unified Property Card**:
   - Unique ULPIN/Property ID: `KA-BLR-W14-004`
   - Harmonized Area: `848.5 m²`
   - Verified Owner: `Ramesh Kumar`
   - Linked Legacy IDs: Cadastral `CAD-004`, Municipal `MUN-004`, Revenue `SY-104/4`
   - Digital Attestation Badge: `Digitally Harmonized by BhuSync AI`
3. **Screen:** Click **Audit Log** (`/audit-log`).
4. **Narration:**
   > *"Every single step — from dataset upload, CRS reproject, spatial intersection, to Officer Sharma's approval — is immutably recorded in the tamper-evident audit log. That is BhuSync AI: automated, explainable, and human-verified geospatial governance."*
5. **Close:** Thank the judges and invite questions.
