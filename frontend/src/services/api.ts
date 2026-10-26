import {
  Dataset,
  DatasetPreview,
  AnalysisJob,
  DashboardStats,
  TrainedModel,
  Alert,
  AlertListResponse,
  Investigation,
  InvestigationNote,
  AIAssistantResponse,
  TopologyData,
  SystemStatus,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      ...options?.headers,
    },
  });

  if (!res.ok) {
    let errorDetail = 'API request failed';
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || errorDetail;
    } catch {
      errorDetail = await res.text();
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

export const api = {
  // System & Health
  getHealth: () => request<{ status: string; service: string; version: string; database_connected: boolean }>('/health'),
  getSystemStatus: () => request<SystemStatus>('/system/status'),

  // Datasets
  getDatasets: () => request<Dataset[]>('/datasets'),
  previewDataset: (id: string) => request<DatasetPreview>(`/datasets/${id}/preview`),
  uploadDataset: async (file: File): Promise<Dataset> => {
    const formData = new FormData();
    formData.append('file', file);
    return request<Dataset>('/datasets/upload', {
      method: 'POST',
      body: formData,
    });
  },
  generateSampleDataset: () => request<Dataset>('/datasets/generate-sample', { method: 'POST' }),
  deleteDataset: (id: string) => request<{ message: string }>(`/datasets/${id}`, { method: 'DELETE' }),

  // Models
  getModels: () => request<TrainedModel[]>('/models'),
  getModel: (id: string) => request<TrainedModel>(`/models/${id}`),
  trainModel: (payload: {
    dataset_id: string;
    algorithm?: string;
    target_column?: string;
    feature_columns?: string[];
    test_size?: number;
    n_estimators?: number;
    max_depth?: number;
  }) => request<TrainedModel>('/models/train', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }),
  deleteModel: (id: string) => request<{ message: string }>(`/models/${id}`, { method: 'DELETE' }),

  // Analysis & Dashboard
  getDashboardStats: () => request<DashboardStats>('/analysis/dashboard'),
  runAnalysis: (payload: {
    dataset_id: string;
    model_id?: string;
    mode?: string;
    contamination?: number;
    selected_features?: string[];
  }) => request<AnalysisJob>('/analysis/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }),
  getExportCsvUrl: (jobId: string) => `${API_BASE}/analysis/${jobId}/export-csv`,

  // Alerts
  getAlerts: (params: {
    risk_level?: string;
    status?: string;
    predicted_label?: string;
    dataset_id?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }) => {
    const query = new URLSearchParams();
    if (params.risk_level) query.set('risk_level', params.risk_level);
    if (params.status) query.set('status', params.status);
    if (params.predicted_label) query.set('predicted_label', params.predicted_label);
    if (params.dataset_id) query.set('dataset_id', params.dataset_id);
    if (params.search) query.set('search', params.search);
    if (params.page) query.set('page', params.page.toString());
    if (params.page_size) query.set('page_size', params.page_size.toString());

    return request<AlertListResponse>(`/alerts?${query.toString()}`);
  },
  getAlert: (id: string) => request<Alert>(`/alerts/${id}`),
  updateAlertStatus: (id: string, payload: { status: string; analyst_notes?: string }) => request<Alert>(`/alerts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }),

  // Investigations
  getInvestigations: (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return request<Investigation[]>(`/investigations${query}`);
  },
  getInvestigation: (id: string) => request<Investigation>(`/investigations/${id}`),
  createInvestigation: (payload: { title: string; summary?: string; priority?: string; alert_ids?: string[] }) =>
    request<Investigation>('/investigations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  autoCorrelateAlerts: () => request<{ message: string }>('/investigations/auto-correlate', { method: 'POST' }),
  updateInvestigation: (id: string, payload: { title?: string; summary?: string; status?: string; priority?: string }) =>
    request<Investigation>(`/investigations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  addInvestigationNote: (id: string, payload: { content: string; author?: string }) =>
    request<InvestigationNote>(`/investigations/${id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  // AI Assistant
  queryAssistant: (payload: {
    alert_id?: string;
    investigation_id?: string;
    dataset_id?: string;
    query?: string;
  }) => request<AIAssistantResponse>('/assistant/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }),

  // Reports
  getHtmlReportUrl: (analysisId: string) => `${API_BASE}/reports/analysis/${analysisId}/html`,

  // Topology
  getTopology: (datasetId: string) => request<TopologyData>(`/topology/${datasetId}`),
};
