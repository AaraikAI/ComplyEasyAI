/**
 * Security Training Dashboard Component
 *
 * Security awareness and compliance training management:
 * - Admin view: create/manage training modules, assign to users, compliance reports
 * - Employee view: assigned trainings with progress tracking
 * - Compliance reporting: organization-wide statistics
 * - Training categories: SecurityAwareness, DataPrivacy, IncidentResponse,
 *   PhishingPrevention, ComplianceRegulatory, SecureCoding
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Edit,
  BarChart3,
  Users,
  BookOpen,
  GraduationCap,
  Award,
  TrendingUp,
  Calendar,
  Play,
  Target,
  UserCheck,
  Filter,
  ChevronRight,
} from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';

// ── Type Definitions ────────────────────────────────────────────────────────

type ViewMode = 'admin' | 'employee';

type TrainingCategory =
  | 'SecurityAwareness'
  | 'DataPrivacy'
  | 'IncidentResponse'
  | 'PhishingPrevention'
  | 'ComplianceRegulatory'
  | 'SecureCoding';

type TrainingStatus = 'Draft' | 'Published' | 'Archived';

type AssignmentStatus = 'NotStarted' | 'InProgress' | 'Completed' | 'Overdue' | 'Expired';

type AdminTab = 'modules' | 'assignments' | 'reports';

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  category: TrainingCategory;
  durationMinutes: number;
  passingScore: number;
  status: TrainingStatus;
  version: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  totalAssigned: number;
  completionRate: number;
  averageScore: number;
  expiresInMonths: number;
}

interface TrainingAssignment {
  id: string;
  moduleId: string;
  moduleTitle: string;
  moduleCategory: TrainingCategory;
  userId: string;
  userName: string;
  userEmail: string;
  userDepartment: string;
  assignedDate: string;
  dueDate: string;
  completedDate: string | null;
  status: AssignmentStatus;
  progress: number;
  score: number | null;
  attempts: number;
  certificationExpiry: string | null;
}

interface ComplianceReport {
  totalEmployees: number;
  trainedEmployees: number;
  overallComplianceRate: number;
  overdueTrainings: number;
  expiringCertifications: number;
  averageCompletionTime: number;
  byCategory: {
    category: TrainingCategory;
    assigned: number;
    completed: number;
    complianceRate: number;
  }[];
  byDepartment: {
    department: string;
    totalEmployees: number;
    compliant: number;
    complianceRate: number;
  }[];
}

interface CreateModuleForm {
  title: string;
  description: string;
  category: TrainingCategory;
  durationMinutes: number;
  passingScore: number;
  expiresInMonths: number;
}

interface AssignTrainingForm {
  moduleId: string;
  userIds: string;
  dueDate: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

const API_BASE = (import.meta as ImportMeta & { env: Record<string, string> }).env.VITE_API_URL || 'http://localhost:3001/api';
const apiUrl = API_BASE.endsWith('/api') ? API_BASE : API_BASE.replace(/\/?$/, '') + '/api';

const categoryLabels: Record<TrainingCategory, string> = {
  SecurityAwareness: 'Security Awareness',
  DataPrivacy: 'Data Privacy',
  IncidentResponse: 'Incident Response',
  PhishingPrevention: 'Phishing Prevention',
  ComplianceRegulatory: 'Compliance & Regulatory',
  SecureCoding: 'Secure Coding',
};

const categoryColors: Record<TrainingCategory, string> = {
  SecurityAwareness: 'bg-blue-500/20 text-blue-400',
  DataPrivacy: 'bg-purple-500/20 text-purple-400',
  IncidentResponse: 'bg-red-500/20 text-red-400',
  PhishingPrevention: 'bg-orange-500/20 text-orange-400',
  ComplianceRegulatory: 'bg-green-500/20 text-green-400',
  SecureCoding: 'bg-cyan-500/20 text-cyan-400',
};

const moduleStatusColors: Record<TrainingStatus, string> = {
  Draft: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  Published: 'bg-green-500/20 text-green-400 border-green-500/30',
  Archived: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

const assignmentStatusColors: Record<AssignmentStatus, string> = {
  NotStarted: 'bg-slate-500/20 text-slate-400',
  InProgress: 'bg-blue-500/20 text-blue-400',
  Completed: 'bg-green-500/20 text-green-400',
  Overdue: 'bg-red-500/20 text-red-400',
  Expired: 'bg-yellow-500/20 text-yellow-400',
};

const assignmentStatusLabels: Record<AssignmentStatus, string> = {
  NotStarted: 'Not Started',
  InProgress: 'In Progress',
  Completed: 'Completed',
  Overdue: 'Overdue',
  Expired: 'Expired',
};

const adminTabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  { id: 'modules', label: 'Training Modules', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'assignments', label: 'Assignments', icon: <Users className="w-4 h-4" /> },
  { id: 'reports', label: 'Compliance Reports', icon: <BarChart3 className="w-4 h-4" /> },
];

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

const SecurityTrainingDashboard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { t } = useI18n();
  const { user: currentUser } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('admin');
  const [adminTab, setAdminTab] = useState<AdminTab>('modules');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<TrainingCategory | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [assignments, setAssignments] = useState<TrainingAssignment[]>([]);
  const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null);
  const [showCreateModuleModal, setShowCreateModuleModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState<CreateModuleForm>({
    title: '',
    description: '',
    category: 'SecurityAwareness',
    durationMinutes: 30,
    passingScore: 80,
    expiresInMonths: 12,
  });
  const [assignForm, setAssignForm] = useState<AssignTrainingForm>({
    moduleId: '',
    userIds: '',
    dueDate: '',
  });

  // ── Data Loading ──────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [modulesRes, assignmentsRes, reportRes] = await Promise.allSettled([
        apiFetch<{ data: TrainingModule[] } | TrainingModule[]>('/security-training/modules'),
        apiFetch<{ data: TrainingAssignment[] } | TrainingAssignment[]>('/security-training/assignments'),
        apiFetch<{ data: ComplianceReport } | ComplianceReport>('/security-training/compliance-report'),
      ]);

      const failedApis: string[] = [];

      if (modulesRes.status === 'fulfilled') {
        const d = modulesRes.value;
        if (Array.isArray(d)) setModules(d);
        else if (d && 'data' in d && Array.isArray(d.data)) setModules(d.data);
      } else {
        failedApis.push('Training Modules');
      }

      if (assignmentsRes.status === 'fulfilled') {
        const d = assignmentsRes.value;
        if (Array.isArray(d)) setAssignments(d);
        else if (d && 'data' in d && Array.isArray(d.data)) setAssignments(d.data);
      } else {
        failedApis.push('Assignments');
      }

      if (reportRes.status === 'fulfilled') {
        const d = reportRes.value;
        if (d && 'totalEmployees' in d) {
          setComplianceReport(d as ComplianceReport);
        } else if (d && 'data' in d) {
          setComplianceReport((d as { data: ComplianceReport }).data);
        }
      } else {
        failedApis.push('Compliance Report');
      }

      if (failedApis.length > 0) {
        setLoadError(`Failed to load: ${failedApis.join(', ')}. Showing available data only.`);
      }
    } catch (err) {
      setLoadError('Failed to connect to the server. Please check your connection and try again.');
      logger.error('SecurityTrainingDashboard data load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Computed Values ───────────────────────────────────────────────────────

  const moduleStats = useMemo(() => {
    const total = modules.length;
    const published = modules.filter(m => m.status === 'Published').length;
    const draft = modules.filter(m => m.status === 'Draft').length;
    const avgCompletion =
      modules.length > 0
        ? modules.reduce((sum, m) => sum + m.completionRate, 0) / modules.length
        : 0;
    return { total, published, draft, avgCompletion };
  }, [modules]);

  const assignmentStats = useMemo(() => {
    const total = assignments.length;
    const completed = assignments.filter(a => a.status === 'Completed').length;
    const inProgress = assignments.filter(a => a.status === 'InProgress').length;
    const overdue = assignments.filter(a => a.status === 'Overdue').length;
    const notStarted = assignments.filter(a => a.status === 'NotStarted').length;
    return { total, completed, inProgress, overdue, notStarted };
  }, [assignments]);

  const filteredModules = useMemo(() => {
    return modules.filter(m => {
      const matchesSearch =
        searchQuery === '' ||
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || m.category === categoryFilter;
      const matchesStatus = statusFilter === 'All' || m.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [modules, searchQuery, categoryFilter, statusFilter]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter(a => {
      const matchesSearch =
        searchQuery === '' ||
        a.moduleTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || a.moduleCategory === categoryFilter;
      const matchesStatus = statusFilter === 'All' || a.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [assignments, searchQuery, categoryFilter, statusFilter]);

  // My trainings for employee view — scope the org-wide assignment list down to
  // the signed-in user so an employee only sees their own training records.
  const myAssignments = useMemo(() => {
    if (!currentUser) return [];
    const uid = currentUser.id;
    const email = (currentUser.email || '').toLowerCase();
    return assignments.filter(
      a => a.userId === uid || (email !== '' && a.userEmail?.toLowerCase() === email),
    );
  }, [assignments, currentUser]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCreateModule = async () => {
    setSubmitting(true);
    try {
      await apiFetch('/security-training/modules', {
        method: 'POST',
        body: JSON.stringify(createForm),
      });
      setShowCreateModuleModal(false);
      setCreateForm({
        title: '',
        description: '',
        category: 'SecurityAwareness',
        durationMinutes: 30,
        passingScore: 80,
        expiresInMonths: 12,
      });
      await loadData();
    } catch (err) {
      logger.error('Failed to create training module:', err);
      setLoadError('Failed to create training module. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignTraining = async () => {
    setSubmitting(true);
    try {
      await apiFetch('/security-training/assign', {
        method: 'POST',
        body: JSON.stringify({
          moduleId: assignForm.moduleId,
          userIds: assignForm.userIds.split(',').map(s => s.trim()).filter(Boolean),
          dueDate: assignForm.dueDate,
        }),
      });
      setShowAssignModal(false);
      setAssignForm({ moduleId: '', userIds: '', dueDate: '' });
      await loadData();
    } catch (err) {
      logger.error('Failed to assign training:', err);
      setLoadError('Failed to assign training. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Admin: Modules Tab ────────────────────────────────────────────────────

  const renderModulesTab = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search modules..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 w-64"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value as TrainingCategory | 'All')}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="All">All Categories</option>
            {(Object.keys(categoryLabels) as TrainingCategory[]).map(cat => (
              <option key={cat} value={cat}>
                {categoryLabels[cat]}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="All">All Statuses</option>
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
        <button
          onClick={() => setShowCreateModuleModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> New Module
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredModules.map(module => (
          <div
            key={module.id}
            className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <span className={`text-xs px-2 py-0.5 rounded ${categoryColors[module.category]}`}>
                {categoryLabels[module.category]}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded border ${moduleStatusColors[module.status]}`}>
                {module.status}
              </span>
            </div>
            <h3 className="text-sm font-medium text-white mb-1">{module.title}</h3>
            <p className="text-xs text-slate-400 mb-3 line-clamp-2">{module.description}</p>
            <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {module.durationMinutes} min
              </span>
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3" /> {module.passingScore}% to pass
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> v{module.version}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-400">{module.totalAssigned}</div>
                <div className="text-xs text-slate-500">Assigned</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-400">{module.completionRate}%</div>
                <div className="text-xs text-slate-500">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-cyan-400">
                  {module.averageScore > 0 ? `${module.averageScore}%` : 'N/A'}
                </div>
                <div className="text-xs text-slate-500">Avg Score</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setAssignForm(prev => ({ ...prev, moduleId: module.id }));
                  setShowAssignModal(true);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs transition-colors"
              >
                <Users className="w-3 h-3" /> Assign
              </button>
              <button className="p-1.5 text-slate-400 hover:text-white transition-colors" title="Edit">
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button className="p-1.5 text-slate-400 hover:text-white transition-colors" title="View">
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredModules.length === 0 && (
        <div className="text-center py-12 text-slate-500 text-sm">
          {loading ? 'Loading training modules...' : 'No training modules match the current filters.'}
        </div>
      )}
    </div>
  );

  // ── Admin: Assignments Tab ────────────────────────────────────────────────

  const renderAssignmentsTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-400 text-sm mb-1">
            <Users className="w-4 h-4" /> Total Assignments
          </div>
          <div className="text-3xl font-bold text-blue-400">{assignmentStats.total}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-400 text-sm mb-1">
            <CheckCircle className="w-4 h-4" /> {t('training.completed')}
          </div>
          <div className="text-3xl font-bold text-green-400">{assignmentStats.completed}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-400 text-sm mb-1">
            <Clock className="w-4 h-4" /> {t('training.inProgress')}
          </div>
          <div className="text-3xl font-bold text-yellow-400">{assignmentStats.inProgress}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-400 text-sm mb-1">
            <AlertTriangle className="w-4 h-4" /> {t('training.overdue')}
          </div>
          <div className="text-3xl font-bold text-red-400">{assignmentStats.overdue}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search assignments..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 w-64"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="All">All Statuses</option>
          {(Object.keys(assignmentStatusLabels) as AssignmentStatus[]).map(s => (
            <option key={s} value={s}>
              {assignmentStatusLabels[s]}
            </option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value as TrainingCategory | 'All')}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="All">All Categories</option>
          {(Object.keys(categoryLabels) as TrainingCategory[]).map(cat => (
            <option key={cat} value={cat}>
              {categoryLabels[cat]}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Employee</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Training</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Category</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Progress</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">{t('training.dueDate')}</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">{t('training.score')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssignments.map(assignment => (
                <tr key={assignment.id} className="border-b border-slate-700/50 hover:bg-slate-750/50">
                  <td className="px-4 py-3">
                    <div className="text-slate-200 text-sm">{assignment.userName}</div>
                    <div className="text-slate-500 text-xs">{assignment.userDepartment}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-200 text-sm">{assignment.moduleTitle}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${categoryColors[assignment.moduleCategory]}`}>
                      {categoryLabels[assignment.moduleCategory]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden max-w-[80px]">
                        <div
                          className={`h-full rounded-full transition-all ${
                            assignment.progress === 100
                              ? 'bg-green-500'
                              : assignment.progress > 0
                              ? 'bg-blue-500'
                              : 'bg-slate-600'
                          }`}
                          style={{ width: `${assignment.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400">{assignment.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${assignmentStatusColors[assignment.status]}`}>
                      {assignmentStatusLabels[assignment.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs ${
                        assignment.status === 'Overdue' ? 'text-red-400 font-medium' : 'text-slate-400'
                      }`}
                    >
                      {assignment.dueDate}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {assignment.score !== null ? `${assignment.score}%` : '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredAssignments.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-sm">No assignments match the current filters.</div>
        )}
      </div>
    </div>
  );

  // ── Admin: Compliance Reports Tab ─────────────────────────────────────────

  const renderReportsTab = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-400 text-sm mb-1">
            <TrendingUp className="w-4 h-4" /> Overall Compliance
          </div>
          <div className="text-3xl font-bold text-green-400">
            {complianceReport ? `${complianceReport.overallComplianceRate}%` : '--'}
          </div>
          <div className="text-xs text-slate-500 mt-1">organization-wide</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-400 text-sm mb-1">
            <Users className="w-4 h-4" /> Trained
          </div>
          <div className="text-3xl font-bold text-blue-400">
            {complianceReport
              ? `${complianceReport.trainedEmployees}/${complianceReport.totalEmployees}`
              : '--'}
          </div>
          <div className="text-xs text-slate-500 mt-1">employees</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-400 text-sm mb-1">
            <AlertTriangle className="w-4 h-4" /> Overdue
          </div>
          <div className="text-3xl font-bold text-red-400">
            {complianceReport ? complianceReport.overdueTrainings : '--'}
          </div>
          <div className="text-xs text-slate-500 mt-1">trainings</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-orange-400 text-sm mb-1">
            <Award className="w-4 h-4" /> Expiring Certs
          </div>
          <div className="text-3xl font-bold text-orange-400">
            {complianceReport ? complianceReport.expiringCertifications : '--'}
          </div>
          <div className="text-xs text-slate-500 mt-1">within 30 days</div>
        </div>
      </div>

      {complianceReport && (
        <>
          {/* Overdue & Expiring Warnings */}
          {(complianceReport.overdueTrainings > 0 || complianceReport.expiringCertifications > 0) && (
            <div className="space-y-2">
              {complianceReport.overdueTrainings > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-red-400">
                      {complianceReport.overdueTrainings} overdue training(s)
                    </div>
                    <div className="text-xs text-red-400/70">
                      Immediate action required. Non-compliance may result in regulatory penalties.
                    </div>
                  </div>
                </div>
              )}
              {complianceReport.expiringCertifications > 0 && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 flex items-center gap-3">
                  <Award className="w-5 h-5 text-orange-400 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-orange-400">
                      {complianceReport.expiringCertifications} certification(s) expiring soon
                    </div>
                    <div className="text-xs text-orange-400/70">
                      Renew certifications before expiry to maintain compliance status.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* By Category */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-white mb-4">Compliance by Category</h3>
            <div className="space-y-3">
              {complianceReport.byCategory.map(cat => (
                <div key={cat.category} className="flex items-center gap-3">
                  <div className="w-40 text-xs text-slate-400 truncate">
                    {categoryLabels[cat.category]}
                  </div>
                  <div className="flex-1 bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        cat.complianceRate >= 80
                          ? 'bg-green-500'
                          : cat.complianceRate >= 60
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${cat.complianceRate}%` }}
                    />
                  </div>
                  <div className="w-24 text-right">
                    <span className="text-xs text-slate-400">
                      {cat.completed}/{cat.assigned}
                    </span>
                    <span
                      className={`text-xs ml-2 font-medium ${
                        cat.complianceRate >= 80
                          ? 'text-green-400'
                          : cat.complianceRate >= 60
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }`}
                    >
                      {cat.complianceRate}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* By Department */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700">
              <h3 className="text-sm font-medium text-white">Compliance by Department</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Department</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Employees</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Compliant</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Rate</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {complianceReport.byDepartment.map(dept => (
                    <tr key={dept.department} className="border-b border-slate-700/50 hover:bg-slate-750/50">
                      <td className="px-4 py-3 text-slate-200">{dept.department}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{dept.totalEmployees}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{dept.compliant}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium ${
                            dept.complianceRate >= 80
                              ? 'text-green-400'
                              : dept.complianceRate >= 60
                              ? 'text-yellow-400'
                              : 'text-red-400'
                          }`}
                        >
                          {dept.complianceRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden max-w-[120px]">
                            <div
                              className={`h-full rounded-full ${
                                dept.complianceRate >= 80
                                  ? 'bg-green-500'
                                  : dept.complianceRate >= 60
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${dept.complianceRate}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!complianceReport && !loading && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
          <BarChart3 className="w-8 h-8 text-slate-500 mx-auto mb-3" />
          <div className="text-sm text-slate-400">
            Compliance report data is not available. Please check your API connection.
          </div>
        </div>
      )}
    </div>
  );

  // ── Employee View ─────────────────────────────────────────────────────────

  const renderEmployeeView = () => (
    <div className="space-y-6">
      {/* Employee Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-400 text-sm mb-1">
            <BookOpen className="w-4 h-4" /> Assigned
          </div>
          <div className="text-3xl font-bold text-blue-400">{myAssignments.length}</div>
          <div className="text-xs text-slate-500 mt-1">total trainings</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-400 text-sm mb-1">
            <CheckCircle className="w-4 h-4" /> {t('training.completed')}
          </div>
          <div className="text-3xl font-bold text-green-400">
            {myAssignments.filter(a => a.status === 'Completed').length}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {myAssignments.length > 0
              ? `${Math.round(
                  (myAssignments.filter(a => a.status === 'Completed').length / myAssignments.length) * 100
                )}% complete`
              : 'no trainings'}
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-400 text-sm mb-1">
            <Clock className="w-4 h-4" /> {t('training.inProgress')}
          </div>
          <div className="text-3xl font-bold text-yellow-400">
            {myAssignments.filter(a => a.status === 'InProgress').length}
          </div>
          <div className="text-xs text-slate-500 mt-1">ongoing</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-400 text-sm mb-1">
            <AlertTriangle className="w-4 h-4" /> {t('training.overdue')}
          </div>
          <div className="text-3xl font-bold text-red-400">
            {myAssignments.filter(a => a.status === 'Overdue').length}
          </div>
          <div className="text-xs text-slate-500 mt-1">needs attention</div>
        </div>
      </div>

      {/* Overdue Warnings */}
      {myAssignments.filter(a => a.status === 'Overdue').length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <div className="text-sm font-medium text-red-400">
              {myAssignments.filter(a => a.status === 'Overdue').length} overdue training(s)
            </div>
            <div className="text-xs text-red-400/70">
              Please complete overdue trainings as soon as possible to maintain compliance.
            </div>
          </div>
        </div>
      )}

      {/* Training Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-white">My Trainings</h3>
        {myAssignments.map(assignment => (
          <div
            key={assignment.id}
            className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-medium text-white">{assignment.moduleTitle}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded ${categoryColors[assignment.moduleCategory]}`}>
                    {categoryLabels[assignment.moduleCategory]}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>Assigned: {assignment.assignedDate}</span>
                  <span
                    className={
                      assignment.status === 'Overdue' ? 'text-red-400 font-medium' : ''
                    }
                  >
                    Due: {assignment.dueDate}
                  </span>
                  {assignment.completedDate && <span>Completed: {assignment.completedDate}</span>}
                  {assignment.score !== null && <span>Score: {assignment.score}%</span>}
                  <span>Attempts: {assignment.attempts}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 min-w-[120px]">
                  <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        assignment.progress === 100
                          ? 'bg-green-500'
                          : assignment.progress > 0
                          ? 'bg-blue-500'
                          : 'bg-slate-600'
                      }`}
                      style={{ width: `${assignment.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 w-8 text-right">{assignment.progress}%</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${assignmentStatusColors[assignment.status]}`}>
                  {assignmentStatusLabels[assignment.status]}
                </span>
                {assignment.status !== 'Completed' && (
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs transition-colors">
                    <Play className="w-3 h-3" />
                    {assignment.status === 'NotStarted' ? 'Start' : 'Continue'}
                  </button>
                )}
                {assignment.status === 'Completed' && assignment.certificationExpiry && (
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Award className="w-3 h-3 text-green-400" />
                    Cert expires: {assignment.certificationExpiry}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {myAssignments.length === 0 && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
            <GraduationCap className="w-8 h-8 text-slate-500 mx-auto mb-3" />
            <div className="text-sm text-slate-400">No trainings assigned yet.</div>
          </div>
        )}
      </div>
    </div>
  );

  // ── Create Module Modal ───────────────────────────────────────────────────

  const renderCreateModuleModal = () => {
    if (!showCreateModuleModal) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white">Create Training Module</h2>
            <button
              onClick={() => setShowCreateModuleModal(false)}
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
                placeholder="e.g., Annual Security Awareness Training"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Description *</label>
              <textarea
                value={createForm.description}
                onChange={e => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                placeholder="Describe the training content and objectives"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Category *</label>
              <select
                value={createForm.category}
                onChange={e =>
                  setCreateForm(prev => ({ ...prev, category: e.target.value as TrainingCategory }))
                }
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {(Object.keys(categoryLabels) as TrainingCategory[]).map(cat => (
                  <option key={cat} value={cat}>
                    {categoryLabels[cat]}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  value={createForm.durationMinutes}
                  onChange={e =>
                    setCreateForm(prev => ({
                      ...prev,
                      durationMinutes: parseInt(e.target.value) || 0,
                    }))
                  }
                  min={5}
                  max={480}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">{t('training.passingScore')} (%)</label>
                <input
                  type="number"
                  value={createForm.passingScore}
                  onChange={e =>
                    setCreateForm(prev => ({
                      ...prev,
                      passingScore: parseInt(e.target.value) || 0,
                    }))
                  }
                  min={0}
                  max={100}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Cert Expires (months)</label>
                <input
                  type="number"
                  value={createForm.expiresInMonths}
                  onChange={e =>
                    setCreateForm(prev => ({
                      ...prev,
                      expiresInMonths: parseInt(e.target.value) || 0,
                    }))
                  }
                  min={1}
                  max={60}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-700">
            <button
              onClick={() => setShowCreateModuleModal(false)}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleCreateModule}
              disabled={!createForm.title || !createForm.description || submitting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> {submitting ? 'Creating...' : 'Create Module'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Assign Training Modal ─────────────────────────────────────────────────

  const renderAssignModal = () => {
    if (!showAssignModal) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg mx-4">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white">{t('training.assignTraining')}</h2>
            <button
              onClick={() => setShowAssignModal(false)}
              className="p-1 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Training Module *</label>
              <select
                value={assignForm.moduleId}
                onChange={e => setAssignForm(prev => ({ ...prev, moduleId: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Select Module --</option>
                {modules
                  .filter(m => m.status === 'Published')
                  .map(m => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({categoryLabels[m.category]})
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                User IDs or Emails (comma-separated) *
              </label>
              <textarea
                value={assignForm.userIds}
                onChange={e => setAssignForm(prev => ({ ...prev, userIds: e.target.value }))}
                rows={3}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                placeholder="Enter user IDs or emails, separated by commas"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Due Date *</label>
              <input
                type="date"
                value={assignForm.dueDate}
                onChange={e => setAssignForm(prev => ({ ...prev, dueDate: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-700">
            <button
              onClick={() => setShowAssignModal(false)}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleAssignTraining}
              disabled={!assignForm.moduleId || !assignForm.userIds || !assignForm.dueDate || submitting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors"
            >
              <Users className="w-4 h-4" /> {submitting ? 'Assigning...' : 'Assign Training'}
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

    if (viewMode === 'employee') {
      return renderEmployeeView();
    }

    switch (adminTab) {
      case 'modules':
        return renderModulesTab();
      case 'assignments':
        return renderAssignmentsTab();
      case 'reports':
        return renderReportsTab();
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
                <GraduationCap className="w-5 h-5 text-blue-400" />
                <h1 className="text-lg font-semibold text-white">{t('training.title')}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                <button
                  onClick={() => setViewMode('admin')}
                  className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                    viewMode === 'admin'
                      ? 'bg-slate-700 text-white font-medium'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Admin
                </button>
                <button
                  onClick={() => setViewMode('employee')}
                  className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                    viewMode === 'employee'
                      ? 'bg-slate-700 text-white font-medium'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Employee
                </button>
              </div>
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
        {/* Admin Tabs (only in admin view) */}
        {viewMode === 'admin' && (
          <div className="flex gap-1 mb-6 bg-slate-800 rounded-lg p-1 overflow-x-auto">
            {adminTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setAdminTab(tab.id);
                  setSearchQuery('');
                  setStatusFilter('All');
                  setCategoryFilter('All');
                }}
                className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors whitespace-nowrap ${
                  adminTab === tab.id
                    ? 'bg-slate-700 text-white font-medium'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {renderErrorBanner()}
        {renderContent()}
      </div>

      {renderCreateModuleModal()}
      {renderAssignModal()}
    </div>
  );
};

export default SecurityTrainingDashboard;
