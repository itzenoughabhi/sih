from typing import Dict, Any
from rapidfuzz import fuzz, process

FIELD_MAPPING_DICTIONARY = {
    "parcel_id": [
        "parcel_id", "parcelid", "plot_id", "plot_no", "property_id", 
        "gis_id", "pid", "assessment_no", "pin", "upin", "khasra_no", "prop_id",
        "parcel_reference"
    ],
    "survey_number": [
        "survey_number", "survey_no", "surveyno", "khasra", "gut_no", 
        "sy_no", "sy_number", "hissa_no", "khata_no"
    ],
    "owner_name": [
        "owner_name", "owner", "prop_owner", "kathedar_name", "kathedar", 
        "occupant", "assessee_name", "applicant_name", "holder_name",
        "recorded_owner"
    ],
    "area": [
        "area", "plot_area", "calc_area", "deed_area", "gis_area", 
        "total_area", "builtup_area", "land_area", "area_sqm", "area_m2",
        "plot_area_sqm", "assessed_area_sqm", "recorded_area_sqm", "footprint_area_sqm"
    ],
    "land_use": [
        "land_use", "landuse", "usage", "zone", "category", "property_type", "type",
        "property_use", "land_class"
    ],
    "ward": [
        "ward", "ward_no", "ward_name", "zone_no", "circle", "sector"
    ],
    "municipality": [
        "municipality", "ulb", "city", "corporation", "village", "taluk", "taluka", "district", "locality"
    ]
}

def normalize_attribute_keys(raw_props: Dict[str, Any]) -> Dict[str, Any]:
    """
    Map arbitrary property keys to canonical BhuSync AI field names:
    (parcel_id, survey_number, owner_name, area, land_use, ward, municipality).
    Retains all unmapped keys in raw form.
    """
    normalized: Dict[str, Any] = {
        "parcel_id": None,
        "survey_number": None,
        "owner_name": None,
        "area": None,
        "land_use": "RESIDENTIAL",
        "ward": "Ward 1",
        "municipality": "Municipal Corporation",
        "raw_attributes": dict(raw_props)
    }

    # Normalize incoming keys (lowercase, strip symbols)
    clean_map = {k.lower().replace("-", "_").replace(" ", "_"): (k, v) for k, v in raw_props.items()}

    for canonical_field, synonyms in FIELD_MAPPING_DICTIONARY.items():
        matched = False
        # Direct match check
        for syn in synonyms:
            if syn in clean_map:
                orig_key, val = clean_map[syn]
                normalized[canonical_field] = val
                matched = True
                break
        
        # Fuzzy match fallback if not directly matched
        if not matched and canonical_field in ("owner_name", "parcel_id", "survey_number"):
            for clean_k, (orig_k, val) in clean_map.items():
                for syn in synonyms:
                    if fuzz.ratio(clean_k, syn) > 85:
                        normalized[canonical_field] = val
                        matched = True
                        break
                if matched:
                    break

    # Parse area numeric if present
    if normalized["area"] is not None:
        try:
            val_str = str(normalized["area"]).replace(",", "").strip()
            # strip possible "sqm", "m2", "sq.ft"
            for unit in ["sqm", "m2", "sq m", "sq.m", "m²"]:
                val_str = val_str.lower().replace(unit, "").strip()
            normalized["area"] = float(val_str)
        except Exception:
            normalized["area"] = None

    return normalized
