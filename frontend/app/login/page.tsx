"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, ShieldCheck, ArrowRight, Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("gis_officer_sharma");
  const [password, setPassword] = useState("••••••••••••");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/dashboard");
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white border border-[#E2E8F0] p-8 rounded-lg shadow-xs">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-md bg-[#CCFBF1] text-[#0F766E] border border-[#0F766E]/20 flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1E293B] tracking-tight">
              Naksha.ai Portal Access
            </h2>
            <div className="text-xs font-medium text-[#0F766E] uppercase tracking-wider mt-0.5">
              Urban Land Intelligence &amp; GIS Records
            </div>
          </div>
          <p className="text-xs text-[#64748B]">
            Automated Integration &amp; Harmonization of Multi-source Geospatial Data
          </p>
        </div>

        {/* Operational Officer Badge */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-md p-3 text-xs text-[#1E293B] space-y-1">
          <div className="flex items-center space-x-1.5 font-bold text-[#0F766E]">
            <ShieldCheck className="w-4 h-4 text-[#0F766E]" />
            <span>Authorized GIS Workstation</span>
          </div>
          <p className="text-[11px] text-[#64748B]">
            Pre-authenticated session for <span className="text-[#1E293B] font-mono font-semibold">GIS Officer Sharma (Tehsildar)</span>.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block text-[#1E293B] font-medium mb-1">Officer Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-md px-3 py-2 text-[#1E293B] focus:outline-none focus:border-[#0F766E] font-mono"
            />
          </div>

          <div>
            <label className="block text-[#1E293B] font-medium mb-1">Passcode / Token</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-md px-3 py-2 text-[#1E293B] focus:outline-none focus:border-[#0F766E]"
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center space-x-2 py-2.5 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-md font-semibold transition-colors shadow-xs mt-2 text-xs"
          >
            <span>Enter GIS Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-[#E2E8F0] text-[11px] text-[#64748B]">
          Department of Urban Land Records &amp; Geospatial Information System
        </div>

      </div>
    </div>
  );
}

