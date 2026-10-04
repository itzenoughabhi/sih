import React from "react";
import { ShieldCheck, Cpu, Map, FileText } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gov-header border-t border-gov-border mt-12 py-6 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-slate-300">Naksha.ai</span>
            <span className="text-slate-600">|</span>
            <span>Problem Statement ID: 26013 — Urban Land Record Harmonization</span>
          </div>

          <div className="flex items-center space-x-4 text-[11px] text-slate-400 font-mono">
            <span className="flex items-center space-x-1">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>FastAPI & Shapely</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <Map className="w-3.5 h-3.5 text-emerald-400" />
              <span>MapLibre GL JS</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>HITL Audit Trail</span>
            </span>
          </div>

        </div>

        <div className="mt-3 pt-3 border-t border-slate-800 text-[10px] text-slate-400 text-center md:text-left flex flex-col md:flex-row justify-between">
          <p>© 2026 Naksha.ai Initiative. Designed for National Hackathon Demonstration.</p>
          <p className="mt-1 md:mt-0 text-slate-400">Decision-Support Prototype. All authoritative record changes require statutory human attestation.</p>
        </div>
      </div>
    </footer>
  );
}
