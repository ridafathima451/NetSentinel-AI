import React, { useState, useEffect } from 'react';
import {
  Bot,
  Send,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  ListOrdered,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { Alert, AIAssistantResponse } from '../types';

interface AIAssistantProps {
  initialAlert?: Alert | null;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ initialAlert }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlertId, setSelectedAlertId] = useState<string>(initialAlert?.id || '');
  const [userQuery, setUserQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AIAssistantResponse | null>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await api.getAlerts({ page: 1, page_size: 20 });
        setAlerts(res.alerts);
        if (!selectedAlertId && res.alerts.length > 0) {
          setSelectedAlertId(res.alerts[0].id);
        }
      } catch (err: any) {
        console.error('Failed to load alerts for assistant:', err);
      }
    };
    fetchAlerts();
  }, []);

  useEffect(() => {
    if (initialAlert) {
      setSelectedAlertId(initialAlert.id);
    }
  }, [initialAlert]);

  const handleQuery = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      const res = await api.queryAssistant({
        alert_id: selectedAlertId || undefined,
        query: userQuery.trim() || undefined,
      });
      setResponse(res);
    } catch (err: any) {
      alert(`Assistant error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const selectedAlert = alerts.find((a) => a.id === selectedAlertId) || initialAlert;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">AI Incident Response Copilot</h2>
          <p className="text-xs text-cyber-textSecondary mt-0.5">
            Evidence-grounded assistant for alert summarization, model explanation, and investigative triage formulation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Context Configuration */}
        <div className="cyber-card p-5 space-y-4">
          <div className="pb-3 border-b border-cyber-border">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-cyber-accentBlue" />
              <span>Evidence Context Selector</span>
            </h3>
            <p className="text-[11px] text-cyber-textSecondary">Ground the assistant in specific telemetry records</p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-cyber-textSecondary mb-1 font-semibold">Select Target Alert</label>
              <select
                value={selectedAlertId}
                onChange={(e) => setSelectedAlertId(e.target.value)}
                className="w-full p-2 bg-cyber-surface border border-cyber-border rounded-lg text-white font-mono text-[11px]"
              >
                <option value="">System-Wide General Analysis</option>
                {alerts.map((a) => (
                  <option key={a.id} value={a.id}>
                    [{a.risk_level}] {a.id.slice(0, 8)}: {a.predicted_label} ({a.source_ip || 'Flow'})
                  </option>
                ))}
              </select>
            </div>

            {selectedAlert && (
              <div className="p-3 bg-cyber-surface rounded-lg border border-cyber-border space-y-2 text-[11px]">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white">Alert Metadata</span>
                  <span className="text-[10px] text-cyber-accentBlue font-mono">{selectedAlert.id.slice(0, 8)}</span>
                </div>
                <div className="space-y-1 text-cyber-textSecondary font-mono text-[10px]">
                  <div>Endpoints: {selectedAlert.source_ip}:{selectedAlert.source_port} → {selectedAlert.destination_ip}:{selectedAlert.destination_port}</div>
                  <div>Predicted Label: <span className="text-white font-sans font-semibold">{selectedAlert.predicted_label}</span></div>
                  <div>Anomaly Score: {selectedAlert.anomaly_score.toFixed(3)}</div>
                  <div>Risk Priority: <span className="text-red-400 font-bold">{selectedAlert.risk_level}</span></div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-cyber-textSecondary mb-1 font-semibold">Specific Analyst Question (Optional)</label>
              <textarea
                rows={3}
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="e.g., What firewall rules should be reviewed for this host? How does this flow deviate from normal baseline?"
                className="w-full p-2.5 bg-cyber-surface border border-cyber-border rounded-lg text-white placeholder-cyber-textMuted focus:outline-none focus:border-cyber-accent text-xs"
              />
            </div>

            <button
              onClick={() => handleQuery()}
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold transition shadow-glow flex items-center justify-center space-x-2"
            >
              <Sparkles className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Synthesizing Evidence...' : 'Generate Grounded Triage Plan'}</span>
            </button>
          </div>

          <div className="p-3 bg-cyber-bg rounded-lg border border-cyber-border text-[11px] text-cyber-textMuted space-y-1.5">
            <strong className="text-cyber-textSecondary block">Copilot Safety Architecture:</strong>
            <ul className="list-disc list-inside space-y-1 text-[10px] leading-relaxed">
              <li>Distinguishes observed facts from machine learning hypotheses.</li>
              <li>Never auto-executes suggested terminal commands.</li>
              <li>Runs without external API keys via deterministic local synthesis.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Structured Evidence Output */}
        <div className="lg:col-span-2 space-y-6">
          {response ? (
            <div className="space-y-4">
              {/* Provider & Limitation Pill */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 py-2 bg-cyber-card border border-cyber-border rounded-lg text-xs text-cyber-textSecondary gap-2">
                <div className="flex items-center space-x-2">
                  <Bot className="w-4 h-4 text-cyber-accentBlue" />
                  <span>Synthesized via: <strong className="text-white">{response.provider_used}</strong></span>
                </div>
                <span className="text-[10px] text-cyber-textMuted">{response.limitations_notice}</span>
              </div>

              {/* Executive Summary */}
              <div className="cyber-card p-5 space-y-2 border-l-4 border-l-cyber-accentBlue">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Executive Assessment</h3>
                <p className="text-xs text-cyber-textPrimary leading-relaxed">
                  {response.summary}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Verified Facts */}
                <div className="cyber-card p-4 space-y-3 border-emerald-500/30">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>1. Verified Observed Facts</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-cyber-textSecondary">
                    {response.observed_facts.map((fact, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span className="leading-relaxed">{fact}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 2. Model Predictions */}
                <div className="cyber-card p-4 space-y-3 border-blue-500/30">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    <span>2. Model Predictions & Prioritization</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-cyber-textSecondary">
                    {response.model_predictions.map((pred, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-blue-400 font-bold">•</span>
                        <span className="leading-relaxed">{pred}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 3. Hypotheses */}
                <div className="cyber-card p-4 space-y-3 border-amber-500/30">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center space-x-2">
                    <HelpCircle className="w-4 h-4 text-amber-400" />
                    <span>3. Plausible Hypotheses</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-cyber-textSecondary">
                    {response.hypotheses.map((hyp, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-amber-400 font-bold">•</span>
                        <span className="leading-relaxed">{hyp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 4. Actionable Investigation Steps */}
                <div className="cyber-card p-4 space-y-3 border-purple-500/30">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center space-x-2">
                    <ListOrdered className="w-4 h-4 text-purple-400" />
                    <span>4. Recommended Investigation Steps</span>
                  </h4>
                  <ol className="space-y-2 text-xs text-cyber-textSecondary list-decimal list-inside">
                    {response.suggested_steps.map((step, idx) => (
                      <li key={idx} className="leading-relaxed pl-1">
                        <span className="text-white font-medium">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          ) : (
            <div className="cyber-card p-16 text-center text-cyber-textMuted text-xs space-y-3">
              <Bot className="w-10 h-10 mx-auto text-cyber-accentBlue/60" />
              <p className="max-w-md mx-auto leading-relaxed">
                Select an alert context on the left and click "Generate Grounded Triage Plan" to produce a structured, evidence-grounded incident investigation briefing.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
