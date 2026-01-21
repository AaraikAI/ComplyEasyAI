/**
 * Digital Markets Act (DMA) Gatekeeper Management
 * 
 * Comprehensive management interface for DMA compliance:
 * - Gatekeeper designation and tracking
 * - Core Platform Services (CPS) management
 * - Obligation compliance tracking
 * - Compliance reporting
 * 
 * Reference: Regulation (EU) 2022/1925
 */

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Building2, CheckCircle, AlertTriangle, X, Plus, FileText, Shield, TrendingUp, Clock, BarChart3 } from 'lucide-react';

interface Gatekeeper {
  id: string;
  platformName: string;
  corePlatformServices: string[];
  designationStatus: 'not_designated' | 'designated' | 'under_review';
  annualRevenue?: number;
  marketCapitalization?: number;
  monthlyActiveUsers?: number;
  obligations: string[];
  complianceStatus: 'compliant' | 'non_compliant' | 'in_review';
  lastReviewDate?: string;
  nextReviewDate?: string;
}

interface ObligationTracking {
  obligationType: string;
  complianceStatus: string;
  lastVerified?: string;
  nextReviewDate?: string;
}

export const DMAGatekeeperManagement: React.FC = () => {
  const [gatekeepers, setGatekeepers] = useState<Gatekeeper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedGatekeeper, setSelectedGatekeeper] = useState<Gatekeeper | null>(null);
  const [showObligationsModal, setShowObligationsModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showReportViewModal, setShowReportViewModal] = useState(false);
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const [obligations, setObligations] = useState<any[]>([]);
  const [complianceReport, setComplianceReport] = useState<any | null>(null);

  const [registrationForm, setRegistrationForm] = useState({
    platformName: '',
    corePlatformServices: [] as string[],
    annualRevenue: '',
    marketCapitalization: '',
    monthlyActiveUsers: '',
  });

  const corePlatformServicesOptions = [
    'online_search_engines',
    'online_intermediation_services',
    'online_social_networking_services',
    'video_sharing_platforms',
    'number_independent_interpersonal_communication_services',
    'operating_systems',
    'cloud_computing_services',
    'advertising_services',
    'web_browsers',
  ];

  useEffect(() => {
    loadGatekeepers();
  }, []);

  const loadGatekeepers = async () => {
    try {
      setLoading(true);
      const response = await api.euRegulations.dma.getGatekeepers();
      setGatekeepers(response.gatekeepers || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load gatekeepers');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterGatekeeper = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await api.euRegulations.dma.registerGatekeeper({
        platformName: registrationForm.platformName,
        corePlatformServices: registrationForm.corePlatformServices,
        annualRevenue: registrationForm.annualRevenue ? parseFloat(registrationForm.annualRevenue) : undefined,
        marketCapitalization: registrationForm.marketCapitalization ? parseFloat(registrationForm.marketCapitalization) : undefined,
        monthlyActiveUsers: registrationForm.monthlyActiveUsers ? parseInt(registrationForm.monthlyActiveUsers) : undefined,
      });
      setShowRegisterModal(false);
      setRegistrationForm({
        platformName: '',
        corePlatformServices: [],
        annualRevenue: '',
        marketCapitalization: '',
        monthlyActiveUsers: '',
      });
      await loadGatekeepers();
    } catch (err: any) {
      setError(err.message || 'Failed to register gatekeeper');
    }
  };

  const [reportPeriod, setReportPeriod] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 12)),
    end: new Date(),
  });

  // Helper function to format date for input
  const formatDateForInput = (date: Date): string => {
    if (!date || isNaN(date.getTime())) {
      return '';
    }
    return date.toISOString().split('T')[0];
  };

  // Helper function to parse date from input
  const parseDateFromInput = (dateString: string): Date | null => {
    if (!dateString) {
      return null;
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date;
  };

  const handleGenerateReport = async () => {
    if (!selectedGatekeeper) return;
    try {
      setError(null);
      const response = await api.euRegulations.dma.generateComplianceReport(selectedGatekeeper.id, {
        start: reportPeriod.start,
        end: reportPeriod.end,
      });
      setComplianceReport(response.report);
      setShowReportModal(false);
      setShowReportViewModal(true);
    } catch (err: any) {
      setError(err.message || 'Failed to generate compliance report');
    }
  };

  const loadObligations = async (gatekeeperId: string) => {
    try {
      const response = await api.euRegulations.dma.getObligations(gatekeeperId);
      setObligations(response.obligations || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load obligations');
    }
  };

  const handleUpdateObligationStatus = async (obligationType: string, status: string) => {
    if (!selectedGatekeeper) return;
    try {
      setError(null);
      await api.euRegulations.dma.updateObligationCompliance(selectedGatekeeper.id, obligationType, {
        status,
        lastVerified: new Date(),
      });
      await loadObligations(selectedGatekeeper.id);
      await loadGatekeepers();
    } catch (err: any) {
      setError(err.message || 'Failed to update obligation status');
    }
  };

  const getDesignationStatusColor = (status: string) => {
    switch (status) {
      case 'designated':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
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
      default:
        return 'text-gray-600';
    }
  };

  const formatNumber = (num?: number) => {
    if (!num) return 'N/A';
    if (num >= 1000000000) return `€${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `€${(num / 1000000).toFixed(1)}M`;
    return `€${num.toLocaleString()}`;
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
          <h2 className="text-2xl font-bold text-gray-900">Digital Markets Act (DMA) Compliance</h2>
          <p className="text-gray-600 mt-1">Manage gatekeeper platforms and track DMA obligations (Regulation EU 2022/1925)</p>
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

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Platforms</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{gatekeepers.length}</p>
            </div>
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Designated Gatekeepers</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {gatekeepers.filter(g => g.designationStatus === 'designated').length}
              </p>
            </div>
            <Shield className="w-8 h-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Compliant Platforms</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {gatekeepers.filter(g => g.complianceStatus === 'compliant').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Obligations</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {gatekeepers.reduce((sum, g) => sum + g.obligations.length, 0)}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Gatekeepers List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Registered Platforms</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {gatekeepers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No platforms registered yet</p>
              <button
                onClick={() => setShowRegisterModal(true)}
                className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Register your first platform
              </button>
            </div>
          ) : (
            gatekeepers.map((gatekeeper) => (
              <div key={gatekeeper.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">{gatekeeper.platformName}</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getDesignationStatusColor(gatekeeper.designationStatus)}`}>
                        {gatekeeper.designationStatus.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`text-sm font-medium ${getComplianceStatusColor(gatekeeper.complianceStatus)}`}>
                        {gatekeeper.complianceStatus.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                      {gatekeeper.annualRevenue && (
                        <div>
                          <span className="text-gray-600">Annual Revenue:</span>
                          <p className="font-medium text-gray-900">{formatNumber(gatekeeper.annualRevenue)}</p>
                        </div>
                      )}
                      {gatekeeper.marketCapitalization && (
                        <div>
                          <span className="text-gray-600">Market Cap:</span>
                          <p className="font-medium text-gray-900">{formatNumber(gatekeeper.marketCapitalization)}</p>
                        </div>
                      )}
                      {gatekeeper.monthlyActiveUsers && (
                        <div>
                          <span className="text-gray-600">Monthly Users:</span>
                          <p className="font-medium text-gray-900">{(gatekeeper.monthlyActiveUsers / 1000000).toFixed(1)}M</p>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-600">CPS Count:</span>
                        <p className="font-medium text-gray-900">{gatekeeper.corePlatformServices.length}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-1">Core Platform Services:</p>
                      <div className="flex flex-wrap gap-2">
                        {gatekeeper.corePlatformServices.map((cps, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                            {cps.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-1">Obligations ({gatekeeper.obligations.length}):</p>
                      <div className="flex flex-wrap gap-2">
                        {gatekeeper.obligations.map((obligation, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {obligation.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={async () => {
                        setSelectedGatekeeper(gatekeeper);
                        await loadObligations(gatekeeper.id);
                        setShowObligationsModal(true);
                      }}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      View Obligations
                    </button>
                    <button
                      onClick={() => {
                        setSelectedGatekeeper(gatekeeper);
                        setShowUpdateStatusModal(true);
                      }}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      Update Status
                    </button>
                    <button
                      onClick={() => {
                        setSelectedGatekeeper(gatekeeper);
                        setShowReportModal(true);
                      }}
                      className="px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                    >
                      Generate Report
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Register Gatekeeper Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Register Platform</h3>
              <button onClick={() => setShowRegisterModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRegisterGatekeeper} className="p-6 space-y-4">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Core Platform Services *</label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {corePlatformServicesOptions.map((cps) => (
                    <label key={cps} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={registrationForm.corePlatformServices.includes(cps)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRegistrationForm({
                              ...registrationForm,
                              corePlatformServices: [...registrationForm.corePlatformServices, cps],
                            });
                          } else {
                            setRegistrationForm({
                              ...registrationForm,
                              corePlatformServices: registrationForm.corePlatformServices.filter(s => s !== cps),
                            });
                          }
                        }}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">{cps.replace(/_/g, ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Annual Revenue (€)</label>
                  <input
                    type="number"
                    value={registrationForm.annualRevenue}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, annualRevenue: e.target.value })}
                    placeholder="e.g., 75000000000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Threshold: €75B for gatekeeper designation</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Market Capitalization (€)</label>
                  <input
                    type="number"
                    value={registrationForm.marketCapitalization}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, marketCapitalization: e.target.value })}
                    placeholder="e.g., 750000000000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Threshold: €750B for gatekeeper designation</p>
                </div>
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
                <p className="text-xs text-gray-500 mt-1">Threshold: 45M users for gatekeeper designation</p>
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

      {/* Obligations Modal */}
      {showObligationsModal && selectedGatekeeper && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Obligations: {selectedGatekeeper.platformName}</h3>
              <button onClick={() => setShowObligationsModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {obligations.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Loading obligations...</p>
                ) : (
                  obligations.map((obligation, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{obligation.obligationType.replace(/_/g, ' ')}</h4>
                          <p className="text-sm text-gray-600 mt-1">{obligation.description}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <select
                            value={obligation.complianceStatus}
                            onChange={(e) => handleUpdateObligationStatus(obligation.obligationType, e.target.value)}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="compliant">Compliant</option>
                            <option value="non_compliant">Non-Compliant</option>
                            <option value="in_progress">In Progress</option>
                          </select>
                        </div>
                      </div>
                      {obligation.lastVerified && (
                        <p className="text-xs text-gray-500 mt-2">
                          Last verified: {new Date(obligation.lastVerified).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showUpdateStatusModal && selectedGatekeeper && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Update Gatekeeper Status</h3>
              <button onClick={() => setShowUpdateStatusModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const formData = new FormData(e.target as HTMLFormElement);
                const designationStatus = formData.get('designationStatus') as string;
                const complianceStatus = formData.get('complianceStatus') as string;
                await api.euRegulations.dma.updateGatekeeper(selectedGatekeeper.id, {
                  designationStatus,
                  complianceStatus,
                });
                setShowUpdateStatusModal(false);
                await loadGatekeepers();
              } catch (err: any) {
                setError(err.message || 'Failed to update gatekeeper');
              }
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Designation Status</label>
                <select
                  name="designationStatus"
                  defaultValue={selectedGatekeeper.designationStatus}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="not_designated">Not Designated</option>
                  <option value="designated">Designated</option>
                  <option value="under_review">Under Review</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Compliance Status</label>
                <select
                  name="complianceStatus"
                  defaultValue={selectedGatekeeper.complianceStatus}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="compliant">Compliant</option>
                  <option value="non_compliant">Non-Compliant</option>
                  <option value="in_review">In Review</option>
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
                  onClick={() => setShowUpdateStatusModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report View Modal */}
      {showReportViewModal && complianceReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Compliance Report</h3>
              <button onClick={() => setShowReportViewModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Reporting Period</label>
                <p className="text-gray-900 mt-1">
                  {new Date(complianceReport.reportingPeriod.start).toLocaleDateString()} - {new Date(complianceReport.reportingPeriod.end).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Obligations Status</label>
                {Object.keys(complianceReport.obligationsStatus || {}).length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {Object.entries(complianceReport.obligationsStatus || {}).map(([obligation, status]: [string, any]) => (
                      <div key={obligation} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-900 capitalize">{obligation.replace(/_/g, ' ')}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          status?.status === 'compliant' ? 'bg-green-100 text-green-800' :
                          status?.status === 'non_compliant' ? 'bg-red-100 text-red-800' :
                          status?.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {(status?.status || 'pending').replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mt-2 italic">No obligations found for this gatekeeper.</p>
                )}
              </div>
              {complianceReport.violations && complianceReport.violations.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Violations</label>
                  <div className="mt-2 space-y-2">
                    {complianceReport.violations.map((violation: any, idx: number) => (
                      <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm font-medium text-red-900">{violation.description}</p>
                        <p className="text-xs text-red-700 mt-1">Severity: {violation.severity}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowReportViewModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Report Modal */}
      {showReportModal && selectedGatekeeper && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Generate Compliance Report</h3>
              <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleGenerateReport(); }} className="p-6 space-y-4">
              <p className="text-gray-600 mb-4">
                Generate a compliance report for <strong>{selectedGatekeeper.platformName}</strong>. Select the reporting period below.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formatDateForInput(reportPeriod.start)}
                    onChange={(e) => {
                      const parsedDate = parseDateFromInput(e.target.value);
                      if (parsedDate) {
                        setReportPeriod({ ...reportPeriod, start: parsedDate });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={formatDateForInput(reportPeriod.end)}
                    onChange={(e) => {
                      const parsedDate = parseDateFromInput(e.target.value);
                      if (parsedDate) {
                        setReportPeriod({ ...reportPeriod, end: parsedDate });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Generate Report
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
    </div>
  );
};

