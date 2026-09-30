"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Layers,
  LayoutDashboard,
  Database,
  SlidersHorizontal,
  MapPin,
  AlertTriangle,
  FileCheck2,
  History,
  Sparkles,
  Loader2,
  ShieldCheck,
  UserCheck
} from "lucide-react";
import { generateDemoDatasets } from "@/lib/api";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/datasets", label: "Datasets", icon: Database },
  { href: "/harmonization", label: "Harmonize", icon: SlidersHorizontal },
  { href: "/map", label: "GIS Map", icon: MapPin },
  { href: "/conflicts", label: "Conflict Center", icon: AlertTriangle },
  { href: "/reviews", label: "Reviews", icon: FileCheck2 },
  { href: "/audit-log", label: "Audit Log", icon: History },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleQuickSeed = async () => {
    setIsGenerating(true);
    try {
      await generateDemoDatasets(42, 100);
      alert("✅ Demo datasets (100 parcels across 5 departments) successfully generated!");
      router.refresh();
      window.location.reload();
    } catch (err: any) {
      alert("⚠️ Error generating demo data: " + (err.message || "Failed"));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <header className="bg-gov-header border-b border-gov-border sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center space-x-3">
            <Link href="/dashboard" className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 group-hover:bg-blue-600/30 transition-colors">
                <Layers className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-lg text-slate-100 tracking-tight">BhuSync</span>
                  <span className="text-xs px-1.5 py-0.5 rounded font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">AI</span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Urban Land Record Harmonization</p>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? "bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-blue-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Section */}
          <div className="flex items-center space-x-3">
            {/* Quick Demo Button */}
            <button
              onClick={handleQuickSeed}
              disabled={isGenerating}
              className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
              title="Generate 100 synthetic Cadastral, Municipal, Revenue, Drone, and GNSS records with controlled discrepancies"
            >
              {isGenerating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>{isGenerating ? "Generating..." : "Generate Demo Data"}</span>
            </button>

            {/* Officer Badge */}
            <div className="flex items-center space-x-2 pl-3 border-l border-slate-700/60">
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-slate-300">
                <UserCheck className="w-4 h-4 text-slate-300" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-200 leading-none">Off. Sharma</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">Tehsildar (W-14)</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
