"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileCheck2,
  UserCheck,
  Calendar,
  Eye,
  Loader2,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { fetchReviews } from "@/lib/api";
import { ReviewItem } from "@/lib/types";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews()
      .then((data) => setReviews(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2E8F0] gap-4">
        <div>
          <div className="text-xs font-semibold text-[#0F766E] uppercase tracking-wider mb-1">
            Human-in-the-Loop
          </div>
          <h1 className="text-2xl font-bold text-[#1E293B]">
            Officer Attestations &amp; Review Ledger
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Complete record of administrative decisions, override justifications, and field resurvey orders signed by authorized officers
          </p>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-[#64748B] flex flex-col items-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#0F766E]" />
            <span>Loading reviews ledger...</span>
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#64748B] space-y-2">
            <FileCheck2 className="w-8 h-8 text-[#94A3B8] mx-auto" />
            <p className="font-semibold text-[#1E293B]">No Review Decisions Recorded</p>
            <p className="text-[11px]">
              Reviews are recorded when an officer attests a parcel or resolves an open conflict.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#64748B] uppercase font-semibold text-[11px] border-b border-[#E2E8F0]">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Reviewing Officer</th>
                  <th className="py-3 px-4">Parcel ID</th>
                  <th className="py-3 px-4">Decision</th>
                  <th className="py-3 px-4">Officer Statutory Remarks</th>
                  <th className="py-3 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#1E293B]">
                {reviews.map((rev) => (
                  <tr key={rev.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#64748B] whitespace-nowrap">
                      {new Date(rev.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-medium flex items-center space-x-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-[#0F766E]" />
                      <span>{rev.reviewer}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0F766E]">
                      <Link href={`/parcels/${rev.parcel_id}`} className="hover:underline">
                        {rev.parcel_id.slice(0, 12)}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#DCFCE7] text-[#15803D]">
                        {rev.decision.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#64748B] italic max-w-md truncate">
                      &quot;{rev.comment}&quot;
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/parcels/${rev.parcel_id}`}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-[#F8FAFC] text-[#0F766E] border border-[#0F766E] rounded text-xs font-semibold transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
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

