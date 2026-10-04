"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Filter,
  Eye,
  Check,
  X,
  FileCheck2,
  Loader2,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  MapPin,
  FileText,
  Radio,
  SlidersHorizontal,
  Compass,
  Sparkles,
  Languages,
  FileCheck
} from "lucide-react";
import { fetchConflicts, resolveConflict, fetchAiDisputeAdvice } from "@/lib/api";
import { ConflictItem } from "@/lib/types";

export default function ConflictsPage() {
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState("OPEN");
  const [severityFilter, setSeverityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Drawer Selected Conflict
  const [selectedConflict, setSelectedConflict] = useState<ConflictItem | null>(null);
  const [resolving, setResolving] = useState(false);
  const [officerNotes, setOfficerNotes] = useState("");

  // AI Advisor State
  const [aiAdvice, setAiAdvice] = useState<any>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [language, setLanguage] = useState<"en" | "hi">("en");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchConflicts({
        status: statusFilter || undefined,
        severity: severityFilter || undefined,
        type: typeFilter || undefined,
      });
      setConflicts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, severityFilter, typeFilter]);

  useEffect(() => {
    if (!selectedConflict) {
      setAiAdvice(null);
      return;
    }
    setLoadingAi(true);
    fetchAiDisputeAdvice(selectedConflict.id)
      .then((data) => setAiAdvice(data))
      .catch((err) => console.error("Failed to load AI advice:", err))
      .finally(() => setLoadingAi(false));
  }, [selectedConflict]);

  const handleAction = async (decisionType: string, defaultNote: string) => {
    if (!selectedConflict) return;
    setResolving(true);
    try {
      await resolveConflict(selectedConflict.id, {
        decision: decisionType,
        resolution_notes: officerNotes || defaultNote,
        reviewer: "GIS Officer / Tehsildar",
      });
      setSelectedConflict(null);
      setOfficerNotes("");
      await loadData();
    } catch (err: any) {
      alert("Failed to submit decision: " + err.message);
    } finally {
      setResolving(false);
    }
  };

  const totalCount = conflicts.length;
  const criticalCount = conflicts.filter((c) => c.severity === "CRITICAL").length;
  const reviewCount = conflicts.filter((c) => c.status === "OPEN" && c.severity !== "CRITICAL").length;
  const resolvedCount = conflicts.filter((c) => c.status === "RESOLVED").length;

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
          <div className="flex items-center space-x-2 text-xs font-semibold text-rose-700 uppercase tracking-wider mb-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>HITL Quality Assurance &amp; Legal Adjudication</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Spatial &amp; Legal Conflict Triage</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Human-in-the-Loop review workbench for boundary shifts, area discrepancies, and ownership mismatches.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:border-teal-600 shadow-xs"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open Only</option>
            <option value="RESOLVED">Resolved Only</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:border-teal-600 shadow-xs"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:border-teal-600 shadow-xs"
          >
            <option value="">All Discrepancy Types</option>
            <option value="AREA_MISMATCH">Area Mismatch</option>
            <option value="GEOMETRY_SHIFT">Geometry Shift</option>
            <option value="TOPOLOGY_VIOLATION">Topology Violation</option>
            <option value="OWNER_MISMATCH">Owner Name Mismatch</option>
            <option value="MISSING_ATTRIBUTES">Missing Attributes</option>
          </select>
        </div>
      </div>

      {/* Patwari AI Assistant Banner */}
      <div className="p-4 bg-gradient-to-r from-teal-500/10 via-indigo-500/10 to-transparent border border-teal-200 rounded-xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-teal-700 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center space-x-2">
              <span>Patwari AI Legal &amp; Survey Advisor Active</span>
              <span className="px-2 py-0.2 bg-teal-100 text-teal-800 text-[10px] font-mono rounded font-semibold">
                Sec 40, 41 LRC &amp; SVAMITVA Heuristics
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Select any conflict below to open bilingual (English / हिंदी) legal guidance, sensor GSD offsets, and 1-click official RoR certificates.
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center space-x-2 text-xs font-semibold text-teal-800 bg-white/80 px-3 py-1.5 rounded-lg border border-teal-200">
          <Languages className="w-3.5 h-3.5" />
          <span>Bilingual EN / HI</span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="tech-card p-4">
          <div className="text-xs text-slate-500 font-medium">Filtered Conflicts</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{totalCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Active triage list</div>
        </div>

        <div className="tech-card tech-card-glow-conflict p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-rose-700 font-medium">Critical Overlaps</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-600 mt-1">{criticalCount}</div>
          <div className="text-[10px] text-rose-700 font-semibold mt-0.5">Requires Immediate Action</div>
        </div>

        <div className="tech-card p-4">
          <div className="text-xs text-amber-700 font-medium">Under Review</div>
          <div className="text-2xl font-bold font-mono text-amber-600 mt-1">{reviewCount}</div>
          <div className="text-[10px] text-amber-700 font-medium mt-0.5">Medium / High Variance</div>
        </div>

        <div className="tech-card tech-card-glow-success p-4">
          <div className="text-xs text-emerald-700 font-medium">Statutory Resolved</div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">{resolvedCount}</div>
          <div className="text-[10px] text-emerald-700 font-medium mt-0.5">Attested by Officer</div>
        </div>
      </div>

      {/* Conflicts Table */}
      <div className="tech-card overflow-hidden">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2 text-xs text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
            <span>Loading conflicts from Neon PostgreSQL...</span>
          </div>
        ) : conflicts.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 space-y-1">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="font-semibold text-slate-800 text-sm">No Conflicts Match Filters</p>
            <p className="text-[11px] text-slate-400">All parcels conform within acceptable tolerance levels.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Parcel Identifier</th>
                  <th className="py-3.5 px-4 font-semibold">Conflict Classification</th>
                  <th className="py-3.5 px-4 font-semibold">Divergent Layers</th>
                  <th className="py-3.5 px-4 font-semibold">Discrepancy Details</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Severity</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Adjudicate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {conflicts.map((conf) => (
                  <tr
                    key={conf.id}
                    onClick={() => setSelectedConflict(conf)}
                    className={`hover:bg-teal-50/40 cursor-pointer transition-colors ${
                      selectedConflict?.id === conf.id ? "bg-teal-50/80 border-l-2 border-teal-600" : ""
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-700">
                      {conf.parcel_identifier || conf.parcel_id}
                    </td>
                    <td className="py-3.5 px-4 font-medium">
                      {conf.conflict_type.replace(/_/g, " ")}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {conf.source_a} <span className="text-slate-300">vs</span> {conf.source_b}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 max-w-xs truncate" title={conf.difference}>
                      {conf.difference}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          conf.severity === "CRITICAL"
                            ? "bg-rose-100 text-rose-700 border border-rose-200"
                            : conf.severity === "HIGH"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {conf.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                          conf.status === "RESOLVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {conf.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedConflict(conf)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gradient-to-r from-teal-50 to-indigo-50 hover:from-teal-100 hover:to-indigo-100 text-teal-800 border border-teal-300 rounded-md text-xs font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
                        <span>Patwari AI Review</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adjudication Side Drawer with High-Tech Modal Styling */}
      <AnimatePresence>
        {selectedConflict && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedConflict(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg bg-white border-l border-slate-200 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto z-10"
            >
              <div className="space-y-5">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Statutory Conflict Triage</span>
                    <h3 className="text-xl font-bold text-slate-900 font-mono mt-0.5">
                      {selectedConflict.parcel_identifier || selectedConflict.parcel_id}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedConflict(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Discrepancy Breakdown Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      {selectedConflict.conflict_type.replace(/_/g, " ")}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-100 text-rose-700 border border-rose-200">
                      {selectedConflict.severity} SEVERITY
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">{selectedConflict.source_a}:</span>
                      <span className="font-mono text-slate-900 font-semibold">Authoritative Baseline</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">{selectedConflict.source_b}:</span>
                      <span className="font-mono text-slate-900 font-semibold">Comparison Layer</span>
                    </div>
                    <div className="p-2.5 bg-rose-50/80 rounded-lg border border-rose-100 text-rose-800 font-mono text-[11px]">
                      <span className="font-semibold block mb-0.5">Difference Signal:</span>
                      {selectedConflict.difference}
                    </div>
                  </div>
                </div>

                {/* Patwari AI Legal & Survey Advisor */}
                <div className="p-4 bg-gradient-to-br from-indigo-50/90 via-teal-50/70 to-slate-50 border border-teal-200/90 rounded-xl text-xs space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-teal-900 font-bold uppercase text-[11px] tracking-wider">
                      <Sparkles className="w-4 h-4 text-teal-600 animate-pulse" />
                      <span>Patwari AI Legal &amp; Survey Advisor</span>
                    </div>

                    {/* Language Switcher */}
                    <div className="flex items-center space-x-1 bg-white/80 p-0.5 rounded-md border border-slate-200 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setLanguage("en")}
                        className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                          language === "en" ? "bg-teal-700 text-white" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        English
                      </button>
                      <button
                        type="button"
                        onClick={() => setLanguage("hi")}
                        className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                          language === "hi" ? "bg-teal-700 text-white" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        हिंदी
                      </button>
                    </div>
                  </div>

                  {loadingAi ? (
                    <div className="py-4 flex items-center justify-center space-x-2 text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                      <span>Synthesizing Land Revenue Code &amp; SVAMITVA Guidelines...</span>
                    </div>
                  ) : aiAdvice ? (
                    <div className="space-y-2.5">
                      {/* Legal Section Badge */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-indigo-100/90 text-indigo-900 font-mono text-[10px] font-bold border border-indigo-200">
                          ⚖️ {aiAdvice.legal_provisions}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px] font-semibold border border-emerald-200">
                          🛰️ {aiAdvice.regulatory_guidelines}
                        </span>
                      </div>

                      {/* Explanation */}
                      <p className="text-slate-700 text-[11px] leading-relaxed bg-white/70 p-2.5 rounded-lg border border-slate-200/60 font-medium">
                        {language === "hi" ? aiAdvice.summary_hi : aiAdvice.summary_en}
                      </p>

                      {/* Technical Findings */}
                      {aiAdvice.technical_findings && (
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Technical Findings:</span>
                          <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5 pl-1">
                            {aiAdvice.technical_findings.map((f: string, i: number) => (
                              <li key={i}>{f}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Recommended Steps with 1-click apply */}
                      <div className="p-2.5 bg-teal-100/40 rounded-lg border border-teal-200 text-[11px] space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-teal-900 uppercase text-[10px]">
                            Recommended Adjudication Procedure:
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setOfficerNotes(
                                (language === "hi"
                                  ? aiAdvice.recommended_action_hi
                                  : aiAdvice.recommended_action_en)
                              )
                            }
                            className="text-[10px] font-bold text-teal-700 hover:text-teal-900 underline cursor-pointer"
                          >
                            Apply to Remarks ✍️
                          </button>
                        </div>
                        <p className="text-slate-800 whitespace-pre-line leading-relaxed font-mono text-[10px]">
                          {language === "hi" ? aiAdvice.recommended_action_hi : aiAdvice.recommended_action_en}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-[11px]">
                      Algorithmic baseline analysis active. Click below to apply adjudication.
                    </p>
                  )}
                </div>

                {/* Digital Certificate Fast Link */}
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="text-xs font-semibold text-slate-900">Certified RoR Harmonization Report</div>
                      <div className="text-[10px] text-slate-500">Includes SHA-256 seal, Before/After delta &amp; QR code</div>
                    </div>
                  </div>
                  <Link
                    href={`/parcels/${selectedConflict.parcel_id}/certificate`}
                    target="_blank"
                    className="flex items-center space-x-1 px-2.5 py-1.5 bg-white border border-slate-300 hover:border-teal-500 hover:text-teal-700 text-slate-700 text-[11px] font-semibold rounded-lg shadow-2xs transition-colors"
                  >
                    <span>View Certificate</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </Link>
                </div>

                {/* Officer Notes */}
                <div className="space-y-1.5 text-xs">
                  <label className="font-semibold text-slate-800">Officer Adjudication Remarks</label>
                  <textarea
                    rows={3}
                    value={officerNotes}
                    onChange={(e) => setOfficerNotes(e.target.value)}
                    placeholder="Enter statutory adjudication remarks or field survey instructions..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs text-slate-900 focus:outline-none focus:border-teal-600 focus:bg-white transition-all shadow-inner"
                  />
                </div>

              </div>

              {/* Action Buttons */}
              <div className="pt-5 border-t border-slate-200 space-y-2.5">
                <button
                  onClick={() => handleAction("ACCEPT_RECOMMENDATION", "Accepted recommendation: Cadastral baseline confirmed.")}
                  disabled={resolving}
                  className="w-full py-2.5 bg-gradient-to-r from-teal-700 to-teal-800 hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {resolving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Accept Recommendation &amp; Harmonize</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleAction("FIELD_VERIFICATION", "Flagged for on-ground CORS/RTK survey team.")}
                    disabled={resolving}
                    className="py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-center"
                  >
                    Flag for Field RTK Survey
                  </button>
                  <button
                    onClick={() => handleAction("REJECT", "Dispute rejected by GIS Officer.")}
                    disabled={resolving}
                    className="py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-center"
                  >
                    Reject Discrepancy
                  </button>
                </div>

                <div className="pt-1 text-center">
                  <Link
                    href={`/parcels/${selectedConflict.parcel_id}`}
                    className="text-[11px] text-teal-700 hover:underline inline-flex items-center space-x-1 font-semibold"
                  >
                    <span>View Authoritative Property Card</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
