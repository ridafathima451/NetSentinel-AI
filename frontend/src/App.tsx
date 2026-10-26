import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { OverviewDashboard } from './pages/OverviewDashboard';
import { TrafficAnalysis } from './pages/TrafficAnalysis';
import { ModelTraining } from './pages/ModelTraining';
import { AlertCenter } from './pages/AlertCenter';
import { ExplainableAI } from './pages/ExplainableAI';
import { IncidentInvestigation } from './pages/IncidentInvestigation';
import { NetworkTopology } from './pages/NetworkTopology';
import { AIAssistant } from './pages/AIAssistant';
import { ReportsAndExports } from './pages/ReportsAndExports';
import { SettingsAndStatus } from './pages/SettingsAndStatus';
import { api } from './services/api';
import { Alert } from './types';
import { ShieldAlert, Bell, Activity } from 'lucide-react';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [systemConnected, setSystemConnected] = useState<boolean>(false);
  const [investigatingAlert, setInvestigatingAlert] = useState<Alert | null>(null);

  const checkHealth = async () => {
    try {
      const res = await api.getHealth();
      setSystemConnected(res.database_connected && res.status === 'online');
    } catch {
      setSystemConnected(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleInvestigateAlert = (alert: Alert) => {
    setInvestigatingAlert(alert);
    setCurrentTab('assistant');
  };

  const renderActivePage = () => {
    switch (currentTab) {
      case 'overview':
        return <OverviewDashboard onNavigate={setCurrentTab} />;
      case 'traffic':
        return <TrafficAnalysis />;
      case 'models':
        return <ModelTraining />;
      case 'alerts':
        return <AlertCenter onInvestigateAlert={handleInvestigateAlert} />;
      case 'explainability':
        return <ExplainableAI />;
      case 'investigations':
        return <IncidentInvestigation />;
      case 'topology':
        return <NetworkTopology />;
      case 'assistant':
        return <AIAssistant initialAlert={investigatingAlert} />;
      case 'reports':
        return <ReportsAndExports />;
      case 'settings':
        return <SettingsAndStatus />;
      default:
        return <OverviewDashboard onNavigate={setCurrentTab} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-cyber-bg text-cyber-textPrimary">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        systemConnected={systemConnected}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-cyber-border bg-cyber-surface/70 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-cyber-textMuted uppercase tracking-wider font-semibold">NetSentinel AI</span>
            <span className="text-cyber-border">/</span>
            <span className="text-white font-medium capitalize">{currentTab.replace('-', ' ')}</span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-cyber-card border border-cyber-border text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  systemConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'
                }`}
              />
              <span className="text-cyber-textSecondary text-[11px] font-mono">
                {systemConnected ? 'Backend Connected' : 'Connecting to API...'}
              </span>
            </div>
          </div>
        </header>

        {/* Page Container */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
};

export default App;
