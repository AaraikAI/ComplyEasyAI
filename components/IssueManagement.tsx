import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { isAtLimit, getUpgradeMessage } from '../constants/tierLimits';
import { TierLimitBanner } from './TierLimitBanner';
import ReactMarkdown from 'react-markdown';
import {
  ArrowLeft, Plus, Loader2, Search, Filter, X, ChevronDown, ChevronUp,
  AlertTriangle, Brain, Eye, Trash2, Edit3, MessageSquare, Clock, User,
  CheckCircle, XCircle, AlertCircle, BarChart3, Target, Zap, Link2,
  Calendar, Tag, FileText, Play, RefreshCw, Users, TrendingUp, Shield,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, Legend,
} from 'recharts';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Issue {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  issueType: string;
  category?: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In_Progress' | 'Resolved' | 'Closed' | 'Reopened';
  assignedToId?: string;
  assignedTo?: { id: string; name: string; email: string };
  createdById: string;
  createdBy?: { id: string; name: string; email: string };
  dueDate?: string;
  slaTarget?: string;
  slaStatus?: string;
  remediationPlan?: string;
  remediationSteps?: any;
  resolvedDate?: string;
  closedDate?: string;
  tags?: any;
  comments?: IssueComment[];
  createdAt: string;
  updatedAt: string;
}

interface IssueComment {
  id: string;
  issueId: string;
  comment: string;
  author: string;
  createdAt: string;
}

interface Dashboard {
  totalIssues: number;
  statusDistribution: { open: number; inProgress: number; resolved: number; closed: number; reopened: number };
  priorityDistribution: { critical: number; high: number; medium: number; low: number };
  typeDistribution: Record<string, number>;
  slaMetrics: { onTrack: number; atRisk: number; breached: number };
  overdueIssues: number;
  unassignedIssues: number;
  averageResolutionTime: number;
  issuesByAssignee: Array<{ assignee: string; total: number; open: number; inProgress: number; resolved: number }>;
  criticalIssues: Array<{ id: string; title: string; priority: string; status: string; assignedTo?: string; slaStatus?: string }>;
}

interface AIClassification {
  severity: string;
  category: string;
  affectedFrameworks: string[];
  suggestedPriority: string;
  confidenceScore: number;
  reasoning: string;
}

interface AIRootCause {
  rootCause: string;
  contributingFactors: string[];
  affectedControls: string[];
  recommendedFixes: string[];
  analysisConfidence: number;
}

interface AIRemediation {
  steps: Array<{ step: string; effort: string; priority: string; dependencies: string[] }>;
  totalEstimatedEffort: string;
  criticalPath: string[];
  risks: string[];
}

interface AICorrelation {
  relatedIssues: Array<{ id: string; title: string; similarity: number; commonFactors: string[] }>;
  patterns: string[];
  systemicFixes: string[];
  summary: string;
}

type ViewMode = 'dashboard' | 'list' | 'detail' | 'create' | 'edit'
  | 'ai-classify' | 'ai-rootcause' | 'ai-remediation' | 'ai-correlation';

const STATUS_COLORS: Record<string, string> = {
  Open: 'bg-blue-100 text-blue-800 border-blue-200',
  In_Progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Resolved: 'bg-green-100 text-green-800 border-green-200',
  Closed: 'bg-gray-100 text-gray-600 border-gray-200',
  Reopened: 'bg-red-100 text-red-800 border-red-200',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  Open: <AlertCircle className="w-4 h-4 text-blue-600" />,
  In_Progress: <Play className="w-4 h-4 text-yellow-600" />,
  Resolved: <CheckCircle className="w-4 h-4 text-green-600" />,
  Closed: <XCircle className="w-4 h-4 text-gray-500" />,
  Reopened: <RefreshCw className="w-4 h-4 text-red-600" />,
};

const PRIORITY_COLORS: Record<string, string> = {
  Critical: 'bg-red-100 text-red-800 border-red-200',
  High: 'bg-orange-100 text-orange-800 border-orange-200',
  Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Low: 'bg-blue-100 text-blue-800 border-blue-200',
};

const PIE_COLORS = ['#3b82f6', '#eab308', '#22c55e', '#6b7280', '#ef4444'];
const PRIORITY_PIE_COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6'];

const ISSUE_TYPES = ['Compliance Gap', 'Control Failure', 'Policy Violation', 'Audit Finding', 'Security Incident', 'Process Issue', 'Other'];
const ISSUE_CATEGORIES = ['Access Control', 'Data Protection', 'Network Security', 'Governance', 'Risk Management', 'Third Party', 'Operational', 'Other'];
const PRIORITIES: Array<'Critical' | 'High' | 'Medium' | 'Low'> = ['Critical', 'High', 'Medium', 'Low'];
const STATUSES: Array<Issue['status']> = ['Open', 'In_Progress', 'Resolved', 'Closed', 'Reopened'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function IssueManagement() {
  const { user } = useAuth();
  const plan = user?.organization?.plan || 'Foundation';

  // Core state
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter/search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterType, setFilterType] = useState('All');

  // Form state
  const [issueForm, setIssueForm] = useState({
    title: '',
    description: '',
    issueType: 'Compliance Gap',
    category: '',
    priority: 'Medium' as 'Critical' | 'High' | 'Medium' | 'Low',
    assignedToId: '',
    dueDate: '',
    slaTarget: '',
    remediationPlan: '',
    tags: [] as string[],
  });
  const [isSaving, setIsSaving] = useState(false);

  // Comment state
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);

  // AI state
  const [aiClassification, setAiClassification] = useState<AIClassification | null>(null);
  const [aiRootCause, setAiRootCause] = useState<AIRootCause | null>(null);
  const [aiRemediation, setAiRemediation] = useState<AIRemediation | null>(null);
  const [aiCorrelation, setAiCorrelation] = useState<AICorrelation | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Users for assignment
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);

  // Tier limit
  const issueLimitReached = isAtLimit(plan, 'maxIssues', issues.length);

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------
  const loadIssues = useCallback(async () => {
    try {
      const data = await api.enterprise.issues.list();
      setIssues(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load issues');
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    try {
      const data = await api.enterprise.issues.getDashboard();
      setDashboard(data);
    } catch {
      // Dashboard is supplementary
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const data = await api.team.list();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      // Users list is supplementary
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await Promise.all([loadIssues(), loadDashboard(), loadUsers()]);
      setIsLoading(false);
    };
    load();
  }, [loadIssues, loadDashboard, loadUsers]);

  // ---------------------------------------------------------------------------
  // Filtering
  // ---------------------------------------------------------------------------
  const filteredIssues = useMemo(() => {
    let list = [...issues];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(i => i.title.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q));
    }
    if (filterStatus !== 'All') list = list.filter(i => i.status === filterStatus);
    if (filterPriority !== 'All') list = list.filter(i => i.priority === filterPriority);
    if (filterType !== 'All') list = list.filter(i => i.issueType === filterType);
    return list;
  }, [issues, searchQuery, filterStatus, filterPriority, filterType]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAtLimit(plan, 'maxIssues', issues.length)) {
      toast.warning(getUpgradeMessage(plan, 'maxIssues', issues.length));
      return;
    }
    setIsSaving(true);
    try {
      await api.enterprise.issues.create({
        organizationId: user?.organizationId,
        ...issueForm,
        dueDate: issueForm.dueDate ? new Date(issueForm.dueDate) : undefined,
        slaTarget: issueForm.slaTarget ? new Date(issueForm.slaTarget) : undefined,
      });
      await Promise.all([loadIssues(), loadDashboard()]);
      setViewMode('list');
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to create issue');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;
    setIsSaving(true);
    try {
      await api.enterprise.issues.update(selectedIssue.id, {
        ...issueForm,
        dueDate: issueForm.dueDate ? new Date(issueForm.dueDate) : undefined,
        slaTarget: issueForm.slaTarget ? new Date(issueForm.slaTarget) : undefined,
      });
      await Promise.all([loadIssues(), loadDashboard()]);
      setViewMode('detail');
      const updated = await api.enterprise.issues.getById(selectedIssue.id);
      setSelectedIssue(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to update issue');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteIssue = async (id: string) => {
    if (!confirm('Delete this issue and all its comments?')) return;
    try {
      await api.enterprise.issues.delete(id);
      await Promise.all([loadIssues(), loadDashboard()]);
      if (selectedIssue?.id === id) setViewMode('list');
    } catch (err: any) {
      setError(err.message || 'Failed to delete issue');
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.enterprise.issues.updateStatus(id, status);
      await Promise.all([loadIssues(), loadDashboard()]);
      if (selectedIssue?.id === id) {
        const updated = await api.enterprise.issues.getById(id);
        setSelectedIssue(updated);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    }
  };

  const handleAssign = async (id: string, assignedToId: string) => {
    try {
      await api.enterprise.issues.assign(id, assignedToId);
      await loadIssues();
      if (selectedIssue?.id === id) {
        const updated = await api.enterprise.issues.getById(id);
        setSelectedIssue(updated);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to assign issue');
    }
  };

  const handleAddComment = async () => {
    if (!selectedIssue || !newComment.trim()) return;
    setIsAddingComment(true);
    try {
      await api.enterprise.issues.addComment(selectedIssue.id, newComment);
      const updated = await api.enterprise.issues.getById(selectedIssue.id);
      setSelectedIssue(updated);
      setNewComment('');
    } catch (err: any) {
      setError(err.message || 'Failed to add comment');
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleViewDetail = async (issue: Issue) => {
    setSelectedIssue(issue);
    setAiClassification(null);
    setAiRootCause(null);
    setAiRemediation(null);
    setViewMode('detail');
    try {
      const full = await api.enterprise.issues.getById(issue.id);
      setSelectedIssue(full);
    } catch {
      // Use existing data
    }
  };

  const handleEditIssue = (issue: Issue) => {
    setSelectedIssue(issue);
    setIssueForm({
      title: issue.title,
      description: issue.description,
      issueType: issue.issueType,
      category: issue.category || '',
      priority: issue.priority,
      assignedToId: issue.assignedToId || '',
      dueDate: issue.dueDate ? new Date(issue.dueDate).toISOString().split('T')[0] : '',
      slaTarget: issue.slaTarget ? new Date(issue.slaTarget).toISOString().split('T')[0] : '',
      remediationPlan: issue.remediationPlan || '',
      tags: Array.isArray(issue.tags) ? issue.tags : [],
    });
    setViewMode('edit');
  };

  const resetForm = () => {
    setIssueForm({
      title: '',
      description: '',
      issueType: 'Compliance Gap',
      category: '',
      priority: 'Medium',
      assignedToId: '',
      dueDate: '',
      slaTarget: '',
      remediationPlan: '',
      tags: [],
    });
    setSelectedIssue(null);
  };

  // ---------------------------------------------------------------------------
  // AI Handlers
  // ---------------------------------------------------------------------------
  const handleAIClassify = async (description: string) => {
    setAiLoading(true);
    setAiClassification(null);
    try {
      const prompt = `Classify this compliance issue and suggest severity (Critical/High/Medium/Low), category, and affected frameworks: "${description}"

Return a JSON object with:
- severity: string
- category: string
- affectedFrameworks: string[]
- suggestedPriority: string
- confidenceScore: number (0-100)
- reasoning: string`;

      const result = await api.ai.chat(prompt) as any;
      const response = result?.response || result?.message || '';

      // Try to parse JSON from response
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setAiClassification(parsed);
        } else {
          setAiClassification({
            severity: 'Medium',
            category: 'Compliance',
            affectedFrameworks: [],
            suggestedPriority: 'Medium',
            confidenceScore: 75,
            reasoning: response,
          });
        }
      } catch {
        setAiClassification({
          severity: 'Medium',
          category: 'Compliance',
          affectedFrameworks: [],
          suggestedPriority: 'Medium',
          confidenceScore: 75,
          reasoning: response,
        });
      }
      setViewMode('ai-classify');
    } catch (err: any) {
      setError(err.message || 'AI classification failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIRootCause = async (issue: Issue) => {
    setSelectedIssue(issue);
    setAiLoading(true);
    setAiRootCause(null);
    setViewMode('ai-rootcause');
    try {
      const prompt = `Perform root cause analysis for this compliance issue:
Title: "${issue.title}"
Description: "${issue.description}"
Severity: ${issue.priority}
Type: ${issue.issueType}

Identify:
1. Root cause
2. Contributing factors
3. Affected controls
4. Recommended fixes

Return a JSON object with:
- rootCause: string
- contributingFactors: string[]
- affectedControls: string[]
- recommendedFixes: string[]
- analysisConfidence: number (0-100)`;

      const result = await api.ai.chat(prompt) as any;
      const response = result?.response || result?.message || '';

      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          setAiRootCause(JSON.parse(jsonMatch[0]));
        } else {
          setAiRootCause({
            rootCause: response,
            contributingFactors: [],
            affectedControls: [],
            recommendedFixes: [],
            analysisConfidence: 75,
          });
        }
      } catch {
        setAiRootCause({
          rootCause: response,
          contributingFactors: [],
          affectedControls: [],
          recommendedFixes: [],
          analysisConfidence: 75,
        });
      }
    } catch (err: any) {
      setError(err.message || 'AI root cause analysis failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIRemediation = async (issue: Issue) => {
    setSelectedIssue(issue);
    setAiLoading(true);
    setAiRemediation(null);
    setViewMode('ai-remediation');
    try {
      const prompt = `Generate a remediation plan for this compliance issue:
Title: "${issue.title}"
Description: "${issue.description}"
Severity: ${issue.priority}
Type: ${issue.issueType}
Category: ${issue.category || 'Not specified'}

Provide:
1. Step-by-step remediation with estimated effort and priority
2. Critical path items
3. Potential risks

Return a JSON object with:
- steps: [{ step: string, effort: string, priority: string, dependencies: string[] }]
- totalEstimatedEffort: string
- criticalPath: string[]
- risks: string[]`;

      const result = await api.ai.chat(prompt) as any;
      const response = result?.response || result?.message || '';

      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          setAiRemediation(JSON.parse(jsonMatch[0]));
        } else {
          setAiRemediation({
            steps: [{ step: response, effort: 'TBD', priority: 'High', dependencies: [] }],
            totalEstimatedEffort: 'TBD',
            criticalPath: [],
            risks: [],
          });
        }
      } catch {
        setAiRemediation({
          steps: [{ step: response, effort: 'TBD', priority: 'High', dependencies: [] }],
          totalEstimatedEffort: 'TBD',
          criticalPath: [],
          risks: [],
        });
      }
    } catch (err: any) {
      setError(err.message || 'AI remediation plan failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAICorrelation = async () => {
    setAiLoading(true);
    setAiCorrelation(null);
    setViewMode('ai-correlation');
    try {
      const openIssues = issues.filter(i => i.status !== 'Closed' && i.status !== 'Resolved');
      const issuesSummary = openIssues.map(i => `- ${i.title}: ${i.issueType}, ${i.priority}`).join('\n');

      const prompt = `Analyze these open compliance issues and find patterns/correlations:
${issuesSummary}

Identify:
1. Related issues that may have common causes
2. Patterns across issues
3. Systemic fixes that could address multiple issues

Return a JSON object with:
- relatedIssues: [{ id: string, title: string, similarity: number, commonFactors: string[] }]
- patterns: string[]
- systemicFixes: string[]
- summary: string`;

      const result = await api.ai.chat(prompt) as any;
      const response = result?.response || result?.message || '';

      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          setAiCorrelation(JSON.parse(jsonMatch[0]));
        } else {
          setAiCorrelation({
            relatedIssues: [],
            patterns: [],
            systemicFixes: [],
            summary: response,
          });
        }
      } catch {
        setAiCorrelation({
          relatedIssues: [],
          patterns: [],
          systemicFixes: [],
          summary: response,
        });
      }
    } catch (err: any) {
      setError(err.message || 'AI correlation analysis failed');
    } finally {
      setAiLoading(false);
    }
  };

  const applyAIClassification = () => {
    if (aiClassification) {
      setIssueForm(prev => ({
        ...prev,
        priority: aiClassification.suggestedPriority as any || prev.priority,
        category: aiClassification.category || prev.category,
      }));
      setViewMode('create');
    }
  };

  // ---------------------------------------------------------------------------
  // Render: Dashboard
  // ---------------------------------------------------------------------------
  const renderDashboard = () => {
    const d = dashboard;
    const statusData = d ? [
      { name: 'Open', value: d.statusDistribution.open },
      { name: 'In Progress', value: d.statusDistribution.inProgress },
      { name: 'Resolved', value: d.statusDistribution.resolved },
      { name: 'Closed', value: d.statusDistribution.closed },
      { name: 'Reopened', value: d.statusDistribution.reopened },
    ].filter(i => i.value > 0) : [];

    const priorityData = d ? [
      { name: 'Critical', value: d.priorityDistribution.critical },
      { name: 'High', value: d.priorityDistribution.high },
      { name: 'Medium', value: d.priorityDistribution.medium },
      { name: 'Low', value: d.priorityDistribution.low },
    ].filter(i => i.value > 0) : [];

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Issue Management</h1>
            <p className="text-gray-500 mt-1">Track, analyze, and resolve compliance issues with AI</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAICorrelation} disabled={aiLoading || issues.filter(i => i.status !== 'Closed').length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
              <Link2 className="w-4 h-4" /> Find Related Issues
            </button>
            <button onClick={() => { resetForm(); setViewMode('create'); }} disabled={issueLimitReached}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              <Plus className="w-4 h-4" /> New Issue
            </button>
          </div>
        </div>

        {issueLimitReached && <TierLimitBanner message={getUpgradeMessage(plan, 'maxIssues', issues.length)} />}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { label: 'Total Issues', value: d?.totalIssues ?? 0, icon: <FileText className="w-5 h-5 text-blue-600" /> },
            { label: 'Open', value: d?.statusDistribution.open ?? 0, icon: <AlertCircle className="w-5 h-5 text-blue-600" /> },
            { label: 'In Progress', value: d?.statusDistribution.inProgress ?? 0, icon: <Play className="w-5 h-5 text-yellow-600" /> },
            { label: 'Overdue', value: d?.overdueIssues ?? 0, icon: <Clock className="w-5 h-5 text-red-600" /> },
            { label: 'Unassigned', value: d?.unassignedIssues ?? 0, icon: <User className="w-5 h-5 text-gray-500" /> },
            { label: 'Avg Resolution', value: `${d?.averageResolutionTime ?? 0} days`, icon: <TrendingUp className="w-5 h-5 text-green-600" /> },
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
          {priorityData.length > 0 && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Priority Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={priorityData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0d9488" radius={[4, 4, 0, 0]}>
                    {priorityData.map((_, i) => <Cell key={i} fill={PRIORITY_PIE_COLORS[i % PRIORITY_PIE_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* SLA Metrics */}
        {d && (d.slaMetrics.onTrack > 0 || d.slaMetrics.atRisk > 0 || d.slaMetrics.breached > 0) && (
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">SLA Status</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <p className="text-3xl font-bold text-green-600">{d.slaMetrics.onTrack}</p>
                <p className="text-sm text-green-700">On Track</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg text-center">
                <p className="text-3xl font-bold text-yellow-600">{d.slaMetrics.atRisk}</p>
                <p className="text-sm text-yellow-700">At Risk</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg text-center">
                <p className="text-3xl font-bold text-red-600">{d.slaMetrics.breached}</p>
                <p className="text-sm text-red-700">Breached</p>
              </div>
            </div>
          </div>
        )}

        {/* Critical Issues */}
        {d && d.criticalIssues && d.criticalIssues.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-red-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Critical Issues ({d.criticalIssues.length})
              </h3>
            </div>
            <div className="space-y-2">
              {d.criticalIssues.map(ci => (
                <div key={ci.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-red-100">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900">{ci.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[ci.status]}`}>{ci.status.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {ci.assignedTo && <span className="text-xs text-gray-500">{ci.assignedTo}</span>}
                    <button onClick={() => { const i = issues.find(x => x.id === ci.id); if (i) handleViewDetail(i); }}
                      className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">View</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigate to full list */}
        <button onClick={() => setViewMode('list')} className="w-full py-3 text-center text-blue-600 hover:text-blue-800 bg-white rounded-xl border hover:border-blue-200 transition">
          View All Issues ({issues.length})
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
          <button onClick={handleAICorrelation} disabled={aiLoading || issues.filter(i => i.status !== 'Closed').length === 0}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 disabled:opacity-50">
            <Link2 className="w-3.5 h-3.5" /> Find Related
          </button>
          <button onClick={() => { resetForm(); setViewMode('create'); }} disabled={issueLimitReached}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            <Plus className="w-3.5 h-3.5" /> New Issue
          </button>
        </div>
      </div>

      {issueLimitReached && <TierLimitBanner message={getUpgradeMessage(plan, 'maxIssues', issues.length)} />}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search issues..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="All">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="All">All Priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="All">All Types</option>
          {ISSUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Issue list */}
      <div className="space-y-2">
        {filteredIssues.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No issues found</p>
          </div>
        )}
        {filteredIssues.map(issue => (
          <div key={issue.id} className="bg-white rounded-xl border p-4 hover:border-blue-200 transition">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => handleViewDetail(issue)}>
                <div className="flex items-center gap-2">
                  {STATUS_ICONS[issue.status]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">{issue.title}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[issue.priority]}`}>
                      {issue.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <span>{issue.issueType}</span>
                    <span>·</span>
                    <span>{issue.assignedTo?.name || 'Unassigned'}</span>
                    {issue.dueDate && (
                      <>
                        <span>·</span>
                        <span>Due: {new Date(issue.dueDate).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[issue.status]}`}>
                  {issue.status.replace('_', ' ')}
                </span>
                <button onClick={() => handleAIRootCause(issue)} disabled={aiLoading}
                  className="p-1.5 rounded hover:bg-purple-50 text-purple-600 disabled:opacity-50" title="AI Root Cause">
                  <Brain className="w-4 h-4" />
                </button>
                <button onClick={() => handleAIRemediation(issue)} disabled={aiLoading}
                  className="p-1.5 rounded hover:bg-green-50 text-green-600 disabled:opacity-50" title="AI Remediation">
                  <Zap className="w-4 h-4" />
                </button>
                <button onClick={() => handleEditIssue(issue)} className="p-1.5 rounded hover:bg-gray-100 text-gray-600" title="Edit">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDeleteIssue(issue.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600" title="Delete">
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
    if (!selectedIssue) return null;
    const issue = selectedIssue;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setViewMode('list')} className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" /> Back to List
          </button>
          <div className="flex gap-2">
            <button onClick={() => handleAIRootCause(issue)} disabled={aiLoading}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 disabled:opacity-50">
              <Brain className="w-3.5 h-3.5" /> AI Root Cause
            </button>
            <button onClick={() => handleAIRemediation(issue)} disabled={aiLoading}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50">
              <Zap className="w-3.5 h-3.5" /> AI Remediation
            </button>
            <button onClick={() => handleEditIssue(issue)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </button>
          </div>
        </div>

        {/* Issue header */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {STATUS_ICONS[issue.status]}
                <h2 className="text-xl font-bold text-gray-900">{issue.title}</h2>
                <span className={`text-xs px-2.5 py-1 rounded-full border ${PRIORITY_COLORS[issue.priority]}`}>
                  {issue.priority}
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-full border ${STATUS_COLORS[issue.status]}`}>
                  {issue.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>Type: {issue.issueType}</span>
                {issue.category && <span>Category: {issue.category}</span>}
                <span>Created: {new Date(issue.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="prose prose-sm max-w-none text-gray-700 mb-4">
            <p>{issue.description}</p>
          </div>

          {/* Meta info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <p className="text-xs text-gray-500">Assigned To</p>
              <p className="text-sm font-medium text-gray-900">{issue.assignedTo?.name || 'Unassigned'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Created By</p>
              <p className="text-sm font-medium text-gray-900">{issue.createdBy?.name || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Due Date</p>
              <p className="text-sm font-medium text-gray-900">
                {issue.dueDate ? new Date(issue.dueDate).toLocaleDateString() : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">SLA Status</p>
              <p className={`text-sm font-medium ${
                issue.slaStatus === 'Breached' ? 'text-red-600' :
                issue.slaStatus === 'At_Risk' ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {issue.slaStatus?.replace('_', ' ') || 'On Track'}
              </p>
            </div>
          </div>
        </div>

        {/* Status workflow */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Update Status</h3>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map(status => (
              <button
                key={status}
                onClick={() => handleStatusChange(issue.id, status)}
                disabled={issue.status === status}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  issue.status === status
                    ? 'bg-blue-600 text-white cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Assign */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Assign Issue</h3>
          <select
            value={issue.assignedToId || ''}
            onChange={(e) => handleAssign(issue.id, e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm w-full max-w-md"
          >
            <option value="">Unassigned</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
            ))}
          </select>
        </div>

        {/* Remediation plan */}
        {issue.remediationPlan && (
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Remediation Plan</h3>
            <div className="prose prose-sm max-w-none text-gray-700">
              <ReactMarkdown>{issue.remediationPlan}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Comments */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Comments ({issue.comments?.length || 0})
          </h3>

          {/* Add comment */}
          <div className="flex gap-2 mb-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 border rounded-lg px-3 py-2 text-sm resize-none"
              rows={2}
            />
            <button
              onClick={handleAddComment}
              disabled={isAddingComment || !newComment.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
            >
              {isAddingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Add
            </button>
          </div>

          {/* Comment list */}
          <div className="space-y-3">
            {(issue.comments || []).map(comment => (
              <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">{comment.author}</span>
                  <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-700">{comment.comment}</p>
              </div>
            ))}
            {(!issue.comments || issue.comments.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-4">No comments yet</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Create / Edit Form
  // ---------------------------------------------------------------------------
  const renderForm = (isEdit: boolean) => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => { setViewMode(isEdit ? 'detail' : 'list'); if (!isEdit) resetForm(); }}
          className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h2 className="text-xl font-bold text-gray-900">{isEdit ? 'Edit Issue' : 'Create Issue'}</h2>
      </div>

      <form onSubmit={isEdit ? handleUpdateIssue : handleCreateIssue} className="bg-white rounded-xl border p-6 space-y-4 max-w-3xl">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input type="text" required value={issueForm.title} onChange={e => setIssueForm(f => ({ ...f, title: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Brief description of the issue" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
          <textarea required value={issueForm.description} onChange={e => setIssueForm(f => ({ ...f, description: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm" rows={4} placeholder="Detailed description of the issue..." />
          {!isEdit && issueForm.description && (
            <button type="button" onClick={() => handleAIClassify(issueForm.description)}
              disabled={aiLoading}
              className="mt-2 flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800 disabled:opacity-50">
              <Brain className="w-3.5 h-3.5" /> AI Classify Issue
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Issue Type</label>
            <select value={issueForm.issueType} onChange={e => setIssueForm(f => ({ ...f, issueType: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm">
              {ISSUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select value={issueForm.category} onChange={e => setIssueForm(f => ({ ...f, category: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">Select category</option>
              {ISSUE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select value={issueForm.priority} onChange={e => setIssueForm(f => ({ ...f, priority: e.target.value as any }))}
              className="w-full border rounded-lg px-3 py-2 text-sm">
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
            <select value={issueForm.assignedToId} onChange={e => setIssueForm(f => ({ ...f, assignedToId: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">Unassigned</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input type="date" value={issueForm.dueDate} onChange={e => setIssueForm(f => ({ ...f, dueDate: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SLA Target</label>
            <input type="date" value={issueForm.slaTarget} onChange={e => setIssueForm(f => ({ ...f, slaTarget: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Remediation Plan</label>
          <textarea value={issueForm.remediationPlan} onChange={e => setIssueForm(f => ({ ...f, remediationPlan: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm" rows={4} placeholder="Steps to remediate this issue..." />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? 'Update Issue' : 'Create Issue'}
          </button>
          <button type="button" onClick={() => { setViewMode(isEdit ? 'detail' : 'list'); if (!isEdit) resetForm(); }}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Cancel</button>
        </div>
      </form>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: AI Classification
  // ---------------------------------------------------------------------------
  const renderAIClassify = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setViewMode('create')} className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back to Create
        </button>
        <Brain className="w-5 h-5 text-purple-600" />
        <h2 className="text-xl font-bold text-gray-900">AI Issue Classification</h2>
      </div>

      {aiLoading && (
        <div className="flex items-center justify-center py-16 bg-white rounded-xl border">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mr-3" />
          <span className="text-gray-600">AI is classifying the issue...</span>
        </div>
      )}

      {aiClassification && !aiLoading && (
        <>
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-purple-800">Classification Results</h3>
              <span className="text-sm text-purple-600">Confidence: {aiClassification.confidenceScore}%</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Suggested Severity</p>
                <span className={`text-sm px-2 py-0.5 rounded-full ${PRIORITY_COLORS[aiClassification.severity] || 'bg-gray-100'}`}>
                  {aiClassification.severity}
                </span>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Suggested Priority</p>
                <span className={`text-sm px-2 py-0.5 rounded-full ${PRIORITY_COLORS[aiClassification.suggestedPriority] || 'bg-gray-100'}`}>
                  {aiClassification.suggestedPriority}
                </span>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Category</p>
                <p className="text-sm font-medium">{aiClassification.category}</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Affected Frameworks</p>
                <div className="flex flex-wrap gap-1">
                  {(aiClassification.affectedFrameworks || []).map((fw, i) => (
                    <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{fw}</span>
                  ))}
                  {(!aiClassification.affectedFrameworks || aiClassification.affectedFrameworks.length === 0) && (
                    <span className="text-xs text-gray-500">None identified</span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Reasoning</p>
              <p className="text-sm text-gray-700">{aiClassification.reasoning}</p>
            </div>
          </div>

          <button onClick={applyAIClassification}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            <CheckCircle className="w-4 h-4" /> Apply Classification & Continue
          </button>
        </>
      )}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: AI Root Cause
  // ---------------------------------------------------------------------------
  const renderAIRootCause = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => { if (selectedIssue) handleViewDetail(selectedIssue); else setViewMode('list'); }}
          className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <Brain className="w-5 h-5 text-purple-600" />
        <h2 className="text-xl font-bold text-gray-900">AI Root Cause Analysis</h2>
      </div>

      {selectedIssue && (
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          {STATUS_ICONS[selectedIssue.status]}
          <div>
            <h3 className="font-semibold text-gray-900">{selectedIssue.title}</h3>
            <p className="text-xs text-gray-500">{selectedIssue.issueType} · {selectedIssue.priority}</p>
          </div>
        </div>
      )}

      {aiLoading && (
        <div className="flex items-center justify-center py-16 bg-white rounded-xl border">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mr-3" />
          <span className="text-gray-600">AI is analyzing root cause...</span>
        </div>
      )}

      {aiRootCause && !aiLoading && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-purple-800">Root Cause Analysis</h3>
            <span className="text-sm text-purple-600">Confidence: {aiRootCause.analysisConfidence}%</span>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Root Cause</h4>
              <p className="text-sm text-gray-900">{aiRootCause.rootCause}</p>
            </div>

            {aiRootCause.contributingFactors && aiRootCause.contributingFactors.length > 0 && (
              <div className="bg-white rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Contributing Factors</h4>
                <ul className="space-y-1">
                  {aiRootCause.contributingFactors.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-yellow-500 mt-0.5">·</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {aiRootCause.affectedControls && aiRootCause.affectedControls.length > 0 && (
              <div className="bg-white rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Affected Controls</h4>
                <div className="flex flex-wrap gap-2">
                  {aiRootCause.affectedControls.map((c, i) => (
                    <span key={i} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">{c}</span>
                  ))}
                </div>
              </div>
            )}

            {aiRootCause.recommendedFixes && aiRootCause.recommendedFixes.length > 0 && (
              <div className="bg-white rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Recommended Fixes</h4>
                <ul className="space-y-1">
                  {aiRootCause.recommendedFixes.map((fix, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> {fix}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: AI Remediation
  // ---------------------------------------------------------------------------
  const renderAIRemediation = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => { if (selectedIssue) handleViewDetail(selectedIssue); else setViewMode('list'); }}
          className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <Zap className="w-5 h-5 text-green-600" />
        <h2 className="text-xl font-bold text-gray-900">AI Remediation Plan</h2>
      </div>

      {selectedIssue && (
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          {STATUS_ICONS[selectedIssue.status]}
          <div>
            <h3 className="font-semibold text-gray-900">{selectedIssue.title}</h3>
            <p className="text-xs text-gray-500">{selectedIssue.issueType} · {selectedIssue.priority}</p>
          </div>
        </div>
      )}

      {aiLoading && (
        <div className="flex items-center justify-center py-16 bg-white rounded-xl border">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mr-3" />
          <span className="text-gray-600">AI is generating remediation plan...</span>
        </div>
      )}

      {aiRemediation && !aiLoading && (
        <>
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-green-800">Remediation Plan</h3>
              <span className="text-sm text-green-600">Total Effort: {aiRemediation.totalEstimatedEffort}</span>
            </div>

            {/* Steps */}
            <div className="space-y-3 mb-4">
              {(aiRemediation.steps || []).map((step, i) => (
                <div key={i} className="bg-white rounded-lg p-4 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{step.step}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span>Effort: {step.effort}</span>
                      <span className={`px-2 py-0.5 rounded-full ${
                        step.priority === 'High' ? 'bg-red-100 text-red-700' :
                        step.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>{step.priority}</span>
                    </div>
                    {step.dependencies && step.dependencies.length > 0 && (
                      <div className="mt-1">
                        <span className="text-xs text-gray-400">Dependencies: {step.dependencies.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Critical Path */}
            {aiRemediation.criticalPath && aiRemediation.criticalPath.length > 0 && (
              <div className="bg-white rounded-lg p-4 mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Critical Path</h4>
                <div className="flex items-center gap-2 flex-wrap">
                  {aiRemediation.criticalPath.map((item, i) => (
                    <React.Fragment key={i}>
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">{item}</span>
                      {i < aiRemediation.criticalPath.length - 1 && <span className="text-gray-400">→</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {/* Risks */}
            {aiRemediation.risks && aiRemediation.risks.length > 0 && (
              <div className="bg-white rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Potential Risks</h4>
                <ul className="space-y-1">
                  {aiRemediation.risks.map((risk, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" /> {risk}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Apply to issue */}
          {selectedIssue && (
            <button
              onClick={async () => {
                const planText = (aiRemediation.steps || []).map((s, i) => `${i + 1}. ${s.step} (${s.effort}, ${s.priority})`).join('\n');
                await api.enterprise.issues.update(selectedIssue.id, { remediationPlan: planText });
                const updated = await api.enterprise.issues.getById(selectedIssue.id);
                setSelectedIssue(updated);
                setViewMode('detail');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4" /> Apply Plan to Issue
            </button>
          )}
        </>
      )}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: AI Correlation
  // ---------------------------------------------------------------------------
  const renderAICorrelation = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setViewMode('dashboard')} className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <Link2 className="w-5 h-5 text-purple-600" />
        <h2 className="text-xl font-bold text-gray-900">AI Issue Correlation</h2>
      </div>

      {aiLoading && (
        <div className="flex items-center justify-center py-16 bg-white rounded-xl border">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mr-3" />
          <span className="text-gray-600">AI is analyzing issue correlations...</span>
        </div>
      )}

      {aiCorrelation && !aiLoading && (
        <>
          {/* Summary */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
            <h3 className="font-semibold text-purple-800 mb-2">Analysis Summary</h3>
            <p className="text-sm text-purple-700">{aiCorrelation.summary}</p>
          </div>

          {/* Patterns */}
          {aiCorrelation.patterns && aiCorrelation.patterns.length > 0 && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Identified Patterns</h3>
              <ul className="space-y-2">
                {aiCorrelation.patterns.map((pattern, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <Target className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" /> {pattern}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Systemic Fixes */}
          {aiCorrelation.systemicFixes && aiCorrelation.systemicFixes.length > 0 && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Systemic Fixes</h3>
              <ul className="space-y-2">
                {aiCorrelation.systemicFixes.map((fix, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> {fix}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Related Issues */}
          {aiCorrelation.relatedIssues && aiCorrelation.relatedIssues.length > 0 && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Related Issues</h3>
              <div className="space-y-2">
                {aiCorrelation.relatedIssues.map((rel, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900">{rel.title}</span>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                        {rel.similarity}% similar
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {(rel.commonFactors || []).map((f, j) => (
                        <span key={j} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{f}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
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
      {viewMode === 'ai-classify' && renderAIClassify()}
      {viewMode === 'ai-rootcause' && renderAIRootCause()}
      {viewMode === 'ai-remediation' && renderAIRemediation()}
      {viewMode === 'ai-correlation' && renderAICorrelation()}
    </div>
  );
}
