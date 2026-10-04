"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  SlidersHorizontal,
  Play,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Info,
  MapPin,
  Check,
  Layers,
  Database,
  RefreshCw,
  Sparkles,
  Cpu,
  ArrowRight,
  ShieldCheck,
  Radio,
  Zap
} from "lucide-react";
import { runHarmonization } from "@/lib/api";
import { HarmonizationRunResponse } from "@/lib/types";

export default function HarmonizationPage() {
  const [weights, setWeights] = useState({
    geometry: 30,
    area: 20,
    location: 20,
    attributes: 15,
    gnss: 15,
  });

  const [areaThreshold, setAreaThreshold] = useState(5.0);
  const [ownerThreshold, setOwnerThreshold] = useState(80);

  const [running, setRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<HarmonizationRunResponse | null>(null);
  const [activePreset, setActivePreset] = useState<string>("balanced");

  const applyPreset = (presetKey: string) => {
    setActivePreset(presetKey);
    if (presetKey === "strict") {
      setWeights({ geometry: 35, area: 25, location: 20, attributes: 10, gnss: 10 });
      setAreaThreshold(2.5);
      setOwnerThreshold(90);
    } else if (presetKey === "balanced") {
      setWeights({ geometry: 30, area: 20, location: 20, attributes: 15, gnss: 15 });
      setAreaThreshold(5.0);
      setOwnerThreshold(80);
    } else if (presetKey === "drone") {
      setWeights({ geometry: 35, area: 15, location: 20, attributes: 10, gnss: 20 });
      setAreaThreshold(8.0);
      setOwnerThreshold(70);
    }
  };

  const totalWeight =
    weights.geometry + weights.area + weights.location + weights.attributes + weights.gnss;

  const stepsList = [
    { step: 1, label: "Multi-Source Vector & Tabular Ingestion", detail: "Validates geometries & CRS across 5 departments" },
    { step: 2, label: "Autonomous CRS Reprojection", detail: "Transforms EPSG:4326 to Metric UTM 43N (EPSG:32643)" },
    { step: 3, label: "Attribute Canonicalization & NLP", detail: "RapidFuzz Levenshtein token sorting on owner names" },
    { step: 4, label: "Deterministic R-Tree IoU Matching", detail: "Polygon intersection-over-union with centroid displacement" },
    { step: 5, label: "Topology & Overlap Dispute Isolation", detail: "Self-intersection, duplicate parcel boundary checks" },
    { step: 6, label: "Confidence Scoring & Decision Matrix", detail: "Deterministic weights applied to consensus calculation" },
  ];

  const handleRun = async () => {
    setRunning(true);
    setResult(null);
    setStepIndex(1);

    const stepInterval = setInterval(() => {
      setStepIndex((prev) => (prev < 5 ? prev + 1 : prev));
    }, 500);

    try {
      const res = await runHarmonization({
        weights: {
          geometry: weights.geometry / 100.0,
          area: weights.area / 100.0,
          location: weights.location / 100.0,
          attributes: weights.attributes / 100.0,
          gnss: weights.gnss / 100.0,
        },
        area_threshold_pct: areaThreshold,
        owner_similarity_threshold: ownerThreshold / 100.0,
      });
      clearInterval(stepInterval);
      setStepIndex(6);
      setResult(res);
    } catch (err: any) {
      clearInterval(stepInterval);
      alert("Harmonization failed: " + err.message);
    } finally {
      setRunning(false);
    }
  };

  const sourceDatasets = [
    { name: "Cadastral Parcels", type: "Base Geometry", count: "100 parcels", status: "Active" },
    { name: "Municipal Property Tax", type: "Attributes", count: "100 records", status: "Active" },
    { name: "Revenue Khata (7/12)", type: "Ownership", count: "100 records", status: "Active" },
    { name: "Drone Survey Footprints", type: "Physical Geometry", count: "150 footprints", status: "Active" },
    { name: "GNSS / CORS Survey", type: "Ground Truth", count: "100 control points", status: "Active" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-6 max-w-7xl mx-auto"
    >
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-teal-700 uppercase tracking-wider mb-1">
            <Cpu className="w-3.5 h-3.5" />
            <span>AI Spatial Engine • Deterministic Multi-Source Matching</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dataset Harmonization Pipeline</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-correlate Cadastral maps with Municipal tax layers, Revenue Khatas, Drone orthomosaics, and GNSS control points.
          </p>
        </div>

        <button
          onClick={handleRun}
          disabled={running || totalWeight !== 100}
          className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-teal-700 to-teal-800 hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-md transition-all self-start sm:self-auto cursor-pointer"
        >
          {running ? (
            <Loader2 className="w-4 h-4 animate-spin text-teal-200" />
          ) : (
            <Play className="w-4 h-4 fill-white text-white" />
          )}
          <span>{running ? "Executing AI Engine..." : "Run Harmonization Engine"}</span>
        </button>
      </div>

      {/* Source Datasets Row */}
      <div className="tech-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-teal-700" />
            <h2 className="text-sm font-semibold text-slate-800">Departmental Datasets Prepared for Harmonization</h2>
          </div>
          <span className="text-xs font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
            5 Layers Synchronized
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {sourceDatasets.map((ds) => (
            <motion.div 
              key={ds.name} 
              whileHover={{ y: -2 }}
              className="p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-teal-300 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-800">{ds.name}</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-100 text-emerald-800 font-mono">
                  {ds.status}
                </span>
              </div>
              <div className="text-[11px] text-slate-500">{ds.type}</div>
              <div className="text-[11px] font-mono text-teal-700 font-semibold mt-1">{ds.count}</div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Sliders & Thresholds */}
        <div className="lg:col-span-1 space-y-5">
          
          {/* Evidence Weights Panel */}
          <div className="tech-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Scoring Weights (Total: {totalWeight}%)
                </h3>
                <p className="text-[11px] text-slate-500">Deterministic multi-criteria scoring allocation</p>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                  totalWeight === 100
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "bg-rose-100 text-rose-700 border border-rose-200"
                }`}
              >
                {totalWeight}%
              </span>
            </div>

            {/* Quick Tolerance Preset Selector */}
            <div className="space-y-1.5 pb-2 border-b border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Simulation Presets:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPreset("strict")}
                  className={`px-2 py-1.5 rounded text-[10px] font-semibold border transition-all text-center cursor-pointer ${
                    activePreset === "strict"
                      ? "bg-teal-700 text-white border-teal-800 shadow-2xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  Strict Statutory
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("balanced")}
                  className={`px-2 py-1.5 rounded text-[10px] font-semibold border transition-all text-center cursor-pointer ${
                    activePreset === "balanced"
                      ? "bg-teal-700 text-white border-teal-800 shadow-2xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  Balanced Base
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("drone")}
                  className={`px-2 py-1.5 rounded text-[10px] font-semibold border transition-all text-center cursor-pointer ${
                    activePreset === "drone"
                      ? "bg-teal-700 text-white border-teal-800 shadow-2xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  Drone Focus
                </button>
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between text-slate-700 mb-1 font-medium">
                  <span>Geometry IoU Overlap</span>
                  <span className="font-mono font-bold text-teal-700">{weights.geometry}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.geometry}
                  onChange={(e) => setWeights({ ...weights, geometry: Number(e.target.value) })}
                  className="w-full accent-teal-700"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-700 mb-1 font-medium">
                  <span>Area Concordance</span>
                  <span className="font-mono font-bold text-teal-700">{weights.area}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.area}
                  onChange={(e) => setWeights({ ...weights, area: Number(e.target.value) })}
                  className="w-full accent-teal-700"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-700 mb-1 font-medium">
                  <span>Location / Centroid Proximity</span>
                  <span className="font-mono font-bold text-teal-700">{weights.location}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.location}
                  onChange={(e) => setWeights({ ...weights, location: Number(e.target.value) })}
                  className="w-full accent-teal-700"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-700 mb-1 font-medium">
                  <span>Attribute Similarity (RapidFuzz NLP)</span>
                  <span className="font-mono font-bold text-teal-700">{weights.attributes}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.attributes}
                  onChange={(e) => setWeights({ ...weights, attributes: Number(e.target.value) })}
                  className="w-full accent-teal-700"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-700 mb-1 font-medium">
                  <span>GNSS Ground-Truth Proximity</span>
                  <span className="font-mono font-bold text-teal-700">{weights.gnss}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.gnss}
                  onChange={(e) => setWeights({ ...weights, gnss: Number(e.target.value) })}
                  className="w-full accent-teal-700"
                />
              </div>
            </div>
          </div>

          {/* Conflict Thresholds Panel */}
          <div className="tech-card p-5 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Conflict Trigger Thresholds
              </h3>
              <p className="text-[11px] text-slate-500">Autonomous criteria for flagging legal/spatial discrepancies</p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between text-slate-700 mb-1 font-medium">
                  <span>Area Delta Conflict Threshold</span>
                  <span className="font-mono font-semibold text-teal-700">&gt; {areaThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.5"
                  value={areaThreshold}
                  onChange={(e) => setAreaThreshold(Number(e.target.value))}
                  className="w-full accent-teal-700"
                />
                <p className="text-[10px] text-slate-400 mt-1">Area difference beyond this triggers Area Mismatch conflict.</p>
              </div>

              <div>
                <div className="flex justify-between text-slate-700 mb-1 font-medium">
                  <span>Owner Name Match Threshold</span>
                  <span className="font-mono font-semibold text-teal-700">&lt; {ownerThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  value={ownerThreshold}
                  onChange={(e) => setOwnerThreshold(Number(e.target.value))}
                  className="w-full accent-teal-700"
                />
                <p className="text-[10px] text-slate-400 mt-1">String similarity below this flags an Owner Mismatch.</p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Execution Status & Results */}
        <div className="lg:col-span-2 space-y-5">
          
          {/* Animated Pipeline Step Indicator */}
          <div className="tech-card p-5 space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${running ? "bg-teal-500 animate-ping" : "bg-teal-700"}`} />
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Autonomous Pipeline Execution Sequence
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {running ? "R-Tree Spatial Indexing Active" : "Spatial Engine • Standby"}
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                {running ? "Executing algorithm..." : result ? "Completed successfully" : "Ready"}
              </span>
            </div>

            <div className="space-y-2.5">
              {stepsList.map((s) => {
                const isPassed = (stepIndex > s.step) || (result !== null);
                const isCurrent = stepIndex === s.step && running;

                return (
                  <motion.div
                    key={s.step}
                    initial={false}
                    animate={{
                      scale: isCurrent ? 1.01 : 1,
                      backgroundColor: isCurrent ? "#F0FDFA" : isPassed ? "#F8FAFC" : "#FFFFFF"
                    }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-center justify-between p-3.5 rounded-lg text-xs border transition-colors relative overflow-hidden ${
                      isCurrent
                        ? "border-teal-500 shadow-xs"
                        : isPassed
                        ? "border-slate-200 text-slate-800"
                        : "border-slate-200 text-slate-400"
                    }`}
                  >
                    {/* Laser scanning beam on active step */}
                    {isCurrent && (
                      <div className="absolute top-0 bottom-0 left-0 w-1 bg-teal-500 shadow-[0_0_8px_#0f766e]" />
                    )}

                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center font-mono text-[11px] font-bold transition-colors ${
                          isPassed
                            ? "bg-emerald-100 text-emerald-800"
                            : isCurrent
                            ? "bg-teal-700 text-white animate-pulse"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {isPassed ? <Check className="w-3.5 h-3.5" /> : s.step}
                      </div>
                      <div>
                        <span className={`font-semibold ${isCurrent ? "text-teal-800" : isPassed ? "text-slate-800" : "text-slate-500"}`}>
                          {s.label}
                        </span>
                        <p className="text-[10px] text-slate-400">{s.detail}</p>
                      </div>
                    </div>

                    <div className="text-[11px] font-medium font-mono">
                      {isPassed && <span className="text-emerald-700 font-semibold">Completed ✓</span>}
                      {isCurrent && <span className="text-teal-700 font-semibold animate-pulse">Computing...</span>}
                      {!isPassed && !isCurrent && <span className="text-slate-400">Standby</span>}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Results Summary Box with High-Tech Celebration Animation */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="bg-gradient-to-br from-white to-teal-50/40 border border-teal-200 rounded-xl p-5 shadow-lg shadow-teal-900/5 space-y-5"
              >
                <div className="flex items-center justify-between border-b border-teal-100 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Harmonization Cycle Completed</h3>
                      <p className="text-[11px] text-slate-500 font-mono">Job ID: {result.job_id} • Processing time: {result.duration_seconds}s</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono">
                    SUCCESS
                  </span>
                </div>

                {/* 4 Metric Highlights */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs">
                    <div className="text-slate-500 text-[11px] font-medium">Total Processed</div>
                    <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">{result.total_processed}</div>
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 shadow-xs">
                    <div className="text-emerald-700 text-[11px] font-medium">High Confidence</div>
                    <div className="text-2xl font-bold text-emerald-700 mt-1 font-mono">{result.high_confidence_matches}</div>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 shadow-xs">
                    <div className="text-amber-700 text-[11px] font-medium">Needs Review</div>
                    <div className="text-2xl font-bold text-amber-700 mt-1 font-mono">{result.review_required}</div>
                  </div>

                  <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 shadow-xs">
                    <div className="text-rose-700 text-[11px] font-medium">Conflicts Detected</div>
                    <div className="text-2xl font-bold text-rose-700 mt-1 font-mono">{result.conflicts_detected}</div>
                  </div>
                </div>

                {/* Action CTAs */}
                <div className="flex flex-wrap items-center justify-between pt-2 gap-3 border-t border-teal-100">
                  <div className="text-xs text-slate-600">
                    Detected <span className="font-bold text-rose-700 font-mono">{result.topology_issues}</span> topology anomalies (overlaps / duplicates).
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      href="/map"
                      className="flex items-center space-x-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>View GIS Map</span>
                    </Link>
                    <Link
                      href="/conflicts"
                      className="flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Adjudicate Conflicts ({result.conflicts_detected})</span>
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!result && !running && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-500 space-y-2">
              <Info className="w-6 h-6 text-slate-400 mx-auto" />
              <p className="font-medium text-slate-800">Ready to execute spatial matching.</p>
              <p className="text-slate-500 text-[11px] max-w-md mx-auto">
                Click &quot;Run Harmonization Engine&quot; above to cross-correlate Cadastral parcels with Municipal tax, Drone, and GNSS layers.
              </p>
            </div>
          )}

        </div>

      </div>

    </motion.div>
  );
}
