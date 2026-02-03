import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { isAtLimit, getUpgradeMessage } from '../constants/tierLimits';
import { TierLimitBanner } from './TierLimitBanner';
import ReactMarkdown from 'react-markdown';
import {
  ArrowLeft, Plus, Loader2, Search, Filter, X, ChevronDown, ChevronUp,
  ShieldAlert, ShieldCheck, AlertTriangle, Brain, Eye, Trash2, Edit3,
  BarChart3, CheckCircle, Clock, XCircle, Play, Power, PowerOff,
  Activity, Zap, TrendingUp, TrendingDown, Minus, RefreshCw, Lightbulb,
  ListChecks, Server, Cloud, Fingerprint, Monitor, Code,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, Legend, LineChart, Line, CartesianGrid,
} from 'recharts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ContinuousMonitor {
  id: string;
  organizationId: string;
  name: string;
  monitorType: string;
  integrationId?: string;
  configuration: any;
  testScript?: string;
  status: 'Passing' | 'Warning' | 'Failing' | 'Unknown';
  lastRun?: string;
  nextRun?: string;
  frequency: string;
  findings?: any;
  alerts?: { count: number; critical: number; warnings: number };
  active: boolean;
  createdAt: string;
  updatedAt: string;
  results?: MonitorResult[];
}

interface MonitorResult {
  id: string;
  monitorId: string;
  status: string;
  runDate: string;
  passedTests: number;
  failedTests: number;
  findings?: any;
  evidence?: any;
  autoRemediated: boolean;
  remediationActions?: any;
}

interface Dashboard {
  totalMonitors: number;
  activeMonitors: number;
  statusDistribution: { passing: number; warning: number; failing: number; unknown: number };
  typeDistribution: { infrastructure: number; cloud: number; identity: number; device: number; code: number };
  totalAlerts: number;
  criticalAlerts: number;
  autoRemediatedCount: number;
  failingMonitors: { id: string; name: string; monitorType: string; lastRun: string; alerts: any }[];
}

interface AITrendAnalysis {
  trendDirection: string;
  trendSummary: string;
  predictedNextFailureWindow: string;
  failureRiskScore: number;
  rootCauseAnalysis: string[];
  recommendedActions: string[];
  anomalies: string[];
  healthScore: number;
}

interface AISuggestion {
  name: string;
  monitorType: string;
  frequency: string;
  reason: string;
  priority: string;
  configuration: { description: string; tests: string[] };
}

interface AITriageItem {
  monitorId: string;
  monitorName: string;
  priority: number;
  severity: string;
  businessImpact: string;
  category: string;
  suggestedRemediation: string;
  estimatedEffort: string;
  relatedMonitors: string[];
}

type ViewMode = 'dashboard' | 'list' | 'detail' | 'create' | 'edit' | 'results'
  | 'ai-suggest' | 'ai-triage' | 'ai-analyze';

const STATUS_COLORS: Record<string, string> = {
  Passing: 'bg-green-100 text-green-800 border-green-200',
  Warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Failing: 'bg-red-100 text-red-800 border-red-200',
  Unknown: 'bg-gray-100 text-gray-600 border-gray-200',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  Passing: <CheckCircle className="w-4 h-4 text-green-600" />,
  Warning: <AlertTriangle className="w-4 h-4 text-yellow-600" />,
  Failing: <XCircle className="w-4 h-4 text-red-600" />,
  Unknown: <Clock className="w-4 h-4 text-gray-500" />,
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  Infrastructure: <Server className="w-4 h-4" />,
  Cloud: <Cloud className="w-4 h-4" />,
  Identity: <Fingerprint className="w-4 h-4" />,
  Device: <Monitor className="w-4 h-4" />,
  Code: <Code className="w-4 h-4" />,
};

const PIE_COLORS = ['#22c55e', '#eab308', '#ef4444', '#9ca3af'];
const TYPE_PIE_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#6366f1'];

const MONITOR_TYPES = ['Infrastructure', 'Cloud', 'Identity', 'Device', 'Code'];
const FREQUENCIES = ['Hourly', 'Daily', 'Weekly', 'Monthly'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function MonitoringDashboard() {
  const { user } = useAuth();
  const plan = user?.tier || user?.plan || 'Foundation';

  // Core state
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [monitors, setMonitors] = useState<ContinuousMonitor[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [selectedMonitor, setSelectedMonitor] = useState<ContinuousMonitor | null>(null);
  const [monitorResults, setMonitorResults] = useState<MonitorResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter/search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');

  // Form state
  const [monitorForm, setMonitorForm] = useState({
    name: '',
    monitorType: 'Infrastructure',
    frequency: 'Daily',
    configuration: { description: '', tests: [''] },
    testScript: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // AI state
  const [aiSuggestions, setAiSuggestions] = useState<{ suggestions: AISuggestion[]; summary: string } | null>(null);
  const [aiTrend, setAiTrend] = useState<AITrendAnalysis | null>(null);
  const [aiTriage, setAiTriage] = useState<{ triageResult: AITriageItem[]; summary: string; remediationOrder: string[]; groupedAlerts: Record<string, string[]>; totalAlerts: number } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Executing
  const [executingId, setExecutingId] = useState<string | null>(null);

  // Tier limit
  const monitorLimitReached = isAtLimit(plan, 'maxMonitors', monitors.length);

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------
  const loadMonitors = useCallback(async () => {
    try {
      const data = await api.enterprise.monitoring.list();
      setMonitors(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load monitors');
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    try {
      const data = await api.enterprise.monitoring.getDashboard();
      setDashboard(data);
    } catch {
      // Dashboard is supplementary
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await Promise.all([loadMonitors(), loadDashboard()]);
      setIsLoading(false);
    };
    load();
  }, [loadMonitors, loadDashboard]);

  // ---------------------------------------------------------------------------
  // Filtering
  // ---------------------------------------------------------------------------
  const filteredMonitors = useMemo(() => {
    let list = [...monitors];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(m => m.name.toLowerCase().includes(q) || m.monitorType.toLowerCase().includes(q));
    }
    if (filterStatus !== 'All') list = list.filter(m => m.status === filterStatus);
    if (filterType !== 'All') list = list.filter(m => m.monitorType === filterType);
    return list;
  }, [monitors, searchQuery, filterStatus, filterType]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleCreateMonitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAtLimit(plan, 'maxMonitors', monitors.length)) {
      alert(getUpgradeMessage(plan, 'maxMonitors', monitors.length));
      return;
    }
    setIsSaving(true);
    try {
      await api.enterprise.monitoring.create({
        organizationId: user?.organizationId,
        ...monitorForm,
        configuration: monitorForm.configuration,
      });
      await Promise.all([loadMonitors(), loadDashboard()]);
      setViewMode('list');
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to create monitor');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateMonitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMonitor) return;
    setIsSaving(true);
    try {
      await api.enterprise.monitoring.update(selectedMonitor.id, monitorForm);
      await Promise.all([loadMonitors(), loadDashboard()]);
      setViewMode('list');
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to update monitor');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMonitor = async (id: string) => {
    if (!confirm('Delete this monitor and all its results?')) return;
    try {
      await api.enterprise.monitoring.delete(id);
      await Promise.all([loadMonitors(), loadDashboard()]);
      if (selectedMonitor?.id === id) setViewMode('list');
    } catch (err: any) {
      setError(err.message || 'Failed to delete monitor');
    }
  };

  const handleExecute = async (id: string) => {
    setExecutingId(id);
    try {
      await api.enterprise.monitoring.execute(id);
      await Promise.all([loadMonitors(), loadDashboard()]);
      if (selectedMonitor?.id === id) {
        const updated = await api.enterprise.monitoring.getById(id);
        setSelectedMonitor(updated);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to execute monitor');
    } finally {
      setExecutingId(null);
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    try {
      await api.enterprise.monitoring.toggle(id, active);
      await loadMonitors();
    } catch (err: any) {
      setError(err.message || 'Failed to toggle monitor');
    }
  };

  const handleViewDetail = async (monitor: ContinuousMonitor) => {
    setSelectedMonitor(monitor);
    setAiTrend(null);
    setViewMode('detail');
    try {
      const results = await api.enterprise.monitoring.getResults(monitor.id);
      setMonitorResults(Array.isArray(results) ? results : []);
    } catch {
      setMonitorResults([]);
    }
  };

  const handleEditMonitor = (monitor: ContinuousMonitor) => {
    setSelectedMonitor(monitor);
    setMonitorForm({
      name: monitor.name,
      monitorType: monitor.monitorType,
      frequency: monitor.frequency,
      configuration: monitor.configuration || { description: '', tests: [''] },
      testScript: monitor.testScript || '',
    });
    setViewMode('edit');
  };

  const resetForm = () => {
    setMonitorForm({ name: '', monitorType: 'Infrastructure', frequency: 'Daily', configuration: { description: '', tests: [''] }, testScript: '' });
    setSelectedMonitor(null);
  };

  // ---------------------------------------------------------------------------
  // AI Handlers
  // ---------------------------------------------------------------------------
  const handleAISuggest = async () => {
    setAiLoading(true);
    setAiSuggestions(null);
    try {
      const result = await api.enterprise.monitoring.aiSuggest();
      setAiSuggestions(result);
      setViewMode('ai-suggest');
    } catch (err: any) {
      setError(err.message || 'AI suggestion failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIAnalyze = async (monitor: ContinuousMonitor) => {
    setSelectedMonitor(monitor);
    setAiLoading(true);
    setAiTrend(null);
    setViewMode('ai-analyze');
    try {
      const result = await api.enterprise.monitoring.aiAnalyze(monitor.id);
      setAiTrend(result);
    } catch (err: any) {
      setError(err.message || 'AI analysis failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAITriage = async () => {
    setAiLoading(true);
    setAiTriage(null);
    try {
      const result = await api.enterprise.monitoring.aiTriage();
      setAiTriage(result);
      setViewMode('ai-triage');
    } catch (err: any) {
      setError(err.message || 'AI triage failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddSuggestedMonitor = async (suggestion: AISuggestion) => {
    if (isAtLimit(plan, 'maxMonitors', monitors.length)) {
      alert(getUpgradeMessage(plan, 'maxMonitors', monitors.length));
      return;
    }
    try {
      await api.enterprise.monitoring.create({
        organizationId: user?.organizationId,
        name: suggestion.name,
        monitorType: suggestion.monitorType,
        frequency: suggestion.frequency,
        configuration: suggestion.configuration,
      });
      await Promise.all([loadMonitors(), loadDashboard()]);
    } catch (err: any) {
      setError(err.message || 'Failed to add monitor');
    }
  };

  // ---------------------------------------------------------------------------
  // Render: Dashboard
  // ---------------------------------------------------------------------------
  const renderDashboard = () => {
    const d = dashboard;
    const statusData = d ? [
      { name: 'Passing', value: d.statusDistribution.passing },
      { name: 'Warning', value: d.statusDistribution.warning },
      { name: 'Failing', value: d.statusDistribution.failing },
      { name: 'Unknown', value: d.statusDistribution.unknown },
    ].filter(i => i.value > 0) : [];

    const typeData = d ? [
      { name: 'Infrastructure', value: d.typeDistribution.infrastructure },
      { name: 'Cloud', value: d.typeDistribution.cloud },
      { name: 'Identity', value: d.typeDistribution.identity },
      { name: 'Device', value: d.typeDistribution.device },
      { name: 'Code', value: d.typeDistribution.code },
    ].filter(i => i.value > 0) : [];

    const failingCount = d?.statusDistribution.failing || 0;
    const warningCount = d?.statusDistribution.warning || 0;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Continuous Monitoring</h1>
            <p className="text-gray-500 mt-1">AI-powered infrastructure, cloud, identity, device &amp; code monitoring</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAISuggest} disabled={aiLoading}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
              <Brain className="w-4 h-4" /> AI Suggest Monitors
            </button>
            {(failingCount > 0 || warningCount > 0) && (
              <button onClick={handleAITriage} disabled={aiLoading}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50">
                <Zap className="w-4 h-4" /> AI Triage Alerts
              </button>
            )}
            <button onClick={() => { resetForm(); setViewMode('create'); }} disabled={monitorLimitReached}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              <Plus className="w-4 h-4" /> Add Monitor
            </button>
          </div>
        </div>

        {monitorLimitReached && <TierLimitBanner message={getUpgradeMessage(plan, 'maxMonitors', monitors.length)} />}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { label: 'Total Monitors', value: d?.totalMonitors ?? 0, icon: <Activity className="w-5 h-5 text-blue-600" /> },
            { label: 'Active', value: d?.activeMonitors ?? 0, icon: <Power className="w-5 h-5 text-green-600" /> },
            { label: 'Passing', value: d?.statusDistribution.passing ?? 0, icon: <CheckCircle className="w-5 h-5 text-green-600" /> },
            { label: 'Warning', value: d?.statusDistribution.warning ?? 0, icon: <AlertTriangle className="w-5 h-5 text-yellow-600" /> },
            { label: 'Failing', value: d?.statusDistribution.failing ?? 0, icon: <XCircle className="w-5 h-5 text-red-600" /> },
            { label: 'Auto-Remediated', value: d?.autoRemediatedCount ?? 0, icon: <Zap className="w-5 h-5 text-purple-600" /> },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border p-4 flex items-center gap-3">
              {s.icon}
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {statusData.length > 0 && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Status Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                    {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          {typeData.length > 0 && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Type Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={typeData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]}>
                    {typeData.map((_, i) => <Cell key={i} fill={TYPE_PIE_COLORS[i % TYPE_PIE_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Failing monitors quick view */}
        {d && d.failingMonitors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-red-800 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" /> Failing Monitors ({d.failingMonitors.length})
              </h3>
              <button onClick={handleAITriage} disabled={aiLoading}
                className="text-sm px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-1">
                <Brain className="w-3 h-3" /> AI Triage
              </button>
            </div>
            <div className="space-y-2">
              {d.failingMonitors.map(fm => (
                <div key={fm.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-red-100">
                  <div className="flex items-center gap-3">
                    {TYPE_ICONS[fm.monitorType] || <Server className="w-4 h-4" />}
                    <span className="font-medium text-gray-900">{fm.name}</span>
                    <span className="text-xs text-gray-500">{fm.monitorType}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-600">{(fm.alerts as any)?.count || 0} alerts</span>
                    <button onClick={() => { const m = monitors.find(x => x.id === fm.id); if (m) handleViewDetail(m); }}
                      className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">View</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigate to full list */}
        <button onClick={() => setViewMode('list')} className="w-full py-3 text-center text-blue-600 hover:text-blue-800 bg-white rounded-xl border hover:border-blue-200 transition">
          View All Monitors ({monitors.length})
        </button>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: List
  // ---------------------------------------------------------------------------
  const renderList = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => setViewMode('dashboard')} className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </button>
        <div className="flex gap-2">
          <button onClick={handleAISuggest} disabled={aiLoading}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 disabled:opacity-50">
            <Brain className="w-3.5 h-3.5" /> AI Suggest
          </button>
          <button onClick={() => { resetForm(); setViewMode('create'); }} disabled={monitorLimitReached}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            <Plus className="w-3.5 h-3.5" /> Add Monitor
          </button>
        </div>
      </div>

      {monitorLimitReached && <TierLimitBanner message={getUpgradeMessage(plan, 'maxMonitors', monitors.length)} />}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search monitors..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="All">All Status</option>
          <option value="Passing">Passing</option>
          <option value="Warning">Warning</option>
          <option value="Failing">Failing</option>
          <option value="Unknown">Unknown</option>
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="All">All Types</option>
          {MONITOR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Monitor list */}
      <div className="space-y-2">
        {filteredMonitors.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border">
            <Activity className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No monitors found</p>
          </div>
        )}
        {filteredMonitors.map(m => (
          <div key={m.id} className="bg-white rounded-xl border p-4 hover:border-blue-200 transition">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => handleViewDetail(m)}>
                <div className="flex items-center gap-2">
                  {STATUS_ICONS[m.status]}
                  {TYPE_ICONS[m.monitorType] || <Server className="w-4 h-4 text-gray-400" />}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{m.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{m.monitorType}</span>
                    <span>·</span>
                    <span>{m.frequency}</span>
                    {m.lastRun && (
                      <>
                        <span>·</span>
                        <span>Last: {new Date(m.lastRun).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[m.status]}`}>{m.status}</span>
                {!m.active && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Paused</span>}
                <button onClick={() => handleExecute(m.id)} disabled={executingId === m.id}
                  className="p-1.5 rounded hover:bg-blue-50 text-blue-600 disabled:opacity-50" title="Execute">
                  {executingId === m.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                </button>
                <button onClick={() => handleToggle(m.id, !m.active)}
                  className={`p-1.5 rounded hover:bg-gray-100 ${m.active ? 'text-green-600' : 'text-gray-400'}`} title={m.active ? 'Deactivate' : 'Activate'}>
                  {m.active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                </button>
                <button onClick={() => handleAIAnalyze(m)} disabled={aiLoading}
                  className="p-1.5 rounded hover:bg-purple-50 text-purple-600 disabled:opacity-50" title="AI Analyze">
                  <Brain className="w-4 h-4" />
                </button>
                <button onClick={() => handleEditMonitor(m)} className="p-1.5 rounded hover:bg-gray-100 text-gray-600" title="Edit">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDeleteMonitor(m.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: Detail
  // ---------------------------------------------------------------------------
  const renderDetail = () => {
    if (!selectedMonitor) return null;
    const m = selectedMonitor;
    const findings = Array.isArray(m.findings) ? m.findings : [];

    // Build chart data from results
    const chartData = [...monitorResults].reverse().map(r => ({
      date: new Date(r.runDate).toLocaleDateString(),
      passed: r.passedTests,
      failed: r.failedTests,
      status: r.status,
    }));

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setViewMode('list')} className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" /> Back to List
          </button>
          <div className="flex gap-2">
            <button onClick={() => handleAIAnalyze(m)} disabled={aiLoading}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 disabled:opacity-50">
              <Brain className="w-3.5 h-3.5" /> AI Analyze Trends
            </button>
            <button onClick={() => handleExecute(m.id)} disabled={executingId === m.id}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {executingId === m.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />} Execute
            </button>
            <button onClick={() => handleEditMonitor(m)} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </button>
          </div>
        </div>

        {/* Monitor header */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {TYPE_ICONS[m.monitorType] || <Server className="w-5 h-5" />}
                <h2 className="text-xl font-bold text-gray-900">{m.name}</h2>
                <span className={`text-xs px-2.5 py-1 rounded-full border ${STATUS_COLORS[m.status]}`}>{m.status}</span>
                {!m.active && <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">Paused</span>}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>Type: {m.monitorType}</span>
                <span>Frequency: {m.frequency}</span>
                {m.lastRun && <span>Last Run: {new Date(m.lastRun).toLocaleString()}</span>}
                {m.nextRun && <span>Next Run: {new Date(m.nextRun).toLocaleString()}</span>}
              </div>
            </div>
            <button onClick={() => handleToggle(m.id, !m.active)}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg ${m.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              {m.active ? <Power className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5" />}
              {m.active ? 'Active' : 'Paused'}
            </button>
          </div>

          {/* Alerts summary */}
          {m.alerts && (m.alerts.count > 0) && (
            <div className="mt-4 flex gap-4">
              <div className="flex items-center gap-1 text-sm"><AlertTriangle className="w-4 h-4 text-yellow-500" /> {m.alerts.count} Total Alerts</div>
              {m.alerts.critical > 0 && <div className="flex items-center gap-1 text-sm text-red-600"><XCircle className="w-4 h-4" /> {m.alerts.critical} Critical</div>}
              {m.alerts.warnings > 0 && <div className="flex items-center gap-1 text-sm text-yellow-600"><AlertTriangle className="w-4 h-4" /> {m.alerts.warnings} Warnings</div>}
            </div>
          )}
        </div>

        {/* Findings */}
        {findings.length > 0 && (
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Latest Findings</h3>
            <div className="space-y-2">
              {findings.map((f: any, i: number) => (
                <div key={i} className={`flex items-center justify-between p-3 rounded-lg ${f.passed ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex items-center gap-2">
                    {f.passed ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                    <span className="text-sm font-medium">{f.test}</span>
                  </div>
                  {f.severity && <span className={`text-xs px-2 py-0.5 rounded ${f.severity === 'High' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{f.severity}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Trend inline (if already loaded) */}
        {aiTrend && selectedMonitor?.id === m.id && renderAITrendCard()}

        {/* Execution history chart */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Execution History</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="passed" fill="#22c55e" name="Passed" radius={[2, 2, 0, 0]} />
                <Bar dataKey="failed" fill="#ef4444" name="Failed" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Results table */}
        {monitorResults.length > 0 && (
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Recent Results</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Date</th>
                    <th className="text-left py-2 px-3">Status</th>
                    <th className="text-left py-2 px-3">Passed</th>
                    <th className="text-left py-2 px-3">Failed</th>
                    <th className="text-left py-2 px-3">Auto-Remediated</th>
                  </tr>
                </thead>
                <tbody>
                  {monitorResults.map(r => (
                    <tr key={r.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3">{new Date(r.runDate).toLocaleString()}</td>
                      <td className="py-2 px-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[r.status] || STATUS_COLORS.Unknown}`}>{r.status}</span>
                      </td>
                      <td className="py-2 px-3 text-green-700">{r.passedTests}</td>
                      <td className="py-2 px-3 text-red-700">{r.failedTests}</td>
                      <td className="py-2 px-3">{r.autoRemediated ? <CheckCircle className="w-4 h-4 text-purple-600" /> : <Minus className="w-4 h-4 text-gray-300" />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: AI Trend Card (reusable)
  // ---------------------------------------------------------------------------
  const renderAITrendCard = () => {
    if (!aiTrend) return null;
    const trendIcon = aiTrend.trendDirection === 'improving'
      ? <TrendingUp className="w-5 h-5 text-green-600" />
      : aiTrend.trendDirection === 'degrading'
      ? <TrendingDown className="w-5 h-5 text-red-600" />
      : <Minus className="w-5 h-5 text-gray-500" />;

    const trendColor = aiTrend.trendDirection === 'improving' ? 'border-green-200 bg-green-50'
      : aiTrend.trendDirection === 'degrading' ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50';

    return (
      <div className={`rounded-xl border p-6 ${trendColor}`}>
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">AI Trend Analysis</h3>
          {trendIcon}
          <span className="text-sm capitalize font-medium">{aiTrend.trendDirection}</span>
        </div>

        <p className="text-sm text-gray-700 mb-4">{aiTrend.trendSummary}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white/70 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Health Score</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div className="h-2 rounded-full" style={{ width: `${aiTrend.healthScore}%`, backgroundColor: aiTrend.healthScore > 70 ? '#22c55e' : aiTrend.healthScore > 40 ? '#eab308' : '#ef4444' }} />
              </div>
              <span className="text-sm font-bold">{aiTrend.healthScore}%</span>
            </div>
          </div>
          <div className="bg-white/70 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Failure Risk</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div className="h-2 rounded-full bg-red-500" style={{ width: `${aiTrend.failureRiskScore}%` }} />
              </div>
              <span className="text-sm font-bold">{aiTrend.failureRiskScore}%</span>
            </div>
          </div>
          <div className="bg-white/70 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Next Predicted Failure</p>
            <p className="text-sm font-medium">{aiTrend.predictedNextFailureWindow}</p>
          </div>
        </div>

        {aiTrend.rootCauseAnalysis.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-600 mb-1">Root Causes</p>
            <ul className="text-sm text-gray-700 space-y-1">
              {aiTrend.rootCauseAnalysis.map((c, i) => <li key={i} className="flex items-start gap-1"><span className="text-red-500 mt-0.5">·</span> {c}</li>)}
            </ul>
          </div>
        )}

        {aiTrend.recommendedActions.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-600 mb-1">Recommended Actions</p>
            <ul className="text-sm text-gray-700 space-y-1">
              {aiTrend.recommendedActions.map((a, i) => <li key={i} className="flex items-start gap-1"><CheckCircle className="w-3 h-3 text-green-500 mt-0.5 shrink-0" /> {a}</li>)}
            </ul>
          </div>
        )}

        {aiTrend.anomalies.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1">Anomalies Detected</p>
            <ul className="text-sm text-gray-700 space-y-1">
              {aiTrend.anomalies.map((a, i) => <li key={i} className="flex items-start gap-1"><AlertTriangle className="w-3 h-3 text-yellow-500 mt-0.5 shrink-0" /> {a}</li>)}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Create / Edit Form
  // ---------------------------------------------------------------------------
  const renderForm = (isEdit: boolean) => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => { setViewMode(isEdit ? 'detail' : 'list'); resetForm(); }} className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h2 className="text-xl font-bold text-gray-900">{isEdit ? 'Edit Monitor' : 'Create Monitor'}</h2>
      </div>

      <form onSubmit={isEdit ? handleUpdateMonitor : handleCreateMonitor} className="bg-white rounded-xl border p-6 space-y-4 max-w-2xl">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Monitor Name</label>
          <input type="text" required value={monitorForm.name} onChange={e => setMonitorForm(f => ({ ...f, name: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g., SSL Certificate Monitoring" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select value={monitorForm.monitorType} onChange={e => setMonitorForm(f => ({ ...f, monitorType: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm">
              {MONITOR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
            <select value={monitorForm.frequency} onChange={e => setMonitorForm(f => ({ ...f, frequency: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm">
              {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={monitorForm.configuration.description}
            onChange={e => setMonitorForm(f => ({ ...f, configuration: { ...f.configuration, description: e.target.value } }))}
            className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} placeholder="What does this monitor check?" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tests</label>
          {monitorForm.configuration.tests.map((test: string, i: number) => (
            <div key={i} className="flex gap-2 mb-2">
              <input type="text" value={test}
                onChange={e => {
                  const tests = [...monitorForm.configuration.tests];
                  tests[i] = e.target.value;
                  setMonitorForm(f => ({ ...f, configuration: { ...f.configuration, tests } }));
                }}
                className="flex-1 border rounded-lg px-3 py-2 text-sm" placeholder={`Test ${i + 1}`} />
              {monitorForm.configuration.tests.length > 1 && (
                <button type="button" onClick={() => {
                  const tests = monitorForm.configuration.tests.filter((_: any, j: number) => j !== i);
                  setMonitorForm(f => ({ ...f, configuration: { ...f.configuration, tests } }));
                }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><X className="w-4 h-4" /></button>
              )}
            </div>
          ))}
          <button type="button" onClick={() => setMonitorForm(f => ({ ...f, configuration: { ...f.configuration, tests: [...f.configuration.tests, ''] } }))}
            className="text-sm text-blue-600 hover:text-blue-800">+ Add Test</button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Custom Test Script (optional)</label>
          <textarea value={monitorForm.testScript} onChange={e => setMonitorForm(f => ({ ...f, testScript: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm font-mono" rows={4} placeholder="// Custom test script..." />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? 'Update Monitor' : 'Create Monitor'}
          </button>
          <button type="button" onClick={() => { setViewMode(isEdit ? 'detail' : 'list'); resetForm(); }}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Cancel</button>
        </div>
      </form>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: AI Suggest
  // ---------------------------------------------------------------------------
  const renderAISuggest = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setViewMode('dashboard')} className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <Brain className="w-5 h-5 text-purple-600" />
        <h2 className="text-xl font-bold text-gray-900">AI Monitor Suggestions</h2>
      </div>

      {aiLoading && (
        <div className="flex items-center justify-center py-16 bg-white rounded-xl border">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mr-3" />
          <span className="text-gray-600">AI is analyzing your compliance profile...</span>
        </div>
      )}

      {aiSuggestions && (
        <>
          {aiSuggestions.summary && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <p className="text-sm text-purple-800">{aiSuggestions.summary}</p>
            </div>
          )}

          <div className="space-y-3">
            {(aiSuggestions.suggestions || []).map((s, i) => {
              const alreadyExists = monitors.some(m => m.name.toLowerCase() === s.name.toLowerCase());
              return (
                <div key={i} className="bg-white rounded-xl border p-5 hover:border-purple-200 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {TYPE_ICONS[s.monitorType] || <Server className="w-4 h-4" />}
                        <h4 className="font-semibold text-gray-900">{s.name}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${s.priority === 'Critical' ? 'bg-red-100 text-red-700' : s.priority === 'High' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                          {s.priority}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                        <span>{s.monitorType}</span>
                        <span>·</span>
                        <span>{s.frequency}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{s.reason}</p>
                      {s.configuration?.tests?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {s.configuration.tests.map((t: string, j: number) => (
                            <span key={j} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button onClick={() => handleAddSuggestedMonitor(s)} disabled={monitorLimitReached || alreadyExists}
                      className="ml-4 flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 shrink-0">
                      <Plus className="w-3.5 h-3.5" /> {alreadyExists ? 'Added' : 'Add'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {(aiSuggestions.suggestions || []).length === 0 && !aiLoading && (
            <div className="text-center py-12 bg-white rounded-xl border">
              <Lightbulb className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No suggestions available at this time.</p>
            </div>
          )}
        </>
      )}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: AI Analyze
  // ---------------------------------------------------------------------------
  const renderAIAnalyze = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => { if (selectedMonitor) handleViewDetail(selectedMonitor); else setViewMode('list'); }}
          className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back to {selectedMonitor?.name || 'List'}
        </button>
        <Brain className="w-5 h-5 text-purple-600" />
        <h2 className="text-xl font-bold text-gray-900">AI Trend Analysis</h2>
      </div>

      {selectedMonitor && (
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          {TYPE_ICONS[selectedMonitor.monitorType] || <Server className="w-5 h-5" />}
          <div>
            <h3 className="font-semibold text-gray-900">{selectedMonitor.name}</h3>
            <p className="text-xs text-gray-500">{selectedMonitor.monitorType} · {selectedMonitor.frequency} · {selectedMonitor.status}</p>
          </div>
        </div>
      )}

      {aiLoading && (
        <div className="flex items-center justify-center py-16 bg-white rounded-xl border">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mr-3" />
          <span className="text-gray-600">AI is analyzing monitor trends...</span>
        </div>
      )}

      {aiTrend && !aiLoading && renderAITrendCard()}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: AI Triage
  // ---------------------------------------------------------------------------
  const renderAITriage = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setViewMode('dashboard')} className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <Zap className="w-5 h-5 text-orange-600" />
        <h2 className="text-xl font-bold text-gray-900">AI Alert Triage</h2>
      </div>

      {aiLoading && (
        <div className="flex items-center justify-center py-16 bg-white rounded-xl border">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600 mr-3" />
          <span className="text-gray-600">AI is triaging alerts...</span>
        </div>
      )}

      {aiTriage && !aiLoading && (
        <>
          {/* Summary */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-orange-600" />
              <span className="font-semibold text-orange-800">{aiTriage.totalAlerts} Alert(s) Triaged</span>
            </div>
            <p className="text-sm text-orange-700">{aiTriage.summary}</p>
          </div>

          {/* Remediation order */}
          {aiTriage.remediationOrder && aiTriage.remediationOrder.length > 0 && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <ListChecks className="w-4 h-4" /> Recommended Remediation Order
              </h3>
              <ol className="space-y-2">
                {aiTriage.remediationOrder.map((name, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    <span>{name}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Grouped alerts */}
          {aiTriage.groupedAlerts && Object.keys(aiTriage.groupedAlerts).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(aiTriage.groupedAlerts).map(([category, names]) => (
                <div key={category} className="bg-white rounded-xl border p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">{category}</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {(names as string[]).map((n, i) => <li key={i} className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-gray-400" />{n}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Triage items */}
          <div className="space-y-3">
            {(aiTriage.triageResult || []).map((item, i) => (
              <div key={i} className={`bg-white rounded-xl border-l-4 p-5 ${
                item.severity === 'Critical' ? 'border-l-red-500' : item.severity === 'High' ? 'border-l-orange-500' : item.severity === 'Medium' ? 'border-l-yellow-500' : 'border-l-gray-300'
              } border border-gray-200`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold bg-gray-100 px-2 py-0.5 rounded">#{item.priority}</span>
                      <h4 className="font-semibold text-gray-900">{item.monitorName}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        item.severity === 'Critical' ? 'bg-red-100 text-red-700' : item.severity === 'High' ? 'bg-orange-100 text-orange-700' : item.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                      }`}>{item.severity}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{item.category}</span>
                    </div>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{item.estimatedEffort}</span>
                </div>
                <p className="text-sm text-gray-700 mb-2"><strong>Impact:</strong> {item.businessImpact}</p>
                <p className="text-sm text-gray-700"><strong>Remediation:</strong> {item.suggestedRemediation}</p>
                {item.relatedMonitors && item.relatedMonitors.length > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-gray-500">Related:</span>
                    {item.relatedMonitors.map((r, j) => <span key={j} className="text-xs bg-gray-50 px-2 py-0.5 rounded">{r}</span>)}
                  </div>
                )}
              </div>
            ))}
          </div>

          {(aiTriage.triageResult || []).length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border">
              <ShieldCheck className="w-10 h-10 text-green-300 mx-auto mb-3" />
              <p className="text-gray-500">No alerts to triage. All monitors are healthy.</p>
            </div>
          )}
        </>
      )}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span className="text-sm">{error}</span>
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {viewMode === 'dashboard' && renderDashboard()}
      {viewMode === 'list' && renderList()}
      {viewMode === 'detail' && renderDetail()}
      {viewMode === 'create' && renderForm(false)}
      {viewMode === 'edit' && renderForm(true)}
      {viewMode === 'ai-suggest' && renderAISuggest()}
      {viewMode === 'ai-analyze' && renderAIAnalyze()}
      {viewMode === 'ai-triage' && renderAITriage()}
    </div>
  );
}
