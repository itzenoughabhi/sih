from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.database import engine, Base, init_db
import backend.app.models.models  # ensure models are registered
from backend.app.api.health import router as health_router
from backend.app.api.datasets import router as datasets_router
from backend.app.api.harmonization import router as harmonization_router
from backend.app.api.parcels import router as parcels_router
from backend.app.api.conflicts import router as conflicts_router
from backend.app.api.reviews import router as reviews_router
from backend.app.api.dashboard import router as dashboard_router
from backend.app.api.map import router as map_router
from backend.app.api.demo import router as demo_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    # Auto-seed demo dataset if database is empty on fresh deployment
    try:
        from backend.app.database import SessionLocal
        from backend.app.models.models import Dataset
        from backend.app.api.demo import generate_and_seed_demo
        db = SessionLocal()
        try:
            if db.query(Dataset).count() == 0:
                print("Fresh deployment detected: auto-seeding Vasai-Virar demo datasets...")
                generate_and_seed_demo(db=db)
                print("Auto-seeding complete.")
        finally:
            db.close()
    except Exception as e:
        print(f"Warning: Auto-seed skipped due to: {e}")
    yield

app = FastAPI(
    title="Naksha.ai",
    description="Automated Integration and Intelligent Harmonization of Multi-source Geospatial Data for Urban Land Record Management.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for seamless hackathon cross-origin testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers under /api
app.include_router(health_router, prefix="/api")
app.include_router(datasets_router, prefix="/api")
app.include_router(harmonization_router, prefix="/api")
app.include_router(parcels_router, prefix="/api")
app.include_router(conflicts_router, prefix="/api")
app.include_router(reviews_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(map_router, prefix="/api")
app.include_router(demo_router, prefix="/api")

@app.get("/")
def root():
    return {
        "message": "Welcome to Naksha.ai — Geospatial Harmonization Platform",
        "docs": "/docs",
        "health": "/api/health"
    }
