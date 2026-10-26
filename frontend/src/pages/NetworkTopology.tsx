import React, { useState, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Share2,
  ShieldAlert,
  AlertTriangle,
  Info,
  Server,
  Filter,
} from 'lucide-react';
import { api } from '../services/api';
import { Dataset, TopologyData } from '../types';

export const NetworkTopology: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [topologyData, setTopologyData] = useState<TopologyData | null>(null);
  const [loading, setLoading] = useState(true);

  // Selected node inspection drawer
  const [selectedNodeData, setSelectedNodeData] = useState<any | null>(null);
  const [filterSuspiciousOnly, setFilterSuspiciousOnly] = useState(false);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        setLoading(true);
        const list = await api.getDatasets();
        setDatasets(list);
        if (list.length > 0) {
          // Prefer dataset with IPs
          const ipDs = list.find((d) => d.has_ips) || list[0];
          setSelectedDatasetId(ipDs.id);
          loadTopology(ipDs.id);
        }
      } catch (err: any) {
        console.error('Failed to load datasets for topology:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDatasets();
  }, []);

  const loadTopology = async (datasetId: string) => {
    try {
      setLoading(true);
      const data = await api.getTopology(datasetId);
      setTopologyData(data);

      if (data.available && data.nodes && data.edges) {
        // Transform nodes into React Flow format with cyber styling
        const styledNodes: Node[] = data.nodes.map((n: any) => ({
          id: n.id,
          position: n.position,
          data: n.data,
          style: {
            background: n.data.is_risk ? '#450a0a' : '#0f172a',
            color: n.data.is_risk ? '#fca5a5' : '#e2e8f0',
            border: n.data.is_risk ? '2px solid #ef4444' : '1px solid #3b82f6',
            borderRadius: '10px',
            padding: '10px 14px',
            fontSize: '11px',
            fontFamily: 'monospace',
            boxShadow: n.data.is_risk ? '0 0 15px rgba(239, 68, 68, 0.4)' : 'none',
          },
        }));

        setNodes(styledNodes);
        setEdges(data.edges);
      } else {
        setNodes([]);
        setEdges([]);
      }
    } catch (err: any) {
      console.error('Topology loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNodeData(node.data);
  };

  // Filter edges and nodes if filterSuspiciousOnly is toggled
  useEffect(() => {
    if (!topologyData || !topologyData.available) return;

    if (filterSuspiciousOnly) {
      const suspiciousEdges = topologyData.edges.filter((e) => e.animated);
      const activeNodeIds = new Set<string>();
      suspiciousEdges.forEach((e) => {
        activeNodeIds.add(e.source);
        activeNodeIds.add(e.target);
      });

      const filteredNodes = topologyData.nodes
        .filter((n: any) => activeNodeIds.has(n.id) || n.data.is_risk)
        .map((n: any) => ({
          id: n.id,
          position: n.position,
          data: n.data,
          style: {
            background: n.data.is_risk ? '#450a0a' : '#0f172a',
            color: n.data.is_risk ? '#fca5a5' : '#e2e8f0',
            border: n.data.is_risk ? '2px solid #ef4444' : '1px solid #3b82f6',
            borderRadius: '10px',
            padding: '10px 14px',
            fontSize: '11px',
            fontFamily: 'monospace',
            boxShadow: n.data.is_risk ? '0 0 15px rgba(239, 68, 68, 0.4)' : 'none',
          },
        }));

      setNodes(filteredNodes);
      setEdges(suspiciousEdges);
    } else {
      loadTopology(selectedDatasetId);
    }
  }, [filterSuspiciousOnly]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Interactive Network Topology</h2>
          <p className="text-xs text-cyber-textSecondary mt-0.5">
            Graph visualization of observed host endpoints and communication edges mapped from traffic records.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          {datasets.length > 0 && (
            <select
              value={selectedDatasetId}
              onChange={(e) => {
                setSelectedDatasetId(e.target.value);
                loadTopology(e.target.value);
              }}
              className="p-2 bg-cyber-surface border border-cyber-border rounded-lg text-white"
            >
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.original_filename} {d.has_ips ? '(IPs Mapped)' : '(No IPs)'}
                </option>
              ))}
            </select>
          )}

          <label className="flex items-center space-x-2 px-3 py-2 bg-cyber-card border border-cyber-border rounded-lg cursor-pointer text-cyber-textSecondary hover:text-white">
            <Filter className="w-3.5 h-3.5" />
            <span>High-Risk Connections Only</span>
            <input
              type="checkbox"
              checked={filterSuspiciousOnly}
              onChange={(e) => setFilterSuspiciousOnly(e.target.checked)}
              className="rounded accent-red-500"
            />
          </label>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 cyber-card h-[600px] relative overflow-hidden bg-cyber-bg border-cyber-border">
          {topologyData?.available ? (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={handleNodeClick}
              fitView
            >
              <Background color="#1e293b" gap={16} />
              <Controls className="bg-cyber-surface border-cyber-border text-white fill-white" />
              <MiniMap
                nodeColor={(n: any) => (n.data?.is_risk ? '#ef4444' : '#38bdf8')}
                className="bg-cyber-surface border border-cyber-border rounded-lg"
              />
            </ReactFlow>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-amber-950/40 border border-amber-600/40 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div className="max-w-md">
                <h3 className="text-base font-bold text-white">Topology Unavailable for this Dataset</h3>
                <p className="text-xs text-cyber-textSecondary mt-2 leading-relaxed">
                  {topologyData?.reason ||
                    'The currently selected dataset does not include recognizable Source and Destination IP address columns. NetSentinel AI does not fabricate network nodes when telemetry is absent.'}
                </p>
                <div className="mt-4 p-3 bg-cyber-surface rounded-lg border border-cyber-border text-[11px] text-cyber-textMuted text-left">
                  <strong className="text-cyber-accentBlue block mb-1">To enable the Topology view:</strong>
                  Upload a dataset containing valid endpoint columns (e.g. <code>Source IP</code>, <code>Destination IP</code>, or generate the pre-configured research sample).
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Selected Node Details Drawer */}
        <div className="cyber-card p-5 space-y-4">
          <div className="pb-3 border-b border-cyber-border">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Server className="w-4 h-4 text-cyber-accentBlue" />
              <span>Node Telemetry Inspector</span>
            </h3>
            <p className="text-[11px] text-cyber-textSecondary">Click any node on the graph to inspect flow attributes</p>
          </div>

          {selectedNodeData ? (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-cyber-surface rounded-lg border border-cyber-border space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-cyber-textMuted text-[10px] uppercase font-semibold">IP Address</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedNodeData.is_risk ? 'bg-red-950 text-red-300 border border-red-700' : 'bg-blue-950 text-blue-300 border border-blue-700'
                  }`}>
                    {selectedNodeData.threat_level}
                  </span>
                </div>
                <p className="font-mono text-base font-bold text-white">{selectedNodeData.ip}</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between p-2.5 bg-cyber-bg rounded border border-cyber-border font-mono">
                  <span className="text-cyber-textSecondary font-sans">Observed Flows:</span>
                  <span className="text-white font-bold">{selectedNodeData.flow_count}</span>
                </div>
                <div className="flex justify-between p-2.5 bg-cyber-bg rounded border border-cyber-border">
                  <span className="text-cyber-textSecondary">Risk Classification:</span>
                  <span className={selectedNodeData.is_risk ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {selectedNodeData.is_risk ? 'ANOMALOUS (High Priority)' : 'BENIGN BASELINE'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-cyber-surface border border-cyber-border text-[11px] text-cyber-textSecondary">
                <p className="leading-relaxed">
                  {selectedNodeData.is_risk
                    ? 'This host endpoint was flagged by the Anomaly Detection Engine as either a source of suspicious probes or target of asymmetric traffic bursts.'
                    : 'This endpoint displays regular bidirectional communication within normal statistical parameters.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-cyber-textMuted text-xs">
              Select any host node on the canvas to inspect its connection properties.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
