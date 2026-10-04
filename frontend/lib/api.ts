import {
  Dataset,
  DashboardStats,
  HarmonizationRunResponse,
  ParcelListItem,
  ParcelDetail,
  ConflictItem,
  ReviewItem,
  AuditLogItem,
  HarmonizationWeights
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export async function fetchHealth(): Promise<any> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error("Backend health check failed");
  return res.json();
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/dashboard/stats`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch dashboard stats");
  return res.json();
}

export async function fetchDatasets(): Promise<Dataset[]> {
  const res = await fetch(`${API_BASE}/datasets`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch datasets");
  return res.json();
}

export async function fetchDatasetDetail(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/datasets/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch dataset details");
  return res.json();
}

export async function uploadDataset(formData: FormData): Promise<any> {
  const res = await fetch(`${API_BASE}/datasets/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to upload dataset");
  }
  return res.json();
}

export async function deleteDataset(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/datasets/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete dataset");
  return res.json();
}

export async function runHarmonization(params?: {
  weights?: HarmonizationWeights;
  area_threshold_pct?: number;
  owner_similarity_threshold?: number;
}): Promise<HarmonizationRunResponse> {
  const res = await fetch(`${API_BASE}/harmonization/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params || {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Harmonization run failed");
  }
  return res.json();
}

export async function fetchParcels(params?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ total: number; page: number; limit: number; items: ParcelListItem[] }> {
  const query = new URLSearchParams();
  if (params?.status) query.append("status", params.status);
  if (params?.search) query.append("search", params.search);
  if (params?.page) query.append("page", params.page.toString());
  if (params?.limit) query.append("limit", params.limit.toString());

  const res = await fetch(`${API_BASE}/parcels?${query.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch parcels");
  return res.json();
}

export async function fetchParcelDetail(id: string): Promise<ParcelDetail> {
  const res = await fetch(`${API_BASE}/parcels/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch parcel detail");
  return res.json();
}

export async function fetchConflicts(params?: {
  status?: string;
  severity?: string;
  type?: string;
  limit?: number;
}): Promise<ConflictItem[]> {
  const query = new URLSearchParams();
  if (params?.status) query.append("status", params.status);
  if (params?.severity) query.append("severity", params.severity);
  if (params?.type) query.append("type", params.type);
  if (params?.limit) query.append("limit", params.limit.toString());

  const res = await fetch(`${API_BASE}/conflicts?${query.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch conflicts");
  return res.json();
}

export async function resolveConflict(
  id: string,
  payload: { decision: string; resolution_notes: string; reviewer: string }
): Promise<any> {
  const res = await fetch(`${API_BASE}/conflicts/${id}/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to resolve conflict");
  return res.json();
}

export async function fetchReviews(): Promise<ReviewItem[]> {
  const res = await fetch(`${API_BASE}/reviews`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch reviews");
  return res.json();
}

export async function submitReview(payload: {
  parcel_id: string;
  conflict_id?: string;
  reviewer: string;
  decision: string;
  comment: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to submit review");
  return res.json();
}

export async function fetchAuditLogs(limit: number = 100): Promise<AuditLogItem[]> {
  const res = await fetch(`${API_BASE}/audit-log?limit=${limit}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch audit logs");
  return res.json();
}

export async function fetchMapParcels(): Promise<any> {
  const res = await fetch(`${API_BASE}/map/parcels`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch map parcels");
  return res.json();
}

export async function fetchMapLayers(): Promise<any> {
  const res = await fetch(`${API_BASE}/map/layers`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch map layers");
  return res.json();
}

export async function generateDemoDatasets(seed: number = 42, count: number = 100): Promise<any> {
  const res = await fetch(`${API_BASE}/demo/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ seed, parcel_count: count }),
  });
  if (!res.ok) throw new Error("Failed to generate demo datasets");
  return res.json();
}

export async function fetchAiDisputeAdvice(conflictId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/conflicts/${conflictId}/ai-advise`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error("Failed to generate AI dispute advice");
  return res.json();
}

export async function fetchParcelCertificate(parcelId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/parcels/${parcelId}/certificate`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch parcel certificate");
  return res.json();
}

export async function fetchMapBuffers(): Promise<any> {
  const res = await fetch(`${API_BASE}/map/buffers`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch map buffers & encroachments");
  return res.json();
}
