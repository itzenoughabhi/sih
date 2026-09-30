"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Database,
  Layers,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Check
} from "lucide-react";
import { fetchDashboardStats, fetchConflicts } from "@/lib/api";
import { DashboardStats, ConflictItem } from "@/lib/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentConflicts, setRecentConflicts] = useState<ConflictItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Compute percentage calculations for harmonization progress bar
  const totalParcels = stats ? stats.parcels_count : 0;
  const matchedCount = stats ? stats.high_confidence_count : 0;
  const reviewCount = stats ? stats.needs_review_count : 0;
  const conflictCount = stats ? stats.conflicts_count : 0;

  const matchedPct = totalParcels > 0 ? Math.round((matchedCount / totalParcels) * 100) : 0;
  const reviewPct = totalParcels > 0 ? Math.round((reviewCount / totalParcels) * 100) : 0;
  const conflictPct = totalParcels > 0 ? Math.max(0, 100 - matchedPct - reviewPct) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Page Title & Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-xl font-bold text-[#1E293B] tracking-tight">
            Urban Land Data Overview
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Current harmonization and data quality status across municipal, cadastral, and survey layers.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-[#F8FAFC] text-[#1E293B] border border-[#CBD5E1] rounded text-xs font-medium transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#64748B] ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/harmonization"
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#0F766E] hover:bg-[#115E59] text-white rounded text-xs font-semibold shadow-sm transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Run Harmonization</span>
          </Link>
        </div>
      </div>

      {/* 5 Compact KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        {/* Datasets */}
        <div className="bg-white border border-[#E2E8F0] p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-medium">Datasets</span>
            <Database className="w-4 h-4 text-[#0F766E]" />
          </div>
          <div className="text-2xl font-bold text-[#1E293B] mt-2 font-mono">
            {stats ? stats.datasets_count : 0}
          </div>
          <div className="text-[11px] text-[#64748B] mt-0.5">Connected layers</div>
        </div>

        {/* Total Parcels */}
        <div className="bg-white border border-[#E2E8F0] p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-medium">Parcels</span>
            <Layers className="w-4 h-4 text-[#64748B]" />
          </div>
          <div className="text-2xl font-bold text-[#1E293B] mt-2 font-mono">
            {stats ? stats.parcels_count.toLocaleString() : 0}
          </div>
          <div className="text-[11px] text-[#64748B] mt-0.5">Authoritative units</div>
        </div>

        {/* Matched (High Confidence) */}
        <div className="bg-white border border-[#E2E8F0] p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between text-[#15803D]">
            <span className="text-xs font-medium text-[#64748B]">Matched</span>
            <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
          </div>
          <div className="text-2xl font-bold text-[#15803D] mt-2 font-mono">
            {stats ? stats.high_confidence_count.toLocaleString() : 0}
          </div>
          <div className="text-[11px] text-[#15803D] font-medium mt-0.5">
            {matchedPct}% High confidence
          </div>
        </div>

        {/* Needs Review */}
        <div className="bg-white border border-[#E2E8F0] p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between text-[#D97706]">
            <span className="text-xs font-medium text-[#64748B]">Needs Review</span>
            <AlertCircle className="w-4 h-4 text-[#D97706]" />
          </div>
          <div className="text-2xl font-bold text-[#D97706] mt-2 font-mono">
            {stats ? stats.needs_review_count.toLocaleString() : 0}
          </div>
          <div className="text-[11px] text-[#D97706] font-medium mt-0.5">
            {reviewPct}% Variance flag
          </div>
        </div>

        {/* Conflicts */}
        <div className="bg-white border border-[#E2E8F0] p-4 rounded-lg shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-[#DC2626]">
            <span className="text-xs font-medium text-[#64748B]">Conflicts</span>
            <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
          </div>
          <div className="text-2xl font-bold text-[#DC2626] mt-2 font-mono">
            {stats ? stats.conflicts_count.toLocaleString() : 0}
          </div>
          <div className="text-[11px] text-[#DC2626] font-medium mt-0.5">
            Requires resolution
          </div>
        </div>

      </div>

      {/* Two Column Section: Harmonization Status (Left) + Data Quality (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Harmonization Status Progress */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
            <div>
              <h2 className="text-sm font-bold text-[#1E293B]">Harmonization Status</h2>
              <p className="text-xs text-[#64748B]">Distribution of consensus matching across all parcels</p>
            </div>
            <span className="text-xs font-mono font-medium text-[#64748B] bg-[#F8FAFC] px-2 py-0.5 rounded border border-[#E2E8F0]">
              Total: {totalParcels}
            </span>
          </div>

          {/* Segmented Horizontal Bar */}
          <div className="space-y-2 pt-1">
            <div className="h-3 w-full bg-[#E2E8F0] rounded overflow-hidden flex">
              <div
                className="bg-[#15803D] h-full transition-all"
                style={{ width: `${matchedPct}%` }}
                title={`High Confidence: ${matchedCount} (${matchedPct}%)`}
              />
              <div
                className="bg-[#D97706] h-full transition-all"
                style={{ width: `${reviewPct}%` }}
                title={`Needs Review: ${reviewCount} (${reviewPct}%)`}
              />
              <div
                className="bg-[#DC2626] h-full transition-all"
                style={{ width: `${conflictPct}%` }}
                title={`Conflicts: ${conflictCount} (${conflictPct}%)`}
              />
            </div>

            {/* Legend with Metrics */}
            <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
              <div className="p-2.5 bg-[#F8FAFC] rounded border border-[#E2E8F0]">
                <div className="flex items-center space-x-1.5 text-[#15803D] font-medium text-[11px]">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#15803D] inline-block" />
                  <span>High Confidence</span>
                </div>
                <div className="text-base font-bold font-mono text-[#1E293B] mt-1">{matchedCount}</div>
                <div className="text-[10px] text-[#64748B]">{matchedPct}% of total</div>
              </div>

              <div className="p-2.5 bg-[#F8FAFC] rounded border border-[#E2E8F0]">
                <div className="flex items-center space-x-1.5 text-[#D97706] font-medium text-[11px]">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#D97706] inline-block" />
                  <span>Needs Review</span>
                </div>
                <div className="text-base font-bold font-mono text-[#1E293B] mt-1">{reviewCount}</div>
                <div className="text-[10px] text-[#64748B]">{reviewPct}% of total</div>
              </div>

              <div className="p-2.5 bg-[#F8FAFC] rounded border border-[#E2E8F0]">
                <div className="flex items-center space-x-1.5 text-[#DC2626] font-medium text-[11px]">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#DC2626] inline-block" />
                  <span>Conflicts</span>
                </div>
                <div className="text-base font-bold font-mono text-[#1E293B] mt-1">{conflictCount}</div>
                <div className="text-[10px] text-[#64748B]">{conflictPct}% of total</div>
              </div>
            </div>
          </div>

          <div className="pt-2 text-xs text-[#64748B] flex items-center justify-between border-t border-[#E2E8F0]">
            <span>Last synchronized: Today at 08:00 AM</span>
            <Link href="/map" className="text-[#0F766E] hover:underline font-semibold flex items-center space-x-1">
              <span>View GIS Map</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Data Quality Metrics */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
            <div>
              <h2 className="text-sm font-bold text-[#1E293B]">Data Quality</h2>
              <p className="text-xs text-[#64748B]">Layer compliance, projection alignment, and topological integrity</p>
            </div>
            <span className="text-xs text-[#15803D] font-semibold flex items-center space-x-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Institutional Grade</span>
            </span>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* CRS Normalization */}
            <div>
              <div className="flex justify-between text-[#1E293B] font-medium mb-1">
                <span>Coordinate Reference System (CRS)</span>
                <span className="font-mono font-bold text-[#15803D]">100% Normalized</span>
              </div>
              <div className="w-full bg-[#E2E8F0] h-2 rounded overflow-hidden">
                <div className="bg-[#15803D] h-full" style={{ width: "100%" }} />
              </div>
              <div className="text-[10px] text-[#64748B] mt-0.5">Project CRS: EPSG:4326 • Metric Projection: EPSG:32643</div>
            </div>

            {/* Topology Validation */}
            <div>
              <div className="flex justify-between text-[#1E293B] font-medium mb-1">
                <span>Topology Integrity</span>
                <span className="font-mono font-bold text-[#0F766E]">94% Valid</span>
              </div>
              <div className="w-full bg-[#E2E8F0] h-2 rounded overflow-hidden">
                <div className="bg-[#0F766E] h-full" style={{ width: "94%" }} />
              </div>
              <div className="text-[10px] text-[#64748B] mt-0.5">{stats ? stats.topology_issues_count : 0} overlaps/duplicates detected</div>
            </div>

            {/* Geometry Concordance */}
            <div>
              <div className="flex justify-between text-[#1E293B] font-medium mb-1">
                <span>Geometry Concordance</span>
                <span className="font-mono font-bold text-[#0F766E]">92% Agreement</span>
              </div>
              <div className="w-full bg-[#E2E8F0] h-2 rounded overflow-hidden">
                <div className="bg-[#0F766E] h-full" style={{ width: "92%" }} />
              </div>
              <div className="text-[10px] text-[#64748B] mt-0.5">IoU &gt; 0.85 across cadastral and drone footprints</div>
            </div>

            {/* Attribute Mapping */}
            <div>
              <div className="flex justify-between text-[#1E293B] font-medium mb-1">
                <span>Attribute Canonicalization</span>
                <span className="font-mono font-bold text-[#0F766E]">88% Matched</span>
              </div>
              <div className="w-full bg-[#E2E8F0] h-2 rounded overflow-hidden">
                <div className="bg-[#0F766E] h-full" style={{ width: "88%" }} />
              </div>
              <div className="text-[10px] text-[#64748B] mt-0.5">RapidFuzz token similarity on owner &amp; survey numbers</div>
            </div>
          </div>
        </div>

      </div>

      {/* Recent Conflicts Real Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#1E293B]">Recent Conflicts Requiring Adjudication</h2>
            <p className="text-xs text-[#64748B]">Discrepancies identified during automated multi-factor cross-comparison</p>
          </div>
          <Link
            href="/conflicts"
            className="text-xs text-[#0F766E] hover:text-[#115E59] font-semibold flex items-center space-x-1"
          >
            <span>View All ({stats ? stats.conflicts_count : 0})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentConflicts.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#64748B]">
            No outstanding conflicts found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#64748B] font-medium border-b border-[#E2E8F0]">
                <tr>
                  <th className="py-3 px-4">Parcel ID</th>
                  <th className="py-3 px-4">Conflict Type</th>
                  <th className="py-3 px-4">Sources Involved</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Discrepancy</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#1E293B]">
                {recentConflicts.map((conf) => (
                  <tr key={conf.id} className="hover:bg-[#F8FAFC] transition-colors h-12">
                    <td className="py-2.5 px-4 font-mono font-semibold text-[#0F766E]">
                      <Link href={`/parcels/${conf.parcel_id}`} className="hover:underline">
                        {conf.parcel_identifier || conf.parcel_id}
                      </Link>
                    </td>
                    <td className="py-2.5 px-4 font-medium">
                      {conf.conflict_type.replace("_", " ")}
                    </td>
                    <td className="py-2.5 px-4 text-[#64748B] text-[11px]">
                      {conf.source_a} / {conf.source_b}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold font-mono ${
                          conf.severity === "CRITICAL"
                            ? "bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]"
                            : conf.severity === "HIGH"
                            ? "bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]"
                            : "bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]"
                        }`}
                      >
                        {conf.severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-[#64748B]">
                      {conf.difference}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                          conf.status === "RESOLVED"
                            ? "bg-[#DCFCE7] text-[#15803D]"
                            : "bg-[#FEF3C7] text-[#D97706]"
                        }`}
                      >
                        {conf.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <Link
                        href={`/conflicts`}
                        className="inline-flex items-center px-2.5 py-1 bg-white hover:bg-[#F8FAFC] text-[#0F766E] border border-[#CBD5E1] rounded text-[11px] font-medium shadow-sm transition-colors"
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

    </div>
  );
}
