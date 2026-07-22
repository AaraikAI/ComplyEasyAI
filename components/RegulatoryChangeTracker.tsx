/**
 * Regulatory Change Tracker Component
 *
 * Regulatory change monitoring dashboard:
 * - Change list with type, severity, effective date
 * - AI-generated impact analysis showing affected controls count
 * - Status tracking (new -> reviewing -> in progress -> resolved)
 * - Detail view with full summary, source URL, affected controls, remediation
 * - Filter by regulation, change type, status
 * - API calls to /api/regulatory-changes
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import {
  ArrowLeft, Plus, Loader2, Search, X, Filter, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle, Clock, Eye, Edit3, Trash2, ExternalLink,
  Shield, FileText, Zap, RefreshCw, AlertCircle, Scale, Gavel,
  Brain, TrendingUp, Calendar, ArrowRight, ChevronRight, Bell,
  BookOpen, Target, XCircle, BarChart3, Activity,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Type Definitions ────────────────────────────────────────────────────────

type ChangeType = 'new_regulation' | 'amendment' | 'guidance' | 'enforcement' | 'repeal';
type ChangeSeverity = 'critical' | 'high' | 'medium' | 'low';
type ChangeStatus = 'new' | 'reviewing' | 'in_progress' | 'resolved';
type ViewMode = 'list' | 'detail';

interface AffectedControl {
  id: string;
  name: string;
  framework: string;
  currentStatus: string;
  impactLevel: 'high' | 'medium' | 'low';
  requiredAction: string;
}

interface RemediationSuggestion {
  id: string;
  action: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  effort: string;
  assignee?: string;
  deadline?: string;
}

interface RegulatoryChange {
  id: string;
  title: string;
  description: string;
  summary: string;
  changeType: ChangeType;
  severity: ChangeSeverity;
  status: ChangeStatus;
  regulation: string;
  jurisdiction: string;
  sourceUrl: string;
  publishedDate: string;
  effectiveDate: string;
  affectedControlsCount: number;
  affectedControls: AffectedControl[];
  remediationSuggestions: RemediationSuggestion[];
  aiAnalysis?: string;
  assignedTo?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface DashboardMetrics {
  totalChanges: number;
  newChanges: number;
  criticalChanges: number;
  pendingReview: number;
  resolvedThisMonth: number;
  avgResolutionDays: number;
}

const CHANGE_TYPE_CONFIG: Record<ChangeType, { label: string; icon: React.ReactNode; color: string }> = {
  new_regulation: { label: 'New Regulation', icon: <Gavel className="w-4 h-4" />, color: 'bg-blue-100 text-blue-800 dark:bg-signal-blue/10 dark:text-signal-blue' },
  amendment: { label: 'Amendment', icon: <Edit3 className="w-4 h-4" />, color: 'bg-orange-100 text-orange-800 dark:bg-signal-warn/10 dark:text-signal-warn' },
  guidance: { label: 'Guidance', icon: <BookOpen className="w-4 h-4" />, color: 'bg-purple-100 text-purple-800 dark:bg-signal-violet/10 dark:text-signal-violet' },
  enforcement: { label: 'Enforcement', icon: <Scale className="w-4 h-4" />, color: 'bg-red-100 text-red-800 dark:bg-signal-bad/10 dark:text-signal-bad' },
  repeal: { label: 'Repeal', icon: <XCircle className="w-4 h-4" />, color: 'bg-gray-100 text-gray-800 dark:bg-white/[0.06] dark:text-signal-muted' },
};

const SEVERITY_CONFIG: Record<ChangeSeverity, { label: string; color: string; dotColor: string }> = {
  critical: { label: 'Critical', color: 'bg-red-100 text-red-800 dark:bg-signal-bad/10 dark:text-signal-bad', dotColor: 'bg-red-500 dark:bg-signal-bad' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-800 dark:bg-signal-warn/10 dark:text-signal-warn', dotColor: 'bg-orange-500 dark:bg-signal-warn' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800 dark:bg-signal-amber/10 dark:text-signal-amber', dotColor: 'bg-yellow-500 dark:bg-signal-amber' },
  low: { label: 'Low', color: 'bg-green-100 text-green-800 dark:bg-signal-good/10 dark:text-signal-good', dotColor: 'bg-green-500 dark:bg-signal-good' },

};

const STATUS_CONFIG: Record<ChangeStatus, { label: string; color: string; icon: React.ReactNode }> = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-800 dark:bg-signal-blue/10 dark:text-signal-blue', icon: <Bell className="w-3.5 h-3.5" /> },
  reviewing: { label: 'Reviewing', color: 'bg-yellow-100 text-yellow-800 dark:bg-signal-warn/10 dark:text-signal-warn', icon: <Eye className="w-3.5 h-3.5" /> },
  in_progress: { label: 'In Progress', color: 'bg-purple-100 text-purple-800 dark:bg-signal-violet/10 dark:text-signal-violet', icon: <Activity className="w-3.5 h-3.5" /> },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800 dark:bg-signal-good/10 dark:text-signal-good', icon: <CheckCircle className="w-3.5 h-3.5" /> },
};

const STATUS_FLOW: ChangeStatus[] = ['new', 'reviewing', 'in_progress', 'resolved'];

const REGULATIONS = ['GDPR', 'CCPA/CPRA', 'SOC 2', 'HIPAA', 'PCI DSS', 'ISO 27001', 'NIST CSF', 'EU AI Act', 'DORA', 'NIS2', 'SEC Cyber'];

// ── Main Component ──────────────────────────────────────────────────────────

const RegulatoryChangeTracker: React.FC = () => {
  const { user } = useAuth();
  const { t } = useI18n();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [changes, setChanges] = useState<RegulatoryChange[]>([]);
  const [selectedChange, setSelectedChange] = useState<RegulatoryChange | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ChangeType | 'all'>('all');
  const [filterSeverity, setFilterSeverity] = useState<ChangeSeverity | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<ChangeStatus | 'all'>('all');
  const [filterRegulation, setFilterRegulation] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState<Partial<RegulatoryChange>>({
    title: '',
    description: '',
    summary: '',
    changeType: 'new_regulation',
    severity: 'medium',
    status: 'new',
    regulation: '',
    jurisdiction: '',
    sourceUrl: '',
    publishedDate: '',
    effectiveDate: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadChanges();
    loadMetrics();
  }, []);

  const loadChanges = async () => {
    setLoading(true);
    try {
      const res = await api.get('/regulatory-changes');
      setChanges(Array.isArray(res.data) ? res.data : (res.data?.changes || []));
    } catch {
      setChanges([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      const res = await api.get('/regulatory-changes/metrics');
      setMetrics(res.data);
    } catch {
      setMetrics(null);
    }
  };

  const saveChange = async () => {
    try {
      if (editingId) {
        const res = await api.put(`/regulatory-changes/${editingId}`, form);
        setChanges(prev => prev.map(c => c.id === editingId ? (res.data || { ...c, ...form }) : c));
        toast.success('Regulatory change updated');
      } else {
        const res = await api.post('/regulatory-changes', form);
        setChanges(prev => [res.data || { ...form, id: `rc_${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), affectedControlsCount: 0, affectedControls: [], remediationSuggestions: [] } as RegulatoryChange, ...prev]);
        toast.success('Regulatory change created');
      }
      setShowAddModal(false);
      setEditingId(null);
      resetForm();
      loadMetrics();
    } catch {
      toast.error('Failed to save regulatory change');
    }
  };

  const deleteChange = async (id: string) => {
    try {
      await api.delete(`/regulatory-changes/${id}`);
      setChanges(prev => prev.filter(c => c.id !== id));
      if (selectedChange?.id === id) {
        setSelectedChange(null);
        setViewMode('list');
      }
      toast.success('Regulatory change deleted');
      setShowDeleteConfirm(null);
      loadMetrics();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const updateStatus = async (id: string, status: ChangeStatus) => {
    try {
      await api.patch(`/regulatory-changes/${id}`, { status });
      setChanges(prev => prev.map(c => c.id === id ? { ...c, status, updatedAt: new Date().toISOString() } : c));
      if (selectedChange?.id === id) {
        setSelectedChange({ ...selectedChange, status, updatedAt: new Date().toISOString() });
      }
      toast.success(`Status updated to ${STATUS_CONFIG[status].label}`);
      loadMetrics();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const runImpactAnalysis = async (id: string) => {
    setAnalyzing(true);
    try {
      const res = await api.post(`/regulatory-changes/${id}/analyze`);
      const analysisData = res.data;
      setChanges(prev => prev.map(c => c.id === id ? {
        ...c,
        aiAnalysis: analysisData?.analysis || 'Impact analysis complete.',
        affectedControls: analysisData?.affectedControls || c.affectedControls,
        affectedControlsCount: analysisData?.affectedControlsCount || c.affectedControlsCount,
        remediationSuggestions: analysisData?.remediationSuggestions || c.remediationSuggestions,
      } : c));
      if (selectedChange?.id === id) {
        setSelectedChange(prev => prev ? {
          ...prev,
          aiAnalysis: analysisData?.analysis || 'Impact analysis complete.',
          affectedControls: analysisData?.affectedControls || prev.affectedControls,
          affectedControlsCount: analysisData?.affectedControlsCount || prev.affectedControlsCount,
          remediationSuggestions: analysisData?.remediationSuggestions || prev.remediationSuggestions,
        } : null);
      }
      toast.success('Impact analysis complete');
    } catch {
      toast.error('Failed to run impact analysis');
    } finally {
      setAnalyzing(false);
    }
  };

  const resetForm = () => {
    setForm({
      title: '', description: '', summary: '', changeType: 'new_regulation', severity: 'medium',
      status: 'new', regulation: '', jurisdiction: '', sourceUrl: '', publishedDate: '', effectiveDate: '',
    });
  };

  const openEdit = (change: RegulatoryChange) => {
    setForm({
      title: change.title, description: change.description, summary: change.summary,
      changeType: change.changeType, severity: change.severity, status: change.status,
      regulation: change.regulation, jurisdiction: change.jurisdiction, sourceUrl: change.sourceUrl,
      publishedDate: change.publishedDate, effectiveDate: change.effectiveDate,
    });
    setEditingId(change.id);
    setShowAddModal(true);
  };

  const openDetail = (change: RegulatoryChange) => {
    setSelectedChange(change);
    setViewMode('detail');
  };

  const filteredChanges = useMemo(() => {
    return changes.filter(c => {
      if (filterType !== 'all' && c.changeType !== filterType) return false;
      if (filterSeverity !== 'all' && c.severity !== filterSeverity) return false;
      if (filterStatus !== 'all' && c.status !== filterStatus) return false;
      if (filterRegulation !== 'all' && c.regulation !== filterRegulation) return false;
      if (searchQuery && !c.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !c.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !c.regulation.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [changes, filterType, filterSeverity, filterStatus, filterRegulation, searchQuery]);

  const daysUntil = (dateStr: string) => {
    if (!dateStr) return null;
    const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // ── Render: List View ─────────────────────────────────────────────────

  const renderListView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-signal-ink dark:font-display">Regulatory Change Tracker</h2>
          <p className="text-sm text-gray-500 dark:text-signal-muted mt-1">Monitor and manage regulatory updates impacting your compliance posture</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadChanges} className="p-2 text-gray-500 dark:text-signal-muted hover:bg-gray-100 dark:hover:bg-white/[0.06] rounded-lg transition">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => { resetForm(); setEditingId(null); setShowAddModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white dark:bg-signal-green dark:text-signal-canvas rounded-lg hover:bg-primary-700 dark:hover:bg-signal-green/90 transition"
          >
            <Plus className="w-4 h-4" />
            Add Change
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Total Changes', value: metrics.totalChanges, icon: <Scale className="w-5 h-5" />, color: 'text-blue-600 dark:text-blue-400' },
            { label: 'New', value: metrics.newChanges, icon: <Bell className="w-5 h-5" />, color: 'text-purple-600 dark:text-purple-400' },
            { label: 'Critical', value: metrics.criticalChanges, icon: <AlertTriangle className="w-5 h-5" />, color: 'text-red-600 dark:text-red-400' },
            { label: 'Pending Review', value: metrics.pendingReview, icon: <Eye className="w-5 h-5" />, color: 'text-yellow-600 dark:text-yellow-400' },
            { label: 'Resolved (Month)', value: metrics.resolvedThisMonth, icon: <CheckCircle className="w-5 h-5" />, color: 'text-green-600 dark:text-green-400' },
            { label: 'Avg Resolution', value: `${metrics.avgResolutionDays}d`, icon: <Clock className="w-5 h-5" />, color: 'text-gray-600 dark:text-signal-sub' },
          ].map((metric, i) => (
            <div key={i} className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] rounded-xl dark:rounded-2xl p-4">
              <div className={`${metric.color} mb-2`}>{metric.icon}</div>
              <p className="text-2xl font-bold text-gray-900 dark:text-signal-ink dark:font-display">{metric.value}</p>
              <p className="text-xs text-gray-500 dark:text-signal-muted dark:font-mono dark:text-[10px] dark:uppercase dark:tracking-[0.14em] dark:mt-1">{metric.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('common.search')}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-white/[0.10] rounded-lg bg-white dark:bg-white/[0.04] text-gray-900 dark:text-signal-ink placeholder-gray-400 dark:placeholder-signal-muted focus:ring-2 focus:ring-primary-500 dark:focus:ring-signal-green/40"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition text-sm ${
            showFilters ? 'border-primary-500 text-primary-600 bg-primary-50 dark:border-signal-green/50 dark:text-signal-green dark:bg-signal-green/10' : 'border-gray-200 dark:border-white/[0.10] text-gray-700 dark:text-signal-body'
          }`}
        >
          <Filter className="w-4 h-4" />
          {t('common.filter')}
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-3 p-4 bg-gray-50 dark:bg-white/[0.03] dark:border dark:border-white/[0.06] rounded-xl dark:rounded-2xl">
          <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="px-3 py-1.5 text-sm border border-gray-200 dark:border-white/[0.10] rounded-lg bg-white dark:bg-white/[0.04] text-gray-900 dark:text-signal-ink">
            <option value="all">All Types</option>
            {Object.entries(CHANGE_TYPE_CONFIG).map(([key, cfg]) => (<option key={key} value={key}>{cfg.label}</option>))}
          </select>
          <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value as any)} className="px-3 py-1.5 text-sm border border-gray-200 dark:border-white/[0.10] rounded-lg bg-white dark:bg-white/[0.04] text-gray-900 dark:text-signal-ink">
            <option value="all">All Severities</option>
            {Object.entries(SEVERITY_CONFIG).map(([key, cfg]) => (<option key={key} value={key}>{cfg.label}</option>))}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="px-3 py-1.5 text-sm border border-gray-200 dark:border-white/[0.10] rounded-lg bg-white dark:bg-white/[0.04] text-gray-900 dark:text-signal-ink">
            <option value="all">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (<option key={key} value={key}>{cfg.label}</option>))}
          </select>
          <select value={filterRegulation} onChange={e => setFilterRegulation(e.target.value)} className="px-3 py-1.5 text-sm border border-gray-200 dark:border-white/[0.10] rounded-lg bg-white dark:bg-white/[0.04] text-gray-900 dark:text-signal-ink">
            <option value="all">All Regulations</option>
            {REGULATIONS.map(r => (<option key={r} value={r}>{r}</option>))}
          </select>
        </div>
      )}

      {/* Changes List */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-500 dark:text-signal-green" /></div>
      ) : filteredChanges.length === 0 ? (
        <div className="text-center py-20">
          <Scale className="w-12 h-12 mx-auto text-gray-300 dark:text-signal-muted mb-4" />
          <p className="text-gray-500 dark:text-signal-muted">{t('common.noResults')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredChanges.map(change => {
            const typeConfig = CHANGE_TYPE_CONFIG[change.changeType];
            const sevConfig = SEVERITY_CONFIG[change.severity];
            const statusConfig = STATUS_CONFIG[change.status];
            const daysLeft = daysUntil(change.effectiveDate);
            return (
              <div
                key={change.id}
                className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] rounded-xl dark:rounded-2xl p-4 hover:shadow-md dark:hover:bg-white/[0.05] transition cursor-pointer group"
                onClick={() => openDetail(change)}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${typeConfig.color}`}>
                    {typeConfig.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-signal-ink truncate">{change.title}</h3>
                      <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${sevConfig.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sevConfig.dotColor}`} />
                        {sevConfig.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-signal-body line-clamp-1 mb-2">{change.summary || change.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-signal-muted">
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${statusConfig.color}`}>
                        {statusConfig.icon}
                        {statusConfig.label}
                      </span>
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${typeConfig.color}`}>
                        {typeConfig.label}
                      </span>
                      <span className="flex items-center gap-1"><Shield className="w-3 h-3" />{change.regulation}</span>
                      {change.effectiveDate && (
                        <span className={`flex items-center gap-1 ${daysLeft !== null && daysLeft <= 30 ? 'text-red-500 dark:text-signal-bad' : ''}`}>
                          <Calendar className="w-3 h-3" />
                          Effective: {new Date(change.effectiveDate).toLocaleDateString()}
                          {daysLeft !== null && daysLeft > 0 && ` (${daysLeft}d)`}
                        </span>
                      )}
                      {change.affectedControlsCount > 0 && (
                        <span className="flex items-center gap-1 text-orange-500 dark:text-signal-warn">
                          <Target className="w-3 h-3" />
                          {change.affectedControlsCount} controls affected
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 dark:text-signal-muted flex-shrink-0 opacity-0 group-hover:opacity-100 transition" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ── Render: Detail View ───────────────────────────────────────────────

  const renderDetailView = () => {
    if (!selectedChange) return null;
    const typeConfig = CHANGE_TYPE_CONFIG[selectedChange.changeType];
    const sevConfig = SEVERITY_CONFIG[selectedChange.severity];
    const statusConfig = STATUS_CONFIG[selectedChange.status];
    const currentStatusIdx = STATUS_FLOW.indexOf(selectedChange.status);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => { setViewMode('list'); setSelectedChange(null); }} className="p-2 hover:bg-gray-100 dark:hover:bg-white/[0.06] rounded-lg transition">
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-signal-body" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-signal-ink dark:font-display">{selectedChange.title}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full ${sevConfig.color}`}>{sevConfig.label}</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-signal-muted">{selectedChange.regulation} &middot; {typeConfig.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => runImpactAnalysis(selectedChange.id)}
              disabled={analyzing}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 dark:border-white/[0.10] rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.06] text-gray-700 dark:text-signal-body transition"
            >
              {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
              AI Impact Analysis
            </button>
            <button onClick={() => openEdit(selectedChange)} className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 dark:border-white/[0.10] rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.06] text-gray-700 dark:text-signal-body transition">
              <Edit3 className="w-4 h-4" />
              {t('common.edit')}
            </button>
            <button onClick={() => setShowDeleteConfirm(selectedChange.id)} className="flex items-center gap-2 px-3 py-2 text-sm border border-red-200 dark:border-signal-bad/30 rounded-lg hover:bg-red-50 dark:hover:bg-signal-bad/10 text-red-600 dark:text-signal-bad transition">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Pipeline */}
        <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] rounded-xl dark:rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-signal-ink mb-3 dark:font-mono dark:text-[10px] dark:uppercase dark:tracking-[0.14em] dark:text-signal-muted">Status Tracking</h3>
          <div className="flex items-center gap-2">
            {STATUS_FLOW.map((status, idx) => {
              const cfg = STATUS_CONFIG[status];
              const isActive = idx <= currentStatusIdx;
              const isCurrent = status === selectedChange.status;
              return (
                <React.Fragment key={status}>
                  <button
                    onClick={() => updateStatus(selectedChange.id, status)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                      isCurrent ? cfg.color + ' ring-2 ring-offset-2 ring-primary-500 dark:ring-signal-green dark:ring-offset-signal-canvas' :
                      isActive ? cfg.color + ' opacity-60' :
                      'bg-gray-100 dark:bg-white/[0.04] text-gray-400 dark:text-signal-muted'
                    }`}
                  >
                    {cfg.icon}
                    {cfg.label}
                  </button>
                  {idx < STATUS_FLOW.length - 1 && <ArrowRight className="w-4 h-4 text-gray-300 dark:text-signal-muted" />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            {/* Summary */}
            <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] rounded-xl dark:rounded-2xl p-5">
              <h3 className="font-semibold text-gray-900 dark:text-signal-ink mb-3">Summary</h3>
              <p className="text-sm text-gray-600 dark:text-signal-body whitespace-pre-wrap">{selectedChange.summary || selectedChange.description}</p>
              {selectedChange.sourceUrl && (
                <a href={selectedChange.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-3 text-sm text-primary-600 dark:text-signal-green hover:underline">
                  <ExternalLink className="w-4 h-4" />
                  View Source
                </a>
              )}
            </div>

            {/* AI Analysis */}
            {selectedChange.aiAnalysis && (
              <div className="bg-purple-50 dark:bg-signal-violet/[0.08] border border-purple-200 dark:border-signal-violet/20 rounded-xl dark:rounded-2xl p-5">
                <h3 className="font-semibold text-purple-800 dark:text-signal-violet mb-3 flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  AI Impact Analysis
                </h3>
                <p className="text-sm text-purple-700 dark:text-signal-body whitespace-pre-wrap">{selectedChange.aiAnalysis}</p>
              </div>
            )}

            {/* Affected Controls */}
            <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] rounded-xl dark:rounded-2xl p-5">
              <h3 className="font-semibold text-gray-900 dark:text-signal-ink mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-500 dark:text-signal-warn" />
                Affected Controls ({selectedChange.affectedControls?.length || 0})
              </h3>
              {(!selectedChange.affectedControls || selectedChange.affectedControls.length === 0) ? (
                <div className="text-center py-8">
                  <Target className="w-8 h-8 mx-auto text-gray-300 dark:text-signal-muted mb-2" />
                  <p className="text-sm text-gray-500 dark:text-signal-muted">Run AI Impact Analysis to identify affected controls</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedChange.affectedControls.map(ctrl => (
                    <div key={ctrl.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/[0.04] rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-signal-ink">{ctrl.name}</p>
                        <p className="text-xs text-gray-500 dark:text-signal-muted">{ctrl.framework} &middot; {ctrl.currentStatus}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          ctrl.impactLevel === 'high' ? 'bg-red-100 text-red-700 dark:bg-signal-bad/10 dark:text-signal-bad' :
                          ctrl.impactLevel === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-signal-warn/10 dark:text-signal-warn' :
                          'bg-green-100 text-green-700 dark:bg-signal-good/10 dark:text-signal-good'
                        }`}>{ctrl.impactLevel} impact</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Remediation Suggestions */}
            <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] rounded-xl dark:rounded-2xl p-5">
              <h3 className="font-semibold text-gray-900 dark:text-signal-ink mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500 dark:text-signal-warn" />
                Remediation Suggestions
              </h3>
              {(!selectedChange.remediationSuggestions || selectedChange.remediationSuggestions.length === 0) ? (
                <div className="text-center py-8">
                  <Zap className="w-8 h-8 mx-auto text-gray-300 dark:text-signal-muted mb-2" />
                  <p className="text-sm text-gray-500 dark:text-signal-muted">No remediation suggestions yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedChange.remediationSuggestions.map((rem, idx) => (
                    <div key={rem.id || idx} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-white/[0.04] rounded-lg">
                      <span className={`text-xs px-2 py-0.5 rounded-full mt-0.5 ${
                        rem.priority === 'critical' ? 'bg-red-100 text-red-700 dark:bg-signal-bad/10 dark:text-signal-bad' :
                        rem.priority === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-signal-warn/10 dark:text-signal-warn' :
                        rem.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-signal-amber/10 dark:text-signal-amber' :
                        'bg-green-100 text-green-700 dark:bg-signal-good/10 dark:text-signal-good'
                      }`}>{rem.priority}</span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-signal-ink">{rem.action}</p>
                        <p className="text-xs text-gray-500 dark:text-signal-muted mt-1">Effort: {rem.effort}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] rounded-xl dark:rounded-2xl p-4 space-y-3">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-signal-muted dark:font-mono dark:text-[10px] dark:uppercase dark:tracking-[0.14em]">{t('common.details')}</h4>
              {[
                { label: 'Regulation', value: selectedChange.regulation },
                { label: 'Jurisdiction', value: selectedChange.jurisdiction },
                { label: 'Published', value: selectedChange.publishedDate ? new Date(selectedChange.publishedDate).toLocaleDateString() : 'N/A' },
                { label: 'Effective', value: selectedChange.effectiveDate ? new Date(selectedChange.effectiveDate).toLocaleDateString() : 'N/A' },
                { label: 'Assigned To', value: selectedChange.assignedTo || 'Unassigned' },
                { label: 'Last Updated', value: new Date(selectedChange.updatedAt).toLocaleDateString() },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 dark:text-signal-muted">{label}</span>
                  <span className="text-gray-900 dark:text-signal-ink font-medium">{value}</span>
                </div>
              ))}
            </div>

            {selectedChange.effectiveDate && (() => {
              const dl = daysUntil(selectedChange.effectiveDate);
              if (dl === null) return null;
              return (
                <div className={`border rounded-xl dark:rounded-2xl p-4 ${
                  dl <= 0 ? 'bg-red-50 dark:bg-signal-bad/[0.08] border-red-200 dark:border-signal-bad/20' :
                  dl <= 30 ? 'bg-orange-50 dark:bg-signal-warn/[0.08] border-orange-200 dark:border-signal-warn/20' :
                  'bg-green-50 dark:bg-signal-good/[0.08] border-green-200 dark:border-signal-good/20'
                }`}>
                  <p className={`text-2xl font-bold dark:font-display ${dl <= 0 ? 'text-red-700 dark:text-signal-bad' : dl <= 30 ? 'text-orange-700 dark:text-signal-warn' : 'text-green-700 dark:text-signal-good'}`}>
                    {dl <= 0 ? 'Past Due' : `${dl} days`}
                  </p>
                  <p className={`text-sm ${dl <= 0 ? 'text-red-600 dark:text-signal-bad' : dl <= 30 ? 'text-orange-600 dark:text-signal-warn' : 'text-green-600 dark:text-signal-good'}`}>
                    {dl <= 0 ? 'Effective date has passed' : 'until effective date'}
                  </p>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    );
  };

  // ── Add/Edit Modal ────────────────────────────────────────────────────

  const renderAddModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setShowAddModal(false); setEditingId(null); }}>
      <div className="bg-white dark:bg-signal-panel2 dark:border dark:border-white/[0.08] rounded-xl dark:rounded-2xl shadow-xl w-full max-w-xl mx-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/[0.08]">
          <h3 className="font-semibold text-gray-900 dark:text-signal-ink">{editingId ? t('common.edit') : t('common.add')} Regulatory Change</h3>
          <button onClick={() => { setShowAddModal(false); setEditingId(null); }} className="p-1 hover:bg-gray-100 dark:hover:bg-white/[0.06] rounded"><X className="w-5 h-5 text-gray-500 dark:text-signal-muted" /></button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-signal-body mb-1">Title</label>
            <input type="text" value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-white/[0.10] rounded-lg bg-white dark:bg-white/[0.04] text-gray-900 dark:text-signal-ink" placeholder="Regulatory change title" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-signal-body mb-1">Change Type</label>
              <select value={form.changeType} onChange={e => setForm({ ...form, changeType: e.target.value as ChangeType })} className="w-full px-3 py-2 border border-gray-200 dark:border-white/[0.10] rounded-lg bg-white dark:bg-white/[0.04] text-gray-900 dark:text-signal-ink text-sm">
                {Object.entries(CHANGE_TYPE_CONFIG).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-signal-body mb-1">{t('common.severity')}</label>
              <select value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value as ChangeSeverity })} className="w-full px-3 py-2 border border-gray-200 dark:border-white/[0.10] rounded-lg bg-white dark:bg-white/[0.04] text-gray-900 dark:text-signal-ink text-sm">
                {Object.entries(SEVERITY_CONFIG).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-signal-body mb-1">Regulation</label>
              <select value={form.regulation || ''} onChange={e => setForm({ ...form, regulation: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-white/[0.10] rounded-lg bg-white dark:bg-white/[0.04] text-gray-900 dark:text-signal-ink text-sm">
                <option value="">Select...</option>
                {REGULATIONS.map(r => (<option key={r} value={r}>{r}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-signal-body mb-1">Jurisdiction</label>
              <input type="text" value={form.jurisdiction || ''} onChange={e => setForm({ ...form, jurisdiction: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-white/[0.10] rounded-lg bg-white dark:bg-white/[0.04] text-gray-900 dark:text-signal-ink" placeholder="e.g., EU, US, CA" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-signal-body mb-1">Summary</label>
            <textarea value={form.summary || ''} onChange={e => setForm({ ...form, summary: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-200 dark:border-white/[0.10] rounded-lg bg-white dark:bg-white/[0.04] text-gray-900 dark:text-signal-ink" placeholder="Brief summary of the change" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-signal-body mb-1">{t('common.description')}</label>
            <textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} className="w-full px-3 py-2 border border-gray-200 dark:border-white/[0.10] rounded-lg bg-white dark:bg-white/[0.04] text-gray-900 dark:text-signal-ink" placeholder="Detailed description" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-signal-body mb-1">Source URL</label>
            <input type="url" value={form.sourceUrl || ''} onChange={e => setForm({ ...form, sourceUrl: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-white/[0.10] rounded-lg bg-white dark:bg-white/[0.04] text-gray-900 dark:text-signal-ink" placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-signal-body mb-1">Published Date</label>
              <input type="date" value={form.publishedDate || ''} onChange={e => setForm({ ...form, publishedDate: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-white/[0.10] rounded-lg bg-white dark:bg-white/[0.04] text-gray-900 dark:text-signal-ink" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-signal-body mb-1">Effective Date</label>
              <input type="date" value={form.effectiveDate || ''} onChange={e => setForm({ ...form, effectiveDate: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-white/[0.10] rounded-lg bg-white dark:bg-white/[0.04] text-gray-900 dark:text-signal-ink" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-white/[0.08]">
          <button onClick={() => { setShowAddModal(false); setEditingId(null); }} className="px-4 py-2 text-sm text-gray-700 dark:text-signal-body hover:bg-gray-100 dark:hover:bg-white/[0.06] rounded-lg">{t('common.cancel')}</button>
          <button onClick={saveChange} disabled={!form.title} className="px-4 py-2 text-sm bg-primary-600 text-white dark:bg-signal-green dark:text-signal-canvas rounded-lg hover:bg-primary-700 dark:hover:bg-signal-green/90 disabled:opacity-50">{editingId ? t('common.save') : t('common.create')}</button>
        </div>
      </div>
    </div>
  );

  const renderDeleteConfirm = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDeleteConfirm(null)}>
      <div className="bg-white dark:bg-signal-panel2 dark:border dark:border-white/[0.08] rounded-xl dark:rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-signal-ink mb-2">Delete Change</h3>
        <p className="text-sm text-gray-500 dark:text-signal-muted mb-4">Are you sure? This action cannot be undone.</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 text-sm text-gray-700 dark:text-signal-body hover:bg-gray-100 dark:hover:bg-white/[0.06] rounded-lg">{t('common.cancel')}</button>
          <button onClick={() => showDeleteConfirm && deleteChange(showDeleteConfirm)} className="px-4 py-2 text-sm bg-red-600 text-white dark:bg-signal-bad dark:text-signal-canvas rounded-lg hover:bg-red-700 dark:hover:bg-signal-bad/90">{t('common.delete')}</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-signal-canvas min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        {viewMode === 'list' && renderListView()}
        {viewMode === 'detail' && renderDetailView()}
        {showAddModal && renderAddModal()}
        {showDeleteConfirm && renderDeleteConfirm()}
      </div>
    </div>
  );
};

export default RegulatoryChangeTracker;
