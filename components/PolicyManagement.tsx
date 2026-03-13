import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { isAtLimit, getUpgradeMessage } from '../constants/tierLimits';
import { TierLimitBanner } from './TierLimitBanner';
import ReactMarkdown from 'react-markdown';
import {
  ArrowLeft, Plus, Loader2, Search, X, ChevronDown, ChevronUp,
  FileText, Brain, Eye, Edit3, Trash2, CheckCircle, Clock, XCircle,
  Send, Copy, Download, BookOpen, Sparkles, Shield, AlertTriangle,
  BarChart3, Filter, MessageSquare,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, Legend,
} from 'recharts';
import { toast } from 'sonner';
import { useI18n } from '../contexts/I18nContext';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Policy {
  id: string;
  organizationId: string;
  title: string;
  policyNumber?: string;
  version: string;
  category: string;
  framework?: string;
  content: string;
  summary?: string;
  status: 'Draft' | 'In_Review' | 'Approved' | 'Archived';
  owner?: string;
  approver?: string;
  approvalDate?: string;
  effectiveDate?: string;
  reviewDate?: string;
  nextReviewDate?: string;
  tags?: string[];
  relatedPolicies?: string[];
  createdAt: string;
  updatedAt: string;
}

interface PolicyMetrics {
  total: number;
  byStatus: { draft: number; review: number; approved: number; archived: number };
  byCategory: Record<string, number>;
  reviewsDue: number;
  overdue: number;
}

interface PolicyTemplate {
  title: string;
  content: string;
  category: string;
}

type ViewMode = 'dashboard' | 'list' | 'detail' | 'create' | 'edit'
  | 'templates' | 'ai-generate' | 'ai-nl-generate' | 'ai-review' | 'ai-gap';

const STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-700 border-gray-200',
  In_Review: 'bg-blue-100 text-blue-700 border-blue-200',
  Approved: 'bg-green-100 text-green-700 border-green-200',
  Archived: 'bg-yellow-100 text-yellow-700 border-yellow-200',
};

const STATUS_LABELS: Record<string, string> = {
  Draft: 'Draft',
  In_Review: 'In Review',
  Approved: 'Approved',
  Archived: 'Archived',
};

const POLICY_CATEGORIES = [
  'Information Security', 'Data Privacy', 'Access Control', 'Business Continuity',
  'Incident Response', 'Vendor Management', 'Acceptable Use', 'Data Retention',
  'Remote Work', 'Change Management', 'Risk Management', 'Other',
];

const POLICY_TYPES = [
  'Data Retention', 'Information Security', 'Data Privacy', 'Access Control',
  'Incident Response', 'Acceptable Use', 'Remote Work',
];

const PIE_STATUS_COLORS = ['#6b7280', '#3b82f6', '#22c55e', '#eab308'];
const BAR_COLOR = '#0d9488';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const Badge: React.FC<{ text: string; className: string }> = ({ text, className }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}>
    {text}
  </span>
);

const emptyPolicyForm = (): Partial<Policy> => ({
  title: '', category: 'Information Security', content: '', summary: '',
  framework: '', version: '1.0', owner: '', tags: [],
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface PolicyManagementProps {
  onBack: () => void;
}

const PolicyManagement: React.FC<PolicyManagementProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { t } = useI18n();
  const plan = user?.organization?.plan;

  // Data
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [metrics, setMetrics] = useState<PolicyMetrics | null>(null);
  const [templates, setTemplates] = useState<Record<string, PolicyTemplate[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  // View
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [sortField, setSortField] = useState<'title' | 'status' | 'updatedAt' | 'category'>('updatedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Form
  const [policyForm, setPolicyForm] = useState<Partial<Policy>>(emptyPolicyForm());
  const [isSaving, setIsSaving] = useState(false);

  // AI States
  const [aiGenType, setAiGenType] = useState('Information Security');
  const [aiGenCompany, setAiGenCompany] = useState('');
  const [aiGenTone, setAiGenTone] = useState('Standard');
  const [aiGenResult, setAiGenResult] = useState('');
  const [aiGenLoading, setAiGenLoading] = useState(false);

  const [aiNLDescription, setAiNLDescription] = useState('');
  const [aiNLCategory, setAiNLCategory] = useState('Information Security');
  const [aiNLIndustry, setAiNLIndustry] = useState('Technology');
  const [aiNLResult, setAiNLResult] = useState<any>(null);
  const [aiNLLoading, setAiNLLoading] = useState(false);

  const [aiReviewResult, setAiReviewResult] = useState('');
  const [aiReviewLoading, setAiReviewLoading] = useState(false);

  const [aiGapResult, setAiGapResult] = useState('');
  const [aiGapLoading, setAiGapLoading] = useState(false);

  // Error
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------
  const loadPolicies = useCallback(async () => {
    try {
      const data = await api.enterprise.policies.list();
      setPolicies(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load policies');
    }
  }, []);

  const loadMetrics = useCallback(async () => {
    try {
      const data = await api.enterprise.policies.getMetrics();
      setMetrics(data);
    } catch {
      // may fail on empty orgs
    }
  }, []);

  const loadTemplates = useCallback(async () => {
    try {
      const data = await api.enterprise.policies.getTemplates();
      setTemplates(data);
    } catch {
      // templates optional
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([loadPolicies(), loadMetrics(), loadTemplates()]);
      setIsLoading(false);
    };
    init();
  }, [loadPolicies, loadMetrics, loadTemplates]);

  // ---------------------------------------------------------------------------
  // Filtering / sorting
  // ---------------------------------------------------------------------------
  const filteredPolicies = useMemo(() => {
    let list = [...policies];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.framework?.toLowerCase().includes(q)
      );
    }
    if (filterStatus !== 'All') list = list.filter(p => p.status === filterStatus);
    if (filterCategory !== 'All') list = list.filter(p => p.category === filterCategory);
    return list;
  }, [policies, searchQuery, filterStatus, filterCategory]);

  const sortedPolicies = useMemo(() => {
    const list = [...filteredPolicies];
    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'title') cmp = a.title.localeCompare(b.title);
      else if (sortField === 'status') cmp = a.status.localeCompare(b.status);
      else if (sortField === 'category') cmp = a.category.localeCompare(b.category);
      else if (sortField === 'updatedAt') cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [filteredPolicies, sortField, sortDir]);

  const categories = useMemo(() => {
    const cats = new Set(policies.map(p => p.category).filter(Boolean));
    return Array.from(cats);
  }, [policies]);

  // ---------------------------------------------------------------------------
  // CRUD
  // ---------------------------------------------------------------------------
  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAtLimit(plan, 'maxPolicies', policies.length)) {
      toast.warning(getUpgradeMessage(plan, 'maxPolicies', policies.length) || 'Policy limit reached.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await api.enterprise.policies.create({
        ...policyForm,
        organizationId: user?.organizationId,
      });
      await Promise.all([loadPolicies(), loadMetrics()]);
      setPolicyForm(emptyPolicyForm());
      setViewMode('list');
    } catch (err: any) {
      setError(err.message || 'Failed to create policy');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPolicy) return;
    setIsSaving(true);
    setError(null);
    try {
      const { id, organizationId, createdAt, updatedAt, ...payload } = policyForm as any;
      const updated = await api.enterprise.policies.update(selectedPolicy.id, payload);
      setSelectedPolicy(updated);
      await Promise.all([loadPolicies(), loadMetrics()]);
      setViewMode('detail');
    } catch (err: any) {
      setError(err.message || 'Failed to update policy');
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchivePolicy = async (policy: Policy) => {
    if (!confirm(`Archive "${policy.title}"?`)) return;
    try {
      await api.enterprise.policies.delete(policy.id);
      await Promise.all([loadPolicies(), loadMetrics()]);
      if (selectedPolicy?.id === policy.id) {
        setSelectedPolicy(null);
        setViewMode('list');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to archive policy');
    }
  };

  const handleApprove = async (policy: Policy) => {
    try {
      const updated = await api.enterprise.policies.approve(policy.id);
      setSelectedPolicy(updated);
      await Promise.all([loadPolicies(), loadMetrics()]);
    } catch (err: any) {
      setError(err.message || 'Failed to approve policy');
    }
  };

  const handleSubmitForReview = async (policy: Policy) => {
    try {
      const updated = await api.enterprise.policies.submitForReview(policy.id);
      setSelectedPolicy(updated);
      await Promise.all([loadPolicies(), loadMetrics()]);
    } catch (err: any) {
      setError(err.message || 'Failed to submit for review');
    }
  };

  const handleDuplicate = async (policy: Policy) => {
    if (isAtLimit(plan, 'maxPolicies', policies.length)) {
      toast.warning(getUpgradeMessage(plan, 'maxPolicies', policies.length) || 'Policy limit reached.');
      return;
    }
    try {
      await api.enterprise.policies.duplicate(policy.id);
      await Promise.all([loadPolicies(), loadMetrics()]);
    } catch (err: any) {
      setError(err.message || 'Failed to duplicate policy');
    }
  };

  // ---------------------------------------------------------------------------
  // AI: Generate Policy (Gemini - type/company/tone)
  // ---------------------------------------------------------------------------
  const handleAIGenerate = async () => {
    setAiGenLoading(true);
    setAiGenResult('');
    try {
      const result = await api.ai.generatePolicy(aiGenType, aiGenCompany || 'My Company', aiGenTone) as any;
      setAiGenResult(typeof result === 'string' ? result : result?.policy || result?.content || JSON.stringify(result));
    } catch (err: any) {
      setAiGenResult(`Error: ${err.message}`);
    } finally {
      setAiGenLoading(false);
    }
  };

  const useAIGeneratedPolicy = () => {
    setPolicyForm(prev => ({
      ...prev,
      title: `${aiGenType} Policy`,
      category: aiGenType,
      content: aiGenResult,
    }));
    setViewMode('create');
  };

  // ---------------------------------------------------------------------------
  // AI: Natural Language Policy (Visionary AI)
  // ---------------------------------------------------------------------------
  const handleAINLGenerate = async () => {
    if (!aiNLDescription.trim()) return;
    setAiNLLoading(true);
    setAiNLResult(null);
    try {
      const result = await api.enterprise.policies.generatePolicy({
        description: aiNLDescription,
        category: aiNLCategory,
        industry: aiNLIndustry,
      });
      setAiNLResult(result);
    } catch (err: any) {
      setAiNLResult({ error: err.message });
    } finally {
      setAiNLLoading(false);
    }
  };

  const useNLGeneratedPolicy = () => {
    if (!aiNLResult?.policy) return;
    const p = aiNLResult.policy;
    setPolicyForm(prev => ({
      ...prev,
      title: p.title || `${aiNLCategory} Policy`,
      category: p.category || aiNLCategory,
      content: p.content || '',
      version: p.version || '1.0',
    }));
    setViewMode('create');
  };

  // ---------------------------------------------------------------------------
  // AI: Policy Review
  // ---------------------------------------------------------------------------
  const handleAIReview = async (policy: Policy) => {
    setAiReviewLoading(true);
    setAiReviewResult('');
    setSelectedPolicy(policy);
    setViewMode('ai-review');
    try {
      const prompt = `Review this compliance policy for completeness, legal accuracy, and alignment with ${policy.framework || policy.category}. Provide:
1. A compliance alignment score (0-100)
2. Gaps or missing sections
3. Specific improvement suggestions
4. Legal accuracy assessment

Policy Title: ${policy.title}
Category: ${policy.category}
Framework: ${policy.framework || 'General'}

Policy Content:
${policy.content.substring(0, 3000)}`;

      const result = await api.ai.chat(prompt) as any;
      setAiReviewResult(typeof result === 'string' ? result : result?.response || result?.message || JSON.stringify(result));
    } catch (err: any) {
      setAiReviewResult(`Error: ${err.message}`);
    } finally {
      setAiReviewLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // AI: Gap Analysis for Policies
  // ---------------------------------------------------------------------------
  const handleAIGapAnalysis = async () => {
    setAiGapLoading(true);
    setAiGapResult('');
    setViewMode('ai-gap');
    try {
      const existingCategories = [...new Set(policies.map(p => p.category))];
      const requiredCategories = POLICY_CATEGORIES.filter(c => c !== 'Other');
      const result = await api.ai.performGapAnalysis(existingCategories, requiredCategories.join(', ')) as any;
      setAiGapResult(typeof result === 'string' ? result : result?.analysis || JSON.stringify(result));
    } catch (err: any) {
      setAiGapResult(`Error: ${err.message}`);
    } finally {
      setAiGapLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Navigation helpers
  // ---------------------------------------------------------------------------
  const openDetail = async (policy: Policy) => {
    try {
      const full = await api.enterprise.policies.getById(policy.id);
      setSelectedPolicy(full);
    } catch {
      setSelectedPolicy(policy);
    }
    setViewMode('detail');
  };

  const openEdit = (policy: Policy) => {
    setPolicyForm({ ...policy });
    setSelectedPolicy(policy);
    setViewMode('edit');
  };

  const openCreate = () => {
    setPolicyForm(emptyPolicyForm());
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

  const applyTemplate = (tpl: PolicyTemplate) => {
    setPolicyForm(prev => ({
      ...prev,
      title: tpl.title,
      category: tpl.category,
      content: tpl.content,
    }));
    setViewMode('create');
  };

  // Tier limits
  const policyLimitReached = isAtLimit(plan, 'maxPolicies', policies.length);

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-brand-600" size={32} />
        <span className="ml-3 text-gray-600">{t('common.loading')}</span>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Dashboard
  // ---------------------------------------------------------------------------
  const renderDashboard = () => {
    if (!metrics) return null;

    const statusData = [
      { name: 'Draft', value: metrics.byStatus.draft },
      { name: 'In Review', value: metrics.byStatus.review },
      { name: 'Approved', value: metrics.byStatus.approved },
      { name: 'Archived', value: metrics.byStatus.archived },
    ].filter(d => d.value > 0);

    const categoryData = Object.entries(metrics.byCategory).map(([name, count]) => ({ name, count }));

    return (
      <div className="space-y-6">
        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500">{t('policies.title')}</div>
            <div className="text-2xl font-bold mt-1">{metrics.total}</div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500">{t('common.approved')}</div>
            <div className="text-2xl font-bold mt-1 text-green-600">{metrics.byStatus.approved}</div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500">In Review</div>
            <div className="text-2xl font-bold mt-1 text-blue-600">{metrics.byStatus.review}</div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500">Reviews Due</div>
            <div className="text-2xl font-bold mt-1 text-orange-600">{metrics.reviewsDue}</div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500">Overdue</div>
            <div className="text-2xl font-bold mt-1 text-red-600">{metrics.overdue}</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Policy Status Distribution</h3>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                    label={({ name, value }) => `${name}: ${value}`}>
                    {statusData.map((_, i) => <Cell key={i} fill={PIE_STATUS_COLORS[i % PIE_STATUS_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-gray-400">No policy data yet</div>
            )}
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Policies by Category</h3>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={categoryData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill={BAR_COLOR} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-gray-400">No categories yet</div>
            )}
          </div>
        </div>

        {/* AI Actions card */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-5 rounded-xl border border-purple-200">
          <h3 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
            <Brain size={16} /> AI-Powered Policy Tools
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button onClick={() => setViewMode('ai-generate')}
              className="flex items-center gap-2 px-4 py-3 bg-white border border-purple-200 rounded-lg text-sm font-medium text-purple-700 hover:bg-purple-50 transition-colors">
              <Sparkles size={16} /> AI Policy Generator
            </button>
            <button onClick={() => setViewMode('ai-nl-generate')}
              className="flex items-center gap-2 px-4 py-3 bg-white border border-purple-200 rounded-lg text-sm font-medium text-purple-700 hover:bg-purple-50 transition-colors">
              <MessageSquare size={16} /> Plain English Policy
            </button>
            <button onClick={handleAIGapAnalysis}
              disabled={aiGapLoading}
              className="flex items-center gap-2 px-4 py-3 bg-white border border-purple-200 rounded-lg text-sm font-medium text-purple-700 hover:bg-purple-50 transition-colors disabled:opacity-50">
              {aiGapLoading ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
              Check Policy Coverage
            </button>
            <button onClick={() => setViewMode('templates')}
              className="flex items-center gap-2 px-4 py-3 bg-white border border-purple-200 rounded-lg text-sm font-medium text-purple-700 hover:bg-purple-50 transition-colors">
              <BookOpen size={16} /> Template Library
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Policy List
  // ---------------------------------------------------------------------------
  const renderList = () => (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder={`${t('common.search')}...`}
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="All">All Statuses</option>
          {['Draft', 'In_Review', 'Approved', 'Archived'].map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
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
                <th className="text-left px-4 py-3 cursor-pointer select-none" onClick={() => handleSort('title')}>
                  <span className="flex items-center gap-1">Title <SortIcon field="title" /></span>
                </th>
                <th className="text-left px-4 py-3 cursor-pointer select-none" onClick={() => handleSort('category')}>
                  <span className="flex items-center gap-1">{t('common.category')} <SortIcon field="category" /></span>
                </th>
                <th className="text-left px-4 py-3">Framework</th>
                <th className="text-left px-4 py-3 cursor-pointer select-none" onClick={() => handleSort('status')}>
                  <span className="flex items-center gap-1">{t('common.status')} <SortIcon field="status" /></span>
                </th>
                <th className="text-left px-4 py-3">{t('common.version')}</th>
                <th className="text-left px-4 py-3 cursor-pointer select-none" onClick={() => handleSort('updatedAt')}>
                  <span className="flex items-center gap-1">Updated <SortIcon field="updatedAt" /></span>
                </th>
                <th className="text-right px-4 py-3">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedPolicies.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">
                  {policies.length === 0 ? 'No policies yet. Create your first policy or generate one with AI.' : t('common.noResults')}
                </td></tr>
              ) : sortedPolicies.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <button onClick={() => openDetail(p)} className="text-brand-600 hover:underline font-medium text-left">
                      {p.title}
                    </button>
                    {p.policyNumber && <div className="text-xs text-gray-400">{p.policyNumber}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.category}</td>
                  <td className="px-4 py-3 text-gray-600">{p.framework || '—'}</td>
                  <td className="px-4 py-3"><Badge text={STATUS_LABELS[p.status] || p.status} className={STATUS_COLORS[p.status] || ''} /></td>
                  <td className="px-4 py-3 text-gray-500">v{p.version}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(p.updatedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end space-x-1">
                      <button onClick={() => handleAIReview(p)}
                        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg" title="AI Review">
                        <Brain size={16} />
                      </button>
                      <button onClick={() => openDetail(p)}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg" title="View">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => openEdit(p)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => handleDuplicate(p)}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg" title="Duplicate">
                        <Copy size={16} />
                      </button>
                      <button onClick={() => handleArchivePolicy(p)}
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
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: Policy Detail
  // ---------------------------------------------------------------------------
  const renderDetail = () => {
    if (!selectedPolicy) return null;
    const p = selectedPolicy;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{p.title}</h2>
            <p className="text-sm text-gray-500">{p.category} &middot; v{p.version}
              {p.framework && <> &middot; {p.framework}</>}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge text={STATUS_LABELS[p.status] || p.status} className={STATUS_COLORS[p.status] || ''} />
          </div>
        </div>

        {/* Workflow actions */}
        <div className="flex flex-wrap gap-2">
          {p.status === 'Draft' && (
            <button onClick={() => handleSubmitForReview(p)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
              <Send size={14} /> Submit for Review
            </button>
          )}
          {p.status === 'In_Review' && (
            <button onClick={() => handleApprove(p)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-2">
              <CheckCircle size={14} /> Approve
            </button>
          )}
          <button onClick={() => openEdit(p)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2">
            <Edit3 size={14} /> {t('common.edit')}
          </button>
          <button onClick={() => handleDuplicate(p)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2">
            <Copy size={14} /> Duplicate
          </button>
          <button onClick={() => handleArchivePolicy(p)}
            className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 flex items-center gap-2">
            <Trash2 size={14} /> {t('common.archived')}
          </button>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="text-xs text-gray-500 mb-1">{t('common.owner')}</div>
            <div className="text-sm font-medium">{p.owner || 'Unassigned'}</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="text-xs text-gray-500 mb-1">Approver</div>
            <div className="text-sm font-medium">{p.approver || 'None'}</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="text-xs text-gray-500 mb-1">{t('policies.effectiveDate')}</div>
            <div className="text-sm font-medium">{p.effectiveDate ? new Date(p.effectiveDate).toLocaleDateString() : 'Not set'}</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="text-xs text-gray-500 mb-1">{t('policies.reviewDate')}</div>
            <div className="text-sm font-medium">{p.reviewDate ? new Date(p.reviewDate).toLocaleDateString() : 'Not set'}</div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Policy Content</h3>
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{p.content}</ReactMarkdown>
          </div>
        </div>

        {/* AI Review action */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-5 rounded-xl border border-purple-200">
          <h3 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
            <Brain size={16} /> AI Policy Actions
          </h3>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => handleAIReview(p)}
              disabled={aiReviewLoading}
              className="flex items-center gap-2 px-4 py-3 bg-white border border-purple-200 rounded-lg text-sm font-medium text-purple-700 hover:bg-purple-50 disabled:opacity-50">
              {aiReviewLoading ? <Loader2 size={16} className="animate-spin" /> : <Brain size={16} />}
              AI Review Policy
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Policy Form (Create/Edit)
  // ---------------------------------------------------------------------------
  const renderForm = (isEdit: boolean) => {
    const f = policyForm;
    const setField = (key: string, val: any) => setPolicyForm(prev => ({ ...prev, [key]: val }));

    return (
      <form onSubmit={isEdit ? handleUpdatePolicy : handleCreatePolicy} className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">{isEdit ? t('policies.editPolicy') : t('policies.createPolicy')}</h3>
            {!isEdit && (
              <div className="flex gap-2">
                <button type="button" onClick={() => setViewMode('ai-generate')}
                  className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-medium hover:bg-purple-100 flex items-center gap-1">
                  <Sparkles size={12} /> Generate with AI
                </button>
                <button type="button" onClick={() => setViewMode('ai-nl-generate')}
                  className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-medium hover:bg-purple-100 flex items-center gap-1">
                  <MessageSquare size={12} /> Plain English
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('policies.policyName')} *</label>
              <input required value={f.title || ''} onChange={e => setField('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.category')} *</label>
              <select value={f.category || ''} onChange={e => setField('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                {POLICY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Framework</label>
              <input value={f.framework || ''} onChange={e => setField('framework', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="e.g. SOC 2, ISO 27001, GDPR" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('policies.policyVersion')}</label>
              <input value={f.version || '1.0'} onChange={e => setField('version', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('policies.policyOwner')}</label>
              <input value={f.owner || ''} onChange={e => setField('owner', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('policies.reviewDate')}</label>
              <input type="date" value={f.reviewDate ? new Date(f.reviewDate).toISOString().split('T')[0] : ''}
                onChange={e => setField('reviewDate', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.description')}</label>
            <textarea value={f.summary || ''} onChange={e => setField('summary', e.target.value)}
              rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
              placeholder="Brief summary of the policy..." />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Policy Content *</label>
            <textarea required value={f.content || ''} onChange={e => setField('content', e.target.value)}
              rows={16} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono resize-y"
              placeholder="# Policy Title&#10;&#10;## 1. Purpose&#10;...&#10;&#10;## 2. Scope&#10;..." />
            <p className="text-xs text-gray-400 mt-1">Supports Markdown formatting. {(f.content || '').length.toLocaleString()} characters</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => setViewMode(isEdit ? 'detail' : 'list')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">{t('common.cancel')}</button>
          <button type="submit" disabled={isSaving || !f.title || !f.content}
            className="px-6 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2">
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
            {isEdit ? t('common.save') : t('policies.createPolicy')}
          </button>
        </div>
      </form>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Templates
  // ---------------------------------------------------------------------------
  const renderTemplates = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Policy Templates</h2>
        <p className="text-sm text-gray-500 mt-1">Start from a pre-built template and customize for your organization.</p>
      </div>
      {Object.keys(templates).length === 0 ? (
        <div className="text-center py-12 text-gray-400">No templates available.</div>
      ) : (
        Object.entries(templates).map(([category, tpls]) => (
          <div key={category}>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">{category}</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {(tpls as PolicyTemplate[]).map((tpl, i) => (
                <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{tpl.title}</h4>
                    <Badge text={tpl.category} className="bg-blue-50 text-blue-700 border-blue-200" />
                  </div>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-3">{tpl.content.substring(0, 200)}...</p>
                  <button onClick={() => applyTemplate(tpl)}
                    disabled={policyLimitReached}
                    className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2">
                    <FileText size={14} /> Use Template
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: AI Generate Policy (Gemini)
  // ---------------------------------------------------------------------------
  const renderAIGenerate = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">AI Policy Generator</h2>
        <p className="text-sm text-gray-500 mt-1">Generate a compliance policy using AI. Select type, company, and tone.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4 h-fit">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.type')}</label>
            <select value={aiGenType} onChange={e => setAiGenType(e.target.value)}
              className="w-full p-2 border rounded-lg text-sm">
              {POLICY_TYPES.map(pt => <option key={pt} value={pt}>{pt}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <input value={aiGenCompany} onChange={e => setAiGenCompany(e.target.value)}
              className="w-full p-2 border rounded-lg text-sm" placeholder="Your Company" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tone</label>
            <select value={aiGenTone} onChange={e => setAiGenTone(e.target.value)}
              className="w-full p-2 border rounded-lg text-sm">
              <option>Strict</option>
              <option>Standard</option>
              <option>Employee-Friendly</option>
            </select>
          </div>
          <button onClick={handleAIGenerate} disabled={aiGenLoading}
            className="w-full bg-brand-600 text-white py-2.5 rounded-lg hover:bg-brand-700 disabled:opacity-50 flex justify-center items-center gap-2 text-sm font-medium">
            {aiGenLoading ? <><Loader2 size={16} className="animate-spin" /> {t('common.loading')}</> : <><Sparkles size={16} /> {t('policies.generatePolicy')}</>}
          </button>
        </div>
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-y-auto max-h-[70vh]">
          {aiGenResult ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-700 flex items-center gap-2"><Sparkles size={16} /> AI-Generated Policy</h3>
                <button onClick={useAIGeneratedPolicy}
                  disabled={policyLimitReached}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                  <FileText size={14} /> Use as New Policy
                </button>
              </div>
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{aiGenResult}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
              <Sparkles size={48} className="mb-2" />
              <p>Configure options and generate to see your AI policy here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: AI Natural Language Policy (Visionary)
  // ---------------------------------------------------------------------------
  const renderAINLGenerate = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Describe a Policy in Plain English</h2>
        <p className="text-sm text-gray-500 mt-1">Write a natural language description and AI will create a full structured policy.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.description')}</label>
              <textarea value={aiNLDescription} onChange={e => setAiNLDescription(e.target.value)}
                rows={6} className="w-full p-3 border rounded-lg text-sm resize-none"
                placeholder="e.g. We need a policy that requires all employees to use MFA, change passwords every 90 days, and report lost devices within 2 hours..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.category')}</label>
                <select value={aiNLCategory} onChange={e => setAiNLCategory(e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm">
                  {POLICY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                <select value={aiNLIndustry} onChange={e => setAiNLIndustry(e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm">
                  {['Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing', 'Education', 'Government', 'Other'].map(i => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </div>
            </div>
            <button onClick={handleAINLGenerate} disabled={aiNLLoading || !aiNLDescription.trim()}
              className="w-full bg-brand-600 text-white py-2.5 rounded-lg hover:bg-brand-700 disabled:opacity-50 flex justify-center items-center gap-2 text-sm font-medium">
              {aiNLLoading ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : <><MessageSquare size={16} /> Generate from Description</>}
            </button>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-y-auto max-h-[70vh]">
          {aiNLResult ? (
            aiNLResult.error ? (
              <div className="text-red-600"><AlertTriangle size={20} className="inline mr-2" />{aiNLResult.error}</div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-medium text-gray-700">{aiNLResult.policy?.title || 'Generated Policy'}</h3>
                    {aiNLResult.confidence !== null && (
                      <p className="text-xs text-gray-500 mt-1">Confidence: {Math.round(aiNLResult.confidence * 100)}%</p>
                    )}
                  </div>
                  <button onClick={useNLGeneratedPolicy}
                    disabled={policyLimitReached || !aiNLResult.policy}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                    <FileText size={14} /> Use as New Policy
                  </button>
                </div>
                {aiNLResult.frameworkMappings?.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {aiNLResult.frameworkMappings.map((m: any, i: number) => (
                      <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">{m.framework || m}</span>
                    ))}
                  </div>
                )}
                {aiNLResult.suggestedReviewers?.length > 0 && (
                  <div className="mb-4 text-xs text-gray-500">
                    Suggested reviewers: {aiNLResult.suggestedReviewers.join(', ')}
                  </div>
                )}
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{aiNLResult.policy?.content || JSON.stringify(aiNLResult, null, 2)}</ReactMarkdown>
                </div>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
              <MessageSquare size={48} className="mb-2" />
              <p className="text-center">Describe your policy requirements in plain English and AI will structure it for you.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: AI Review
  // ---------------------------------------------------------------------------
  const renderAIReview = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">AI Policy Review</h2>
        {selectedPolicy && <p className="text-sm text-gray-500 mt-1">Policy: {selectedPolicy.title}</p>}
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[400px]">
        {aiReviewLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="animate-spin text-brand-600 mb-3" size={32} />
            <p className="text-gray-500">AI is reviewing policy for completeness and compliance alignment...</p>
          </div>
        ) : aiReviewResult ? (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{aiReviewResult}</ReactMarkdown>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Brain size={48} className="mb-2" />
            <p>No review generated yet.</p>
          </div>
        )}
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: AI Gap Analysis
  // ---------------------------------------------------------------------------
  const renderAIGap = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Policy Coverage Gap Analysis</h2>
        <p className="text-sm text-gray-500 mt-1">AI compares your existing policy categories against required policy areas.</p>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[400px]">
        {aiGapLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="animate-spin text-brand-600 mb-3" size={32} />
            <p className="text-gray-500">Analyzing policy coverage gaps...</p>
          </div>
        ) : aiGapResult ? (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{aiGapResult}</ReactMarkdown>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Shield size={48} className="mb-2" />
            <p>No gap analysis generated yet.</p>
          </div>
        )}
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Main layout
  // ---------------------------------------------------------------------------
  const isSubView = !['dashboard', 'list'].includes(viewMode);
  const handleSubBack = () => {
    if (viewMode === 'edit' || viewMode === 'create') {
      setViewMode(selectedPolicy ? 'detail' : 'list');
    } else if (viewMode === 'ai-review') {
      setViewMode('detail');
    } else if (viewMode.startsWith('ai-') || viewMode === 'templates') {
      setViewMode('dashboard');
    } else if (viewMode === 'detail') {
      setViewMode('list');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn relative pb-20">
      {/* Tier limit banner */}
      {policyLimitReached && (
        <TierLimitBanner message={getUpgradeMessage(plan, 'maxPolicies', policies.length)} />
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
            <h1 className="text-2xl font-bold text-gray-900">{t('policies.title')}</h1>
            <p className="text-sm text-gray-500">{policies.length} polic{policies.length !== 1 ? 'ies' : 'y'}</p>
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
                  Policies
                </button>
              </div>
              <button onClick={openCreate}
                disabled={policyLimitReached}
                title={policyLimitReached ? getUpgradeMessage(plan, 'maxPolicies', policies.length) : undefined}
                className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 shadow-md flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <Plus size={16} /> {t('policies.createPolicy')}
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
      {viewMode === 'templates' && renderTemplates()}
      {viewMode === 'ai-generate' && renderAIGenerate()}
      {viewMode === 'ai-nl-generate' && renderAINLGenerate()}
      {viewMode === 'ai-review' && renderAIReview()}
      {viewMode === 'ai-gap' && renderAIGap()}
    </div>
  );
};

export default PolicyManagement;
