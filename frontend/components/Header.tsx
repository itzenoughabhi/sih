"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Database, UserCheck, ShieldCheck } from "lucide-react";
import { fetchDatasets } from "@/lib/api";

const PAGE_TITLES: Record<string, { title: string; subtitle?: string }> = {
  "/dashboard": { title: "Dashboard", subtitle: "Urban Land Data Overview" },
  "/datasets": { title: "Data Sources", subtitle: "Departmental Vector & Tabular Ingestion" },
  "/harmonization": { title: "Harmonization", subtitle: "Multi-Source Spatial Matching Engine" },
  "/map": { title: "GIS Map", subtitle: "Interactive Multi-Layer Spatial Viewer" },
  "/conflicts": { title: "Conflict Review", subtitle: "Spatial & Legal Discrepancy Triage" },
  "/parcels": { title: "Parcels Directory", subtitle: "Harmonized Cadastral Land Units" },
  "/reviews": { title: "Reviews Ledger", subtitle: "Human-in-the-Loop Statutory Approvals" },
  "/audit-log": { title: "Audit Log", subtitle: "Tamper-Evident System Event Timeline" },
  "/login": { title: "Portal Authentication", subtitle: "Officer Access" },
};

export default function Header() {
  const pathname = usePathname();
  const [datasetCount, setDatasetCount] = useState<number | null>(null);

  useEffect(() => {
    fetchDatasets()
      .then((data) => setDatasetCount(data.length))
      .catch(() => setDatasetCount(null));
  }, [pathname]);

  const currentRoute = Object.keys(PAGE_TITLES).find(
    (key) => pathname === key || (key !== "/dashboard" && pathname.startsWith(key))
  );
  const pageMeta = currentRoute ? PAGE_TITLES[currentRoute] : { title: "GIS Portal" };

  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] px-6 flex items-center justify-between flex-shrink-0 sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      
      {/* Current Page Title */}
      <div className="flex items-baseline space-x-3">
        <h1 className="text-lg font-bold text-[#1E293B] tracking-tight">
          {pageMeta.title}
        </h1>
        {pageMeta.subtitle && (
          <span className="hidden md:inline text-xs text-[#64748B]">
            — {pageMeta.subtitle}
          </span>
        )}
      </div>

      {/* Right Status Information */}
      <div className="flex items-center space-x-4 text-xs">
        
        {/* Connected Datasets */}
        <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-[#64748B] font-medium">
          <Database className="w-3.5 h-3.5 text-[#0F766E]" />
          <span>
            {datasetCount !== null ? `${datasetCount} datasets connected` : "Connecting..."}
          </span>
        </div>

        {/* Operational Status */}
        <div className="flex items-center space-x-1.5 text-xs font-medium text-[#15803D]">
          <span className="w-2 h-2 rounded-full bg-[#15803D] inline-block" />
          <span className="hidden md:inline">System operational</span>
        </div>

        <span className="text-[#CBD5E1]">|</span>

        {/* User / GIS Officer */}
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded bg-[#F0FDFA] border border-[#CCFBF1] flex items-center justify-center text-[#0F766E]">
            <UserCheck className="w-3.5 h-3.5" />
          </div>
          <div className="text-left leading-none">
            <span className="block text-xs font-semibold text-[#1E293B]">Off. S. Patil</span>
            <span className="text-[10px] text-[#64748B]">GIS Officer (Ward 23, VVMC)</span>
          </div>
        </div>

      </div>

    </header>
  );
}
