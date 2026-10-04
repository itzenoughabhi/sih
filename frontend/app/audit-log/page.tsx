"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  History,
  ShieldCheck,
  User,
  Clock,
  Loader2,
  RefreshCw,
  Lock,
  FileCode2
} from "lucide-react";
import { fetchAuditLogs } from "@/lib/api";
import { AuditLogItem } from "@/lib/types";

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchAuditLogs(100);
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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
            <Lock className="w-3.5 h-3.5" />
            <span>Cryptographic Governance &amp; Statutory Integrity</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            System Event &amp; Mutation Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tamper-evident chronological timeline of dataset uploads, spatial transformations, matching runs, and officer attestations.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium shadow-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Trail</span>
        </button>
      </div>

      {/* Logs Table */}
      <div className="tech-card overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-500 flex flex-col items-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-teal-700" />
            <span>Loading audit log entries from Neon PostgreSQL...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500 space-y-1">
            <History className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-800">No Audit Trail Entries Found</p>
            <p className="text-[11px] text-slate-400">Mutations are recorded automatically as datasets and conflicts are processed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase font-semibold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Event Timestamp</th>
                  <th className="py-3.5 px-4 font-semibold">Action Executed</th>
                  <th className="py-3.5 px-4 font-semibold">Target Entity</th>
                  <th className="py-3.5 px-4 font-semibold">Actor / Officer</th>
                  <th className="py-3.5 px-4 font-semibold">Structured Audit Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors h-12">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 text-[11px] font-medium">{log.entity}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[11px] text-slate-700">
                        {log.user}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 max-w-md">
                      {typeof log.details === "object" && log.details !== null ? (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(log.details).map(([k, v]) => (
                            <span key={k} className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[10px] inline-flex items-center gap-1">
                              <span className="font-semibold text-teal-800">{k}:</span>
                              <span>{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="truncate block" title={String(log.details || "")}>
                          {String(log.details || "—")}
                        </span>
                      )}
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
