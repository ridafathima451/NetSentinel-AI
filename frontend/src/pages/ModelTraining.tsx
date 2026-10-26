import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Play,
  CheckCircle2,
  Trash2,
  BarChart2,
  AlertTriangle,
  Info,
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
import { Dataset, TrainedModel } from '../types';

export const ModelTraining: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [models, setModels] = useState<TrainedModel[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<TrainedModel | null>(null);

  // Hyperparameters
  const [algorithm] = useState<string>('random_forest');
  const [testSize, setTestSize] = useState<number>(0.25);
  const [nEstimators, setNEstimators] = useState<number>(100);
  const [maxDepth, setMaxDepth] = useState<number>(15);
  const [targetColumn, setTargetColumn] = useState<string>('');

  const [training, setTraining] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const dsList = await api.getDatasets();
      setDatasets(dsList);
      if (dsList.length > 0 && !selectedDatasetId) {
        setSelectedDatasetId(dsList[0].id);
        const autoTarget = dsList[0].columns_metadata?.find((c) => c.suggested_role === 'target');
        if (autoTarget) setTargetColumn(autoTarget.name);
      }
      const modelList = await api.getModels();
      setModels(modelList);
      if (modelList.length > 0 && !selectedModel) {
        setSelectedModel(modelList[0]);
      }
    } catch (err: any) {
      console.error('Failed to load training data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTrain = async () => {
    if (!selectedDatasetId) {
      alert('Please select a dataset to train on.');
      return;
    }
    try {
      setTraining(true);
      const trained = await api.trainModel({
        dataset_id: selectedDatasetId,
        algorithm: algorithm,
        target_column: targetColumn || undefined,
        test_size: testSize,
        n_estimators: nEstimators,
        max_depth: maxDepth,
      });
      await fetchData();
      setSelectedModel(trained);
    } catch (err: any) {
      alert(`Model training error: ${err.message}`);
    } finally {
      setTraining(false);
    }
  };

  const handleDeleteModel = async (id: string) => {
    if (!confirm('Delete this model artifact?')) return;
    try {
      await api.deleteModel(id);
      if (selectedModel?.id === id) {
        setSelectedModel(null);
      }
      fetchData();
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  const currentDataset = datasets.find((d) => d.id === selectedDatasetId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Model Training & Evaluation</h2>
          <p className="text-xs text-cyber-textSecondary mt-0.5">
            Train, evaluate, and benchmark supervised network classifiers with strict data leakage prevention.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Training Configuration Panel */}
        <div className="cyber-card p-5 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-cyber-border">
            <Cpu className="w-4 h-4 text-cyber-accentBlue" />
            <h3 className="text-sm font-bold text-white">Classifier Configuration</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-cyber-textSecondary mb-1 font-semibold">Training Dataset</label>
              <select
                value={selectedDatasetId}
                onChange={(e) => {
                  setSelectedDatasetId(e.target.value);
                  const ds = datasets.find((d) => d.id === e.target.value);
                  const autoTarget = ds?.columns_metadata?.find((c) => c.suggested_role === 'target');
                  if (autoTarget) setTargetColumn(autoTarget.name);
                }}
                className="w-full p-2 bg-cyber-surface border border-cyber-border rounded-lg text-white"
              >
                {datasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.original_filename} ({d.row_count.toLocaleString()} rows)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-cyber-textSecondary mb-1 font-semibold">Target / Label Column</label>
              <select
                value={targetColumn}
                onChange={(e) => setTargetColumn(e.target.value)}
                className="w-full p-2 bg-cyber-surface border border-cyber-border rounded-lg text-white"
              >
                <option value="">Auto-Detect Label</option>
                {currentDataset?.columns_metadata?.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.unique_count} distinct classes)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-cyber-textSecondary mb-1 font-semibold">Algorithm</label>
              <input
                type="text"
                disabled
                value="Random Forest Classifier (Ensemble)"
                className="w-full p-2 bg-cyber-bg border border-cyber-border rounded-lg text-cyber-textSecondary cursor-not-allowed"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-cyber-textSecondary font-semibold">Test Evaluation Split:</span>
                <span className="font-mono text-cyber-accentBlue font-bold">{(testSize * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.4"
                step="0.05"
                value={testSize}
                onChange={(e) => setTestSize(parseFloat(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            <div>
              <label className="block text-cyber-textSecondary mb-1 font-semibold">Number of Trees (n_estimators)</label>
              <input
                type="number"
                min="10"
                max="300"
                value={nEstimators}
                onChange={(e) => setNEstimators(parseInt(e.target.value) || 100)}
                className="w-full p-2 bg-cyber-surface border border-cyber-border rounded-lg text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-cyber-textSecondary mb-1 font-semibold">Max Tree Depth</label>
              <input
                type="number"
                min="3"
                max="30"
                value={maxDepth}
                onChange={(e) => setMaxDepth(parseInt(e.target.value) || 15)}
                className="w-full p-2 bg-cyber-surface border border-cyber-border rounded-lg text-white font-mono"
              />
            </div>

            <button
              onClick={handleTrain}
              disabled={training || datasets.length === 0}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold transition shadow-glow flex items-center justify-center space-x-2"
            >
              <Play className={`w-3.5 h-3.5 ${training ? 'animate-spin' : ''}`} />
              <span>{training ? 'Fitting Trees on Data...' : 'Train Model & Benchmark'}</span>
            </button>
          </div>
        </div>

        {/* Evaluation Metrics & Benchmarks Display */}
        <div className="lg:col-span-2 space-y-6">
          {selectedModel ? (
            <>
              {/* Top Metrics Cards */}
              <div className="cyber-card p-5 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-cyber-border">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{selectedModel.name}</span>
                    </h3>
                    <p className="text-[11px] text-cyber-textSecondary mt-0.5">
                      Trained on {selectedModel.training_rows.toLocaleString()} samples • Evaluated on {selectedModel.test_rows.toLocaleString()} holdout samples
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteModel(selectedModel.id)}
                    className="text-cyber-textMuted hover:text-red-400 p-1"
                    title="Delete model"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-cyber-surface rounded-lg border border-cyber-border">
                    <span className="text-cyber-textMuted block text-[10px] uppercase font-semibold">Test Accuracy</span>
                    <span className="font-mono text-lg font-bold text-emerald-400">
                      {selectedModel.accuracy ? `${(selectedModel.accuracy * 100).toFixed(2)}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="p-3 bg-cyber-surface rounded-lg border border-cyber-border">
                    <span className="text-cyber-textMuted block text-[10px] uppercase font-semibold">Macro F1-Score</span>
                    <span className="font-mono text-lg font-bold text-cyber-accentBlue">
                      {selectedModel.f1_macro ? selectedModel.f1_macro.toFixed(4) : 'N/A'}
                    </span>
                  </div>
                  <div className="p-3 bg-cyber-surface rounded-lg border border-cyber-border">
                    <span className="text-cyber-textMuted block text-[10px] uppercase font-semibold">Macro Precision</span>
                    <span className="font-mono text-lg font-bold text-purple-400">
                      {selectedModel.precision_macro ? selectedModel.precision_macro.toFixed(4) : 'N/A'}
                    </span>
                  </div>
                  <div className="p-3 bg-cyber-surface rounded-lg border border-cyber-border">
                    <span className="text-cyber-textMuted block text-[10px] uppercase font-semibold">Macro Recall</span>
                    <span className="font-mono text-lg font-bold text-amber-400">
                      {selectedModel.recall_macro ? selectedModel.recall_macro.toFixed(4) : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Confusion Matrix Table */}
                {selectedModel.confusion_matrix && selectedModel.classes && (
                  <div className="pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-cyber-textSecondary mb-2 flex items-center space-x-1.5">
                      <BarChart2 className="w-3.5 h-3.5 text-cyber-accentBlue" />
                      <span>Confusion Matrix (Unseen Holdout Test Set)</span>
                    </h4>
                    <div className="overflow-x-auto border border-cyber-border rounded-lg bg-cyber-surface p-3">
                      <table className="w-full text-center text-xs">
                        <thead>
                          <tr className="text-cyber-textMuted text-[10px]">
                            <th className="text-left py-1 text-cyber-textSecondary">Actual \ Predicted</th>
                            {selectedModel.classes.map((cls) => (
                              <th key={cls} className="py-1 px-2 font-mono">{cls}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {selectedModel.confusion_matrix.map((row, rIdx) => (
                            <tr key={rIdx} className="border-t border-cyber-border/40">
                              <td className="text-left py-2 font-semibold text-cyber-textSecondary text-[11px]">
                                {selectedModel.classes?.[rIdx]}
                              </td>
                              {row.map((val, cIdx) => {
                                const isDiagonal = rIdx === cIdx;
                                return (
                                  <td
                                    key={cIdx}
                                    className={`py-2 px-3 font-mono font-bold ${
                                      isDiagonal
                                        ? 'bg-emerald-950/40 text-emerald-300'
                                        : val > 0 ? 'bg-red-950/40 text-red-300' : 'text-cyber-textMuted'
                                    }`}
                                  >
                                    {val}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Feature Importance Ranking Chart */}
              {selectedModel.feature_importances && selectedModel.feature_importances.length > 0 && (
                <div className="cyber-card p-5 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">Global Feature Importance (Gini Impurity)</h3>
                    <p className="text-[11px] text-cyber-textSecondary">
                      Most influential network flow attributes determining classification decisions
                    </p>
                  </div>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={selectedModel.feature_importances.slice(0, 8)} layout="vertical">
                        <XAxis type="number" stroke="#64748b" fontSize={10} />
                        <YAxis dataKey="feature" type="category" stroke="#64748b" fontSize={10} width={130} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                        <Bar dataKey="importance" fill="#818cf8" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Research Methodology Disclaimer */}
              <div className="cyber-card p-4 border-l-4 border-l-blue-500 bg-blue-950/20 text-xs text-blue-200 flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="block text-blue-300">Academic Evaluation Disclaimer:</strong>
                  <p className="leading-relaxed text-[11px] text-blue-200/90">
                    These metrics are strictly measured on the isolated test partition of this specific dataset.
                    High accuracy on benchmark datasets (such as CIC-IDS2017) does not imply guaranteed efficacy against
                    zero-day attacks, encrypted payloads, or non-stationary network distribution shifts in live environments.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="cyber-card p-12 text-center text-cyber-textMuted text-xs space-y-3">
              <Cpu className="w-8 h-8 mx-auto text-cyber-textMuted" />
              <p>No model selected. Configure parameters on the left and click "Train Model & Benchmark".</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
