import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  Bot,
  Info,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { api } from '../services/api';
import { Alert } from '../types';
import { Badge } from '../components/Badge';

interface AlertCenterProps {
  onInvestigateAlert?: (alert: Alert) => void;
}

export const AlertCenter: React.FC<AlertCenterProps> = ({ onInvestigateAlert }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [totalAlerts, setTotalAlerts] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Selected Alert for drawer
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [analystNotes, setAnalystNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.getAlerts({
        risk_level: riskFilter,
        status: statusFilter,
        search: searchTerm || undefined,
        page: page,
        page_size: pageSize,
      });
      setAlerts(res.alerts);
      setTotalAlerts(res.total);
      setTotalPages(res.total_pages);
    } catch (err: any) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [page, riskFilter, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchAlerts();
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedAlert) return;
    try {
      setUpdating(true);
      const updated = await api.updateAlertStatus(selectedAlert.id, {
        status: newStatus,
        analyst_notes: analystNotes,
      });
      setSelectedAlert(updated);
      setAlerts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Security Alert Center</h2>
          <p className="text-xs text-cyber-textSecondary mt-0.5">
            Triage, investigate, and annotate anomalous traffic events with evidence-grounded attribution.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="cyber-card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <form onSubmit={handleSearch} className="flex-1 w-full sm:w-auto relative">
            <Search className="w-4 h-4 text-cyber-textMuted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by IP address or predicted label..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-cyber-surface border border-cyber-border rounded-lg text-white placeholder-cyber-textMuted focus:outline-none focus:border-cyber-accent"
            />
          </form>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-cyber-textMuted shrink-0" />
            <select
              value={riskFilter}
              onChange={(e) => {
                setRiskFilter(e.target.value);
                setPage(1);
              }}
              className="p-2 bg-cyber-surface border border-cyber-border rounded-lg text-white"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="p-2 bg-cyber-surface border border-cyber-border rounded-lg text-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">New</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="RESOLVED">Resolved</option>
              <option value="FALSE_POSITIVE">False Positive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="cyber-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-cyber-surface">
              <tr className="border-b border-cyber-border text-cyber-textMuted uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-4">Alert ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Source → Destination</th>
                <th className="py-3 px-4">Proto</th>
                <th className="py-3 px-4">Predicted Class</th>
                <th className="py-3 px-4">Anomaly Score</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border/40 font-mono text-[11px]">
              {alerts.map((alert) => (
                <tr
                  key={alert.id}
                  onClick={() => {
                    setSelectedAlert(alert);
                    setAnalystNotes(alert.analyst_notes || '');
                  }}
                  className={`cursor-pointer transition ${
                    selectedAlert?.id === alert.id ? 'bg-cyber-accent/15' : 'hover:bg-cyber-surface/60'
                  }`}
                >
                  <td className="py-3 px-4 text-cyber-accentBlue font-bold">{alert.id.slice(0, 8)}</td>
                  <td className="py-3 px-4 text-cyber-textSecondary font-sans">{alert.timestamp_str || 'N/A'}</td>
                  <td className="py-3 px-4 text-white">
                    {alert.source_ip ? (
                      <span>
                        {alert.source_ip}:{alert.source_port} → {alert.destination_ip}:{alert.destination_port}
                      </span>
                    ) : (
                      <span className="text-cyber-textMuted font-sans">Flow Row #{alert.row_index}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-cyber-textSecondary">{alert.protocol || 'IP'}</td>
                  <td className="py-3 px-4 font-sans font-semibold text-white">{alert.predicted_label}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-14 h-1.5 bg-cyber-bg rounded-full overflow-hidden">
                        <div
                          className={`h-full ${alert.anomaly_score > 0.7 ? 'bg-red-500' : 'bg-blue-400'}`}
                          style={{ width: `${Math.round(alert.anomaly_score * 100)}%` }}
                        />
                      </div>
                      <span>{alert.anomaly_score.toFixed(3)}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <Badge label={alert.risk_level} variant="risk" />
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <Badge label={alert.status} variant="status" />
                  </td>
                  <td className="py-3 px-4 text-right font-sans">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAlert(alert);
                        setAnalystNotes(alert.analyst_notes || '');
                      }}
                      className="px-2.5 py-1 bg-cyber-surface border border-cyber-border hover:border-cyber-accent text-cyber-textPrimary rounded text-xs"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
              {alerts.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-cyber-textMuted font-sans">
                    No alerts match the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-cyber-border flex items-center justify-between text-xs text-cyber-textSecondary">
          <span>
            Showing {alerts.length} of {totalAlerts} total alerts
          </span>
          <div className="flex items-center space-x-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded border border-cyber-border bg-cyber-surface disabled:opacity-40 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded border border-cyber-border bg-cyber-surface disabled:opacity-40 hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Alert Evidence & Triage Detail Drawer */}
      {selectedAlert && (
        <div className="cyber-card p-6 space-y-5 border-cyber-accent/50 bg-cyber-surface">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-cyber-border gap-4">
            <div>
              <div className="flex items-center space-x-3">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-cyber-accentBlue" />
                  <span>Evidence Inspection: Alert {selectedAlert.id.slice(0, 8)}</span>
                </h3>
                <Badge label={selectedAlert.risk_level} variant="risk" />
                <Badge label={selectedAlert.status} variant="status" />
              </div>
              <p className="text-xs text-cyber-textSecondary mt-1">
                Recorded {selectedAlert.timestamp_str || 'Timestamp N/A'} • Predicted Label: <strong>{selectedAlert.predicted_label}</strong> • Anomaly Score: <strong>{selectedAlert.anomaly_score.toFixed(4)}</strong>
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {onInvestigateAlert && (
                <button
                  onClick={() => onInvestigateAlert(selectedAlert)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-glow"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Ask AI Copilot</span>
                </button>
              )}
              <button
                onClick={() => setSelectedAlert(null)}
                className="px-2.5 py-1 text-cyber-textMuted hover:text-white text-xs"
              >
                ✕ Close
              </button>
            </div>
          </div>

          {/* Top Contributing Feature Factors */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyber-textSecondary flex items-center space-x-2">
              <Info className="w-3.5 h-3.5 text-cyber-accentBlue" />
              <span>Statistical Feature Attributions (Z-Score Deviation from Baseline)</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedAlert.top_explanations?.map((exp, idx) => (
                <div key={idx} className="p-3 bg-cyber-card rounded-lg border border-cyber-border space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-white">{exp.feature}</span>
                    <span className="font-mono text-xs text-cyber-accentBlue font-bold">
                      {exp.z_score}σ deviation
                    </span>
                  </div>
                  <p className="text-[11px] text-cyber-textSecondary leading-relaxed">
                    {exp.rationale}
                  </p>
                  <div className="text-[10px] text-cyber-textMuted font-mono">
                    Observed: {exp.value} • Baseline Mean: {exp.baseline_mean}
                  </div>
                </div>
              ))}
              {(!selectedAlert.top_explanations || selectedAlert.top_explanations.length === 0) && (
                <p className="text-xs text-cyber-textMuted">No granular attribution available for this flow.</p>
              )}
            </div>
          </div>

          {/* Analyst Status & Notes Section */}
          <div className="p-4 bg-cyber-bg rounded-lg border border-cyber-border space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Analyst Triage & Actions</h4>
            <div>
              <label className="block text-xs text-cyber-textSecondary mb-1 font-semibold">Investigation Notes</label>
              <textarea
                rows={2}
                value={analystNotes}
                onChange={(e) => setAnalystNotes(e.target.value)}
                placeholder="Add evidence notes, root-cause hypotheses, or triage observations..."
                className="w-full p-2.5 bg-cyber-surface border border-cyber-border rounded-lg text-xs text-white placeholder-cyber-textMuted focus:outline-none focus:border-cyber-accent"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-cyber-textSecondary mr-2 font-semibold">Change Status:</span>
              <button
                onClick={() => handleUpdateStatus('INVESTIGATING')}
                disabled={updating}
                className="px-3 py-1 bg-purple-950/60 hover:bg-purple-900 border border-purple-700/60 text-purple-200 rounded text-xs transition"
              >
                Mark Investigating
              </button>
              <button
                onClick={() => handleUpdateStatus('RESOLVED')}
                disabled={updating}
                className="px-3 py-1 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-200 rounded text-xs transition"
              >
                Mark Resolved
              </button>
              <button
                onClick={() => handleUpdateStatus('FALSE_POSITIVE')}
                disabled={updating}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 rounded text-xs transition"
              >
                Mark False Positive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
