"use client";

import { useEffect, useState } from "react";
import {
  History,
  ShieldCheck,
  User,
  Clock,
  Loader2,
  RefreshCw
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
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2E8F0] gap-4">
        <div>
          <div className="text-xs font-semibold text-[#0F766E] uppercase tracking-wider mb-1">
            Governance &amp; Statutory Compliance
          </div>
          <h1 className="text-2xl font-bold text-[#1E293B]">
            System Event &amp; Mutation Audit Log
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Immutable chronological record of dataset uploads, spatial transformations, matching runs, and officer attestations
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-[#F8FAFC] text-[#1E293B] border border-[#E2E8F0] rounded-md text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Audit Trail</span>
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-[#64748B] flex flex-col items-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#0F766E]" />
            <span>Loading audit log entries...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#64748B]">
            No audit log entries recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#64748B] uppercase font-semibold text-[11px] border-b border-[#E2E8F0]">
                <tr>
                  <th className="py-3 px-4">Event Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Actor / Officer</th>
                  <th className="py-3 px-4">Structured Audit Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#1E293B]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#64748B] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[11px] font-bold text-[#0F766E]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#1E293B] text-[11px] font-medium">{log.entity}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] font-mono text-[11px] text-[#1E293B]">
                        {log.user}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#64748B] max-w-md truncate">
                      {JSON.stringify(log.details)}
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

