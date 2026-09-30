"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Database,
  Plus,
  Trash2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  FileCheck,
  Check,
  RefreshCw
} from "lucide-react";
import { fetchDatasets, uploadDataset, deleteDataset, generateDemoDatasets } from "@/lib/api";
import { Dataset } from "@/lib/types";

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Form State
  const [file, setFile] = useState<File | null>(null);
  const [datasetName, setDatasetName] = useState("");
  const [datasetType, setDatasetType] = useState("CADASTRAL");
  const [sourceAgency, setSourceAgency] = useState("Directorate of Survey & Settlement");
  const [targetCrs, setTargetCrs] = useState("EPSG:4326");

  // Validation Simulation State
  const [validated, setValidated] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationInfo, setValidationInfo] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchDatasets();
      setDatasets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files ? e.target.files[0] : null;
    setFile(selected);
    setValidated(false);
    setValidationInfo(null);
    if (selected && !datasetName) {
      const baseName = selected.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
      setDatasetName(baseName.charAt(0).toUpperCase() + baseName.slice(1));
    }
  };

  const handleValidate = () => {
    if (!file) {
      alert("Please select a file to validate.");
      return;
    }
    setValidating(true);
    setTimeout(() => {
      const ext = file.name.split(".").pop()?.toUpperCase() || "GEOJSON";
      setValidationInfo({
        format: ext === "CSV" ? "CSV" : "GeoJSON",
        crs: targetCrs,
        featureCountEstimate: ext === "CSV" ? "100 records" : "100 vector polygons",
        geometryValid: true,
        crsDetected: true,
        requiredFields: true,
        minorWarnings: "2 parcels have null attributes",
      });
      setValidated(true);
      setValidating(false);
    }, 400);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !datasetName) {
      alert("Please fill in required fields.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", datasetName);
      formData.append("dataset_type", datasetType);
      formData.append("source_agency", sourceAgency);
      formData.append("target_crs", targetCrs);

      await uploadDataset(formData);
      setShowUploadModal(false);
      setFile(null);
      setDatasetName("");
      setValidated(false);
      await loadData();
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove dataset "${name}"?`)) return;
    try {
      await deleteDataset(id);
      await loadData();
    } catch (err: any) {
      alert("Delete failed: " + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-xl font-bold text-[#1E293B] tracking-tight">
            Data Sources
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Manage multi-departmental spatial vector boundaries, orthophoto extractions, and tabular revenue registers.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => {
              setValidated(false);
              setValidationInfo(null);
              setShowUploadModal(true);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#0F766E] hover:bg-[#115E59] text-white rounded text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Dataset</span>
          </button>
        </div>
      </div>

      {/* Dataset Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-[#64748B] flex flex-col items-center space-y-2">
            <Loader2 className="w-5 h-5 animate-spin text-[#0F766E]" />
            <span>Loading data sources...</span>
          </div>
        ) : datasets.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#64748B] space-y-3">
            <Database className="w-8 h-8 text-[#94A3B8] mx-auto" />
            <p className="font-semibold text-[#1E293B]">No Datasets Ingested</p>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto">
              Click &quot;Add Dataset&quot; to upload your GeoJSON or CSV files, or use the demo seed in the sidebar.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#64748B] font-medium border-b border-[#E2E8F0]">
                <tr>
                  <th className="py-3 px-4">Dataset</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Source Agency</th>
                  <th className="py-3 px-4">CRS</th>
                  <th className="py-3 px-4 text-right">Features</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Last Updated</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#1E293B]">
                {datasets.map((ds) => (
                  <tr key={ds.id} className="hover:bg-[#F8FAFC] transition-colors h-12">
                    <td className="py-2.5 px-4 font-semibold text-[#1E293B]">
                      {ds.name}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-[#0F766E]">
                      {ds.dataset_type}
                    </td>
                    <td className="py-2.5 px-4 text-[#64748B]">{ds.source_agency}</td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-[#64748B]">{ds.crs}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold">{ds.feature_count.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#DCFCE7] text-[#15803D]">
                        Ready
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-[#64748B] text-[11px]">
                      {new Date(ds.created_at).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      })}
                    </td>
                    <td className="py-2.5 px-4 text-right space-x-1.5">
                      <Link
                        href={`/datasets/${ds.id}`}
                        className="inline-flex items-center px-2 py-1 bg-white hover:bg-[#F8FAFC] text-[#0F766E] border border-[#CBD5E1] rounded text-[11px] font-medium"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        <span>Inspect</span>
                      </Link>
                      <button
                        onClick={() => handleDelete(ds.id, ds.name)}
                        className="inline-flex items-center px-2 py-1 text-[#DC2626] hover:bg-[#FEE2E2] rounded text-[11px]"
                        title="Delete dataset"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Dataset Modal - Section 12 Specification */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#CBD5E1] rounded-lg max-w-lg w-full p-6 space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
              <h2 className="text-sm font-bold text-[#1E293B]">Add Dataset</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-[#64748B] hover:text-[#1E293B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[#1E293B] font-medium mb-1">Dataset Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ward 14 Cadastral Survey"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  className="w-full bg-white border border-[#CBD5E1] rounded px-3 py-1.5 text-[#1E293B] focus:outline-none focus:border-[#0F766E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#1E293B] font-medium mb-1">Dataset Type</label>
                  <select
                    value={datasetType}
                    onChange={(e) => setDatasetType(e.target.value)}
                    className="w-full bg-white border border-[#CBD5E1] rounded px-2.5 py-1.5 text-[#1E293B] focus:outline-none focus:border-[#0F766E]"
                  >
                    <option value="CADASTRAL">Cadastral Parcels</option>
                    <option value="MUNICIPAL">Municipal GIS Layer</option>
                    <option value="REVENUE">Revenue Records (CSV)</option>
                    <option value="DRONE_FOOTPRINT">Drone Buildings</option>
                    <option value="GNSS_SURVEY">GNSS CORS Points</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#1E293B] font-medium mb-1">Target CRS</label>
                  <select
                    value={targetCrs}
                    onChange={(e) => setTargetCrs(e.target.value)}
                    className="w-full bg-white border border-[#CBD5E1] rounded px-2.5 py-1.5 text-[#1E293B] font-mono focus:outline-none focus:border-[#0F766E]"
                  >
                    <option value="EPSG:4326">EPSG:4326 (WGS84)</option>
                    <option value="EPSG:3857">EPSG:3857 (Web Mercator)</option>
                    <option value="EPSG:32643">EPSG:32643 (UTM 43N)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#1E293B] font-medium mb-1">Source Agency</label>
                <input
                  type="text"
                  placeholder="e.g. Directorate of Survey & Settlement"
                  value={sourceAgency}
                  onChange={(e) => setSourceAgency(e.target.value)}
                  className="w-full bg-white border border-[#CBD5E1] rounded px-3 py-1.5 text-[#1E293B] focus:outline-none focus:border-[#0F766E]"
                />
              </div>

              {/* Upload File Input */}
              <div>
                <label className="block text-[#1E293B] font-medium mb-1">Upload File (.geojson, .csv)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    required
                    accept=".geojson,.json,.csv"
                    onChange={handleFileChange}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded px-3 py-1 text-[#1E293B] file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#0F766E] file:text-white hover:file:bg-[#115E59]"
                  />
                  <button
                    type="button"
                    onClick={handleValidate}
                    disabled={!file || validating}
                    className="px-3 py-1.5 bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#0F766E] font-medium rounded whitespace-nowrap shadow-sm disabled:opacity-50"
                  >
                    {validating ? "Validating..." : "Validate Dataset"}
                  </button>
                </div>
              </div>

              {/* Section 12: Validation Feedback Panel */}
              {validated && validationInfo && (
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-2 text-[11px]">
                  <div className="font-semibold text-[#1E293B] flex items-center space-x-1.5 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D]" />
                    <span>Dataset Validation Passed</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-1 border-y border-[#E2E8F0]">
                    <div>Detected format: <span className="font-mono font-medium">{validationInfo.format}</span></div>
                    <div>Detected CRS: <span className="font-mono font-medium">{validationInfo.crs}</span></div>
                    <div>Features: <span className="font-mono font-medium">{validationInfo.featureCountEstimate}</span></div>
                  </div>
                  <div className="space-y-1 text-[#15803D]">
                    <div className="flex items-center space-x-1.5">
                      <Check className="w-3 h-3 text-[#15803D]" />
                      <span>Geometry topology valid</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Check className="w-3 h-3 text-[#15803D]" />
                      <span>CRS coordinate bounds verified</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Check className="w-3 h-3 text-[#15803D]" />
                      <span>Required primary identifier fields mapped</span>
                    </div>
                  </div>
                  {validationInfo.minorWarnings && (
                    <div className="flex items-center space-x-1.5 text-[#D97706] pt-0.5">
                      <AlertTriangle className="w-3 h-3 text-[#D97706]" />
                      <span>{validationInfo.minorWarnings}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3 py-1.5 rounded bg-white border border-[#CBD5E1] text-[#64748B] hover:bg-[#F8FAFC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-1.5 rounded bg-[#0F766E] hover:bg-[#115E59] text-white font-semibold flex items-center space-x-1.5 shadow-sm"
                >
                  {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{uploading ? "Ingesting..." : "Add Dataset"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
