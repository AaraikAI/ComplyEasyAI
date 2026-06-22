/**
 * Incident Management Component
 *
 * Full incident management with CRUD operations:
 * - Severity classification (SEV1-4)
 * - Status tracking (Detected -> Triaged -> Contained -> Eradicated -> Recovered -> Closed -> Post-Mortem)
 * - Timeline view with event logging
 * - Task assignment and tracking
 * - Metrics: MTTD, MTTC, MTTR
 * - Categories: DATA_BREACH, MALWARE, PHISHING, UNAUTHORIZED_ACCESS, DDOS, INSIDER_THREAT, SYSTEM_FAILURE, POLICY_VIOLATION
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { csrfFetch } from '../services/api';
import { useI18n } from '../contexts/I18nContext';
import { useSubmitGuard } from '../hooks/useSubmitGuard';
import {
  Shield,
  Plus,
  X,
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Edit,
  BarChart3,
  Users,
  Filter,
  ChevronRight,
  Trash2,
  Activity,
  Zap,
  AlertOctagon,
  Target,
  Timer,
  MessageSquare,
  UserPlus,
  ArrowRight,
  Loader2,
} from 'lucide-react';

// ── Type Definitions ────────────────────────────────────────────────────────

type IncidentSeverity = 'SEV1' | 'SEV2' | 'SEV3' | 'SEV4';

type IncidentStatus =
  | 'Detected'
  | 'Triaged'
  | 'Contained'
  | 'Eradicated'
  | 'Recovered'
  | 'Closed'
  | 'Post-Mortem';

type IncidentCategory =
  | 'DATA_BREACH'
  | 'MALWARE'
  | 'PHISHING'
  | 'UNAUTHORIZED_ACCESS'
  | 'DDOS'
  | 'INSIDER_THREAT'
  | 'SYSTEM_FAILURE'
  | 'POLICY_VIOLATION';

type TabId = 'incidents' | 'timeline' | 'metrics';

interface TimelineEvent {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  details: string;
}

interface IncidentTask {
  id: string;
  title: string;
  assignee: string;
  status: 'Pending' | 'InProgress' | 'Done';
  dueDate: string;
}

interface Incident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  category: IncidentCategory;
  detectedAt: string;
  triagedAt: string | null;
  containedAt: string | null;
  eradicatedAt: string | null;
  recoveredAt: string | null;
  closedAt: string | null;
  assignedTo: string;
  reporter: string;
  affectedSystems: string[];
  timeline: TimelineEvent[];
  tasks: IncidentTask[];
}

interface IncidentForm {
  title: string;
  description: string;
  severity: IncidentSeverity;
  category: IncidentCategory;
  assignedTo: string;
  affectedSystems: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

const severityConfig: Record<IncidentSeverity, { label: string; color: string; bgColor: string }> = {
  SEV1: { label: 'SEV-1 Critical', color: 'text-red-400', bgColor: 'bg-red-500/20 text-red-400 border-red-500/30' },
  SEV2: { label: 'SEV-2 High', color: 'text-orange-400', bgColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  SEV3: { label: 'SEV-3 Medium', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  SEV4: { label: 'SEV-4 Low', color: 'text-blue-400', bgColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
};

const statusConfig: Record<IncidentStatus, { color: string; icon: React.ReactNode }> = {
  Detected: { color: 'bg-red-500/20 text-red-400', icon: <AlertOctagon className="w-3.5 h-3.5" /> },
  Triaged: { color: 'bg-orange-500/20 text-orange-400', icon: <Target className="w-3.5 h-3.5" /> },
  Contained: { color: 'bg-yellow-500/20 text-yellow-400', icon: <Shield className="w-3.5 h-3.5" /> },
  Eradicated: { color: 'bg-blue-500/20 text-blue-400', icon: <Zap className="w-3.5 h-3.5" /> },
  Recovered: { color: 'bg-cyan-500/20 text-cyan-400', icon: <Activity className="w-3.5 h-3.5" /> },
  Closed: { color: 'bg-green-500/20 text-green-400', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  'Post-Mortem': { color: 'bg-purple-500/20 text-purple-400', icon: <MessageSquare className="w-3.5 h-3.5" /> },
};

const categoryLabels: Record<IncidentCategory, string> = {
  DATA_BREACH: 'Data Breach',
  MALWARE: 'Malware',
  PHISHING: 'Phishing',
  UNAUTHORIZED_ACCESS: 'Unauthorized Access',
  DDOS: 'DDoS Attack',
  INSIDER_THREAT: 'Insider Threat',
  SYSTEM_FAILURE: 'System Failure',
  POLICY_VIOLATION: 'Policy Violation',
};

const statusOrder: IncidentStatus[] = [
  'Detected', 'Triaged', 'Contained', 'Eradicated', 'Recovered', 'Closed', 'Post-Mortem',
];

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'incidents', label: 'Incidents', icon: <AlertTriangle className="w-4 h-4" /> },
  { id: 'timeline', label: 'Timeline', icon: <Clock className="w-4 h-4" /> },
  { id: 'metrics', label: 'Metrics', icon: <BarChart3 className="w-4 h-4" /> },
];

const defaultForm: IncidentForm = {
  title: '',
  description: '',
  severity: 'SEV3',
  category: 'SYSTEM_FAILURE',
  assignedTo: '',
  affectedSystems: '',
};

// ── API Data Mapping ────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, IncidentStatus> = {
  DETECTED: 'Detected', TRIAGED: 'Triaged', CONTAINED: 'Contained',
  ERADICATED: 'Eradicated', RECOVERED: 'Recovered', CLOSED: 'Closed',
  POST_MORTEM: 'Post-Mortem',
};

const REVERSE_STATUS_MAP: Record<string, string> = {
  Detected: 'DETECTED', Triaged: 'TRIAGED', Contained: 'CONTAINED',
  Eradicated: 'ERADICATED', Recovered: 'RECOVERED', Closed: 'CLOSED',
  'Post-Mortem': 'POST_MORTEM',
};

function mapApiIncident(raw: any): Incident {
  return {
    id: raw.id,
    title: raw.title || '',
    description: raw.description || '',
    severity: (raw.severity in severityConfig ? raw.severity : 'SEV3') as IncidentSeverity,
    status: STATUS_MAP[raw.status] || (raw.status in statusConfig ? raw.status : 'Detected'),
    category: raw.category as IncidentCategory,
    detectedAt: raw.detectedAt || raw.createdAt || new Date().toISOString(),
    triagedAt: raw.triagedAt || null,
    containedAt: raw.containedAt || null,
    eradicatedAt: raw.eradicatedAt || null,
    recoveredAt: raw.resolvedAt || raw.recoveredAt || null,
    closedAt: raw.closedAt || null,
    assignedTo: raw.assignedTo || '',
    reporter: raw.reportedBy || '',
    affectedSystems: raw.affectedSystems || [],
    timeline: Array.isArray(raw.timeline)
      ? raw.timeline.map((e: any) => ({
          id: e.id,
          timestamp: e.timestamp || e.createdAt,
          action: e.action || '',
          actor: e.performedBy || '',
          details: e.details || '',
        }))
      : [],
    tasks: Array.isArray(raw.tasks)
      ? raw.tasks.map((t: any) => ({
          id: t.id,
          title: t.title || '',
          assignee: t.assignee || t.assignedTo || '',
          status: t.status === 'DONE' ? 'Done' : t.status === 'IN_PROGRESS' ? 'InProgress' : 'Pending',
          dueDate: t.dueDate || '',
        }))
      : [],
  };
}

// ── Helper Functions ────────────────────────────────────────────────────────

function calcHoursDiff(start: string, end: string | null): number | null {
  if (!end) return null;
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60) * 10) / 10;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ── Component ───────────────────────────────────────────────────────────────

const IncidentManagement: React.FC = () => {
  const { t } = useI18n();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('incidents');
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<IncidentSeverity | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<IncidentCategory | 'all'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [form, setForm] = useState<IncidentForm>(defaultForm);
  const [showFilters, setShowFilters] = useState(false);
  const { isSubmitting, guard } = useSubmitGuard();

  // Fetch incidents from backend on mount
  useEffect(() => {
    let cancelled = false;
    async function fetchIncidents() {
      setLoading(true);
      setFetchError(null);
      try {
        const res = await csrfFetch('/api/incidents?limit=100', { credentials: 'include' });
        if (!res.ok) throw new Error(`Failed to load incidents (${res.status})`);
        const json = await res.json();
        const data = Array.isArray(json.data) ? json.data : [];
        if (!cancelled) {
          setIncidents(data.map(mapApiIncident));
        }
      } catch (err) {
        if (!cancelled) {
          setFetchError(err instanceof Error ? err.message : 'Failed to load incidents');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchIncidents();
    return () => { cancelled = true; };
  }, []);

  const filteredIncidents = useMemo(() => {
    return incidents.filter(inc => {
      const matchesSearch = searchQuery === '' ||
        inc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSeverity = severityFilter === 'all' || inc.severity === severityFilter;
      const matchesStatus = statusFilter === 'all' || inc.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || inc.category === categoryFilter;
      return matchesSearch && matchesSeverity && matchesStatus && matchesCategory;
    });
  }, [incidents, searchQuery, severityFilter, statusFilter, categoryFilter]);

  const metrics = useMemo(() => {
    const closedOrRecovered = incidents.filter(i => i.closedAt || i.recoveredAt);
    const detected = incidents.filter(i => i.triagedAt);
    const contained = incidents.filter(i => i.containedAt);
    const recovered = incidents.filter(i => i.recoveredAt);

    const avgMTTD = detected.length > 0
      ? detected.reduce((sum, i) => sum + (calcHoursDiff(i.detectedAt, i.triagedAt) || 0), 0) / detected.length
      : 0;
    const avgMTTC = contained.length > 0
      ? contained.reduce((sum, i) => sum + (calcHoursDiff(i.detectedAt, i.containedAt) || 0), 0) / contained.length
      : 0;
    const avgMTTR = recovered.length > 0
      ? recovered.reduce((sum, i) => sum + (calcHoursDiff(i.detectedAt, i.recoveredAt) || 0), 0) / recovered.length
      : 0;

    const bySeverity = (['SEV1', 'SEV2', 'SEV3', 'SEV4'] as IncidentSeverity[]).map(sev => ({
      severity: sev,
      count: incidents.filter(i => i.severity === sev).length,
      open: incidents.filter(i => i.severity === sev && i.status !== 'Closed' && i.status !== 'Post-Mortem').length,
    }));

    const byCategory = (Object.keys(categoryLabels) as IncidentCategory[]).map(cat => ({
      category: cat,
      count: incidents.filter(i => i.category === cat).length,
    })).filter(c => c.count > 0);

    return { avgMTTD, avgMTTC, avgMTTR, bySeverity, byCategory, total: incidents.length, open: incidents.filter(i => i.status !== 'Closed' && i.status !== 'Post-Mortem').length };
  }, [incidents]);

  const handleCreateIncident = useCallback(async () => {
    await guard(async () => {
      try {
        const res = await csrfFetch('/api/incidents', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.title,
            description: form.description,
            severity: form.severity,
            category: form.category,
            assignedTo: form.assignedTo || null,
            affectedSystems: form.affectedSystems.split(',').map(s => s.trim()).filter(Boolean),
          }),
        });
        if (!res.ok) throw new Error(`Failed to create incident (${res.status})`);
        const json = await res.json();
        const created = mapApiIncident(json.data);
        setIncidents(prev => [created, ...prev]);
        setShowCreateForm(false);
        setForm(defaultForm);
      } catch {
        setFetchError('Failed to create incident');
      }
    });
  }, [form, guard]);

  const advanceStatus = useCallback(async (incidentId: string) => {
    const incident = incidents.find(i => i.id === incidentId);
    if (!incident) return;
    const currentIdx = statusOrder.indexOf(incident.status);
    if (currentIdx >= statusOrder.length - 1) return;
    const nextStatus = statusOrder[currentIdx + 1];
    const apiStatus = REVERSE_STATUS_MAP[nextStatus] || nextStatus;

    try {
      const res = await csrfFetch(`/api/incidents/${encodeURIComponent(incidentId)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: apiStatus }),
      });
      if (!res.ok) throw new Error(`Failed to update status (${res.status})`);
      const json = await res.json();
      const updated = mapApiIncident(json.data);
      setIncidents(prev => prev.map(inc => inc.id === incidentId ? updated : inc));
      if (selectedIncident?.id === incidentId) {
        setSelectedIncident(updated);
      }
    } catch {
      // Optimistic fallback: update locally if API fails
      const now = new Date().toISOString();
      const updates: Partial<Incident> = { status: nextStatus };
      if (nextStatus === 'Triaged') updates.triagedAt = now;
      if (nextStatus === 'Contained') updates.containedAt = now;
      if (nextStatus === 'Eradicated') updates.eradicatedAt = now;
      if (nextStatus === 'Recovered') updates.recoveredAt = now;
      if (nextStatus === 'Closed') updates.closedAt = now;
      const newEvent: TimelineEvent = {
        id: `e-${Date.now()}`,
        timestamp: now,
        action: `Status changed to ${nextStatus}`,
        actor: 'Current User',
        details: `Incident advanced from ${incident.status} to ${nextStatus}`,
      };
      setIncidents(prev => prev.map(inc =>
        inc.id === incidentId ? { ...inc, ...updates, timeline: [...inc.timeline, newEvent] } : inc
      ));
      if (selectedIncident?.id === incidentId) {
        setSelectedIncident(prev => prev ? { ...prev, ...updates, timeline: [...prev.timeline, newEvent] } : prev);
      }
    }
  }, [incidents, selectedIncident]);

  const deleteIncident = useCallback(async (id: string) => {
    try {
      const res = await csrfFetch(`/api/incidents/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Failed to delete incident (${res.status})`);
    } catch (err) {
      // Keep the incident in the list when the server delete fails — removing it
      // locally would falsely imply success while the record still exists in the DB.
      setFetchError(err instanceof Error ? err.message : 'Failed to delete incident');
      return;
    }
    setIncidents(prev => prev.filter(i => i.id !== id));
    if (selectedIncident?.id === id) setSelectedIncident(null);
  }, [selectedIncident]);

  // ── Render ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 dark:bg-slate-950 text-white p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-red-400 animate-spin" />
          <span className="text-slate-400">Loading incidents...</span>
        </div>
      </div>
    );
  }

  if (fetchError && incidents.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 dark:bg-slate-950 text-white p-6 flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 max-w-md text-center">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold mb-2">Failed to Load Incidents</h2>
          <p className="text-slate-400 text-sm mb-4">{fetchError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 dark:bg-slate-950 text-white p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-red-500/20 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('incidents.title')}</h1>
            <p className="text-slate-400 text-sm">Track, manage, and resolve security incidents</p>
          </div>
        </div>
      </div>

      {fetchError && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {fetchError}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800 dark:bg-slate-900 rounded-xl border border-slate-700 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Total Incidents</span>
            <Activity className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold">{metrics.total}</div>
          <div className="text-xs text-slate-500 mt-1">{metrics.open} {t('incidents.open')}</div>
        </div>
        <div className="bg-slate-800 dark:bg-slate-900 rounded-xl border border-slate-700 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">{t('incidents.mttd')}</span>
            <Timer className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold">{metrics.avgMTTD.toFixed(1)}h</div>
          <div className="text-xs text-slate-500 mt-1">Mean Time to Detect</div>
        </div>
        <div className="bg-slate-800 dark:bg-slate-900 rounded-xl border border-slate-700 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Avg. MTTC</span>
            <Shield className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-2xl font-bold">{metrics.avgMTTC.toFixed(1)}h</div>
          <div className="text-xs text-slate-500 mt-1">Mean Time to Contain</div>
        </div>
        <div className="bg-slate-800 dark:bg-slate-900 rounded-xl border border-slate-700 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">{t('incidents.mttr')}</span>
            <CheckCircle className="w-4 h-4 text-green-400" />
          </div>
          <div className="text-2xl font-bold">{metrics.avgMTTR.toFixed(1)}h</div>
          <div className="text-xs text-slate-500 mt-1">Mean Time to Recover</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-slate-800 dark:bg-slate-900 rounded-xl p-1 w-fit border border-slate-700 dark:border-slate-800">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Incidents Tab ────────────────────────────────────────── */}
      {activeTab === 'incidents' && !selectedIncident && (
        <>
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
            <div className="relative flex-1 w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 dark:bg-slate-900 border border-slate-700 dark:border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${
                showFilters ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <Filter className="w-4 h-4" /> {t('common.filter')}
            </button>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> {t('incidents.createIncident')}
            </button>
          </div>

          {/* Filter row */}
          {showFilters && (
            <div className="flex flex-wrap gap-3 mb-4 p-4 bg-slate-800/50 dark:bg-slate-900/50 rounded-xl border border-slate-700 dark:border-slate-800">
              <select
                value={severityFilter}
                onChange={e => setSeverityFilter(e.target.value as IncidentSeverity | 'all')}
                className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Severities</option>
                {Object.entries(severityConfig).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as IncidentStatus | 'all')}
                className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                {statusOrder.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value as IncidentCategory | 'all')}
                className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {Object.entries(categoryLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          )}

          {/* Incident List */}
          <div className="space-y-3">
            {filteredIncidents.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>{t('common.noResults')}</p>
              </div>
            )}
            {filteredIncidents.map(incident => (
              <div
                key={incident.id}
                className="bg-slate-800 dark:bg-slate-900 rounded-xl border border-slate-700 dark:border-slate-800 p-4 hover:border-slate-600 transition-colors cursor-pointer"
                onClick={() => setSelectedIncident(incident)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-slate-500">{incident.id}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${severityConfig[incident.severity].bgColor}`}>
                        {severityConfig[incident.severity].label}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[incident.status].color}`}>
                        {statusConfig[incident.status].icon}
                        {incident.status}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-white truncate">{incident.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">{incident.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(incident.detectedAt)}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{incident.assignedTo}</span>
                      <span className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-400">{categoryLabels[incident.category]}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={e => { e.stopPropagation(); advanceStatus(incident.id); }}
                      disabled={incident.status === 'Post-Mortem'}
                      className="p-1.5 text-slate-400 hover:text-blue-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Advance status"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); deleteIncident(incident.id); }}
                      className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                      title="Delete incident"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Incident Detail View ──────────────────────────────── */}
      {activeTab === 'incidents' && selectedIncident && (
        <div className="space-y-6">
          <button
            onClick={() => setSelectedIncident(null)}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
          >
            <ChevronRight className="w-4 h-4 rotate-180" /> Back to incidents
          </button>

          <div className="bg-slate-800 dark:bg-slate-900 rounded-xl border border-slate-700 dark:border-slate-800 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-mono text-slate-500">{selectedIncident.id}</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${severityConfig[selectedIncident.severity].bgColor}`}>
                    {severityConfig[selectedIncident.severity].label}
                  </span>
                </div>
                <h2 className="text-xl font-bold">{selectedIncident.title}</h2>
                <p className="text-slate-400 text-sm mt-1">{selectedIncident.description}</p>
              </div>
              <button
                onClick={() => advanceStatus(selectedIncident.id)}
                disabled={selectedIncident.status === 'Post-Mortem'}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                {selectedIncident.status === 'Post-Mortem' ? 'Final State' : `Advance to ${statusOrder[statusOrder.indexOf(selectedIncident.status) + 1] || ''}`}
              </button>
            </div>

            {/* Status Pipeline */}
            <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2">
              {statusOrder.map((status, idx) => {
                const currentIdx = statusOrder.indexOf(selectedIncident.status);
                const isPast = idx <= currentIdx;
                const isCurrent = idx === currentIdx;
                return (
                  <React.Fragment key={status}>
                    <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                      isCurrent ? statusConfig[status].color + ' ring-2 ring-white/20' : isPast ? 'bg-slate-700 text-slate-300' : 'bg-slate-800 text-slate-600'
                    }`}>
                      {statusConfig[status].icon}
                      {status}
                    </div>
                    {idx < statusOrder.length - 1 && (
                      <ArrowRight className={`w-3 h-3 flex-shrink-0 ${isPast ? 'text-slate-400' : 'text-slate-700'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <span className="text-xs text-slate-500">Category</span>
                <p className="text-sm font-medium">{categoryLabels[selectedIncident.category]}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">{t('incidents.assignedTo')}</span>
                <p className="text-sm font-medium">{selectedIncident.assignedTo}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Reporter</span>
                <p className="text-sm font-medium">{selectedIncident.reporter}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">{t('incidents.affectedSystems')}</span>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {selectedIncident.affectedSystems.map(sys => (
                    <span key={sys} className="text-xs px-1.5 py-0.5 bg-slate-700 rounded">{sys}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400" /> {t('incidents.timeline')}</h3>
              <div className="space-y-3">
                {selectedIncident.timeline.map((event, idx) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5" />
                      {idx < selectedIncident.timeline.length - 1 && <div className="w-0.5 flex-1 bg-slate-700 mt-1" />}
                    </div>
                    <div className="pb-3">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{formatDate(event.timestamp)}</span>
                        <span className="text-slate-600">|</span>
                        <span>{event.actor}</span>
                      </div>
                      <p className="text-sm font-medium text-white">{event.action}</p>
                      <p className="text-xs text-slate-400">{event.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tasks */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Target className="w-4 h-4 text-slate-400" /> Tasks ({selectedIncident.tasks.length})</h3>
              <div className="space-y-2">
                {selectedIncident.tasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        task.status === 'Done' ? 'bg-green-400' : task.status === 'InProgress' ? 'bg-blue-400' : 'bg-slate-500'
                      }`} />
                      <div>
                        <p className="text-sm font-medium">{task.title}</p>
                        <p className="text-xs text-slate-500">{task.assignee} | Due: {task.dueDate}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      task.status === 'Done' ? 'bg-green-500/20 text-green-400' : task.status === 'InProgress' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-500/20 text-slate-400'
                    }`}>
                      {task.status === 'InProgress' ? 'In Progress' : task.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Timeline Tab ────────────────────────────────────────── */}
      {activeTab === 'timeline' && (
        <div className="bg-slate-800 dark:bg-slate-900 rounded-xl border border-slate-700 dark:border-slate-800 p-6">
          <h2 className="text-lg font-semibold mb-4">{t('incidents.timeline')}</h2>
          <div className="space-y-4">
            {incidents
              .flatMap(inc => inc.timeline.map(ev => ({ ...ev, incidentId: inc.id, incidentTitle: inc.title, severity: inc.severity })))
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .map((event, idx, arr) => (
                <div key={event.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full mt-1 ${
                      event.severity === 'SEV1' ? 'bg-red-400' : event.severity === 'SEV2' ? 'bg-orange-400' : event.severity === 'SEV3' ? 'bg-yellow-400' : 'bg-blue-400'
                    }`} />
                    {idx < arr.length - 1 && <div className="w-0.5 flex-1 bg-slate-700 mt-1" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-slate-500">{event.incidentId}</span>
                      <span className={`px-1.5 py-0.5 rounded text-xs ${severityConfig[event.severity].bgColor}`}>{event.severity}</span>
                      <span className="text-xs text-slate-500">{formatDate(event.timestamp)}</span>
                    </div>
                    <p className="text-sm font-medium">{event.action}</p>
                    <p className="text-xs text-slate-400">{event.incidentTitle}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{event.details} - {event.actor}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── Metrics Tab ────────────────────────────────────────── */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Severity Breakdown */}
            <div className="bg-slate-800 dark:bg-slate-900 rounded-xl border border-slate-700 dark:border-slate-800 p-6">
              <h3 className="text-sm font-semibold mb-4">Incidents by Severity</h3>
              <div className="space-y-3">
                {metrics.bySeverity.map(item => (
                  <div key={item.severity} className="flex items-center gap-3">
                    <span className={`text-xs font-medium w-16 ${severityConfig[item.severity].color}`}>{item.severity}</span>
                    <div className="flex-1 bg-slate-700 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.severity === 'SEV1' ? 'bg-red-500' : item.severity === 'SEV2' ? 'bg-orange-500' : item.severity === 'SEV3' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${metrics.total > 0 ? (item.count / metrics.total) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-mono text-white w-8 text-right">{item.count}</span>
                    <span className="text-xs text-slate-500 w-16">{item.open} {t('incidents.open')}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-slate-800 dark:bg-slate-900 rounded-xl border border-slate-700 dark:border-slate-800 p-6">
              <h3 className="text-sm font-semibold mb-4">Incidents by Category</h3>
              <div className="space-y-3">
                {metrics.byCategory.map(item => (
                  <div key={item.category} className="flex items-center justify-between p-2 bg-slate-700/50 rounded-lg">
                    <span className="text-sm">{categoryLabels[item.category]}</span>
                    <span className="text-sm font-mono font-bold">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Response Time Metrics */}
          <div className="bg-slate-800 dark:bg-slate-900 rounded-xl border border-slate-700 dark:border-slate-800 p-6">
            <h3 className="text-sm font-semibold mb-4">Response Time Metrics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-slate-700/30 rounded-xl">
                <div className="text-3xl font-bold text-blue-400">{metrics.avgMTTD.toFixed(1)}h</div>
                <div className="text-sm text-slate-400 mt-1">Mean Time to Detect</div>
                <div className="text-xs text-slate-500 mt-0.5">Detection to Triage</div>
              </div>
              <div className="text-center p-4 bg-slate-700/30 rounded-xl">
                <div className="text-3xl font-bold text-yellow-400">{metrics.avgMTTC.toFixed(1)}h</div>
                <div className="text-sm text-slate-400 mt-1">Mean Time to Contain</div>
                <div className="text-xs text-slate-500 mt-0.5">Detection to Containment</div>
              </div>
              <div className="text-center p-4 bg-slate-700/30 rounded-xl">
                <div className="text-3xl font-bold text-green-400">{metrics.avgMTTR.toFixed(1)}h</div>
                <div className="text-sm text-slate-400 mt-1">Mean Time to Recover</div>
                <div className="text-xs text-slate-500 mt-0.5">Detection to Recovery</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Incident Modal ──────────────────────────────── */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-slate-800 dark:bg-slate-900 rounded-xl border border-slate-700 dark:border-slate-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 className="text-lg font-semibold">{t('incidents.createIncident')}</h2>
              <button onClick={() => setShowCreateForm(false)} className="p-1 text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Incident title"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">{t('common.description')}</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Describe the incident..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">{t('incidents.severity')}</label>
                  <select
                    value={form.severity}
                    onChange={e => setForm(prev => ({ ...prev, severity: e.target.value as IncidentSeverity }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(severityConfig).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(prev => ({ ...prev, category: e.target.value as IncidentCategory }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(categoryLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">{t('incidents.assignedTo')}</label>
                <input
                  type="text"
                  value={form.assignedTo}
                  onChange={e => setForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Assignee name"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">{t('incidents.affectedSystems')}</label>
                <input
                  type="text"
                  value={form.affectedSystems}
                  onChange={e => setForm(prev => ({ ...prev, affectedSystems: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. API Gateway, Auth Service"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-700">
              <button
                onClick={() => { setShowCreateForm(false); setForm(defaultForm); }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleCreateIncident}
                disabled={!form.title.trim() || isSubmitting}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" /> {isSubmitting ? t('common.loading') : t('incidents.createIncident')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentManagement;
