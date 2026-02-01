import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { isAtLimit, getUpgradeMessage } from '../constants/tierLimits';
import { TierLimitBanner } from './TierLimitBanner';
import ReactMarkdown from 'react-markdown';
import {
  ArrowLeft, Plus, Loader2, Search, Filter, X, ChevronDown, ChevronUp,
  ShieldAlert, ShieldCheck, AlertTriangle, FileText, Brain, Eye,
  Building2, Trash2, Edit3, BarChart3, CheckCircle, Clock, XCircle,
  Globe, Mail, Phone, DollarSign, Calendar, Upload, ListChecks,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, Legend,
} from 'recharts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Vendor {
  id: string;
  name: string;
  organizationId: string;
  website?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  riskScore: number;
  status: 'Active' | 'Inactive' | 'Onboarding' | 'Offboarding' | 'Suspended';
  category?: string;
  serviceDescription?: string;
  contractStart?: string;
  contractEnd?: string;
  annualSpend?: number;
  hasDataAccess: boolean;
  dataTypes?: string[];
  securityContact?: string;
  lastSecurityReview?: string;
  nextSecurityReview?: string;
  soc2Report: boolean;
  iso27001Certified: boolean;
  gdprCompliant: boolean;
  hipaaBaa: boolean;
  createdAt: string;
  updatedAt: string;
  assessments?: any[];
  reviews?: any[];
  monitors?: any[];
}

interface Dashboard {
  totalVendors: number;
  riskDistribution: { critical: number; high: number; medium: number; low: number };
  statusDistribution: { active: number; onboarding: number; offboarding: number; suspended: number };
  assessmentMetrics: { totalAssessments: number; pendingAssessments: number };
  reviewMetrics: { totalReviews: number };
  monitoringMetrics: { activeMonitors: number; alertsDetected: number };
  complianceCertifications: { soc2: number; iso27001: number; gdpr: number; hipaa: number };
  topRiskVendors: { id: string; name: string; riskScore: number; riskLevel: string; hasDataAccess: boolean }[];
}

type ViewMode = 'dashboard' | 'list' | 'detail' | 'create' | 'edit'
  | 'ai-scorer' | 'ai-contract' | 'ai-due-diligence' | 'ai-monitoring'
  | 'assessment';

const RISK_COLORS: Record<string, string> = {
  Critical: 'bg-red-100 text-red-800 border-red-200',
  High: 'bg-orange-100 text-orange-800 border-orange-200',
  Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Low: 'bg-green-100 text-green-800 border-green-200',
};

const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-green-100 text-green-800',
  Onboarding: 'bg-blue-100 text-blue-800',
  Offboarding: 'bg-gray-100 text-gray-700',
  Suspended: 'bg-red-100 text-red-800',
  Inactive: 'bg-gray-100 text-gray-500',
};

const PIE_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e'];

const DATA_ACCESS_LEVELS = [
  'No PII Access',
  'Read-Only Customer PII',
  'Full Database Access',
  'Payment/Health Data (PCI/HIPAA)',
];

const VENDOR_CATEGORIES = [
  'Cloud Infrastructure', 'SaaS Application', 'Data Analytics', 'Payment Processing',
  'Marketing', 'HR / Payroll', 'Security', 'Legal / Compliance', 'IT Support', 'Other',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const Badge: React.FC<{ text: string; className: string }> = ({ text, className }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}>
    {text}
  </span>
);

const riskScoreBadge = (score: number) => {
  if (score >= 80) return 'bg-red-600 text-white';
  if (score >= 60) return 'bg-orange-500 text-white';
  if (score >= 40) return 'bg-yellow-500 text-white';
  if (score >= 20) return 'bg-green-500 text-white';
  return 'bg-gray-300 text-gray-800';
};

const emptyVendorForm = (): Partial<Vendor> => ({
  name: '', website: '', contactName: '', contactEmail: '', contactPhone: '',
  category: '', serviceDescription: '', annualSpend: 0,
  hasDataAccess: false, dataTypes: [], securityContact: '',
  soc2Report: false, iso27001Certified: false, gdprCompliant: false, hipaaBaa: false,
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface VendorManagementProps {
  onBack: () => void;
}

const VendorManagement: React.FC<VendorManagementProps> = ({ onBack }) => {
  const { user } = useAuth();
  const plan = user?.organization?.plan;

  // Data
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // View
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [sortField, setSortField] = useState<'name' | 'riskScore' | 'status' | 'createdAt'>('riskScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Forms
  const [vendorForm, setVendorForm] = useState<Partial<Vendor>>(emptyVendorForm());
  const [isSaving, setIsSaving] = useState(false);

  // AI States
  const [aiScoreLoading, setAiScoreLoading] = useState<string | null>(null);
  const [aiScoreResults, setAiScoreResults] = useState<Record<string, string>>({});
  const [contractText, setContractText] = useState('');
  const [contractAnalysis, setContractAnalysis] = useState('');
  const [contractLoading, setContractLoading] = useState(false);
  const [dueDiligenceReport, setDueDiligenceReport] = useState('');
  const [dueDiligenceLoading, setDueDiligenceLoading] = useState(false);
  const [monitoringSuggestions, setMonitoringSuggestions] = useState('');
  const [monitoringLoading, setMonitoringLoading] = useState(false);

  // Assessment
  const [assessmentType, setAssessmentType] = useState('Security Review');
  const [assessmentLoading, setAssessmentLoading] = useState(false);

  // Error
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------
  const loadVendors = useCallback(async () => {
    try {
      const data = await api.vendors.list();
      setVendors(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load vendors');
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    try {
      const data = await api.vendors.getDashboard();
      setDashboard(data);
    } catch {
      // Dashboard may fail on empty orgs — ignore
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([loadVendors(), loadDashboard()]);
      setIsLoading(false);
    };
    init();
  }, [loadVendors, loadDashboard]);

  // ---------------------------------------------------------------------------
  // Filtering / sorting (memoised)
  // ---------------------------------------------------------------------------
  const filteredVendors = useMemo(() => {
    let list = [...vendors];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(v =>
        v.name.toLowerCase().includes(q) ||
        v.category?.toLowerCase().includes(q) ||
        v.serviceDescription?.toLowerCase().includes(q) ||
        v.contactName?.toLowerCase().includes(q)
      );
    }
    if (filterRisk !== 'All') list = list.filter(v => v.riskLevel === filterRisk);
    if (filterStatus !== 'All') list = list.filter(v => v.status === filterStatus);
    if (filterCategory !== 'All') list = list.filter(v => v.category === filterCategory);
    return list;
  }, [vendors, searchQuery, filterRisk, filterStatus, filterCategory]);

  const sortedVendors = useMemo(() => {
    const list = [...filteredVendors];
    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'riskScore') cmp = a.riskScore - b.riskScore;
      else if (sortField === 'status') cmp = a.status.localeCompare(b.status);
      else if (sortField === 'createdAt') cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [filteredVendors, sortField, sortDir]);

  const categories = useMemo(() => {
    const cats = new Set(vendors.map(v => v.category).filter(Boolean));
    return Array.from(cats) as string[];
  }, [vendors]);

  // ---------------------------------------------------------------------------
  // CRUD handlers
  // ---------------------------------------------------------------------------
  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAtLimit(plan, 'maxVendors', vendors.length)) {
      alert(getUpgradeMessage(plan, 'maxVendors', vendors.length) || 'Vendor limit reached. Upgrade in Settings → Billing.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const payload: any = { ...vendorForm, organizationId: user?.organizationId };
      if (payload.contractStart) payload.contractStart = new Date(payload.contractStart).toISOString();
      if (payload.contractEnd) payload.contractEnd = new Date(payload.contractEnd).toISOString();
      await api.vendors.create(payload);
      await loadVendors();
      await loadDashboard();
      setVendorForm(emptyVendorForm());
      setViewMode('list');
    } catch (err: any) {
      setError(err.message || 'Failed to create vendor');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor) return;
    setIsSaving(true);
    setError(null);
    try {
      const payload: any = { ...vendorForm };
      if (payload.contractStart) payload.contractStart = new Date(payload.contractStart).toISOString();
      if (payload.contractEnd) payload.contractEnd = new Date(payload.contractEnd).toISOString();
      delete payload.id;
      delete payload.organizationId;
      delete payload.createdAt;
      delete payload.updatedAt;
      delete payload.assessments;
      delete payload.reviews;
      delete payload.monitors;
      const updated = await api.vendors.update(selectedVendor.id, payload);
      setSelectedVendor(updated);
      await loadVendors();
      await loadDashboard();
      setViewMode('detail');
    } catch (err: any) {
      setError(err.message || 'Failed to update vendor');
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchiveVendor = async (vendor: Vendor) => {
    if (!confirm(`Archive "${vendor.name}"? This sets the vendor to Inactive.`)) return;
    try {
      await api.vendors.delete(vendor.id);
      await loadVendors();
      await loadDashboard();
      if (selectedVendor?.id === vendor.id) {
        setSelectedVendor(null);
        setViewMode('list');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to archive vendor');
    }
  };

  // ---------------------------------------------------------------------------
  // AI: Vendor Risk Score
  // ---------------------------------------------------------------------------
  const handleAIScore = async (vendor: Vendor) => {
    setAiScoreLoading(vendor.id);
    try {
      const dataAccess = vendor.hasDataAccess
        ? (vendor.dataTypes?.includes('Payment') || vendor.dataTypes?.includes('Health')
          ? 'Payment/Health Data (PCI/HIPAA)'
          : vendor.dataTypes?.includes('PII')
            ? 'Read-Only Customer PII'
            : 'Full Database Access')
        : 'No PII Access';
      const result = await api.ai.scoreVendor(
        vendor.name,
        vendor.serviceDescription || vendor.category || 'General Service',
        dataAccess
      );
      const text = typeof result === 'string' ? result : result?.analysis || result?.result || JSON.stringify(result);
      setAiScoreResults(prev => ({ ...prev, [vendor.id]: text }));

      // Extract numeric score if possible and save to vendor
      const scoreMatch = text.match(/(?:risk\s*score|overall\s*score|score)[:\s]*(\d{1,3})/i);
      if (scoreMatch) {
        const numericScore = Math.min(parseInt(scoreMatch[1], 10), 100);
        await api.vendors.update(vendor.id, { riskScore: numericScore });
        await loadVendors();
      }
    } catch (err: any) {
      setAiScoreResults(prev => ({ ...prev, [vendor.id]: `Error: ${err.message}` }));
    } finally {
      setAiScoreLoading(null);
    }
  };

  // ---------------------------------------------------------------------------
  // AI: Contract Analysis
  // ---------------------------------------------------------------------------
  const handleContractAnalysis = async () => {
    if (!contractText.trim()) return;
    setContractLoading(true);
    setContractAnalysis('');
    try {
      const result = await api.ai.analyzeContract(contractText);
      setContractAnalysis(typeof result === 'string' ? result : result?.analysis || JSON.stringify(result));
    } catch (err: any) {
      setContractAnalysis(`Error: ${err.message}`);
    } finally {
      setContractLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // AI: Due Diligence Report
  // ---------------------------------------------------------------------------
  const handleDueDiligence = async (vendor: Vendor) => {
    setDueDiligenceLoading(true);
    setDueDiligenceReport('');
    setViewMode('ai-due-diligence');
    setSelectedVendor(vendor);
    try {
      const result = await api.ai.generateReport('Vendor Risk', vendor.name, JSON.stringify(vendor));
      setDueDiligenceReport(typeof result === 'string' ? result : result?.report || JSON.stringify(result));
    } catch (err: any) {
      setDueDiligenceReport(`Error: ${err.message}`);
    } finally {
      setDueDiligenceLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // AI: Suggested Monitoring
  // ---------------------------------------------------------------------------
  const handleAIMonitoring = async (vendor: Vendor) => {
    setMonitoringLoading(true);
    setMonitoringSuggestions('');
    setViewMode('ai-monitoring');
    setSelectedVendor(vendor);
    try {
      const prompt = `Suggest monitoring controls for a ${vendor.category || 'General'} vendor with ${vendor.hasDataAccess ? 'data access (' + (vendor.dataTypes || []).join(', ') + ')' : 'no data access'}. Vendor: ${vendor.name}. Service: ${vendor.serviceDescription || 'N/A'}. Format as a numbered checklist of specific monitors to set up.`;
      const result = await api.ai.chat(prompt);
      setMonitoringSuggestions(typeof result === 'string' ? result : result?.response || result?.message || JSON.stringify(result));
    } catch (err: any) {
      setMonitoringSuggestions(`Error: ${err.message}`);
    } finally {
      setMonitoringLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Assessment handler
  // ---------------------------------------------------------------------------
  const handleCreateAssessment = async () => {
    if (!selectedVendor) return;
    setAssessmentLoading(true);
    try {
      await api.vendors.createAssessment(selectedVendor.id, { assessmentType });
      const updated = await api.vendors.getById(selectedVendor.id);
      setSelectedVendor(updated);
      setViewMode('detail');
    } catch (err: any) {
      setError(err.message || 'Failed to create assessment');
    } finally {
      setAssessmentLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Navigation helpers
  // ---------------------------------------------------------------------------
  const openDetail = async (vendor: Vendor) => {
    try {
      const full = await api.vendors.getById(vendor.id);
      setSelectedVendor(full);
    } catch {
      setSelectedVendor(vendor);
    }
    setViewMode('detail');
  };

  const openEdit = (vendor: Vendor) => {
    setVendorForm({ ...vendor });
    setSelectedVendor(vendor);
    setViewMode('edit');
  };

  const openCreate = () => {
    setVendorForm(emptyVendorForm());
    setViewMode('create');
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortIcon: React.FC<{ field: string }> = ({ field }) =>
    sortField === field
      ? sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
      : <ChevronDown size={14} className="opacity-30" />;

  // Tier limits
  const vendorLimitReached = isAtLimit(plan, 'maxVendors', vendors.length);

  // ---------------------------------------------------------------------------
  // Render: Loading
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-brand-600" size={32} />
        <span className="ml-3 text-gray-600">Loading vendor management...</span>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Dashboard View
  // ---------------------------------------------------------------------------
  const renderDashboard = () => {
    if (!dashboard) return null;
    const riskData = [
      { name: 'Critical', value: dashboard.riskDistribution.critical },
      { name: 'High', value: dashboard.riskDistribution.high },
      { name: 'Medium', value: dashboard.riskDistribution.medium },
      { name: 'Low', value: dashboard.riskDistribution.low },
    ].filter(d => d.value > 0);

    const certData = [
      { name: 'SOC 2', count: dashboard.complianceCertifications.soc2 },
      { name: 'ISO 27001', count: dashboard.complianceCertifications.iso27001 },
      { name: 'GDPR', count: dashboard.complianceCertifications.gdpr },
      { name: 'HIPAA', count: dashboard.complianceCertifications.hipaa },
    ];

    return (
      <div className="space-y-6">
        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500">Total Vendors</div>
            <div className="text-2xl font-bold mt-1">{dashboard.totalVendors}</div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500">Pending Assessments</div>
            <div className="text-2xl font-bold mt-1 text-orange-600">{dashboard.assessmentMetrics.pendingAssessments}</div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500">Active Monitors</div>
            <div className="text-2xl font-bold mt-1 text-green-600">{dashboard.monitoringMetrics.activeMonitors}</div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500">Alerts</div>
            <div className="text-2xl font-bold mt-1 text-red-600">{dashboard.monitoringMetrics.alertsDetected}</div>
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Risk Distribution</h3>
            {riskData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={riskData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                    {riskData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-gray-400">No vendor data yet</div>
            )}
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Compliance Certifications</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={certData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status summary */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Vendor Status Summary</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(dashboard.statusDistribution).map(([key, val]) => (
              <div key={key} className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${key === 'active' ? 'bg-green-500' : key === 'onboarding' ? 'bg-blue-500' : key === 'offboarding' ? 'bg-gray-400' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-600 capitalize">{key}: <strong>{val}</strong></span>
              </div>
            ))}
          </div>
        </div>

        {/* Top risk vendors */}
        {dashboard.topRiskVendors.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Top Risk Vendors</h3>
            <div className="space-y-2">
              {dashboard.topRiskVendors.map(v => (
                <div key={v.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                  onClick={() => { const full = vendors.find(vv => vv.id === v.id); if (full) openDetail(full); }}>
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${riskScoreBadge(v.riskScore)}`}>{v.riskScore}</span>
                    <span className="font-medium text-gray-900">{v.name}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge text={v.riskLevel} className={RISK_COLORS[v.riskLevel] || ''} />
                    {v.hasDataAccess && <span className="text-xs text-red-600 font-medium">Data Access</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Vendor List
  // ---------------------------------------------------------------------------
  const renderList = () => (
    <div className="space-y-4">
      {/* Filters bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Search vendors..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="All">All Risk Levels</option>
          {['Critical', 'High', 'Medium', 'Low'].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="All">All Statuses</option>
          {['Active', 'Onboarding', 'Offboarding', 'Suspended', 'Inactive'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {categories.length > 0 && (
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="All">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 cursor-pointer select-none" onClick={() => handleSort('name')}>
                  <span className="flex items-center gap-1">Vendor <SortIcon field="name" /></span>
                </th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-left px-4 py-3 cursor-pointer select-none" onClick={() => handleSort('riskScore')}>
                  <span className="flex items-center gap-1">Risk Score <SortIcon field="riskScore" /></span>
                </th>
                <th className="text-left px-4 py-3">Risk Level</th>
                <th className="text-left px-4 py-3 cursor-pointer select-none" onClick={() => handleSort('status')}>
                  <span className="flex items-center gap-1">Status <SortIcon field="status" /></span>
                </th>
                <th className="text-left px-4 py-3">Data Access</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedVendors.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">
                  {vendors.length === 0 ? 'No vendors yet. Add your first vendor.' : 'No vendors match your filters.'}
                </td></tr>
              ) : sortedVendors.map(v => (
                <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <button onClick={() => openDetail(v)} className="text-brand-600 hover:underline font-medium">
                      {v.name}
                    </button>
                    {v.website && <div className="text-xs text-gray-400">{v.website}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{v.category || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${riskScoreBadge(v.riskScore)}`}>
                      {v.riskScore}
                    </span>
                  </td>
                  <td className="px-4 py-3"><Badge text={v.riskLevel} className={RISK_COLORS[v.riskLevel]} /></td>
                  <td className="px-4 py-3"><Badge text={v.status} className={STATUS_COLORS[v.status] || ''} /></td>
                  <td className="px-4 py-3">
                    {v.hasDataAccess ? (
                      <span className="text-red-600 text-xs font-medium flex items-center gap-1"><AlertTriangle size={12} />Yes</span>
                    ) : (
                      <span className="text-gray-400 text-xs">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end space-x-1">
                      <button onClick={() => handleAIScore(v)}
                        disabled={aiScoreLoading === v.id}
                        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="AI Risk Score">
                        {aiScoreLoading === v.id ? <Loader2 size={16} className="animate-spin" /> : <Brain size={16} />}
                      </button>
                      <button onClick={() => openDetail(v)}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg" title="View Details">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => openEdit(v)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => handleArchiveVendor(v)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Archive">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inline AI score results */}
      {Object.keys(aiScoreResults).length > 0 && (
        <div className="space-y-3">
          {Object.entries(aiScoreResults).map(([id, result]) => {
            const v = vendors.find(vv => vv.id === id);
            return (
              <div key={id} className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-purple-900 flex items-center gap-2">
                    <Brain size={16} /> AI Risk Analysis: {v?.name || id}
                  </h4>
                  <button onClick={() => setAiScoreResults(prev => { const n = { ...prev }; delete n[id]; return n; })}
                    className="text-purple-400 hover:text-purple-600"><X size={16} /></button>
                </div>
                <div className="prose prose-sm max-w-none text-purple-900">
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: Vendor Detail
  // ---------------------------------------------------------------------------
  const renderDetail = () => {
    if (!selectedVendor) return null;
    const v = selectedVendor;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{v.name}</h2>
            <p className="text-sm text-gray-500">{v.category || 'Uncategorized'} &middot; {v.serviceDescription || 'No description'}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => openEdit(v)} className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1">
              <Edit3 size={14} /> Edit
            </button>
            <button onClick={() => handleArchiveVendor(v)} className="px-3 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-1">
              <Trash2 size={14} /> Archive
            </button>
          </div>
        </div>

        {/* Quick info cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="text-xs text-gray-500 mb-1">Risk Score</div>
            <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${riskScoreBadge(v.riskScore)}`}>{v.riskScore}</span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="text-xs text-gray-500 mb-1">Risk Level</div>
            <Badge text={v.riskLevel} className={RISK_COLORS[v.riskLevel]} />
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="text-xs text-gray-500 mb-1">Status</div>
            <Badge text={v.status} className={STATUS_COLORS[v.status] || ''} />
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="text-xs text-gray-500 mb-1">Data Access</div>
            <span className={`text-sm font-medium ${v.hasDataAccess ? 'text-red-600' : 'text-green-600'}`}>
              {v.hasDataAccess ? 'Yes' : 'No'}
            </span>
          </div>
        </div>

        {/* Contact & contract info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Contact Information</h3>
            <div className="space-y-2 text-sm">
              {v.contactName && <div className="flex items-center gap-2 text-gray-600"><Building2 size={14} />{v.contactName}</div>}
              {v.contactEmail && <div className="flex items-center gap-2 text-gray-600"><Mail size={14} />{v.contactEmail}</div>}
              {v.contactPhone && <div className="flex items-center gap-2 text-gray-600"><Phone size={14} />{v.contactPhone}</div>}
              {v.website && <div className="flex items-center gap-2 text-gray-600"><Globe size={14} />{v.website}</div>}
              {!v.contactName && !v.contactEmail && !v.contactPhone && <p className="text-gray-400">No contact info</p>}
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Contract Details</h3>
            <div className="space-y-2 text-sm">
              {v.contractStart && <div className="flex items-center gap-2 text-gray-600"><Calendar size={14} />Start: {new Date(v.contractStart).toLocaleDateString()}</div>}
              {v.contractEnd && <div className="flex items-center gap-2 text-gray-600"><Calendar size={14} />End: {new Date(v.contractEnd).toLocaleDateString()}</div>}
              {v.annualSpend != null && <div className="flex items-center gap-2 text-gray-600"><DollarSign size={14} />Annual Spend: ${v.annualSpend.toLocaleString()}</div>}
              {!v.contractStart && !v.contractEnd && !v.annualSpend && <p className="text-gray-400">No contract details</p>}
            </div>
          </div>
        </div>

        {/* Certifications */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Compliance Certifications</h3>
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'SOC 2', active: v.soc2Report },
              { label: 'ISO 27001', active: v.iso27001Certified },
              { label: 'GDPR', active: v.gdprCompliant },
              { label: 'HIPAA BAA', active: v.hipaaBaa },
            ].map(cert => (
              <div key={cert.label} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${cert.active ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                {cert.active ? <CheckCircle size={14} /> : <XCircle size={14} />}
                {cert.label}
              </div>
            ))}
          </div>
        </div>

        {/* Assessments */}
        {v.assessments && v.assessments.length > 0 && (
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Assessment History</h3>
            <div className="space-y-2">
              {v.assessments.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                  <div className="flex items-center gap-3">
                    <Clock size={14} className="text-gray-400" />
                    <span className="font-medium">{a.assessmentType}</span>
                    <Badge text={a.status} className={a.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'} />
                  </div>
                  <div className="text-gray-500">
                    {a.score != null && <span className="mr-3">Score: {a.score}</span>}
                    {a.assessedDate && new Date(a.assessedDate).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Actions */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-5 rounded-xl border border-purple-200">
          <h3 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
            <Brain size={16} /> AI-Powered Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button onClick={() => handleAIScore(v)}
              disabled={aiScoreLoading === v.id}
              className="flex items-center gap-2 px-4 py-3 bg-white border border-purple-200 rounded-lg text-sm font-medium text-purple-700 hover:bg-purple-50 transition-colors disabled:opacity-50">
              {aiScoreLoading === v.id ? <Loader2 size={16} className="animate-spin" /> : <ShieldAlert size={16} />}
              AI Risk Score
            </button>
            <button onClick={() => { setContractText(''); setContractAnalysis(''); setViewMode('ai-contract'); }}
              className="flex items-center gap-2 px-4 py-3 bg-white border border-purple-200 rounded-lg text-sm font-medium text-purple-700 hover:bg-purple-50 transition-colors">
              <FileText size={16} /> Analyze Contract
            </button>
            <button onClick={() => handleDueDiligence(v)}
              disabled={dueDiligenceLoading}
              className="flex items-center gap-2 px-4 py-3 bg-white border border-purple-200 rounded-lg text-sm font-medium text-purple-700 hover:bg-purple-50 transition-colors disabled:opacity-50">
              {dueDiligenceLoading ? <Loader2 size={16} className="animate-spin" /> : <BarChart3 size={16} />}
              Due Diligence Report
            </button>
            <button onClick={() => handleAIMonitoring(v)}
              disabled={monitoringLoading}
              className="flex items-center gap-2 px-4 py-3 bg-white border border-purple-200 rounded-lg text-sm font-medium text-purple-700 hover:bg-purple-50 transition-colors disabled:opacity-50">
              {monitoringLoading ? <Loader2 size={16} className="animate-spin" /> : <ListChecks size={16} />}
              AI Monitoring Setup
            </button>
          </div>
        </div>

        {/* Inline AI score result for this vendor */}
        {aiScoreResults[v.id] && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-purple-900 flex items-center gap-2"><Brain size={16} /> AI Risk Score Analysis</h4>
              <button onClick={() => setAiScoreResults(prev => { const n = { ...prev }; delete n[v.id]; return n; })}
                className="text-purple-400 hover:text-purple-600"><X size={16} /></button>
            </div>
            <div className="prose prose-sm max-w-none text-purple-900">
              <ReactMarkdown>{aiScoreResults[v.id]}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Create assessment */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">New Assessment</h3>
          <div className="flex items-center gap-3">
            <select value={assessmentType} onChange={e => setAssessmentType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm flex-1">
              <option>Security Review</option>
              <option>Privacy Assessment</option>
              <option>SOC 2 Review</option>
              <option>GDPR Compliance</option>
              <option>Annual Review</option>
              <option>Incident Response</option>
            </select>
            <button onClick={handleCreateAssessment} disabled={assessmentLoading}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2">
              {assessmentLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Create Assessment
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Vendor Form (Create/Edit)
  // ---------------------------------------------------------------------------
  const renderForm = (isEdit: boolean) => {
    const f = vendorForm;
    const setField = (key: string, val: any) => setVendorForm(prev => ({ ...prev, [key]: val }));

    return (
      <form onSubmit={isEdit ? handleUpdateVendor : handleCreateVendor} className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-5">
          <h3 className="text-sm font-semibold text-gray-700">{isEdit ? 'Edit Vendor' : 'Add New Vendor'}</h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name *</label>
              <input required value={f.name || ''} onChange={e => setField('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={f.category || ''} onChange={e => setField('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">Select category</option>
                {VENDOR_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input value={f.website || ''} onChange={e => setField('website', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="https://" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Description</label>
              <input value={f.serviceDescription || ''} onChange={e => setField('serviceDescription', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>

          <h4 className="text-sm font-semibold text-gray-700 pt-2">Contact Information</h4>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
              <input value={f.contactName || ''} onChange={e => setField('contactName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
              <input type="email" value={f.contactEmail || ''} onChange={e => setField('contactEmail', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
              <input value={f.contactPhone || ''} onChange={e => setField('contactPhone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>

          <h4 className="text-sm font-semibold text-gray-700 pt-2">Contract Details</h4>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contract Start</label>
              <input type="date" value={f.contractStart ? new Date(f.contractStart).toISOString().split('T')[0] : ''}
                onChange={e => setField('contractStart', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contract End</label>
              <input type="date" value={f.contractEnd ? new Date(f.contractEnd).toISOString().split('T')[0] : ''}
                onChange={e => setField('contractEnd', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Annual Spend ($)</label>
              <input type="number" value={f.annualSpend || ''} onChange={e => setField('annualSpend', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>

          <h4 className="text-sm font-semibold text-gray-700 pt-2">Data Access & Security</h4>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={f.hasDataAccess || false} onChange={e => setField('hasDataAccess', e.target.checked)}
                className="rounded border-gray-300 text-brand-600" />
              <span className="text-sm text-gray-700">Vendor has access to sensitive data</span>
            </label>
            {f.hasDataAccess && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Types Accessed</label>
                <div className="flex flex-wrap gap-2">
                  {['PII', 'Payment', 'Health', 'Financial', 'Employee', 'IP'].map(dt => (
                    <label key={dt} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs cursor-pointer transition-colors ${
                      (f.dataTypes || []).includes(dt)
                        ? 'bg-red-50 border-red-200 text-red-700'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}>
                      <input type="checkbox" className="sr-only"
                        checked={(f.dataTypes || []).includes(dt)}
                        onChange={e => {
                          const current = f.dataTypes || [];
                          setField('dataTypes', e.target.checked ? [...current, dt] : current.filter(d => d !== dt));
                        }} />
                      {dt}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Security Contact</label>
              <input value={f.securityContact || ''} onChange={e => setField('securityContact', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>

          <h4 className="text-sm font-semibold text-gray-700 pt-2">Compliance Certifications</h4>
          <div className="flex flex-wrap gap-4">
            {[
              { key: 'soc2Report', label: 'SOC 2' },
              { key: 'iso27001Certified', label: 'ISO 27001' },
              { key: 'gdprCompliant', label: 'GDPR Compliant' },
              { key: 'hipaaBaa', label: 'HIPAA BAA' },
            ].map(cert => (
              <label key={cert.key} className="flex items-center gap-2">
                <input type="checkbox" checked={(f as any)[cert.key] || false}
                  onChange={e => setField(cert.key, e.target.checked)}
                  className="rounded border-gray-300 text-brand-600" />
                <span className="text-sm text-gray-700">{cert.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => setViewMode(isEdit ? 'detail' : 'list')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={isSaving || !f.name}
            className="px-6 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2">
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
            {isEdit ? 'Save Changes' : 'Add Vendor'}
          </button>
        </div>
      </form>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: AI Contract Analyzer
  // ---------------------------------------------------------------------------
  const renderContractAnalyzer = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Contract Analyzer</h2>
        {selectedVendor && <p className="text-sm text-gray-500 mt-1">Vendor: {selectedVendor.name}</p>}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Paste Contract Text</label>
            <textarea
              value={contractText}
              onChange={e => setContractText(e.target.value)}
              rows={16}
              className="w-full p-4 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-brand-500 resize-none"
              placeholder="Paste the vendor contract text here for AI analysis..."
            />
            <p className="text-xs text-gray-400 mt-1">{contractText.length.toLocaleString()} characters</p>
          </div>
          <button onClick={handleContractAnalysis}
            disabled={contractLoading || !contractText.trim()}
            className="w-full bg-brand-600 text-white py-3 rounded-lg hover:bg-brand-700 disabled:opacity-50 flex justify-center items-center gap-2 text-sm font-medium">
            {contractLoading ? <><Loader2 className="animate-spin" size={16} /> Analyzing...</> : <><Search size={16} /> Analyze for Compliance Risks</>}
          </button>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-y-auto max-h-[600px]">
          {contractAnalysis ? (
            <div className="prose prose-sm max-w-none">
              <h3 className="flex items-center text-brand-700 mb-4"><FileText className="mr-2" size={20} /> AI Analysis Report</h3>
              <ReactMarkdown>{contractAnalysis}</ReactMarkdown>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
              <AlertTriangle size={48} className="mb-2" />
              <p className="text-center">Paste contract text to detect missing DPA clauses, GDPR issues, and security gaps.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: AI Due Diligence Report
  // ---------------------------------------------------------------------------
  const renderDueDiligence = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">AI Due Diligence Report</h2>
        {selectedVendor && <p className="text-sm text-gray-500 mt-1">Vendor: {selectedVendor.name}</p>}
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[400px]">
        {dueDiligenceLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="animate-spin text-brand-600 mb-3" size={32} />
            <p className="text-gray-500">Generating comprehensive due diligence report...</p>
          </div>
        ) : dueDiligenceReport ? (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{dueDiligenceReport}</ReactMarkdown>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <BarChart3 size={48} className="mb-2" />
            <p>No report generated yet.</p>
          </div>
        )}
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: AI Monitoring Suggestions
  // ---------------------------------------------------------------------------
  const renderMonitoringSuggestions = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">AI-Suggested Monitoring Controls</h2>
        {selectedVendor && <p className="text-sm text-gray-500 mt-1">Vendor: {selectedVendor.name}</p>}
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[400px]">
        {monitoringLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="animate-spin text-brand-600 mb-3" size={32} />
            <p className="text-gray-500">AI is analyzing vendor profile and suggesting monitors...</p>
          </div>
        ) : monitoringSuggestions ? (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{monitoringSuggestions}</ReactMarkdown>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <ListChecks size={48} className="mb-2" />
            <p>No monitoring suggestions yet.</p>
          </div>
        )}
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Main layout
  // ---------------------------------------------------------------------------
  const isSubView = viewMode !== 'dashboard' && viewMode !== 'list';
  const backLabel = viewMode === 'detail' ? 'Back to List'
    : viewMode === 'edit' || viewMode === 'create' ? 'Cancel'
    : viewMode.startsWith('ai-') ? 'Back to Vendor'
    : viewMode === 'assessment' ? 'Back to Vendor'
    : 'Back';

  const handleSubBack = () => {
    if (viewMode === 'edit' || viewMode === 'create') {
      setViewMode(selectedVendor ? 'detail' : 'list');
    } else if (viewMode.startsWith('ai-') || viewMode === 'assessment') {
      setViewMode('detail');
    } else if (viewMode === 'detail') {
      setViewMode('list');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn relative pb-20">
      {/* Tier limit banner */}
      {vendorLimitReached && (
        <TierLimitBanner message={getUpgradeMessage(plan, 'maxVendors', vendors.length)} />
      )}

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertTriangle className="text-red-600 mr-3 flex-shrink-0 mt-0.5" size={20} />
          <p className="text-red-800 text-sm flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800"><X size={18} /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {isSubView ? (
            <button onClick={handleSubBack} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
              <ArrowLeft size={20} />
            </button>
          ) : (
            <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vendor Management</h1>
            <p className="text-sm text-gray-500">{vendors.length} vendor{vendors.length !== 1 ? 's' : ''} tracked</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isSubView && (
            <>
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button onClick={() => setViewMode('dashboard')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'dashboard' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                  Dashboard
                </button>
                <button onClick={() => setViewMode('list')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                  Vendors
                </button>
              </div>
              <button onClick={openCreate}
                disabled={vendorLimitReached}
                title={vendorLimitReached ? getUpgradeMessage(plan, 'maxVendors', vendors.length) : undefined}
                className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 shadow-md flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <Plus size={16} /> Add Vendor
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {viewMode === 'dashboard' && renderDashboard()}
      {viewMode === 'list' && renderList()}
      {viewMode === 'detail' && renderDetail()}
      {viewMode === 'create' && renderForm(false)}
      {viewMode === 'edit' && renderForm(true)}
      {viewMode === 'ai-contract' && renderContractAnalyzer()}
      {viewMode === 'ai-due-diligence' && renderDueDiligence()}
      {viewMode === 'ai-monitoring' && renderMonitoringSuggestions()}
    </div>
  );
};

export default VendorManagement;
