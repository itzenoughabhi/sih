from fastapi import APIRouter
import pyproj
import shapely

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("")
def health_check():
    return {
        "status": "healthy",
        "service": "Naksha.ai Backend",
        "version": "1.0.0",
        "pyproj_version": pyproj.__version__,
        "shapely_version": shapely.__version__,
        "geos_version": shapely.geos_version_string
    }
