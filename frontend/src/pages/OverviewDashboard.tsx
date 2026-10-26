import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertOctagon,
  ShieldAlert,
  Cpu,
  Layers,
  ArrowRight,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
} from 'recharts';
import { api } from '../services/api';
import { DashboardStats, Alert } from '../types';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';

interface OverviewDashboardProps {
  onNavigate: (tab: any) => void;
}

const PIE_COLORS = ['#38bdf8', '#818cf8', '#f87171', '#fbbf24', '#34d399', '#c084fc'];
const RISK_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#10b981',
};

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardStats();
      setStats(data);
      const alertsRes = await api.getAlerts({ page: 1, page_size: 6 });
      setRecentAlerts(alertsRes.alerts);
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleQuickstartSample = async () => {
    try {
      setGenerating(true);
      const sample = await api.generateSampleDataset();
      await api.runAnalysis({
        dataset_id: sample.id,
        mode: 'auto',
        contamination: 0.08,
      });
      await fetchDashboardData();
    } catch (err: any) {
      alert(`Quickstart error: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const hasData = stats && stats.total_records_analyzed > 0;

  return (
    <div className="space-y-6">
      {/* Page Title & Refresh */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Overview Dashboard</h2>
          <p className="text-xs text-cyber-textSecondary mt-0.5">
            Real-time analytics aggregated strictly from verified network traffic evaluations.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-cyber-border bg-cyber-card text-xs text-cyber-textSecondary hover:text-white hover:border-cyber-borderGlow transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Onboarding State if no dataset has been analyzed */}
      {!hasData && !loading && (
        <div className="cyber-card p-8 border-dashed border-cyber-accent/40 bg-cyber-surface/50 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-cyber-accent/20 flex items-center justify-center text-cyber-accentBlue">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-white">No Traffic Data Evaluated Yet</h3>
            <p className="text-xs text-cyber-textSecondary mt-1 leading-relaxed">
              NetSentinel AI presents strictly genuine model findings and does not invent fake traffic.
              To get started, either upload a network capture CSV (like CIC-IDS2017) or generate a pre-configured research sample.
            </p>
          </div>
          <div className="flex items-center justify-center space-x-3 pt-2">
            <button
              onClick={handleQuickstartSample}
              disabled={generating}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-xs font-semibold hover:from-blue-500 hover:to-indigo-500 transition shadow-glow"
            >
              <Sparkles className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
              <span>{generating ? 'Processing Pipeline...' : 'Generate Research Sample & Run ML'}</span>
            </button>
            <button
              onClick={() => onNavigate('traffic')}
              className="px-4 py-2 bg-cyber-card border border-cyber-border text-cyber-textPrimary rounded-lg text-xs font-semibold hover:border-cyber-borderGlow transition"
            >
              Upload Custom CSV
            </button>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Analyzed Records"
          value={stats?.total_records_analyzed ?? 0}
          subtitle="Processed packet flows"
          icon={Activity}
          variant="blue"
          tooltip="Total distinct network flow records evaluated across all datasets"
        />
        <StatCard
          title="Flagged Anomalies"
          value={stats?.total_anomalies_detected ?? 0}
          subtitle="Unsupervised outlier detections"
          icon={AlertOctagon}
          variant="purple"
          tooltip="Identified by Isolation Forest as statistically abnormal from baseline"
        />
        <StatCard
          title="High-Risk Alerts"
          value={stats?.high_risk_alerts ?? 0}
          subtitle="Critical or High severity"
          icon={ShieldAlert}
          variant="red"
          tooltip="Alerts prioritized based on normalized anomaly score exceeding 0.70"
        />
        <StatCard
          title="Trained Models"
          value={stats?.active_models_count ?? 0}
          subtitle="Active scikit-learn artifacts"
          icon={Cpu}
          variant="green"
          tooltip="Supervised Random Forest models saved with cross-evaluation metrics"
        />
        <StatCard
          title="Uploaded Datasets"
          value={stats?.datasets_count ?? 0}
          subtitle="Traffic repositories stored"
          icon={Layers}
          variant="amber"
          tooltip="Verified CSV datasets cataloged in NetSentinel storage"
        />
      </div>

      {/* Charts Section */}
      {hasData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Traffic Class Distribution */}
          <div className="cyber-card p-5 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white">Predicted Traffic Classes</h3>
                <p className="text-[11px] text-cyber-textSecondary">Distribution of categorized network behaviors</p>
              </div>
            </div>
            <div className="h-56">
              {stats?.traffic_class_distribution && stats.traffic_class_distribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.traffic_class_distribution}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      innerRadius={45}
                      paddingAngle={4}
                      label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                    >
                      {stats.traffic_class_distribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-cyber-textMuted">
                  No classified traffic classes to display
                </div>
              )}
            </div>
          </div>

          {/* Anomaly Score Distribution Histogram */}
          <div className="cyber-card p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">Anomaly Score Distribution</h3>
              <p className="text-[11px] text-cyber-textSecondary">Normalized anomaly scores [0.0 - 1.0] (1.0 = High Outlier)</p>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.anomaly_score_bins || []}>
                  <XAxis dataKey="bin" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Risk Level Breakdown */}
          <div className="cyber-card p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">Alert Prioritization Breakdown</h3>
              <p className="text-[11px] text-cyber-textSecondary">Event severity assigned by statistical threshold rules</p>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.risk_level_distribution || []} layout="vertical">
                  <XAxis type="number" stroke="#64748b" fontSize={10} />
                  <YAxis dataKey="level" type="category" stroke="#64748b" fontSize={10} width={70} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {(stats?.risk_level_distribution || []).map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={RISK_COLORS[entry.level] || '#38bdf8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Analysis Timeline */}
          <div className="cyber-card p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">Recent Analysis Execution Trend</h3>
              <p className="text-[11px] text-cyber-textSecondary">Processed record batches vs anomalies flagged</p>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.timeline_trend || []}>
                  <XAxis dataKey="timestamp" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="total_records" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.1} />
                  <Area type="monotone" dataKey="anomalies" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Recent Alerts Table */}
      {hasData && (
        <div className="cyber-card p-5 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-white">Recent Security Alerts</h3>
              <p className="text-[11px] text-cyber-textSecondary">Highest priority detected anomalous flows</p>
            </div>
            <button
              onClick={() => onNavigate('alerts')}
              className="text-xs text-cyber-accentBlue hover:text-white flex items-center space-x-1 transition font-medium"
            >
              <span>View All Alerts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-cyber-border text-cyber-textMuted uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-2.5 px-3">Event ID</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Endpoints</th>
                  <th className="py-2.5 px-3">Predicted Class</th>
                  <th className="py-2.5 px-3">Anomaly Score</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-border/40">
                {recentAlerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-cyber-surface/60 transition">
                    <td className="py-2.5 px-3 font-mono text-cyber-accentBlue font-medium">
                      {alert.id.slice(0, 8)}
                    </td>
                    <td className="py-2.5 px-3 text-cyber-textSecondary">
                      {alert.timestamp_str || 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px]">
                      {alert.source_ip ? `${alert.source_ip} → ${alert.destination_ip}` : 'Network Flow'}
                    </td>
                    <td className="py-2.5 px-3 text-white font-medium">
                      {alert.predicted_label}
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 h-1.5 bg-cyber-bg rounded-full overflow-hidden">
                          <div
                            className={`h-full ${alert.anomaly_score > 0.7 ? 'bg-red-500' : 'bg-blue-400'}`}
                            style={{ width: `${Math.round(alert.anomaly_score * 100)}%` }}
                          />
                        </div>
                        <span className="text-[11px]">{alert.anomaly_score.toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge label={alert.risk_level} variant="risk" />
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge label={alert.status} variant="status" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
