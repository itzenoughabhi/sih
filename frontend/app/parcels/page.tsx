"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Layers,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Building,
  FileText,
  FileCheck
} from "lucide-react";
import { fetchParcels } from "@/lib/api";
import { ParcelListItem } from "@/lib/types";

export default function ParcelsListPage() {
  const [parcels, setParcels] = useState<ParcelListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchParcels({
        status: statusFilter || undefined,
        search: searchTerm || undefined,
        page: page,
        limit: 25,
      });
      setParcels(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-6 max-w-7xl mx-auto"
    >
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-teal-700 uppercase tracking-wider mb-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Harmonized Cadastral Records</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Urban Parcels Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Authoritative land unit directory with multi-factor confidence ratings and cross-department attestation.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Parcel ID, Owner, Survey..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-slate-300 text-xs rounded-lg pl-8 pr-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 w-full shadow-xs"
            />
          </form>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-white border border-slate-300 text-xs rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-600 w-full sm:w-auto shadow-xs font-medium"
          >
            <option value="">All Statuses</option>
            <option value="HIGH_CONFIDENCE">High Confidence (≥90%)</option>
            <option value="NEEDS_REVIEW">Needs Review (70–89%)</option>
            <option value="CONFLICT">Conflict (&lt;70%)</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="tech-card overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-500 flex flex-col items-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-teal-700" />
            <span>Loading parcels from Neon PostgreSQL...</span>
          </div>
        ) : parcels.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500 space-y-1">
            <Layers className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-800">No parcels found</p>
            <p className="text-[11px] text-slate-400">Try adjusting your search query or status filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase font-semibold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Parcel ID</th>
                  <th className="py-3 px-4">Survey Number</th>
                  <th className="py-3 px-4">Registered Owner</th>
                  <th className="py-3 px-4 font-mono">Area (m²)</th>
                  <th className="py-3 px-4">Land Use</th>
                  <th className="py-3 px-4 text-center">Consensus Score</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {parcels.map((p) => {
                  const confPct = p.confidence !== undefined ? Math.round(p.confidence * 100) : 0;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors h-12">
                      <td className="py-3 px-4 font-mono font-bold text-teal-700">
                        <Link href={`/parcels/${p.id}`} className="hover:underline">
                          {p.parcel_id}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">{p.survey_number || "—"}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">{p.owner_name || "Unrecorded"}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">{p.area ? `${p.area.toFixed(1)} m²` : "—"}</td>
                      <td className="py-3 px-4 text-slate-500">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
                          {p.land_use || "RESIDENTIAL"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 font-mono font-bold">
                          <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${
                                confPct >= 90 ? "bg-emerald-500" : confPct >= 70 ? "bg-amber-500" : "bg-rose-500"
                              }`} 
                              style={{ width: `${confPct}%` }}
                            />
                          </div>
                          <span className={`text-[11px] ${
                            confPct >= 90 ? "text-emerald-700" : confPct >= 70 ? "text-amber-700" : "text-rose-700"
                          }`}>
                            {confPct}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            p.status === "HIGH_CONFIDENCE"
                              ? "bg-emerald-100 text-emerald-800"
                              : p.status === "NEEDS_REVIEW"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {p.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <Link
                          href={`/parcels/${p.id}/certificate`}
                          target="_blank"
                          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md text-xs font-semibold shadow-xs transition-colors"
                        >
                          <FileCheck className="w-3.5 h-3.5 text-emerald-700" />
                          <span>RoR Certificate</span>
                        </Link>
                        <Link
                          href={`/parcels/${p.id}`}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-teal-50 text-teal-700 border border-teal-300 rounded-md text-xs font-semibold shadow-xs transition-colors"
                        >
                          <span>Card</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="bg-slate-50/80 border-t border-slate-200 px-4 py-3 flex items-center justify-between text-xs text-slate-500">
          <span>Showing <span className="font-semibold text-slate-800">{parcels.length}</span> of <span className="font-semibold text-slate-800">{total}</span> cadastral units</span>
          <div className="space-x-1.5 flex items-center">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors font-medium shadow-xs"
            >
              Previous
            </button>
            <span className="font-mono text-slate-800 font-bold px-2">Page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={parcels.length < 25}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors font-medium shadow-xs"
            >
              Next
            </button>
          </div>
        </div>
      </div>

    </motion.div>
  );
}
