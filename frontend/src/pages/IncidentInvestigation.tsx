import React, { useState, useEffect } from 'react';
import {
  FolderGit2,
  GitCommit,
  Plus,
  Send,
  MessageSquare,
  Sparkles,
  Shield,
  Clock,
  Layers,
} from 'lucide-react';
import { api } from '../services/api';
import { Investigation, InvestigationNote, Alert } from '../types';
import { Badge } from '../components/Badge';

export const IncidentInvestigation: React.FC = () => {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [selectedInv, setSelectedInv] = useState<Investigation | null>(null);
  const [loading, setLoading] = useState(true);
  const [correlating, setCorrelating] = useState(false);

  // New Note state
  const [noteContent, setNoteContent] = useState('');
  const [authorName, setAuthorName] = useState('Security Analyst');
  const [submittingNote, setSubmittingNote] = useState(false);

  const fetchInvestigations = async () => {
    try {
      setLoading(true);
      const data = await api.getInvestigations();
      setInvestigations(data);
      if (data.length > 0 && !selectedInv) {
        setSelectedInv(data[0]);
      } else if (selectedInv) {
        const updated = data.find((i) => i.id === selectedInv.id);
        if (updated) setSelectedInv(updated);
      }
    } catch (err: any) {
      console.error('Failed to fetch investigations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestigations();
  }, []);

  const handleRunAutoCorrelate = async () => {
    try {
      setCorrelating(true);
      const res = await api.autoCorrelateAlerts();
      alert(res.message);
      await fetchInvestigations();
    } catch (err: any) {
      alert(`Correlation error: ${err.message}`);
    } finally {
      setCorrelating(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInv || !noteContent.trim()) return;

    try {
      setSubmittingNote(true);
      const note = await api.addInvestigationNote(selectedInv.id, {
        content: noteContent,
        author: authorName,
      });
      setSelectedInv({
        ...selectedInv,
        notes: [note, ...selectedInv.notes],
      });
      setNoteContent('');
      await fetchInvestigations();
    } catch (err: any) {
      alert(`Failed to add note: ${err.message}`);
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedInv) return;
    try {
      const updated = await api.updateInvestigation(selectedInv.id, {
        status: newStatus,
      });
      setSelectedInv(updated);
      setInvestigations((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Incident Investigation Workspace</h2>
          <p className="text-xs text-cyber-textSecondary mt-0.5">
            Correlate related security alerts into cohesive incidents using transparent evidence-linking rules.
          </p>
        </div>
        <button
          onClick={handleRunAutoCorrelate}
          disabled={correlating}
          className="flex items-center space-x-2 px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-glow transition"
        >
          <Sparkles className={`w-3.5 h-3.5 ${correlating ? 'animate-spin' : ''}`} />
          <span>{correlating ? 'Clustering Alerts...' : 'Run Auto-Correlation Engine'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incidents List */}
        <div className="cyber-card p-4 space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-cyber-border">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyber-textSecondary">
              Active Incidents ({investigations.length})
            </h3>
          </div>

          <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
            {investigations.map((inv) => {
              const isSelected = selectedInv?.id === inv.id;
              return (
                <div
                  key={inv.id}
                  onClick={() => setSelectedInv(inv)}
                  className={`p-3.5 rounded-lg border text-xs cursor-pointer transition space-y-2 ${
                    isSelected
                      ? 'bg-cyber-accent/20 border-cyber-accent text-white shadow-glow'
                      : 'bg-cyber-surface border-cyber-border hover:border-cyber-borderGlow text-cyber-textSecondary'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white text-xs">{inv.title}</span>
                    <Badge label={inv.priority} variant="risk" />
                  </div>
                  <p className="text-[11px] text-cyber-textSecondary line-clamp-2 leading-relaxed">
                    {inv.summary || 'Correlated network activity cluster.'}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-cyber-textMuted pt-1 border-t border-cyber-border/40">
                    <span>{inv.alert_count} linked events</span>
                    <Badge label={inv.status} variant="status" />
                  </div>
                </div>
              );
            })}
            {investigations.length === 0 && !loading && (
              <p className="text-xs text-cyber-textMuted py-8 text-center">
                No active incidents yet. Click "Run Auto-Correlation Engine" to cluster current alerts.
              </p>
            )}
          </div>
        </div>

        {/* Selected Incident Detail & Evidence Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {selectedInv ? (
            <>
              {/* Incident Header Card */}
              <div className="cyber-card p-5 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-cyber-border gap-3">
                  <div>
                    <div className="flex items-center space-x-3">
                      <h3 className="text-base font-bold text-white">{selectedInv.title}</h3>
                      <Badge label={selectedInv.priority} variant="risk" />
                      <Badge label={selectedInv.status} variant="status" />
                    </div>
                    <p className="text-xs text-cyber-textSecondary mt-1">
                      Target Entity: <strong className="text-white font-mono">{selectedInv.target_entity || 'Distributed'}</strong> • Opened: {new Date(selectedInv.created_at).toLocaleString()}
                    </p>
                  </div>

                  {/* Status Updater */}
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-cyber-textMuted">Status:</span>
                    <select
                      value={selectedInv.status}
                      onChange={(e) => handleUpdateStatus(e.target.value)}
                      className="p-1.5 bg-cyber-surface border border-cyber-border rounded text-xs text-white"
                    >
                      <option value="OPEN">Open</option>
                      <option value="INVESTIGATING">Investigating</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="FALSE_POSITIVE">False Positive</option>
                    </select>
                  </div>
                </div>

                {/* Correlation Rationale (Transparent rule statement) */}
                <div className="p-3 bg-cyber-surface rounded-lg border border-cyber-border text-xs">
                  <span className="text-[10px] uppercase font-bold text-cyber-accentBlue block mb-0.5">
                    Deterministic Correlation Rule Rationale:
                  </span>
                  <p className="text-cyber-textPrimary font-mono text-[11px]">
                    {selectedInv.correlation_reason || 'Correlated via shared network identifiers or temporal proximity.'}
                  </p>
                </div>

                {/* Evidence Timeline of Alerts */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-cyber-textSecondary mb-2 flex items-center space-x-2">
                    <Layers className="w-3.5 h-3.5 text-cyber-accentBlue" />
                    <span>Correlated Alert Evidence ({selectedInv.alerts.length} events)</span>
                  </h4>
                  <div className="overflow-x-auto border border-cyber-border rounded-lg max-h-48">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-cyber-surface text-[10px] text-cyber-textMuted uppercase sticky top-0">
                        <tr>
                          <th className="py-2 px-3">Event ID</th>
                          <th className="py-2 px-3">Timestamp</th>
                          <th className="py-2 px-3">Endpoints</th>
                          <th className="py-2 px-3">Predicted Class</th>
                          <th className="py-2 px-3">Score</th>
                          <th className="py-2 px-3">Risk</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cyber-border/40 text-[11px]">
                        {selectedInv.alerts.map((a) => (
                          <tr key={a.id} className="hover:bg-cyber-surface/40">
                            <td className="py-1.5 px-3 text-cyber-accentBlue font-bold">{a.id.slice(0, 8)}</td>
                            <td className="py-1.5 px-3 text-cyber-textSecondary font-sans">{a.timestamp_str || 'N/A'}</td>
                            <td className="py-1.5 px-3 text-white">
                              {a.source_ip ? `${a.source_ip} → ${a.destination_ip}` : 'Flow'}
                            </td>
                            <td className="py-1.5 px-3 font-sans text-white">{a.predicted_label}</td>
                            <td className="py-1.5 px-3">{a.anomaly_score.toFixed(3)}</td>
                            <td className="py-1.5 px-3 font-sans">
                              <Badge label={a.risk_level} variant="risk" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Analyst Timeline & Notes */}
              <div className="cyber-card p-5 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center space-x-2">
                  <MessageSquare className="w-3.5 h-3.5 text-cyber-accentBlue" />
                  <span>Investigation Notes & Activity Log</span>
                </h4>

                {/* Add Note Form */}
                <form onSubmit={handleAddNote} className="space-y-3">
                  <textarea
                    rows={2}
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Document analyst hypothesis, verified IOCs, or response actions..."
                    className="w-full p-2.5 bg-cyber-surface border border-cyber-border rounded-lg text-xs text-white placeholder-cyber-textMuted focus:outline-none focus:border-cyber-accent"
                  />
                  <div className="flex justify-between items-center">
                    <input
                      type="text"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="Analyst Name / Role"
                      className="p-1.5 bg-cyber-surface border border-cyber-border rounded text-xs text-cyber-textSecondary w-48"
                    />
                    <button
                      type="submit"
                      disabled={submittingNote || !noteContent.trim()}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-cyber-accent hover:bg-cyber-accent/80 text-white rounded text-xs font-semibold transition disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{submittingNote ? 'Saving...' : 'Post Note'}</span>
                    </button>
                  </div>
                </form>

                {/* Chronological Notes Timeline */}
                <div className="space-y-3 pt-2">
                  {selectedInv.notes?.map((n) => (
                    <div key={n.id} className="p-3 bg-cyber-surface rounded-lg border border-cyber-border space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-cyber-accentBlue">{n.author}</span>
                        <span className="text-cyber-textMuted">{new Date(n.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-cyber-textPrimary leading-relaxed">{n.content}</p>
                    </div>
                  ))}
                  {(!selectedInv.notes || selectedInv.notes.length === 0) && (
                    <p className="text-xs text-cyber-textMuted text-center py-4">No notes logged yet.</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="cyber-card p-12 text-center text-cyber-textMuted text-xs">
              Select an incident from the left to view evidence correlation and log analyst notes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
