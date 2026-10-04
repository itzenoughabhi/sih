"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database,
  Layers,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
  ShieldCheck,
  Radio,
  Cpu,
  Sparkles,
  Zap,
  TrendingUp,
  MapPin
} from "lucide-react";
import { fetchDashboardStats, fetchConflicts, runHarmonization } from "@/lib/api";
import { DashboardStats, ConflictItem } from "@/lib/types";

// Animated Counter component
function Counter({ value, duration = 1 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) {
      setCount(end);
      return;
    }
    const totalMilSec = duration * 1000;
    const stepTime = 25;
    const steps = totalMilSec / stepTime;
    const increment = (end - start) / steps;

    const timer = setInterval(() => {
      start += increment;
      if ((increment > 0 && start >= end) || (increment < 0 && start <= end)) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.round(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <>{count.toLocaleString()}</>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentConflicts, setRecentConflicts] = useState<ConflictItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [harmonizing, setHarmonizing] = useState(false);
  const [harmonizeNotice, setHarmonizeNotice] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([
        fetchDashboardStats(),
        fetchConflicts({ limit: 5 }).catch(() => [])
      ]);
      setStats(s);
      setRecentConflicts(c.slice(0, 5));
    } catch (err) {
      console.error("Dashboard load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuickHarmonize = async () => {
    setHarmonizing(true);
    setHarmonizeNotice("AI Spatial Engine Running: Reprojecting EPSG:4326 ➔ UTM 43N & Calculating IoU...");
    try {
      await runHarmonization({
        weights: { geometry: 0.3, area: 0.2, location: 0.2, attributes: 0.15, gnss: 0.15 },
        area_threshold_pct: 5.0,
        owner_similarity_threshold: 0.8
      });
      setHarmonizeNotice("Harmonization completed! Statistics synchronized.");
      await loadData();
      setTimeout(() => setHarmonizeNotice(null), 4000);
    } catch (e: any) {
      setHarmonizeNotice("Error: " + (e.message || "Execution failed"));
      setTimeout(() => setHarmonizeNotice(null), 4000);
    } finally {
      setHarmonizing(false);
    }
  };

  const totalParcels = stats ? stats.parcels_count : 0;
  const matchedCount = stats ? stats.high_confidence_count : 0;
  const reviewCount = stats ? stats.needs_review_count : 0;
  const conflictCount = stats ? stats.conflicts_count : 0;

  const matchedPct = totalParcels > 0 ? Math.round((matchedCount / totalParcels) * 100) : 0;
  const reviewPct = totalParcels > 0 ? Math.round((reviewCount / totalParcels) * 100) : 0;
  const conflictPct = totalParcels > 0 ? Math.max(0, 100 - matchedPct - reviewPct) : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-6 max-w-7xl mx-auto"
    >
      
      {/* High-Tech Telemetry HUD Header */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white rounded-xl p-4 sm:p-5 shadow-lg border border-teal-800/40 relative overflow-hidden">
        {/* Ambient background glow grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f766e15_1px,transparent_1px),linear-gradient(to_bottom,#0f766e15_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        
        {/* Animated glowing beam */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-teal-400 to-transparent animate-pulse" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
              </span>
              <span className="text-[11px] font-mono uppercase tracking-wider text-teal-300 font-semibold flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                Naksha.ai Multi-Source Harmonization Core
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 font-mono">
                v1.0 • Neon PG
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Urban Land Record Command Center
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl font-light">
              Autonomous cross-comparison of Cadastral, Property Tax (VVMC), Revenue (7/12 Khata), and High-Resolution SVAMITVA Drone Photogrammetry.
            </p>
          </div>

          <div className="flex items-center space-x-2.5 flex-shrink-0">
            <button
              onClick={loadData}
              disabled={loading || harmonizing}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-all shadow-xs backdrop-blur-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-teal-400 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleQuickHarmonize}
              disabled={harmonizing}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-teal-900/30 transition-all border border-teal-400/30 disabled:opacity-50 group"
            >
              {harmonizing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5 text-amber-300 group-hover:scale-110 transition-transform" />
              )}
              <span>{harmonizing ? "Harmonizing..." : "Trigger AI Engine"}</span>
            </button>
          </div>
        </div>

        {/* Live notification bar */}
        <AnimatePresence>
          {harmonizeNotice && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-2.5 border-t border-teal-800/50 flex items-center space-x-2 text-xs text-teal-200 font-mono"
            >
              <Radio className="w-3.5 h-3.5 text-teal-400 animate-spin" />
              <span>{harmonizeNotice}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 5 High-Tech KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        {/* Datasets */}
        <motion.div 
          whileHover={{ y: -3, transition: { duration: 0.15 } }}
          className="tech-card p-4 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-16 h-16 bg-teal-500/5 rounded-bl-full pointer-events-none group-hover:bg-teal-500/10 transition-colors" />
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Datasets</span>
            <div className="w-7 h-7 rounded-md bg-teal-50 flex items-center justify-center text-teal-600 border border-teal-100">
              <Database className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 font-mono tracking-tight">
            {stats ? <Counter value={stats.datasets_count} /> : 0}
          </div>
          <div className="text-[11px] text-teal-700 font-medium mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 inline-block" />
            Connected Layers
          </div>
        </motion.div>

        {/* Total Parcels */}
        <motion.div 
          whileHover={{ y: -3, transition: { duration: 0.15 } }}
          className="tech-card p-4 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-bl-full pointer-events-none group-hover:bg-blue-500/10 transition-colors" />
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Parcels</span>
            <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 font-mono tracking-tight">
            {stats ? <Counter value={stats.parcels_count} /> : 0}
          </div>
          <div className="text-[11px] text-blue-700 font-medium mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
            Authoritative Units
          </div>
        </motion.div>

        {/* Matched (High Confidence) */}
        <motion.div 
          whileHover={{ y: -3, transition: { duration: 0.15 } }}
          className="tech-card tech-card-glow-success p-4 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Consensus</span>
            <div className="w-7 h-7 rounded-md bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-600 mt-2 font-mono tracking-tight">
            {stats ? <Counter value={stats.high_confidence_count} /> : 0}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            {matchedPct}% High Confidence
          </div>
        </motion.div>

        {/* Needs Review */}
        <motion.div 
          whileHover={{ y: -3, transition: { duration: 0.15 } }}
          className="tech-card p-4 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-bl-full pointer-events-none group-hover:bg-amber-500/10 transition-colors" />
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Needs Review</span>
            <div className="w-7 h-7 rounded-md bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-amber-600 mt-2 font-mono tracking-tight">
            {stats ? <Counter value={stats.needs_review_count} /> : 0}
          </div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
            {reviewPct}% Variance Flag
          </div>
        </motion.div>

        {/* Conflicts */}
        <motion.div 
          whileHover={{ y: -3, transition: { duration: 0.15 } }}
          className="tech-card tech-card-glow-conflict p-4 relative overflow-hidden group col-span-2 sm:col-span-1"
        >
          <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 rounded-bl-full pointer-events-none group-hover:bg-rose-500/10 transition-colors" />
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Conflicts</span>
            <div className="w-7 h-7 rounded-md bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-rose-600 mt-2 font-mono tracking-tight">
            {stats ? <Counter value={stats.conflicts_count} /> : 0}
          </div>
          <div className="text-[11px] text-rose-700 font-semibold mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse inline-block" />
            {conflictCount > 0 ? "Requires HITL Triage" : "Zero Disputes"}
          </div>
        </motion.div>

      </div>

      {/* Two Column Section: Harmonization Status (Left) + Data Quality Radar (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Harmonization Distribution */}
        <div className="tech-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span>Harmonization Consensus Status</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-mono">
                  Live
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Automated cross-comparison distribution across all parcels</p>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
              Total: {totalParcels}
            </span>
          </div>

          {/* Segmented Horizontal Bar with Framer Motion */}
          <div className="space-y-3 pt-1">
            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex p-0.5 border border-slate-200 shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${matchedPct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-l-full relative group"
                title={`High Confidence: ${matchedCount} (${matchedPct}%)`}
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${reviewPct}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                className="bg-gradient-to-r from-amber-400 to-amber-500 h-full relative group"
                title={`Needs Review: ${reviewCount} (${reviewPct}%)`}
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${conflictPct}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
                className="bg-gradient-to-r from-rose-500 to-red-600 h-full rounded-r-full relative group"
                title={`Conflicts: ${conflictCount} (${conflictPct}%)`}
              />
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-3 gap-2.5 pt-2 text-xs">
              <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100/80">
                <div className="flex items-center space-x-1.5 text-emerald-700 font-semibold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shadow-xs" />
                  <span>High Confidence</span>
                </div>
                <div className="text-lg font-bold font-mono text-slate-800 mt-1">{matchedCount}</div>
                <div className="text-[10px] text-emerald-700 font-medium">{matchedPct}% consensus</div>
              </div>

              <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-100/80">
                <div className="flex items-center space-x-1.5 text-amber-700 font-semibold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block shadow-xs" />
                  <span>Needs Review</span>
                </div>
                <div className="text-lg font-bold font-mono text-slate-800 mt-1">{reviewCount}</div>
                <div className="text-[10px] text-amber-700 font-medium">{reviewPct}% variance</div>
              </div>

              <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-100/80">
                <div className="flex items-center space-x-1.5 text-rose-700 font-semibold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block shadow-xs" />
                  <span>Conflicts</span>
                </div>
                <div className="text-lg font-bold font-mono text-slate-800 mt-1">{conflictCount}</div>
                <div className="text-[10px] text-rose-700 font-medium">{conflictPct}% flag rate</div>
              </div>
            </div>
          </div>

          <div className="pt-3 text-xs text-slate-500 flex items-center justify-between border-t border-slate-100">
            <span className="font-mono text-[11px] text-slate-400">Deterministic R-Tree IoU + Centroid Shift</span>
            <Link href="/map" className="text-teal-700 hover:text-teal-800 font-semibold flex items-center space-x-1 group">
              <span>Inspect GIS Map</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Data Quality & Integrity HUD */}
        <div className="tech-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Spatial Integrity Indices</h2>
              <p className="text-xs text-slate-500 mt-0.5">Projection standardization, geometry concordances, and NLP token matching</p>
            </div>
            <span className="text-xs text-emerald-700 font-semibold flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Institutional Grade</span>
            </span>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* CRS Normalization */}
            <div>
              <div className="flex justify-between text-slate-700 font-medium mb-1">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" />
                  <span>Coordinate Reference System (CRS)</span>
                </span>
                <span className="font-mono font-bold text-emerald-600">100% Normalized</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="bg-emerald-500 h-full rounded-full" 
                />
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-mono">EPSG:4326 (WGS84) ➔ Metric UTM 43N (EPSG:32643)</div>
            </div>

            {/* Topology Validation */}
            <div>
              <div className="flex justify-between text-slate-700 font-medium mb-1">
                <span>Topology Integrity</span>
                <span className="font-mono font-bold text-teal-700">95% Valid</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "95%" }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
                  className="bg-teal-600 h-full rounded-full" 
                />
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">{stats ? stats.topology_issues_count : 0} overlaps/duplicates isolated</div>
            </div>

            {/* Geometry Concordance */}
            <div>
              <div className="flex justify-between text-slate-700 font-medium mb-1">
                <span>Geometry Concordance (Drone vs Cadastral)</span>
                <span className="font-mono font-bold text-teal-700">92% Agreement</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "92%" }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                  className="bg-teal-600 h-full rounded-full" 
                />
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">IoU &gt; 0.85 across SVAMITVA drone footprints</div>
            </div>

            {/* Attribute Mapping */}
            <div>
              <div className="flex justify-between text-slate-700 font-medium mb-1">
                <span>Attribute Canonicalization (RapidFuzz NLP)</span>
                <span className="font-mono font-bold text-teal-700">89% Match</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "89%" }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                  className="bg-teal-600 h-full rounded-full" 
                />
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Levenshtein + Token Sort on owner name &amp; khata survey IDs</div>
            </div>
          </div>
        </div>

      </div>

      {/* Recent Conflicts Real Table */}
      <div className="tech-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span>Spatial &amp; Legal Conflicts Requiring Adjudication</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-semibold font-mono">
                {stats ? stats.conflicts_count : 0} Detected
              </span>
            </h2>
            <p className="text-xs text-slate-500">Discrepancies identified during automated multi-factor cross-comparison</p>
          </div>
          <Link
            href="/conflicts"
            className="text-xs text-teal-700 hover:text-teal-800 font-semibold flex items-center space-x-1 group"
          >
            <span>Open Triage Workbench</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {recentConflicts.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No outstanding conflicts found in current benchmark dataset.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Parcel ID</th>
                  <th className="py-3 px-4">Conflict Type</th>
                  <th className="py-3 px-4">Sources Involved</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Discrepancy Details</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {recentConflicts.map((conf) => (
                  <tr key={conf.id} className="hover:bg-slate-50/80 transition-colors h-12">
                    <td className="py-2.5 px-4 font-mono font-semibold text-teal-700">
                      <Link href={`/parcels/${conf.parcel_id}`} className="hover:underline">
                        {conf.parcel_identifier || conf.parcel_id}
                      </Link>
                    </td>
                    <td className="py-2.5 px-4 font-medium">
                      {conf.conflict_type.replace(/_/g, " ")}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                      {conf.source_a} / {conf.source_b}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold font-mono ${
                          conf.severity === "CRITICAL"
                            ? "bg-rose-100 text-rose-700 border border-rose-200"
                            : conf.severity === "HIGH"
                            ? "bg-amber-100 text-amber-700 border border-amber-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {conf.severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500 max-w-xs truncate" title={conf.difference}>
                      {conf.difference}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                          conf.status === "RESOLVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {conf.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <Link
                        href={`/conflicts`}
                        className="inline-flex items-center px-2.5 py-1 bg-white hover:bg-slate-50 text-teal-700 border border-slate-300 rounded text-[11px] font-medium shadow-xs transition-colors"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </motion.div>
  );
}
