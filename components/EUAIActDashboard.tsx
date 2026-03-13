/**
 * EU AI Act Compliance Dashboard
 * 
 * Comprehensive management interface for EU AI Act compliance:
 * - AI system registration and risk classification
 * - Risk assessment management
 * - Transparency report generation
 * - Compliance status tracking
 * 
 * Reference: Regulation (EU) 2024/1689
 */

import React, { useState, useEffect } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { api } from '../services/api';
import { AlertTriangle, CheckCircle, Clock, X, Plus, FileText, Shield, TrendingUp, AlertCircle, Database, Eye, Download } from 'lucide-react';

interface AISystem {
  id: string;
  name: string;
  description: string;
  riskLevel: 'unacceptable' | 'high' | 'limited' | 'minimal';
  highRiskCategory?: string;
  isGeneralPurpose: boolean;
  isGenerative: boolean;
  prohibitedPractices: string[];
  complianceStatus: 'compliant' | 'non_compliant' | 'in_review' | 'at_risk';
  lastAssessmentDate?: string;
  nextAssessmentDate?: string;
  registeredInEUDatabase: boolean;
  euDatabaseRegistrationId?: string;
}

interface RiskAssessment {
  id: string;
  systemId: string;
  assessmentDate: string;
  riskLevel: string;
  complianceScore: number;
  status: 'pending' | 'approved' | 'rejected' | 'requires_action';
  findings: {
    safetyRisks: string[];
    fundamentalRightsRisks: string[];
    discriminationRisks: string[];
    privacyRisks: string[];
  };
  mitigationMeasures: string[];
  recommendations: string[];
}

export const EUAIActDashboard: React.FC = () => {
  const { t } = useI18n();
  const [systems, setSystems] = useState<AISystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState<AISystem | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showReportViewModal, setShowReportViewModal] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<any | null>(null);
  const [allReports, setAllReports] = useState<any[]>([]);
  const [showStatusUpdateModal, setShowStatusUpdateModal] = useState(false);

  // Registration form state
  const [registrationForm, setRegistrationForm] = useState({
    name: '',
    description: '',
    useCase: '',
    targetUsers: [] as string[],
    dataTypes: [] as string[],
    decisionMaking: false,
    biometricProcessing: false,
    realTimeProcessing: false,
    affectsFundamentalRights: false,
    isGeneralPurpose: false,
    isGenerative: false,
  });

  // Assessment form state
  const [assessmentForm, setAssessmentForm] = useState({
    safetyRisks: [] as string[],
    fundamentalRightsRisks: [] as string[],
    discriminationRisks: [] as string[],
    privacyRisks: [] as string[],
    mitigationMeasures: [] as string[],
    recommendations: [] as string[],
  });

  useEffect(() => {
    loadSystems();
  }, []);

  const loadSystems = async () => {
    try {
      setLoading(true);
      const response = await api.euRegulations.aiAct.getSystems();
      setSystems(response.systems || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load AI systems');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSystem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await api.euRegulations.aiAct.registerSystem(registrationForm);
      setShowRegisterModal(false);
      setRegistrationForm({
        name: '',
        description: '',
        useCase: '',
        targetUsers: [],
        dataTypes: [],
        decisionMaking: false,
        biometricProcessing: false,
        realTimeProcessing: false,
        affectsFundamentalRights: false,
        isGeneralPurpose: false,
        isGenerative: false,
      });
      await loadSystems();
    } catch (err: any) {
      setError(err.message || 'Failed to register AI system');
    }
  };

  const handleConductAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSystem) return;

    try {
      setError(null);
      await api.euRegulations.aiAct.conductRiskAssessment(selectedSystem.id, assessmentForm);
      setShowAssessmentModal(false);
      setAssessmentForm({
        safetyRisks: [],
        fundamentalRightsRisks: [],
        discriminationRisks: [],
        privacyRisks: [],
        mitigationMeasures: [],
        recommendations: [],
      });
      await loadSystems();
    } catch (err: any) {
      setError(err.message || 'Failed to conduct risk assessment');
    }
  };

  const handleGenerateReport = async () => {
    try {
      setError(null);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 12);

      // Reload systems first to get accurate counts
      await loadSystems();
      
      // First, load all existing reports from past 12 months
      const reportsResponse = await api.euRegulations.aiAct.getTransparencyReports(startDate, endDate);
      setAllReports(reportsResponse.reports || []);
      
      // If no reports exist, generate a new one
      if (reportsResponse.reports.length === 0) {
        const response = await api.euRegulations.aiAct.generateTransparencyReport({
          start: startDate,
          end: endDate,
        });
        setAllReports([response.report]);
        // Add total systems count from current systems
        const totalSystems = systems.length;
        const generativeCount = systems.filter(s => s.isGenerative).length;
        const highRiskCount = systems.filter(s => s.riskLevel === 'high').length;
        setGeneratedReport({
          ...response.report,
          totalSystems,
          generativeCount,
          highRiskCount,
        });
      } else {
        // Aggregate all reports into a single comprehensive report
        const aggregatedReport = aggregateReports(reportsResponse.reports);
        // Add total systems count from current systems
        const totalSystems = systems.length;
        const generativeCount = systems.filter(s => s.isGenerative).length;
        const highRiskCount = systems.filter(s => s.riskLevel === 'high').length;
        setGeneratedReport({
          ...aggregatedReport,
          totalSystems,
          generativeCount,
          highRiskCount,
        });
      }
      
      setShowReportModal(false);
      setShowReportViewModal(true);
    } catch (err: any) {
      setError(err.message || 'Failed to generate transparency report');
    }
  };

  const aggregateReports = (reports: any[]) => {
    if (reports.length === 0) {
      // Return empty report structure if no reports exist
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 12);
      return {
        id: 'empty',
        reportingPeriod: {
          start: startDate,
          end: endDate,
        },
        generativeAISystems: [],
        highRiskSystems: [],
        prohibitedPracticesDetected: 0,
        complaintsReceived: 0,
        complaintsResolved: 0,
        submittedToCommission: false,
        submittedAt: null,
      };
    }

    const allGenerativeSystems = new Map<string, any>();
    const allHighRiskSystems = new Map<string, any>();
    let totalProhibitedPractices = 0;
    let totalComplaintsReceived = 0;
    let totalComplaintsResolved = 0;

    reports.forEach(report => {
      // Aggregate generative systems
      if (report.generativeAISystems && Array.isArray(report.generativeAISystems)) {
        report.generativeAISystems.forEach((sys: any) => {
          const existing = allGenerativeSystems.get(sys.systemId);
          if (existing) {
            existing.contentGenerated += sys.contentGenerated || 0;
            existing.illegalContentPrevented += sys.illegalContentPrevented || 0;
            // Average compliance percentages
            existing.aiLabelingCompliance = (existing.aiLabelingCompliance + (sys.aiLabelingCompliance || 0)) / 2;
            existing.copyrightCompliance = (existing.copyrightCompliance + (sys.copyrightCompliance || 0)) / 2;
          } else {
            allGenerativeSystems.set(sys.systemId, { ...sys });
          }
        });
      }

      // Aggregate high-risk systems
      if (report.highRiskSystems && Array.isArray(report.highRiskSystems)) {
        report.highRiskSystems.forEach((sys: any) => {
          const existing = allHighRiskSystems.get(sys.systemId);
          if (existing) {
            existing.assessmentsCompleted += sys.assessmentsCompleted || 0;
            existing.incidentsReported += sys.incidentsReported || 0;
          } else {
            allHighRiskSystems.set(sys.systemId, { ...sys });
          }
        });
      }

      totalProhibitedPractices += report.prohibitedPracticesDetected || 0;
      totalComplaintsReceived += report.complaintsReceived || 0;
      totalComplaintsResolved += report.complaintsResolved || 0;
    });

    const earliestStart = reports.reduce((earliest, r) => 
      new Date(r.reportingPeriod.start) < new Date(earliest.reportingPeriod.start) ? r : earliest
    );

    const latestEnd = reports.reduce((latest, r) => 
      new Date(r.reportingPeriod.end) > new Date(latest.reportingPeriod.end) ? r : latest
    );

    return {
      id: 'aggregated',
      reportingPeriod: {
        start: earliestStart.reportingPeriod.start,
        end: latestEnd.reportingPeriod.end,
      },
      generativeAISystems: Array.from(allGenerativeSystems.values()),
      highRiskSystems: Array.from(allHighRiskSystems.values()),
      prohibitedPracticesDetected: totalProhibitedPractices,
      complaintsReceived: totalComplaintsReceived,
      complaintsResolved: totalComplaintsResolved,
      submittedToCommission: reports.some(r => r.submittedToCommission),
      submittedAt: reports.find(r => r.submittedAt)?.submittedAt,
    };
  };

  const handleDownloadReport = () => {
    if (!generatedReport) return;

    const reportData = {
      ...generatedReport,
      generatedAt: new Date().toISOString(),
      reportType: 'EU AI Act Transparency Report',
      period: `${new Date(generatedReport.reportingPeriod.start).toLocaleDateString()} - ${new Date(generatedReport.reportingPeriod.end).toLocaleDateString()}`,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eu-ai-act-transparency-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'unacceptable':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'limited':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'minimal':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'text-green-600';
      case 'non_compliant':
        return 'text-red-600';
      case 'at_risk':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const getRiskLevelIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'unacceptable':
        return <X className="w-5 h-5 text-red-600" />;
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'limited':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'minimal':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('euRegulations.euAiAct')}</h2>
          <p className="text-gray-600 mt-1">Manage AI systems and ensure compliance with Regulation (EU) 2024/1689</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowReportModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Generate Report
          </button>
          <button
            onClick={() => setShowRegisterModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Register AI System
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4 text-red-600" />
          </button>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('common.total')} Systems</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{systems.length}</p>
            </div>
            <Database className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('euRegulations.highRisk')}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {systems.filter(s => s.riskLevel === 'high').length}
              </p>
            </div>
            <Shield className="w-8 h-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Compliant Systems</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {systems.filter(s => s.complianceStatus === 'compliant').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Generative AI</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {systems.filter(s => s.isGenerative).length}
              </p>
            </div>
            <Eye className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Systems List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Registered AI Systems</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {systems.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Database className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No AI systems registered yet</p>
              <button
                onClick={() => setShowRegisterModal(true)}
                className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Register your first AI system
              </button>
            </div>
          ) : (
            systems.map((system) => (
              <div key={system.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">{system.name}</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRiskLevelColor(system.riskLevel)}`}>
                        {system.riskLevel.toUpperCase()}
                      </span>
                      <span className={`text-sm font-medium ${getComplianceStatusColor(system.complianceStatus)}`}>
                        {system.complianceStatus.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    {system.description && (
                      <p className="text-gray-600 text-sm mb-3">{system.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      {system.highRiskCategory && (
                        <span className="flex items-center gap-1">
                          <Shield className="w-4 h-4" />
                          Category: {system.highRiskCategory.replace('_', ' ')}
                        </span>
                      )}
                      {system.isGenerative && (
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          Generative AI
                        </span>
                      )}
                      {system.isGeneralPurpose && (
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          General Purpose
                        </span>
                      )}
                      {system.registeredInEUDatabase && (
                        <span className="flex items-center gap-1">
                          <Database className="w-4 h-4" />
                          EU Database Registered
                        </span>
                      )}
                    </div>
                    {system.prohibitedPractices.length > 0 && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm font-medium text-red-800 mb-1">⚠️ Prohibited Practices Detected:</p>
                        <ul className="text-sm text-red-700 list-disc list-inside">
                          {system.prohibitedPractices.map((practice, idx) => (
                            <li key={idx}>{practice.replace('_', ' ')}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    {system.riskLevel === 'high' && (
                      <button
                        onClick={async () => {
                          setSelectedSystem(system);
                          // Load existing assessment if available
                          try {
                            const response = await api.euRegulations.aiAct.getLatestRiskAssessment(system.id);
                            if (response.assessment) {
                              const assessment = response.assessment;
                              setAssessmentForm({
                                safetyRisks: assessment.findings?.safetyRisks || [],
                                fundamentalRightsRisks: assessment.findings?.fundamentalRightsRisks || [],
                                discriminationRisks: assessment.findings?.discriminationRisks || [],
                                privacyRisks: assessment.findings?.privacyRisks || [],
                                mitigationMeasures: assessment.mitigationMeasures || [],
                                recommendations: assessment.recommendations || [],
                              });
                            } else {
                              // Reset form if no assessment exists
                              setAssessmentForm({
                                safetyRisks: [],
                                fundamentalRightsRisks: [],
                                discriminationRisks: [],
                                privacyRisks: [],
                                mitigationMeasures: [],
                                recommendations: [],
                              });
                            }
                          } catch (err) {
                            // If no assessment exists, use empty form
                            setAssessmentForm({
                              safetyRisks: [],
                              fundamentalRightsRisks: [],
                              discriminationRisks: [],
                              privacyRisks: [],
                              mitigationMeasures: [],
                              recommendations: [],
                            });
                          }
                          setShowAssessmentModal(true);
                        }}
                        className="px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                      >
                        Assess Risk
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedSystem(system);
                        setShowDetailsModal(true);
                      }}
                      className="px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => {
                        setSelectedSystem(system);
                        setShowStatusUpdateModal(true);
                      }}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      Update Status
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Register System Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Register AI System</h3>
              <button onClick={() => setShowRegisterModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRegisterSystem} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.name')} *</label>
                <input
                  type="text"
                  required
                  value={registrationForm.name}
                  onChange={(e) => setRegistrationForm({ ...registrationForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.description')}</label>
                <textarea
                  value={registrationForm.description}
                  onChange={(e) => setRegistrationForm({ ...registrationForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Use Case *</label>
                <input
                  type="text"
                  required
                  value={registrationForm.useCase}
                  onChange={(e) => setRegistrationForm({ ...registrationForm, useCase: e.target.value })}
                  placeholder="e.g., Healthcare diagnostics, Recruitment screening"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Users</label>
                  <textarea
                    value={registrationForm.targetUsers.join('\n')}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, targetUsers: e.target.value.split('\n').filter(s => s.trim()) })}
                    placeholder="Enter one per line, e.g.:&#10;Healthcare professionals&#10;HR teams"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter one user type per line</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Types</label>
                  <textarea
                    value={registrationForm.dataTypes.join('\n')}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, dataTypes: e.target.value.split('\n').filter(s => s.trim()) })}
                    placeholder="Enter one per line, e.g.:&#10;Medical records&#10;Personal data"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter one data type per line</p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={registrationForm.decisionMaking}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, decisionMaking: e.target.checked })}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Makes automated decisions</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={registrationForm.biometricProcessing}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, biometricProcessing: e.target.checked })}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Processes biometric data</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={registrationForm.realTimeProcessing}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, realTimeProcessing: e.target.checked })}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Real-time processing</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={registrationForm.affectsFundamentalRights}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, affectsFundamentalRights: e.target.checked })}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Affects fundamental rights</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={registrationForm.isGeneralPurpose}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, isGeneralPurpose: e.target.checked })}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">General-purpose AI model</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={registrationForm.isGenerative}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, isGenerative: e.target.checked })}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Generative AI (e.g., ChatGPT, image generators)</span>
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Register System
                </button>
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Risk Assessment Modal */}
      {showAssessmentModal && selectedSystem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Conduct Risk Assessment: {selectedSystem.name}</h3>
              <button onClick={() => setShowAssessmentModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleConductAssessment} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Safety Risks</label>
                <textarea
                  value={assessmentForm.safetyRisks.join('\n')}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, safetyRisks: e.target.value.split('\n').filter(s => s.trim()) })}
                  rows={3}
                  placeholder="List any safety risks identified..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fundamental Rights Risks</label>
                <textarea
                  value={assessmentForm.fundamentalRightsRisks.join('\n')}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, fundamentalRightsRisks: e.target.value.split('\n').filter(s => s.trim()) })}
                  rows={3}
                  placeholder="List any fundamental rights risks..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Discrimination Risks</label>
                <textarea
                  value={assessmentForm.discriminationRisks.join('\n')}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, discriminationRisks: e.target.value.split('\n').filter(s => s.trim()) })}
                  rows={3}
                  placeholder="List any discrimination risks..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Privacy Risks</label>
                <textarea
                  value={assessmentForm.privacyRisks.join('\n')}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, privacyRisks: e.target.value.split('\n').filter(s => s.trim()) })}
                  rows={3}
                  placeholder="List any privacy risks..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mitigation Measures</label>
                <textarea
                  value={assessmentForm.mitigationMeasures.join('\n')}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, mitigationMeasures: e.target.value.split('\n').filter(s => s.trim()) })}
                  rows={3}
                  placeholder="List mitigation measures implemented..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recommendations</label>
                <textarea
                  value={assessmentForm.recommendations.join('\n')}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, recommendations: e.target.value.split('\n').filter(s => s.trim()) })}
                  rows={3}
                  placeholder="List recommendations for improvement..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Submit Assessment
                </button>
                <button
                  type="button"
                  onClick={() => setShowAssessmentModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showDetailsModal && selectedSystem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">{t('common.details')}: {selectedSystem.name}</h3>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">{t('common.description')}</label>
                <p className="text-gray-900 mt-1">{selectedSystem.description || 'No description provided'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">{t('risks.riskLevel')}</label>
                  <p className="text-gray-900 mt-1 capitalize">{selectedSystem.riskLevel}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">{t('common.status')}</label>
                  <p className="text-gray-900 mt-1 capitalize">{selectedSystem.complianceStatus.replace('_', ' ')}</p>
                </div>
              </div>
              {selectedSystem.highRiskCategory && (
                <div>
                  <label className="text-sm font-medium text-gray-700">High-Risk Category</label>
                  <p className="text-gray-900 mt-1 capitalize">{selectedSystem.highRiskCategory.replace('_', ' ')}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">General Purpose AI</label>
                  <p className="text-gray-900 mt-1">{selectedSystem.isGeneralPurpose ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Generative AI</label>
                  <p className="text-gray-900 mt-1">{selectedSystem.isGenerative ? 'Yes' : 'No'}</p>
                </div>
              </div>
              {selectedSystem.prohibitedPractices.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Prohibited Practices</label>
                  <ul className="list-disc list-inside text-gray-900 mt-1">
                    {selectedSystem.prohibitedPractices.map((practice, idx) => (
                      <li key={idx} className="capitalize">{practice.replace('_', ' ')}</li>
                    ))}
                  </ul>
                </div>
              )}
              {selectedSystem.registeredInEUDatabase && (
                <div>
                  <label className="text-sm font-medium text-gray-700">EU Database Registration</label>
                  <p className="text-gray-900 mt-1">
                    {selectedSystem.euDatabaseRegistrationId || 'Registered (ID pending)'}
                  </p>
                </div>
              )}
              {selectedSystem.lastAssessmentDate && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Last Assessment</label>
                  <p className="text-gray-900 mt-1">{new Date(selectedSystem.lastAssessmentDate).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusUpdateModal && selectedSystem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">{t('common.status')}</h3>
              <button onClick={() => setShowStatusUpdateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const statusSelect = (e.target as any).status.value;
                await api.euRegulations.aiAct.updateSystem(selectedSystem.id, { complianceStatus: statusSelect });
                setShowStatusUpdateModal(false);
                await loadSystems();
              } catch (err: any) {
                setError(err.message || 'Failed to update status');
              }
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Compliance Status</label>
                <select
                  name="status"
                  defaultValue={selectedSystem.complianceStatus}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="compliant">Compliant</option>
                  <option value="non_compliant">Non-Compliant</option>
                  <option value="in_review">In Review</option>
                  <option value="at_risk">At Risk</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Update Status
                </button>
                <button
                  type="button"
                  onClick={() => setShowStatusUpdateModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Generate Transparency Report</h3>
              <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Generate a transparency report for all generative AI systems. The report will cover the last 12 months.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleGenerateReport}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Generate Report
                </button>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report View Modal */}
      {showReportViewModal && generatedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Transparency Report (Past 12 Months)</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadReport}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {t('common.download')}
                </button>
                <button onClick={() => setShowReportViewModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This report aggregates all transparency reports from the past 12 months, providing a comprehensive view of your AI systems' compliance status.
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Reporting Period</label>
                <p className="text-gray-900 mt-1">
                  {new Date(generatedReport.reportingPeriod.start).toLocaleDateString()} - {new Date(generatedReport.reportingPeriod.end).toLocaleDateString()}
                </p>
                {allReports.length > 1 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Aggregated from {allReports.length} individual reports
                  </p>
                )}
              </div>

              {/* System Counts Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600">Total Registered Systems</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{systems.length}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-600">Generative AI Systems</p>
                  <p className="text-3xl font-bold text-blue-900 mt-1">{systems.filter(s => s.isGenerative).length}</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm text-gray-600">{t('euRegulations.highRisk')}</p>
                  <p className="text-3xl font-bold text-orange-900 mt-1">{systems.filter(s => s.riskLevel === 'high').length}</p>
                </div>
              </div>

              {/* Generative AI Systems */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2">
                  Generative AI Systems ({generatedReport.generativeAISystems?.length || 0})
                </label>
                {generatedReport.generativeAISystems && generatedReport.generativeAISystems.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {generatedReport.generativeAISystems.map((system: any, idx: number) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{system.systemName}</p>
                            <div className="mt-2 grid grid-cols-2 gap-4 text-xs text-gray-600">
                              <div>
                                <span className="font-medium">AI Labeling Compliance:</span> {system.aiLabelingCompliance}%
                              </div>
                              <div>
                                <span className="font-medium">Copyright Compliance:</span> {system.copyrightCompliance}%
                              </div>
                              <div>
                                <span className="font-medium">Content Generated:</span> {system.contentGenerated.toLocaleString()}
                              </div>
                              <div>
                                <span className="font-medium">Illegal Content Prevented:</span> {system.illegalContentPrevented}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mt-2">No generative AI systems found in the reporting period.</p>
                )}
              </div>

              {/* {t('euRegulations.highRisk')} */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2">
                  High-Risk AI Systems ({generatedReport.highRiskSystems?.length || 0})
                </label>
                {generatedReport.highRiskSystems && generatedReport.highRiskSystems.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {generatedReport.highRiskSystems.map((system: any, idx: number) => (
                      <div key={idx} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{system.systemName}</p>
                            <div className="mt-2 grid grid-cols-2 gap-4 text-xs text-gray-600">
                              <div>
                                <span className="font-medium">Assessments Completed:</span> {system.assessmentsCompleted}
                              </div>
                              <div>
                                <span className="font-medium">Incidents Reported:</span> {system.incidentsReported}
                              </div>
                              <div>
                                <span className="font-medium">Compliance Status:</span> 
                                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                                  system.complianceStatus === 'compliant' ? 'bg-green-100 text-green-800' :
                                  system.complianceStatus === 'non_compliant' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {system.complianceStatus.replace('_', ' ').toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mt-2">No high-risk AI systems found in the reporting period.</p>
                )}
              </div>

              {/* Summary Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">Prohibited Practices</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{generatedReport.prohibitedPracticesDetected || 0}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">Complaints Received</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{generatedReport.complaintsReceived || 0}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">Complaints Resolved</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{generatedReport.complaintsResolved || 0}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">Resolution Rate</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {generatedReport.complaintsReceived > 0 
                      ? Math.round((generatedReport.complaintsResolved / generatedReport.complaintsReceived) * 100)
                      : 0}%
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowReportViewModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  {t('common.close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

