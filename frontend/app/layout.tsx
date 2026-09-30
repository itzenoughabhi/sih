import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { NavProvider } from "@/components/NavContext";

export const metadata: Metadata = {
  title: "BhuSync AI — Urban Land Record Harmonization",
  description: "Automated Integration and Intelligent Harmonization of Multi-source Geospatial Data for Urban Land Record Management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F8FAFC] text-[#1E293B] antialiased flex flex-row overflow-x-hidden">
        <NavProvider>
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 min-h-screen">
            {/* Statutory Synthetic Data Disclaimer Banner (Sections 15 & 19) */}
            <div className="bg-[#FEF3C7] border-b border-[#FDE68A] text-[#92400E] px-3 sm:px-4 py-1.5 text-[10px] sm:text-[11px] font-medium flex items-center justify-between shadow-xs flex-shrink-0">
              <div className="flex items-center space-x-1.5 sm:space-x-2 truncate">
                <span className="font-bold tracking-wide uppercase px-1.5 py-0.5 bg-[#FDE68A] rounded text-[9px] sm:text-[10px] flex-shrink-0">
                  DEMO DATA
                </span>
                <span className="truncate">
                  NOT AN OFFICIAL LAND RECORD • Vasai-Virar Urban Study Zone (Maharashtra) — Simulated data for hackathon evaluation.
                </span>
              </div>
              <span className="hidden md:inline text-[10px] font-mono text-[#B45309] flex-shrink-0 ml-2">
                Zone: Vasai-Virar (UTM 43N)
              </span>
            </div>
            <Header />
            <main className="flex-1 p-3 sm:p-5 lg:p-6 overflow-y-auto">
              {children}
            </main>
          </div>
        </NavProvider>
      </body>
    </html>
  );
}
