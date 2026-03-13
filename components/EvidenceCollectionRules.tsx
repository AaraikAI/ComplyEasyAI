/**
 * Evidence Collection Rules Component
 *
 * Automated evidence collection rule builder:
 * - Rule CRUD with control linkage, integration source selection
 * - Integration sources: AWS Config, GitHub Actions, Jira, Slack, Google Drive, etc.
 * - Query configuration, schedule (cron picker), active/inactive toggle
 * - Collection status dashboard with last collected date, success/failure per rule
 * - Manual trigger button
 * - Evidence freshness indicators (green < 30d, yellow < 90d, red > 90d)
 * - API calls to /api/evidence-collection
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import {
  ArrowLeft, Plus, Loader2, Search, X, Filter, Trash2, Edit3, Eye,
  CheckCircle, Clock, AlertTriangle, Play, Pause, RefreshCw, Settings,
  Zap, Database, Cloud, GitBranch, MessageSquare, FolderOpen, Shield,
  Activity, BarChart3, ChevronRight, Power, Calendar, Download,
  Check, XCircle, FileText, Link, Server, HardDrive, AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Type Definitions ────────────────────────────────────────────────────────

type ScheduleFrequency = 'hourly' | 'daily' | 'weekly' | 'monthly';
type RuleStatus = 'active' | 'inactive';
type CollectionStatus = 'success' | 'failure' | 'running' | 'pending';

interface IntegrationSource {
  id: string;
  name: string;
  icon: React.ReactNode;
  category: string;
  connected: boolean;
}

interface LinkedControl {
  id: string;
  name: string;
  framework: string;
}

interface CollectionRun {
  id: string;
  ruleId: string;
  status: CollectionStatus;
  evidenceCount: number;
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
}

interface EvidenceRule {
  id: string;
  name: string;
  description: string;
  integrationSource: string;
  sourceConfig: Record<string, any>;
  query: string;
  schedule: {
    frequency: ScheduleFrequency;
    dayOfWeek?: number;
    dayOfMonth?: number;
    hour: number;
    minute: number;
    cronExpression: string;
  };
  status: RuleStatus;
  linkedControls: LinkedControl[];
  lastCollectedAt?: string;
  lastStatus?: CollectionStatus;
  successCount: number;
  failureCount: number;
  totalCollected: number;
  createdAt: string;
  updatedAt: string;
  recentRuns: CollectionRun[];
}

interface DashboardMetrics {
  totalRules: number;
  activeRules: number;
  totalCollected: number;
  successRate: number;
  lastCollectionTime: string;
  staleEvidenceCount: number;
}

type ViewMode = 'dashboard' | 'rules' | 'create' | 'edit' | 'detail';

const INTEGRATION_SOURCES: IntegrationSource[] = [
  { id: 'aws_config', name: 'AWS Config', icon: <Cloud className="w-5 h-5" />, category: 'Cloud', connected: true },
  { id: 'github_actions', name: 'GitHub Actions', icon: <GitBranch className="w-5 h-5" />, category: 'CI/CD', connected: true },
  { id: 'jira', name: 'Jira', icon: <FileText className="w-5 h-5" />, category: 'Project Management', connected: true },
  { id: 'slack', name: 'Slack', icon: <MessageSquare className="w-5 h-5" />, category: 'Communication', connected: false },
  { id: 'google_drive', name: 'Google Drive', icon: <FolderOpen className="w-5 h-5" />, category: 'Storage', connected: true },
  { id: 'azure_devops', name: 'Azure DevOps', icon: <Server className="w-5 h-5" />, category: 'CI/CD', connected: false },
  { id: 'confluence', name: 'Confluence', icon: <FileText className="w-5 h-5" />, category: 'Documentation', connected: true },
  { id: 'datadog', name: 'Datadog', icon: <Activity className="w-5 h-5" />, category: 'Monitoring', connected: false },
  { id: 'aws_cloudtrail', name: 'AWS CloudTrail', icon: <HardDrive className="w-5 h-5" />, category: 'Cloud', connected: true },
  { id: 'okta', name: 'Okta', icon: <Shield className="w-5 h-5" />, category: 'Identity', connected: true },
  { id: 'gcp_security', name: 'GCP Security Command', icon: <Cloud className="w-5 h-5" />, category: 'Cloud', connected: false },
  { id: 'servicenow', name: 'ServiceNow', icon: <Database className="w-5 h-5" />, category: 'ITSM', connected: false },
];

const CRON_PRESETS: { label: string; frequency: ScheduleFrequency; cron: string }[] = [
  { label: 'Every hour', frequency: 'hourly', cron: '0 * * * *' },
  { label: 'Daily at 6 AM', frequency: 'daily', cron: '0 6 * * *' },
  { label: 'Daily at midnight', frequency: 'daily', cron: '0 0 * * *' },
  { label: 'Weekly (Monday)', frequency: 'weekly', cron: '0 9 * * 1' },
  { label: 'Weekly (Friday)', frequency: 'weekly', cron: '0 9 * * 5' },
  { label: 'Monthly (1st)', frequency: 'monthly', cron: '0 9 1 * *' },
  { label: 'Monthly (15th)', frequency: 'monthly', cron: '0 9 15 * *' },
];

const generateId = () => `ecr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const getFreshnessColor = (dateStr?: string): { color: string; label: string; bg: string } => {
  if (!dateStr) return { color: 'text-gray-400', label: 'Never', bg: 'bg-gray-100 dark:bg-gray-700' };
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  if (days < 30) return { color: 'text-green-600 dark:text-green-400', label: `${days}d ago`, bg: 'bg-green-100 dark:bg-green-900/30' };
  if (days < 90) return { color: 'text-yellow-600 dark:text-yellow-400', label: `${days}d ago`, bg: 'bg-yellow-100 dark:bg-yellow-900/30' };
  return { color: 'text-red-600 dark:text-red-400', label: `${days}d ago`, bg: 'bg-red-100 dark:bg-red-900/30' };
};

// ── Main Component ──────────────────────────────────────────────────────────

const EvidenceCollectionRules: React.FC = () => {
  const { user } = useAuth();
  const { t } = useI18n();
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [rules, setRules] = useState<EvidenceRule[]>([]);
  const [selectedRule, setSelectedRule] = useState<EvidenceRule | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState('all');
  const [filterStatus, setFilterStatus] = useState<RuleStatus | 'all'>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState<Partial<EvidenceRule>>({
    name: '',
    description: '',
    integrationSource: '',
    query: '',
    sourceConfig: {},
    schedule: { frequency: 'daily', hour: 6, minute: 0, cronExpression: '0 6 * * *' },
    status: 'active',
    linkedControls: [],
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [availableControls, setAvailableControls] = useState<LinkedControl[]>([]);
  const [controlSearch, setControlSearch] = useState('');

  useEffect(() => {
    loadRules();
    loadMetrics();
    loadControls();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    try {
      const res = await api.get('/evidence-collection/rules');
      setRules(Array.isArray(res.data) ? res.data : (res.data?.rules || []));
    } catch {
      setRules([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      const res = await api.get('/evidence-collection/metrics');
      setMetrics(res.data);
    } catch {
      setMetrics(null);
    }
  };

  const loadControls = async () => {
    try {
      const res = await api.get('/controls');
      const controls = Array.isArray(res.data) ? res.data : (res.data?.controls || []);
      setAvailableControls(controls.map((c: any) => ({ id: c.id, name: c.name || c.title, framework: c.framework || '' })));
    } catch {
      setAvailableControls([]);
    }
  };

  const saveRule = async () => {
    try {
      if (editingId) {
        const res = await api.put(`/evidence-collection/rules/${editingId}`, form);
        setRules(prev => prev.map(r => r.id === editingId ? { ...r, ...form, ...(res.data || {}), updatedAt: new Date().toISOString() } as EvidenceRule : r));
        toast.success('Rule updated');
      } else {
        const newRule = {
          ...form,
          id: generateId(),
          successCount: 0,
          failureCount: 0,
          totalCollected: 0,
          recentRuns: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const res = await api.post('/evidence-collection/rules', form);
        setRules(prev => [...prev, (res.data || newRule) as EvidenceRule]);
        toast.success('Rule created');
      }
      setViewMode('rules');
      setEditingId(null);
      resetForm();
      loadMetrics();
    } catch {
      toast.error('Failed to save rule');
    }
  };

  const deleteRule = async (id: string) => {
    try {
      await api.delete(`/evidence-collection/rules/${id}`);
      setRules(prev => prev.filter(r => r.id !== id));
      toast.success('Rule deleted');
      setShowDeleteConfirm(null);
      loadMetrics();
    } catch {
      toast.error('Failed to delete rule');
    }
  };

  const toggleRuleStatus = async (rule: EvidenceRule) => {
    const newStatus: RuleStatus = rule.status === 'active' ? 'inactive' : 'active';
    try {
      await api.patch(`/evidence-collection/rules/${rule.id}`, { status: newStatus });
      setRules(prev => prev.map(r => r.id === rule.id ? { ...r, status: newStatus } : r));
      toast.success(`Rule ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
    } catch {
      toast.error('Failed to toggle rule');
    }
  };

  const triggerCollection = async (ruleId: string) => {
    setTriggering(ruleId);
    try {
      await api.post(`/evidence-collection/rules/${ruleId}/trigger`);
      toast.success('Collection triggered');
      setTimeout(() => {
        loadRules();
        loadMetrics();
      }, 2000);
    } catch {
      toast.error('Failed to trigger collection');
    } finally {
      setTriggering(null);
    }
  };

  const resetForm = () => {
    setForm({
      name: '', description: '', integrationSource: '', query: '', sourceConfig: {},
      schedule: { frequency: 'daily', hour: 6, minute: 0, cronExpression: '0 6 * * *' },
      status: 'active', linkedControls: [],
    });
  };

  const openEdit = (rule: EvidenceRule) => {
    setForm({
      name: rule.name, description: rule.description, integrationSource: rule.integrationSource,
      query: rule.query, sourceConfig: rule.sourceConfig, schedule: rule.schedule,
      status: rule.status, linkedControls: rule.linkedControls,
    });
    setEditingId(rule.id);
    setViewMode('edit');
  };

  const filteredRules = useMemo(() => {
    return rules.filter(r => {
      if (filterSource !== 'all' && r.integrationSource !== filterSource) return false;
      if (filterStatus !== 'all' && r.status !== filterStatus) return false;
      if (searchQuery && !r.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [rules, filterSource, filterStatus, searchQuery]);

  const getSourceInfo = (sourceId: string) => INTEGRATION_SOURCES.find(s => s.id === sourceId);

  const filteredControls = useMemo(() => {
    if (!controlSearch) return availableControls.slice(0, 20);
    return availableControls.filter(c =>
      c.name.toLowerCase().includes(controlSearch.toLowerCase()) ||
      c.framework.toLowerCase().includes(controlSearch.toLowerCase())
    ).slice(0, 20);
  }, [availableControls, controlSearch]);

  // ── Render: Dashboard ─────────────────────────────────────────────────

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('evidence.title')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Automated evidence collection rules and monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setViewMode('rules')} className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition">
            <Settings className="w-4 h-4" />
            Manage Rules
          </button>
          <button onClick={() => { resetForm(); setEditingId(null); setViewMode('create'); }} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
            <Plus className="w-4 h-4" />
            New Rule
          </button>
        </div>
      </div>

      {/* Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Total Rules', value: metrics.totalRules, icon: <Database className="w-5 h-5" />, color: 'text-blue-600 dark:text-blue-400' },
            { label: 'Active', value: metrics.activeRules, icon: <Power className="w-5 h-5" />, color: 'text-green-600 dark:text-green-400' },
            { label: 'Evidence Collected', value: metrics.totalCollected, icon: <Download className="w-5 h-5" />, color: 'text-purple-600 dark:text-purple-400' },
            { label: 'Success Rate', value: `${metrics.successRate}%`, icon: <CheckCircle className="w-5 h-5" />, color: 'text-teal-600 dark:text-teal-400' },
            { label: 'Last Collection', value: metrics.lastCollectionTime ? new Date(metrics.lastCollectionTime).toLocaleDateString() : 'N/A', icon: <Clock className="w-5 h-5" />, color: 'text-gray-600 dark:text-gray-400' },
            { label: 'Stale Evidence', value: metrics.staleEvidenceCount, icon: <AlertTriangle className="w-5 h-5" />, color: 'text-red-600 dark:text-red-400' },
          ].map((m, i) => (
            <div key={i} className="bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <div className={`${m.color} mb-2`}>{m.icon}</div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{m.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{m.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Collection Status Grid */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Collection Status</h3>
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
        ) : rules.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl">
            <Database className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">{t('common.noResults')}</p>
            <button onClick={() => setViewMode('create')} className="mt-4 text-primary-600 dark:text-primary-400 text-sm hover:underline">Create your first rule</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rules.map(rule => {
              const source = getSourceInfo(rule.integrationSource);
              const freshness = getFreshnessColor(rule.lastCollectedAt);
              return (
                <div key={rule.id} className="bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400">
                        {source?.icon || <Database className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{rule.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{source?.name || rule.integrationSource}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleRuleStatus(rule)}
                      className={`relative w-10 h-5 rounded-full transition ${rule.status === 'active' ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${rule.status === 'active' ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>

                  {/* Freshness indicator */}
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${freshness.bg} mb-3`}>
                    <Clock className={`w-4 h-4 ${freshness.color}`} />
                    <span className={`text-sm font-medium ${freshness.color}`}>Last: {freshness.label}</span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{rule.totalCollected}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Collected</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">{rule.successCount}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Success</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-red-600 dark:text-red-400">{rule.failureCount}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Failed</p>
                    </div>
                  </div>

                  {/* Controls */}
                  {rule.linkedControls.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {rule.linkedControls.slice(0, 3).map(ctrl => (
                        <span key={ctrl.id} className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">{ctrl.name}</span>
                      ))}
                      {rule.linkedControls.length > 3 && (
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">+{rule.linkedControls.length - 3}</span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => triggerCollection(rule.id)}
                      disabled={triggering === rule.id || rule.status === 'inactive'}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition disabled:opacity-50"
                    >
                      {triggering === rule.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                      Collect Now
                    </button>
                    <button onClick={() => openEdit(rule)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setSelectedRule(rule); setViewMode('detail'); }} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // ── Render: Rules List ────────────────────────────────────────────────

  const renderRulesList = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setViewMode('dashboard')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Collection Rules</h2>
        </div>
        <button onClick={() => { resetForm(); setEditingId(null); setViewMode('create'); }} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
          <Plus className="w-4 h-4" />
          New Rule
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={t('common.search')} className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-surface-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500" />
        </div>
        <select value={filterSource} onChange={e => setFilterSource(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-surface-800 text-gray-900 dark:text-white">
          <option value="all">All Sources</option>
          {INTEGRATION_SOURCES.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-surface-800 text-gray-900 dark:text-white">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-surface-700">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Rule</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Source</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Schedule</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Freshness</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('common.status')}</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Stats</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredRules.map(rule => {
              const source = getSourceInfo(rule.integrationSource);
              const freshness = getFreshnessColor(rule.lastCollectedAt);
              return (
                <tr key={rule.id} className="hover:bg-gray-50 dark:hover:bg-surface-700/50">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{rule.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{rule.linkedControls.length} controls linked</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 dark:text-gray-400">{source?.icon}</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{source?.name || rule.integrationSource}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{rule.schedule.frequency}</td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium ${freshness.color}`}>{freshness.label}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${rule.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                      {rule.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="text-green-600 dark:text-green-400">{rule.successCount}</span>
                    <span className="text-gray-400 mx-1">/</span>
                    <span className="text-red-600 dark:text-red-400">{rule.failureCount}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => triggerCollection(rule.id)} disabled={triggering === rule.id} className="p-1.5 text-gray-400 hover:text-primary-600 rounded" title="Trigger collection">
                        {triggering === rule.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button onClick={() => openEdit(rule)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded" title="Edit"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => setShowDeleteConfirm(rule.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredRules.length === 0 && (
          <div className="text-center py-12">
            <Database className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.noResults')}</p>
          </div>
        )}
      </div>
    </div>
  );

  // ── Render: Create/Edit Form ──────────────────────────────────────────

  const renderForm = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => { setViewMode('rules'); setEditingId(null); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editingId ? t('common.edit') : t('common.create')} Collection Rule</h2>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Rule Details</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.name')}</label>
              <input type="text" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-surface-700 text-gray-900 dark:text-white" placeholder="e.g., AWS IAM Policy Evidence" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.description')}</label>
              <textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-surface-700 text-gray-900 dark:text-white" placeholder="Describe what this rule collects" />
            </div>
          </div>

          {/* Integration Source */}
          <div className="bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Integration Source</h3>
            <div className="grid grid-cols-3 gap-3">
              {INTEGRATION_SOURCES.map(source => (
                <button
                  key={source.id}
                  onClick={() => setForm({ ...form, integrationSource: source.id })}
                  className={`flex items-center gap-3 p-3 border rounded-lg text-left transition ${
                    form.integrationSource === source.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-500'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  } ${!source.connected ? 'opacity-60' : ''}`}
                >
                  <div className="text-gray-600 dark:text-gray-400">{source.icon}</div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{source.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {source.connected ? source.category : 'Not connected'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Query Config */}
          <div className="bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Query Configuration</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Query / Filter</label>
              <textarea
                value={form.query || ''}
                onChange={e => setForm({ ...form, query: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-surface-700 text-gray-900 dark:text-white font-mono text-sm"
                placeholder={`e.g., SELECT * FROM aws_config_rules WHERE compliance_type = 'NON_COMPLIANT'`}
              />
            </div>
          </div>

          {/* Control Linkage */}
          <div className="bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">{t('evidence.linkedControl')}</h3>
            <input
              type="text"
              value={controlSearch}
              onChange={e => setControlSearch(e.target.value)}
              placeholder={t('common.search')}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-surface-700 text-gray-900 dark:text-white text-sm"
            />
            {(form.linkedControls || []).length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {form.linkedControls!.map(ctrl => (
                  <span key={ctrl.id} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                    {ctrl.name}
                    <button onClick={() => setForm({ ...form, linkedControls: form.linkedControls!.filter(c => c.id !== ctrl.id) })}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="max-h-40 overflow-y-auto space-y-1">
              {filteredControls.filter(c => !(form.linkedControls || []).find(lc => lc.id === c.id)).map(ctrl => (
                <button
                  key={ctrl.id}
                  onClick={() => setForm({ ...form, linkedControls: [...(form.linkedControls || []), ctrl] })}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  <Plus className="w-3 h-3 text-gray-400" />
                  <span>{ctrl.name}</span>
                  <span className="text-xs text-gray-400 ml-auto">{ctrl.framework}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Schedule */}
          <div className="bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Schedule</h4>
            <div className="space-y-2">
              {CRON_PRESETS.map(preset => (
                <button
                  key={preset.cron}
                  onClick={() => setForm({
                    ...form,
                    schedule: { ...form.schedule!, frequency: preset.frequency, cronExpression: preset.cron },
                  })}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg border transition ${
                    form.schedule?.cronExpression === preset.cron
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <p className="font-medium">{preset.label}</p>
                  <p className="text-xs text-gray-400 font-mono">{preset.cron}</p>
                </button>
              ))}
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Custom Cron</label>
              <input
                type="text"
                value={form.schedule?.cronExpression || ''}
                onChange={e => setForm({ ...form, schedule: { ...form.schedule!, cronExpression: e.target.value } })}
                className="w-full px-3 py-2 text-sm font-mono border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-surface-700 text-gray-900 dark:text-white"
                placeholder="0 * * * *"
              />
            </div>
          </div>

          {/* Status Toggle */}
          <div className="bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('common.active')}</span>
              <button
                onClick={() => setForm({ ...form, status: form.status === 'active' ? 'inactive' : 'active' })}
                className={`relative w-11 h-6 rounded-full transition ${form.status === 'active' ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.status === 'active' ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={saveRule}
            disabled={!form.name || !form.integrationSource}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            {editingId ? t('common.save') : t('common.create')}
          </button>
        </div>
      </div>
    </div>
  );

  // ── Render: Detail View ───────────────────────────────────────────────

  const renderDetail = () => {
    if (!selectedRule) return null;
    const source = getSourceInfo(selectedRule.integrationSource);
    const freshness = getFreshnessColor(selectedRule.lastCollectedAt);
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => { setViewMode('dashboard'); setSelectedRule(null); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedRule.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{source?.name || selectedRule.integrationSource}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => triggerCollection(selectedRule.id)} disabled={triggering === selectedRule.id} className="flex items-center gap-2 px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50">
              {triggering === selectedRule.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Collect Now
            </button>
            <button onClick={() => openEdit(selectedRule)} className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition">
              <Edit3 className="w-4 h-4" />
              {t('common.edit')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Collected', value: selectedRule.totalCollected, color: 'text-blue-600 dark:text-blue-400' },
            { label: 'Successes', value: selectedRule.successCount, color: 'text-green-600 dark:text-green-400' },
            { label: 'Failures', value: selectedRule.failureCount, color: 'text-red-600 dark:text-red-400' },
            { label: 'Freshness', value: freshness.label, color: freshness.color },
          ].map((m, i) => (
            <div key={i} className="bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center">
              <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Recent Runs */}
        <div className="bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Collection Runs</h3>
          {(!selectedRule.recentRuns || selectedRule.recentRuns.length === 0) ? (
            <div className="text-center py-8">
              <Activity className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No collection runs recorded yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedRule.recentRuns.map(run => (
                <div key={run.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-surface-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    {run.status === 'success' ? <CheckCircle className="w-5 h-5 text-green-500" /> :
                     run.status === 'failure' ? <XCircle className="w-5 h-5 text-red-500" /> :
                     run.status === 'running' ? <Loader2 className="w-5 h-5 text-blue-500 animate-spin" /> :
                     <Clock className="w-5 h-5 text-gray-400" />}
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">{new Date(run.startedAt).toLocaleString()}</p>
                      {run.errorMessage && <p className="text-xs text-red-500 mt-0.5">{run.errorMessage}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-900 dark:text-white">{run.evidenceCount} items</p>
                    {run.durationMs && <p className="text-xs text-gray-500 dark:text-gray-400">{(run.durationMs / 1000).toFixed(1)}s</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Linked Controls */}
        <div className="bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Linked Controls ({selectedRule.linkedControls.length})</h3>
          {selectedRule.linkedControls.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No controls linked to this rule</p>
          ) : (
            <div className="space-y-2">
              {selectedRule.linkedControls.map(ctrl => (
                <div key={ctrl.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-surface-700 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{ctrl.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{ctrl.framework}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDeleteConfirm = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDeleteConfirm(null)}>
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('common.delete')}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">This will permanently delete this collection rule and all its history.</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">{t('common.cancel')}</button>
          <button onClick={() => showDeleteConfirm && deleteRule(showDeleteConfirm)} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">{t('common.delete')}</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-surface-800 min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        {viewMode === 'dashboard' && renderDashboard()}
        {viewMode === 'rules' && renderRulesList()}
        {(viewMode === 'create' || viewMode === 'edit') && renderForm()}
        {viewMode === 'detail' && renderDetail()}
        {showDeleteConfirm && renderDeleteConfirm()}
      </div>
    </div>
  );
};

export default EvidenceCollectionRules;
