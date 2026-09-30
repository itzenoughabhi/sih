"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Layers,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowRight
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
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2E8F0] gap-4">
        <div>
          <div className="text-xs font-semibold text-[#0F766E] uppercase tracking-wider mb-1">
            Cadastral Register
          </div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Urban Parcels Directory</h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Search, filter, and inspect cadastral records, multi-department evidence, and confidence ratings
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ID, Owner, Survey..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-[#E2E8F0] text-xs rounded-md pl-8 pr-3 py-1.5 text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#0F766E] w-56"
            />
          </form>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-white border border-[#E2E8F0] text-xs rounded-md px-3 py-1.5 text-[#1E293B] focus:outline-none focus:border-[#0F766E]"
          >
            <option value="">All Statuses</option>
            <option value="HIGH_CONFIDENCE">High Confidence (≥90%)</option>
            <option value="NEEDS_REVIEW">Needs Review (70–89%)</option>
            <option value="CONFLICT">Conflict (&lt;70%)</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-[#64748B] flex flex-col items-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#0F766E]" />
            <span>Loading parcels...</span>
          </div>
        ) : parcels.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#64748B]">
            No parcels match the current search or filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#64748B] uppercase font-semibold text-[11px] border-b border-[#E2E8F0]">
                <tr>
                  <th className="py-3 px-4">Parcel ID</th>
                  <th className="py-3 px-4">Survey Number</th>
                  <th className="py-3 px-4">Registered Owner</th>
                  <th className="py-3 px-4">Area (m²)</th>
                  <th className="py-3 px-4">Land Use</th>
                  <th className="py-3 px-4 text-center">Confidence</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#1E293B]">
                {parcels.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0F766E]">{p.parcel_id}</td>
                    <td className="py-3.5 px-4 font-mono text-[#64748B]">{p.survey_number || "—"}</td>
                    <td className="py-3.5 px-4 font-medium">{p.owner_name || "Unrecorded"}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold">{p.area ? `${p.area.toFixed(1)} m²` : "—"}</td>
                    <td className="py-3.5 px-4 text-[#64748B]">{p.land_use}</td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold">
                      {p.confidence !== undefined ? `${(p.confidence * 100).toFixed(0)}%` : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                          p.status === "HIGH_CONFIDENCE"
                            ? "bg-[#DCFCE7] text-[#15803D]"
                            : p.status === "NEEDS_REVIEW"
                            ? "bg-[#FEF3C7] text-[#D97706]"
                            : "bg-[#FEE2E2] text-[#DC2626]"
                        }`}
                      >
                        {p.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/parcels/${p.id}`}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-[#F8FAFC] text-[#0F766E] border border-[#0F766E] rounded text-xs font-semibold transition-colors"
                      >
                        <span>View Record</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="bg-[#F8FAFC] border-t border-[#E2E8F0] px-4 py-3 flex items-center justify-between text-xs text-[#64748B]">
          <span>Showing {parcels.length} of {total} parcels</span>
          <div className="space-x-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded bg-white border border-[#E2E8F0] text-[#1E293B] hover:bg-[#F8FAFC] disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            <span className="font-mono text-[#1E293B] font-medium">Page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={parcels.length < 25}
              className="px-3 py-1 rounded bg-white border border-[#E2E8F0] text-[#1E293B] hover:bg-[#F8FAFC] disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

