import functools
import pyproj
from pyproj import Transformer
from shapely.geometry import shape, mapping
from shapely.ops import transform
from typing import Dict, Any, Union
from backend.app.config import settings

@functools.lru_cache(maxsize=32)
def get_transformer(src_crs: str, dst_crs: str) -> Transformer:
    return Transformer.from_crs(src_crs, dst_crs, always_xy=True)

def detect_crs(raw_crs: Any) -> str:
    """Detect or parse CRS string from GeoJSON/headers."""
    if not raw_crs:
        return settings.DEFAULT_PROJECT_CRS
    
    if isinstance(raw_crs, dict):
        props = raw_crs.get("properties", {})
        name = props.get("name", "")
        if "3857" in name or "900913" in name:
            return "EPSG:3857"
        if "4326" in name or "CRS84" in name:
            return "EPSG:4326"
        if "32643" in name:
            return "EPSG:32643"
        if "32644" in name:
            return "EPSG:32644"
    
    crs_str = str(raw_crs).strip()
    if "3857" in crs_str:
        return "EPSG:3857"
    if "32643" in crs_str:
        return "EPSG:32643"
    if "32644" in crs_str:
        return "EPSG:32644"
    if "4326" in crs_str:
        return "EPSG:4326"
        
    return settings.DEFAULT_PROJECT_CRS

def reproject_geometry(geom_dict: Dict[str, Any], src_crs: str, dst_crs: str = "EPSG:4326") -> Dict[str, Any]:
    """Reproject a GeoJSON geometry dictionary from src_crs to dst_crs."""
    if src_crs == dst_crs:
        return geom_dict

    try:
        transformer = get_transformer(src_crs, dst_crs)
        geom = shape(geom_dict)
        reprojected = transform(transformer.transform, geom)
        return mapping(reprojected)
    except Exception:
        return geom_dict

def calculate_metric_area(geom_dict_or_obj: Any, src_crs: str = "EPSG:4326") -> float:
    """
    Calculate area in square meters (m²) using a metric projected coordinate system (UTM 43N).
    """
    try:
        if isinstance(geom_dict_or_obj, dict):
            geom = shape(geom_dict_or_obj)
        else:
            geom = geom_dict_or_obj

        if geom.is_empty:
            return 0.0

        if src_crs == settings.METRIC_CRS:
            return float(geom.area)

        # Reproject from WGS84 or other to UTM 43N
        transformer = get_transformer(src_crs, settings.METRIC_CRS)
        metric_geom = transform(transformer.transform, geom)
        return round(float(metric_geom.area), 2)
    except Exception:
        return round(float(shape(geom_dict_or_obj).area * 111320 * 111320), 2)

def calculate_metric_distance(geom_a: Any, geom_b: Any, src_crs: str = "EPSG:4326") -> float:
    """Calculate distance in meters between two geometries in metric UTM projection."""
    try:
        g_a = shape(geom_a) if isinstance(geom_a, dict) else geom_a
        g_b = shape(geom_b) if isinstance(geom_b, dict) else geom_b
        
        transformer = get_transformer(src_crs, settings.METRIC_CRS)
        m_a = transform(transformer.transform, g_a)
        m_b = transform(transformer.transform, g_b)
        return round(float(m_a.distance(m_b)), 2)
    except Exception:
        return 0.0
