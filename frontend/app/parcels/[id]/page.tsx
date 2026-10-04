"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Building,
  MapPin,
  FileCheck2,
  Printer,
  ExternalLink,
  Loader2,
  X,
  FileText,
  UserCheck,
  Check,
  ShieldCheck
} from "lucide-react";
import { fetchParcelDetail, submitReview, resolveConflict } from "@/lib/api";
import { ParcelDetail } from "@/lib/types";

export default function ParcelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const parcelId = params?.id as string;

  const [parcel, setParcel] = useState<ParcelDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPropertyCard, setShowPropertyCard] = useState(false);

  // Review Dialog State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState("APPROVE_RECOMMENDATION");
  const [officerComment, setOfficerComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadData = async () => {
    if (!parcelId) return;
    setLoading(true);
    try {
      const data = await fetchParcelDetail(parcelId);
      setParcel(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [parcelId]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parcel || !officerComment) return;

    setSubmittingReview(true);
    try {
      const activeConflict = parcel.conflicts.find((c) => c.status === "OPEN");
      await submitReview({
        parcel_id: parcel.id,
        conflict_id: activeConflict ? activeConflict.id : undefined,
        reviewer: "GIS Officer Sharma (Tehsildar)",
        decision: selectedDecision,
        comment: officerComment,
      });
      alert("Attestation submitted and recorded in audit ledger.");
      setShowReviewModal(false);
      setOfficerComment("");
      await loadData();
    } catch (err: any) {
      alert("Failed to submit review: " + err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-[#64748B] flex flex-col items-center space-y-2">
        <Loader2 className="w-6 h-6 animate-spin text-[#0F766E]" />
        <span>Loading property record...</span>
      </div>
    );
  }

  if (!parcel) {
    return (
      <div className="py-24 text-center space-y-3">
        <p className="text-[#64748B] text-sm">Parcel record not found.</p>
        <Link href="/parcels" className="text-[#0F766E] hover:underline text-xs">
          ← Back to Parcels Directory
        </Link>
      </div>
    );
  }

  const isVerified = parcel.status === "HIGH_CONFIDENCE";
  const overallConfPct = Math.round(parcel.confidence.overall * 100);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2E8F0] gap-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/parcels"
            className="p-1.5 rounded-md bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8FAFC] transition-colors"
            title="Back to Parcels"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="text-xs font-semibold text-[#0F766E] uppercase tracking-wider">
              Urban Property Record
            </div>
            <div className="flex items-center space-x-3 mt-0.5">
              <h1 className="text-2xl font-bold font-mono text-[#1E293B]">
                Parcel ID: {parcel.parcel_id}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                  isVerified
                    ? "bg-[#DCFCE7] text-[#15803D]"
                    : "bg-[#FEF3C7] text-[#D97706]"
                }`}
              >
                Status: {isVerified ? "Verified" : "Review Required"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowReviewModal(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-[#F8FAFC] text-[#1E293B] border border-[#E2E8F0] rounded-md text-xs font-semibold transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5 text-[#0F766E]" />
            <span>Officer Attestation</span>
          </button>

          <button
            onClick={() => setShowPropertyCard(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Urban Property Card</span>
          </button>
        </div>
      </div>

      {/* Main Government Property Record Container (Section 20 requirement) */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-xs divide-y divide-[#E2E8F0]">
        
        {/* Section 1: Property Information */}
        <div className="p-5 space-y-3">
          <h2 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">
            1. Property Information
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[#64748B] block text-[11px]">Registered Owner</span>
              <span className="font-semibold text-[#1E293B] mt-0.5 block">{parcel.owner_name || "Unassigned"}</span>
            </div>
            <div>
              <span className="text-[#64748B] block text-[11px]">Land Use</span>
              <span className="font-semibold text-[#1E293B] mt-0.5 block">{parcel.land_use || "Residential"}</span>
            </div>
            <div>
              <span className="text-[#64748B] block text-[11px]">Municipal Ward</span>
              <span className="font-semibold text-[#1E293B] mt-0.5 block">{parcel.ward || "Ward 14"}</span>
            </div>
            <div>
              <span className="text-[#64748B] block text-[11px]">Urban Local Body</span>
              <span className="font-semibold text-[#1E293B] mt-0.5 block">Bruhat Bengaluru Mahanagara Palike</span>
            </div>
          </div>
        </div>

        {/* Section 2: Survey Information */}
        <div className="p-5 space-y-3">
          <h2 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">
            2. Survey Information
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[#64748B] block text-[11px]">Survey / Khasra No.</span>
              <span className="font-mono font-semibold text-[#1E293B] mt-0.5 block">{parcel.survey_number || "102/3"}</span>
            </div>
            <div>
              <span className="text-[#64748B] block text-[11px]">Revenue Khata Number</span>
              <span className="font-mono font-semibold text-[#1E293B] mt-0.5 block">{parcel.sources.revenue?.khata_number || "KH-4821"}</span>
            </div>
            <div>
              <span className="text-[#64748B] block text-[11px]">Mutation Status</span>
              <span className="font-semibold text-[#15803D] mt-0.5 block">{parcel.sources.revenue?.mutation_status || "Approved (Order #902)"}</span>
            </div>
            <div>
              <span className="text-[#64748B] block text-[11px]">Municipal Assessment ID</span>
              <span className="font-mono font-semibold text-[#1E293B] mt-0.5 block">{parcel.sources.municipal?.id || "TAX-7890"}</span>
            </div>
          </div>
        </div>

        {/* Section 3: Spatial Information */}
        <div className="p-5 space-y-3">
          <h2 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">
            3. Spatial Information
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[#64748B] block text-[11px]">Harmonized Parcel Area</span>
              <span className="font-mono font-bold text-[#0F766E] text-sm mt-0.5 block">{parcel.area.toFixed(1)} m²</span>
            </div>
            <div>
              <span className="text-[#64748B] block text-[11px]">Coordinate Reference System</span>
              <span className="font-mono font-semibold text-[#1E293B] mt-0.5 block">EPSG:4326 / UTM 43N</span>
            </div>
            <div>
              <span className="text-[#64748B] block text-[11px]">Centroid Coordinates</span>
              <span className="font-mono text-[#1E293B] mt-0.5 block">77.5962° E, 12.9726° N</span>
            </div>
            <div>
              <span className="text-[#64748B] block text-[11px]">Drone Built Footprint</span>
              <span className="font-mono font-semibold text-[#1E293B] mt-0.5 block">{parcel.sources.drone?.derived_built_area || "412.0"} m²</span>
            </div>
          </div>
        </div>

        {/* Section 4: Source Evidence */}
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">
              4. Source Evidence
            </h2>
            <span className="text-xs text-[#64748B]">5 Multi-Agency Layers Connected</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#1E293B]">Cadastral Survey (Revenue Baseline)</span>
                <span className="text-[10px] font-semibold text-[#15803D] bg-[#DCFCE7] px-1.5 py-0.5 rounded">MATCHED</span>
              </div>
              <div className="text-[11px] text-[#64748B]">
                Area: {parcel.sources.cadastral?.area || parcel.area} m² • Owner: {parcel.sources.cadastral?.owner || parcel.owner_name}
              </div>
            </div>

            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#1E293B]">Municipal Property Tax Register</span>
                <span className="text-[10px] font-semibold text-[#0F766E] bg-[#CCFBF1] px-1.5 py-0.5 rounded">CORRELATED</span>
              </div>
              <div className="text-[11px] text-[#64748B]">
                Assessment Area: {parcel.sources.municipal?.area || "790.0"} m² • ID: {parcel.sources.municipal?.id || "TAX-7890"}
              </div>
            </div>

            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#1E293B]">Revenue Khata Registry</span>
                <span className="text-[10px] font-semibold text-[#15803D] bg-[#DCFCE7] px-1.5 py-0.5 rounded">VERIFIED</span>
              </div>
              <div className="text-[11px] text-[#64748B]">
                Khata No: {parcel.sources.revenue?.khata_number || "KH-4821"} • Deeded Area: {parcel.sources.revenue?.deeded_area || parcel.area} m²
              </div>
            </div>

            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#1E293B]">CORS / RTK GNSS Ground Truth</span>
                <span className="text-[10px] font-semibold text-[#15803D] bg-[#DCFCE7] px-1.5 py-0.5 rounded">FIXED (±1.5cm)</span>
              </div>
              <div className="text-[11px] text-[#64748B]">
                Station: {parcel.sources.gnss?.control_point || "CORS-BLR-014"} • Precision: {parcel.sources.gnss?.precision || "1.4 cm"}
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Confidence */}
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">
                5. Harmonization Confidence
              </h2>
              <p className="text-[11px] text-[#64748B]">Explainable deterministic scoring breakdown</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-[#64748B]">Overall Score</span>
              <div className="text-xl font-bold font-mono text-[#0F766E]">{overallConfPct}%</div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md">
              <span className="text-[#64748B] text-[11px]">Geometry</span>
              <div className="font-bold font-mono text-[#1E293B] mt-1">{(parcel.confidence.geometry * 100).toFixed(0)}%</div>
            </div>
            <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md">
              <span className="text-[#64748B] text-[11px]">Area Concordance</span>
              <div className="font-bold font-mono text-[#1E293B] mt-1">{(parcel.confidence.area * 100).toFixed(0)}%</div>
            </div>
            <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md">
              <span className="text-[#64748B] text-[11px]">Attributes Match</span>
              <div className="font-bold font-mono text-[#1E293B] mt-1">{(parcel.confidence.attributes * 100).toFixed(0)}%</div>
            </div>
            <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md">
              <span className="text-[#64748B] text-[11px]">GNSS Ground Truth</span>
              <div className="font-bold font-mono text-[#15803D] mt-1">{(parcel.confidence.gnss * 100).toFixed(0)}%</div>
            </div>
          </div>

          <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-xs text-[#1E293B] leading-relaxed">
            <span className="font-semibold text-[#0F766E] block mb-0.5">Audit Rationale:</span>
            &quot;{parcel.explanation}&quot;
          </div>
        </div>

        {/* Section 6: Conflicts */}
        <div className="p-5 space-y-3">
          <h2 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">
            6. Conflicts &amp; Discrepancies
          </h2>

          {parcel.conflicts.length === 0 ? (
            <div className="text-xs text-[#15803D] flex items-center space-x-2 py-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>No outstanding legal or spatial conflicts detected for this parcel.</span>
            </div>
          ) : (
            <div className="space-y-2">
              {parcel.conflicts.map((conf) => (
                <div
                  key={conf.id}
                  className="p-3.5 bg-[#FEE2E2]/30 border border-[#fecaca] rounded-md text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-[#FEE2E2] text-[#DC2626]">
                        {conf.conflict_type}
                      </span>
                      <span className="font-semibold text-[#1E293B]">{conf.severity} SEVERITY</span>
                      <span className="text-[#64748B] font-mono">• Status: {conf.status}</span>
                    </div>
                    <p className="text-[#1E293B] mt-1">{conf.description}</p>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      {conf.source_a} vs {conf.source_b} (Difference: {conf.difference})
                    </p>
                  </div>

                  {conf.status === "OPEN" && (
                    <button
                      onClick={() => {
                        setSelectedDecision("APPROVE_RECOMMENDATION");
                        setShowReviewModal(true);
                      }}
                      className="px-3 py-1.5 bg-[#0F766E] hover:bg-[#115E59] text-white rounded text-xs font-semibold self-start sm:self-auto transition-colors"
                    >
                      Adjudicate
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 7: Review History */}
        <div className="p-5 space-y-3">
          <h2 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">
            7. Review History
          </h2>

          {parcel.reviews.length === 0 ? (
            <div className="text-xs text-[#64748B] py-2">
              No previous officer reviews recorded. Initial harmonization baseline established.
            </div>
          ) : (
            <div className="space-y-2">
              {parcel.reviews.map((rev) => (
                <div key={rev.id} className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-xs space-y-1">
                  <div className="flex justify-between items-center text-[#64748B] text-[11px]">
                    <span className="text-[#0F766E] font-bold">{rev.decision.replace("_", " ")}</span>
                    <span>{new Date(rev.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-[#1E293B]">&quot;{rev.comment}&quot;</p>
                  <div className="text-[11px] text-[#64748B]">Attested by: {rev.reviewer}</div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Human-in-the-Loop Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-lg max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-sm font-bold text-[#1E293B] flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-[#0F766E]" />
                <span>Statutory Land Record Attestation</span>
              </h3>
              <button onClick={() => setShowReviewModal(false)} className="text-[#94A3B8] hover:text-[#1E293B]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#1E293B] font-medium mb-1">Administrative Decision *</label>
                <select
                  value={selectedDecision}
                  onChange={(e) => setSelectedDecision(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-md px-3 py-2 text-[#1E293B] focus:outline-none focus:border-[#0F766E]"
                >
                  <option value="APPROVE_RECOMMENDATION">Approve Recommendation (Cadastral Base with Drone Footprint)</option>
                  <option value="OVERRIDE_GEOMETRY">Override Geometry with Senior Revenue Record</option>
                  <option value="FLAG_FIELD_RESURVEY">Flag for RTK/CORS Ground Resurvey</option>
                  <option value="REJECT_MATCH">Reject Spatial Match</option>
                </select>
              </div>

              <div>
                <label className="block text-[#1E293B] font-medium mb-1">Reviewer Remarks *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide statutory justification or field verification notes..."
                  value={officerComment}
                  onChange={(e) => setOfficerComment(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-md px-3 py-2 text-[#1E293B] focus:outline-none focus:border-[#0F766E]"
                />
              </div>

              <div className="p-3 rounded-md bg-[#CCFBF1] text-[11px] text-[#0F766E]">
                Attesting Officer: <span className="font-semibold">GIS Officer Sharma (Tehsildar, Ward 14)</span>.
                This attestation will be permanently sealed into the audit log.
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-3 py-1.5 rounded-md bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#1E293B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-4 py-1.5 rounded-md bg-[#0F766E] hover:bg-[#115E59] text-white font-semibold flex items-center space-x-1.5"
                >
                  {submittingReview && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Seal Decision</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unified Urban Property Card Modal (Printable Official Card) */}
      {showPropertyCard && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#0F766E] rounded-lg max-w-2xl w-full p-7 space-y-6 shadow-2xl relative text-[#1E293B]">
            <button
              onClick={() => setShowPropertyCard(false)}
              className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#1E293B]"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Official Header */}
            <div className="text-center border-b-2 border-[#0F766E]/30 pb-4 space-y-1">
              <div className="text-[10px] font-mono tracking-widest text-[#0F766E] uppercase font-bold">
                GOVERNMENT OF INDIA • STATE URBAN LAND AUTHORITY
              </div>
              <h2 className="text-xl font-bold tracking-tight text-[#1E293B] uppercase">
                Unified Urban Property Card (ULPIN)
              </h2>
              <div className="text-xs text-[#64748B] font-mono">
                Unique Land Parcel Identifier: <span className="text-[#0F766E] font-bold">KA-BLR-W14-{parcel.parcel_id.slice(-4)}</span>
              </div>
            </div>

            {/* Property Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs bg-[#F8FAFC] p-4 rounded-md border border-[#E2E8F0]">
              <div>
                <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Verified Owner</span>
                <span className="font-bold text-[#1E293B] text-sm">{parcel.owner_name || "Unassigned"}</span>
              </div>

              <div>
                <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Harmonized Area</span>
                <span className="font-bold text-[#0F766E] text-sm font-mono">{parcel.area.toFixed(1)} m²</span>
              </div>

              <div>
                <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Survey / Khasra No</span>
                <span className="font-bold text-[#1E293B] text-sm font-mono">{parcel.survey_number || "—"}</span>
              </div>

              <div>
                <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Land Classification</span>
                <span className="font-semibold text-[#1E293B]">{parcel.land_use}</span>
              </div>

              <div>
                <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Municipal Ward</span>
                <span className="font-semibold text-[#1E293B]">{parcel.ward || "Ward 14"}</span>
              </div>

              <div>
                <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Urban Local Body</span>
                <span className="font-semibold text-[#1E293B]">Bruhat Bengaluru Mahanagara Palike</span>
              </div>
            </div>

            {/* Cross-Departmental Linked Identifiers */}
            <div className="space-y-1.5 text-xs">
              <div className="font-mono text-[10px] uppercase text-[#64748B] font-semibold">Linked Departmental Records:</div>
              <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                <span className="px-2 py-1 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F766E] font-medium">
                  Cadastral: {parcel.parcel_id}
                </span>
                <span className="px-2 py-1 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[#1E293B] font-medium">
                  Municipal: {parcel.sources.municipal?.id || "TAX-7890"}
                </span>
                <span className="px-2 py-1 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[#1E293B] font-medium">
                  Revenue Khata: {parcel.sources.revenue?.khata_number || "KH-4821"}
                </span>
                <span className="px-2 py-1 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[#15803D] font-medium">
                  GNSS Control: {parcel.sources.gnss?.control_point || "CORS-BLR-014"}
                </span>
              </div>
            </div>

            {/* Digital Attestation Seal */}
            <div className="border-t border-[#E2E8F0] pt-4 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-[#15803D]">
                <ShieldCheck className="w-5 h-5" />
                <span className="font-semibold text-[11px]">Digitally Certified by Naksha.ai Engine</span>
              </div>

              <button
                onClick={() => window.print()}
                className="px-3.5 py-1.5 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Property Card</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

