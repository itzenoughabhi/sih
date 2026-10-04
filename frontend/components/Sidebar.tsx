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
  Loader2,
  X
} from "lucide-react";
import { useState } from "react";
import { generateDemoDatasets } from "@/lib/api";
import { useNav } from "@/components/NavContext";

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
  const { isMobileOpen, setIsMobileOpen } = useNav();
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

  const closeMobile = () => {
    setIsMobileOpen(false);
  };

  const navContent = (
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-teal-900/60 bg-black/20">
        <Link href="/dashboard" onClick={closeMobile} className="flex items-center space-x-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-400/20 to-teal-600/30 flex items-center justify-center border border-teal-400/40 shadow-xs shadow-teal-500/20 group-hover:border-teal-300 transition-all">
            <Layers className="w-4 h-4 text-teal-300 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <div className="font-bold text-base tracking-tight text-white leading-none flex items-center gap-1.5">
              <span>Naksha</span>
              <span className="text-[10px] px-1 py-0.2 rounded font-mono font-bold bg-teal-500/30 text-teal-300 border border-teal-400/40">.ai</span>
            </div>
            <div className="text-[10px] text-teal-300/70 font-mono tracking-wide mt-1">
              Command Portal
            </div>
          </div>
        </Link>
        {/* Mobile close button */}
        <button
          onClick={closeMobile}
          className="md:hidden p-1.5 text-teal-200 hover:text-white hover:bg-white/10 rounded-md"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMobile}
              className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all relative group ${
                isActive
                  ? "bg-gradient-to-r from-teal-500/20 to-emerald-500/10 text-white font-semibold border-l-2 border-teal-400 shadow-sm shadow-teal-950/50"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? "text-teal-300" : "text-slate-400"}`} />
              <span className="tracking-wide">{item.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_6px_#2dd4bf]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Quick Ingest Demo Action */}
      <div className="px-3 pb-3">
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-lg bg-gradient-to-r from-teal-900/80 to-slate-900 hover:from-teal-800 hover:to-slate-800 text-teal-200 text-xs font-semibold border border-teal-700/50 shadow-sm transition-all disabled:opacity-50 cursor-pointer group"
          title="Seed benchmark parcels across 5 departments"
        >
          {seeding ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-300" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-teal-300 group-hover:rotate-12 transition-transform" />
          )}
          <span>{seeding ? "Generating..." : "Generate Demo Data"}</span>
        </button>
      </div>

      {/* System Status Footer */}
      <div className="px-5 py-3.5 border-t border-teal-900/60 bg-black/30 text-xs flex items-center justify-between text-teal-200">
        <div>
          <div className="text-[9px] text-teal-400/80 uppercase tracking-wider font-mono">System Core</div>
          <div className="flex items-center space-x-1.5 text-xs text-white font-medium mt-0.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-[11px] text-emerald-300">Operational</span>
          </div>
        </div>
        <span className="text-[10px] font-mono text-teal-300/80 bg-teal-950/80 border border-teal-800/60 px-2 py-0.5 rounded">v1.0</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden md:flex w-64 bg-gradient-to-b from-[#072421] via-[#0a332e] to-[#051c19] text-white flex-col flex-shrink-0 h-screen sticky top-0 border-r border-teal-950 shadow-xl z-40 select-none">
        {navContent}
      </aside>

      {/* Mobile Slide-over Drawer & Backdrop */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={closeMobile}
          />
          <aside className="relative w-64 max-w-[85vw] bg-gradient-to-b from-[#072421] via-[#0a332e] to-[#051c19] text-white flex flex-col h-full z-10 shadow-2xl animate-in slide-in-from-left duration-200 select-none">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
