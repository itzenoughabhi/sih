"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Database, UserCheck, Menu } from "lucide-react";
import { fetchDatasets } from "@/lib/api";
import { useNav } from "@/components/NavContext";

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
  const { toggleMobile } = useNav();
  const [datasetCount, setDatasetCount] = useState<number | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    fetchDatasets()
      .then((data) => {
        setDatasetCount(data.length);
        setIsOffline(false);
      })
      .catch(() => {
        setDatasetCount(null);
        setIsOffline(true);
      });
  }, [pathname]);

  const currentRoute = Object.keys(PAGE_TITLES).find(
    (key) => pathname === key || (key !== "/dashboard" && pathname.startsWith(key))
  );
  const pageMeta = currentRoute ? PAGE_TITLES[currentRoute] : { title: "GIS Portal" };

  return (
    <header className="h-14 sm:h-16 bg-white border-b border-[#E2E8F0] px-3 sm:px-6 flex items-center justify-between flex-shrink-0 sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      
      {/* Mobile Hamburger + Page Title */}
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
        <button
          onClick={toggleMobile}
          className="md:hidden p-1.5 -ml-1 text-[#475569] hover:text-[#0F766E] hover:bg-[#F1F5F9] rounded-md transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-baseline space-x-2 truncate">
          <h1 className="text-base sm:text-lg font-bold text-[#1E293B] tracking-tight truncate">
            {pageMeta.title}
          </h1>
          {pageMeta.subtitle && (
            <span className="hidden lg:inline text-xs text-[#64748B]">
              — {pageMeta.subtitle}
            </span>
          )}
        </div>
      </div>

      {/* Right Status Information */}
      <div className="flex items-center space-x-2 sm:space-x-4 text-xs flex-shrink-0">
        
        {/* Connected Datasets */}
        <div className="hidden md:flex items-center space-x-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded-md text-slate-700 font-medium">
          <Database className="w-3.5 h-3.5 text-teal-700" />
          <span className="font-mono text-[11px]">
            {datasetCount !== null 
              ? `${datasetCount} Datasets` 
              : isOffline 
              ? "Backend Offline" 
              : "Connecting..."}
          </span>
        </div>

        {/* Operational Status with glowing pulse */}
        <div className="flex items-center space-x-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="hidden sm:inline font-mono text-[11px] font-semibold">Neon Connected</span>
        </div>

        <span className="hidden sm:inline text-[#CBD5E1]">|</span>

        {/* User / GIS Officer */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          <div className="w-7 h-7 rounded bg-[#F0FDFA] border border-[#CCFBF1] flex items-center justify-center text-[#0F766E]">
            <UserCheck className="w-3.5 h-3.5" />
          </div>
          <div className="text-left leading-none hidden sm:block">
            <span className="block text-xs font-semibold text-[#1E293B]">Off. S. Patil</span>
            <span className="text-[10px] text-[#64748B] hidden lg:block">Ward 23, VVMC</span>
          </div>
        </div>

      </div>

    </header>
  );
}
