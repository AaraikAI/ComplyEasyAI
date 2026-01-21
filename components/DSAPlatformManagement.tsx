/**
 * Digital Services Act (DSA) Platform Management
 * 
 * Comprehensive management interface for DSA compliance:
 * - Platform registration and VLOP/VLOSE designation
 * - Content moderation tracking
 * - Illegal content reporting
 * - Ad repository management (VLOP requirement)
 * - Transparency reporting
 * 
 * Reference: Regulation (EU) 2022/2065
 */

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Globe, CheckCircle, AlertTriangle, X, Plus, FileText, Shield, Users, Eye, Megaphone, Ban } from 'lucide-react';

interface DSAPlatform {
  id: string;
  platformName: string;
  platformType: string;
  monthlyActiveUsers?: number;
  isVLOP: boolean;
  isVLOSE: boolean;
  complianceStatus: 'compliant' | 'non_compliant' | 'in_review';
  designationDate?: string;
}

interface ContentModeration {
  id: string;
  actionType: string;
  contentType: string;
  reason: string;
  automatedDecision: boolean;
  appealStatus?: string;
  createdAt: string;
}

interface IllegalContentReport {
  id: string;
  reportedBy: string;
  isTrustedFlagger: boolean;
  contentType: string;
  reason: string;
  status: string;
  actionTaken?: string;
  responseTime?: number;
  createdAt: string;
}

export const DSAPlatformManagement: React.FC = () => {
  const [platforms, setPlatforms] = useState<DSAPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<DSAPlatform | null>(null);
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [showRiskAssessmentModal, setShowRiskAssessmentModal] = useState(false);
  const [showFeedConfigModal, setShowFeedConfigModal] = useState(false);
  const [showEditAssessmentModal, setShowEditAssessmentModal] = useState(false);
  const [showEditPlatformModal, setShowEditPlatformModal] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<any | null>(null);
  const [moderationHistory, setModerationHistory] = useState<ContentModeration[]>([]);
  const [transparencyReports, setTransparencyReports] = useState<any[]>([]);
  const [riskAssessments, setRiskAssessments] = useState<any[]>([]);
  const [feedConfig, setFeedConfig] = useState<any | null>(null);
  const [latestAssessment, setLatestAssessment] = useState<any | null>(null);
  const [adHistory, setAdHistory] = useState<any[]>([]);
  const [showDSAReportModal, setShowDSAReportModal] = useState(false);
  const [selectedDSAReport, setSelectedDSAReport] = useState<any | null>(null);

  const [registrationForm, setRegistrationForm] = useState({
    platformName: '',
    platformType: 'online_platform',
    monthlyActiveUsers: '',
  });

  const [moderationForm, setModerationForm] = useState({
    actionType: 'removal',
    contentType: '',
    reason: '',
    automatedDecision: false,
  });

  const [illegalContentForm, setIllegalContentForm] = useState({
    reportedBy: '',
    isTrustedFlagger: false,
    contentType: '',
    contentUrl: '',
    reason: '',
  });

  const [adForm, setAdForm] = useState({
    adId: '',
    advertiserName: '',
    adContent: { text: '', images: [] as string[], targetAudience: [] as string[] },
    targetingCriteria: { demographics: [] as string[], interests: [] as string[] },
    displayPeriod: { start: '', end: '' },
    isPoliticalAd: false,
  });

  const [riskAssessmentForm, setRiskAssessmentForm] = useState({
    riskCategory: 'illegal_content' as 'illegal_content' | 'fundamental_rights' | 'public_security' | 'protection_of_minors',
    illegalContentRisks: { risks: [] as string[], severity: 'low' as 'low' | 'medium' | 'high' | 'critical', description: '' },
    fundamentalRightsRisks: { risks: [] as string[], severity: 'low' as 'low' | 'medium' | 'high' | 'critical', description: '' },
    publicSecurityRisks: { risks: [] as string[], severity: 'low' as 'low' | 'medium' | 'high' | 'critical', description: '' },
    protectionOfMinorsRisks: { risks: [] as string[], severity: 'low' as 'low' | 'medium' | 'high' | 'critical', description: '' },
    mitigationMeasures: [] as Array<{ measure: string; status: 'planned' | 'in_progress' | 'implemented' | 'verified'; targetDate?: string; responsibleParty?: string }>,
    nextReviewDate: '',
  });

  const [feedConfigForm, setFeedConfigForm] = useState({
    isEnabled: false,
    userOptInMethod: 'toggle' as 'toggle' | 'settings_page' | 'onboarding',
    feedAlgorithmType: 'chronological' as 'chronological' | 'popularity' | 'random',
    description: '',
    userDocumentationUrl: '',
    implementationDate: '',
    notes: '',
  });

  useEffect(() => {
    loadPlatforms();
  }, []);

  const loadPlatforms = async () => {
    try {
      setLoading(true);
      const response = await api.euRegulations.dsa.getPlatforms();
      setPlatforms(response.platforms || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load platforms');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterPlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await api.euRegulations.dsa.registerPlatform({
        platformName: registrationForm.platformName,
        platformType: registrationForm.platformType,
        monthlyActiveUsers: registrationForm.monthlyActiveUsers ? parseInt(registrationForm.monthlyActiveUsers) : undefined,
      });
      setShowRegisterModal(false);
      setRegistrationForm({
        platformName: '',
        platformType: 'online_platform',
        monthlyActiveUsers: '',
      });
      await loadPlatforms();
    } catch (err: any) {
      setError(err.message || 'Failed to register platform');
    }
  };

  const handleRecordModeration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlatform) return;

    try {
      setError(null);
      await api.euRegulations.dsa.recordContentModeration(selectedPlatform.id, moderationForm);
      
      // Reset form but keep modal open
      setModerationForm({
        actionType: 'removal',
        contentType: '',
        reason: '',
        automatedDecision: false,
      });
      
      // Reload moderation history immediately to show the new record
      await loadModerationHistory(selectedPlatform.id);
      
      // Reload platforms in the background
      await loadPlatforms();
    } catch (err: any) {
      setError(err.message || 'Failed to record content moderation');
    }
  };

  const loadModerationHistory = async (platformId: string) => {
    try {
      const historyResponse = await api.euRegulations.dsa.getContentModerationHistory(platformId);
      setModerationHistory(
        (historyResponse.history || []).map((r: any) => ({
          id: r.id,
          actionType: r.actionType,
          contentType: r.contentType,
          reason: r.reason,
          automatedDecision: r.automatedDecision,
          appealStatus: r.appealStatus,
          createdAt: r.createdAt,
        })),
      );
    } catch (err: any) {
      // Do not block UI on history failure; just log error locally
      console.error('Failed to load moderation history', err);
    }
  };

  const loadTransparencyReports = async (platformId: string) => {
    try {
      const response = await api.euRegulations.dsa.getTransparencyReports(platformId);
      setTransparencyReports(response.reports || []);
    } catch (err: any) {
      console.error('Failed to load transparency reports', err);
    }
  };

  const loadRiskAssessments = async (platformId: string) => {
    try {
      const response = await api.euRegulations.dsa.getRiskAssessments(platformId);
      setRiskAssessments(response.assessments || []);
    } catch (err: any) {
      console.error('Failed to load risk assessments', err);
    }
  };

  const loadFeedConfig = async (platformId: string) => {
    try {
      const response = await api.euRegulations.dsa.getNonPersonalizedFeed(platformId);
      if (response.feedConfig) {
        setFeedConfig(response.feedConfig);
        setFeedConfigForm({
          isEnabled: response.feedConfig.isEnabled,
          userOptInMethod: response.feedConfig.userOptInMethod,
          feedAlgorithmType: response.feedConfig.feedAlgorithmType,
          description: response.feedConfig.description || '',
          userDocumentationUrl: response.feedConfig.userDocumentationUrl || '',
          implementationDate: response.feedConfig.implementationDate ? new Date(response.feedConfig.implementationDate).toISOString().split('T')[0] : '',
          notes: response.feedConfig.notes || '',
        });
      } else {
        setFeedConfig(null);
        setFeedConfigForm({
          isEnabled: false,
          userOptInMethod: 'toggle',
          feedAlgorithmType: 'chronological',
          description: '',
          userDocumentationUrl: '',
          implementationDate: '',
          notes: '',
        });
      }
    } catch (err: any) {
      console.error('Failed to load feed config', err);
    }
  };

  const handleReportIllegalContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlatform) return;

    try {
      setError(null);
      await api.euRegulations.dsa.reportIllegalContent(selectedPlatform.id, illegalContentForm);
      setShowReportModal(false);
      setIllegalContentForm({
        reportedBy: '',
        isTrustedFlagger: false,
        contentType: '',
        contentUrl: '',
        reason: '',
      });
      await loadPlatforms();
    } catch (err: any) {
      setError(err.message || 'Failed to report illegal content');
    }
  };

  const loadAdHistory = async (platformId: string) => {
    try {
      const response = await api.euRegulations.dsa.getAdsFromRepository(platformId);
      setAdHistory(response.ads || []);
    } catch (err: any) {
      console.error('Failed to load ad history', err);
    }
  };

  const handleAddAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlatform) return;

    try {
      setError(null);
      await api.euRegulations.dsa.addAdToRepository(selectedPlatform.id, {
        ...adForm,
        displayPeriod: {
          start: new Date(adForm.displayPeriod.start),
          end: new Date(adForm.displayPeriod.end),
        },
      });
      await loadAdHistory(selectedPlatform.id);
      setShowAdModal(false);
      setAdForm({
        adId: '',
        advertiserName: '',
        adContent: { text: '', images: [], targetAudience: [] },
        targetingCriteria: { demographics: [], interests: [] },
        displayPeriod: { start: '', end: '' },
        isPoliticalAd: false,
      });
      await loadPlatforms();
    } catch (err: any) {
      setError(err.message || 'Failed to add ad to repository');
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedPlatform) return;
    try {
      setError(null);
      
      // Check if platform is VLOP or VLOSE
      if (!selectedPlatform.isVLOP && !selectedPlatform.isVLOSE) {
        setError('Transparency reports are only required for Very Large Online Platforms (VLOPs) and Very Large Online Search Engines (VLOSE) with more than 45 million monthly active users.');
        return;
      }

      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 12);

      const response = await api.euRegulations.dsa.generateTransparencyReport(selectedPlatform.id, {
        start: startDate,
        end: endDate,
      });
      setSelectedDSAReport(response.report);
      setShowDSAReportModal(true);
      await loadTransparencyReports(selectedPlatform.id);
    } catch (err: any) {
      setError(err.message || 'Failed to generate transparency report');
    }
  };

  const handleConductRiskAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlatform) return;

    try {
      setError(null);
      const assessmentData = {
        riskCategory: riskAssessmentForm.riskCategory,
        illegalContentRisks: riskAssessmentForm.illegalContentRisks.risks.length > 0 ? riskAssessmentForm.illegalContentRisks : undefined,
        fundamentalRightsRisks: riskAssessmentForm.fundamentalRightsRisks.risks.length > 0 ? riskAssessmentForm.fundamentalRightsRisks : undefined,
        publicSecurityRisks: riskAssessmentForm.publicSecurityRisks.risks.length > 0 ? riskAssessmentForm.publicSecurityRisks : undefined,
        protectionOfMinorsRisks: riskAssessmentForm.protectionOfMinorsRisks.risks.length > 0 ? riskAssessmentForm.protectionOfMinorsRisks : undefined,
        mitigationMeasures: riskAssessmentForm.mitigationMeasures.map(m => ({
          ...m,
          targetDate: m.targetDate ? new Date(m.targetDate) : undefined,
        })),
        nextReviewDate: riskAssessmentForm.nextReviewDate ? new Date(riskAssessmentForm.nextReviewDate) : undefined,
      };

      const response = await api.euRegulations.dsa.conductRiskAssessment(selectedPlatform.id, assessmentData);
      setLatestAssessment(response.assessment);
      await loadRiskAssessments(selectedPlatform.id);
      await loadPlatforms();
      // Don't close modal - show results instead
    } catch (err: any) {
      setError(err.message || 'Failed to conduct risk assessment');
    }
  };

  const handleConfigureFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlatform) return;

    try {
      setError(null);
      await api.euRegulations.dsa.configureNonPersonalizedFeed(selectedPlatform.id, {
        ...feedConfigForm,
        implementationDate: feedConfigForm.implementationDate ? new Date(feedConfigForm.implementationDate) : undefined,
      });
      setShowFeedConfigModal(false);
      await loadFeedConfig(selectedPlatform.id);
      await loadPlatforms();
    } catch (err: any) {
      setError(err.message || 'Failed to configure non-personalized feed');
    }
  };

  const getPlatformTypeColor = (type: string) => {
    if (type.includes('very_large')) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-blue-100 text-blue-800 border-blue-300';
  };

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'text-green-600';
      case 'non_compliant':
        return 'text-red-600';
      default:
        return 'text-gray-600';
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
          <h2 className="text-2xl font-bold text-gray-900">Digital Services Act (DSA) Compliance</h2>
          <p className="text-gray-600 mt-1">Manage online platforms and ensure DSA compliance (Regulation EU 2022/2065)</p>
        </div>
        <button
          onClick={() => setShowRegisterModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Register Platform
        </button>
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

      {/* Transparency Reports List (lightweight UI) */}
      {selectedPlatform && (selectedPlatform.isVLOP || selectedPlatform.isVLOSE) && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mt-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            Transparency Reports for {selectedPlatform.platformName}
          </h3>
          {transparencyReports.length === 0 ? (
            <p className="text-sm text-gray-500">
              No transparency reports generated yet for this platform.
            </p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {transparencyReports.map((report: any) => (
                <div key={report.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs">
                  <div className="flex justify-between">
                    <span className="font-medium">
                      {new Date(report.reportingPeriod.start).toLocaleDateString()} –{' '}
                      {new Date(report.reportingPeriod.end).toLocaleDateString()}
                    </span>
                    <span className="text-gray-500">
                      Created: {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="mt-1 text-gray-700">
                    <span className="font-medium">Removals:</span>{' '}
                    {report.contentModerationStats?.totalRemovals ?? 0}
                    {' • '}
                    <span className="font-medium">Suspensions:</span>{' '}
                    {report.contentModerationStats?.totalSuspensions ?? 0}
                    {' • '}
                    <span className="font-medium">Appeals:</span>{' '}
                    {report.contentModerationStats?.appealsReceived ?? 0}
                  </div>
                  <div className="mt-1 text-gray-700">
                    <span className="font-medium">User reports:</span>{' '}
                    {report.userReports?.totalReports ?? 0}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Platforms</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{platforms.length}</p>
            </div>
            <Globe className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">VLOPs</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {platforms.filter(p => p.isVLOP).length}
              </p>
            </div>
            <Shield className="w-8 h-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">VLOSE</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {platforms.filter(p => p.isVLOSE).length}
              </p>
            </div>
            <Eye className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Compliant</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {platforms.filter(p => p.complianceStatus === 'compliant').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Platforms List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Registered Platforms</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {platforms.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Globe className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No platforms registered yet</p>
              <button
                onClick={() => setShowRegisterModal(true)}
                className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Register your first platform
              </button>
            </div>
          ) : (
            platforms.map((platform) => (
              <div key={platform.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">{platform.platformName}</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPlatformTypeColor(platform.platformType)}`}>
                        {platform.platformType.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      {platform.isVLOP && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-300">
                          VLOP
                        </span>
                      )}
                      {platform.isVLOSE && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-300">
                          VLOSE
                        </span>
                      )}
                      <span className={`text-sm font-medium ${getComplianceStatusColor(platform.complianceStatus)}`}>
                        {platform.complianceStatus.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedPlatform(platform);
                        setShowEditPlatformModal(true);
                      }}
                      className="px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                    >
                      Edit
                    </button>
                    <div className="flex gap-4 text-sm text-gray-600 mt-3">
                      {platform.monthlyActiveUsers && (
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {(platform.monthlyActiveUsers / 1000000).toFixed(1)}M monthly users
                        </span>
                      )}
                      {platform.designationDate && (
                        <span className="flex items-center gap-1">
                          <Shield className="w-4 h-4" />
                          Designated: {new Date(platform.designationDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {platform.isVLOP && (
                      <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <p className="text-sm font-medium text-orange-800 mb-1">VLOP Requirements:</p>
                        <ul className="text-sm text-orange-700 list-disc list-inside space-y-1">
                          <li>Ad repository maintenance</li>
                          <li>Annual transparency reporting</li>
                          <li>Risk assessment and mitigation</li>
                          <li>Non-personalized feed option</li>
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={async () => {
                        setSelectedPlatform(platform);
                        await loadModerationHistory(platform.id);
                        setShowModerationModal(true);
                      }}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Record Moderation
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPlatform(platform);
                        setShowReportModal(true);
                      }}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                    >
                      Report Illegal Content
                    </button>
                    {platform.isVLOP && (
                      <button
                        onClick={async () => {
                          setSelectedPlatform(platform);
                          await loadAdHistory(platform.id);
                          setShowAdModal(true);
                        }}
                        className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                      >
                        Add Ad to Repository
                      </button>
                    )}
                    {(platform.isVLOP || platform.isVLOSE) && (
                      <>
                        <button
                          onClick={async () => {
                            setSelectedPlatform(platform);
                            await loadRiskAssessments(platform.id);
                            setShowRiskAssessmentModal(true);
                          }}
                          className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                        >
                          Conduct Risk Assessment
                        </button>
                        <button
                          onClick={async () => {
                            setSelectedPlatform(platform);
                            await loadTransparencyReports(platform.id);
                            handleGenerateReport();
                          }}
                          className="px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                        >
                          Generate Report
                        </button>
                      </>
                    )}
                    {platform.isVLOP && (
                      <button
                        onClick={async () => {
                          setSelectedPlatform(platform);
                          await loadFeedConfig(platform.id);
                          setShowFeedConfigModal(true);
                        }}
                        className="px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm"
                      >
                        Configure Non-Personalized Feed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Register Platform Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Register Platform</h3>
              <button onClick={() => setShowRegisterModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRegisterPlatform} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Platform Name *</label>
                <input
                  type="text"
                  required
                  value={registrationForm.platformName}
                  onChange={(e) => setRegistrationForm({ ...registrationForm, platformName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Platform Type *</label>
                <select
                  required
                  value={registrationForm.platformType}
                  onChange={(e) => setRegistrationForm({ ...registrationForm, platformType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="online_platform">Online Platform</option>
                  <option value="very_large_online_platform">Very Large Online Platform (VLOP)</option>
                  <option value="very_large_search_engine">Very Large Online Search Engine (VLOSE)</option>
                  <option value="intermediary_service">Intermediary Service</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Active Users (EU)</label>
                <input
                  type="number"
                  value={registrationForm.monthlyActiveUsers}
                  onChange={(e) => setRegistrationForm({ ...registrationForm, monthlyActiveUsers: e.target.value })}
                  placeholder="e.g., 45000000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">Threshold: 45M users for VLOP/VLOSE designation</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Register Platform
                </button>
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Content Moderation Modal */}
      {showModerationModal && selectedPlatform && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Record Content Moderation: {selectedPlatform.platformName}</h3>
              <button onClick={() => setShowModerationModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRecordModeration} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action Type *</label>
                <select
                  required
                  value={moderationForm.actionType}
                  onChange={(e) => setModerationForm({ ...moderationForm, actionType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="removal">Removal</option>
                  <option value="suspension">Suspension</option>
                  <option value="restriction">Restriction</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content Type *</label>
                <input
                  type="text"
                  required
                  value={moderationForm.contentType}
                  onChange={(e) => setModerationForm({ ...moderationForm, contentType: e.target.value })}
                  placeholder="e.g., post, comment, video, image"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                <textarea
                  required
                  value={moderationForm.reason}
                  onChange={(e) => setModerationForm({ ...moderationForm, reason: e.target.value })}
                  rows={4}
                  placeholder="Explain the reason for this moderation action..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={moderationForm.automatedDecision}
                    onChange={(e) => setModerationForm({ ...moderationForm, automatedDecision: e.target.checked })}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Automated decision</span>
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Record Moderation
                </button>
                <button
                  type="button"
                  onClick={() => setShowModerationModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
              <div className="mt-6 border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Recent Moderation History</h4>
                {moderationHistory.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {moderationHistory.map((record) => (
                      <div key={record.id} className="p-2 bg-gray-50 rounded border border-gray-200 text-xs">
                        <div className="flex justify-between">
                          <span className="font-medium">{record.actionType.toUpperCase()}</span>
                          <span className="text-gray-500">
                            {new Date(record.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="mt-1 text-gray-700">
                          <span className="font-medium">Content:</span> {record.contentType}
                        </div>
                        <div className="mt-1 text-gray-700">
                          <span className="font-medium">Reason:</span> {record.reason}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No moderation history recorded yet.</p>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Illegal Content Report Modal */}
      {showReportModal && selectedPlatform && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Report Illegal Content: {selectedPlatform.platformName}</h3>
              <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleReportIllegalContent} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reported By *</label>
                <input
                  type="text"
                  required
                  value={illegalContentForm.reportedBy}
                  onChange={(e) => setIllegalContentForm({ ...illegalContentForm, reportedBy: e.target.value })}
                  placeholder="User ID or name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={illegalContentForm.isTrustedFlagger}
                    onChange={(e) => setIllegalContentForm({ ...illegalContentForm, isTrustedFlagger: e.target.checked })}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Trusted Flagger (priority processing)</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content Type *</label>
                <input
                  type="text"
                  required
                  value={illegalContentForm.contentType}
                  onChange={(e) => setIllegalContentForm({ ...illegalContentForm, contentType: e.target.value })}
                  placeholder="e.g., post, video, image"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content URL</label>
                <input
                  type="url"
                  value={illegalContentForm.contentUrl}
                  onChange={(e) => setIllegalContentForm({ ...illegalContentForm, contentUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                <textarea
                  required
                  value={illegalContentForm.reason}
                  onChange={(e) => setIllegalContentForm({ ...illegalContentForm, reason: e.target.value })}
                  rows={4}
                  placeholder="Explain why this content is illegal..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Report Illegal Content
                </button>
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Ad to Repository Modal (VLOP only) */}
      {showAdModal && selectedPlatform && selectedPlatform.isVLOP && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Add Ad to Repository: {selectedPlatform.platformName}</h3>
              <button onClick={() => setShowAdModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddAd} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ad ID *</label>
                  <input
                    type="text"
                    required
                    value={adForm.adId}
                    onChange={(e) => setAdForm({ ...adForm, adId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Advertiser Name *</label>
                  <input
                    type="text"
                    required
                    value={adForm.advertiserName}
                    onChange={(e) => setAdForm({ ...adForm, advertiserName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Content (Text)</label>
                <textarea
                  value={adForm.adContent.text}
                  onChange={(e) => setAdForm({ ...adForm, adContent: { ...adForm.adContent, text: e.target.value } })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Start Date *</label>
                  <input
                    type="date"
                    required
                    value={adForm.displayPeriod.start}
                    onChange={(e) => setAdForm({ ...adForm, displayPeriod: { ...adForm.displayPeriod, start: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display End Date *</label>
                  <input
                    type="date"
                    required
                    value={adForm.displayPeriod.end}
                    onChange={(e) => setAdForm({ ...adForm, displayPeriod: { ...adForm.displayPeriod, end: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={adForm.isPoliticalAd}
                    onChange={(e) => setAdForm({ ...adForm, isPoliticalAd: e.target.checked })}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Political Advertisement</span>
                </label>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <Ban className="w-4 h-4 inline mr-1" />
                  <strong>Note:</strong> Targeted advertising to minors is automatically prohibited under the DSA.
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Add to Repository
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>

            {/* Ad History */}
            <div className="p-6 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Ad Repository History ({adHistory.length})</h4>
              {adHistory.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {adHistory.map((ad: any) => (
                    <div key={ad.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">{ad.advertiserName}</span>
                        <span className="text-gray-500">Ad ID: {ad.adId}</span>
                      </div>
                      <div className="text-gray-600">
                        Period: {new Date(ad.displayPeriod.start).toLocaleDateString()} - {new Date(ad.displayPeriod.end).toLocaleDateString()}
                      </div>
                      {ad.isPoliticalAd && (
                        <span className="inline-block mt-1 px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">Political Ad</span>
                      )}
                      <div className="text-gray-500 mt-1">
                        Added: {new Date(ad.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No ads added to repository yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Platform Modal */}
      {showEditPlatformModal && selectedPlatform && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Edit Platform: {selectedPlatform.platformName}</h3>
              <button onClick={() => setShowEditPlatformModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const formData = new FormData(e.target as HTMLFormElement);
                const complianceStatus = formData.get('complianceStatus') as string;
                await api.euRegulations.dsa.updatePlatform(selectedPlatform.id, { complianceStatus });
                setShowEditPlatformModal(false);
                await loadPlatforms();
                alert('Platform updated successfully');
              } catch (err: any) {
                setError(err.message || 'Failed to update platform');
              }
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Compliance Status *</label>
                <select
                  name="complianceStatus"
                  defaultValue={selectedPlatform.complianceStatus}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="compliant">Compliant</option>
                  <option value="non_compliant">Non-Compliant</option>
                  <option value="in_review">In Review</option>
                </select>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Platform Details</h4>
                <div className="space-y-1 text-xs text-gray-600">
                  <p><strong>Platform Name:</strong> {selectedPlatform.platformName}</p>
                  <p><strong>Platform Type:</strong> {selectedPlatform.platformType.replace(/_/g, ' ')}</p>
                  {selectedPlatform.monthlyActiveUsers && (
                    <p><strong>Monthly Active Users:</strong> {(selectedPlatform.monthlyActiveUsers / 1000000).toFixed(1)}M</p>
                  )}
                  {selectedPlatform.isVLOP && <p><strong>Status:</strong> VLOP</p>}
                  {selectedPlatform.isVLOSE && <p><strong>Status:</strong> VLOSE</p>}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Update Platform
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditPlatformModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Risk Assessment Modal */}
      {showRiskAssessmentModal && selectedPlatform && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Conduct Risk Assessment: {selectedPlatform.platformName}</h3>
              <button onClick={() => setShowRiskAssessmentModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleConductRiskAssessment} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Risk Category *</label>
                <select
                  required
                  value={riskAssessmentForm.riskCategory}
                  onChange={(e) => setRiskAssessmentForm({ ...riskAssessmentForm, riskCategory: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="illegal_content">Illegal Content</option>
                  <option value="fundamental_rights">Fundamental Rights</option>
                  <option value="public_security">Public Security</option>
                  <option value="protection_of_minors">Protection of Minors</option>
                </select>
              </div>

              {/* Risk Sections */}
              {['illegal_content', 'fundamental_rights', 'public_security', 'protection_of_minors'].map((category) => {
                const key = category as keyof typeof riskAssessmentForm;
                const riskData = (riskAssessmentForm[key] as { risks: string[]; severity: string; description: string }) || { risks: [], severity: 'low', description: '' };
                return (
                  <div key={category} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 capitalize">{category.replace(/_/g, ' ')}</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Severity</label>
                        <select
                          value={riskData.severity || 'low'}
                          onChange={(e) => setRiskAssessmentForm({
                            ...riskAssessmentForm,
                            [key]: { ...riskData, severity: e.target.value as any }
                          })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Description {(riskData.severity === 'high' || riskData.severity === 'critical') && <span className="text-red-500">*</span>}
                        </label>
                        <textarea
                          required={riskData.severity === 'high' || riskData.severity === 'critical'}
                          value={riskData.description || ''}
                          onChange={(e) => setRiskAssessmentForm({
                            ...riskAssessmentForm,
                            [key]: { ...riskData, description: e.target.value }
                          })}
                          rows={3}
                          className={`w-full px-2 py-1 border rounded text-sm ${
                            (riskData.severity === 'high' || riskData.severity === 'critical') && !riskData.description
                              ? 'border-red-300 focus:ring-red-500'
                              : 'border-gray-300'
                          }`}
                          placeholder="Describe the risks..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Specific Risks (one per line) {(riskData.severity === 'high' || riskData.severity === 'critical') && <span className="text-red-500">*</span>}
                        </label>
                        <textarea
                          required={riskData.severity === 'high' || riskData.severity === 'critical'}
                          value={(riskData.risks || []).join('\n')}
                          onChange={(e) => setRiskAssessmentForm({
                            ...riskAssessmentForm,
                            [key]: { ...riskData, risks: e.target.value.split('\n').filter(r => r.trim()) }
                          })}
                          rows={3}
                          className={`w-full px-2 py-1 border rounded text-sm ${
                            (riskData.severity === 'high' || riskData.severity === 'critical') && (!riskData.risks || riskData.risks.length === 0)
                              ? 'border-red-300 focus:ring-red-500'
                              : 'border-gray-300'
                          }`}
                          placeholder="Enter risks, one per line..."
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Mitigation Measures */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mitigation Measures</label>
                <div className="space-y-2">
                  {riskAssessmentForm.mitigationMeasures.map((measure, idx) => (
                    <div key={idx} className="flex gap-2 items-start p-2 bg-gray-50 rounded">
                      <input
                        type="text"
                        value={measure.measure}
                        onChange={(e) => {
                          const updated = [...riskAssessmentForm.mitigationMeasures];
                          updated[idx].measure = e.target.value;
                          setRiskAssessmentForm({ ...riskAssessmentForm, mitigationMeasures: updated });
                        }}
                        placeholder="Mitigation measure"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <select
                        value={measure.status}
                        onChange={(e) => {
                          const updated = [...riskAssessmentForm.mitigationMeasures];
                          updated[idx].status = e.target.value as any;
                          setRiskAssessmentForm({ ...riskAssessmentForm, mitigationMeasures: updated });
                        }}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="planned">Planned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="implemented">Implemented</option>
                        <option value="verified">Verified</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = riskAssessmentForm.mitigationMeasures.filter((_, i) => i !== idx);
                          setRiskAssessmentForm({ ...riskAssessmentForm, mitigationMeasures: updated });
                        }}
                        className="px-2 py-1 text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setRiskAssessmentForm({
                      ...riskAssessmentForm,
                      mitigationMeasures: [...riskAssessmentForm.mitigationMeasures, { measure: '', status: 'planned' }]
                    })}
                    className="text-sm text-indigo-600 hover:text-indigo-700"
                  >
                    + Add Mitigation Measure
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Next Review Date</label>
                <input
                  type="date"
                  value={riskAssessmentForm.nextReviewDate}
                  onChange={(e) => setRiskAssessmentForm({ ...riskAssessmentForm, nextReviewDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Conduct Assessment
                </button>
                <button
                  type="button"
                  onClick={() => setShowRiskAssessmentModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>

            {/* Display Assessment Results */}
            {latestAssessment && (
              <div className="p-6 border-t border-gray-200 bg-blue-50">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Assessment Results</h4>
                
                {/* Overall Risk Level */}
                <div className="mb-4 p-4 bg-white rounded-lg border-2 border-gray-300">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Overall Risk Level:</span>
                    <span className={`px-4 py-2 rounded-lg text-sm font-bold ${
                      latestAssessment.overallRiskLevel === 'critical' ? 'bg-red-100 text-red-800 border-2 border-red-300' :
                      latestAssessment.overallRiskLevel === 'high' ? 'bg-orange-100 text-orange-800 border-2 border-orange-300' :
                      latestAssessment.overallRiskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300' :
                      'bg-green-100 text-green-800 border-2 border-green-300'
                    }`}>
                      {latestAssessment.overallRiskLevel.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Assessed on {new Date(latestAssessment.assessmentDate).toLocaleDateString()} • Status: {latestAssessment.status.replace('_', ' ')}
                  </p>
                </div>

                {/* Risk Findings Breakdown */}
                <div className="mb-4">
                  <h5 className="text-xs font-semibold text-gray-900 mb-2">Risk Findings by Category</h5>
                  <div className="space-y-2">
                    {latestAssessment.illegalContentRisks && latestAssessment.illegalContentRisks !== null && (
                      <div className="p-2 bg-white rounded border border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-gray-700">Illegal Content</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            (latestAssessment.illegalContentRisks.severity || 'low') === 'critical' ? 'bg-red-100 text-red-800' :
                            (latestAssessment.illegalContentRisks.severity || 'low') === 'high' ? 'bg-orange-100 text-orange-800' :
                            (latestAssessment.illegalContentRisks.severity || 'low') === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {(latestAssessment.illegalContentRisks.severity || 'low').toUpperCase()}
                          </span>
                        </div>
                        {latestAssessment.illegalContentRisks.description && (
                          <p className="mt-1 text-xs text-gray-600">{latestAssessment.illegalContentRisks.description}</p>
                        )}
                        {latestAssessment.illegalContentRisks.risks && Array.isArray(latestAssessment.illegalContentRisks.risks) && latestAssessment.illegalContentRisks.risks.length > 0 && (
                          <ul className="mt-1 text-xs text-gray-600 list-disc list-inside">
                            {latestAssessment.illegalContentRisks.risks.map((risk: string, idx: number) => (
                              <li key={idx}>{risk}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                    {latestAssessment.fundamentalRightsRisks && latestAssessment.fundamentalRightsRisks !== null && (
                      <div className="p-2 bg-white rounded border border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-gray-700">Fundamental Rights</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            (latestAssessment.fundamentalRightsRisks.severity || 'low') === 'critical' ? 'bg-red-100 text-red-800' :
                            (latestAssessment.fundamentalRightsRisks.severity || 'low') === 'high' ? 'bg-orange-100 text-orange-800' :
                            (latestAssessment.fundamentalRightsRisks.severity || 'low') === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {(latestAssessment.fundamentalRightsRisks.severity || 'low').toUpperCase()}
                          </span>
                        </div>
                        {latestAssessment.fundamentalRightsRisks.description && (
                          <p className="mt-1 text-xs text-gray-600">{latestAssessment.fundamentalRightsRisks.description}</p>
                        )}
                        {latestAssessment.fundamentalRightsRisks.risks && Array.isArray(latestAssessment.fundamentalRightsRisks.risks) && latestAssessment.fundamentalRightsRisks.risks.length > 0 && (
                          <ul className="mt-1 text-xs text-gray-600 list-disc list-inside">
                            {latestAssessment.fundamentalRightsRisks.risks.map((risk: string, idx: number) => (
                              <li key={idx}>{risk}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                    {latestAssessment.publicSecurityRisks && latestAssessment.publicSecurityRisks !== null && (
                      <div className="p-2 bg-white rounded border border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-gray-700">Public Security</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            (latestAssessment.publicSecurityRisks.severity || 'low') === 'critical' ? 'bg-red-100 text-red-800' :
                            (latestAssessment.publicSecurityRisks.severity || 'low') === 'high' ? 'bg-orange-100 text-orange-800' :
                            (latestAssessment.publicSecurityRisks.severity || 'low') === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {(latestAssessment.publicSecurityRisks.severity || 'low').toUpperCase()}
                          </span>
                        </div>
                        {latestAssessment.publicSecurityRisks.description && (
                          <p className="mt-1 text-xs text-gray-600">{latestAssessment.publicSecurityRisks.description}</p>
                        )}
                        {latestAssessment.publicSecurityRisks.risks && Array.isArray(latestAssessment.publicSecurityRisks.risks) && latestAssessment.publicSecurityRisks.risks.length > 0 && (
                          <ul className="mt-1 text-xs text-gray-600 list-disc list-inside">
                            {latestAssessment.publicSecurityRisks.risks.map((risk: string, idx: number) => (
                              <li key={idx}>{risk}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                    {latestAssessment.protectionOfMinorsRisks && latestAssessment.protectionOfMinorsRisks !== null && (
                      <div className="p-2 bg-white rounded border border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-gray-700">Protection of Minors</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            (latestAssessment.protectionOfMinorsRisks.severity || 'low') === 'critical' ? 'bg-red-100 text-red-800' :
                            (latestAssessment.protectionOfMinorsRisks.severity || 'low') === 'high' ? 'bg-orange-100 text-orange-800' :
                            (latestAssessment.protectionOfMinorsRisks.severity || 'low') === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {(latestAssessment.protectionOfMinorsRisks.severity || 'low').toUpperCase()}
                          </span>
                        </div>
                        {latestAssessment.protectionOfMinorsRisks.description && (
                          <p className="mt-1 text-xs text-gray-600">{latestAssessment.protectionOfMinorsRisks.description}</p>
                        )}
                        {latestAssessment.protectionOfMinorsRisks.risks && Array.isArray(latestAssessment.protectionOfMinorsRisks.risks) && latestAssessment.protectionOfMinorsRisks.risks.length > 0 && (
                          <ul className="mt-1 text-xs text-gray-600 list-disc list-inside">
                            {latestAssessment.protectionOfMinorsRisks.risks.map((risk: string, idx: number) => (
                              <li key={idx}>{risk}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Mitigation Measures Summary */}
                {latestAssessment.mitigationMeasures && latestAssessment.mitigationMeasures.length > 0 && (
                  <div className="mb-4">
                    <h5 className="text-xs font-semibold text-gray-900 mb-2">Mitigation Measures ({latestAssessment.mitigationMeasures.length})</h5>
                    <div className="space-y-1">
                      {latestAssessment.mitigationMeasures.map((measure: any, idx: number) => (
                        <div key={idx} className="p-2 bg-white rounded border border-gray-200 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700">{measure.measure}</span>
                            <span className={`px-2 py-1 rounded ${
                              measure.status === 'verified' ? 'bg-green-100 text-green-800' :
                              measure.status === 'implemented' ? 'bg-blue-100 text-blue-800' :
                              measure.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {measure.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Next Review Date */}
                {latestAssessment.nextReviewDate && (
                  <div className="mb-4 p-2 bg-white rounded border border-gray-200">
                    <span className="text-xs font-medium text-gray-700">Next Review Date: </span>
                    <span className="text-xs text-gray-900">{new Date(latestAssessment.nextReviewDate).toLocaleDateString()}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setLatestAssessment(null);
                      setRiskAssessmentForm({
                        riskCategory: 'illegal_content',
                        illegalContentRisks: { risks: [], severity: 'low', description: '' },
                        fundamentalRightsRisks: { risks: [], severity: 'low', description: '' },
                        publicSecurityRisks: { risks: [], severity: 'low', description: '' },
                        protectionOfMinorsRisks: { risks: [], severity: 'low', description: '' },
                        mitigationMeasures: [],
                        nextReviewDate: '',
                      });
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                  >
                    Create New Assessment
                  </button>
                  <button
                    onClick={() => {
                      setLatestAssessment(null);
                      setShowRiskAssessmentModal(false);
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Display existing assessments */}
            {riskAssessments.length > 0 && !latestAssessment && (
              <div className="p-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Previous Risk Assessments</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {riskAssessments.map((assessment) => (
                    <div key={assessment.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs">
                      <div className="flex justify-between mb-2">
                        <span className="font-medium capitalize">{assessment.riskCategory.replace(/_/g, ' ')}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          assessment.overallRiskLevel === 'critical' ? 'bg-red-100 text-red-800' :
                          assessment.overallRiskLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                          assessment.overallRiskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {assessment.overallRiskLevel.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-gray-600 mb-2">
                        Assessed: {new Date(assessment.assessmentDate).toLocaleDateString()}
                      </div>
                      <div className="text-gray-600 flex items-center gap-2 mb-2">
                        <span>Status:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          assessment.status === 'approved' ? 'bg-green-100 text-green-800' :
                          assessment.status === 'in_review' ? 'bg-yellow-100 text-yellow-800' :
                          assessment.status === 'requires_action' ? 'bg-orange-100 text-orange-800' :
                          assessment.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {assessment.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        {assessment.status !== 'approved' && (
                          <button
                            onClick={async () => {
                              try {
                                await api.euRegulations.dsa.updateRiskAssessment(assessment.id, { status: 'approved' });
                                await loadRiskAssessments(selectedPlatform!.id);
                                alert('Risk assessment approved successfully');
                              } catch (err: any) {
                                setError(err.message || 'Failed to approve assessment');
                              }
                            }}
                            className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                          >
                            Approve
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedAssessment(assessment);
                            setShowEditAssessmentModal(true);
                          }}
                          className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Non-Personalized Feed Configuration Modal */}
      {showFeedConfigModal && selectedPlatform && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Configure Non-Personalized Feed: {selectedPlatform.platformName}</h3>
              <button onClick={() => setShowFeedConfigModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleConfigureFeed} className="p-6 space-y-4">
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={feedConfigForm.isEnabled}
                    onChange={(e) => setFeedConfigForm({ ...feedConfigForm, isEnabled: e.target.checked })}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Enable Non-Personalized Feed Option</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">Required for VLOP platforms under Article 27</p>
              </div>

              {feedConfigForm.isEnabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User Opt-In Method *</label>
                    <select
                      required
                      value={feedConfigForm.userOptInMethod}
                      onChange={(e) => setFeedConfigForm({ ...feedConfigForm, userOptInMethod: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="toggle">Toggle Switch</option>
                      <option value="settings_page">Settings Page</option>
                      <option value="onboarding">Onboarding Flow</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Feed Algorithm Type *</label>
                    <select
                      required
                      value={feedConfigForm.feedAlgorithmType}
                      onChange={(e) => setFeedConfigForm({ ...feedConfigForm, feedAlgorithmType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="chronological">Chronological</option>
                      <option value="popularity">Popularity-Based</option>
                      <option value="random">Random</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={feedConfigForm.description}
                      onChange={(e) => setFeedConfigForm({ ...feedConfigForm, description: e.target.value })}
                      rows={3}
                      placeholder="Describe the non-personalized feed implementation..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User Documentation URL</label>
                    <input
                      type="url"
                      value={feedConfigForm.userDocumentationUrl}
                      onChange={(e) => setFeedConfigForm({ ...feedConfigForm, userDocumentationUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Implementation Date</label>
                    <input
                      type="date"
                      value={feedConfigForm.implementationDate}
                      onChange={(e) => setFeedConfigForm({ ...feedConfigForm, implementationDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={feedConfigForm.notes}
                      onChange={(e) => setFeedConfigForm({ ...feedConfigForm, notes: e.target.value })}
                      rows={2}
                      placeholder="Additional notes..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </>
              )}

              {feedConfig && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                  <p className="text-sm font-medium text-blue-900 mb-1">Current Status</p>
                  <p className="text-xs text-blue-700">
                    Compliance Status: <span className="font-medium">{feedConfig.complianceStatus?.replace('_', ' ') || 'Not Set'}</span>
                  </p>
                  {feedConfig.lastAuditDate && (
                    <p className="text-xs text-blue-700 mt-1">
                      Last Audit: {new Date(feedConfig.lastAuditDate).toLocaleDateString()}
                    </p>
                  )}
                  {feedConfig.implementationDate && (
                    <p className="text-xs text-blue-700 mt-1">
                      Implemented: {new Date(feedConfig.implementationDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              {/* Feed Configuration History */}
              {feedConfig && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Configuration History</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Enabled:</span>
                      <span className="font-medium">{feedConfig.isEnabled ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Opt-In Method:</span>
                      <span className="font-medium">{feedConfig.userOptInMethod?.replace('_', ' ') || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Algorithm Type:</span>
                      <span className="font-medium">{feedConfig.feedAlgorithmType?.replace('_', ' ') || 'N/A'}</span>
                    </div>
                    {feedConfig.createdAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span className="font-medium">{new Date(feedConfig.createdAt).toLocaleDateString()}</span>
                      </div>
                    )}
                    {feedConfig.updatedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Updated:</span>
                        <span className="font-medium">{new Date(feedConfig.updatedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  Save Configuration
                </button>
                <button
                  type="button"
                  onClick={() => setShowFeedConfigModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Risk Assessment Modal */}
      {showEditAssessmentModal && selectedAssessment && selectedPlatform && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Edit Risk Assessment</h3>
              <button onClick={() => setShowEditAssessmentModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const formData = new FormData(e.target as HTMLFormElement);
                const status = formData.get('status') as string;
                const notes = formData.get('notes') as string;
                
                const updates: any = { status };
                if (notes) updates.notes = notes;

                await api.euRegulations.dsa.updateRiskAssessment(selectedAssessment.id, updates);
                setShowEditAssessmentModal(false);
                setSelectedAssessment(null);
                await loadRiskAssessments(selectedPlatform.id);
                alert('Risk assessment updated successfully');
              } catch (err: any) {
                setError(err.message || 'Failed to update risk assessment');
              }
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                <select
                  name="status"
                  defaultValue={selectedAssessment.status}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="draft">Draft</option>
                  <option value="in_review">In Review</option>
                  <option value="approved">Approved</option>
                  <option value="requires_action">Requires Action</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  name="notes"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Add notes about this assessment..."
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Assessment Details</h4>
                <div className="space-y-1 text-xs text-gray-600">
                  <p><strong>Risk Category:</strong> {selectedAssessment.riskCategory.replace(/_/g, ' ')}</p>
                  <p><strong>Overall Risk Level:</strong> {selectedAssessment.overallRiskLevel.toUpperCase()}</p>
                  <p><strong>Assessed:</strong> {new Date(selectedAssessment.assessmentDate).toLocaleDateString()}</p>
                  {selectedAssessment.mitigationMeasures && selectedAssessment.mitigationMeasures.length > 0 && (
                    <p><strong>Mitigation Measures:</strong> {selectedAssessment.mitigationMeasures.length}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Update Assessment
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditAssessmentModal(false);
                    setSelectedAssessment(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

