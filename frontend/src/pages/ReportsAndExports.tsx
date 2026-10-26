import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  ExternalLink,
  Printer,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import { api } from '../services/api';
import { AnalysisJob, Dataset } from '../types';

export const ReportsAndExports: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string>('');
  const [htmlPreviewUrl, setHtmlPreviewUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const dsList = await api.getDatasets();
        setDatasets(dsList);
        const stats = await api.getDashboardStats();
        // Check if there are existing analysis jobs
        const alertsRes = await api.getAlerts({ page: 1, page_size: 5 });
        if (alertsRes.alerts.length > 0) {
          const firstJobId = alertsRes.alerts[0].analysis_id;
          setSelectedAnalysisId(firstJobId);
          setHtmlPreviewUrl(api.getHtmlReportUrl(firstJobId));
        }
      } catch (err: any) {
        console.error('Failed to load report data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Reports & Compliance Exports</h2>
          <p className="text-xs text-cyber-textSecondary mt-0.5">
            Downloadable executive summaries, technical incident evidence, and tabular CSV analytical datasets.
          </p>
        </div>

        {selectedAnalysisId && (
          <div className="flex items-center space-x-3">
            <a
              href={api.getExportCsvUrl(selectedAnalysisId)}
              download
              className="flex items-center space-x-2 px-3 py-1.5 bg-cyber-card border border-cyber-border hover:border-cyber-accent text-white rounded-lg text-xs font-semibold transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-cyber-accentBlue" />
              <span>Download Raw CSV</span>
            </a>
            <a
              href={htmlPreviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-glow transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF Report</span>
            </a>
          </div>
        )}
      </div>

      {/* Report Preview Frame */}
      {htmlPreviewUrl ? (
        <div className="cyber-card p-4 space-y-4">
          <div className="flex justify-between items-center text-xs text-cyber-textSecondary border-b border-cyber-border pb-3">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-cyber-accentBlue" />
              <span>Standalone HTML Report Document Preview</span>
            </div>
            <a
              href={htmlPreviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyber-accentBlue hover:text-white flex items-center space-x-1"
            >
              <span>Open in Full Tab</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="border border-cyber-border rounded-lg overflow-hidden h-[650px] bg-white">
            <iframe
              src={htmlPreviewUrl}
              title="Incident Report Preview"
              className="w-full h-full"
            />
          </div>
        </div>
      ) : (
        <div className="cyber-card p-16 text-center text-cyber-textMuted text-xs space-y-3">
          <FileText className="w-10 h-10 mx-auto text-cyber-textMuted" />
          <p>No analysis reports generated yet. Execute an analysis run on a dataset to generate a full incident report.</p>
        </div>
      )}
    </div>
  );
};
