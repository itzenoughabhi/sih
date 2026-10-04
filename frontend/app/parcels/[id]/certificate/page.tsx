"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Printer,
  ArrowLeft,
  ShieldCheck,
  QrCode,
  CheckCircle2,
  Lock,
  Layers,
  FileCheck2,
  Calendar,
  Building2,
  Loader2,
  AlertCircle
} from "lucide-react";
import { fetchParcelCertificate } from "@/lib/api";

export default function CertificatePage() {
  const params = useParams();
  const router = useRouter();
  const parcelId = params?.id as string;

  const [cert, setCert] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!parcelId) return;
    setLoading(true);
    fetchParcelCertificate(parcelId)
      .then((data) => setCert(data))
      .catch((err) => setError(err.message || "Failed to load certificate"))
      .finally(() => setLoading(false));
  }, [parcelId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-3 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
        <p className="text-xs font-mono text-slate-400 tracking-wider">
          Retrieving Cryptographic Land Certificate from Registry...
        </p>
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="tech-card p-6 max-w-md w-full text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Certificate Generation Failed</h2>
          <p className="text-xs text-slate-500">{error || "Parcel records could not be verified."}</p>
          <Link
            href="/conflicts"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-teal-700 text-white rounded-lg text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Conflict Center</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6">
      
      {/* Top Action Bar (hidden in print) */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Triage</span>
        </button>

        <div className="flex items-center space-x-3">
          <span className="text-[11px] font-mono text-slate-500 flex items-center space-x-1">
            <Lock className="w-3.5 h-3.5 text-teal-600" />
            <span>SHA-256 Immutable Attestation</span>
          </span>

          <button
            onClick={() => window.print()}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Certificate</span>
          </button>
        </div>
      </div>

      {/* Official Government Certificate Specimen */}
      <div className="max-w-4xl mx-auto bg-white border-8 border-double border-slate-800 rounded-none p-8 sm:p-12 shadow-2xl relative overflow-hidden text-slate-900 print:p-6 print:border-4 print:shadow-none">
        
        {/* Security Watermark Background */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] select-none">
          <div className="text-[130px] font-black tracking-widest uppercase rotate-[-30deg]">
            NAKSHA.AI
          </div>
        </div>

        {/* Certificate Header with Emblem Representation */}
        <div className="text-center border-b-2 border-slate-900 pb-6 relative">
          
          {/* Emblem Icon */}
          <div className="w-14 h-14 mx-auto mb-2 rounded-full border-2 border-slate-800 flex items-center justify-center bg-slate-50 shadow-inner">
            <ShieldCheck className="w-8 h-8 text-teal-800" />
          </div>

          <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-slate-600 font-bold">
            Government of India • Ministry of Panchayati Raj / Urban Affairs
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-slate-900 mt-1 uppercase">
            Directorate of Land Records &amp; Survey
          </h1>
          <div className="text-xs font-serif font-bold text-slate-700 mt-0.5">
            भू-अभिलेख एवं सर्वेक्षण निदेशालय • डिजिटल सामंजस्य प्रमाण-पत्र
          </div>

          <div className="mt-4 inline-flex items-center space-x-2 px-4 py-1 bg-slate-900 text-white font-mono text-xs font-bold tracking-widest uppercase">
            <span>Certificate of Unified Spatial Record (RoR)</span>
          </div>
        </div>

        {/* Certificate Metadata Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-slate-300 text-xs font-mono">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Certificate Number:</span>
            <span className="font-bold text-slate-900">{cert.certificate_number}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Issue Date / Time:</span>
            <span className="font-semibold text-slate-900">{cert.issue_date}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Jurisdiction:</span>
            <span className="font-semibold text-slate-900">{cert.jurisdiction}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Concordance Status:</span>
            <span className="font-bold text-emerald-700">
              {cert.status} ({Math.round(cert.overall_confidence * 100)}%)
            </span>
          </div>
        </div>

        {/* Primary Parcel Identification */}
        <div className="my-6 space-y-4">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1 flex items-center space-x-1.5">
            <Building2 className="w-3.5 h-3.5 text-teal-700" />
            <span>1. Certified Parcel Identifiers</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 border border-slate-200 text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[10px]">Unique Parcel ID (ULPIN):</span>
              <span className="text-sm font-bold text-teal-800">{cert.parcel_id}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Khasra / Survey Number:</span>
              <span className="text-sm font-bold text-slate-900">{cert.survey_number}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Land Use Classification:</span>
              <span className="font-semibold text-slate-800">{cert.land_use}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Active Disputes / Conflicts:</span>
              <span className="font-semibold text-slate-800">
                {cert.conflicts.open === 0 ? "0 (All Resolved)" : `${cert.conflicts.open} Open Flags`}
              </span>
            </div>
          </div>
        </div>

        {/* Ownership Reconciliation Table */}
        <div className="my-6 space-y-3">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1 flex items-center space-x-1.5">
            <FileCheck2 className="w-3.5 h-3.5 text-teal-700" />
            <span>2. Ownership Record Concordance (Revenue vs Municipal)</span>
          </h3>

          <div className="overflow-x-auto border border-slate-300">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-100 border-b border-slate-300 font-semibold text-slate-700">
                <tr>
                  <th className="p-2.5">Source Register</th>
                  <th className="p-2.5">Recorded Tenure Holder</th>
                  <th className="p-2.5 text-right">Alignment Index</th>
                  <th className="p-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-2.5 font-medium text-slate-600">Revenue Register (Khatauni / 7/12)</td>
                  <td className="p-2.5 font-bold text-slate-900">{cert.owners.revenue_khatauni}</td>
                  <td className="p-2.5 text-right font-bold text-teal-700">Authoritative Base</td>
                  <td className="p-2.5 text-center text-emerald-700 font-bold">VERIFIED</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium text-slate-600">Municipal Corporation Property Tax</td>
                  <td className="p-2.5 font-bold text-slate-900">{cert.owners.municipal_tax}</td>
                  <td className="p-2.5 text-right font-bold text-teal-700">
                    {Math.round(cert.owners.match_confidence * 100)}% Match
                  </td>
                  <td className="p-2.5 text-center text-emerald-700 font-bold">CONCORDANT</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Geometric & Spatial Verification Metrics */}
        <div className="my-6 space-y-3">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1 flex items-center space-x-1.5">
            <Layers className="w-3.5 h-3.5 text-teal-700" />
            <span>3. Multi-Source Geometric Evidence &amp; Area Harmonization</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 border border-slate-200 text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[10px]">Cadastral Survey Area:</span>
              <span className="text-sm font-bold text-slate-900">{cert.metrics.cadastral_area_sqm} m²</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Drone Orthophoto (ORI) Area:</span>
              <span className="text-sm font-bold text-slate-900">{cert.metrics.target_survey_area_sqm} m²</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Harmonized Consensus Area:</span>
              <span className="text-sm font-bold text-teal-800">{cert.metrics.harmonized_area_sqm} m²</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Area Variance (Δ Area):</span>
              <span className="text-sm font-bold text-emerald-700">
                ±{cert.metrics.area_delta_sqm} m² ({cert.metrics.area_variance_pct}%)
              </span>
            </div>
          </div>

          <div className="p-3 bg-white border border-slate-200 text-[11px] font-mono flex items-center justify-between">
            <span>Spatial IoU Polygon Overlap: <strong>{(cert.metrics.boundary_iou * 100).toFixed(1)}%</strong></span>
            <span>CORS GNSS Ground Baseline Shift: <strong>&lt; {cert.metrics.cors_displacement_m}m (Compliant)</strong></span>
          </div>
        </div>

        {/* Legal Certification Statement */}
        <div className="my-6 p-4 bg-slate-50 border-l-4 border-teal-700 text-slate-800 text-xs font-serif leading-relaxed italic">
          &ldquo;{cert.legal_certification}&rdquo;
        </div>

        {/* Tamper Evident Cryptographic Seal & Signatures */}
        <div className="mt-8 pt-6 border-t-2 border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
          
          {/* QR Code Verification Block */}
          <div className="flex items-center space-x-3">
            <div className="w-20 h-20 bg-slate-900 p-1 flex items-center justify-center rounded border border-slate-700 text-white">
              <QrCode className="w-16 h-16 text-white" />
            </div>
            <div className="text-[10px] font-mono text-slate-500 space-y-0.5">
              <span className="block font-bold text-slate-900">Digital QR Verification</span>
              <span>Scan to authenticate on Unified Land Portal.</span>
              <span className="block text-teal-700 font-semibold">Status: Active &amp; Valid</span>
            </div>
          </div>

          {/* Cryptographic Seal */}
          <div className="text-[10px] font-mono space-y-1">
            <span className="block font-bold text-slate-700 uppercase">Cryptographic Integrity Seal:</span>
            <div className="p-2 bg-slate-100 border border-slate-300 rounded font-mono text-[9px] break-all leading-tight text-slate-800">
              <span className="font-bold text-teal-900 block">SHA-256 Digest:</span>
              {cert.tamper_evident_seal.digest}
            </div>
            <div className="text-[9px] text-slate-500">
              Merkle Root: {cert.tamper_evident_seal.merkle_root.slice(0, 24)}...
            </div>
          </div>

          {/* Authorized Signatory Block */}
          <div className="text-right space-y-6">
            <div className="inline-block border-b-2 border-slate-900 pb-1 px-4 text-center">
              <div className="font-serif italic font-bold text-sm text-slate-900">
                Dr. R. K. Sharma, IAS
              </div>
              <div className="text-[9px] font-mono uppercase text-slate-500">
                Competent Authority / Settlement Officer
              </div>
            </div>
            <div className="text-[9px] font-mono text-slate-400">
              Digitally Signed under Information Technology Act 2000
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-3 border-t border-slate-200 text-center text-[9px] font-mono text-slate-400 uppercase tracking-widest">
          Naksha.ai Automated Geospatial Harmonization Platform • SIH 2024 Problem Statement 26013
        </div>
      </div>
    </div>
  );
}
