export interface Dataset {
  id: string;
  name: string;
  dataset_type: "CADASTRAL" | "MUNICIPAL" | "REVENUE" | "DRONE_FOOTPRINT" | "GNSS_SURVEY";
  source_agency: string;
  file_format: string;
  crs: string;
  feature_count: number;
  status: string;
  created_at: string;
}

export interface HarmonizationWeights {
  geometry: number;
  area: number;
  location: number;
  attributes: number;
  gnss: number;
}

export interface HarmonizationRunResponse {
  job_id: string;
  status: string;
  total_processed: number;
  high_confidence_matches: number;
  review_required: number;
  conflicts_detected: number;
  topology_issues: number;
  duration_seconds: number;
}

export interface ParcelListItem {
  id: string;
  parcel_id: string;
  survey_number?: string;
  owner_name?: string;
  area: number;
  land_use: string;
  ward?: string;
  municipality?: string;
  confidence?: number;
  status: "HIGH_CONFIDENCE" | "NEEDS_REVIEW" | "CONFLICT";
  has_conflict: boolean;
}

export interface ConfidenceBreakdown {
  overall: number;
  geometry: number;
  area: number;
  location: number;
  attributes: number;
  gnss: number;
}

export interface ConflictItem {
  id: string;
  parcel_id: string;
  parcel_identifier?: string;
  conflict_type: "AREA_MISMATCH" | "OWNER_MISMATCH" | "GEOMETRY_SHIFT" | "TOPOLOGY_VIOLATION" | "MISSING_ATTRIBUTES";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  source_a: string;
  source_b: string;
  difference: string;
  status: "OPEN" | "RESOLVED" | "REJECTED" | "FLAGGED_RESURVEY";
  resolution?: string;
  created_at: string;
}

export interface ReviewItem {
  id: string;
  parcel_id: string;
  conflict_id?: string;
  reviewer: string;
  decision: string;
  comment: string;
  created_at: string;
}

export interface ParcelDetail {
  id: string;
  parcel_id: string;
  survey_number?: string;
  owner_name?: string;
  area: number;
  land_use: string;
  ward?: string;
  municipality?: string;
  sources: {
    cadastral: Record<string, any>;
    municipal: Record<string, any>;
    revenue: Record<string, any>;
    drone: Record<string, any>;
    gnss: Record<string, any>;
  };
  confidence: ConfidenceBreakdown;
  status?: "HIGH_CONFIDENCE" | "NEEDS_REVIEW" | "CONFLICT";
  explanation: string;
  conflicts: ConflictItem[];
  reviews: ReviewItem[];
  geometry: any;
  unified_geometry?: any;
}

export interface DashboardStats {
  datasets_count: number;
  parcels_count: number;
  high_confidence_count: number;
  needs_review_count: number;
  conflicts_count: number;
  topology_issues_count: number;
  conflicts_by_type: Record<string, number>;
  confidence_distribution: {
    bracket: string;
    count: number;
    color: string;
  }[];
}

export interface AuditLogItem {
  id: string;
  action: string;
  entity: string;
  entity_id: string;
  user: string;
  details: Record<string, any>;
  timestamp: string;
}
