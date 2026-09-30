from typing import List, Dict, Any, Tuple
from shapely.geometry import shape
from shapely.strtree import STRtree

class SpatialIndexMatcher:
    """
    R-Tree spatial index using Shapely 2.0 STRtree for efficient candidate pair pruning.
    Avoids O(N * M) brute-force spatial comparisons.
    """
    def __init__(self, target_parcels: List[Dict[str, Any]]):
        self.target_parcels = target_parcels
        self.geometries = [shape(p["geometry"]) for p in target_parcels]
        self.tree = STRtree(self.geometries) if self.geometries else None

    def query_candidates(self, source_geom_dict: Dict[str, Any], buffer_deg: float = 0.0001) -> List[Dict[str, Any]]:
        """
        Query the spatial index for candidate geometries intersecting the buffered source geometry.
        0.0001 degrees is ~11 meters buffer at equator.
        """
        if not self.tree or not self.target_parcels:
            return []

        src_geom = shape(source_geom_dict)
        search_geom = src_geom.buffer(buffer_deg)
        
        # Query STRtree for intersecting indices
        candidate_indices = self.tree.query(search_geom, predicate="intersects")
        
        candidates = []
        for idx in candidate_indices:
            candidates.append(self.target_parcels[idx])
            
        return candidates
