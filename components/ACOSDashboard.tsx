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
  BarChart3,
  Target,
  Pause,
  Play,
  History,
  Trash2,
  Sparkles,
  Loader2,
  Video,
  Timer,
  Lock
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { GoalModal } from './GoalModal';
import { Plus, X } from 'lucide-react';
import { HomomorphicAI } from './AIFeatures/HomomorphicAI';

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

const ACOSDashboard: React.FC<{ onBack: () => void; onNavigate?: (view: string) => void }> = ({ onBack, onNavigate }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'loops' | 'predictions' | 'simulations' | 'redteam' | 'swarm' | 'iot' | 'neuroSymbolic' | 'vr' | 'jit' | 'homomorphic'>('overview');
  const [goals, setGoals] = useState<ComplianceGoal[]>([]);
  const [loops, setLoops] = useState<ControlLoop[]>([]);
  const [warnings, setWarnings] = useState<EarlyWarning[]>([]);
  const [loading, setLoading] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [goalFilters, setGoalFilters] = useState<{ status?: string; framework?: string }>({});

  useEffect(() => {
    loadData();
    
    // Check if there's a tab to navigate to from chatbot
    const checkTab = () => {
      const acosTab = sessionStorage.getItem('acosActiveTab');
      if (acosTab && ['overview', 'goals', 'loops', 'predictions', 'simulations', 'redteam', 'swarm', 'iot', 'neuroSymbolic', 'vr', 'jit', 'homomorphic'].includes(acosTab)) {
        setActiveTab(acosTab as any);
        sessionStorage.removeItem('acosActiveTab'); // Clear after use
      }
    };
    
    // Check immediately
    checkTab();
    
    // Also check after a short delay to handle navigation timing
    const timeoutId = setTimeout(checkTab, 100);
    
    // Listen for custom event from chatbot
    const handleTabChange = (event: CustomEvent) => {
      const tab = event.detail?.tab;
      if (tab && ['overview', 'goals', 'loops', 'predictions', 'simulations', 'redteam', 'swarm', 'iot', 'neuroSymbolic', 'vr', 'jit', 'homomorphic'].includes(tab)) {
        setActiveTab(tab as any);
        sessionStorage.removeItem('acosActiveTab');
      }
    };
    
    // Listen for storage events (in case navigation happens in same tab)
    const handleStorageChange = () => {
      checkTab();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('acosTabChange', handleTabChange as EventListener);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('acosTabChange', handleTabChange as EventListener);
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [goalsData, warningsData, loopsData] = await Promise.all([
        api.acos.getGoals().catch(() => []),
        api.acos.getEarlyWarnings(3).catch(() => []),
        api.acos.getControlLoops().catch(() => []),
      ]);
      setGoals(goalsData || []);
      setWarnings(warningsData || []);
      setLoops(loopsData || []);
    } catch (error) {
      console.error('Error loading aCOS data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = () => {
    setEditingGoal(null);
    setShowGoalModal(true);
  };

  const handleEditGoal = (goal: any) => {
    setEditingGoal(goal);
    setShowGoalModal(true);
  };

  const [deletingGoal, setDeletingGoal] = useState<string | null>(null);

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) {
      return;
    }
    setDeletingGoal(goalId);
    try {
      await api.acos.deleteGoal(goalId);
      await loadData();
    } catch (error) {
      console.error('Error deleting goal:', error);
      alert('Failed to delete goal');
    } finally {
      setDeletingGoal(null);
    }
  };

  const handleRestoreGoal = async (goalId: string) => {
    try {
      await api.acos.restoreGoal(goalId);
      await loadData();
    } catch (error) {
      console.error('Error restoring goal:', error);
      alert('Failed to restore goal');
    }
  };

  const handleGoalSuccess = async () => {
    await loadData(); // Reload all data
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">aCOS Dashboard</h1>
          <p className="text-gray-600 mt-1">Autonomous Compliance Operating System</p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-600 hover:text-gray-900"
        >
          ← Back
        </button>
      </div>

      {/* Main Content Layout with Sidebar */}
      <div className="flex gap-6">
        {/* Left Sidebar - Navigation Tabs */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-6">
            {/* Core Features Section */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-2">
                Core Features
              </h3>
              <nav className="space-y-1">
                {[
                  { id: 'overview', label: 'Overview', icon: BarChart3 },
                  { id: 'goals', label: 'Goals', icon: Target },
                  { id: 'loops', label: 'Control Loops', icon: Zap },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${
                        activeTab === tab.id
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-white' : 'text-gray-500'}`} />
                      <span className="text-sm">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Analytics & Intelligence Section */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-2">
                Analytics & Intelligence
              </h3>
              <nav className="space-y-1">
                {[
                  { id: 'predictions', label: 'Predictions', icon: TrendingUp },
                  { id: 'simulations', label: 'Simulations', icon: Network },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${
                        activeTab === tab.id
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-white' : 'text-gray-500'}`} />
                      <span className="text-sm">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Security & Testing Section */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-2">
                Security & Testing
              </h3>
              <nav className="space-y-1">
                {[
                  { id: 'redteam', label: 'Red Team', icon: Shield },
                  { id: 'jit', label: 'JIT Access', icon: Timer },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${
                        activeTab === tab.id
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-white' : 'text-gray-500'}`} />
                      <span className="text-sm">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* AI & Advanced Features Section */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-2">
                AI & Advanced
              </h3>
              <nav className="space-y-1">
                {[
                  { id: 'swarm', label: 'Swarm', icon: Brain },
                  { id: 'neuroSymbolic', label: 'NeuroSymbolic AI', icon: Sparkles },
                  { id: 'homomorphic', label: 'Homomorphic AI', icon: Lock },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${
                        activeTab === tab.id
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-white' : 'text-gray-500'}`} />
                      <span className="text-sm">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Integration & Devices Section */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-2">
                Integration & Devices
              </h3>
              <nav className="space-y-1">
                {[
                  { id: 'iot', label: 'IoT Devices', icon: Cpu },
                  { id: 'vr', label: 'VR Collaborations', icon: Video },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${
                        activeTab === tab.id
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-white' : 'text-gray-500'}`} />
                      <span className="text-sm">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
          <GoalsTab 
            goals={goals} 
            onCreateGoal={handleCreateGoal}
            onEditGoal={handleEditGoal}
            onDeleteGoal={handleDeleteGoal}
            onRestoreGoal={handleRestoreGoal}
            deletingGoal={deletingGoal}
            filters={goalFilters}
            onFiltersChange={setGoalFilters}
            onRefresh={async () => {
              // Refresh goals with filters
              try {
                const goalsData = await api.acos.getGoals(goalFilters);
                if (goalsData && Array.isArray(goalsData)) {
                  setGoals(goalsData);
                }
              } catch (err) {
                console.error('Error refreshing goals:', err);
              }
              // Also refresh other data
              loadData();
            }} 
          />
        )}

        {/* Goal Modal */}
        <GoalModal
          isOpen={showGoalModal}
          onClose={() => {
            setShowGoalModal(false);
            setEditingGoal(null);
          }}
          onSuccess={handleGoalSuccess}
          goal={editingGoal}
        />

        {activeTab === 'loops' && (
          <ControlLoopsTab loops={loops} onRefresh={() => {
            loadData();
            // Also refresh loops specifically
            api.acos.getControlLoops().then(l => setLoops(l || [])).catch(() => {});
          }} setLoops={setLoops} />
        )}

        {activeTab === 'predictions' && (
          <PredictionsTab />
        )}

        {activeTab === 'simulations' && (
          <SimulationsTab />
        )}

        {activeTab === 'redteam' && (
          <RedTeamTab onNavigate={onNavigate} />
        )}

        {activeTab === 'swarm' && (
          <SwarmTab />
        )}

        {activeTab === 'iot' && (
          <IoTTab />
        )}

        {activeTab === 'neuroSymbolic' && (
          <NeuroSymbolicTab />
        )}

        {activeTab === 'vr' && (
          <VRCollaborationsTab />
        )}

        {activeTab === 'jit' && (
          <JITAccessTab />
        )}

        {activeTab === 'homomorphic' && (
          <HomomorphicAITab />
        )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-components
const GoalsTab: React.FC<{ 
  goals: ComplianceGoal[]; 
  onCreateGoal: () => void; 
  onEditGoal?: (goal: any) => void;
  onDeleteGoal?: (goalId: string) => void;
  onRestoreGoal?: (goalId: string) => void;
  deletingGoal?: string | null;
  filters?: { status?: string; framework?: string };
  onFiltersChange?: (filters: { status?: string; framework?: string }) => void;
  onRefresh: () => void;
}> = ({ goals, onCreateGoal, onEditGoal, onDeleteGoal, onRestoreGoal, deletingGoal, filters, onFiltersChange, onRefresh }) => {
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
                <div className="flex-1">
                  <h3 className="font-semibold">
                    {(goal as any).name || `${goal.goalType.charAt(0).toUpperCase() + goal.goalType.slice(1)} Compliance Goal`}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Frameworks: {goal.frameworks.length > 0 ? goal.frameworks.join(', ') : 'None'} • Horizon: {goal.horizon} days • Risk Tolerance: {goal.riskTolerance}
                  </p>
                  {(goal as any).deadline && (
                    <p className="text-xs text-gray-500 mt-1">
                      Deadline: {new Date((goal as any).deadline).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    goal.status === 'active' ? 'bg-green-100 text-green-800' :
                    goal.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                    goal.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {goal.status}
                  </span>
                  {onEditGoal && (
                    <button
                      onClick={() => onEditGoal(goal)}
                      className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                  )}
                  {goal.status === 'archived' ? (
                    onRestoreGoal && (
                      <button
                        onClick={() => onRestoreGoal(goal.id)}
                        className="px-3 py-1 text-sm text-green-600 hover:text-green-800"
                      >
                        Restore
                      </button>
                    )
                  ) : (
                    onDeleteGoal && (
                      <button
                        onClick={() => onDeleteGoal(goal.id)}
                        disabled={deletingGoal === goal.id}
                        className="px-3 py-1 text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        {deletingGoal === goal.id ? 'Deleting...' : 'Delete'}
                      </button>
                    )
                  )}
                </div>
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

const ControlLoopsTab: React.FC<{ loops: ControlLoop[]; onRefresh: () => void; setLoops: (loops: ControlLoop[]) => void }> = ({ loops, onRefresh, setLoops }) => {
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedControlId, setSelectedControlId] = useState('');
  const [availableControls, setAvailableControls] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [executingLoopId, setExecutingLoopId] = useState<string | null>(null);
  const [triggerType, setTriggerType] = useState<'manual' | 'schedule' | 'threshold' | 'event'>('manual');

  useEffect(() => {
    loadLoops();
    loadControls();
  }, []);

  const loadLoops = async () => {
    setLoading(true);
    try {
      const data = await api.acos.getControlLoops();
      console.log('Loaded control loops:', data);
      if (data && Array.isArray(data)) {
        setLoops(data);
        // Also update parent state via onRefresh
        if (onRefresh) {
          onRefresh();
        }
      } else {
        setLoops([]);
      }
    } catch (error) {
      console.error('Error loading control loops:', error);
      setLoops([]);
    } finally {
      setLoading(false);
    }
  };

  const loadControls = async () => {
    try {
      const frameworks = await api.frameworks.list();
      const controls: any[] = [];
      frameworks.forEach(fw => {
        if (fw.controls) {
          fw.controls.forEach((ctrl: any) => {
            controls.push({
              id: ctrl.id,
              name: ctrl.name,
              frameworkName: fw.name,
            });
          });
        }
      });
      setAvailableControls(controls);
    } catch (error) {
      console.error('Error loading controls:', error);
    }
  };

  const handleCreateLoop = async () => {
    if (!selectedControlId) {
      alert('Please select a control');
      return;
    }
    setLoading(true);
    try {
      const result = await api.acos.createControlLoop({ 
        controlId: selectedControlId,
        triggerType: triggerType,
      });
      console.log('Control loop created:', result);
      
      // If the API returns the created loop, add it to the list immediately
      if (result && result.id) {
        setLoops(prevLoops => [...prevLoops, result]);
        // Also update parent state
        if (onRefresh) {
          onRefresh();
        }
      }
      
      setShowCreate(false);
      setSelectedControlId('');
      
      // Wait a brief moment for the database to persist, then refresh
      setTimeout(async () => {
        try {
          const loopsData = await api.acos.getControlLoops();
          console.log('Refreshed loops after creation:', loopsData);
          if (loopsData && Array.isArray(loopsData)) {
            setLoops(loopsData);
            // Update parent state
            if (onRefresh) {
              onRefresh();
            }
          }
        } catch (err) {
          console.error('Error loading loops:', err);
          // If reload fails but we have the result, keep it
          if (result && result.id) {
            // Already added above
          }
        }
      }, 500);
      
      alert('Control loop created successfully');
    } catch (error: any) {
      console.error('Error creating control loop:', error);
      alert(`Failed to create control loop: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteLoop = async (loopId: string) => {
    setLoading(true);
    setExecutingLoopId(loopId);
    setExecutionResult(null);
    try {
      const result = await api.acos.executeControlLoop(loopId);
      setExecutionResult(result);
      // Refresh loops to get updated cycle count and confidence
      await loadLoops();
    } catch (error) {
      console.error('Error executing control loop:', error);
      alert('Failed to execute control loop');
    } finally {
      setLoading(false);
      setExecutingLoopId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Control Loops</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Create Control Loop
        </button>
      </div>

      {showCreate && (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="font-semibold mb-4">Create New Control Loop</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Control</label>
              <select
                value={selectedControlId}
                onChange={(e) => setSelectedControlId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">-- Select a Control --</option>
                {availableControls.map((ctrl) => (
                  <option key={ctrl.id} value={ctrl.id}>
                    {ctrl.name} ({ctrl.frameworkName})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Trigger Type</label>
              <select
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="manual">Manual</option>
                <option value="schedule">Schedule</option>
                <option value="threshold">Threshold</option>
                <option value="event">Event</option>
              </select>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleCreateLoop}
                disabled={loading || !selectedControlId}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => {
                  setShowCreate(false);
                  setSelectedControlId('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && loops.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Zap className="mx-auto text-gray-400 mb-4 animate-spin" size={48} />
          <p className="text-gray-600">Loading control loops...</p>
        </div>
      ) : loops.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Zap className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">No active control loops</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Your First Control Loop
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {loops.map((loop) => {
            const control = availableControls.find(c => c.id === loop.controlId);
            return (
              <div key={loop.id} className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">
                      {control ? `${control.name} (${control.frameworkName})` : `Control: ${loop.controlId.substring(0, 8)}...`}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Cycles: {loop.cycleCount} • Status: {loop.status}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Confidence</p>
                      <p className="text-lg font-semibold">{Math.round(loop.confidence * 100)}%</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={async () => {
                          try {
                            const historyData = await api.acos.getControlLoopHistory(loop.id);
                            setHistory(historyData);
                            setShowHistory(showHistory === loop.id ? null : loop.id);
                          } catch (error) {
                            alert('Failed to load history');
                          }
                        }}
                        className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                        title="View History"
                      >
                        <History size={16} />
                      </button>
                      {loop.status === 'paused' ? (
                        <button
                          onClick={async () => {
                            try {
                              await api.acos.resumeControlLoop(loop.id);
                              await loadLoops();
                            } catch (error) {
                              alert('Failed to resume control loop');
                            }
                          }}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          title="Resume"
                        >
                          <Play size={16} />
                        </button>
                      ) : (
                        <button
                          onClick={async () => {
                            try {
                              await api.acos.pauseControlLoop(loop.id);
                              await loadLoops();
                            } catch (error) {
                              alert('Failed to pause control loop');
                            }
                          }}
                          className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
                          title="Pause"
                        >
                          <Pause size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleExecuteLoop(loop.id)}
                        disabled={(loading && executingLoopId !== loop.id) || loop.status === 'paused'}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                        title="Execute"
                      >
                        {loading && executingLoopId === loop.id ? 'Executing...' : 'Execute'}
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Are you sure you want to delete this control loop?')) {
                            try {
                              await api.acos.deleteControlLoop(loop.id);
                              await loadLoops();
                            } catch (error) {
                              alert('Failed to delete control loop');
                            }
                          }
                        }}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
                {/* Show execution result for this loop */}
                {executionResult && executingLoopId === loop.id && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Execution Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="font-medium">Cycle Count:</span> {executionResult.cycleCount}
                        </div>
                        <div>
                          <span className="font-medium">Confidence:</span> {Math.round(executionResult.confidence * 100)}%
                        </div>
                        <div>
                          <span className="font-medium">Action Taken:</span> {executionResult.acted ? 'Yes' : 'No'}
                        </div>
                        <div>
                          <span className="font-medium">Verified:</span> {executionResult.verified ? 'Yes' : 'No'}
                        </div>
                      </div>
                      {executionResult.observed && (
                        <div className="mt-2 pt-2 border-t border-blue-200">
                          <p className="font-medium text-blue-900">Observed:</p>
                          <p className="text-gray-700">Control: {executionResult.observed.controlName || executionResult.observed.controlId}</p>
                          <p className="text-gray-700">Status: {executionResult.observed.currentStatus}</p>
                          <p className="text-gray-700">Framework: {executionResult.observed.frameworkName || executionResult.observed.frameworkStatus}</p>
                        </div>
                      )}
                      {executionResult.predicted && (
                        <div className="mt-2 pt-2 border-t border-blue-200">
                          <p className="font-medium text-blue-900">Predicted:</p>
                          <p className="text-gray-700">Risk Level: {executionResult.predicted.riskLevel}</p>
                          <p className="text-gray-700">Needs Action: {executionResult.predicted.needsAction ? 'Yes' : 'No'}</p>
                        </div>
                      )}
                      {executionResult.learned && executionResult.learned.insights && (
                        <div className="mt-2 pt-2 border-t border-blue-200">
                          <p className="font-medium text-blue-900">Insights:</p>
                          <ul className="list-disc list-inside text-gray-700">
                            {executionResult.learned.insights.map((insight: string, idx: number) => (
                              <li key={idx}>{insight}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {executionResult.scoreChange !== undefined && executionResult.scoreChange !== 0 && (
                        <div className="mt-2 pt-2 border-t border-blue-200">
                          <p className="font-medium text-blue-900">
                            Score Change: {executionResult.scoreChange > 0 ? '+' : ''}{executionResult.scoreChange}%
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Show history if expanded */}
                {showHistory === loop.id && history.length > 0 && (
                  <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Execution History</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {history.map((h: any, idx: number) => (
                        <div key={idx} className="p-2 bg-white rounded text-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-medium capitalize">{h.executionPhase}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-600">{h.durationMs}ms</span>
                              <span className="text-xs text-gray-500">
                                {new Date(h.timestamp).toLocaleString()}
                              </span>
                              {h.success ? (
                                <CheckCircle className="text-green-600" size={14} />
                              ) : (
                                <AlertTriangle className="text-red-600" size={14} />
                              )}
                            </div>
                          </div>
                          {h.error && (
                            <p className="text-xs text-red-600 mt-1">Error: {h.error}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{pred.riskType || 'Unknown Risk'}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Predicted Date: {pred.predictedDate ? new Date(pred.predictedDate).toLocaleDateString() : 'N/A'}
                  </p>
                  {pred.predictedSeverity && (
                    <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
                      pred.predictedSeverity === 'Critical' ? 'bg-red-100 text-red-800' :
                      pred.predictedSeverity === 'High' ? 'bg-orange-100 text-orange-800' :
                      pred.predictedSeverity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {pred.predictedSeverity} Severity
                    </span>
                  )}
                </div>
                <div className="text-right ml-4">
                  <p className="text-sm text-gray-600">Probability</p>
                  <p className="text-2xl font-semibold">{Math.round((pred.predictedProbability || 0) * 100)}%</p>
                  {pred.confidence && (
                    <p className="text-xs text-gray-500 mt-1">Confidence: {Math.round(pred.confidence * 100)}%</p>
                  )}
                </div>
              </div>
              {pred.factors && pred.factors.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">Contributing Factors:</p>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    {pred.factors.map((factor: string, fIdx: number) => (
                      <li key={fIdx}>{factor}</li>
                    ))}
                  </ul>
                </div>
              )}
              {pred.riskId && (
                <p className="text-xs text-gray-400 mt-2">Risk ID: {pred.riskId}</p>
              )}
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
    setResult(null); // Clear previous result
    try {
      const data = await api.acos.runSimulation({
        name: `Simulation - ${scenarioType}`,
        description: `Testing compliance impact for ${scenarioType}`,
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
              <option value="control_removal">Control Removal</option>
              <option value="control_modification">Control Modification</option>
              <option value="evidence_update">Evidence Update</option>
              <option value="audit_schedule">Audit Schedule Change</option>
              <option value="compliance_debt">Compliance Debt Accumulation</option>
              <option value="integration_change">Integration Change</option>
              <option value="user_role_change">User Role Change</option>
              <option value="framework_status_change">Framework Status Change</option>
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
          <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-lg mb-4">Simulation Result</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white p-3 rounded">
                <p className="text-sm text-gray-600">Baseline Score</p>
                <p className="text-2xl font-bold">{result.baselineScore}%</p>
              </div>
              <div className="bg-white p-3 rounded">
                <p className="text-sm text-gray-600">Simulated Score</p>
                <p className="text-2xl font-bold">{result.simulatedScore}%</p>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Score Change</p>
              <p className={`text-xl font-semibold ${result.scoreChange > 0 ? 'text-green-600' : result.scoreChange < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                {result.scoreChange > 0 ? '+' : ''}{result.scoreChange}%
              </p>
            </div>
            {result.affectedControls !== undefined && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-1">Affected Controls</p>
                <p className="text-lg font-semibold">{result.affectedControls}</p>
              </div>
            )}
            {result.affectedFrameworks !== undefined && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-1">Affected Frameworks</p>
                <p className="text-lg font-semibold">{result.affectedFrameworks}</p>
              </div>
            )}
            {result.confidence !== undefined && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-1">Confidence</p>
                <p className="text-lg font-semibold">{Math.round(result.confidence * 100)}%</p>
              </div>
            )}
            {result.recommendations && result.recommendations.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-300">
                <p className="text-sm font-medium text-gray-700 mb-2">Recommendations:</p>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  {result.recommendations.map((rec: string, idx: number) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.riskChanges && Array.isArray(result.riskChanges) && result.riskChanges.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-300">
                <p className="text-sm font-medium text-gray-700 mb-2">Risk Changes:</p>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  {result.riskChanges.map((risk: any, idx: number) => (
                    <li key={idx}>
                      {risk.riskType || risk.type}: {risk.change || risk.description || 'Risk change detected'}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const RedTeamTab: React.FC<{ onNavigate?: (view: string) => void }> = ({ onNavigate }) => {
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
                <div className="flex items-center space-x-3">
                  <h3 className="font-semibold">Scenario: {result.scenarioId?.replace(/redteam_\d+_/, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || `Scenario ${idx + 1}`}</h3>
                  {/* Add action buttons for specific scenarios */}
                  {(result.scenarioId?.includes('control_bypass') || result.scenarioId?.includes('control_bypass_test')) && (
                    <button
                      onClick={() => {
                        // Navigate to frameworks to view controls
                        if (onNavigate) {
                          onNavigate('frameworks');
                        } else {
                          window.location.hash = '#frameworks';
                        }
                      }}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    >
                      View Controls
                    </button>
                  )}
                  {(result.scenarioId?.includes('policy_violation') || result.scenarioId?.includes('policy_violation_test')) && (
                    <button
                      onClick={() => {
                        // Navigate to Policy Generator
                        if (onNavigate) {
                          onNavigate('ai-policy');
                        } else {
                          window.location.hash = '#ai-policy';
                        }
                      }}
                      className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                    >
                      Generate Policies
                    </button>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  result.success ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                }`}>
                  {result.success ? 'Vulnerabilities Found' : 'No Issues'}
                </span>
              </div>
              {result.vulnerabilitiesFound && result.vulnerabilitiesFound.length > 0 && (
                <div className="mt-4 space-y-3">
                  <p className="font-medium mb-2">Vulnerabilities:</p>
                  {result.vulnerabilitiesFound.map((vuln: any, vIdx: number) => (
                    <div key={vIdx} className="border-l-4 border-red-500 pl-4 py-2 bg-red-50 rounded">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{vuln.type}: {vuln.description}</p>
                          {vuln.affectedControls && vuln.affectedControls.length > 0 && (
                            <p className="text-xs text-gray-600 mt-1">Affected Controls: {vuln.affectedControls.length}</p>
                          )}
                        </div>
                        <div className="flex space-x-2 ml-4">
                          {vuln.type === 'Missing Evidence' && vuln.affectedControls && vuln.affectedControls.length > 0 && (
                            <button
                              onClick={() => {
                                // Extract control name from description
                                const controlMatch = vuln.description.match(/"([^"]+)"/);
                                const controlName = controlMatch ? controlMatch[1] : 'Control';
                                const controlId = vuln.affectedControls[0];
                                // Store control ID for navigation
                                sessionStorage.setItem('navigateToControl', controlId);
                                sessionStorage.setItem('navigateToControlName', controlName);
                                // Navigate to frameworks page
                                if (onNavigate) {
                                  onNavigate('frameworks');
                                } else {
                                  window.location.hash = '#frameworks';
                                }
                              }}
                              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                            >
                              Upload Evidence: {vuln.description.match(/"([^"]+)"/)?.[1] || 'Control'}
                            </button>
                          )}
                          {vuln.type === 'Missing Policy' && (
                            <button
                              onClick={() => {
                                // Extract policy type from description
                                const policyType = vuln.description.replace('Missing ', '').replace(' policy', '');
                                // Navigate to Policy Generator with preselected type
                                sessionStorage.setItem('preselectedPolicyType', policyType);
                                if (onNavigate) {
                                  onNavigate('ai-policy');
                                } else {
                                  window.location.hash = '#ai-policy';
                                }
                              }}
                              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                            >
                              Generate: {vuln.description.replace('Missing ', '').replace(' policy', '')}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
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
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>([]);
  const [availableFrameworks, setAvailableFrameworks] = useState<string[]>([]);

  const loadInsights = async () => {
    setLoading(true);
    try {
      const data = await api.acos.getSwarmInsights(selectedFrameworks.length > 0 ? selectedFrameworks : undefined);
      setInsights(data || []);
    } catch (error) {
      console.error('Error loading swarm insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFrameworks = async () => {
    try {
      const frameworks = await api.frameworks.list();
      setAvailableFrameworks(frameworks.map((f: any) => f.name));
    } catch (error) {
      console.error('Error loading frameworks:', error);
    }
  };

  useEffect(() => {
    loadInsights();
    loadFrameworks();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadInsights();
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedFrameworks]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Federated Swarm Insights</h2>
        <button
          onClick={loadInsights}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Framework Filter */}
      {availableFrameworks.length > 0 && (
        <div className="mb-4 bg-white p-4 rounded-lg shadow border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Frameworks (optional)
          </label>
          <div className="flex flex-wrap gap-2">
            {availableFrameworks.map((framework) => (
              <label key={framework} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedFrameworks.includes(framework)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedFrameworks([...selectedFrameworks, framework]);
                    } else {
                      setSelectedFrameworks(selectedFrameworks.filter(f => f !== framework));
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{framework}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Stats Summary */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <p className="text-sm text-gray-600">Total Insights</p>
            <p className="text-2xl font-bold">{insights.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <p className="text-sm text-gray-600">Avg Confidence</p>
            <p className="text-2xl font-bold">
              {Math.round((insights.reduce((sum, i) => sum + (i.confidence || 0), 0) / insights.length) * 100)}%
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <p className="text-sm text-gray-600">Total Sources</p>
            <p className="text-2xl font-bold">
              {insights.reduce((sum, i) => sum + (i.sourceCount || 0), 0)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <p className="text-sm text-gray-600">Last Updated</p>
            <p className="text-sm font-semibold">{new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      )}
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

  const [loading, setLoading] = useState(false);

  const loadDevices = async () => {
    setLoading(true);
    try {
      const data = await api.acos.getDevices();
      setDevices(data || []);
    } catch (error) {
      console.error('Error loading devices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const handleRegisterDevice = async () => {
    if (!deviceForm.deviceId || !deviceForm.deviceType || !deviceForm.location) {
      alert('Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      await api.acos.registerDevice(deviceForm);
      setShowRegister(false);
      setDeviceForm({ deviceId: '', deviceType: '', location: '', mqttTopic: '' });
      await loadDevices(); // Reload devices
      alert('Device registered successfully');
    } catch (error: any) {
      console.error('Error registering device:', error);
      alert(`Failed to register device: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
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

const NeuroSymbolicTab: React.FC = () => {
  const [query, setQuery] = useState('');
  const [reasoningResult, setReasoningResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [reasoningHistory, setReasoningHistory] = useState<any[]>([]);
  const [activeView, setActiveView] = useState<'reasoning' | 'causal' | 'rules' | 'history'>('reasoning');
  const [violationData, setViolationData] = useState({
    controlId: '',
    frameworkId: '',
    violationType: '',
  });
  const [causalResult, setCausalResult] = useState<any>(null);
  const [patterns, setPatterns] = useState([{ condition: '', outcome: '', frequency: 0 }]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const history = await api.acos.getReasoningHistory(20);
      setReasoningHistory(history.history || []);
    } catch (error) {
      console.error('Error loading reasoning history:', error);
    }
  };

  const handleHybridReasoning = async () => {
    if (!query.trim()) {
      alert('Please enter a query');
      return;
    }
    setLoading(true);
    try {
      const result = await api.acos.performHybridReasoning(query, {});
      setReasoningResult(result);
      await loadHistory();
    } catch (error: any) {
      console.error('Error performing hybrid reasoning:', error);
      alert(`Failed to perform reasoning: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCausalReasoning = async () => {
    if (!violationData.controlId || !violationData.frameworkId) {
      alert('Please fill in control ID and framework ID');
      return;
    }
    setLoading(true);
    try {
      const result = await api.acos.performCausalReasoning(violationData);
      setCausalResult(result);
    } catch (error: any) {
      console.error('Error performing causal reasoning:', error);
      alert(`Failed to perform causal reasoning: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInferRules = async () => {
    const validPatterns = patterns.filter(p => p.condition && p.outcome && p.frequency > 0);
    if (validPatterns.length === 0) {
      alert('Please add at least one pattern with condition, outcome, and frequency');
      return;
    }
    setLoading(true);
    try {
      const result = await api.acos.inferRulesFromPatterns(validPatterns);
      alert(`Inferred ${result.inferences?.length || 0} new rules from patterns`);
      await loadHistory();
    } catch (error: any) {
      console.error('Error inferring rules:', error);
      alert(`Failed to infer rules: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs for different views */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'reasoning', label: 'Hybrid Reasoning' },
            { id: 'causal', label: 'Causal Reasoning' },
            { id: 'rules', label: 'Rule Inference' },
            { id: 'history', label: 'History' },
          ].map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeView === view.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {view.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Hybrid Reasoning View */}
      {activeView === 'reasoning' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Hybrid Neural-Symbolic Reasoning</h3>
            <p className="text-sm text-gray-600 mb-4">
              Combine neural network predictions with symbolic rule-based reasoning for explainable AI decisions.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Query</label>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={4}
                  placeholder="e.g., What actions should be taken for a high-risk non-compliant control?"
                />
              </div>
              <button
                onClick={handleHybridReasoning}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center">
                    <Loader2 className="animate-spin mr-2" size={16} />
                    Reasoning...
                  </span>
                ) : (
                  'Perform Hybrid Reasoning'
                )}
              </button>
            </div>

            {reasoningResult && (
              <div className="mt-6 space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">Hybrid Result</h4>
                  <p className="text-blue-800">{reasoningResult.hybridResult?.finalDecision || 'N/A'}</p>
                  <p className="text-sm text-blue-700 mt-2">
                    Confidence: {(reasoningResult.hybridResult?.confidence * 100 || 0).toFixed(0)}%
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold mb-2">Explanation</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {reasoningResult.hybridResult?.explanation || 'No explanation available'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-purple-900 mb-2">Neural Prediction</h4>
                    <p className="text-purple-800 text-sm">{reasoningResult.neuralPrediction?.result || 'N/A'}</p>
                    <p className="text-xs text-purple-700 mt-1">
                      Confidence: {(reasoningResult.neuralPrediction?.confidence * 100 || 0).toFixed(0)}%
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-2">Symbolic Reasoning</h4>
                    <p className="text-green-800 text-sm">{reasoningResult.symbolicReasoning?.conclusion || 'N/A'}</p>
                    <p className="text-xs text-green-700 mt-1">
                      Confidence: {(reasoningResult.symbolicReasoning?.confidence * 100 || 0).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Causal Reasoning View */}
      {activeView === 'causal' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Causal Reasoning for Compliance Violations</h3>
            <p className="text-sm text-gray-600 mb-4">
              Identify root causes and causal chains for compliance violations using neural-symbolic reasoning.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Control ID</label>
                <input
                  type="text"
                  value={violationData.controlId}
                  onChange={(e) => setViolationData({ ...violationData, controlId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="control-id-123"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Framework ID</label>
                <input
                  type="text"
                  value={violationData.frameworkId}
                  onChange={(e) => setViolationData({ ...violationData, frameworkId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="framework-id-456"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Violation Type</label>
                <input
                  type="text"
                  value={violationData.violationType}
                  onChange={(e) => setViolationData({ ...violationData, violationType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Non-Compliant, Missing Evidence, etc."
                />
              </div>
              <button
                onClick={handleCausalReasoning}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center">
                    <Loader2 className="animate-spin mr-2" size={16} />
                    Analyzing...
                  </span>
                ) : (
                  'Analyze Causal Chain'
                )}
              </button>
            </div>

            {causalResult && (
              <div className="mt-6 space-y-4">
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h4 className="font-semibold text-red-900 mb-2">Root Causes</h4>
                  <ul className="list-disc list-inside text-red-800 space-y-1">
                    {causalResult.rootCauses?.map((cause: string, i: number) => (
                      <li key={i}>{cause}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h4 className="font-semibold text-yellow-900 mb-2">Causal Chain</h4>
                  <ul className="list-disc list-inside text-yellow-800 space-y-1">
                    {causalResult.causalChain?.map((step: string, i: number) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-2">Recommendations</h4>
                  <ul className="list-disc list-inside text-green-800 space-y-1">
                    {causalResult.recommendations?.map((rec: string, i: number) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rule Inference View */}
      {activeView === 'rules' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Infer Rules from Patterns</h3>
            <p className="text-sm text-gray-600 mb-4">
              Automatically infer new compliance rules from observed patterns in your data.
            </p>
            <div className="space-y-4">
              {patterns.map((pattern, index) => (
                <div key={index} className="border border-gray-200 p-4 rounded-lg space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                    <input
                      type="text"
                      value={pattern.condition}
                      onChange={(e) => {
                        const newPatterns = [...patterns];
                        newPatterns[index].condition = e.target.value;
                        setPatterns(newPatterns);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="control.status == 'Non-Compliant'"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
                    <input
                      type="text"
                      value={pattern.outcome}
                      onChange={(e) => {
                        const newPatterns = [...patterns];
                        newPatterns[index].outcome = e.target.value;
                        setPatterns(newPatterns);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="create_remediation_plan"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                    <input
                      type="number"
                      value={pattern.frequency}
                      onChange={(e) => {
                        const newPatterns = [...patterns];
                        newPatterns[index].frequency = parseInt(e.target.value) || 0;
                        setPatterns(newPatterns);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="10"
                    />
                  </div>
                </div>
              ))}
              <div className="flex space-x-2">
                <button
                  onClick={() => setPatterns([...patterns, { condition: '', outcome: '', frequency: 0 }])}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  + Add Pattern
                </button>
                <button
                  onClick={handleInferRules}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <Loader2 className="animate-spin mr-2" size={16} />
                      Inferring...
                    </span>
                  ) : (
                    'Infer Rules'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History View */}
      {activeView === 'history' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Reasoning History</h3>
            {reasoningHistory.length === 0 ? (
              <p className="text-gray-500">No reasoning history available</p>
            ) : (
              <div className="space-y-4">
                {reasoningHistory.map((item: any) => (
                  <div key={item.id} className="border border-gray-200 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium">{item.query}</p>
                      <span className="text-xs text-gray-500">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Result: {item.hybridResult?.finalDecision || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Confidence: {(item.hybridResult?.confidence * 100 || 0).toFixed(0)}%
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// VR Collaborations Tab
const VRCollaborationsTab: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    sessionName: '',
    description: '',
    sessionType: 'review' as 'review' | 'training' | 'simulation' | 'audit',
    environment: 'compliance_landscape' as string,
    maxParticipants: 10,
  });

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await api.acos.getActiveVRSessions();
      // Perform health checks in parallel for better performance
      if (data && data.length > 0) {
        const healthChecks = await Promise.allSettled(
          data.map(session => api.acos.checkVRSessionHealth(session.id))
        );
        
        const validSessions = data.filter((session, index) => {
          const checkResult = healthChecks[index];
          if (checkResult.status === 'fulfilled' && checkResult.value.valid) {
            return true;
          }
          // Log failed health checks
          if (checkResult.status === 'rejected') {
            console.warn(`Session ${session.id} health check failed:`, checkResult.reason);
          } else if (checkResult.value && !checkResult.value.valid) {
            console.warn(`Session ${session.id} is invalid:`, checkResult.value.reason);
          }
          return false;
        });
        
        setSessions(validSessions);
      } else {
        setSessions([]);
      }
    } catch (error) {
      console.error('Error loading VR sessions:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.acos.createVRSession({
        sessionName: formData.sessionName,
        description: formData.description,
        sessionType: formData.sessionType,
        environment: formData.environment,
        maxParticipants: formData.maxParticipants,
      });
      setShowCreateModal(false);
      setFormData({
        sessionName: '',
        description: '',
        sessionType: 'review',
        environment: 'compliance_landscape',
        maxParticipants: 10,
      });
      loadSessions();
    } catch (error) {
      console.error('Error creating VR session:', error);
      alert('Failed to create VR session. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold mb-2 flex items-center">
              <Video className="mr-2" size={24} />
              VR Collaborative Review Sessions
            </h2>
            <p className="text-gray-600">
              3D compliance visualization, multi-user VR sessions, real-time collaboration, annotations, and training scenarios.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus size={18} />
            <span>Create Session</span>
          </button>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-blue-600" size={24} />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Video className="mx-auto mb-4 text-gray-400" size={48} />
            <p>No VR sessions available</p>
            <p className="text-sm mt-2">Create a new VR session to start collaborative compliance reviews</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{session.sessionName}</h3>
                    <p className="text-sm text-gray-600 mt-1">{session.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span>Type: {session.sessionType}</span>
                      <span>Status: {session.status}</span>
                      <span>Participants: {session.participants?.length || 0}</span>
                    </div>
                  </div>
                  <button 
                    onClick={async () => {
                      try {
                        await api.acos.joinVRSession(session.id);
                        alert('Joining VR session...');
                        // Refresh session list to get updated participant count
                        loadSessions();
                      } catch (err: any) {
                        console.error('Error joining session:', err);
                        const errorMessage = err?.message || err?.error || err?.toString() || 'Failed to join session';
                        alert(errorMessage);
                        // If session not found, refresh the list
                        if (errorMessage.includes('not found') || errorMessage.includes('ended') || errorMessage.includes('inactive')) {
                          loadSessions();
                        }
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Join Session
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create VR Session Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Create VR Session</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Name *
                </label>
                <input
                  type="text"
                  value={formData.sessionName}
                  onChange={(e) => setFormData({ ...formData, sessionName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Type *
                </label>
                <select
                  value={formData.sessionType}
                  onChange={(e) => setFormData({ ...formData, sessionType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="review">Review</option>
                  <option value="training">Training</option>
                  <option value="simulation">Simulation</option>
                  <option value="audit">Audit</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Environment Template
                </label>
                <select
                  value={formData.environment}
                  onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="compliance_landscape">Compliance Landscape</option>
                  <option value="control_network">Control Network</option>
                  <option value="risk_matrix">Risk Matrix</option>
                  <option value="framework_cluster">Framework Cluster</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Participants
                </label>
                <input
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) || 10 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min={1}
                  max={50}
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// JIT Access Tab
const JITAccessTab: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [sessions, setSessions] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [allRequests, setAllRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPending, setLoadingPending] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showDenyModal, setShowDenyModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [denyReason, setDenyReason] = useState('');
  const [activeTab, setActiveTab] = useState<'my-requests' | 'pending-approvals' | 'all-requests'>('my-requests');
  const [requesting, setRequesting] = useState(false);
  const [formData, setFormData] = useState({
    privilege: 'admin' as 'admin' | 'compliance_admin' | 'security_admin' | 'super_admin',
    reason: 'emergency_fix' as 'incident_response' | 'compliance_audit' | 'security_investigation' | 'emergency_fix' | 'scheduled_maintenance' | 'data_access_request',
    justification: '',
    duration: 30,
  });

  useEffect(() => {
    loadSessions();
    if (isAdmin) {
      loadPendingRequests();
      loadAllRequests();
    }
  }, [isAdmin]);

  // Auto-refresh pending requests every 30 seconds for admins
  useEffect(() => {
    if (!isAdmin || activeTab !== 'pending-approvals') return;

    const interval = setInterval(() => {
      loadPendingRequests();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [isAdmin, activeTab]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await api.acos.getJITAccessSessions();
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading JIT access sessions:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingRequests = async () => {
    setLoadingPending(true);
    try {
      const data = await api.acos.getPendingJITAccessRequests();
      setPendingRequests(data || []);
    } catch (error) {
      console.error('Error loading pending requests:', error);
      setPendingRequests([]);
    } finally {
      setLoadingPending(false);
    }
  };

  const loadAllRequests = async () => {
    try {
      const data = await api.acos.getAllJITAccessRequests();
      setAllRequests(data || []);
    } catch (error) {
      console.error('Error loading all requests:', error);
      setAllRequests([]);
    }
  };

  const handleApprove = async (requestId: string) => {
    if (!confirm('Are you sure you want to approve this access request?')) {
      return;
    }

    try {
      await api.acos.approveJITAccessRequest(requestId);
      alert('Access request approved successfully!');
      await loadPendingRequests();
      await loadAllRequests();
      await loadSessions();
    } catch (error: any) {
      console.error('Error approving request:', error);
      alert(error.message || 'Failed to approve request');
    }
  };

  const handleDeny = async () => {
    if (!selectedRequest) return;
    
    if (!denyReason.trim()) {
      alert('Please provide a reason for denial');
      return;
    }

    try {
      await api.acos.denyJITAccessRequest(selectedRequest.id, denyReason);
      alert('Access request denied successfully!');
      setShowDenyModal(false);
      setSelectedRequest(null);
      setDenyReason('');
      await loadPendingRequests();
      await loadAllRequests();
      await loadSessions();
    } catch (error: any) {
      console.error('Error denying request:', error);
      alert(error.message || 'Failed to deny request');
    }
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequesting(true);
    try {
      const response = await api.acos.requestJITAccess({
        privilege: formData.privilege,
        reason: formData.reason,
        justification: formData.justification,
        duration: formData.duration,
      });
      
      // Immediately add the new request/session to the list
      if (response) {
        setSessions((prev) => [response, ...prev]);
      }
      
      setShowRequestModal(false);
      setFormData({
        privilege: 'admin',
        reason: 'emergency_fix',
        justification: '',
        duration: 30,
      });
      
      // Reload sessions after a short delay to ensure backend has processed it
      setTimeout(() => {
        loadSessions();
      }, 500);
      
      alert('JIT access requested successfully!');
    } catch (error: any) {
      console.error('Error requesting JIT access:', error);
      alert(error.message || 'Failed to request JIT access. Please try again.');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold mb-2 flex items-center">
              <Timer className="mr-2" size={24} />
              Just-In-Time Admin Access
            </h2>
            <p className="text-gray-600">
              Grant temporary, time-bound privileged access that automatically expires after the task is done. Eliminate dormant admin accounts.
            </p>
          </div>
          <button
            onClick={() => setShowRequestModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus size={18} />
            <span>Request Access</span>
          </button>
        </div>

        {/* Admin Tabs */}
        {isAdmin && (
          <div className="flex space-x-2 mb-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('my-requests')}
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === 'my-requests'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              My Requests
            </button>
            <button
              onClick={() => {
                setActiveTab('pending-approvals');
                loadPendingRequests();
              }}
              className={`px-4 py-2 font-medium text-sm relative ${
                activeTab === 'pending-approvals'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pending Approvals
              {pendingRequests.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {pendingRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab('all-requests');
                loadAllRequests();
              }}
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === 'all-requests'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Requests
            </button>
          </div>
        )}

        {/* Pending Approvals View (Admin Only) */}
        {isAdmin && activeTab === 'pending-approvals' && (
          <div>
            {loadingPending ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-blue-600" size={24} />
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="mx-auto mb-4 text-gray-400" size={48} />
                <p>No pending access requests</p>
                <p className="text-sm mt-2">All requests have been processed</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request: any) => (
                  <div key={request.id} className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium capitalize">{request.requestedPrivilege?.replace(/_/g, ' ') || 'Admin Access'}</h3>
                          <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs font-medium rounded">
                            Pending Approval
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><strong>Requested by:</strong> {request.user?.name || request.user?.email || 'Unknown User'}</p>
                          <p><strong>Reason:</strong> <span className="capitalize">{request.reason?.replace(/_/g, ' ') || 'N/A'}</span></p>
                          <p><strong>Duration:</strong> {request.duration} minutes</p>
                          <p><strong>Justification:</strong> {request.justification || 'N/A'}</p>
                          <p><strong>Requested:</strong> {new Date(request.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleApprove(request.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                        >
                          <CheckCircle size={18} />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowDenyModal(true);
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
                        >
                          <X size={18} />
                          <span>Deny</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* All Requests View (Admin Only) */}
        {isAdmin && activeTab === 'all-requests' && (
          <div>
            {allRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <History className="mx-auto mb-4 text-gray-400" size={48} />
                <p>No access requests found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {allRequests.map((request: any) => {
                  const status = request.status || 'pending';
                  return (
                    <div key={request.id} className={`border rounded-lg p-4 ${
                      status === 'approved' ? 'border-green-200 bg-green-50' :
                      status === 'denied' ? 'border-red-200 bg-red-50' :
                      status === 'pending' ? 'border-yellow-200 bg-yellow-50' :
                      'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-medium capitalize">{request.requestedPrivilege?.replace(/_/g, ' ') || 'Admin Access'}</h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              status === 'approved' ? 'bg-green-200 text-green-800' :
                              status === 'denied' ? 'bg-red-200 text-red-800' :
                              status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                              'bg-gray-200 text-gray-800'
                            }`}>
                              {status === 'approved' ? 'Approved' :
                               status === 'denied' ? 'Denied' :
                               status === 'pending' ? 'Pending' :
                               status === 'expired' ? 'Expired' :
                               status === 'revoked' ? 'Revoked' : status}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>Requested by:</strong> {request.user?.name || request.user?.email || 'Unknown User'}</p>
                            <p><strong>Reason:</strong> <span className="capitalize">{request.reason?.replace(/_/g, ' ') || 'N/A'}</span></p>
                            <p><strong>Duration:</strong> {request.duration} minutes</p>
                            {request.approver && (
                              <p><strong>Processed by:</strong> {request.approver?.name || request.approver?.email || 'Unknown'}</p>
                            )}
                            {request.approvedAt && (
                              <p><strong>Processed at:</strong> {new Date(request.approvedAt).toLocaleString()}</p>
                            )}
                            {request.expiresAt && (
                              <p><strong>Expires:</strong> {new Date(request.expiresAt).toLocaleString()}</p>
                            )}
                            <p><strong>Requested:</strong> {new Date(request.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                        {status === 'pending' && (
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleApprove(request.id)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowDenyModal(true);
                              }}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                              Deny
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* My Requests View (Default) */}
        {(activeTab === 'my-requests' || !isAdmin) && (
          <>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-blue-600" size={24} />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Timer className="mx-auto mb-4 text-gray-400" size={48} />
            <p>No active JIT access sessions</p>
            <p className="text-sm mt-2">Request temporary admin access when needed</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session: any) => {
              // Handle both JITSession and JITAccessRequest types
              const isSession = 'startTime' in session;
              const isRequest = 'requestedPrivilege' in session;
              
              const privilege = isSession ? session.privilege : (isRequest ? session.requestedPrivilege : 'admin');
              const reason = isRequest ? session.reason : (session.reason || 'N/A');
              const status = isSession ? (session.active ? 'active' : 'expired') : (session.status || 'pending');
              const expiresAt = isSession ? session.endTime : (isRequest ? session.expiresAt : null);
              const sessionId = isSession ? session.id : (isRequest ? session.id : session.id);
              
              return (
                <div key={sessionId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium capitalize">{privilege?.replace(/_/g, ' ') || 'Admin Access'}</h3>
                      <p className="text-sm text-gray-600 mt-1 capitalize">{reason?.replace(/_/g, ' ') || 'N/A'}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          status === 'active' || status === 'approved' 
                            ? 'bg-green-100 text-green-800' 
                            : status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : status === 'revoked'
                            ? 'bg-red-100 text-red-800'
                            : status === 'expired'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {status === 'active' ? 'Active' : status === 'approved' ? 'Approved' : status === 'pending' ? 'Pending' : status === 'revoked' ? 'Cancelled' : status === 'expired' ? 'Expired' : 'Unknown'}
                        </span>
                        {expiresAt && (
                          <span>Expires: {new Date(expiresAt).toLocaleString()}</span>
                        )}
                        {isSession && session.actionsPerformed && session.actionsPerformed.length > 0 && (
                          <span>Actions: {session.actionsPerformed.length}</span>
                        )}
                        {isRequest && session.justification && (
                          <span className="text-xs text-gray-400 truncate max-w-xs" title={session.justification}>
                            {session.justification.substring(0, 50)}...
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {isRequest && status === 'pending' && (
                        <button
                          onClick={async () => {
                            if (confirm('Are you sure you want to cancel this access request?')) {
                              try {
                                await api.acos.cancelJITAccessRequest(sessionId);
                                // Optimistically update the UI
                                setSessions(prev => prev.map(s => {
                                  if ((s.id === sessionId || (s as any).requestId === sessionId)) {
                                    return { ...s, status: 'revoked' };
                                  }
                                  return s;
                                }));
                                // Reload to ensure consistency
                                await loadSessions();
                              } catch (err: any) {
                                console.error('Error canceling request:', err);
                                alert(err.message || 'Failed to cancel request');
                              }
                            }
                          }}
                          className="px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100"
                        >
                          Cancel
                        </button>
                      )}
                      {isSession && status === 'active' && (
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to revoke this JIT access session?')) {
                              api.acos.revokeJITSession(sessionId, 'User initiated revocation')
                                .then(() => {
                                  loadSessions();
                                })
                                .catch((err) => {
                                  console.error('Error revoking session:', err);
                                  alert('Failed to revoke session');
                                });
                            }
                          }}
                          className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                        >
                          Revoke
                        </button>
                      )}
                      <button
                        onClick={() => {
                          // Show details modal
                          const details = isRequest 
                            ? `Request ID: ${sessionId}\nPrivilege: ${privilege}\nReason: ${reason}\nStatus: ${status}\nJustification: ${session.justification || 'N/A'}\nCreated: ${new Date(session.createdAt || Date.now()).toLocaleString()}\n${expiresAt ? `Expires: ${new Date(expiresAt).toLocaleString()}` : ''}`
                            : `Session ID: ${sessionId}\nPrivilege: ${privilege}\nStatus: ${status}\n${expiresAt ? `Expires: ${new Date(expiresAt).toLocaleString()}` : ''}`;
                          alert(details);
                        }}
                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
          </>
        )}
      </div>

      {/* Request JIT Access Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Request JIT Access</h3>
              <button
                onClick={() => setShowRequestModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleRequestAccess} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Privilege Level *
                </label>
                <select
                  value={formData.privilege}
                  onChange={(e) => setFormData({ ...formData, privilege: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="admin">Admin</option>
                  <option value="compliance_admin">Compliance Admin</option>
                  <option value="security_admin">Security Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason *
                </label>
                <select
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="incident_response">Incident Response</option>
                  <option value="compliance_audit">Compliance Audit</option>
                  <option value="security_investigation">Security Investigation</option>
                  <option value="emergency_fix">Emergency Fix</option>
                  <option value="scheduled_maintenance">Scheduled Maintenance</option>
                  <option value="data_access_request">Data Access Request</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Justification *
                </label>
                <textarea
                  value={formData.justification}
                  onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Explain why you need temporary admin access..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 30 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min={5}
                  max={480}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Maximum duration depends on privilege level</p>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={requesting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {requesting ? 'Requesting...' : 'Request Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deny Request Modal */}
      {showDenyModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Deny Access Request</h3>
              <button
                onClick={() => {
                  setShowDenyModal(false);
                  setSelectedRequest(null);
                  setDenyReason('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Requested by:</strong> {selectedRequest.user?.name || selectedRequest.user?.email || 'Unknown User'}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Privilege:</strong> <span className="capitalize">{selectedRequest.requestedPrivilege?.replace(/_/g, ' ')}</span>
              </p>
              <p className="text-sm text-gray-600">
                <strong>Justification:</strong> {selectedRequest.justification || 'N/A'}
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Denial *
              </label>
              <textarea
                value={denyReason}
                onChange={(e) => setDenyReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                rows={4}
                placeholder="Please provide a reason for denying this access request..."
                required
              />
            </div>
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowDenyModal(false);
                  setSelectedRequest(null);
                  setDenyReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeny}
                disabled={!denyReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Deny Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const HomomorphicAITab: React.FC = () => {
  const [showFullView, setShowFullView] = useState(false);

  if (showFullView) {
    // Use the full HomomorphicAI component
    return <HomomorphicAI onBack={() => setShowFullView(false)} />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center">
              <Lock className="mr-2 text-blue-500" size={24} />
              Homomorphic AI
            </h2>
            <p className="text-gray-600 mt-1">
              Privacy-preserving machine learning on encrypted data
            </p>
          </div>
          <button
            onClick={() => setShowFullView(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Open Full Interface
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Key Generation</h3>
            <p className="text-sm text-gray-600">
              Generate encryption keys for BFV (integer) or CKKS (floating point) schemes
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Encryption/Decryption</h3>
            <p className="text-sm text-gray-600">
              Encrypt and decrypt data while preserving privacy
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">ML Operations</h3>
            <p className="text-sm text-gray-600">
              Perform linear regression, statistics, and neural network inference on encrypted data
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Homomorphic encryption allows you to perform computations on encrypted data without ever decrypting it. 
            This ensures complete privacy while enabling AI/ML operations.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ACOSDashboard;


