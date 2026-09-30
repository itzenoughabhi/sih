# BhuSync AI — Deployment Guide

This repository is pre-configured and ready for deployment:
* **Frontend**: Deploy directly to **Vercel** with continuous deployment from GitHub.
* **Backend**: Deploy to **Render**, **Railway**, **Fly.io**, or any container/VPS platform using the included `backend/Dockerfile` or standard Python runtime.

---

## 1. Preparing GitHub Repository

To push your local code to a new GitHub repository:

```bash
# 1. Initialize git
git init

# 2. Stage all files (the root .gitignore automatically excludes node_modules, temp files, and caches)
git add .

# 3. Commit
git commit -m "feat: complete BhuSync AI geospatial harmonization platform"

# 4. Set default branch to main
git branch -M main

# 5. Link your GitHub remote and push
git remote add origin https://github.com/<your-username>/bhusync-ai.git
git push -u origin main
```

---

## 2. Deploy Frontend to Vercel

### Option A: Standard 1-Click / Root Deployment (Recommended)
1. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
2. Select your imported GitHub repository (`bhusync-ai`).
3. Leave **Root Directory** as `./` (the default).  
   *The included root `vercel.json` and `package.json` automatically install frontend dependencies and build Next.js.*
4. Under **Environment Variables**, add:
   * **`NEXT_PUBLIC_API_URL`**: `https://your-backend.onrender.com/api` *(or your deployed backend URL)*
   * **`NEXT_PUBLIC_MAP_STYLE`**: `https://demotiles.maplibre.org/style.json`
5. Click **"Deploy"**.

### Option B: Monorepo Root Directory Setting
1. If you prefer pointing Vercel directly to the frontend directory:
   * In Vercel Project Settings > **General** > **Root Directory**: Select `frontend`.
2. Add your environment variables:
   * **`NEXT_PUBLIC_API_URL`**: `https://your-backend.onrender.com/api`
3. Click **"Deploy"**.

---

## 3. Deploy Backend (FastAPI + GIS Engine)

The backend is fully self-contained inside the `backend/` directory, including the **`backend/data/`** directory with all synthetic demo datasets and pre-seeded database.

### Deploying on Render (Free/Standard Web Service)
1. Go to [render.com](https://render.com) > **New Web Service**.
2. Connect your GitHub repository.
3. Choose **Docker** environment:
   * **Root Directory**: `backend`
   * **Dockerfile Path**: `Dockerfile`
4. Or choose **Python 3** environment:
   * **Root Directory**: `backend`
   * **Build Command**: `pip install -r requirements.txt`
   * **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Environment Variables:
   * `APP_ENV`: `production`
   * `CORS_ORIGINS`: `*` *(or your Vercel frontend URL `https://your-app.vercel.app`)*
   * `DATABASE_URL`: `sqlite:///./bhusync.db` *(or a managed PostgreSQL/PostGIS connection URL)*
6. Click **"Create Web Service"**.
   * On startup, the backend automatically detects fresh deployments and auto-seeds the 100 Vasai-Virar study zone parcels, roads, utilities, and building footprints!

### Deploying on Railway
1. Go to [railway.app](https://railway.app) > **New Project** > **Deploy from GitHub repo**.
2. Set **Root Directory** to `backend`.
3. Railway automatically detects `Dockerfile` or `requirements.txt`.
4. Add environment variables:
   * `PORT`: `8000`
   * `CORS_ORIGINS`: `*`
5. Copy your Railway service public domain (e.g. `https://bhusync-api.up.railway.app`) and set it as `NEXT_PUBLIC_API_URL` in Vercel!

---

## 4. Local Quick Start

Run both frontend and backend locally with one command:

```bash
# Start backend (Port 8000)
npm run backend

# In a second terminal, start frontend (Port 3000)
npm run dev
```

* **Frontend Dashboard**: http://localhost:3000
* **GIS Map View**: http://localhost:3000/map
* **Backend API Docs (Swagger)**: http://localhost:8000/docs
* **Health Check**: http://localhost:8000/api/health
