export interface ColumnMeta {
  name: string;
  dtype: string;
  missing_count: number;
  is_numeric: boolean;
  unique_count: number;
  sample_values: any[];
  suggested_role: string;
}

export interface Dataset {
  id: string;
  filename: string;
  original_filename: string;
  file_size_bytes: number;
  row_count: number;
  column_count: number;
  has_labels: boolean;
  has_ips: boolean;
  has_timestamps: boolean;
  created_at: string;
  columns_metadata?: ColumnMeta[];
}

export interface DatasetPreview {
  dataset: Dataset;
  preview_rows: Record<string, any>[];
  total_rows: number;
  total_columns: number;
  missing_summary: Record<string, number>;
  duplicate_rows_count: number;
}

export interface AnalysisJob {
  id: string;
  dataset_id: string;
  pipeline_type: string;
  status: string;
  total_records: number;
  anomalies_detected: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  execution_time_seconds: number;
  summary_metrics?: Record<string, any>;
  created_at: string;
  error_message?: string;
}

export interface DashboardStats {
  total_records_analyzed: number;
  total_anomalies_detected: number;
  high_risk_alerts: number;
  active_models_count: number;
  datasets_count: number;
  last_analysis_time: string | null;
  traffic_class_distribution: { name: string; count: number }[];
  risk_level_distribution: { level: string; count: number }[];
  anomaly_score_bins: { bin: string; count: number }[];
  timeline_trend: { timestamp: string; total_records: number; anomalies: number; high_risk: number }[];
}

export interface TrainedModel {
  id: string;
  name: string;
  algorithm: string;
  task_type: string;
  dataset_name: string | null;
  training_rows: number;
  test_rows: number;
  features_used: string[];
  target_column: string | null;
  classes: string[] | null;
  accuracy: number | null;
  precision_macro: number | null;
  recall_macro: number | null;
  f1_macro: number | null;
  roc_auc: number | null;
  confusion_matrix: number[][] | null;
  class_report: Record<string, any> | null;
  feature_importances: { feature: string; importance: number }[] | null;
  created_at: string;
  status: string;
}

export interface ExplanationItem {
  feature: string;
  value: number;
  baseline_mean: number;
  z_score: number;
  contribution_score: number;
  rationale: string;
  method: string;
}

export interface Alert {
  id: string;
  analysis_id: string;
  dataset_id: string;
  row_index: number;
  timestamp_str: string | null;
  source_ip: string | null;
  destination_ip: string | null;
  source_port: number | null;
  destination_port: number | null;
  protocol: string | null;
  predicted_label: string;
  anomaly_score: number;
  is_anomaly: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'NEW' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE';
  analyst_notes: string | null;
  features_payload: Record<string, any> | null;
  top_explanations: ExplanationItem[] | null;
  created_at: string;
}

export interface AlertListResponse {
  alerts: Alert[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface InvestigationNote {
  id: string;
  investigation_id: string;
  author: string;
  content: string;
  note_type: string;
  created_at: string;
}

export interface Investigation {
  id: string;
  title: string;
  summary: string | null;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  correlation_reason: string | null;
  target_entity: string | null;
  alert_count: number;
  created_at: string;
  updated_at: string;
  notes: InvestigationNote[];
  alerts: Alert[];
}

export interface AIAssistantResponse {
  summary: string;
  observed_facts: string[];
  model_predictions: string[];
  hypotheses: string[];
  suggested_steps: string[];
  provider_used: string;
  limitations_notice: string;
}

export interface TopologyData {
  available: boolean;
  reason: string | null;
  total_nodes?: number;
  total_edges?: number;
  nodes: any[];
  edges: any[];
}

export interface SystemStatus {
  project_name: string;
  version: string;
  database: {
    type: string;
    connected: boolean;
    url: string;
  };
  inventory: {
    datasets_count: number;
    trained_models_count: number;
    analyses_executed: number;
    total_alerts: number;
  };
  integrations: {
    gemini_api_configured: boolean;
    gemini_model: string;
  };
  monitoring: {
    is_enabled: boolean;
    status: string;
    message: string;
    authorized_sources_supported: string[];
  };
  limitations: string[];
}
