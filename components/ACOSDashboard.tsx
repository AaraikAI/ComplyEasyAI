/**
 * aCOS Dashboard Component
 * 
 * Main dashboard for Autonomous Compliance Operating System features
 */

import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Shield, 
  TrendingUp, 
  Zap, 
  Eye, 
  FileText, 
  Network, 
  Cpu, 
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface ComplianceGoal {
  id: string;
  goalType: string;
  frameworks: string[];
  riskTolerance: string;
  horizon: number;
  status: string;
  targetScore?: number;
}

interface ControlLoop {
  id: string;
  controlId: string;
  confidence: number;
  status: string;
  cycleCount: number;
}

interface EarlyWarning {
  type: string;
  severity: string;
  description: string;
  predictedDate: string;
  confidence: number;
  recommendedAction: string;
}

const ACOSDashboard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'loops' | 'predictions' | 'simulations' | 'redteam' | 'swarm' | 'iot'>('overview');
  const [goals, setGoals] = useState<ComplianceGoal[]>([]);
  const [loops, setLoops] = useState<ControlLoop[]>([]);
  const [warnings, setWarnings] = useState<EarlyWarning[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [goalsData, warningsData] = await Promise.all([
        api.acos.getGoals(),
        api.acos.getEarlyWarnings(3),
      ]);
      setGoals(goalsData || []);
      setWarnings(warningsData || []);
    } catch (error) {
      console.error('Error loading aCOS data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async () => {
    const goalData = {
      goalType: 'maintain',
      frameworks: [],
      riskTolerance: 'medium',
      horizon: 90,
      autoActionPolicy: 'moderate',
      targetScore: 85,
    };

    try {
      await api.acos.createGoal(goalData);
      loadData();
    } catch (error) {
      console.error('Error creating goal:', error);
      alert('Failed to create compliance goal');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">aCOS Dashboard</h1>
          <p className="text-gray-600 mt-1">Autonomous Compliance Operating System v3.0</p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-600 hover:text-gray-900"
        >
          ← Back
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'goals', label: 'Goals', icon: Target },
            { id: 'loops', label: 'Control Loops', icon: Zap },
            { id: 'predictions', label: 'Predictions', icon: TrendingUp },
            { id: 'simulations', label: 'Simulations', icon: Network },
            { id: 'redteam', label: 'Red Team', icon: Shield },
            { id: 'swarm', label: 'Swarm', icon: Brain },
            { id: 'iot', label: 'IoT Devices', icon: Cpu },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Goals</p>
                    <p className="text-2xl font-bold mt-1">{goals.length}</p>
                  </div>
                  <Target className="text-blue-500" size={24} />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Control Loops</p>
                    <p className="text-2xl font-bold mt-1">{loops.length}</p>
                  </div>
                  <Zap className="text-yellow-500" size={24} />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Early Warnings</p>
                    <p className="text-2xl font-bold mt-1">{warnings.length}</p>
                  </div>
                  <AlertTriangle className="text-red-500" size={24} />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">System Status</p>
                    <p className="text-2xl font-bold mt-1 text-green-600">Active</p>
                  </div>
                  <CheckCircle className="text-green-500" size={24} />
                </div>
              </div>
            </div>

            {/* Early Warnings */}
            {warnings.length > 0 && (
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <AlertTriangle className="text-red-500 mr-2" size={20} />
                  Early Warnings
                </h2>
                <div className="space-y-3">
                  {warnings.slice(0, 5).map((warning, idx) => (
                    <div key={idx} className="border-l-4 border-red-500 pl-4 py-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{warning.description}</p>
                          <p className="text-sm text-gray-600 mt-1">{warning.recommendedAction}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          warning.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                          warning.severity === 'High' ? 'bg-orange-100 text-orange-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {warning.severity}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Predicted: {new Date(warning.predictedDate).toLocaleDateString()} • Confidence: {Math.round(warning.confidence * 100)}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={handleCreateGoal}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                >
                  <Target className="text-blue-500 mb-2" size={24} />
                  <p className="font-medium">Create Compliance Goal</p>
                  <p className="text-sm text-gray-600 mt-1">Set intent-driven compliance objectives</p>
                </button>
                <button
                  onClick={() => setActiveTab('simulations')}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                >
                  <Network className="text-blue-500 mb-2" size={24} />
                  <p className="font-medium">Run Simulation</p>
                  <p className="text-sm text-gray-600 mt-1">Test "what-if" scenarios</p>
                </button>
                <button
                  onClick={() => setActiveTab('redteam')}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                >
                  <Shield className="text-blue-500 mb-2" size={24} />
                  <p className="font-medium">Red Team Scan</p>
                  <p className="text-sm text-gray-600 mt-1">Automated security testing</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'goals' && (
          <GoalsTab goals={goals} onCreateGoal={handleCreateGoal} onRefresh={loadData} />
        )}

        {activeTab === 'loops' && (
          <ControlLoopsTab loops={loops} onRefresh={loadData} />
        )}

        {activeTab === 'predictions' && (
          <PredictionsTab />
        )}

        {activeTab === 'simulations' && (
          <SimulationsTab />
        )}

        {activeTab === 'redteam' && (
          <RedTeamTab />
        )}

        {activeTab === 'swarm' && (
          <SwarmTab />
        )}

        {activeTab === 'iot' && (
          <IoTTab />
        )}
      </div>
    </div>
  );
};

// Sub-components
const GoalsTab: React.FC<{ goals: ComplianceGoal[]; onCreateGoal: () => void; onRefresh: () => void }> = ({ goals, onCreateGoal, onRefresh }) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Compliance Goals</h2>
        <button
          onClick={onCreateGoal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Create Goal
        </button>
      </div>
      {goals.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Target className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">No compliance goals yet</p>
          <button
            onClick={onCreateGoal}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Your First Goal
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => (
            <div key={goal.id} className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{goal.goalType.charAt(0).toUpperCase() + goal.goalType.slice(1)} Compliance Goal</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Frameworks: {goal.frameworks.length} • Horizon: {goal.horizon} days • Risk Tolerance: {goal.riskTolerance}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  goal.status === 'active' ? 'bg-green-100 text-green-800' :
                  goal.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {goal.status}
                </span>
              </div>
              {goal.targetScore && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Target Score</span>
                    <span>{goal.targetScore}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${goal.targetScore}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ControlLoopsTab: React.FC<{ loops: ControlLoop[]; onRefresh: () => void }> = ({ loops, onRefresh }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Control Loops</h2>
      {loops.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Zap className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">No active control loops</p>
        </div>
      ) : (
        <div className="space-y-4">
          {loops.map((loop) => (
            <div key={loop.id} className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Control Loop: {loop.controlId.substring(0, 8)}...</h3>
                  <p className="text-sm text-gray-600 mt-1">Cycles: {loop.cycleCount}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Confidence</p>
                  <p className="text-lg font-semibold">{Math.round(loop.confidence * 100)}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const PredictionsTab: React.FC = () => {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPredictions = async () => {
    setLoading(true);
    try {
      const data = await api.acos.predictFutureRisks(6);
      setPredictions(data || []);
    } catch (error) {
      console.error('Error loading predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPredictions();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Risk Predictions (6 Months)</h2>
        <button
          onClick={loadPredictions}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      {predictions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <TrendingUp className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">No predictions available</p>
        </div>
      ) : (
        <div className="space-y-4">
          {predictions.map((pred, idx) => (
            <div key={idx} className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{pred.riskType}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Predicted: {new Date(pred.predictedDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Probability</p>
                  <p className="text-lg font-semibold">{Math.round(pred.predictedProbability * 100)}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SimulationsTab: React.FC = () => {
  const [scenarioType, setScenarioType] = useState<string>('control_change');
  const [parameters, setParameters] = useState<any>({});
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleRunSimulation = async () => {
    setLoading(true);
    try {
      const data = await api.acos.runSimulation({
        name: 'Test Simulation',
        description: 'Testing compliance impact',
        scenarioType,
        parameters,
      });
      setResult(data);
    } catch (error) {
      console.error('Error running simulation:', error);
      alert('Failed to run simulation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Compliance Digital Twin</h2>
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scenario Type
            </label>
            <select
              value={scenarioType}
              onChange={(e) => setScenarioType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="control_change">Control Change</option>
              <option value="policy_update">Policy Update</option>
              <option value="risk_event">Risk Event</option>
              <option value="framework_addition">Framework Addition</option>
            </select>
          </div>
          <button
            onClick={handleRunSimulation}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Running Simulation...' : 'Run Simulation'}
          </button>
        </div>
        {result && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Simulation Result</h3>
            <p>Baseline Score: {result.baselineScore}%</p>
            <p>Simulated Score: {result.simulatedScore}%</p>
            <p>Score Change: {result.scoreChange > 0 ? '+' : ''}{result.scoreChange}%</p>
          </div>
        )}
      </div>
    </div>
  );
};

const RedTeamTab: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleRunScan = async () => {
    setScanning(true);
    try {
      const data = await api.acos.runAutomatedScan();
      setResults(data || []);
    } catch (error) {
      console.error('Error running scan:', error);
      alert('Failed to run red team scan');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Red Team & Adversarial Testing</h2>
        <button
          onClick={handleRunScan}
          disabled={scanning}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          {scanning ? 'Scanning...' : 'Run Automated Scan'}
        </button>
      </div>
      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((result, idx) => (
            <div key={idx} className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Scenario: {result.scenarioId}</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  result.success ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                }`}>
                  {result.success ? 'Vulnerabilities Found' : 'No Issues'}
                </span>
              </div>
              {result.vulnerabilitiesFound && result.vulnerabilitiesFound.length > 0 && (
                <div className="mt-4">
                  <p className="font-medium mb-2">Vulnerabilities:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {result.vulnerabilitiesFound.map((vuln: any, vIdx: number) => (
                      <li key={vIdx} className="text-sm text-gray-700">
                        {vuln.type}: {vuln.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SwarmTab: React.FC = () => {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadInsights = async () => {
    setLoading(true);
    try {
      const data = await api.acos.getSwarmInsights();
      setInsights(data || []);
    } catch (error) {
      console.error('Error loading swarm insights:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Federated Swarm Insights</h2>
        <button
          onClick={loadInsights}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      {insights.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Brain className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">No swarm insights available</p>
        </div>
      ) : (
        <div className="space-y-4">
          {insights.map((insight, idx) => (
            <div key={idx} className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold">{insight.insightType.replace('_', ' ').toUpperCase()}</h3>
                  <p className="text-gray-700 mt-2">{insight.description}</p>
                  {insight.recommendations && insight.recommendations.length > 0 && (
                    <div className="mt-4">
                      <p className="font-medium mb-2">Recommendations:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {insight.recommendations.map((rec: string, rIdx: number) => (
                          <li key={rIdx} className="text-sm text-gray-600">{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="ml-4 text-right">
                  <p className="text-sm text-gray-600">Confidence</p>
                  <p className="text-lg font-semibold">{Math.round(insight.confidence * 100)}%</p>
                  <p className="text-xs text-gray-500 mt-1">{insight.sourceCount} sources</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const IoTTab: React.FC = () => {
  const [devices, setDevices] = useState<any[]>([]);
  const [showRegister, setShowRegister] = useState(false);
  const [deviceForm, setDeviceForm] = useState({
    deviceId: '',
    deviceType: '',
    location: '',
    mqttTopic: '',
  });

  const handleRegisterDevice = async () => {
    try {
      await api.acos.registerDevice(deviceForm);
      setShowRegister(false);
      setDeviceForm({ deviceId: '', deviceType: '', location: '', mqttTopic: '' });
      // Reload devices
    } catch (error) {
      console.error('Error registering device:', error);
      alert('Failed to register device');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">IoT Devices</h2>
        <button
          onClick={() => setShowRegister(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Register Device
        </button>
      </div>

      {showRegister && (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="font-semibold mb-4">Register New IoT Device</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Device ID</label>
              <input
                type="text"
                value={deviceForm.deviceId}
                onChange={(e) => setDeviceForm({ ...deviceForm, deviceId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="device-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Device Type</label>
              <input
                type="text"
                value={deviceForm.deviceType}
                onChange={(e) => setDeviceForm({ ...deviceForm, deviceType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Sensor, Camera, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                type="text"
                value={deviceForm.location}
                onChange={(e) => setDeviceForm({ ...deviceForm, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Building A, Floor 3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">MQTT Topic (optional)</label>
              <input
                type="text"
                value={deviceForm.mqttTopic}
                onChange={(e) => setDeviceForm({ ...deviceForm, mqttTopic: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="devices/device-001/data"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleRegisterDevice}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Register
              </button>
              <button
                onClick={() => setShowRegister(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {devices.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Cpu className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">No IoT devices registered</p>
        </div>
      ) : (
        <div className="space-y-4">
          {devices.map((device) => (
            <div key={device.id} className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{device.deviceId}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {device.deviceType} • {device.location}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  device.complianceStatus === 'compliant' ? 'bg-green-100 text-green-800' :
                  device.complianceStatus === 'non_compliant' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {device.complianceStatus}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Add Target icon import
import { Target } from 'lucide-react';

export default ACOSDashboard;

