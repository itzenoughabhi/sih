"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Database, Layers, Compass, Loader2 } from "lucide-react";
import { fetchDatasetDetail } from "@/lib/api";

export default function DatasetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const datasetId = params?.id as string;

  const [dataset, setDataset] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!datasetId) return;
    fetchDatasetDetail(datasetId)
      .then((data) => setDataset(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [datasetId]);

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-[#64748B] flex flex-col items-center space-y-2">
        <Loader2 className="w-6 h-6 animate-spin text-[#0F766E]" />
        <span>Loading dataset details...</span>
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="py-24 text-center space-y-3">
        <p className="text-[#64748B] text-sm">Dataset not found.</p>
        <Link href="/datasets" className="text-[#0F766E] hover:underline text-xs">
          ← Back to Datasets
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center space-x-3 pb-4 border-b border-[#E2E8F0]">
        <Link
          href="/datasets"
          className="p-1.5 rounded-md bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8FAFC] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="text-xs font-semibold text-[#0F766E] uppercase tracking-wider">Dataset Inspector</div>
          <h1 className="text-2xl font-bold text-[#1E293B] mt-0.5">{dataset.name}</h1>
        </div>
      </div>

      {/* Meta Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E2E8F0] p-4 rounded-lg">
          <div className="text-[11px] text-[#64748B] uppercase font-semibold">Classification</div>
          <div className="text-sm font-semibold text-[#0F766E] mt-1 font-mono">{dataset.dataset_type}</div>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-4 rounded-lg">
          <div className="text-[11px] text-[#64748B] uppercase font-semibold">Normalized CRS</div>
          <div className="text-sm font-semibold text-[#1E293B] mt-1 font-mono">{dataset.crs}</div>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-4 rounded-lg">
          <div className="text-[11px] text-[#64748B] uppercase font-semibold">Feature Count</div>
          <div className="text-sm font-semibold text-[#15803D] mt-1 font-mono">{dataset.feature_count} features</div>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-4 rounded-lg">
          <div className="text-[11px] text-[#64748B] uppercase font-semibold">Source Agency</div>
          <div className="text-sm font-semibold text-[#1E293B] mt-1">{dataset.source_agency}</div>
        </div>
      </div>

      {/* Sample Features Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-4 shadow-xs">
        <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">
          Normalized Feature Sample (First 10 Features)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-[#64748B] uppercase font-semibold text-[11px] border-b border-[#E2E8F0]">
              <tr>
                <th className="py-2.5 px-3">Parcel ID</th>
                <th className="py-2.5 px-3">Survey Number</th>
                <th className="py-2.5 px-3">Owner Name</th>
                <th className="py-2.5 px-3">Area (m²)</th>
                <th className="py-2.5 px-3">Land Use</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[#1E293B]">
              {dataset.sample_features && dataset.sample_features.length > 0 ? (
                dataset.sample_features.map((feat: any, idx: number) => (
                  <tr key={idx} className="hover:bg-[#F8FAFC]">
                    <td className="py-2.5 px-3 font-mono font-medium text-[#0F766E]">{feat.parcel_id}</td>
                    <td className="py-2.5 px-3 font-mono text-[#64748B]">{feat.survey_number || "—"}</td>
                    <td className="py-2.5 px-3">{feat.owner_name || "—"}</td>
                    <td className="py-2.5 px-3 font-mono">{feat.area ? `${feat.area.toFixed(1)} m²` : "—"}</td>
                    <td className="py-2.5 px-3 text-[#64748B]">{feat.land_use || "RESIDENTIAL"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-[#64748B]">
                    No features available to display.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

