import React from 'react';
import {
  LayoutDashboard,
  Activity,
  Cpu,
  AlertTriangle,
  HelpCircle,
  FolderGit2,
  Share2,
  Bot,
  FileText,
  Settings,
  ShieldCheck,
} from 'lucide-react';

export type NavTab =
  | 'overview'
  | 'traffic'
  | 'models'
  | 'alerts'
  | 'explainability'
  | 'investigations'
  | 'topology'
  | 'assistant'
  | 'reports'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  systemConnected: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  systemConnected,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'traffic', label: 'Traffic Analysis', icon: Activity },
    { id: 'models', label: 'Anomaly & ML Engine', icon: Cpu },
    { id: 'alerts', label: 'Alert Center', icon: AlertTriangle },
    { id: 'explainability', label: 'Explainable AI (XAI)', icon: HelpCircle },
    { id: 'investigations', label: 'Incident Workspace', icon: FolderGit2 },
    { id: 'topology', label: 'Network Topology', icon: Share2 },
    { id: 'assistant', label: 'AI Investigation Copilot', icon: Bot },
    { id: 'reports', label: 'Reports & Exports', icon: FileText },
    { id: 'settings', label: 'Settings & Status', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-cyber-surface border-r border-cyber-border flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-cyber-border flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-cyber-accent/15 border border-cyber-accent/40 text-cyber-accent">
            <ShieldCheck className="w-6 h-6 text-cyber-accentBlue" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              NetSentinel AI
            </h1>
            <p className="text-[10px] text-cyber-textMuted uppercase tracking-wider font-semibold">
              Cybersecurity Platform
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-cyber-accent/20 text-cyber-accentBlue border border-cyber-accent/40 shadow-glow'
                    : 'text-cyber-textSecondary hover:bg-cyber-card/60 hover:text-cyber-textPrimary'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyber-accentBlue' : 'text-cyber-textMuted'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Backend Status Footer */}
      <div className="p-4 border-t border-cyber-border bg-cyber-bg/50">
        <div className="flex items-center justify-between text-xs">
          <span className="text-cyber-textMuted">Engine Status:</span>
          <span className="flex items-center space-x-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                systemConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span className={systemConnected ? 'text-emerald-400 font-mono text-[11px]' : 'text-red-400 font-mono text-[11px]'}>
              {systemConnected ? 'ONLINE' : 'OFFLINE'}
            </span>
          </span>
        </div>
        <p className="text-[10px] text-cyber-textMuted mt-2 text-center">
          Academic Research Edition v1.0
        </p>
      </div>
    </aside>
  );
};
