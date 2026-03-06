import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, FileText, Plus, Search, Filter, Calendar, 
  TrendingUp, BarChart3, Download, Eye, Edit, Trash2, X
} from 'lucide-react';
import { toast } from 'sonner';

interface AIRMFAssessmentsProps {
  onBack: () => void;
  onViewSystem?: (systemId: string) => void;
}

export const AIRMFAssessments: React.FC<AIRMFAssessmentsProps> = ({ onBack, onViewSystem }) => {
  const { user } = useAuth();
  const [allAssessments, setAllAssessments] = useState<any[]>([]);
  const [systems, setSystems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAssessment, setSelectedAssessment] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  const [deletingAssessment, setDeletingAssessment] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [systemsData] = await Promise.all([
        api.aiRmf.getAISystems()
      ]);
      setSystems(systemsData as any[]);

      // Load assessments for all systems
      const assessmentsPromises = (systemsData as any[]).map((system: any) =>
        api.aiRmf.getAssessments(system.id).catch(() => [])
      );
      const assessmentsArrays = await Promise.all(assessmentsPromises) as any[][];
      const allAssessments = assessmentsArrays.flat().map((assessment: any, idx: number) => ({
        ...assessment,
        systemId: (systemsData as any[])[Math.floor(idx / (assessmentsArrays[0]?.length || 1))]?.id,
        systemName: (systemsData as any[])[Math.floor(idx / (assessmentsArrays[0]?.length || 1))]?.name,
      }));
      setAllAssessments(allAssessments);
    } catch (error: unknown) {
      console.error('Failed to load assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (assessmentId: string) => {
    if (!confirm('Are you sure you want to delete this assessment?')) {
      return;
    }

    try {
      setDeletingAssessment(assessmentId);
      // Note: Delete endpoint would need to be added to the API
      // For now, we'll just remove it from the list
      setAllAssessments(allAssessments.filter(a => a.id !== assessmentId));
    } catch (error: unknown) {
      console.error('Failed to delete assessment:', error);
      toast.error(`Failed to delete assessment: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setDeletingAssessment(null);
    }
  };

  const filteredAssessments = allAssessments.filter(assessment => {
    const matchesSearch = 
      assessment.assessmentType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assessment.systemName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || assessment.assessmentType === typeFilter;
    const matchesStatus = statusFilter === 'all' || assessment.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getAssessmentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'Initial': 'bg-blue-100 text-blue-800',
      'Periodic': 'bg-green-100 text-green-800',
      'Pre_Deployment': 'bg-yellow-100 text-yellow-800',
      'Post_Incident': 'bg-red-100 text-red-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Completed': 'bg-green-100 text-green-800',
      'Draft': 'bg-yellow-100 text-yellow-800',
      'Approved': 'bg-blue-100 text-blue-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="text-brand-600" size={28} />
            AI RMF Assessments
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            View and manage assessments across all AI systems
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>New Assessment</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search assessments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Types</option>
            <option value="Initial">Initial</option>
            <option value="Periodic">Periodic</option>
            <option value="Pre_Deployment">Pre-Deployment</option>
            <option value="Post_Incident">Post-Incident</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Completed">Completed</option>
            <option value="Approved">Approved</option>
          </select>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="text-sm text-gray-500">Total Assessments</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{allAssessments.length}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="text-sm text-gray-500">Completed</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {allAssessments.filter(a => a.status === 'Completed').length}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="text-sm text-gray-500">Avg Score</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {allAssessments.length > 0
              ? Math.round(
                  allAssessments
                    .filter(a => a.overallScore !== null)
                    .reduce((sum, a) => sum + (a.overallScore || 0), 0) /
                    allAssessments.filter(a => a.overallScore !== null).length
                ) || 0
              : 0}
            %
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="text-sm text-gray-500">This Month</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {allAssessments.filter(a => {
              const date = new Date(a.assessmentDate);
              const now = new Date();
              return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            }).length}
          </div>
        </div>
      </div>

      {/* Assessments List */}
      {filteredAssessments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <FileText className="mx-auto mb-4 text-gray-400" size={64} />
          <h3 className="text-lg font-bold text-gray-900 mb-2">No Assessments Found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by creating your first assessment'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-brand-600 text-white px-6 py-2 rounded-lg hover:bg-brand-700 transition-colors"
          >
            Create Assessment
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssessments.map((assessment) => (
            <div
              key={assessment.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getAssessmentTypeColor(assessment.assessmentType)}`}>
                      {assessment.assessmentType.replace(/_/g, ' ')}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(assessment.status)}`}>
                      {assessment.status}
                    </span>
                    {assessment.systemName && (
                      <span className="text-sm text-gray-500">
                        for {assessment.systemName}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-500">Assessment Date</div>
                      <div className="font-medium text-gray-900">
                        {new Date(assessment.assessmentDate).toLocaleDateString()}
                      </div>
                    </div>
                    {assessment.overallScore !== null && (
                      <div>
                        <div className="text-sm text-gray-500">Overall Score</div>
                        {assessment.currentOverallScore !== undefined && assessment.currentOverallScore !== assessment.overallScore ? (
                          <>
                            <div className="font-bold text-brand-600 text-xl">
                              {assessment.currentOverallScore}%
                            </div>
                            <div className="text-xs text-gray-400">
                              Assessment: {assessment.overallScore}%
                            </div>
                          </>
                        ) : (
                          <div className="font-bold text-gray-900 text-xl">
                            {assessment.overallScore}%
                          </div>
                        )}
                      </div>
                    )}
                    <div>
                      <div className="text-sm text-gray-500">Assessed By</div>
                      <div className="font-medium text-gray-900">
                        {assessment.assessedByUser?.name || assessment.assessedByUser?.email || assessment.assessedBy || 'Unknown'}
                      </div>
                    </div>
                  </div>

                  {assessment.functionScores && (
                    <div className="mb-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">Function Scores</div>
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
                                  <span className="text-xs text-gray-400 ml-1 block">
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
                    <div className="mb-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">Recommendations</div>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        {assessment.recommendations.slice(0, 3).map((rec: string, idx: number) => (
                          <li key={idx}>{rec}</li>
                        ))}
                        {assessment.recommendations.length > 3 && (
                          <li className="text-gray-400">+{assessment.recommendations.length - 3} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {onViewSystem && assessment.systemId && (
                    <button
                      onClick={() => onViewSystem(assessment.systemId)}
                      className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors"
                      title="View System"
                    >
                      <Eye size={18} />
                    </button>
                  )}
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => handleDelete(assessment.id)}
                      disabled={deletingAssessment === assessment.id}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                      title="Delete Assessment"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedAssessment(assessment)}
                    className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors"
                    title="View Details"
                  >
                    <FileText size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assessment Detail Modal */}
      {selectedAssessment && (
        <AssessmentDetailModal
          assessment={selectedAssessment}
          onClose={() => setSelectedAssessment(null)}
        />
      )}

      {/* Create Assessment Modal */}
      {showCreateModal && (
        <CreateAssessmentModal
          systems={systems}
          onClose={() => {
            setShowCreateModal(false);
            loadData();
          }}
          onSystemSelect={(systemId: string) => {
            setSelectedSystemId(systemId);
          }}
        />
      )}
    </div>
  );
};

// Assessment Detail Modal
const AssessmentDetailModal: React.FC<any> = ({ assessment, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
          <h3 className="text-xl font-bold text-gray-900">
            Assessment Details
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Assessment Type</div>
              <div className="font-medium text-gray-900">{assessment.assessmentType.replace(/_/g, ' ')}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Status</div>
              <div className="font-medium text-gray-900">{assessment.status}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Assessment Date</div>
              <div className="font-medium text-gray-900">
                {new Date(assessment.assessmentDate).toLocaleDateString()}
              </div>
            </div>
            {assessment.overallScore !== null && (
              <div>
                <div className="text-sm text-gray-500">Overall Score</div>
                {assessment.currentOverallScore !== undefined && assessment.currentOverallScore !== assessment.overallScore ? (
                  <>
                    <div className="font-bold text-brand-600 text-2xl">{assessment.currentOverallScore}%</div>
                    <div className="text-xs text-gray-400 mt-1">Assessment: {assessment.overallScore}%</div>
                  </>
                ) : (
                  <div className="font-bold text-gray-900 text-2xl">{assessment.overallScore}%</div>
                )}
              </div>
            )}
          </div>

          {assessment.functionScores && (
            <div>
              <h4 className="font-bold text-gray-900 mb-3">Function Scores</h4>
              <div className="grid grid-cols-4 gap-4">
                {Object.entries(assessment.functionScores).map(([func, score]: [string, any]) => {
                  const currentScore = assessment.currentFunctionScores?.[func] ?? score;
                  const hasChanged = currentScore !== score;
                  return (
                    <div key={func} className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">{func}</div>
                      <div className={`text-2xl font-bold ${hasChanged ? 'text-brand-600' : 'text-gray-900'}`}>
                        {currentScore}%
                      </div>
                      {hasChanged && (
                        <div className="text-xs text-gray-400 mt-1">
                          Assessment: {score}%
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {assessment.currentOverallScore !== undefined && assessment.currentOverallScore !== assessment.overallScore && (
                <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
                  <span className="font-medium text-gray-700">Current Overall Score:</span> 
                  <span className="font-bold text-brand-600 ml-2">{assessment.currentOverallScore}%</span>
                  <span className="text-gray-500 ml-2">(Assessment: {assessment.overallScore}%)</span>
                </div>
              )}
            </div>
          )}

          {assessment.characteristicScores && (
            <div>
              <h4 className="font-bold text-gray-900 mb-3">Trustworthiness Characteristics</h4>
              <div className="space-y-2">
                {Object.entries(assessment.characteristicScores).map(([char, score]: [string, any]) => (
                  <div key={char} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">{char.replace(/_/g, ' ')}</span>
                    <span className="font-bold text-gray-900">{score}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {assessment.findings && (
            <div>
              <h4 className="font-bold text-gray-900 mb-3">Findings</h4>
              {assessment.findings.strengths && assessment.findings.strengths.length > 0 && (
                <div className="mb-3">
                  <div className="text-sm font-medium text-green-700 mb-1">Strengths</div>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {assessment.findings.strengths.map((s: string, idx: number) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {assessment.findings.weaknesses && assessment.findings.weaknesses.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-red-700 mb-1">Weaknesses</div>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {assessment.findings.weaknesses.map((w: string, idx: number) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {assessment.recommendations && assessment.recommendations.length > 0 && (
            <div>
              <h4 className="font-bold text-gray-900 mb-3">Recommendations</h4>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                {assessment.recommendations.map((rec: string, idx: number) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Create Assessment Modal (Enhanced)
const CreateAssessmentModal: React.FC<any> = ({ systems, onClose, onSystemSelect }) => {
  const { user } = useAuth();
  const [selectedSystemData, setSelectedSystemData] = useState<any>(null);
  const [formData, setFormData] = useState({
    systemId: '',
    assessmentType: 'Pre_Deployment',
    overallScore: 0,
    functionScores: {
      GOVERN: 0,
      MAP: 0,
      MEASURE: 0,
      MANAGE: 0,
    },
    characteristicScores: {
      Valid_and_Reliable: 0,
      Safe: 0,
      Secure_and_Resilient: 0,
      Accountable_and_Transparent: 0,
      Explainable_and_Interpretable: 0,
      Privacy_Enhanced: 0,
      Fair_with_Bias_Managed: 0,
    },
    findings: {
      strengths: [''],
      weaknesses: [''],
    },
    recommendations: [''],
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.systemId) {
      toast.warning('Please select an AI system');
      return;
    }

    try {
      setSubmitting(true);
      // Calculate overall score from function scores if not manually set
      const calculatedOverallScore = formData.overallScore || (() => {
        const scores = Object.values(formData.functionScores) as number[];
        if (scores.length > 0) {
          return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
        }
        return 0;
      })();
      
      await api.aiRmf.createAssessment(formData.systemId, {
        assessmentType: formData.assessmentType,
        assessedBy: user?.id || '',
        overallScore: calculatedOverallScore,
        functionScores: formData.functionScores,
        characteristicScores: formData.characteristicScores,
        findings: {
          strengths: formData.findings.strengths.filter(s => s.trim()),
          weaknesses: formData.findings.weaknesses.filter(w => w.trim()),
        },
        recommendations: formData.recommendations.filter(r => r.trim()),
      });
      onClose();
    } catch (error: unknown) {
      console.error('Failed to create assessment:', error);
      toast.error(`Failed to create assessment: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
          <h3 className="text-xl font-bold text-gray-900">Create Assessment</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              AI System <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.systemId}
              onChange={async (e) => {
                const systemId = e.target.value;
                setFormData({ ...formData, systemId });
                if (onSystemSelect) onSystemSelect(systemId);
                
                // Load system data to auto-populate function scores
                if (systemId) {
                  try {
                    const systemData = await api.aiRmf.getAISystemById(systemId);
                    setSelectedSystemData(systemData);

                    // Auto-populate function scores from core functions
                    if ((systemData as any).coreFunctions) {
                      const functionScores: any = {};
                      (systemData as any).coreFunctions.forEach((func: any) => {
                        functionScores[func.functionName] = func.completionPercent || 0;
                      });
                      
                      // Calculate overall score
                      const scores = Object.values(functionScores) as number[];
                      const avgScore = scores.length > 0
                        ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
                        : 0;
                      
                      setFormData(prev => ({
                        ...prev,
                        systemId,
                        functionScores,
                        overallScore: avgScore,
                      }));
                    }
                  } catch (error) {
                    console.error('Failed to load system data:', error);
                  }
                } else {
                  setSelectedSystemData(null);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            >
              <option value="">Select AI System...</option>
              {systems.map((system: any) => (
                <option key={system.id} value={system.id}>
                  {system.name} ({system.systemType})
                </option>
              ))}
            </select>
          </div>

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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Trustworthiness Characteristics</label>
            <div className="grid grid-cols-2 gap-3">
              {Object.keys(formData.characteristicScores).map((char) => (
                <div key={char}>
                  <label className="block text-xs text-gray-500 mb-1">{char.replace(/_/g, ' ')}</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.characteristicScores[char as keyof typeof formData.characteristicScores]}
                    onChange={(e) => setFormData({
                      ...formData,
                      characteristicScores: {
                        ...formData.characteristicScores,
                        [char]: parseInt(e.target.value) || 0,
                      },
                    })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Strengths</label>
            {formData.findings.strengths.map((strength, idx) => (
              <input
                key={idx}
                type="text"
                value={strength}
                onChange={(e) => {
                  const newStrengths = [...formData.findings.strengths];
                  newStrengths[idx] = e.target.value;
                  setFormData({
                    ...formData,
                    findings: { ...formData.findings, strengths: newStrengths },
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Enter strength..."
              />
            ))}
            <button
              type="button"
              onClick={() => setFormData({
                ...formData,
                findings: { ...formData.findings, strengths: [...formData.findings.strengths, ''] },
              })}
              className="text-sm text-brand-600 hover:text-brand-800"
            >
              + Add Strength
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Weaknesses</label>
            {formData.findings.weaknesses.map((weakness, idx) => (
              <input
                key={idx}
                type="text"
                value={weakness}
                onChange={(e) => {
                  const newWeaknesses = [...formData.findings.weaknesses];
                  newWeaknesses[idx] = e.target.value;
                  setFormData({
                    ...formData,
                    findings: { ...formData.findings, weaknesses: newWeaknesses },
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Enter weakness..."
              />
            ))}
            <button
              type="button"
              onClick={() => setFormData({
                ...formData,
                findings: { ...formData.findings, weaknesses: [...formData.findings.weaknesses, ''] },
              })}
              className="text-sm text-brand-600 hover:text-brand-800"
            >
              + Add Weakness
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Recommendations</label>
            {formData.recommendations.map((rec, idx) => (
              <input
                key={idx}
                type="text"
                value={rec}
                onChange={(e) => {
                  const newRecs = [...formData.recommendations];
                  newRecs[idx] = e.target.value;
                  setFormData({ ...formData, recommendations: newRecs });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Enter recommendation..."
              />
            ))}
            <button
              type="button"
              onClick={() => setFormData({
                ...formData,
                recommendations: [...formData.recommendations, ''],
              })}
              className="text-sm text-brand-600 hover:text-brand-800"
            >
              + Add Recommendation
            </button>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Assessment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

