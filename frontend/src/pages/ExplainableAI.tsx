import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  BarChart3,
  ShieldCheck,
  Search,
  Sparkles,
  Info,
  Activity,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { api } from '../services/api';
import { TrainedModel, Alert } from '../types';

export const ExplainableAI: React.FC = () => {
  const [models, setModels] = useState<TrainedModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<TrainedModel | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const modelList = await api.getModels();
        setModels(modelList);
        if (modelList.length > 0) setSelectedModel(modelList[0]);

        const alertsRes = await api.getAlerts({ page: 1, page_size: 15 });
        setAlerts(alertsRes.alerts);
        if (alertsRes.alerts.length > 0) setSelectedAlert(alertsRes.alerts[0]);
      } catch (err: any) {
        console.error('Failed to load XAI data:', err);
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
          <h2 className="text-xl font-bold text-white tracking-tight">Explainable AI (XAI) Suite</h2>
          <p className="text-xs text-cyber-textSecondary mt-0.5">
            Transparent model attribution, mathematical feature deviations, and cybersecurity domain reasoning.
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-cyber-card border border-cyber-border px-3 py-1.5 rounded-lg text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-cyber-textSecondary">Methodology:</span>
          <span className="font-semibold text-white">Statistical Z-Score & Tree Attribution</span>
        </div>
      </div>

      {/* Global Feature Importance Section */}
      <div className="cyber-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-cyber-border gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-cyber-accentBlue" />
              <span>Global Feature Importance Ranking</span>
            </h3>
            <p className="text-[11px] text-cyber-textSecondary">
              Aggregated Gini impurity reduction across all decision splits in the ensemble
            </p>
          </div>
          {models.length > 1 && (
            <select
              value={selectedModel?.id || ''}
              onChange={(e) => {
                const m = models.find((mod) => mod.id === e.target.value);
                if (m) setSelectedModel(m);
              }}
              className="p-1.5 bg-cyber-surface border border-cyber-border rounded text-xs text-white"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedModel?.feature_importances && selectedModel.feature_importances.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={selectedModel.feature_importances.slice(0, 10)} layout="vertical">
                <XAxis type="number" stroke="#64748b" fontSize={10} />
                <YAxis dataKey="feature" type="category" stroke="#64748b" fontSize={10} width={150} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                <Bar dataKey="importance" fill="#38bdf8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-xs text-cyber-textMuted py-8 text-center">
            No trained supervised models available. Train a classifier in "Anomaly & ML Engine" to inspect feature weights.
          </p>
        )}
      </div>

      {/* Per-Event Local Explanation Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Picker */}
        <div className="cyber-card p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyber-textSecondary">
            Select Event for Local Explanation
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {alerts.map((a) => {
              const isSelected = selectedAlert?.id === a.id;
              return (
                <div
                  key={a.id}
                  onClick={() => setSelectedAlert(a)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition ${
                    isSelected
                      ? 'bg-cyber-accent/20 border-cyber-accent text-white'
                      : 'bg-cyber-surface border-cyber-border hover:border-cyber-borderGlow text-cyber-textSecondary'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-cyber-accentBlue">{a.id.slice(0, 8)}</span>
                    <span className="text-[10px] text-cyber-textMuted">{a.timestamp_str || 'N/A'}</span>
                  </div>
                  <p className="font-semibold text-white mt-1">{a.predicted_label}</p>
                  <p className="text-[10px] text-cyber-textMuted mt-0.5">
                    Score: <strong>{a.anomaly_score.toFixed(3)}</strong> • Risk: <strong>{a.risk_level}</strong>
                  </p>
                </div>
              );
            })}
            {alerts.length === 0 && !loading && (
              <p className="text-xs text-cyber-textMuted text-center py-6">No alerts available to explain.</p>
            )}
          </div>
        </div>

        {/* Local Factor Details */}
        <div className="lg:col-span-2 cyber-card p-5 space-y-4">
          {selectedAlert ? (
            <>
              <div className="pb-3 border-b border-cyber-border">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-cyber-accentBlue" />
                  <span>Local Feature Attribution — Alert {selectedAlert.id.slice(0, 8)}</span>
                </h3>
                <p className="text-xs text-cyber-textSecondary mt-0.5">
                  Flow: {selectedAlert.source_ip || 'Source'} → {selectedAlert.destination_ip || 'Destination'} (Proto: {selectedAlert.protocol || 'IP'})
                </p>
              </div>

              {/* Explanations List */}
              <div className="space-y-3">
                {selectedAlert.top_explanations?.map((exp, idx) => (
                  <div key={idx} className="p-4 bg-cyber-surface rounded-lg border border-cyber-border space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-white text-sm">{exp.feature}</span>
                      <span className="font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 text-xs">
                        {exp.z_score}σ Outlier
                      </span>
                    </div>

                    <p className="text-xs text-cyber-textSecondary leading-relaxed">
                      {exp.rationale}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-1 border-t border-cyber-border/40 font-mono text-cyber-textMuted">
                      <div>Observed: <strong className="text-white">{exp.value}</strong></div>
                      <div>Baseline Mean: <strong className="text-white">{exp.baseline_mean}</strong></div>
                      <div>Attribution Weight: <strong className="text-cyber-accentBlue">{exp.contribution_score}</strong></div>
                    </div>
                  </div>
                ))}
                {(!selectedAlert.top_explanations || selectedAlert.top_explanations.length === 0) && (
                  <p className="text-xs text-cyber-textMuted text-center py-8">
                    No granular statistical deviations computed for this flow.
                  </p>
                )}
              </div>

              {/* Domain Interpretation Guide */}
              <div className="p-4 rounded-lg bg-cyber-bg border border-cyber-border text-xs text-cyber-textSecondary space-y-2">
                <h4 className="font-bold text-white flex items-center space-x-2">
                  <Info className="w-3.5 h-3.5 text-cyber-accentBlue" />
                  <span>How to Interpret Z-Score Deviations:</span>
                </h4>
                <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed">
                  <li><strong>&gt; 3.0σ Deviation:</strong> Statistically rare in normal network baselines; characteristic of automated attacks, port scans, or heavy data dumps.</li>
                  <li><strong>1.5σ - 3.0σ Deviation:</strong> Moderate variance; may indicate user activity bursts, large downloads, or intermittent probes.</li>
                  <li><strong>&lt; 1.5σ:</strong> Typical baseline variance consistent with benign background traffic.</li>
                </ul>
              </div>
            </>
          ) : (
            <p className="text-xs text-cyber-textMuted py-16 text-center">
              Select an alert from the left panel to inspect its local feature attribution breakdown.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
