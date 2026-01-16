import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  Brain, Plus, TrendingUp, AlertTriangle, CheckCircle, 
  Clock, BarChart3, Shield, Activity, ArrowRight 
} from 'lucide-react';

interface DashboardStats {
  totalSystems: number;
  byStatus: Record<string, number>;
  byLifecycleStage: Record<string, number>;
  byRiskLevel: Record<string, number>;
  averageTrustworthinessScore: number;
}

interface AIRMFDashboardProps {
  onNavigate: (view: string, systemId?: string) => void;
}

export const AIRMFDashboard: React.FC<AIRMFDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentSystems, setRecentSystems] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
    
    // Check if there's a tab to navigate to from chatbot
    const checkTab = () => {
      const aiRmfTab = sessionStorage.getItem('aiRmfActiveTab');
      if (aiRmfTab && ['dashboard', 'systems', 'create', 'assessments'].includes(aiRmfTab)) {
        if (aiRmfTab === 'systems') {
          onNavigate('ai-rmf-systems');
        } else if (aiRmfTab === 'create') {
          onNavigate('ai-rmf-create');
        } else if (aiRmfTab === 'assessments') {
          onNavigate('ai-rmf-assessments');
        }
        sessionStorage.removeItem('aiRmfActiveTab');
      }
    };
    
    // Check immediately
    checkTab();
    
    // Also check after a short delay
    const timeoutId = setTimeout(checkTab, 100);
    
    // Listen for custom event from chatbot
    const handleTabChange = (event: CustomEvent) => {
      const tab = event.detail?.tab;
      if (tab && ['dashboard', 'systems', 'create', 'assessments'].includes(tab)) {
        if (tab === 'systems') {
          onNavigate('ai-rmf-systems');
        } else if (tab === 'create') {
          onNavigate('ai-rmf-create');
        } else if (tab === 'assessments') {
          onNavigate('ai-rmf-assessments');
        }
        sessionStorage.removeItem('aiRmfActiveTab');
      }
    };
    
    window.addEventListener('aiRmfTabChange', handleTabChange as EventListener);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('aiRmfTabChange', handleTabChange as EventListener);
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardData, systems] = await Promise.all([
        api.aiRmf.getDashboardData(),
        api.aiRmf.getAISystems()
      ]);
      setStats(dashboardData);
      setRecentSystems(systems.slice(0, 5));
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="text-brand-600" size={28} />
            NIST AI RMF Dashboard
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage AI systems and assess risk using the NIST AI Risk Management Framework
          </p>
        </div>
        <button
          onClick={() => onNavigate('ai-rmf-create')}
          className="flex items-center space-x-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>New AI System</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total AI Systems</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.totalSystems || 0}</p>
            </div>
            <Brain className="text-brand-600" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Trustworthiness</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats?.averageTrustworthinessScore || 0}%
              </p>
            </div>
            <Shield className="text-green-600" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">In Development</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats?.byStatus?.['In_Development'] || 0}
              </p>
            </div>
            <Clock className="text-yellow-600" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Deployed</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats?.byStatus?.['Deployed'] || 0}
              </p>
            </div>
            <CheckCircle className="text-green-600" size={32} />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => onNavigate('ai-rmf-systems')}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-brand-300 hover:bg-brand-50 transition-colors text-left"
          >
            <BarChart3 className="text-brand-600" size={24} />
            <div>
              <p className="font-medium text-gray-900">View All Systems</p>
              <p className="text-sm text-gray-500">Manage all AI systems</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('ai-rmf-create')}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-brand-300 hover:bg-brand-50 transition-colors text-left"
          >
            <Plus className="text-brand-600" size={24} />
            <div>
              <p className="font-medium text-gray-900">Create AI System</p>
              <p className="text-sm text-gray-500">Add a new AI system</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('ai-rmf-assessments')}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-brand-300 hover:bg-brand-50 transition-colors text-left"
          >
            <Activity className="text-brand-600" size={24} />
            <div>
              <p className="font-medium text-gray-900">Assessments</p>
              <p className="text-sm text-gray-500">View assessments</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Systems */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">Recent AI Systems</h3>
          <button
            onClick={() => onNavigate('ai-rmf-systems')}
            className="text-sm text-brand-600 hover:text-brand-800 font-medium flex items-center"
          >
            View All <ArrowRight size={16} className="ml-1" />
          </button>
        </div>
        {recentSystems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Brain className="mx-auto mb-2 text-gray-400" size={48} />
            <p>No AI systems yet</p>
            <button
              onClick={() => onNavigate('ai-rmf-create')}
              className="mt-4 text-brand-600 hover:text-brand-800 font-medium"
            >
              Create your first AI system
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentSystems.map((system) => (
              <div
                key={system.id}
                onClick={() => onNavigate('ai-rmf-details', system.id)}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-brand-300 hover:bg-brand-50 transition-colors cursor-pointer"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{system.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">{system.systemType}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {system.overallTrustworthinessScore || 'N/A'}%
                    </p>
                    <p className="text-xs text-gray-500">Trust Score</p>
                  </div>
                  <ArrowRight className="text-gray-400" size={20} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Breakdown */}
      {(stats?.byStatus && Object.keys(stats.byStatus).length > 0) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Status Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(stats.byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{status.replace(/_/g, ' ')}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-brand-600 h-2 rounded-full"
                      style={{ width: `${(count / (stats.totalSystems || 1)) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

