import React, { useState, useEffect, useCallback } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Clock, RefreshCw, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronRight, Activity, Globe, Lock, FileText, Search, Filter, Plus, Eye, Zap } from 'lucide-react';
import { api } from '../services/api';

interface MonitoringCheck {
  id: string;
  vendorId: string;
  vendorName?: string;
  checkType: string;
  result: 'PASS' | 'FAIL' | 'WARNING' | 'PENDING';
  details: Record<string, any>;
  riskScore: number | null;
  checkedAt: string;
  checkedBy: string;
}

interface VendorSummary {
  vendorId: string;
  vendorName: string;
  latestRiskScore: number;
  totalChecks: number;
  passCount: number;
  failCount: number;
  warningCount: number;
  lastChecked: string;
  trend: 'up' | 'down' | 'stable';
}

interface MonitoringStats {
  totalChecks: number;
  vendorsMonitored: number;
  passCount: number;
  failCount: number;
  warningCount: number;
}

const CHECK_TYPE_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  DOMAIN_REPUTATION: { icon: <Globe size={14} />, label: 'Domain Reputation', color: 'text-blue-500' },
  SSL_CERTIFICATE: { icon: <Lock size={14} />, label: 'SSL Certificate', color: 'text-green-500' },
  BREACH_DATABASE: { icon: <Shield size={14} />, label: 'Breach Database', color: 'text-red-500' },
  SOC2_REPORT_EXPIRY: { icon: <FileText size={14} />, label: 'SOC 2 Report', color: 'text-purple-500' },
  VULNERABILITY_SCAN: { icon: <AlertTriangle size={14} />, label: 'Vulnerability Scan', color: 'text-orange-500' },
  PRIVACY_POLICY: { icon: <Eye size={14} />, label: 'Privacy Policy', color: 'text-cyan-500' },
  FINANCIAL_HEALTH: { icon: <TrendingUp size={14} />, label: 'Financial Health', color: 'text-indigo-500' },
  REGULATORY_COMPLIANCE: { icon: <CheckCircle size={14} />, label: 'Regulatory', color: 'text-emerald-500' },
};

const RESULT_CONFIG: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  PASS: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', icon: <CheckCircle size={12} /> },
  FAIL: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', icon: <XCircle size={12} /> },
  WARNING: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', icon: <AlertTriangle size={12} /> },
  PENDING: { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-700 dark:text-gray-400', icon: <Clock size={12} /> },
};

const VendorMonitoringDashboard: React.FC = () => {
  const [checks, setChecks] = useState<MonitoringCheck[]>([]);
  const [alerts, setAlerts] = useState<MonitoringCheck[]>([]);
  const [stats, setStats] = useState<MonitoringStats | null>(null);
  const [vendors, setVendors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null);
  const [vendorHistory, setVendorHistory] = useState<Record<string, MonitoringCheck[]>>({});
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCheckType, setFilterCheckType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [triggeringVendor, setTriggeringVendor] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCheck, setNewCheck] = useState({ vendorId: '', checkType: 'DOMAIN_REPUTATION', details: '{}' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [checksRes, alertsRes, statsRes, vendorsRes] = await Promise.all([
        api.vendorMonitoring.list({ pageSize: '100' }).catch(() => ({ data: [] })),
        api.vendorMonitoring.getAlerts().catch(() => ({ data: [] })),
        api.vendorMonitoring.getStats().catch(() => ({ data: null })),
        api.get('/vendors?pageSize=100').catch(() => ({ data: [] })),
      ]);

      setChecks(checksRes?.data || []);
      setAlerts(alertsRes?.data || []);
      setStats(statsRes?.data || null);
      setVendors(vendorsRes?.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load monitoring data');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerCheck = async (vendorId: string) => {
    setTriggeringVendor(vendorId);
    try {
      await api.vendorMonitoring.triggerCheck(vendorId);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to trigger check');
    } finally {
      setTriggeringVendor(null);
    }
  };

  const loadVendorHistory = async (vendorId: string) => {
    if (vendorHistory[vendorId]) return;
    try {
      const res = await api.vendorMonitoring.getForVendor(vendorId);
      setVendorHistory(prev => ({ ...prev, [vendorId]: res?.data || [] }));
    } catch {}
  };

  const toggleVendor = (vendorId: string) => {
    if (expandedVendor === vendorId) {
      setExpandedVendor(null);
    } else {
      setExpandedVendor(vendorId);
      loadVendorHistory(vendorId);
    }
  };

  const createCheck = async () => {
    if (!newCheck.vendorId || !newCheck.checkType) return;
    try {
      let details = {};
      try { details = JSON.parse(newCheck.details); } catch {}
      await api.vendorMonitoring.create({
        vendorId: newCheck.vendorId,
        checkType: newCheck.checkType,
        details,
      });
      setShowCreateModal(false);
      setNewCheck({ vendorId: '', checkType: 'DOMAIN_REPUTATION', details: '{}' });
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to create check');
    }
  };

  // Build vendor summaries from checks
  const vendorSummaries: VendorSummary[] = (() => {
    const map: Record<string, MonitoringCheck[]> = {};
    checks.forEach(c => {
      const key = c.vendorId;
      if (!map[key]) map[key] = [];
      map[key].push(c);
    });

    return Object.entries(map).map(([vendorId, vChecks]) => {
      const sorted = [...vChecks].sort((a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime());
      const vendor = vendors.find(v => v.id === vendorId);
      const passCount = vChecks.filter(c => c.result === 'PASS').length;
      const failCount = vChecks.filter(c => c.result === 'FAIL').length;
      const warningCount = vChecks.filter(c => c.result === 'WARNING').length;
      const latestScore = sorted[0]?.riskScore ?? Math.round((passCount / Math.max(vChecks.length, 1)) * 100);

      return {
        vendorId,
        vendorName: vendor?.name || sorted[0]?.vendorName || vendorId.slice(0, 8),
        latestRiskScore: latestScore,
        totalChecks: vChecks.length,
        passCount,
        failCount,
        warningCount,
        lastChecked: sorted[0]?.checkedAt || '',
        trend: failCount > passCount / 2 ? 'up' : failCount === 0 ? 'down' : 'stable',
      };
    });
  })();

  const filteredSummaries = vendorSummaries.filter(v => {
    if (searchQuery && !v.vendorName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterStatus === 'issues' && v.failCount === 0 && v.warningCount === 0) return false;
    if (filterStatus === 'healthy' && (v.failCount > 0 || v.warningCount > 0)) return false;
    return true;
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Never';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff} days ago`;
    return d.toLocaleDateString();
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getRiskScoreBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-surface-200 dark:bg-surface-700 rounded w-64" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-surface-200 dark:bg-surface-700 rounded-xl" />)}
          </div>
          <div className="h-96 bg-surface-200 dark:bg-surface-700 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Vendor Monitoring</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Continuous third-party risk monitoring and alerting</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-surface-300 dark:border-surface-600 rounded-lg text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700">
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700"
          >
            <Plus size={14} /> New Check
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
          <AlertTriangle size={16} /> {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">×</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={16} className="text-brand-500" />
            <span className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase">Vendors Monitored</span>
          </div>
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">{stats?.vendorsMonitored || vendorSummaries.length}</p>
        </div>
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-indigo-500" />
            <span className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase">Total Checks</span>
          </div>
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">{stats?.totalChecks || checks.length}</p>
        </div>
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={16} className="text-green-500" />
            <span className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase">Passing</span>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats?.passCount || 0}</p>
        </div>
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle size={16} className="text-red-500" />
            <span className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase">Failing</span>
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats?.failCount || 0}</p>
        </div>
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <span className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase">Warnings</span>
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats?.warningCount || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vendor Table */}
        <div className="lg:col-span-2 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
          {/* Filters */}
          <div className="p-4 border-b border-surface-200 dark:border-surface-700 flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search vendors..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100"
              />
            </div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-sm border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100"
            >
              <option value="">All Status</option>
              <option value="healthy">Healthy Only</option>
              <option value="issues">With Issues</option>
            </select>
          </div>

          {/* Vendor List */}
          <div className="divide-y divide-surface-100 dark:divide-surface-700/50">
            {filteredSummaries.length === 0 ? (
              <div className="p-12 text-center">
                <Shield size={48} className="mx-auto text-surface-300 dark:text-surface-600 mb-3" />
                <p className="text-surface-500 dark:text-surface-400">
                  {checks.length === 0 ? 'No monitoring checks yet. Trigger a check to get started.' : 'No vendors match your filters.'}
                </p>
              </div>
            ) : (
              filteredSummaries.map(vendor => (
                <div key={vendor.vendorId}>
                  <div
                    className="flex items-center gap-4 px-4 py-3 hover:bg-surface-50 dark:hover:bg-surface-750 cursor-pointer"
                    onClick={() => toggleVendor(vendor.vendorId)}
                  >
                    <button className="text-surface-400">
                      {expandedVendor === vendor.vendorId ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-surface-900 dark:text-surface-100 truncate">{vendor.vendorName}</h4>
                      <p className="text-xs text-surface-400 dark:text-surface-500">Last checked: {formatDate(vendor.lastChecked)}</p>
                    </div>

                    {/* Risk Score Bar */}
                    <div className="w-24 flex-shrink-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-bold ${getRiskScoreColor(vendor.latestRiskScore)}`}>
                          {vendor.latestRiskScore}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-100 dark:bg-surface-700 rounded-full">
                        <div
                          className={`h-1.5 rounded-full transition-all ${getRiskScoreBarColor(vendor.latestRiskScore)}`}
                          style={{ width: `${Math.min(vendor.latestRiskScore, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Result badges */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {vendor.passCount > 0 && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                          <CheckCircle size={10} /> {vendor.passCount}
                        </span>
                      )}
                      {vendor.failCount > 0 && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded">
                          <XCircle size={10} /> {vendor.failCount}
                        </span>
                      )}
                      {vendor.warningCount > 0 && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded">
                          <AlertTriangle size={10} /> {vendor.warningCount}
                        </span>
                      )}
                    </div>

                    {/* Trend */}
                    <div className="flex-shrink-0">
                      {vendor.trend === 'up' && <TrendingUp size={16} className="text-red-500" />}
                      {vendor.trend === 'down' && <TrendingDown size={16} className="text-green-500" />}
                      {vendor.trend === 'stable' && <Minus size={16} className="text-surface-400" />}
                    </div>

                    {/* Trigger Check */}
                    <button
                      onClick={(e) => { e.stopPropagation(); triggerCheck(vendor.vendorId); }}
                      disabled={triggeringVendor === vendor.vendorId}
                      className="flex-shrink-0 p-1.5 rounded-lg text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 disabled:opacity-50"
                      title="Run monitoring check"
                    >
                      <RefreshCw size={14} className={triggeringVendor === vendor.vendorId ? 'animate-spin' : ''} />
                    </button>
                  </div>

                  {/* Expanded Detail */}
                  {expandedVendor === vendor.vendorId && (
                    <div className="px-4 pb-4 pl-12 bg-surface-50/50 dark:bg-surface-750/50">
                      <h5 className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase mb-2 mt-2">Check History</h5>
                      {vendorHistory[vendor.vendorId] ? (
                        <div className="space-y-1.5">
                          {vendorHistory[vendor.vendorId].slice(0, 10).map(check => {
                            const typeConfig = CHECK_TYPE_CONFIG[check.checkType] || { icon: <Shield size={14} />, label: check.checkType, color: 'text-gray-500' };
                            const resultConfig = RESULT_CONFIG[check.result] || RESULT_CONFIG.PENDING;
                            return (
                              <div key={check.id} className="flex items-center gap-3 py-1.5 px-3 rounded-lg bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700">
                                <span className={typeConfig.color}>{typeConfig.icon}</span>
                                <span className="text-xs font-medium text-surface-700 dark:text-surface-300 flex-1">{typeConfig.label}</span>
                                <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${resultConfig.bg} ${resultConfig.text}`}>
                                  {resultConfig.icon} {check.result}
                                </span>
                                <span className="text-[10px] text-surface-400">{formatDate(check.checkedAt)}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-surface-400">
                          <RefreshCw size={12} className="animate-spin" /> Loading history...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Alerts Panel */}
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
          <div className="p-4 border-b border-surface-200 dark:border-surface-700">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500" />
              Recent Alerts
              {alerts.length > 0 && (
                <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
                  {alerts.length}
                </span>
              )}
            </h3>
          </div>

          <div className="max-h-[500px] overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle size={32} className="mx-auto text-green-400 mb-2" />
                <p className="text-sm text-surface-500 dark:text-surface-400">No alerts — all vendors healthy</p>
              </div>
            ) : (
              <div className="divide-y divide-surface-100 dark:divide-surface-700/50">
                {alerts.slice(0, 20).map(alert => {
                  const typeConfig = CHECK_TYPE_CONFIG[alert.checkType] || { icon: <Shield size={14} />, label: alert.checkType, color: 'text-gray-500' };
                  const resultConfig = RESULT_CONFIG[alert.result] || RESULT_CONFIG.WARNING;
                  return (
                    <div key={alert.id} className="p-3 hover:bg-surface-50 dark:hover:bg-surface-750">
                      <div className="flex items-start gap-2">
                        <span className={`mt-0.5 ${alert.result === 'FAIL' ? 'text-red-500' : 'text-amber-500'}`}>
                          {alert.result === 'FAIL' ? <XCircle size={14} /> : <AlertTriangle size={14} />}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
                            {alert.vendorName || alert.vendorId.slice(0, 8)}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`flex items-center gap-1 text-xs ${typeConfig.color}`}>
                              {typeConfig.icon} {typeConfig.label}
                            </span>
                          </div>
                          <span className="text-[10px] text-surface-400">{formatDate(alert.checkedAt)}</span>
                        </div>
                        <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${resultConfig.bg} ${resultConfig.text}`}>
                          {alert.result}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Check Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-surface-800 rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-700">
              <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">New Monitoring Check</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-surface-400 hover:text-surface-600">×</button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Vendor</label>
                <select
                  value={newCheck.vendorId}
                  onChange={e => setNewCheck(prev => ({ ...prev, vendorId: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100"
                >
                  <option value="">Select vendor...</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Check Type</label>
                <select
                  value={newCheck.checkType}
                  onChange={e => setNewCheck(prev => ({ ...prev, checkType: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100"
                >
                  {Object.entries(CHECK_TYPE_CONFIG).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Details (JSON)</label>
                <textarea
                  value={newCheck.details}
                  onChange={e => setNewCheck(prev => ({ ...prev, details: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 text-sm font-mono border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-surface-200 dark:border-surface-700">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm border border-surface-300 dark:border-surface-600 rounded-lg text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700">
                Cancel
              </button>
              <button
                onClick={createCheck}
                disabled={!newCheck.vendorId}
                className="px-4 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
              >
                Create Check
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorMonitoringDashboard;
