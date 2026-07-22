/**
 * DPIA Workflow Component
 *
 * Data Protection Impact Assessment lifecycle management:
 * - Overview of all DPIAs with status tracking
 * - Screening questionnaire to determine DPIA necessity
 * - Risk assessment matrix (likelihood vs impact)
 * - DPO review and consultation workflow
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { logger } from '../utils/logger';
import {
  ArrowLeft,
  Shield,
  FileText,
  Plus,
  X,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  BarChart3,
  ClipboardList,
  UserCheck,
  Filter,
  ChevronRight,
  Edit,
  Trash2,
} from 'lucide-react';

// ── Type Definitions ────────────────────────────────────────────────────────

type TabId = 'overview' | 'screening' | 'risk-assessment' | 'dpo-review';

type DPIAStatus = 'Draft' | 'InProgress' | 'UnderReview' | 'Approved' | 'Rejected';

interface DPIA {
  id: string;
  title: string;
  description: string;
  projectName: string;
  status: DPIAStatus;
  createdAt: string;
  updatedAt: string;
  assignedTo: string;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  screeningComplete: boolean;
  riskAssessmentComplete: boolean;
  dpoReviewComplete: boolean;
  dpoOpinion: string;
  dataSubjects: string[];
  processingPurposes: string[];
  necessityJustification: string;
}

interface ScreeningQuestion {
  id: string;
  question: string;
  category: string;
  isHighRisk: boolean;
}

interface RiskEntry {
  id: string;
  dpiaId: string;
  riskDescription: string;
  likelihood: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  mitigationMeasures: string;
  residualRisk: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Identified' | 'Mitigated' | 'Accepted' | 'Transferred';
}

interface DPOReview {
  dpiaId: string;
  dpoName: string;
  reviewDate: string;
  opinion: 'Approve' | 'Reject' | 'RequestChanges';
  comments: string;
  conditions: string[];
  consultationRequired: boolean;
}

interface CreateDPIAForm {
  title: string;
  description: string;
  projectName: string;
  assignedTo: string;
  dataSubjects: string;
  processingPurposes: string;
  necessityJustification: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

const API_BASE = (import.meta as ImportMeta & { env: Record<string, string> }).env.VITE_API_URL || 'http://localhost:3001/api';
const apiUrl = API_BASE.endsWith('/api') ? API_BASE : API_BASE.replace(/\/?$/, '') + '/api';

const statusColors: Record<DPIAStatus, string> = {
  Draft: 'bg-white/[0.06] text-signal-muted border-white/[0.10]',
  InProgress: 'bg-signal-warn/10 text-signal-warn border-signal-warn/30',
  UnderReview: 'bg-signal-blue/10 text-signal-blue border-signal-blue/30',
  Approved: 'bg-signal-good/10 text-signal-good border-signal-good/30',
  Rejected: 'bg-signal-bad/10 text-signal-bad border-signal-bad/30',
};

const riskLevelColors: Record<string, string> = {
  Low: 'bg-signal-good/10 text-signal-good',
  Medium: 'bg-signal-warn/10 text-signal-warn',
  High: 'bg-signal-amber/10 text-signal-amber',
  Critical: 'bg-signal-bad/10 text-signal-bad',
};

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'screening', label: 'Screening', icon: <ClipboardList className="w-4 h-4" /> },
  { id: 'risk-assessment', label: 'Risk Assessment', icon: <AlertTriangle className="w-4 h-4" /> },
  { id: 'dpo-review', label: 'DPO Review', icon: <UserCheck className="w-4 h-4" /> },
];

const screeningQuestions: ScreeningQuestion[] = [
  { id: 'sq1', question: 'Does the processing involve systematic and extensive profiling with significant effects?', category: 'Profiling', isHighRisk: true },
  { id: 'sq2', question: 'Does the processing involve large-scale processing of special categories of data?', category: 'Special Categories', isHighRisk: true },
  { id: 'sq3', question: 'Does the processing involve systematic monitoring of publicly accessible areas on a large scale?', category: 'Monitoring', isHighRisk: true },
  { id: 'sq4', question: 'Does the processing use new technologies or apply existing technologies in new ways?', category: 'New Technologies', isHighRisk: true },
  { id: 'sq5', question: 'Does the processing involve automated decision-making with legal or similar effects?', category: 'Automated Decisions', isHighRisk: true },
  { id: 'sq6', question: 'Does the processing involve data concerning vulnerable data subjects (children, employees)?', category: 'Vulnerable Subjects', isHighRisk: true },
  { id: 'sq7', question: 'Does the processing involve large-scale processing of personal data?', category: 'Scale', isHighRisk: true },
  { id: 'sq8', question: 'Does the processing involve matching or combining datasets from different sources?', category: 'Data Matching', isHighRisk: true },
  { id: 'sq9', question: 'Does the processing prevent data subjects from exercising a right or using a service?', category: 'Rights Impact', isHighRisk: true },
  { id: 'sq10', question: 'Does the processing involve transferring data outside the EEA?', category: 'Cross-Border', isHighRisk: false },
];

const likelihoodLabels = ['', 'Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'];
const impactLabels = ['', 'Negligible', 'Minor', 'Moderate', 'Major', 'Severe'];

// ── Helper ──────────────────────────────────────────────────────────────────

let csrfTokenCache: string | null = null;

async function getCsrfToken(): Promise<string | null> {
  if (csrfTokenCache) return csrfTokenCache;
  try {
    const res = await fetch(`${apiUrl}/csrf-token`, { credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    csrfTokenCache = data.csrfToken ?? null;
    return csrfTokenCache;
  } catch {
    return null;
  }
}

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  // Mutating requests require the CSRF token (server applies csrfProtection on /api).
  const method = (options.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrf = await getCsrfToken();
    if (csrf) headers['X-CSRF-Token'] = csrf;
  }

  const res = await fetch(`${apiUrl}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });
  if (!res.ok) {
    // A stale CSRF token yields 403; drop the cache so the next call re-fetches it.
    if (res.status === 403) {
      csrfTokenCache = null;
    }
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  return res.json();
}

// Normalize an API response to its underlying array, tolerating a bare array,
// a `{ data: [...] }` envelope, or a paginated `{ data: { <key>: [...] } }`
// envelope. Always returns an array so list state never holds a wrapper object
// (which would make .map()/.filter() throw during render).
function extractArray<T>(res: unknown, key: string): T[] {
  if (Array.isArray(res)) return res as T[];
  const data = (res as { data?: unknown })?.data;
  if (Array.isArray(data)) return data as T[];
  const nested = (data as Record<string, unknown> | undefined)?.[key];
  if (Array.isArray(nested)) return nested as T[];
  return [];
}

// ── Component ───────────────────────────────────────────────────────────────

const DPIAWorkflow: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DPIAStatus | 'All'>('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dpias, setDpias] = useState<DPIA[]>([]);
  const [risks, setRisks] = useState<RiskEntry[]>([]);
  const [selectedDPIA, setSelectedDPIA] = useState<string | null>(null);
  const [editingDPIA, setEditingDPIA] = useState<DPIA | null>(null);
  const [editForm, setEditForm] = useState<{ title: string; description: string; projectName: string; assignedTo: string; status: DPIAStatus }>({
    title: '', description: '', projectName: '', assignedTo: '', status: 'Draft',
  });
  const [screeningAnswers, setScreeningAnswers] = useState<Record<string, boolean>>({});
  const [screeningResult, setScreeningResult] = useState<string | null>(null);
  const [dpoReviewForm, setDpoReviewForm] = useState<{
    dpiaId: string;
    dpoName: string;
    opinion: 'Approve' | 'Reject' | 'RequestChanges';
    comments: string;
    conditions: string;
    consultationRequired: boolean;
  }>({
    dpiaId: '',
    dpoName: '',
    opinion: 'Approve',
    comments: '',
    conditions: '',
    consultationRequired: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState<CreateDPIAForm>({
    title: '',
    description: '',
    projectName: '',
    assignedTo: '',
    dataSubjects: '',
    processingPurposes: '',
    necessityJustification: '',
  });

  // ── Data Loading ──────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [dpiaRes, riskRes] = await Promise.allSettled([
        apiFetch<{ data: DPIA[] } | DPIA[]>('/dpia'),
        apiFetch<{ data: RiskEntry[] } | RiskEntry[]>('/dpia/risks'),
      ]);

      const failedApis: string[] = [];

      // The /dpia endpoint returns a paginated envelope
      // ({ data: { dpias, total, page, ... } }); older shapes returned a bare array
      // or { data: [...] }. Normalize all of them to the underlying array —
      // assigning the wrapper object to state would make dpias.map()/.filter() throw
      // during render and (absent an error boundary) blank the whole app.
      if (dpiaRes.status === 'fulfilled') {
        setDpias(extractArray<DPIA>(dpiaRes.value, 'dpias'));
      } else {
        failedApis.push('DPIAs');
      }

      if (riskRes.status === 'fulfilled') {
        setRisks(extractArray<RiskEntry>(riskRes.value, 'risks'));
      } else {
        failedApis.push('Risk Assessments');
      }

      if (failedApis.length > 0) {
        setLoadError(`Failed to load: ${failedApis.join(', ')}. Showing available data only.`);
      }
    } catch (err) {
      setLoadError('Failed to connect to the server. Please check your connection and try again.');
      logger.error('DPIAWorkflow data load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Computed Stats ────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = dpias.length;
    const draft = dpias.filter(d => d.status === 'Draft').length;
    const inProgress = dpias.filter(d => d.status === 'InProgress').length;
    const underReview = dpias.filter(d => d.status === 'UnderReview').length;
    const approved = dpias.filter(d => d.status === 'Approved').length;
    const rejected = dpias.filter(d => d.status === 'Rejected').length;
    const highRisk = dpias.filter(d => d.riskLevel === 'High' || d.riskLevel === 'Critical').length;
    return { total, draft, inProgress, underReview, approved, rejected, highRisk };
  }, [dpias]);

  const filteredDPIAs = useMemo(() => {
    return dpias.filter(d => {
      const matchesSearch =
        searchQuery === '' ||
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || d.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [dpias, searchQuery, statusFilter]);

  const selectedDPIARisks = useMemo(() => {
    if (!selectedDPIA) return [];
    return risks.filter(r => r.dpiaId === selectedDPIA);
  }, [risks, selectedDPIA]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCreateDPIA = async () => {
    setSubmitting(true);
    try {
      await apiFetch('/dpia', {
        method: 'POST',
        body: JSON.stringify({
          title: createForm.title,
          description: createForm.description,
          projectName: createForm.projectName,
          assignedTo: createForm.assignedTo,
          dataSubjects: createForm.dataSubjects.split(',').map(s => s.trim()).filter(Boolean),
          processingPurposes: createForm.processingPurposes.split(',').map(s => s.trim()).filter(Boolean),
          necessityJustification: createForm.necessityJustification,
        }),
      });
      setShowCreateModal(false);
      setCreateForm({
        title: '',
        description: '',
        projectName: '',
        assignedTo: '',
        dataSubjects: '',
        processingPurposes: '',
        necessityJustification: '',
      });
      await loadData();
    } catch (err) {
      logger.error('Failed to create DPIA:', err);
      setLoadError('Failed to create DPIA. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDPIA = (dpia: DPIA) => {
    setEditForm({
      title: dpia.title,
      description: dpia.description || '',
      projectName: dpia.projectName,
      assignedTo: dpia.assignedTo || '',
      status: dpia.status,
    });
    setEditingDPIA(dpia);
  };

  const handleUpdateDPIA = async () => {
    if (!editingDPIA) return;
    setSubmitting(true);
    try {
      await apiFetch(`/dpia/${editingDPIA.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          projectName: editForm.projectName,
          assignedTo: editForm.assignedTo,
          status: editForm.status,
        }),
      });
      setEditingDPIA(null);
      await loadData();
    } catch (err) {
      logger.error('Failed to update DPIA:', err);
      setLoadError('Failed to update DPIA. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleScreeningSubmit = () => {
    const checkedCount = Object.values(screeningAnswers).filter(Boolean).length;
    if (checkedCount >= 2) {
      setScreeningResult('required');
    } else if (checkedCount === 1) {
      setScreeningResult('recommended');
    } else {
      setScreeningResult('not-required');
    }
  };

  const handleDPOReviewSubmit = async () => {
    if (!dpoReviewForm.dpiaId) return;
    setSubmitting(true);
    try {
      await apiFetch(`/dpia/${dpoReviewForm.dpiaId}/dpo-review`, {
        method: 'POST',
        body: JSON.stringify({
          dpoName: dpoReviewForm.dpoName,
          opinion: dpoReviewForm.opinion,
          comments: dpoReviewForm.comments,
          conditions: dpoReviewForm.conditions.split(',').map(s => s.trim()).filter(Boolean),
          consultationRequired: dpoReviewForm.consultationRequired,
        }),
      });
      setDpoReviewForm({
        dpiaId: '',
        dpoName: '',
        opinion: 'Approve',
        comments: '',
        conditions: '',
        consultationRequired: false,
      });
      await loadData();
    } catch (err) {
      logger.error('Failed to submit DPO review:', err);
      setLoadError('Failed to submit DPO review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Risk Matrix Helper ────────────────────────────────────────────────────

  const getRiskColor = (likelihood: number, impact: number): string => {
    const score = likelihood * impact;
    if (score >= 16) return 'bg-signal-bad';
    if (score >= 10) return 'bg-signal-amber';
    if (score >= 5) return 'bg-signal-warn';
    return 'bg-signal-good';
  };

  const getRiskLabel = (likelihood: number, impact: number): string => {
    const score = likelihood * impact;
    if (score >= 16) return 'Critical';
    if (score >= 10) return 'High';
    if (score >= 5) return 'Medium';
    return 'Low';
  };

  // ── Overview Tab ──────────────────────────────────────────────────────────

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-signal-muted mb-2">
            <FileText className="w-4 h-4 text-signal-blue" /> Total DPIAs
          </div>
          <div className="text-3xl font-bold font-display text-signal-blue">{stats.total}</div>
          <div className="text-xs text-signal-muted mt-1">{stats.draft} drafts</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-signal-muted mb-2">
            <Clock className="w-4 h-4 text-signal-warn" /> In Progress
          </div>
          <div className="text-3xl font-bold font-display text-signal-warn">{stats.inProgress}</div>
          <div className="text-xs text-signal-muted mt-1">{stats.underReview} under review</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-signal-muted mb-2">
            <CheckCircle className="w-4 h-4 text-signal-good" /> Approved
          </div>
          <div className="text-3xl font-bold font-display text-signal-good">{stats.approved}</div>
          <div className="text-xs text-signal-muted mt-1">{stats.rejected} rejected</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-signal-muted mb-2">
            <AlertTriangle className="w-4 h-4 text-signal-bad" /> High Risk
          </div>
          <div className="text-3xl font-bold font-display text-signal-bad">{stats.highRisk}</div>
          <div className="text-xs text-signal-muted mt-1">assessments flagged</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-signal-muted" />
            <input
              type="text"
              placeholder={`${t('common.search')}...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 bg-white/[0.04] border border-white/[0.10] rounded-xl text-sm text-signal-ink placeholder-signal-muted focus:outline-none focus:ring-1 focus:ring-signal-green w-64"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as DPIAStatus | 'All')}
            className="bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-sm text-signal-ink focus:outline-none focus:ring-1 focus:ring-signal-green"
          >
            <option value="All">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="InProgress">In Progress</option>
            <option value="UnderReview">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-signal-green hover:bg-signal-green/90 text-signal-canvas font-medium rounded-xl text-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> {t('dpia.createDPIA')}
        </button>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-4 py-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">ID</th>
                <th className="text-left px-4 py-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Title</th>
                <th className="text-left px-4 py-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Project</th>
                <th className="text-left px-4 py-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">{t('common.status')}</th>
                <th className="text-left px-4 py-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Risk Level</th>
                <th className="text-left px-4 py-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">{t('common.assignee')}</th>
                <th className="text-left px-4 py-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Updated</th>
                <th className="text-left px-4 py-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredDPIAs.map(dpia => (
                <tr key={dpia.id} className="border-b border-white/[0.06] hover:bg-white/[0.04]">
                  <td className="px-4 py-3 text-signal-muted font-mono text-xs">{dpia.id}</td>
                  <td className="px-4 py-3 text-signal-ink">{dpia.title}</td>
                  <td className="px-4 py-3 text-signal-muted text-xs">{dpia.projectName}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded border ${statusColors[dpia.status]}`}>
                      {dpia.status === 'InProgress' ? 'In Progress' : dpia.status === 'UnderReview' ? 'Under Review' : dpia.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${riskLevelColors[dpia.riskLevel]}`}>
                      {dpia.riskLevel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-signal-muted text-xs">{dpia.assignedTo}</td>
                  <td className="px-4 py-3 text-signal-muted text-xs">{dpia.updatedAt}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedDPIA(dpia.id)}
                        className="p-1.5 text-signal-muted hover:text-signal-ink transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEditDPIA(dpia)}
                        className="p-1.5 text-signal-muted hover:text-signal-ink transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredDPIAs.length === 0 && (
          <div className="text-center py-8 text-signal-muted text-sm">
            {loading ? 'Loading DPIAs...' : 'No DPIAs match the current filters.'}
          </div>
        )}
      </div>

      {/* Status Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.14em] text-signal-muted mb-3">Status Distribution</h3>
          <div className="space-y-2">
            {(['Draft', 'InProgress', 'UnderReview', 'Approved', 'Rejected'] as DPIAStatus[]).map(status => {
              const count = dpias.filter(d => d.status === status).length;
              const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
              const label = status === 'InProgress' ? 'In Progress' : status === 'UnderReview' ? 'Under Review' : status;
              return (
                <div key={status} className="flex items-center gap-3">
                  <div className="w-28 text-xs text-signal-muted">{label}</div>
                  <div className="flex-1 bg-white/[0.06] rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        status === 'Approved'
                          ? 'bg-signal-good'
                          : status === 'Rejected'
                          ? 'bg-signal-bad'
                          : status === 'InProgress'
                          ? 'bg-signal-warn'
                          : status === 'UnderReview'
                          ? 'bg-signal-blue'
                          : 'bg-white/20'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="w-6 text-xs text-signal-body text-right">{count}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.14em] text-signal-muted mb-3">Risk Level Distribution</h3>
          <div className="space-y-2">
            {(['Low', 'Medium', 'High', 'Critical'] as const).map(level => {
              const count = dpias.filter(d => d.riskLevel === level).length;
              const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
              return (
                <div key={level} className="flex items-center gap-3">
                  <div className="w-28 text-xs text-signal-muted">{level}</div>
                  <div className="flex-1 bg-white/[0.06] rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        level === 'Critical'
                          ? 'bg-signal-bad'
                          : level === 'High'
                          ? 'bg-signal-amber'
                          : level === 'Medium'
                          ? 'bg-signal-warn'
                          : 'bg-signal-good'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="w-6 text-xs text-signal-body text-right">{count}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  // ── Screening Tab ─────────────────────────────────────────────────────────

  const renderScreening = () => (
    <div className="space-y-6">
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
        <h3 className="text-lg font-display font-medium text-signal-ink mb-2">DPIA Screening Questionnaire</h3>
        <p className="text-sm text-signal-body mb-6">
          Answer the following questions to determine whether a DPIA is required for your processing activity.
          If two or more indicators are checked, a DPIA is mandatory under GDPR Article 35.
        </p>

        <div className="space-y-4">
          {screeningQuestions.map(q => (
            <label
              key={q.id}
              className="flex items-start gap-3 p-3 bg-white/[0.04] border border-white/[0.06] rounded-xl cursor-pointer hover:bg-white/[0.06] transition-colors"
            >
              <input
                type="checkbox"
                checked={screeningAnswers[q.id] || false}
                onChange={e => setScreeningAnswers(prev => ({ ...prev, [q.id]: e.target.checked }))}
                className="mt-0.5 w-4 h-4 rounded border-white/[0.10] text-signal-green focus:ring-signal-green focus:ring-offset-0 bg-white/[0.06]"
              />
              <div className="flex-1">
                <div className="text-sm text-signal-body">{q.question}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded bg-white/[0.06] text-signal-muted">{q.category}</span>
                  {q.isHighRisk && (
                    <span className="text-xs px-2 py-0.5 rounded bg-signal-bad/10 text-signal-bad">High Risk Indicator</span>
                  )}
                </div>
              </div>
            </label>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={handleScreeningSubmit}
            className="flex items-center gap-2 px-4 py-2 bg-signal-green hover:bg-signal-green/90 text-signal-canvas font-medium rounded-xl text-sm transition-colors"
          >
            <ClipboardList className="w-4 h-4" /> Evaluate
          </button>
          <button
            onClick={() => {
              setScreeningAnswers({});
              setScreeningResult(null);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white/[0.06] hover:bg-white/[0.10] text-signal-ink rounded-xl text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> {t('common.reset')}
          </button>
          <div className="text-sm text-signal-muted">
            {Object.values(screeningAnswers).filter(Boolean).length} of {screeningQuestions.length} indicators checked
          </div>
        </div>
      </div>

      {screeningResult && (
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3 ${
            screeningResult === 'required'
              ? 'bg-signal-bad/10 border-signal-bad/30'
              : screeningResult === 'recommended'
              ? 'bg-signal-warn/10 border-signal-warn/30'
              : 'bg-signal-good/10 border-signal-good/30'
          }`}
        >
          {screeningResult === 'required' ? (
            <AlertTriangle className="w-5 h-5 text-signal-bad flex-shrink-0 mt-0.5" />
          ) : screeningResult === 'recommended' ? (
            <AlertTriangle className="w-5 h-5 text-signal-warn flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircle className="w-5 h-5 text-signal-good flex-shrink-0 mt-0.5" />
          )}
          <div>
            <div
              className={`text-sm font-medium ${
                screeningResult === 'required'
                  ? 'text-signal-bad'
                  : screeningResult === 'recommended'
                  ? 'text-signal-warn'
                  : 'text-signal-good'
              }`}
            >
              {screeningResult === 'required'
                ? 'DPIA is Required'
                : screeningResult === 'recommended'
                ? 'DPIA is Recommended'
                : 'DPIA is Not Required'}
            </div>
            <div
              className={`text-xs mt-1 ${
                screeningResult === 'required'
                  ? 'text-signal-bad/70'
                  : screeningResult === 'recommended'
                  ? 'text-signal-warn/70'
                  : 'text-signal-good/70'
              }`}
            >
              {screeningResult === 'required'
                ? 'Two or more high-risk indicators identified. A DPIA must be conducted before processing begins (GDPR Article 35).'
                : screeningResult === 'recommended'
                ? 'One high-risk indicator identified. While not mandatory, a DPIA is strongly recommended as a best practice.'
                : 'No high-risk indicators identified. A DPIA is not mandatory but may still be conducted voluntarily.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ── Risk Assessment Tab ───────────────────────────────────────────────────

  const renderRiskAssessment = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <div className="text-sm text-signal-body">Select a DPIA to view its risk assessment:</div>
        <select
          value={selectedDPIA || ''}
          onChange={e => setSelectedDPIA(e.target.value || null)}
          className="bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-sm text-signal-ink focus:outline-none focus:ring-1 focus:ring-signal-green"
        >
          <option value="">-- Select DPIA --</option>
          {dpias.map(d => (
            <option key={d.id} value={d.id}>
              {d.title} ({d.id})
            </option>
          ))}
        </select>
      </div>

      {/* Risk Matrix */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.14em] text-signal-muted mb-4">Risk Matrix - Likelihood vs Impact</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="px-3 py-2 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em] text-left w-32">Likelihood / Impact</th>
                {[1, 2, 3, 4, 5].map(impact => (
                  <th key={impact} className="px-3 py-2 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em] text-center">
                    {impactLabels[impact]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[5, 4, 3, 2, 1].map(likelihood => (
                <tr key={likelihood}>
                  <td className="px-3 py-2 text-signal-muted text-xs font-medium">{likelihoodLabels[likelihood]}</td>
                  {[1, 2, 3, 4, 5].map(impact => {
                    const cellRisks = selectedDPIARisks.filter(
                      r => r.likelihood === likelihood && r.impact === impact
                    );
                    return (
                      <td key={impact} className="px-1 py-1">
                        <div
                          className={`rounded-lg p-2 min-h-[48px] flex items-center justify-center ${getRiskColor(
                            likelihood,
                            impact
                          )}/20 border border-white/[0.06]`}
                        >
                          {cellRisks.length > 0 ? (
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-signal-ink font-display font-bold text-sm">{cellRisks.length}</span>
                              <span className="text-xs text-signal-body">{getRiskLabel(likelihood, impact)}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-signal-muted">{getRiskLabel(likelihood, impact)}</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-signal-good/40" />
            <span className="text-xs text-signal-muted">Low</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-signal-warn/40" />
            <span className="text-xs text-signal-muted">Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-signal-amber/40" />
            <span className="text-xs text-signal-muted">High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-signal-bad/40" />
            <span className="text-xs text-signal-muted">Critical</span>
          </div>
        </div>
      </div>

      {/* Risk List */}
      {selectedDPIA && (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.14em] text-signal-muted">
              Identified Risks ({selectedDPIARisks.length})
            </h3>
          </div>
          {selectedDPIARisks.length > 0 ? (
            <div className="divide-y divide-white/[0.06]">
              {selectedDPIARisks.map(risk => (
                <div key={risk.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="text-sm text-signal-body">{risk.riskDescription}</div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-signal-muted">
                          Likelihood: {likelihoodLabels[risk.likelihood]}
                        </span>
                        <span className="text-xs text-signal-muted">
                          Impact: {impactLabels[risk.impact]}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${riskLevelColors[risk.residualRisk]}`}>
                          {risk.residualRisk}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            risk.status === 'Mitigated'
                              ? 'bg-signal-good/10 text-signal-good'
                              : risk.status === 'Accepted'
                              ? 'bg-signal-blue/10 text-signal-blue'
                              : risk.status === 'Transferred'
                              ? 'bg-signal-violet/10 text-signal-violet'
                              : 'bg-signal-warn/10 text-signal-warn'
                          }`}
                        >
                          {risk.status}
                        </span>
                      </div>
                      {risk.mitigationMeasures && (
                        <div className="mt-2 text-xs text-signal-muted">
                          <span className="font-medium text-signal-body">Mitigation:</span> {risk.mitigationMeasures}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-signal-muted text-sm">
              No risks identified for this DPIA yet.
            </div>
          )}
        </div>
      )}

      {!selectedDPIA && (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-signal-muted mx-auto mb-3" />
          <div className="text-sm text-signal-body">Select a DPIA from the dropdown above to view its risk assessment.</div>
        </div>
      )}
    </div>
  );

  // ── DPO Review Tab ────────────────────────────────────────────────────────

  const renderDPOReview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-signal-muted mb-2">
            <Clock className="w-4 h-4 text-signal-blue" /> Pending Review
          </div>
          <div className="text-3xl font-bold font-display text-signal-blue">
            {dpias.filter(d => d.status === 'UnderReview').length}
          </div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-signal-muted mb-2">
            <CheckCircle className="w-4 h-4 text-signal-good" /> Approved
          </div>
          <div className="text-3xl font-bold font-display text-signal-good">{stats.approved}</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-signal-muted mb-2">
            <X className="w-4 h-4 text-signal-bad" /> Rejected
          </div>
          <div className="text-3xl font-bold font-display text-signal-bad">{stats.rejected}</div>
        </div>
      </div>

      {/* Awaiting Review List */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.06]">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.14em] text-signal-muted">DPIAs Awaiting DPO Review</h3>
        </div>
        <div className="divide-y divide-white/[0.06]">
          {dpias
            .filter(d => d.status === 'UnderReview')
            .map(dpia => (
              <div key={dpia.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm text-signal-body">{dpia.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-signal-muted">Project: {dpia.projectName}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${riskLevelColors[dpia.riskLevel]}`}>
                      {dpia.riskLevel} Risk
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setDpoReviewForm(prev => ({ ...prev, dpiaId: dpia.id }))}
                  className="flex items-center gap-2 px-3 py-1.5 bg-signal-green hover:bg-signal-green/90 text-signal-canvas font-medium rounded-lg text-xs transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5" /> Review
                </button>
              </div>
            ))}
          {dpias.filter(d => d.status === 'UnderReview').length === 0 && (
            <div className="text-center py-8 text-signal-muted text-sm">No DPIAs pending review.</div>
          )}
        </div>
      </div>

      {/* DPO Review Form */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.14em] text-signal-muted mb-4">DPO Consultation Form</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-signal-muted mb-1">Select DPIA</label>
            <select
              value={dpoReviewForm.dpiaId}
              onChange={e => setDpoReviewForm(prev => ({ ...prev, dpiaId: e.target.value }))}
              className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-sm text-signal-ink focus:outline-none focus:ring-1 focus:ring-signal-green"
            >
              <option value="">-- Select DPIA --</option>
              {dpias
                .filter(d => d.status === 'UnderReview' || d.status === 'InProgress')
                .map(d => (
                  <option key={d.id} value={d.id}>
                    {d.title} ({d.id})
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-signal-muted mb-1">DPO Name</label>
            <input
              type="text"
              value={dpoReviewForm.dpoName}
              onChange={e => setDpoReviewForm(prev => ({ ...prev, dpoName: e.target.value }))}
              className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-sm text-signal-ink placeholder-signal-muted focus:outline-none focus:ring-1 focus:ring-signal-green"
              placeholder="Enter DPO name"
            />
          </div>
          <div>
            <label className="block text-xs text-signal-muted mb-1">Opinion</label>
            <select
              value={dpoReviewForm.opinion}
              onChange={e =>
                setDpoReviewForm(prev => ({
                  ...prev,
                  opinion: e.target.value as 'Approve' | 'Reject' | 'RequestChanges',
                }))
              }
              className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-sm text-signal-ink focus:outline-none focus:ring-1 focus:ring-signal-green"
            >
              <option value="Approve">Approve</option>
              <option value="Reject">Reject</option>
              <option value="RequestChanges">Request Changes</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-signal-muted mb-1">Conditions (comma-separated)</label>
            <input
              type="text"
              value={dpoReviewForm.conditions}
              onChange={e => setDpoReviewForm(prev => ({ ...prev, conditions: e.target.value }))}
              className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-sm text-signal-ink placeholder-signal-muted focus:outline-none focus:ring-1 focus:ring-signal-green"
              placeholder="e.g., Implement encryption, Limit retention to 12 months"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-signal-muted mb-1">{t('dpia.dpoOpinion')}</label>
            <textarea
              value={dpoReviewForm.comments}
              onChange={e => setDpoReviewForm(prev => ({ ...prev, comments: e.target.value }))}
              rows={4}
              className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-sm text-signal-ink placeholder-signal-muted focus:outline-none focus:ring-1 focus:ring-signal-green resize-none"
              placeholder="Enter DPO review comments and opinion..."
            />
          </div>
          <div className="md:col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={dpoReviewForm.consultationRequired}
                onChange={e =>
                  setDpoReviewForm(prev => ({ ...prev, consultationRequired: e.target.checked }))
                }
                className="w-4 h-4 rounded border-white/[0.10] text-signal-green focus:ring-signal-green focus:ring-offset-0 bg-white/[0.06]"
              />
              <span className="text-sm text-signal-body">
                {t('dpia.consultationRequired')}
              </span>
            </label>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={handleDPOReviewSubmit}
            disabled={!dpoReviewForm.dpiaId || !dpoReviewForm.dpoName || submitting}
            className="flex items-center gap-2 px-4 py-2 bg-signal-green hover:bg-signal-green/90 disabled:bg-white/[0.06] disabled:text-signal-muted disabled:cursor-not-allowed text-signal-canvas font-medium rounded-xl text-sm transition-colors"
          >
            <CheckCircle className="w-4 h-4" /> {submitting ? `${t('common.loading')}...` : t('common.submit')}
          </button>
        </div>
      </div>
    </div>
  );

  // ── Create DPIA Modal ─────────────────────────────────────────────────────

  const renderCreateModal = () => {
    if (!showCreateModal) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-signal-panel2 border border-white/[0.08] rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
            <h2 className="text-lg font-display font-semibold text-signal-ink">{t('dpia.createDPIA')}</h2>
            <button
              onClick={() => setShowCreateModal(false)}
              className="p-1 text-signal-muted hover:text-signal-ink transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div>
              <label className="block text-xs text-signal-muted mb-1">Title *</label>
              <input
                type="text"
                value={createForm.title}
                onChange={e => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-sm text-signal-ink placeholder-signal-muted focus:outline-none focus:ring-1 focus:ring-signal-green"
                placeholder="e.g., Customer Profiling System DPIA"
              />
            </div>
            <div>
              <label className="block text-xs text-signal-muted mb-1">{t('common.description')} *</label>
              <textarea
                value={createForm.description}
                onChange={e => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-sm text-signal-ink placeholder-signal-muted focus:outline-none focus:ring-1 focus:ring-signal-green resize-none"
                placeholder="Describe the processing activity and its purpose"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-signal-muted mb-1">Project Name *</label>
                <input
                  type="text"
                  value={createForm.projectName}
                  onChange={e => setCreateForm(prev => ({ ...prev, projectName: e.target.value }))}
                  className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-sm text-signal-ink placeholder-signal-muted focus:outline-none focus:ring-1 focus:ring-signal-green"
                  placeholder="Project name"
                />
              </div>
              <div>
                <label className="block text-xs text-signal-muted mb-1">Assigned To *</label>
                <input
                  type="text"
                  value={createForm.assignedTo}
                  onChange={e => setCreateForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                  className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-sm text-signal-ink placeholder-signal-muted focus:outline-none focus:ring-1 focus:ring-signal-green"
                  placeholder="Assessor name"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-signal-muted mb-1">
                {t('dpia.dataSubjects')} (comma-separated)
              </label>
              <input
                type="text"
                value={createForm.dataSubjects}
                onChange={e => setCreateForm(prev => ({ ...prev, dataSubjects: e.target.value }))}
                className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-sm text-signal-ink placeholder-signal-muted focus:outline-none focus:ring-1 focus:ring-signal-green"
                placeholder="e.g., Customers, Employees, Contractors"
              />
            </div>
            <div>
              <label className="block text-xs text-signal-muted mb-1">
                {t('dpia.processingActivity')} (comma-separated)
              </label>
              <input
                type="text"
                value={createForm.processingPurposes}
                onChange={e => setCreateForm(prev => ({ ...prev, processingPurposes: e.target.value }))}
                className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-sm text-signal-ink placeholder-signal-muted focus:outline-none focus:ring-1 focus:ring-signal-green"
                placeholder="e.g., Marketing, Analytics, Service delivery"
              />
            </div>
            <div>
              <label className="block text-xs text-signal-muted mb-1">{t('dpia.necessity')}</label>
              <textarea
                value={createForm.necessityJustification}
                onChange={e => setCreateForm(prev => ({ ...prev, necessityJustification: e.target.value }))}
                rows={3}
                className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-sm text-signal-ink placeholder-signal-muted focus:outline-none focus:ring-1 focus:ring-signal-green resize-none"
                placeholder="Explain why this processing is necessary and proportionate to the purpose"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.08]">
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-sm text-signal-muted hover:text-signal-ink transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleCreateDPIA}
              disabled={!createForm.title || !createForm.description || !createForm.projectName || submitting}
              className="flex items-center gap-2 px-4 py-2 bg-signal-green hover:bg-signal-green/90 disabled:bg-white/[0.06] disabled:text-signal-muted disabled:cursor-not-allowed text-signal-canvas font-medium rounded-xl text-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> {submitting ? `${t('common.loading')}...` : t('dpia.createDPIA')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Edit DPIA Modal ───────────────────────────────────────────────────────

  const renderEditModal = () => {
    if (!editingDPIA) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-signal-panel2 border border-white/[0.08] rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
            <h2 className="text-lg font-display font-semibold text-signal-ink">Edit DPIA</h2>
            <button onClick={() => setEditingDPIA(null)} className="p-1 text-signal-muted hover:text-signal-ink transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div>
              <label className="block text-xs text-signal-muted mb-1">Title *</label>
              <input
                type="text"
                value={editForm.title}
                onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-sm text-signal-ink placeholder-signal-muted focus:outline-none focus:ring-1 focus:ring-signal-green"
              />
            </div>
            <div>
              <label className="block text-xs text-signal-muted mb-1">{t('common.description')}</label>
              <textarea
                value={editForm.description}
                onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-sm text-signal-ink placeholder-signal-muted focus:outline-none focus:ring-1 focus:ring-signal-green resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-signal-muted mb-1">Project Name *</label>
                <input
                  type="text"
                  value={editForm.projectName}
                  onChange={e => setEditForm(prev => ({ ...prev, projectName: e.target.value }))}
                  className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-sm text-signal-ink placeholder-signal-muted focus:outline-none focus:ring-1 focus:ring-signal-green"
                />
              </div>
              <div>
                <label className="block text-xs text-signal-muted mb-1">{t('common.assignee')}</label>
                <input
                  type="text"
                  value={editForm.assignedTo}
                  onChange={e => setEditForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                  className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-sm text-signal-ink placeholder-signal-muted focus:outline-none focus:ring-1 focus:ring-signal-green"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-signal-muted mb-1">{t('common.status')}</label>
              <select
                value={editForm.status}
                onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value as DPIAStatus }))}
                className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-sm text-signal-ink focus:outline-none focus:ring-1 focus:ring-signal-green"
              >
                <option value="Draft">Draft</option>
                <option value="InProgress">In Progress</option>
                <option value="UnderReview">Under Review</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.08]">
            <button
              onClick={() => setEditingDPIA(null)}
              className="px-4 py-2 text-sm text-signal-muted hover:text-signal-ink transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleUpdateDPIA}
              disabled={!editForm.title || !editForm.projectName || submitting}
              className="flex items-center gap-2 px-4 py-2 bg-signal-green hover:bg-signal-green/90 disabled:bg-white/[0.06] disabled:text-signal-muted disabled:cursor-not-allowed text-signal-canvas font-medium rounded-xl text-sm transition-colors"
            >
              <CheckCircle className="w-4 h-4" /> {submitting ? `${t('common.loading')}...` : t('common.save')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Error Banner ──────────────────────────────────────────────────────────

  const renderErrorBanner = () =>
    loadError ? (
      <div className="mb-4 p-4 bg-signal-bad/10 border border-signal-bad/30 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-signal-bad flex-shrink-0" />
          <span className="text-sm text-signal-bad">{loadError}</span>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-signal-bad/15 text-signal-bad rounded-lg text-sm hover:bg-signal-bad/25 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      </div>
    ) : null;

  // ── Content Router ────────────────────────────────────────────────────────

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 text-signal-green animate-spin" />
          <span className="ml-3 text-signal-muted">{t('common.loading')}...</span>
        </div>
      );
    }
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'screening':
        return renderScreening();
      case 'risk-assessment':
        return renderRiskAssessment();
      case 'dpo-review':
        return renderDPOReview();
      default:
        return null;
    }
  };

  // ── Main Return ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-signal-canvas text-signal-ink">
      <div className="border-b border-white/[0.06] bg-signal-canvas/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-signal-muted hover:text-signal-ink transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">{t('common.back')}</span>
              </button>
              <div className="h-5 w-px bg-white/[0.10]" />
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-signal-green" />
                <h1 className="text-lg font-display font-semibold text-signal-ink">{t('dpia.title')}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-signal-muted">Data Protection Impact Assessment</span>
              <button
                onClick={loadData}
                className="p-2 text-signal-muted hover:text-signal-ink transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-1 mb-6 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white/[0.06] text-signal-ink font-medium'
                  : 'text-signal-muted hover:text-signal-ink hover:bg-white/[0.04]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {renderErrorBanner()}
        {renderContent()}
      </div>

      {renderCreateModal()}
      {renderEditModal()}
    </div>
  );
};

export default DPIAWorkflow;
