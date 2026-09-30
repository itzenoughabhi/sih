import pytest
from shapely.geometry import Polygon, mapping
from backend.app.gis.crs import detect_crs, calculate_metric_area, calculate_metric_distance
from backend.app.gis.geometry import (
    validate_and_repair_geometry,
    calculate_iou,
    calculate_area_similarity,
    calculate_centroid_offset
)
from backend.app.gis.attributes import normalize_attribute_keys

def test_crs_detection():
    assert detect_crs("EPSG:4326") == "EPSG:4326"
    assert detect_crs("EPSG:3857") == "EPSG:3857"
    assert detect_crs({"properties": {"name": "urn:ogc:def:crs:EPSG::3857"}}) == "EPSG:3857"

def test_geometry_repair():
    # Self-intersecting bowtie polygon
    bowtie = {
        "type": "Polygon",
        "coordinates": [[[0, 0], [1, 1], [0, 1], [1, 0], [0, 0]]]
    }
    repaired, modified = validate_and_repair_geometry(bowtie)
    assert repaired["type"] in ["Polygon", "MultiPolygon"]
    assert modified is True

def test_iou_calculation():
    square1 = {"type": "Polygon", "coordinates": [[[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]]}
    square2 = {"type": "Polygon", "coordinates": [[[1, 0], [3, 0], [3, 2], [1, 2], [1, 0]]]}
    
    # Square 1 area = 4, Square 2 area = 4, Intersection [1,0] to [2,2] area = 2, Union area = 6
    # IoU = 2 / 6 = 0.3333
    iou = calculate_iou(square1, square2)
    assert 0.33 <= iou <= 0.34

    # Identical square
    assert calculate_iou(square1, square1) == 1.0

def test_area_similarity():
    assert calculate_area_similarity(100.0, 100.0) == 1.0
    assert calculate_area_similarity(850.0, 742.0) == pytest.approx(0.8729, rel=1e-2)

def test_attribute_normalization():
    raw_props = {
        "PLOT_ID": "CAD-001",
        "SURVEY_NO": "104/1",
        "OWNER_NAME": "Ramesh Kumar Sharma",
        "PLOT_AREA": "845.5 sqm",
        "WARD_NO": "14"
    }
    norm = normalize_attribute_keys(raw_props)
    assert norm["parcel_id"] == "CAD-001"
    assert norm["survey_number"] == "104/1"
    assert norm["owner_name"] == "Ramesh Kumar Sharma"
    assert norm["area"] == 845.5
