import React, { useState, useEffect } from 'react';
import {
  Settings,
  Database,
  Radio,
  Sparkles,
  Key,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  FileCode,
  BookOpen,
} from 'lucide-react';
import { api } from '../services/api';
import { SystemStatus } from '../types';

export const SettingsAndStatus: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const data = await api.getSystemStatus();
      setStatus(data);
    } catch (err: any) {
      console.error('Failed to load system status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Settings & System Health</h2>
          <p className="text-xs text-cyber-textSecondary mt-0.5">
            Diagnostic verification, database telemetry, optional Gemini API integration, and monitoring adapter configuration.
          </p>
        </div>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-cyber-card border border-cyber-border rounded-lg text-xs text-cyber-textSecondary hover:text-white"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Diagnostics</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core Subsystem Status Card */}
        <div className="cyber-card p-5 space-y-4">
          <div className="pb-3 border-b border-cyber-border flex items-center space-x-2">
            <Database className="w-4 h-4 text-cyber-accentBlue" />
            <h3 className="text-sm font-bold text-white">Subsystem Diagnostics</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center p-3 bg-cyber-surface rounded-lg border border-cyber-border">
              <span className="text-cyber-textSecondary">FastAPI Backend Engine:</span>
              <span className="font-mono text-emerald-400 font-bold flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>ONLINE (v{status?.version || '1.0.0'})</span>
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-cyber-surface rounded-lg border border-cyber-border">
              <span className="text-cyber-textSecondary">Relational Database:</span>
              <span className="font-mono text-emerald-400 font-bold">
                {status?.database.type} (Connected)
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-cyber-surface rounded-lg border border-cyber-border">
              <span className="text-cyber-textSecondary">Stored Datasets:</span>
              <span className="font-mono text-white font-bold">
                {status?.inventory.datasets_count ?? 0} active
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-cyber-surface rounded-lg border border-cyber-border">
              <span className="text-cyber-textSecondary">Persisted Model Artifacts:</span>
              <span className="font-mono text-cyber-accentBlue font-bold">
                {status?.inventory.trained_models_count ?? 0} models
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-cyber-surface rounded-lg border border-cyber-border">
              <span className="text-cyber-textSecondary">Total Generated Alerts:</span>
              <span className="font-mono text-purple-400 font-bold">
                {status?.inventory.total_alerts ?? 0} events
              </span>
            </div>
          </div>
        </div>

        {/* Real-Time Monitoring Adapter Status */}
        <div className="cyber-card p-5 space-y-4">
          <div className="pb-3 border-b border-cyber-border flex items-center space-x-2">
            <Radio className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Passive Live Monitoring Sensor</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center p-3 bg-cyber-surface rounded-lg border border-cyber-border">
              <span className="text-cyber-textSecondary">Capture Adapter Status:</span>
              <span className="font-mono text-amber-400 font-bold flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>DISCONNECTED (Passive Safe Mode)</span>
              </span>
            </div>

            <div className="p-3 bg-cyber-bg rounded-lg border border-cyber-border space-y-1.5 text-[11px] text-cyber-textSecondary leading-relaxed">
              <strong className="text-white block">Production Safety Protocol:</strong>
              <p>
                NetSentinel AI intentionally disables raw packet capture by default and requires explicit operating-system interface privileges.
                We strictly avoid generating simulated or fake packet traffic.
              </p>
            </div>

            <div className="p-3 bg-cyber-surface rounded-lg border border-cyber-border text-[11px] text-cyber-textMuted space-y-1">
              <span className="text-white font-semibold block">Supported Production Connectors:</span>
              <ul className="list-disc list-inside space-y-0.5 font-mono text-[10px]">
                {status?.monitoring.authorized_sources_supported.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Optional Gemini AI Integration Card */}
        <div className="cyber-card p-5 space-y-4">
          <div className="pb-3 border-b border-cyber-border flex items-center space-x-2">
            <Key className="w-4 h-4 text-cyber-accent" />
            <h3 className="text-sm font-bold text-white">Google Gemini API Configuration</h3>
          </div>

          <div className="space-y-3 text-xs text-cyber-textSecondary">
            <div className="flex justify-between items-center p-3 bg-cyber-surface rounded-lg border border-cyber-border">
              <span>Integration Status:</span>
              <span className={`font-mono font-bold ${status?.integrations.gemini_api_configured ? 'text-emerald-400' : 'text-slate-400'}`}>
                {status?.integrations.gemini_api_configured ? 'ACTIVE (Server Environment)' : 'INACTIVE (Local Engine Fallback)'}
              </span>
            </div>

            <p className="leading-relaxed text-[11px]">
              The AI Copilot does not require an external API key to run. If an API key is not supplied,
              NetSentinel AI automatically utilizes its built-in deterministic evidence synthesis engine.
            </p>

            <div className="p-3 bg-cyber-bg rounded-lg border border-cyber-border space-y-2">
              <strong className="text-white block text-[11px]">How to safely configure Gemini (Optional):</strong>
              <ol className="list-decimal list-inside space-y-1 text-[11px] font-mono text-cyber-textMuted">
                <li>Create a <code>.env</code> file in the project root (copied from <code>.env.example</code>).</li>
                <li>Add your key: <code>GEMINI_API_KEY=your_key_here</code></li>
                <li>Restart the backend server. The key is never exposed to the frontend or browser.</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Academic Research Disclaimer Card */}
        <div className="cyber-card p-5 space-y-4 border-l-4 border-l-indigo-500">
          <div className="pb-3 border-b border-cyber-border flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Research & Demo Scope</h3>
          </div>

          <div className="space-y-2 text-xs text-cyber-textSecondary leading-relaxed">
            <p>
              NetSentinel AI is designed for academic demonstration and research into:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-cyber-textPrimary">
              <li>Comparative analysis between supervised classification and unsupervised isolation.</li>
              <li>Explainable AI techniques for high-dimensional flow features.</li>
              <li>Deterministic correlation rules for automated security triage.</li>
            </ul>
            <p className="text-[11px] text-cyber-textMuted pt-2">
              This system is not certified for production critical-infrastructure perimeter defense.
              All anomaly scores reflect statistical variance and require validation by qualified SecOps analysts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
