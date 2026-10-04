"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileCheck2,
  UserCheck,
  Calendar,
  Eye,
  Loader2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Stamp
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
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Human-in-the-Loop Statutory Governance</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Officer Attestations &amp; Review Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically logged record of administrative decisions, override justifications, and field resurvey orders.
          </p>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="tech-card overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-500 flex flex-col items-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-teal-700" />
            <span>Loading reviews ledger from Neon PostgreSQL...</span>
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500 space-y-2">
            <FileCheck2 className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="font-semibold text-slate-800">No Review Decisions Recorded Yet</p>
            <p className="text-[11px] text-slate-400">
              Decisions are logged whenever an authorized officer adjudicates a conflict or attests a parcel.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase font-semibold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Attestation Time</th>
                  <th className="py-3.5 px-4 font-semibold">Reviewing Officer</th>
                  <th className="py-3.5 px-4 font-semibold">Parcel ID</th>
                  <th className="py-3.5 px-4 font-semibold">Decision Type</th>
                  <th className="py-3.5 px-4 font-semibold">Officer Statutory Remarks</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {reviews.map((rev) => (
                  <tr key={rev.id} className="hover:bg-slate-50/80 transition-colors h-12">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(rev.created_at).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>
                    <td className="py-3 px-4 font-medium flex items-center space-x-1.5">
                      <div className="w-6 h-6 rounded-full bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
                        <UserCheck className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-semibold text-slate-900">{rev.reviewer}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-teal-700">
                      <Link href={`/parcels/${rev.parcel_id}`} className="hover:underline">
                        {rev.parcel_id.slice(0, 12)}...
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {rev.decision.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 italic max-w-md truncate">
                      &quot;{rev.comment}&quot;
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/parcels/${rev.parcel_id}`}
                        className="inline-flex items-center space-x-1 px-3 py-1 bg-white hover:bg-teal-50 text-teal-700 border border-teal-300 rounded-md text-xs font-semibold shadow-xs transition-colors"
                      >
                        <span>Inspect</span>
                        <ArrowRight className="w-3 h-3" />
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
