"use client";

import { useState } from "react";
import Link from "next/link";
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
  FileCheck
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

  const totalWeight =
    weights.geometry + weights.area + weights.location + weights.attributes + weights.gnss;

  const stepsList = [
    { step: 1, label: "Dataset validation" },
    { step: 2, label: "CRS normalization (UTM 43N)" },
    { step: 3, label: "Attribute mapping & linguistic token sort" },
    { step: 4, label: "Spatial matching & R-Tree IoU computation" },
    { step: 5, label: "Conflict analysis & topology validation" },
    { step: 6, label: "Confidence scoring & deterministic XAI" },
  ];

  const handleRun = async () => {
    setRunning(true);
    setResult(null);
    setStepIndex(1);

    const stepInterval = setInterval(() => {
      setStepIndex((prev) => (prev < 5 ? prev + 1 : prev));
    }, 400);

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
    { name: "Cadastral Parcels", type: "Base Geometry", count: "4,821 parcels", status: "Connected" },
    { name: "Municipal Property Tax", type: "Attributes", count: "4,810 records", status: "Connected" },
    { name: "Revenue Khata Records", type: "Ownership", count: "4,795 records", status: "Connected" },
    { name: "Drone Survey Footprints", type: "Physical Geometry", count: "8,231 footprints", status: "Connected" },
    { name: "CORS / GNSS Control Points", type: "Ground Truth", count: "312 stations", status: "Connected" },
  ];

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2E8F0] gap-4">
        <div>
          <div className="text-xs font-semibold text-[#0F766E] uppercase tracking-wider mb-1">
            Data Harmonization Engine
          </div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Dataset Harmonization</h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Integrate multi-source cadastral, municipal, drone, and GNSS layers with deterministic spatial matching
          </p>
        </div>

        <button
          onClick={handleRun}
          disabled={running || totalWeight !== 100}
          className="flex items-center space-x-2 px-4 py-2.5 bg-[#0F766E] hover:bg-[#115E59] disabled:opacity-50 text-white rounded-md text-xs font-semibold shadow-sm transition-colors self-start sm:self-auto"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
          <span>{running ? "Processing Pipeline..." : "Run Harmonization"}</span>
        </button>
      </div>

      {/* Source Datasets Row (Section 13 requirement) */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-[#0F766E]" />
            <h2 className="text-sm font-semibold text-[#1E293B]">Source Datasets Prepared for Harmonization</h2>
          </div>
          <span className="text-xs text-[#64748B]">5 datasets active</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {sourceDatasets.map((ds) => (
            <div key={ds.name} className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[#1E293B]">{ds.name}</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#DCFCE7] text-[#15803D]">
                  Ready
                </span>
              </div>
              <div className="text-[11px] text-[#64748B]">{ds.type}</div>
              <div className="text-[11px] font-mono text-[#0F766E] font-medium mt-1">{ds.count}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Sliders & Thresholds */}
        <div className="lg:col-span-1 space-y-5">
          
          {/* Evidence Weights Panel */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">
                  Evidence Weights (Total: {totalWeight}%)
                </h3>
                <p className="text-[11px] text-[#64748B]">Deterministic multi-criteria scoring allocation</p>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                  totalWeight === 100
                    ? "bg-[#DCFCE7] text-[#15803D] border border-[#bbf7d0]"
                    : "bg-[#FEE2E2] text-[#DC2626] border border-[#fecaca]"
                }`}
              >
                {totalWeight}%
              </span>
            </div>

            {/* Sliders */}
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between text-[#1E293B] mb-1 font-medium">
                  <span>Geometry IoU Overlap</span>
                  <span className="font-mono font-bold text-[#0F766E]">{weights.geometry}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.geometry}
                  onChange={(e) => setWeights({ ...weights, geometry: Number(e.target.value) })}
                  className="w-full accent-[#0F766E]"
                />
              </div>

              <div>
                <div className="flex justify-between text-[#1E293B] mb-1 font-medium">
                  <span>Area Concordance</span>
                  <span className="font-mono font-bold text-[#0F766E]">{weights.area}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.area}
                  onChange={(e) => setWeights({ ...weights, area: Number(e.target.value) })}
                  className="w-full accent-[#0F766E]"
                />
              </div>

              <div>
                <div className="flex justify-between text-[#1E293B] mb-1 font-medium">
                  <span>Location / Centroid Proximity</span>
                  <span className="font-mono font-bold text-[#0F766E]">{weights.location}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.location}
                  onChange={(e) => setWeights({ ...weights, location: Number(e.target.value) })}
                  className="w-full accent-[#0F766E]"
                />
              </div>

              <div>
                <div className="flex justify-between text-[#1E293B] mb-1 font-medium">
                  <span>Owner &amp; ID Linguistic Match</span>
                  <span className="font-mono font-bold text-[#0F766E]">{weights.attributes}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.attributes}
                  onChange={(e) => setWeights({ ...weights, attributes: Number(e.target.value) })}
                  className="w-full accent-[#0F766E]"
                />
              </div>

              <div>
                <div className="flex justify-between text-[#1E293B] mb-1 font-medium">
                  <span>GNSS Ground Truth Proximity</span>
                  <span className="font-mono font-bold text-[#0F766E]">{weights.gnss}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.gnss}
                  onChange={(e) => setWeights({ ...weights, gnss: Number(e.target.value) })}
                  className="w-full accent-[#0F766E]"
                />
              </div>
            </div>

            <button
              onClick={() =>
                setWeights({ geometry: 30, area: 20, location: 20, attributes: 15, gnss: 15 })
              }
              className="text-[11px] text-[#0F766E] hover:underline"
            >
              Reset to Standard Weights
            </button>
          </div>

          {/* Tolerance Controls */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-3.5 text-xs">
            <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider border-b border-[#E2E8F0] pb-2">
              Conflict Detection Thresholds
            </h3>

            <div>
              <div className="flex justify-between text-[#1E293B] mb-1 font-medium">
                <span>Area Discrepancy Trigger</span>
                <span className="font-mono font-semibold text-[#D97706]">&gt; {areaThreshold}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                step="0.5"
                value={areaThreshold}
                onChange={(e) => setAreaThreshold(Number(e.target.value))}
                className="w-full accent-[#D97706]"
              />
              <p className="text-[11px] text-[#64748B] mt-1">Variances above this percentage flag an Area Conflict.</p>
            </div>

            <div>
              <div className="flex justify-between text-[#1E293B] mb-1 font-medium">
                <span>Owner Name Similarity Threshold</span>
                <span className="font-mono font-semibold text-[#0F766E]">&lt; {ownerThreshold}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                value={ownerThreshold}
                onChange={(e) => setOwnerThreshold(Number(e.target.value))}
                className="w-full accent-[#0F766E]"
              />
              <p className="text-[11px] text-[#64748B] mt-1">String similarity below this flags an Owner Mismatch.</p>
            </div>
          </div>

        </div>

        {/* Right Column: Execution Status & Results */}
        <div className="lg:col-span-2 space-y-5">
          
          {/* Restrained Step Indicator (Section 13 requirement) */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">
                Harmonization Pipeline Steps
              </h3>
              <span className="text-[11px] text-[#64748B]">
                {running ? "Executing pipeline..." : result ? "Completed successfully" : "Ready"}
              </span>
            </div>

            <div className="space-y-2.5">
              {stepsList.map((s) => {
                const isPassed = (stepIndex > s.step) || (result !== null);
                const isCurrent = stepIndex === s.step && running;

                return (
                  <div
                    key={s.step}
                    className={`flex items-center justify-between p-3 rounded-md text-xs border transition-colors ${
                      isCurrent
                        ? "bg-[#CCFBF1] border-[#0F766E] text-[#0F766E]"
                        : isPassed
                        ? "bg-[#F8FAFC] border-[#E2E8F0] text-[#1E293B]"
                        : "bg-white border-[#E2E8F0] text-[#94A3B8]"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center font-mono text-[11px] font-bold ${
                          isPassed
                            ? "bg-[#DCFCE7] text-[#15803D]"
                            : isCurrent
                            ? "bg-[#0F766E] text-white"
                            : "bg-[#F1F5F9] text-[#94A3B8]"
                        }`}
                      >
                        {isPassed ? <Check className="w-3.5 h-3.5" /> : s.step}
                      </div>
                      <span className="font-medium">{s.label}</span>
                    </div>

                    <div className="text-[11px] font-medium">
                      {isPassed && <span className="text-[#15803D]">Completed ✓</span>}
                      {isCurrent && <span className="text-[#0F766E]">Processing...</span>}
                      {!isPassed && !isCurrent && <span>Pending</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Results Summary Box */}
          {result && (
            <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-5">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-[#15803D]" />
                  <div>
                    <h3 className="text-sm font-bold text-[#1E293B]">Harmonization Cycle Completed</h3>
                    <p className="text-[11px] text-[#64748B] font-mono">Job ID: {result.job_id} • Processing time: {result.duration_seconds} sec</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-[#DCFCE7] text-[#15803D]">
                  SUCCESS
                </span>
              </div>

              {/* 4 Metric Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-[#F8FAFC] rounded-md border border-[#E2E8F0]">
                  <div className="text-[#64748B] text-[11px] font-medium">Total Processed</div>
                  <div className="text-xl font-bold text-[#1E293B] mt-1 font-mono">{result.total_processed}</div>
                </div>

                <div className="p-3 bg-[#DCFCE7]/30 rounded-md border border-[#bbf7d0]">
                  <div className="text-[#15803D] text-[11px] font-medium">High Confidence</div>
                  <div className="text-xl font-bold text-[#15803D] mt-1 font-mono">{result.high_confidence_matches}</div>
                </div>

                <div className="p-3 bg-[#FEF3C7]/40 rounded-md border border-[#fde68a]">
                  <div className="text-[#D97706] text-[11px] font-medium">Needs Review</div>
                  <div className="text-xl font-bold text-[#D97706] mt-1 font-mono">{result.review_required}</div>
                </div>

                <div className="p-3 bg-[#FEE2E2]/40 rounded-md border border-[#fecaca]">
                  <div className="text-[#DC2626] text-[11px] font-medium">Conflicts Detected</div>
                  <div className="text-xl font-bold text-[#DC2626] mt-1 font-mono">{result.conflicts_detected}</div>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap items-center justify-between pt-2 gap-3 border-t border-[#E2E8F0]">
                <div className="text-xs text-[#64748B]">
                  Detected <span className="font-semibold text-[#1E293B]">{result.topology_issues}</span> topology anomalies (overlaps / duplicates).
                </div>
                <div className="flex items-center space-x-2">
                  <Link
                    href="/map"
                    className="flex items-center space-x-1.5 px-3 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-md text-xs font-semibold shadow-sm transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>View GIS Map</span>
                  </Link>
                  <Link
                    href="/conflicts"
                    className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-[#FEE2E2]/30 text-[#DC2626] border border-[#fecaca] rounded-md text-xs font-semibold transition-colors"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Review Conflicts ({result.conflicts_detected})</span>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {!result && !running && (
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-8 text-center text-xs text-[#64748B] space-y-2">
              <Info className="w-6 h-6 text-[#94A3B8] mx-auto" />
              <p className="font-medium text-[#1E293B]">Ready to execute spatial matching.</p>
              <p className="text-[#64748B] text-[11px]">
                Click &quot;Run Harmonization&quot; to correlate Cadastral parcels with Municipal tax, Drone, and GNSS layers.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

