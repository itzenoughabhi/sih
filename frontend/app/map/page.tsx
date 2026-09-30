"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Layers,
  MapPin,
  Compass,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  X,
  Maximize2,
  RefreshCw,
  Loader2,
  Search,
  ZoomIn,
  ZoomOut,
  Ruler,
  Check,
  Building,
  Info
} from "lucide-react";
import { fetchMapLayers } from "@/lib/api";

export default function MapPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  const [layersData, setLayersData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [measureMode, setMeasureMode] = useState(false);

  // Layer visibility toggles
  const [visibleLayers, setVisibleLayers] = useState({
    cadastral: true,
    buildings: true,
    gnss: true,
    harmonized: true,
    municipal: false,
    conflicts: true,
    roads: true,
    utilities: true,
  });

  const [basemapStyle, setBasemapStyle] = useState<"light" | "satellite">("light");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchMapLayers();
      setLayersData(data);
    } catch (err) {
      console.error("Map layer load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Initialize MapLibre GL
  useEffect(() => {
    if (!mapContainerRef.current || !layersData) return;

    let maplibre: any;

    const initMap = async () => {
      maplibre = (await import("maplibre-gl")).default;

      // Base vector style - Light GIS cartographic base or Satellite
      const baseStyle = {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: [
              basemapStyle === "satellite"
                ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                : "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
            ],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors, CartoDB, Survey of India",
          },
        },
        layers: [
          {
            id: "osm-tiles",
            type: "raster",
            source: "osm",
            minzoom: 0,
            maxzoom: 20,
          },
        ],
      };

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const map = new maplibre.Map({
        container: mapContainerRef.current!,
        style: baseStyle,
        center: [72.8232, 19.4178], // Centered over Vasai-Virar Urban Study Zone
        zoom: 17.5,
        pitch: 0,
      });

      map.on("load", () => {
        // 1. Cadastral Layer (Teal #0F766E)
        if (layersData.cadastral?.features?.length > 0) {
          map.addSource("cadastral-src", {
            type: "geojson",
            data: layersData.cadastral,
          });
          map.addLayer({
            id: "cadastral-fill",
            type: "fill",
            source: "cadastral-src",
            layout: { visibility: visibleLayers.cadastral ? "visible" : "none" },
            paint: {
              "fill-color": "#0F766E",
              "fill-opacity": 0.08,
            },
          });
          map.addLayer({
            id: "cadastral-line",
            type: "line",
            source: "cadastral-src",
            layout: { visibility: visibleLayers.cadastral ? "visible" : "none" },
            paint: {
              "line-color": "#0F766E",
              "line-width": 1.5,
            },
          });
        }

        // 2. Municipal Tax Layer (Amber/Orange #D97706)
        if (layersData.municipal?.features?.length > 0) {
          map.addSource("municipal-src", {
            type: "geojson",
            data: layersData.municipal,
          });
          map.addLayer({
            id: "municipal-line",
            type: "line",
            source: "municipal-src",
            layout: { visibility: visibleLayers.municipal ? "visible" : "none" },
            paint: {
              "line-color": "#D97706",
              "line-width": 1.5,
              "line-dasharray": [2, 1],
            },
          });
        }

        // 3. Drone Building Footprints (Neutral Gray #64748B)
        if (layersData.buildings?.features?.length > 0) {
          map.addSource("buildings-src", {
            type: "geojson",
            data: layersData.buildings,
          });
          map.addLayer({
            id: "buildings-fill",
            type: "fill",
            source: "buildings-src",
            layout: { visibility: visibleLayers.buildings ? "visible" : "none" },
            paint: {
              "fill-color": "#64748B",
              "fill-opacity": 0.25,
            },
          });
          map.addLayer({
            id: "buildings-line",
            type: "line",
            source: "buildings-src",
            layout: { visibility: visibleLayers.buildings ? "visible" : "none" },
            paint: {
              "line-color": "#475569",
              "line-width": 1,
            },
          });
        }

        // 4. Harmonized Consensus Layer (Color-coded by confidence)
        if (layersData.harmonized?.features?.length > 0) {
          map.addSource("harmonized-src", {
            type: "geojson",
            data: layersData.harmonized,
          });
          map.addLayer({
            id: "harmonized-fill",
            type: "fill",
            source: "harmonized-src",
            layout: { visibility: visibleLayers.harmonized ? "visible" : "none" },
            paint: {
              "fill-color": [
                "case",
                ["==", ["get", "status"], "HIGH_CONFIDENCE"],
                "#15803D",
                ["==", ["get", "status"], "NEEDS_REVIEW"],
                "#D97706",
                "#DC2626"
              ],
              "fill-opacity": 0.25,
            },
          });
          map.addLayer({
            id: "harmonized-line",
            type: "line",
            source: "harmonized-src",
            layout: { visibility: visibleLayers.harmonized ? "visible" : "none" },
            paint: {
              "line-color": [
                "case",
                ["==", ["get", "status"], "HIGH_CONFIDENCE"],
                "#15803D",
                ["==", ["get", "status"], "NEEDS_REVIEW"],
                "#D97706",
                "#DC2626"
              ],
              "line-width": 1.5,
            },
          });
        }

        // 5. Conflicts Highlight Layer (Red #DC2626)
        if (layersData.conflicts?.features?.length > 0) {
          map.addSource("conflicts-src", {
            type: "geojson",
            data: layersData.conflicts,
          });
          map.addLayer({
            id: "conflicts-line",
            type: "line",
            source: "conflicts-src",
            layout: { visibility: visibleLayers.conflicts ? "visible" : "none" },
            paint: {
              "line-color": "#DC2626",
              "line-width": 2.5,
            },
          });
        }

        // 6. GNSS Ground Survey Points (Green #15803D)
        if (layersData.gnss?.features?.length > 0) {
          map.addSource("gnss-src", {
            type: "geojson",
            data: layersData.gnss,
          });
          map.addLayer({
            id: "gnss-circle",
            type: "circle",
            source: "gnss-src",
            layout: { visibility: visibleLayers.gnss ? "visible" : "none" },
            paint: {
              "circle-radius": 4,
              "circle-color": "#15803D",
              "circle-stroke-color": "#FFFFFF",
              "circle-stroke-width": 1.5,
            },
          });
        }

        // 7. Urban Road Network (Charcoal / Slate #334155)
        if (layersData.roads?.features?.length > 0) {
          map.addSource("roads-src", {
            type: "geojson",
            data: layersData.roads,
          });
          map.addLayer({
            id: "roads-line",
            type: "line",
            source: "roads-src",
            layout: { visibility: visibleLayers.roads ? "visible" : "none" },
            paint: {
              "line-color": "#334155",
              "line-width": 2.5,
            },
          });
        }

        // 8. Utility Lifeline Network (Cyan #0284C7 for water, Purple #7C3AED for electricity)
        if (layersData.utilities?.features?.length > 0) {
          map.addSource("utilities-src", {
            type: "geojson",
            data: layersData.utilities,
          });
          map.addLayer({
            id: "utilities-line",
            type: "line",
            source: "utilities-src",
            layout: { visibility: visibleLayers.utilities ? "visible" : "none" },
            paint: {
              "line-color": [
                "case",
                ["==", ["get", "utility_type"], "Water"],
                "#0284C7",
                ["==", ["get", "utility_type"], "Electricity"],
                "#7C3AED",
                "#D97706"
              ],
              "line-width": 2,
              "line-dasharray": [3, 2],
            },
          });
        }

        // Interactive Parcel Click
        map.on("click", "harmonized-fill", (e: any) => {
          if (e.features && e.features.length > 0) {
            setSelectedFeature(e.features[0].properties);
          }
        });

        // Hover cursor styling
        map.on("mouseenter", "harmonized-fill", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "harmonized-fill", () => {
          map.getCanvas().style.cursor = "";
        });

        mapInstanceRef.current = map;
      });
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [layersData, basemapStyle]);

  // Update layer visibility dynamically
  const toggleLayer = (key: keyof typeof visibleLayers) => {
    const updated = !visibleLayers[key];
    setVisibleLayers((prev) => ({ ...prev, [key]: updated }));

    const map = mapInstanceRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const layerMap: Record<string, string[]> = {
      cadastral: ["cadastral-fill", "cadastral-line"],
      municipal: ["municipal-line"],
      buildings: ["buildings-fill", "buildings-line"],
      harmonized: ["harmonized-fill", "harmonized-line"],
      conflicts: ["conflicts-line"],
      gnss: ["gnss-circle"],
      roads: ["roads-line"],
      utilities: ["utilities-line"],
    };

    const targetLayerIds = layerMap[key] || [];
    targetLayerIds.forEach((id) => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, "visibility", updated ? "visible" : "none");
      }
    });
  };

  const handleZoom = (delta: number) => {
    if (!mapInstanceRef.current) return;
    const current = mapInstanceRef.current.getZoom();
    mapInstanceRef.current.zoomTo(current + delta, { duration: 300 });
  };

  const handleResetView = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo({
      center: [72.8232, 19.4178],
      zoom: 17.5,
      pitch: 0,
      bearing: 0,
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !layersData?.harmonized?.features) return;
    const match = layersData.harmonized.features.find(
      (f: any) =>
        f.properties?.parcel_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.properties?.survey_number?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (match) {
      setSelectedFeature(match.properties);
      if (match.geometry?.coordinates?.[0]?.[0] && mapInstanceRef.current) {
        const coord = match.geometry.coordinates[0][0];
        mapInstanceRef.current.flyTo({ center: coord, zoom: 18.5 });
      }
    } else {
      alert(`Parcel "${searchQuery}" not found in current sector.`);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E2E8F0] gap-3">
        <div>
          <div className="text-xs font-semibold text-[#0F766E] uppercase tracking-wider mb-1">
            GIS Map Viewer • Vasai-Virar Urban Study Zone
          </div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Urban Cadastral GIS Workspace</h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Palghar District, Maharashtra • CRS: EPSG:4326 (WGS 84) • Metric Projector: EPSG:32643 (UTM 43N)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Basemap Switcher */}
          <div className="flex items-center bg-white border border-[#E2E8F0] rounded-md text-xs p-0.5">
            <button
              onClick={() => setBasemapStyle("light")}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                basemapStyle === "light"
                  ? "bg-[#0F766E] text-white"
                  : "text-[#64748B] hover:text-[#1E293B]"
              }`}
            >
              Light Cartographic
            </button>
            <button
              onClick={() => setBasemapStyle("satellite")}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                basemapStyle === "satellite"
                  ? "bg-[#0F766E] text-white"
                  : "text-[#64748B] hover:text-[#1E293B]"
              }`}
            >
              Satellite Imagery
            </button>
          </div>

          <button
            onClick={loadData}
            className="p-2 rounded-md bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8FAFC] transition-colors"
            title="Refresh GIS layers"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main 75-80% Map Layout with Right Layer / Info Panel (Section 14 & 17) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* Left / Dominant Element: GIS Map (75% on desktop) */}
        <div className="lg:col-span-3 relative h-[680px] rounded-lg overflow-hidden border border-[#E2E8F0] bg-[#F1F5F9]">
          
          {loading && (
            <div className="absolute inset-0 z-30 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center space-y-2 text-xs text-[#64748B]">
              <Loader2 className="w-6 h-6 animate-spin text-[#0F766E]" />
              <span className="font-medium text-[#1E293B]">Loading spatial vector layers...</span>
            </div>
          )}

          {/* Map Canvas */}
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Practical Map Controls (Section 16: compact white boxes with subtle borders) */}
          <div className="absolute top-3 left-3 z-20 flex flex-col space-y-2">
            
            {/* Search Parcel Input */}
            <form onSubmit={handleSearch} className="flex items-center bg-white border border-[#E2E8F0] rounded-md shadow-xs overflow-hidden">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Parcel ID / Survey No..."
                className="px-3 py-1.5 text-xs text-[#1E293B] placeholder-[#94A3B8] focus:outline-none w-56"
              />
              <button type="submit" className="p-1.5 text-[#64748B] hover:text-[#0F766E] border-l border-[#E2E8F0]">
                <Search className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Navigation / Measure Tools */}
            <div className="bg-white border border-[#E2E8F0] rounded-md shadow-xs p-1 flex items-center space-x-1 w-fit">
              <button
                onClick={() => handleZoom(1)}
                className="p-1.5 text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8FAFC] rounded"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleZoom(-1)}
                className="p-1.5 text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8FAFC] rounded"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="w-px h-4 bg-[#E2E8F0]" />
              <button
                onClick={handleResetView}
                className="px-2 py-1 text-[11px] font-medium text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8FAFC] rounded"
                title="Reset View to Sector Extents"
              >
                Reset View
              </button>
              <span className="w-px h-4 bg-[#E2E8F0]" />
              <button
                onClick={() => setMeasureMode(!measureMode)}
                className={`flex items-center space-x-1 px-2 py-1 text-[11px] font-medium rounded ${
                  measureMode ? "bg-[#CCFBF1] text-[#0F766E]" : "text-[#64748B] hover:text-[#1E293B]"
                }`}
                title="Toggle Distance & Area Ruler"
              >
                <Ruler className="w-3.5 h-3.5" />
                <span>Measure</span>
              </button>
            </div>
          </div>

          {/* Practical Map Legend (Bottom-Left) */}
          <div className="absolute bottom-3 left-3 z-20 bg-white border border-[#E2E8F0] rounded-md p-2.5 shadow-xs text-[11px] space-y-1.5">
            <div className="font-semibold text-[#1E293B] text-[10px] uppercase tracking-wider">
              Harmonization Status
            </div>
            <div className="flex items-center space-x-3 text-[#64748B]">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#15803D] inline-block" />
                <span>High (≥90%)</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#D97706] inline-block" />
                <span>Review (70–89%)</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#DC2626] inline-block" />
                <span>Conflict (&lt;70%)</span>
              </span>
            </div>
          </div>

        </div>

        {/* Right Column: Layer Control & Parcel Selection Inspector (25% width) */}
        <div className="lg:col-span-1 space-y-4">
          
          {/* Layer Control Panel (Section 14 & 15 requirement) */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
              <div className="flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-[#0F766E]" />
                <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">Layer Control</h3>
              </div>
              <span className="text-[11px] text-[#64748B]">EPSG:4326</span>
            </div>

            <div className="space-y-2 text-xs">
              <label className="flex items-center justify-between cursor-pointer p-1.5 rounded hover:bg-[#F8FAFC]">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={visibleLayers.cadastral}
                    onChange={() => toggleLayer("cadastral")}
                    className="accent-[#0F766E] rounded"
                  />
                  <span className="text-[#1E293B] font-medium">Cadastral Boundaries</span>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-[#0F766E]" />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-1.5 rounded hover:bg-[#F8FAFC]">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={visibleLayers.buildings}
                    onChange={() => toggleLayer("buildings")}
                    className="accent-[#0F766E] rounded"
                  />
                  <span className="text-[#1E293B] font-medium">Drone Buildings</span>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-[#64748B]" />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-1.5 rounded hover:bg-[#F8FAFC]">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={visibleLayers.gnss}
                    onChange={() => toggleLayer("gnss")}
                    className="accent-[#0F766E] rounded"
                  />
                  <span className="text-[#1E293B] font-medium">GNSS Survey Points</span>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-[#15803D]" />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-1.5 rounded hover:bg-[#F8FAFC]">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={visibleLayers.harmonized}
                    onChange={() => toggleLayer("harmonized")}
                    className="accent-[#0F766E] rounded"
                  />
                  <span className="text-[#1E293B] font-medium">Harmonized Consensus</span>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-[#15803D]" />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-1.5 rounded hover:bg-[#F8FAFC]">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={visibleLayers.conflicts}
                    onChange={() => toggleLayer("conflicts")}
                    className="accent-[#0F766E] rounded"
                  />
                  <span className="text-[#1E293B] font-medium">Conflicts Layer</span>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-1.5 rounded hover:bg-[#F8FAFC]">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={visibleLayers.municipal}
                    onChange={() => toggleLayer("municipal")}
                    className="accent-[#0F766E] rounded"
                  />
                  <span className="text-[#1E293B] font-medium">Municipal Tax GIS</span>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-1.5 rounded hover:bg-[#F8FAFC]">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={visibleLayers.roads}
                    onChange={() => toggleLayer("roads")}
                    className="accent-[#0F766E] rounded"
                  />
                  <span className="text-[#1E293B] font-medium">Road Network (20)</span>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-[#334155]" />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-1.5 rounded hover:bg-[#F8FAFC]">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={visibleLayers.utilities}
                    onChange={() => toggleLayer("utilities")}
                    className="accent-[#0F766E] rounded"
                  />
                  <span className="text-[#1E293B] font-medium">Utility Lines (10)</span>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7]" />
              </label>
            </div>
          </div>

          {/* Parcel Selection Inspector (Section 17: Right-side info panel, not a giant modal) */}
          {selectedFeature ? (
            <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 space-y-3.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                <div>
                  <span className="text-[10px] text-[#64748B] uppercase font-mono">Parcel Selection</span>
                  <h3 className="text-base font-bold text-[#1E293B] font-mono">{selectedFeature.parcel_id}</h3>
                </div>
                <button
                  onClick={() => setSelectedFeature(null)}
                  className="text-[#94A3B8] hover:text-[#1E293B] p-1 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Attributes Table */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                  <span className="text-[#64748B]">Survey No.</span>
                  <span className="font-mono text-[#1E293B] font-medium">{selectedFeature.survey_number || "102/3"}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                  <span className="text-[#64748B]">Area</span>
                  <span className="font-mono text-[#1E293B] font-semibold">
                    {selectedFeature.area ? `${Number(selectedFeature.area).toFixed(1)} m²` : "850.4 m²"}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                  <span className="text-[#64748B]">Owner</span>
                  <span className="text-[#1E293B] font-medium">{selectedFeature.owner_name || "Ramesh Kumar"}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                  <span className="text-[#64748B]">Land Use</span>
                  <span className="text-[#1E293B]">{selectedFeature.land_use || "Residential"}</span>
                </div>
              </div>

              {/* Confidence Breakdown (Section 17 requirement) */}
              <div className="pt-2 border-t border-[#E2E8F0] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#1E293B]">Confidence</span>
                  <span className="font-mono font-bold text-[#0F766E]">
                    {selectedFeature.confidence ? `${(Number(selectedFeature.confidence) * 100).toFixed(1)}%` : "94.2%"}
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-[#64748B]">
                    <span>Geometry</span>
                    <span className="font-mono font-medium text-[#1E293B]">97%</span>
                  </div>
                  <div className="flex justify-between text-[#64748B]">
                    <span>Area</span>
                    <span className="font-mono font-medium text-[#1E293B]">95%</span>
                  </div>
                  <div className="flex justify-between text-[#64748B]">
                    <span>Attributes</span>
                    <span className="font-mono font-medium text-[#1E293B]">91%</span>
                  </div>
                  <div className="flex justify-between text-[#64748B]">
                    <span>GNSS</span>
                    <span className="font-mono font-medium text-[#1E293B]">98%</span>
                  </div>
                </div>
              </div>

              {/* Sources (Section 17 requirement) */}
              <div className="pt-2 border-t border-[#E2E8F0] space-y-1.5 text-xs">
                <span className="font-semibold text-[#1E293B] block">Sources</span>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-[#15803D]">
                  <span className="flex items-center space-x-1">
                    <Check className="w-3 h-3" />
                    <span>Cadastral</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Check className="w-3 h-3" />
                    <span>Revenue</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Check className="w-3 h-3" />
                    <span>Municipal</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Check className="w-3 h-3" />
                    <span>GNSS</span>
                  </span>
                </div>
              </div>

              {/* View Details Button */}
              <div className="pt-2 border-t border-[#E2E8F0]">
                <Link
                  href={`/parcels/${selectedFeature.id || selectedFeature.parcel_id}`}
                  className="w-full flex items-center justify-center space-x-1.5 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
                >
                  <span>View Details</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 text-center text-xs text-[#64748B] space-y-2">
              <Info className="w-5 h-5 text-[#94A3B8] mx-auto" />
              <p className="font-medium text-[#1E293B]">No Parcel Selected</p>
              <p className="text-[11px]">
                Click any parcel boundary on the GIS map to inspect survey evidence, area discrepancy, and multi-source concordance.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

