import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { 
  Brain, Plus, Search, Filter, ArrowRight, Shield, 
  AlertTriangle, CheckCircle, Clock, Trash2 
} from 'lucide-react';
import { toast } from 'sonner';

interface AISystemListProps {
  onSelectSystem: (systemId: string) => void;
  onCreateNew: () => void;
}

export const AISystemList: React.FC<AISystemListProps> = ({ onSelectSystem, onCreateNew }) => {
  const { user } = useAuth();
  const { t } = useI18n();
  const [systems, setSystems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [lifecycleFilter, setLifecycleFilter] = useState<string>('all');
  const [deletingSystem, setDeletingSystem] = useState<string | null>(null);

  useEffect(() => {
    loadSystems();
    
    // Listen for trustworthiness updates
    const handleTrustworthinessUpdate = () => {
      loadSystems();
    };
    
    window.addEventListener('aiSystemTrustworthinessUpdated', handleTrustworthinessUpdate);
    
    return () => {
      window.removeEventListener('aiSystemTrustworthinessUpdated', handleTrustworthinessUpdate);
    };
  }, [statusFilter, lifecycleFilter]);

  const loadSystems = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (lifecycleFilter !== 'all') filters.lifecycleStage = lifecycleFilter;
      const data = await api.aiRmf.getAISystems(filters);
      setSystems(data as any[]);
    } catch (error: any) {
      console.error('Failed to load AI systems:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (systemId: string, systemName: string) => {
    if (!confirm(`Are you sure you want to delete "${systemName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingSystem(systemId);
      await api.aiRmf.deleteAISystem(systemId);
      loadSystems();
    } catch (error: any) {
      console.error('Failed to delete system:', error);
      toast.error(`Failed to delete system: ${error.message || 'Unknown error'}`);
    } finally {
      setDeletingSystem(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Deployed':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'In_Development':
        return <Clock className="text-yellow-500" size={20} />;
      case 'Under_Review':
        return <AlertTriangle className="text-orange-500" size={20} />;
      default:
        return <Clock className="text-gray-400" size={20} />;
    }
  };

  const getRiskLevelColor = (riskLevel: string | null) => {
    switch (riskLevel) {
      case 'Critical':
        return 'bg-red-100 text-red-800';
      case 'High':
        return 'bg-orange-100 text-orange-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredSystems = systems.filter(system =>
    system.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    system.systemType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    system.deploymentContext?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            AI Systems
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage and assess your AI systems using NIST AI RMF
          </p>
        </div>
        <button
          onClick={onCreateNew}
          className="flex items-center space-x-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>New AI System</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={`${t('common.search')}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Statuses</option>
            <option value="In_Development">In Development</option>
            <option value="Deployed">Deployed</option>
            <option value="Under_Review">Under Review</option>
            <option value="Retired">Retired</option>
          </select>
          <select
            value={lifecycleFilter}
            onChange={(e) => setLifecycleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Lifecycle Stages</option>
            <option value="Plan_and_Design">Plan and Design</option>
            <option value="Collect_and_Process">Collect and Process</option>
            <option value="Build_and_Validate">Build and Validate</option>
            <option value="Deploy_and_Operate">Deploy and Operate</option>
            <option value="Monitor_and_Maintain">Monitor and Maintain</option>
          </select>
        </div>
      </div>

      {/* Systems Grid */}
      {filteredSystems.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Brain className="mx-auto mb-4 text-gray-400" size={64} />
          <h3 className="text-lg font-bold text-gray-900 mb-2">{t('common.noResults')}</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || statusFilter !== 'all' || lifecycleFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by creating your first AI system'}
          </p>
          <button
            onClick={onCreateNew}
            className="bg-brand-600 text-white px-6 py-2 rounded-lg hover:bg-brand-700 transition-colors"
          >
            Create AI System
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSystems.map((system) => (
            <div
              key={system.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(system.status)}
                    <h3 className="text-lg font-bold text-gray-900">{system.name}</h3>
                  </div>
                  {user?.role === 'admin' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(system.id, system.name);
                      }}
                      disabled={deletingSystem === system.id}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                      title={t('common.delete')}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{t('common.type')}</span>
                    <span className="font-medium text-gray-900">{system.systemType}</span>
                  </div>
                  {system.deploymentContext && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Context</span>
                      <span className="font-medium text-gray-900">{system.deploymentContext}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Lifecycle</span>
                    <span className="font-medium text-gray-900">
                      {system.lifecycleStage?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {system.riskLevel && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{t('risks.riskLevel')}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskLevelColor(system.riskLevel)}`}>
                        {system.riskLevel}
                      </span>
                    </div>
                  )}
                </div>

                {system.overallTrustworthinessScore !== null && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Trustworthiness</span>
                      <span className="font-bold text-gray-900">
                        {system.overallTrustworthinessScore}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          system.overallTrustworthinessScore >= 80
                            ? 'bg-green-500'
                            : system.overallTrustworthinessScore >= 60
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${system.overallTrustworthinessScore}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => onSelectSystem(system.id)}
                  className="w-full flex items-center justify-center space-x-2 bg-brand-50 text-brand-600 hover:bg-brand-100 px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  <span>{t('common.details')}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

