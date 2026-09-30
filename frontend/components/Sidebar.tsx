"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Database,
  SlidersHorizontal,
  MapPin,
  AlertTriangle,
  FileCheck2,
  History,
  Layers,
  Sparkles,
  Loader2
} from "lucide-react";
import { useState } from "react";
import { generateDemoDatasets } from "@/lib/api";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/datasets", label: "Datasets", icon: Database },
  { href: "/harmonization", label: "Harmonization", icon: SlidersHorizontal },
  { href: "/map", label: "GIS Map", icon: MapPin },
  { href: "/conflicts", label: "Conflicts", icon: AlertTriangle },
  { href: "/reviews", label: "Reviews", icon: FileCheck2 },
  { href: "/audit-log", label: "Audit Log", icon: History },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await generateDemoDatasets(42, 100);
      alert("✅ Demo datasets generated successfully across 5 departments.");
      window.location.reload();
    } catch (err: any) {
      alert("⚠️ Error: " + (err.message || "Failed to generate demo datasets"));
    } finally {
      setSeeding(false);
    }
  };

  return (
    <aside className="w-60 bg-[#115E59] text-white flex flex-col flex-shrink-0 h-screen sticky top-0 border-r border-[#0D4E4A] z-40 select-none">
      
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-[#0D4E4A]/80">
        <Link href="/dashboard" className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center border border-white/20">
            <Layers className="w-4 h-4 text-teal-200" />
          </div>
          <div>
            <div className="font-bold text-base tracking-tight text-white leading-none">
              BhuSync AI
            </div>
            <div className="text-[11px] text-teal-200/80 font-normal mt-0.5">
              Urban Land Intelligence
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors relative ${
                isActive
                  ? "bg-white text-[#0F766E] shadow-sm font-semibold"
                  : "text-teal-100/90 hover:bg-white/10 hover:text-white"
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#0F766E] rounded-r" />
              )}
              <Icon className={`w-4 h-4 ${isActive ? "text-[#0F766E]" : "text-teal-200"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Quick Ingest Demo Action */}
      <div className="px-3 pb-3">
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 rounded-md bg-[#0D4E4A] hover:bg-[#0A3D3A] text-teal-100 text-xs font-medium border border-teal-600/40 transition-colors disabled:opacity-50"
          title="Seed 100 benchmark parcels across 5 departments"
        >
          {seeding ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-300" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-teal-300" />
          )}
          <span>{seeding ? "Generating..." : "Generate Demo Data"}</span>
        </button>
      </div>

      {/* System Status Footer */}
      <div className="px-5 py-3.5 border-t border-[#0D4E4A]/80 bg-[#0E4F4B]/50 text-xs flex items-center justify-between text-teal-200">
        <div>
          <div className="text-[10px] text-teal-300/70 uppercase tracking-wider font-mono">System Status</div>
          <div className="flex items-center space-x-1.5 text-xs text-white font-medium mt-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
            <span>Operational</span>
          </div>
        </div>
        <span className="text-[10px] font-mono text-teal-300/80 bg-black/20 px-1.5 py-0.5 rounded">v1.0</span>
      </div>

    </aside>
  );
}
