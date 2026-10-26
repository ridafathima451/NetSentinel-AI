import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Play,
  Download,
  Trash2,
  Eye,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { Dataset, DatasetPreview, AnalysisJob, TrainedModel } from '../types';

export const TrafficAnalysis: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [models, setModels] = useState<TrainedModel[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [previewData, setPreviewData] = useState<DatasetPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisJob | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Analysis run configuration state
  const [showRunModal, setShowRunModal] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<string>('auto');
  const [contamination, setContamination] = useState<number>(0.05);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      const data = await api.getDatasets();
      setDatasets(data);
      if (data.length > 0 && !selectedDataset) {
        setSelectedDataset(data[0]);
        loadPreview(data[0].id);
      }
      const modelList = await api.getModels();
      setModels(modelList);
    } catch (err: any) {
      console.error('Failed to fetch datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const loadPreview = async (datasetId: string) => {
    try {
      const prev = await api.previewDataset(datasetId);
      setPreviewData(prev);
      // Initialize selected features to candidate feature columns
      if (prev.dataset.columns_metadata) {
        const feats = prev.dataset.columns_metadata
          .filter((c) => c.suggested_role === 'feature')
          .map((c) => c.name);
        setSelectedFeatures(feats.length > 0 ? feats : prev.dataset.columns_metadata.map((c) => c.name));
      }
    } catch (err: any) {
      alert(`Preview failed: ${err.message}`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const newDs = await api.uploadDataset(file);
      await fetchDatasets();
      setSelectedDataset(newDs);
      loadPreview(newDs.id);
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateSample = async () => {
    try {
      setUploading(true);
      const sample = await api.generateSampleDataset();
      await fetchDatasets();
      setSelectedDataset(sample);
      loadPreview(sample.id);
    } catch (err: any) {
      alert(`Sample generation error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDataset = async (id: string) => {
    if (!confirm('Are you sure you want to delete this dataset?')) return;
    try {
      await api.deleteDataset(id);
      if (selectedDataset?.id === id) {
        setSelectedDataset(null);
        setPreviewData(null);
      }
      fetchDatasets();
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  const handleRunAnalysis = async () => {
    if (!selectedDataset) return;
    try {
      setAnalyzing(true);
      const job = await api.runAnalysis({
        dataset_id: selectedDataset.id,
        model_id: selectedModelId || undefined,
        mode: analysisMode,
        contamination: contamination,
        selected_features: selectedFeatures.length > 0 ? selectedFeatures : undefined,
      });
      setAnalysisResult(job);
      setShowRunModal(false);
    } catch (err: any) {
      alert(`Analysis failed: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Network Traffic Analysis</h2>
          <p className="text-xs text-cyber-textSecondary mt-0.5">
            Ingest, inspect, validate, and execute machine learning anomaly detection on network packet flows.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 px-3 py-1.5 bg-cyber-card border border-cyber-border hover:border-cyber-accent text-white rounded-lg text-xs font-semibold cursor-pointer transition">
            <UploadCloud className="w-4 h-4 text-cyber-accentBlue" />
            <span>{uploading ? 'Processing File...' : 'Upload CSV Dataset'}</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
          <button
            onClick={handleGenerateSample}
            disabled={uploading}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-xs font-semibold hover:from-blue-500 hover:to-indigo-500 transition shadow-glow"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Research Sample</span>
          </button>
        </div>
      </div>

      {/* Dataset Selector & Management */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="cyber-card p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyber-textSecondary flex items-center justify-between">
            <span>Available Datasets</span>
            <span className="text-[10px] text-cyber-textMuted">{datasets.length} files</span>
          </h3>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {datasets.map((d) => {
              const isSelected = selectedDataset?.id === d.id;
              return (
                <div
                  key={d.id}
                  onClick={() => {
                    setSelectedDataset(d);
                    loadPreview(d.id);
                  }}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-cyber-accent/15 border-cyber-accent/50 text-white'
                      : 'bg-cyber-surface border-cyber-border hover:border-cyber-borderGlow text-cyber-textSecondary'
                  }`}
                >
                  <div className="truncate mr-2">
                    <p className="font-semibold truncate">{d.original_filename}</p>
                    <p className="text-[10px] text-cyber-textMuted mt-0.5">
                      {d.row_count.toLocaleString()} rows • {(d.file_size_bytes / 1024).toFixed(0)} KB
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDataset(d.id);
                    }}
                    className="text-cyber-textMuted hover:text-red-400 p-1"
                    title="Delete dataset"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
            {datasets.length === 0 && !loading && (
              <p className="text-xs text-cyber-textMuted py-4 text-center">
                No datasets yet. Upload a CSV or generate a sample above.
              </p>
            )}
          </div>
        </div>

        {/* Selected Dataset Details & Analysis Action Bar */}
        <div className="lg:col-span-3 cyber-card p-5 space-y-4">
          {selectedDataset ? (
            <>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-cyber-border gap-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <FileSpreadsheet className="w-4 h-4 text-cyber-accentBlue" />
                    <span>{selectedDataset.original_filename}</span>
                  </h3>
                  <div className="flex items-center space-x-3 text-xs text-cyber-textSecondary mt-1">
                    <span>Rows: <strong className="text-white font-mono">{selectedDataset.row_count.toLocaleString()}</strong></span>
                    <span>•</span>
                    <span>Columns: <strong className="text-white font-mono">{selectedDataset.column_count}</strong></span>
                    <span>•</span>
                    <span>Labels: <strong className={selectedDataset.has_labels ? 'text-emerald-400' : 'text-amber-400'}>{selectedDataset.has_labels ? 'Detected' : 'Unlabeled'}</strong></span>
                    <span>•</span>
                    <span>IP Endpoints: <strong className={selectedDataset.has_ips ? 'text-emerald-400' : 'text-slate-400'}>{selectedDataset.has_ips ? 'Mapped' : 'Not Present'}</strong></span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowRunModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-lg text-xs font-semibold transition shadow-glow"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Run ML Pipeline</span>
                  </button>
                </div>
              </div>

              {/* Data Quality & Schema Inspection */}
              {previewData && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-cyber-surface rounded-lg border border-cyber-border">
                      <span className="text-cyber-textMuted block text-[10px] uppercase">Missing Values</span>
                      <span className="font-mono text-sm font-bold text-white">
                        {Object.values(previewData.missing_summary).reduce((a, b) => a + b, 0)}
                      </span>
                    </div>
                    <div className="p-3 bg-cyber-surface rounded-lg border border-cyber-border">
                      <span className="text-cyber-textMuted block text-[10px] uppercase">Duplicate Rows</span>
                      <span className="font-mono text-sm font-bold text-white">
                        {previewData.duplicate_rows_count}
                      </span>
                    </div>
                    <div className="p-3 bg-cyber-surface rounded-lg border border-cyber-border">
                      <span className="text-cyber-textMuted block text-[10px] uppercase">Feature Columns</span>
                      <span className="font-mono text-sm font-bold text-cyber-accentBlue">
                        {previewData.dataset.columns_metadata?.filter((c) => c.suggested_role === 'feature').length || 0}
                      </span>
                    </div>
                    <div className="p-3 bg-cyber-surface rounded-lg border border-cyber-border">
                      <span className="text-cyber-textMuted block text-[10px] uppercase">Validation Status</span>
                      <span className="font-mono text-sm font-bold text-emerald-400 flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ready for ML</span>
                      </span>
                    </div>
                  </div>

                  {/* Preview Table */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-cyber-textSecondary mb-2">
                      Dataset Preview (First {previewData.preview_rows.length} Records)
                    </h4>
                    <div className="overflow-x-auto border border-cyber-border rounded-lg max-h-72">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-cyber-surface sticky top-0">
                          <tr className="border-b border-cyber-border text-cyber-textMuted text-[10px] uppercase font-semibold">
                            {previewData.dataset.columns_metadata?.map((col) => (
                              <th key={col.name} className="py-2 px-3 whitespace-nowrap">
                                <div>{col.name}</div>
                                <span className="text-[9px] text-cyber-accentBlue font-mono lowercase">
                                  {col.dtype} ({col.suggested_role})
                                </span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-cyber-border/40">
                          {previewData.preview_rows.map((row, i) => (
                            <tr key={i} className="hover:bg-cyber-surface/40 font-mono text-[11px]">
                              {previewData.dataset.columns_metadata?.map((col) => (
                                <td key={col.name} className="py-1.5 px-3 whitespace-nowrap text-cyber-textSecondary">
                                  {String(row[col.name] ?? '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-16 text-center text-cyber-textMuted text-xs">
              Select or upload a dataset to inspect its structure and run the ML pipeline.
            </div>
          )}
        </div>
      </div>

      {/* Analysis Result Banner */}
      {analysisResult && (
        <div className="cyber-card p-5 border-emerald-500/40 bg-emerald-950/10 space-y-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className="text-sm font-bold text-emerald-300 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Analysis Complete — {analysisResult.pipeline_type}</span>
              </h3>
              <p className="text-xs text-cyber-textSecondary mt-0.5">
                Evaluated {analysisResult.total_records.toLocaleString()} traffic records in {analysisResult.execution_time_seconds} seconds.
              </p>
            </div>
            <a
              href={api.getExportCsvUrl(analysisResult.id)}
              download
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Results CSV</span>
            </a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
            <div className="p-2.5 bg-cyber-bg/80 rounded border border-cyber-border">
              <span className="text-cyber-textMuted block text-[10px]">Anomalies Detected</span>
              <span className="font-mono text-base font-bold text-red-400">
                {analysisResult.anomalies_detected.toLocaleString()}
              </span>
            </div>
            <div className="p-2.5 bg-cyber-bg/80 rounded border border-cyber-border">
              <span className="text-cyber-textMuted block text-[10px]">High-Risk Alerts</span>
              <span className="font-mono text-base font-bold text-orange-400">
                {analysisResult.high_risk_count.toLocaleString()}
              </span>
            </div>
            <div className="p-2.5 bg-cyber-bg/80 rounded border border-cyber-border">
              <span className="text-cyber-textMuted block text-[10px]">Medium-Risk Alerts</span>
              <span className="font-mono text-base font-bold text-amber-400">
                {analysisResult.medium_risk_count.toLocaleString()}
              </span>
            </div>
            <div className="p-2.5 bg-cyber-bg/80 rounded border border-cyber-border">
              <span className="text-cyber-textMuted block text-[10px]">Execution Time</span>
              <span className="font-mono text-base font-bold text-blue-400">
                {analysisResult.execution_time_seconds}s
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Run Analysis Modal */}
      {showRunModal && selectedDataset && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="cyber-card p-6 w-full max-w-lg bg-cyber-card border-cyber-borderGlow space-y-5">
            <div className="flex justify-between items-center border-b border-cyber-border pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-cyber-accentBlue" />
                <span>Configure ML Analysis Pipeline</span>
              </h3>
              <button
                onClick={() => setShowRunModal(false)}
                className="text-cyber-textMuted hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-cyber-textSecondary mb-1 font-semibold">Analysis Mode</label>
                <select
                  value={analysisMode}
                  onChange={(e) => setAnalysisMode(e.target.value)}
                  className="w-full p-2 bg-cyber-surface border border-cyber-border rounded-lg text-white"
                >
                  <option value="auto">Auto (Hybrid if model available, else Isolation Forest)</option>
                  <option value="unsupervised">Unsupervised Only (Isolation Forest)</option>
                  <option value="supervised" disabled={models.length === 0}>
                    Supervised Only (Requires Trained Model)
                  </option>
                  <option value="hybrid" disabled={models.length === 0}>
                    Hybrid Ensemble (Isolation Forest + Supervised)
                  </option>
                </select>
              </div>

              {models.length > 0 && (analysisMode === 'hybrid' || analysisMode === 'supervised') && (
                <div>
                  <label className="block text-cyber-textSecondary mb-1 font-semibold">Trained Classifier</label>
                  <select
                    value={selectedModelId}
                    onChange={(e) => setSelectedModelId(e.target.value)}
                    className="w-full p-2 bg-cyber-surface border border-cyber-border rounded-lg text-white"
                  >
                    <option value="">Select trained model...</option>
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} (Acc: {m.accuracy ? `${(m.accuracy * 100).toFixed(1)}%` : 'N/A'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-cyber-textSecondary font-semibold">
                    Expected Contamination Rate (Anomaly Prior):
                  </label>
                  <span className="font-mono text-cyber-accentBlue font-bold">{(contamination * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.01"
                  max="0.25"
                  step="0.01"
                  value={contamination}
                  onChange={(e) => setContamination(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500"
                />
                <span className="text-[10px] text-cyber-textMuted block mt-1">
                  Estimated proportion of malicious or outlier flows expected in this traffic capture.
                </span>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-cyber-border">
              <button
                onClick={() => setShowRunModal(false)}
                className="px-4 py-2 border border-cyber-border rounded-lg text-xs text-cyber-textSecondary hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleRunAnalysis}
                disabled={analyzing}
                className="flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-xs font-semibold hover:from-blue-500 hover:to-indigo-500 transition shadow-glow"
              >
                <Play className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
                <span>{analyzing ? 'Processing Dataset...' : 'Execute Analysis'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
