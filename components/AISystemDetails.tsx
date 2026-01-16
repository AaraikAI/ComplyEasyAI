import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, Brain, Shield, Activity, FileText, Users, 
  CheckCircle, Clock, AlertTriangle, Edit, Save, X, Plus,
  TrendingUp, BarChart3, Target, AlertCircle, Trash2
} from 'lucide-react';
import { CreateRiskActivityModal, CreateActorModal } from './AISystemDetails_Modals';

interface AISystemDetailsProps {
  systemId: string;
  onBack: () => void;
}

export const AISystemDetails: React.FC<AISystemDetailsProps> = ({ systemId, onBack }) => {
  const { user } = useAuth();
  const [system, setSystem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'functions' | 'trustworthiness' | 'lifecycle' | 'assessments' | 'risks' | 'actors'>('overview');
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<any>(null);

  useEffect(() => {
    loadSystemDetails();
  }, [systemId]);

  const loadSystemDetails = async () => {
    try {
      setLoading(true);
      const data = await api.aiRmf.getAISystemById(systemId);
      setSystem(data);
    } catch (error: any) {
      console.error('Failed to load AI system:', error);
      alert(`Failed to load AI system: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (field: string, value: any) => {
    try {
      await api.aiRmf.updateAISystem(systemId, { [field]: value });
      setSystem({ ...system, [field]: value });
      setEditingField(null);
    } catch (error: any) {
      console.error('Failed to update:', error);
      alert(`Failed to update: ${error.message || 'Unknown error'}`);
    }
  };

  const handleSubcategoryUpdate = async (subcategoryId: string, updates: any) => {
    try {
      await api.aiRmf.updateSubcategory(subcategoryId, updates);
      loadSystemDetails();
    } catch (error: any) {
      console.error('Failed to update subcategory:', error);
      alert(`Failed to update subcategory: ${error.message || 'Unknown error'}`);
    }
  };

  const handleTrustworthinessUpdate = async (characteristic: string, updates: any) => {
    try {
      await api.aiRmf.updateTrustworthinessCharacteristic(systemId, characteristic, updates);
      loadSystemDetails();
    } catch (error: any) {
      console.error('Failed to update trustworthiness:', error);
      alert(`Failed to update trustworthiness: ${error.message || 'Unknown error'}`);
    }
  };

  const calculateTrustworthinessScore = async () => {
    try {
      const result = await api.aiRmf.calculateTrustworthinessScore(systemId);
      loadSystemDetails();
    } catch (error: any) {
      console.error('Failed to calculate score:', error);
      alert(`Failed to calculate score: ${error.message || 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!system) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto mb-4 text-gray-400" size={48} />
        <p className="text-gray-500">AI System not found</p>
        <button
          onClick={onBack}
          className="mt-4 text-brand-600 hover:text-brand-800 font-medium"
        >
          Go Back
        </button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; icon: any }> = {
      'Deployed': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'In_Development': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'Under_Review': { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
      'Retired': { color: 'bg-gray-100 text-gray-800', icon: X },
    };
    const badge = badges[status] || badges['In_Development'];
    const Icon = badge.icon;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${badge.color}`}>
        <Icon size={14} />
        <span>{status.replace(/_/g, ' ')}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <Brain className="text-brand-600" size={28} />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{system.name}</h2>
              <p className="text-sm text-gray-500">{system.systemType}</p>
            </div>
            {getStatusBadge(system.status)}
          </div>
        </div>
        {system.overallTrustworthinessScore !== null && (
          <div className="text-right">
            <div className="text-sm text-gray-500">Trustworthiness Score</div>
            <div className="text-2xl font-bold text-gray-900">
              {system.overallTrustworthinessScore}%
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'functions', label: 'Core Functions', icon: Target },
            { id: 'trustworthiness', label: 'Trustworthiness', icon: Shield },
            { id: 'lifecycle', label: 'Lifecycle', icon: Activity },
            { id: 'assessments', label: 'Assessments', icon: FileText },
            { id: 'risks', label: 'Risk Activities', icon: AlertCircle },
            { id: 'actors', label: 'Actors', icon: Users },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center space-x-2 pb-4 px-1 border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={18} />
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {activeTab === 'overview' && (
          <OverviewTab 
            system={system} 
            onUpdate={handleUpdate}
            editingField={editingField}
            setEditingField={setEditingField}
            editValue={editValue}
            setEditValue={setEditValue}
          />
        )}
        {activeTab === 'functions' && (
          <CoreFunctionsTab 
            system={system}
            onSubcategoryUpdate={handleSubcategoryUpdate}
          />
        )}
        {activeTab === 'trustworthiness' && (
          <TrustworthinessTab 
            system={system}
            onUpdate={handleTrustworthinessUpdate}
            onCalculateScore={calculateTrustworthinessScore}
          />
        )}
        {activeTab === 'lifecycle' && (
          <LifecycleTab systemId={systemId} system={system} onRefresh={loadSystemDetails} />
        )}
        {activeTab === 'assessments' && (
          <AssessmentsTab systemId={systemId} system={system} onRefresh={loadSystemDetails} />
        )}
        {activeTab === 'risks' && (
          <RiskActivitiesTab systemId={systemId} system={system} onRefresh={loadSystemDetails} />
        )}
        {activeTab === 'actors' && (
          <ActorsTab systemId={systemId} system={system} onRefresh={loadSystemDetails} />
        )}
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<any> = ({ system, onUpdate, editingField, setEditingField, editValue, setEditValue }) => {
  const fields = [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'systemType', label: 'System Type', type: 'text' },
    { key: 'useCase', label: 'Use Case', type: 'textarea' },
    { key: 'deploymentContext', label: 'Deployment Context', type: 'text' },
    { key: 'lifecycleStage', label: 'Lifecycle Stage', type: 'select', options: [
      'Plan_and_Design', 'Collect_and_Process', 'Build_and_Validate', 
      'Deploy_and_Operate', 'Monitor_and_Maintain'
    ]},
    { key: 'autonomyLevel', label: 'Autonomy Level', type: 'select', options: [
      'Fully_Autonomous', 'Human_in_Loop', 'Human_Override', 'Fully_Manual'
    ]},
    { key: 'status', label: 'Status', type: 'select', options: [
      'In_Development', 'Deployed', 'Under_Review', 'Retired'
    ]},
    { key: 'riskLevel', label: 'Risk Level', type: 'select', options: [
      'Critical', 'High', 'Medium', 'Low'
    ]},
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-gray-900">System Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
            </label>
            {editingField === field.key ? (
              <div className="flex items-center space-x-2">
                {field.type === 'textarea' ? (
                  <textarea
                    value={editValue || system[field.key] || ''}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    rows={3}
                  />
                ) : field.type === 'select' ? (
                  <select
                    value={editValue || system[field.key] || ''}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Select...</option>
                    {field.options?.map((opt: string) => (
                      <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    value={editValue || system[field.key] || ''}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                )}
                <button
                  onClick={() => {
                    onUpdate(field.key, editValue);
                    setEditingField(null);
                  }}
                  className="p-2 text-green-600 hover:bg-green-50 rounded"
                >
                  <Save size={18} />
                </button>
                <button
                  onClick={() => {
                    setEditingField(null);
                    setEditValue(null);
                  }}
                  className="p-2 text-gray-600 hover:bg-gray-50 rounded"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-gray-900">
                  {system[field.key] ? system[field.key].toString().replace(/_/g, ' ') : 'Not set'}
                </p>
                <button
                  onClick={() => {
                    setEditingField(field.key);
                    setEditValue(system[field.key]);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <Edit size={16} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Core Functions Tab Component
const CoreFunctionsTab: React.FC<any> = ({ system, onSubcategoryUpdate }) => {
  const [expandedFunction, setExpandedFunction] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const coreFunctions = system.coreFunctions || [];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900">Core Functions</h3>
      <div className="space-y-4">
        {coreFunctions.map((func: any) => (
          <div key={func.id} className="border border-gray-200 rounded-lg">
            <button
              onClick={() => setExpandedFunction(expandedFunction === func.id ? null : func.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <Target className="text-brand-600 flex-shrink-0" size={20} />
                <div className="text-left flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900">{func.functionName}</h4>
                  {func.description && (
                    <p className="text-sm text-gray-500 mt-1 truncate">{func.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-4 flex-shrink-0 ml-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{func.completionPercent || 0}%</div>
                  <div className="text-xs text-gray-500">Complete</div>
                </div>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-brand-600 h-2 rounded-full transition-all"
                    style={{ width: `${func.completionPercent || 0}%` }}
                  ></div>
                </div>
              </div>
            </button>
            {expandedFunction === func.id && (
              <div className="p-4 border-t border-gray-200 space-y-3">
                {func.categories?.map((category: any) => (
                  <div key={category.id} className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <h5 className="font-medium text-gray-900">{category.categoryId}: {category.name}</h5>
                        <p className="text-sm text-gray-500">{category.description}</p>
                      </div>
                      <div className="text-sm text-gray-500">{category.completionPercent}%</div>
                    </button>
                    {expandedCategory === category.id && (
                      <div className="p-3 border-t border-gray-200 space-y-2">
                        {category.subcategories?.map((subcat: any) => (
                          <SubcategoryItem
                            key={subcat.id}
                            subcategory={subcat}
                            onUpdate={onSubcategoryUpdate}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Subcategory Item Component
const SubcategoryItem: React.FC<any> = ({ subcategory, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState(subcategory.status);
  const [evidence, setEvidence] = useState(subcategory.evidence || '');
  const [notes, setNotes] = useState(subcategory.notes || '');

  const handleSave = () => {
    onUpdate(subcategory.id, { status, evidence, notes });
    setIsEditing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In_Progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Not_Started':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h6 className="font-medium text-gray-900">{subcategory.subcategoryId}: {subcategory.name}</h6>
          <p className="text-sm text-gray-500 mt-1">{subcategory.description}</p>
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            if (!isEditing) setIsEditing(true);
          }}
          className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getStatusColor(status)}`}
        >
          <option value="Not_Started">Not Started</option>
          <option value="In_Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Non_Applicable">Non Applicable</option>
        </select>
      </div>
      {isEditing && (
        <div className="mt-3 space-y-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Evidence</label>
            <textarea
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
              rows={2}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setIsEditing(false);
                setStatus(subcategory.status);
                setEvidence(subcategory.evidence || '');
                setNotes(subcategory.notes || '');
              }}
              className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 text-sm bg-brand-600 text-white rounded hover:bg-brand-700"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Trustworthiness Tab Component
const TrustworthinessTab: React.FC<any> = ({ system, onUpdate, onCalculateScore }) => {
  const characteristics = system.trustworthinessCharacteristics || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900">Trustworthiness Characteristics</h3>
        <button
          onClick={onCalculateScore}
          className="flex items-center space-x-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
        >
          <TrendingUp size={18} />
          <span>Calculate Score</span>
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {characteristics.map((char: any) => (
          <TrustworthinessCard
            key={char.id}
            characteristic={char}
            onUpdate={onUpdate}
          />
        ))}
      </div>
    </div>
  );
};

// Trustworthiness Card Component
const TrustworthinessCard: React.FC<any> = ({ characteristic, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [score, setScore] = useState(characteristic.score || 0);
  const [notes, setNotes] = useState(characteristic.assessmentNotes || '');

  const handleSave = () => {
    onUpdate(characteristic.characteristic, { score, assessmentNotes: notes });
    setIsEditing(false);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-gray-900">
          {characteristic.characteristic.replace(/_/g, ' ')}
        </h4>
        {isEditing ? (
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="0"
              max="100"
              value={score}
              onChange={(e) => setScore(parseInt(e.target.value) || 0)}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
            />
            <button
              onClick={handleSave}
              className="p-1 text-green-600 hover:bg-green-50 rounded"
            >
              <Save size={16} />
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setScore(characteristic.score || 0);
                setNotes(characteristic.assessmentNotes || '');
              }}
              className="p-1 text-gray-600 hover:bg-gray-50 rounded"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <Edit size={16} />
          </button>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-3">{characteristic.description}</p>
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-500">Score</span>
          <span className="font-bold text-gray-900">{score}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${score}%` }}
          ></div>
        </div>
      </div>
      {isEditing && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Assessment Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
            rows={3}
          />
        </div>
      )}
    </div>
  );
};

// Lifecycle Tab Component
const LifecycleTab: React.FC<any> = ({ systemId, system, onRefresh }) => {
  const [stages, setStages] = useState<any[]>(system.lifecycleStages || []);
  const [editingStage, setEditingStage] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const stagesOrder = [
    'Plan_and_Design',
    'Collect_and_Process',
    'Build_and_Validate',
    'Deploy_and_Operate',
    'Monitor_and_Maintain'
  ];

  useEffect(() => {
    setStages(system.lifecycleStages || []);
  }, [system]);

  const handleEdit = (stage: any) => {
    setEditingStage(stage.id);
    setEditData({
      status: stage.status,
      startDate: stage.startDate ? new Date(stage.startDate).toISOString().split('T')[0] : '',
      completionDate: stage.completionDate ? new Date(stage.completionDate).toISOString().split('T')[0] : '',
      notes: stage.notes || '',
    });
  };

  const handleSave = async (stageId: string, stageName: string) => {
    try {
      await api.aiRmf.updateLifecycleStage(systemId, stageName, {
        status: editData.status,
        startDate: editData.startDate ? new Date(editData.startDate) : null,
        completionDate: editData.completionDate ? new Date(editData.completionDate) : null,
        notes: editData.notes || null,
      });
      setEditingStage(null);
      if (onRefresh) onRefresh();
    } catch (error: any) {
      console.error('Failed to update lifecycle stage:', error);
      alert(`Failed to update: ${error.message || 'Unknown error'}`);
    }
  };

  const handleCancel = () => {
    setEditingStage(null);
    setEditData({});
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900">Lifecycle Stages</h3>
      <div className="space-y-3">
        {stagesOrder.map((stageName) => {
          const stage = stages.find((s: any) => s.stage === stageName);
          if (!stage) return null;
          const isEditing = editingStage === stage.id;
          
          return (
            <div key={stage.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-gray-900">{stage.stage.replace(/_/g, ' ')}</h4>
                {!isEditing && (
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      stage.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      stage.status === 'In_Progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {stage.status.replace(/_/g, ' ')}
                    </span>
                    <button
                      onClick={() => handleEdit(stage)}
                      className="p-1 text-gray-400 hover:text-brand-600 transition-colors"
                      title="Edit Stage"
                    >
                      <Edit size={16} />
                    </button>
                  </div>
                )}
              </div>
              
              {isEditing ? (
                <div className="space-y-3 mt-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={editData.status}
                      onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="Not_Started">Not Started</option>
                      <option value="In_Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={editData.startDate}
                        onChange={(e) => setEditData({ ...editData, startDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Completion Date</label>
                      <input
                        type="date"
                        value={editData.completionDate}
                        onChange={(e) => setEditData({ ...editData, completionDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={editData.notes}
                      onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSave(stage.id, stage.stage)}
                      className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {stage.startDate && (
                    <p className="text-sm text-gray-500">
                      Started: {new Date(stage.startDate).toLocaleDateString()}
                    </p>
                  )}
                  {stage.completionDate && (
                    <p className="text-sm text-gray-500">
                      Completed: {new Date(stage.completionDate).toLocaleDateString()}
                    </p>
                  )}
                  {stage.notes && (
                    <p className="text-sm text-gray-700 mt-2">{stage.notes}</p>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Assessments Tab Component
const AssessmentsTab: React.FC<any> = ({ systemId, system, onRefresh }) => {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadAssessments();
  }, [systemId, system?.coreFunctions]);

  const loadAssessments = async () => {
    try {
      setLoading(true);
      const data = await api.aiRmf.getAssessments(systemId);
      // Data should already include assessedByUser from backend
      setAssessments(data);
    } catch (error: any) {
      console.error('Failed to load assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading assessments...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900">Assessments</h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
        >
          <Plus size={18} />
          <span>New Assessment</span>
        </button>
      </div>
      {assessments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FileText className="mx-auto mb-2 text-gray-400" size={48} />
          <p>No assessments yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assessments.map((assessment) => (
            <div key={assessment.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-gray-900">{assessment.assessmentType.replace(/_/g, ' ')}</h4>
                <span className="text-sm text-gray-500">
                  {new Date(assessment.assessmentDate).toLocaleDateString()}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-2">
                {assessment.overallScore !== null && (
                  <div>
                    <span className="text-sm text-gray-500">Overall Score: </span>
                    {assessment.currentOverallScore !== undefined && assessment.currentOverallScore !== assessment.overallScore ? (
                      <span className="font-bold text-brand-600">{assessment.currentOverallScore}%</span>
                    ) : (
                      <span className="font-bold text-gray-900">{assessment.overallScore}%</span>
                    )}
                    {assessment.currentOverallScore !== undefined && assessment.currentOverallScore !== assessment.overallScore && (
                      <span className="text-xs text-gray-400 ml-1">(Assessment: {assessment.overallScore}%)</span>
                    )}
                  </div>
                )}
                <div>
                  <span className="text-sm text-gray-500">Assessed By: </span>
                  <span className="font-medium text-gray-900">
                    {assessment.assessedByUser?.name || assessment.assessedByUser?.email || assessment.assessedBy || 'Unknown'}
                  </span>
                </div>
              </div>
              {assessment.functionScores && (
                <div className="mb-2">
                  <p className="text-sm font-medium text-gray-700 mb-1">Function Scores:</p>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(assessment.functionScores).map(([func, score]: [string, any]) => {
                      const currentScore = assessment.currentFunctionScores?.[func] ?? score;
                      const hasChanged = currentScore !== score;
                      return (
                        <div key={func} className="text-center">
                          <div className="text-xs text-gray-500">{func}</div>
                          <div className={`font-bold ${hasChanged ? 'text-brand-600' : 'text-gray-900'}`}>
                            {currentScore}%
                            {hasChanged && (
                              <span className="text-xs text-gray-400 ml-1">
                                (was {score}%)
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {assessment.currentOverallScore !== undefined && assessment.currentOverallScore !== assessment.overallScore && (
                    <div className="mt-2 text-xs text-gray-500">
                      <span className="font-medium">Current Overall Score:</span> {assessment.currentOverallScore}% 
                      <span className="ml-2">(Assessment: {assessment.overallScore}%)</span>
                    </div>
                  )}
                </div>
              )}
              {assessment.recommendations && assessment.recommendations.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-700">Recommendations:</p>
                  <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                    {assessment.recommendations.map((rec: string, idx: number) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {showCreateModal && (
        <CreateAssessmentModal
          systemId={systemId}
          system={system}
          onClose={() => {
            setShowCreateModal(false);
            loadAssessments();
          }}
        />
      )}
    </div>
  );
};

// Risk Activities Tab Component
const RiskActivitiesTab: React.FC<any> = ({ systemId, system, onRefresh }) => {
  const { user } = useAuth();
  const [riskActivities, setRiskActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  useEffect(() => {
    loadRiskActivities();
    loadTeamMembers();
  }, [systemId]);

  const loadRiskActivities = async () => {
    try {
      setLoading(true);
      const systemData = await api.aiRmf.getAISystemById(systemId);
      setRiskActivities(systemData.riskActivities || []);
    } catch (error: any) {
      console.error('Failed to load risk activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamMembers = async () => {
    try {
      const members = await api.team.list();
      setTeamMembers(members || []);
    } catch (error) {
      console.error('Failed to load team members:', error);
    }
  };

  const handleDelete = async (activityId: string) => {
    if (!confirm('Are you sure you want to delete this risk activity?')) {
      return;
    }

    try {
      // Note: Delete endpoint would need to be added
      // For now, we'll update status to a deleted state or remove from list
      await api.aiRmf.updateRiskActivity(activityId, { status: 'Deleted' });
      loadRiskActivities();
      if (onRefresh) onRefresh();
    } catch (error: any) {
      console.error('Failed to delete risk activity:', error);
      alert(`Failed to delete: ${error.message || 'Unknown error'}`);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading risk activities...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900">Risk Activities</h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
        >
          <Plus size={18} />
          <span>New Risk Activity</span>
        </button>
      </div>
      {riskActivities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <AlertCircle className="mx-auto mb-2 text-gray-400" size={48} />
          <p>No risk activities yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {riskActivities.filter(a => a.status !== 'Deleted').map((activity: any) => (
            <div key={activity.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <h4 className="font-bold text-gray-900">{activity.activityType.replace(/_/g, ' ')}</h4>
                  {activity.relatedFunction && (
                    <span className="text-xs text-gray-500">({activity.relatedFunction})</span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    activity.riskLevel === 'Critical' ? 'bg-red-100 text-red-800' :
                    activity.riskLevel === 'High' ? 'bg-orange-100 text-orange-800' :
                    activity.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {activity.riskLevel}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    activity.status === 'Mitigated' ? 'bg-green-100 text-green-800' :
                    activity.status === 'In_Progress' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {activity.status.replace(/_/g, ' ')}
                  </span>
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => handleDelete(activity.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-2">{activity.description}</p>
              {activity.mitigationPlan && (
                <div className="mt-2 p-2 bg-gray-50 rounded">
                  <p className="text-sm font-medium text-gray-700 mb-1">Mitigation Plan:</p>
                  <p className="text-sm text-gray-600">{activity.mitigationPlan}</p>
                </div>
              )}
              {activity.targetDate && (
                <p className="text-xs text-gray-500 mt-2">
                  Target Date: {new Date(activity.targetDate).toLocaleDateString()}
                </p>
              )}
              {activity.owner && (
                <p className="text-xs text-gray-500 mt-1">
                  Owner: {activity.owner.name || activity.ownerId}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
      {showCreateModal && (
        <CreateRiskActivityModal
          systemId={systemId}
          teamMembers={teamMembers}
          onClose={() => {
            setShowCreateModal(false);
            loadRiskActivities();
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
};

// Actors Tab Component
const ActorsTab: React.FC<any> = ({ systemId, system, onRefresh }) => {
  const { user } = useAuth();
  const [actors, setActors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  useEffect(() => {
    loadActors();
    loadTeamMembers();
  }, [systemId]);

  const loadActors = async () => {
    try {
      setLoading(true);
      const systemData = await api.aiRmf.getAISystemById(systemId);
      setActors(systemData.actors || []);
    } catch (error: any) {
      console.error('Failed to load actors:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamMembers = async () => {
    try {
      const members = await api.team.list();
      setTeamMembers(members || []);
    } catch (error) {
      console.error('Failed to load team members:', error);
    }
  };

  const handleDelete = async (actorId: string) => {
    if (!confirm('Are you sure you want to remove this actor?')) {
      return;
    }

    try {
      await api.aiRmf.removeActor(actorId);
      loadActors();
      if (onRefresh) onRefresh();
    } catch (error: any) {
      console.error('Failed to remove actor:', error);
      alert(`Failed to remove actor: ${error.message || 'Unknown error'}`);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading actors...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900">AI Actors</h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
        >
          <Plus size={18} />
          <span>Add Actor</span>
        </button>
      </div>
      {actors.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Users className="mx-auto mb-2 text-gray-400" size={48} />
          <p>No actors defined yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {actors.map((actor: any) => (
            <div key={actor.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900">{actor.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">{actor.role}</p>
                  <p className="text-sm text-gray-600 mt-2">{actor.actorType.replace(/_/g, ' ')}</p>
                  {actor.user && (
                    <p className="text-xs text-gray-400 mt-1">User: {actor.user.name || actor.user.email}</p>
                  )}
                  {actor.responsibilities && actor.responsibilities.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700">Responsibilities:</p>
                      <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                        {actor.responsibilities.map((resp: string, idx: number) => (
                          <li key={idx}>{resp}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {actor.involvementStages && actor.involvementStages.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-700">Involvement Stages:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {actor.involvementStages.map((stage: string, idx: number) => (
                          <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {stage.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => handleDelete(actor.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors ml-2"
                    title="Remove Actor"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {showCreateModal && (
        <CreateActorModal
          systemId={systemId}
          teamMembers={teamMembers}
          onClose={() => {
            setShowCreateModal(false);
            loadActors();
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
};

// Create Assessment Modal Component
const CreateAssessmentModal: React.FC<any> = ({ systemId, system, onClose }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState(() => {
    // Auto-populate from core functions
    let functionScores: any = { GOVERN: 0, MAP: 0, MEASURE: 0, MANAGE: 0 };
    let overallScore = 0;
    
    if (system?.coreFunctions) {
      functionScores = {};
      system.coreFunctions.forEach((func: any) => {
        functionScores[func.functionName] = func.completionPercent || 0;
      });
      // Calculate overall score
      const scoreValues = Object.values(functionScores) as number[];
      overallScore = scoreValues.length > 0
        ? Math.round(scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length)
        : 0;
    }
    
    return {
      assessmentType: 'Pre_Deployment',
      overallScore,
      functionScores,
      characteristicScores: {
        Valid_and_Reliable: 0,
        Safe: 0,
        Secure_and_Resilient: 0,
        Accountable_and_Transparent: 0,
        Explainable_and_Interpretable: 0,
        Privacy_Enhanced: 0,
        Fair_with_Bias_Managed: 0,
      },
      recommendations: [''],
    };
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Calculate overall score from function scores if not manually set
      const calculatedOverallScore = formData.overallScore || (() => {
        const scores = Object.values(formData.functionScores) as number[];
        if (scores.length > 0) {
          return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
        }
        return 0;
      })();
      
      await api.aiRmf.createAssessment(systemId, {
        assessmentType: formData.assessmentType,
        assessedBy: user?.id || '',
        overallScore: calculatedOverallScore,
        functionScores: formData.functionScores,
        characteristicScores: formData.characteristicScores,
        recommendations: formData.recommendations.filter((r: string) => r.trim()),
      });
      onClose();
    } catch (error: any) {
      console.error('Failed to create assessment:', error);
      alert(`Failed to create assessment: ${error.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">Create Assessment</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Type</label>
            <select
              value={formData.assessmentType}
              onChange={(e) => setFormData({ ...formData, assessmentType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="Initial">Initial</option>
              <option value="Periodic">Periodic</option>
              <option value="Pre_Deployment">Pre-Deployment</option>
              <option value="Post_Incident">Post-Incident</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Function Scores
              <span className="text-xs text-gray-500 ml-2">
                (Auto-populated from Core Functions)
              </span>
            </label>
            <div className="grid grid-cols-4 gap-4">
              {Object.keys(formData.functionScores).map((func) => (
                <div key={func}>
                  <label className="block text-xs text-gray-500 mb-1">{func}</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.functionScores[func as keyof typeof formData.functionScores]}
                    onChange={(e) => {
                      const newScores = {
                        ...formData.functionScores,
                        [func]: parseInt(e.target.value) || 0,
                      };
                      // Auto-calculate overall score
                      const scores = Object.values(newScores) as number[];
                      const avgScore = scores.length > 0
                        ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
                        : 0;
                      setFormData({
                        ...formData,
                        functionScores: newScores,
                        overallScore: avgScore,
                      });
                    }}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Overall Score (0-100)
              <span className="text-xs text-gray-500 ml-2">
                (Auto-calculated from function scores)
              </span>
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.overallScore}
              onChange={(e) => setFormData({ ...formData, overallScore: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
            >
              Create Assessment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

