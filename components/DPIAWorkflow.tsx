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
  Draft: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  InProgress: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  UnderReview: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Approved: 'bg-green-500/20 text-green-400 border-green-500/30',
  Rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const riskLevelColors: Record<string, string> = {
  Low: 'bg-green-500/20 text-green-400',
  Medium: 'bg-yellow-500/20 text-yellow-400',
  High: 'bg-orange-500/20 text-orange-400',
  Critical: 'bg-red-500/20 text-red-400',
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

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${apiUrl}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  return res.json();
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

      if (dpiaRes.status === 'fulfilled') {
        const d = dpiaRes.value;
        if (Array.isArray(d)) setDpias(d);
        else if (d?.data) setDpias(d.data);
      } else {
        failedApis.push('DPIAs');
      }

      if (riskRes.status === 'fulfilled') {
        const d = riskRes.value;
        if (Array.isArray(d)) setRisks(d);
        else if (d?.data) setRisks(d.data);
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
    if (score >= 16) return 'bg-red-500';
    if (score >= 10) return 'bg-orange-500';
    if (score >= 5) return 'bg-yellow-500';
    return 'bg-green-500';
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
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-400 text-sm mb-1">
            <FileText className="w-4 h-4" /> Total DPIAs
          </div>
          <div className="text-3xl font-bold text-blue-400">{stats.total}</div>
          <div className="text-xs text-slate-500 mt-1">{stats.draft} drafts</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-400 text-sm mb-1">
            <Clock className="w-4 h-4" /> In Progress
          </div>
          <div className="text-3xl font-bold text-yellow-400">{stats.inProgress}</div>
          <div className="text-xs text-slate-500 mt-1">{stats.underReview} under review</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-400 text-sm mb-1">
            <CheckCircle className="w-4 h-4" /> Approved
          </div>
          <div className="text-3xl font-bold text-green-400">{stats.approved}</div>
          <div className="text-xs text-slate-500 mt-1">{stats.rejected} rejected</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-400 text-sm mb-1">
            <AlertTriangle className="w-4 h-4" /> High Risk
          </div>
          <div className="text-3xl font-bold text-red-400">{stats.highRisk}</div>
          <div className="text-xs text-slate-500 mt-1">assessments flagged</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`${t('common.search')}...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 w-64"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as DPIAStatus | 'All')}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
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
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> {t('dpia.createDPIA')}
        </button>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-4 py-3 text-slate-400 font-medium">ID</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Title</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Project</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">{t('common.status')}</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Risk Level</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">{t('common.assignee')}</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Updated</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredDPIAs.map(dpia => (
                <tr key={dpia.id} className="border-b border-slate-700/50 hover:bg-slate-750/50">
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs">{dpia.id}</td>
                  <td className="px-4 py-3 text-slate-200">{dpia.title}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{dpia.projectName}</td>
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
                  <td className="px-4 py-3 text-slate-400 text-xs">{dpia.assignedTo}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{dpia.updatedAt}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedDPIA(dpia.id)}
                        className="p-1.5 text-slate-400 hover:text-white transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        className="p-1.5 text-slate-400 hover:text-white transition-colors"
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
          <div className="text-center py-8 text-slate-500 text-sm">
            {loading ? 'Loading DPIAs...' : 'No DPIAs match the current filters.'}
          </div>
        )}
      </div>

      {/* Status Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-white mb-3">Status Distribution</h3>
          <div className="space-y-2">
            {(['Draft', 'InProgress', 'UnderReview', 'Approved', 'Rejected'] as DPIAStatus[]).map(status => {
              const count = dpias.filter(d => d.status === status).length;
              const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
              const label = status === 'InProgress' ? 'In Progress' : status === 'UnderReview' ? 'Under Review' : status;
              return (
                <div key={status} className="flex items-center gap-3">
                  <div className="w-28 text-xs text-slate-400">{label}</div>
                  <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        status === 'Approved'
                          ? 'bg-green-500'
                          : status === 'Rejected'
                          ? 'bg-red-500'
                          : status === 'InProgress'
                          ? 'bg-yellow-500'
                          : status === 'UnderReview'
                          ? 'bg-blue-500'
                          : 'bg-slate-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="w-6 text-xs text-slate-400 text-right">{count}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-white mb-3">Risk Level Distribution</h3>
          <div className="space-y-2">
            {(['Low', 'Medium', 'High', 'Critical'] as const).map(level => {
              const count = dpias.filter(d => d.riskLevel === level).length;
              const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
              return (
                <div key={level} className="flex items-center gap-3">
                  <div className="w-28 text-xs text-slate-400">{level}</div>
                  <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        level === 'Critical'
                          ? 'bg-red-500'
                          : level === 'High'
                          ? 'bg-orange-500'
                          : level === 'Medium'
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="w-6 text-xs text-slate-400 text-right">{count}</div>
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
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-2">DPIA Screening Questionnaire</h3>
        <p className="text-sm text-slate-400 mb-6">
          Answer the following questions to determine whether a DPIA is required for your processing activity.
          If two or more indicators are checked, a DPIA is mandatory under GDPR Article 35.
        </p>

        <div className="space-y-4">
          {screeningQuestions.map(q => (
            <label
              key={q.id}
              className="flex items-start gap-3 p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors"
            >
              <input
                type="checkbox"
                checked={screeningAnswers[q.id] || false}
                onChange={e => setScreeningAnswers(prev => ({ ...prev, [q.id]: e.target.checked }))}
                className="mt-0.5 w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 bg-slate-700"
              />
              <div className="flex-1">
                <div className="text-sm text-slate-200">{q.question}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-600 text-slate-300">{q.category}</span>
                  {q.isHighRisk && (
                    <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400">High Risk Indicator</span>
                  )}
                </div>
              </div>
            </label>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={handleScreeningSubmit}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
          >
            <ClipboardList className="w-4 h-4" /> Evaluate
          </button>
          <button
            onClick={() => {
              setScreeningAnswers({});
              setScreeningResult(null);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> {t('common.reset')}
          </button>
          <div className="text-sm text-slate-400">
            {Object.values(screeningAnswers).filter(Boolean).length} of {screeningQuestions.length} indicators checked
          </div>
        </div>
      </div>

      {screeningResult && (
        <div
          className={`p-4 rounded-lg border flex items-start gap-3 ${
            screeningResult === 'required'
              ? 'bg-red-500/10 border-red-500/30'
              : screeningResult === 'recommended'
              ? 'bg-yellow-500/10 border-yellow-500/30'
              : 'bg-green-500/10 border-green-500/30'
          }`}
        >
          {screeningResult === 'required' ? (
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          ) : screeningResult === 'recommended' ? (
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <div
              className={`text-sm font-medium ${
                screeningResult === 'required'
                  ? 'text-red-400'
                  : screeningResult === 'recommended'
                  ? 'text-yellow-400'
                  : 'text-green-400'
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
                  ? 'text-red-400/70'
                  : screeningResult === 'recommended'
                  ? 'text-yellow-400/70'
                  : 'text-green-400/70'
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
        <div className="text-sm text-slate-400">Select a DPIA to view its risk assessment:</div>
        <select
          value={selectedDPIA || ''}
          onChange={e => setSelectedDPIA(e.target.value || null)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
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
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h3 className="text-sm font-medium text-white mb-4">Risk Matrix - Likelihood vs Impact</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="px-3 py-2 text-slate-400 font-medium text-left w-32">Likelihood / Impact</th>
                {[1, 2, 3, 4, 5].map(impact => (
                  <th key={impact} className="px-3 py-2 text-slate-400 font-medium text-center">
                    {impactLabels[impact]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[5, 4, 3, 2, 1].map(likelihood => (
                <tr key={likelihood}>
                  <td className="px-3 py-2 text-slate-400 text-xs font-medium">{likelihoodLabels[likelihood]}</td>
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
                          )}/20 border border-slate-700/50`}
                        >
                          {cellRisks.length > 0 ? (
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-white font-bold text-sm">{cellRisks.length}</span>
                              <span className="text-xs text-slate-300">{getRiskLabel(likelihood, impact)}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">{getRiskLabel(likelihood, impact)}</span>
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
            <div className="w-3 h-3 rounded bg-green-500/40" />
            <span className="text-xs text-slate-400">Low</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-yellow-500/40" />
            <span className="text-xs text-slate-400">Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-orange-500/40" />
            <span className="text-xs text-slate-400">High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500/40" />
            <span className="text-xs text-slate-400">Critical</span>
          </div>
        </div>
      </div>

      {/* Risk List */}
      {selectedDPIA && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700">
            <h3 className="text-sm font-medium text-white">
              Identified Risks ({selectedDPIARisks.length})
            </h3>
          </div>
          {selectedDPIARisks.length > 0 ? (
            <div className="divide-y divide-slate-700/50">
              {selectedDPIARisks.map(risk => (
                <div key={risk.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="text-sm text-slate-200">{risk.riskDescription}</div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-slate-500">
                          Likelihood: {likelihoodLabels[risk.likelihood]}
                        </span>
                        <span className="text-xs text-slate-500">
                          Impact: {impactLabels[risk.impact]}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${riskLevelColors[risk.residualRisk]}`}>
                          {risk.residualRisk}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            risk.status === 'Mitigated'
                              ? 'bg-green-500/20 text-green-400'
                              : risk.status === 'Accepted'
                              ? 'bg-blue-500/20 text-blue-400'
                              : risk.status === 'Transferred'
                              ? 'bg-purple-500/20 text-purple-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}
                        >
                          {risk.status}
                        </span>
                      </div>
                      {risk.mitigationMeasures && (
                        <div className="mt-2 text-xs text-slate-400">
                          <span className="font-medium text-slate-300">Mitigation:</span> {risk.mitigationMeasures}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">
              No risks identified for this DPIA yet.
            </div>
          )}
        </div>
      )}

      {!selectedDPIA && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-slate-500 mx-auto mb-3" />
          <div className="text-sm text-slate-400">Select a DPIA from the dropdown above to view its risk assessment.</div>
        </div>
      )}
    </div>
  );

  // ── DPO Review Tab ────────────────────────────────────────────────────────

  const renderDPOReview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-400 text-sm mb-1">
            <Clock className="w-4 h-4" /> Pending Review
          </div>
          <div className="text-3xl font-bold text-blue-400">
            {dpias.filter(d => d.status === 'UnderReview').length}
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-400 text-sm mb-1">
            <CheckCircle className="w-4 h-4" /> Approved
          </div>
          <div className="text-3xl font-bold text-green-400">{stats.approved}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-400 text-sm mb-1">
            <X className="w-4 h-4" /> Rejected
          </div>
          <div className="text-3xl font-bold text-red-400">{stats.rejected}</div>
        </div>
      </div>

      {/* Awaiting Review List */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700">
          <h3 className="text-sm font-medium text-white">DPIAs Awaiting DPO Review</h3>
        </div>
        <div className="divide-y divide-slate-700/50">
          {dpias
            .filter(d => d.status === 'UnderReview')
            .map(dpia => (
              <div key={dpia.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-200">{dpia.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500">Project: {dpia.projectName}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${riskLevelColors[dpia.riskLevel]}`}>
                      {dpia.riskLevel} Risk
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setDpoReviewForm(prev => ({ ...prev, dpiaId: dpia.id }))}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5" /> Review
                </button>
              </div>
            ))}
          {dpias.filter(d => d.status === 'UnderReview').length === 0 && (
            <div className="text-center py-8 text-slate-500 text-sm">No DPIAs pending review.</div>
          )}
        </div>
      </div>

      {/* DPO Review Form */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h3 className="text-sm font-medium text-white mb-4">DPO Consultation Form</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Select DPIA</label>
            <select
              value={dpoReviewForm.dpiaId}
              onChange={e => setDpoReviewForm(prev => ({ ...prev, dpiaId: e.target.value }))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
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
            <label className="block text-xs text-slate-400 mb-1">DPO Name</label>
            <input
              type="text"
              value={dpoReviewForm.dpoName}
              onChange={e => setDpoReviewForm(prev => ({ ...prev, dpoName: e.target.value }))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter DPO name"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Opinion</label>
            <select
              value={dpoReviewForm.opinion}
              onChange={e =>
                setDpoReviewForm(prev => ({
                  ...prev,
                  opinion: e.target.value as 'Approve' | 'Reject' | 'RequestChanges',
                }))
              }
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="Approve">Approve</option>
              <option value="Reject">Reject</option>
              <option value="RequestChanges">Request Changes</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Conditions (comma-separated)</label>
            <input
              type="text"
              value={dpoReviewForm.conditions}
              onChange={e => setDpoReviewForm(prev => ({ ...prev, conditions: e.target.value }))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g., Implement encryption, Limit retention to 12 months"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-slate-400 mb-1">{t('dpia.dpoOpinion')}</label>
            <textarea
              value={dpoReviewForm.comments}
              onChange={e => setDpoReviewForm(prev => ({ ...prev, comments: e.target.value }))}
              rows={4}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
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
                className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 bg-slate-700"
              />
              <span className="text-sm text-slate-300">
                {t('dpia.consultationRequired')}
              </span>
            </label>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={handleDPOReviewSubmit}
            disabled={!dpoReviewForm.dpiaId || !dpoReviewForm.dpoName || submitting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors"
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
        <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white">{t('dpia.createDPIA')}</h2>
            <button
              onClick={() => setShowCreateModal(false)}
              className="p-1 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Title *</label>
              <input
                type="text"
                value={createForm.title}
                onChange={e => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., Customer Profiling System DPIA"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">{t('common.description')} *</label>
              <textarea
                value={createForm.description}
                onChange={e => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                placeholder="Describe the processing activity and its purpose"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Project Name *</label>
                <input
                  type="text"
                  value={createForm.projectName}
                  onChange={e => setCreateForm(prev => ({ ...prev, projectName: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Project name"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Assigned To *</label>
                <input
                  type="text"
                  value={createForm.assignedTo}
                  onChange={e => setCreateForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Assessor name"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                {t('dpia.dataSubjects')} (comma-separated)
              </label>
              <input
                type="text"
                value={createForm.dataSubjects}
                onChange={e => setCreateForm(prev => ({ ...prev, dataSubjects: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., Customers, Employees, Contractors"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                {t('dpia.processingActivity')} (comma-separated)
              </label>
              <input
                type="text"
                value={createForm.processingPurposes}
                onChange={e => setCreateForm(prev => ({ ...prev, processingPurposes: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., Marketing, Analytics, Service delivery"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">{t('dpia.necessity')}</label>
              <textarea
                value={createForm.necessityJustification}
                onChange={e => setCreateForm(prev => ({ ...prev, necessityJustification: e.target.value }))}
                rows={3}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                placeholder="Explain why this processing is necessary and proportionate to the purpose"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-700">
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleCreateDPIA}
              disabled={!createForm.title || !createForm.description || !createForm.projectName || submitting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> {submitting ? `${t('common.loading')}...` : t('dpia.createDPIA')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Error Banner ──────────────────────────────────────────────────────────

  const renderErrorBanner = () =>
    loadError ? (
      <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span className="text-sm text-red-300">{loadError}</span>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-300 rounded text-sm hover:bg-red-500/30 transition-colors"
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
          <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
          <span className="ml-3 text-slate-400">{t('common.loading')}...</span>
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
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="border-b border-slate-700 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">{t('common.back')}</span>
              </button>
              <div className="h-5 w-px bg-slate-700" />
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                <h1 className="text-lg font-semibold text-white">{t('dpia.title')}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Data Protection Impact Assessment</span>
              <button
                onClick={loadData}
                className="p-2 text-slate-400 hover:text-white transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-1 mb-6 bg-slate-800 rounded-lg p-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-slate-700 text-white font-medium'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
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
    </div>
  );
};

export default DPIAWorkflow;
