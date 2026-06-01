import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { logger } from '../../utils/logger';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Shield,
  FileText,
  TrendingUp,
  AlertCircle,
  Target,
  BarChart3,
  Calendar,
  ExternalLink,
  Download,
  RefreshCw,
  Loader2,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Bell,
  GitBranch,
  Layers,
  Activity,
  ArrowRight,
  Zap,
  Users,
  Play,
  Pause,
  CheckSquare,
  XCircle,
  Info,
  Eye,
  Edit3,
  MoreVertical,
  History,
  Sparkles,
  BookOpen,
  Link2,
  Hash,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Circle,
  Globe,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface RegulatoryChange {
  id: string;
  title: string;
  source: string;
  publishDate: string;
  effectiveDate: string;
  jurisdiction: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'in-review' | 'remediation' | 'completed' | 'dismissed';
  summary: string;
  affectedFrameworks: string[];
  affectedControls: number;
  affectedPolicies: number;
  affectedProcedures: number;
  complianceImpact: { before: number; after: number };
  assignedTo?: string;
  rifScore: number;
}

interface RemediationTask {
  id: string;
  changeId: string;
  changeName: string;
  title: string;
  description: string;
  type: 'control-update' | 'policy-revision' | 'procedure-change' | 'training' | 'evidence-collection' | 'notification';
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'review' | 'completed';
  assignee: string;
  dueDate: string;
  estimatedEffort: string;
  affectedItem: string;
  aiGenerated: boolean;
  completedDate?: string;
}

interface ImpactItem {
  id: string;
  name: string;
  type: 'control' | 'policy' | 'procedure';
  framework: string;
  currentStatus: string;
  impactLevel: 'direct' | 'indirect' | 'minimal';
  requiredAction: string;
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  details: string;
  changeId: string;
  type: 'detection' | 'analysis' | 'remediation' | 'notification' | 'completion';
}

// Static demo arrays removed; data is now fetched from the backend


// ─── Helper Components ──────────────────────────────────────────────────────────

const SeverityBadge: React.FC<{ severity: RegulatoryChange['severity'] }> = ({ severity }) => {
  const styles: Record<string, string> = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-blue-100 text-blue-700 border-blue-200',
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${styles[severity]}`}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    'pending': 'bg-gray-100 text-gray-700 border-gray-200',
    'in-review': 'bg-blue-100 text-blue-700 border-blue-200',
    'in-progress': 'bg-blue-100 text-blue-700 border-blue-200',
    'remediation': 'bg-purple-100 text-purple-700 border-purple-200',
    'review': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'completed': 'bg-green-100 text-green-700 border-green-200',
    'dismissed': 'bg-gray-100 text-gray-500 border-gray-200',
  };
  const labels: Record<string, string> = {
    'pending': 'Pending Review',
    'in-review': 'In Review',
    'in-progress': 'In Progress',
    'remediation': 'Remediation',
    'review': 'Under Review',
    'completed': 'Completed',
    'dismissed': 'Dismissed',
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${styles[status] || styles['pending']}`}>
      {labels[status] || status}
    </span>
  );
};

const TaskTypeBadge: React.FC<{ type: RemediationTask['type'] }> = ({ type }) => {
  const styles: Record<string, { bg: string; icon: React.ReactNode }> = {
    'control-update': { bg: 'bg-blue-100 text-blue-700', icon: <Shield size={10} /> },
    'policy-revision': { bg: 'bg-purple-100 text-purple-700', icon: <FileText size={10} /> },
    'procedure-change': { bg: 'bg-teal-100 text-teal-700', icon: <GitBranch size={10} /> },
    'training': { bg: 'bg-green-100 text-green-700', icon: <BookOpen size={10} /> },
    'evidence-collection': { bg: 'bg-orange-100 text-orange-700', icon: <CheckSquare size={10} /> },
    'notification': { bg: 'bg-yellow-100 text-yellow-700', icon: <Bell size={10} /> },
  };
  const labels: Record<string, string> = {
    'control-update': 'Control Update',
    'policy-revision': 'Policy Revision',
    'procedure-change': 'Procedure Change',
    'training': 'Training',
    'evidence-collection': 'Evidence Collection',
    'notification': 'Notification',
  };
  const style = styles[type] || { bg: 'bg-gray-100 text-gray-700', icon: <Circle size={10} /> };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${style.bg}`}>
      {style.icon}
      {labels[type] || type}
    </span>
  );
};

const ComplianceScoreProjection: React.FC<{ before: number; after: number }> = ({ before, after }) => {
  const diff = after - before;
  const color = diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-600';
  const Icon = diff > 0 ? ArrowUpRight : diff < 0 ? ArrowDownRight : Minus;
  return (
    <div className="flex items-center gap-3">
      <div className="text-center">
        <p className="text-xs text-gray-500">Before</p>
        <p className="text-lg font-bold text-gray-700">{before}%</p>
      </div>
      <div className={`flex items-center gap-1 ${color}`}>
        <Icon size={16} />
        <span className="text-sm font-bold">{Math.abs(diff)}%</span>
      </div>
      <div className="text-center">
        <p className="text-xs text-gray-500">Projected</p>
        <p className={`text-lg font-bold ${after >= 80 ? 'text-green-600' : after >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>{after}%</p>
      </div>
    </div>
  );
};

const RIFScoreBadge: React.FC<{ score: number }> = ({ score }) => {
  const color = score >= 80 ? 'bg-red-100 text-red-700' : score >= 60 ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700';
  return (
    <div className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>
      <Activity size={10} />
      RIF: {score}
    </div>
  );
};

const AuditLogIcon: React.FC<{ type: AuditLogEntry['type'] }> = ({ type }) => {
  switch (type) {
    case 'detection': return <Search size={14} className="text-blue-500" />;
    case 'analysis': return <Sparkles size={14} className="text-purple-500" />;
    case 'remediation': return <Zap size={14} className="text-orange-500" />;
    case 'notification': return <Bell size={14} className="text-yellow-500" />;
    case 'completion': return <CheckCircle2 size={14} className="text-green-500" />;
    default: return <Circle size={14} className="text-gray-400" />;
  }
};

// ─── Main Component ─────────────────────────────────────────────────────────────

export const RegulatoryAutoRemediation: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'remediation' | 'impact' | 'history'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedChange, setExpandedChange] = useState<string | null>(null);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [selectedChange, setSelectedChange] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [impactTypeFilter, setImpactTypeFilter] = useState<string>('all');
  const [logTypeFilter, setLogTypeFilter] = useState<string>('all');
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>('all');
  const [startedTasks, setStartedTasks] = useState<Set<string>>(new Set());
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [reassigningTaskId, setReassigningTaskId] = useState<string | null>(null);
  const [reassignValue, setReassignValue] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [taskActionId, setTaskActionId] = useState<string | null>(null);
  const [taskActionError, setTaskActionError] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name: string }>>([]);

  // Live API-backed dashboard data
  const [regulatoryChanges, setRegulatoryChanges] = useState<RegulatoryChange[]>([]);
  const [remediationTasks, setRemediationTasks] = useState<RemediationTask[]>([]);
  const [impactItems, setImpactItems] = useState<ImpactItem[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [lastScanAt, setLastScanAt] = useState<Date | null>(null);

  const loadDashboard = useCallback(async () => {
    setDataLoading(true);
    setDataError(null);
    try {
      const [chRes, tRes, iRes, lRes] = await Promise.all([
        api.regulatoryChanges.getDashboardChanges(),
        api.regulatoryChanges.getRemediationTasks(),
        api.regulatoryChanges.getImpactItems(),
        api.regulatoryChanges.getAuditLog(),
      ]);
      setRegulatoryChanges((chRes?.changes as RegulatoryChange[]) || []);
      setRemediationTasks((tRes?.tasks as RemediationTask[]) || []);
      setImpactItems((iRes?.items as ImpactItem[]) || []);
      setAuditLog((lRes?.entries as AuditLogEntry[]) || []);
      setLastScanAt(new Date());
    } catch (err: any) {
      logger.error('Failed to load regulatory dashboard data:', err);
      setDataError(err?.message || 'Failed to load regulatory data.');
      setRegulatoryChanges([]);
      setRemediationTasks([]);
      setImpactItems([]);
      setAuditLog([]);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  // Load assignable team members for the Reassign action (resolves name -> id)
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const members = await api.team.list();
        if (active && Array.isArray(members)) {
          setTeamMembers(members.map((m: any) => ({ id: m.id, name: m.name })));
        }
      } catch (err: any) {
        logger.warn('Failed to load team members for reassignment:', err);
      }
    })();
    return () => { active = false; };
  }, []);

  // Helper to get effective task status (accounting for locally started tasks)
  const getEffectiveTaskStatus = (task: RemediationTask) => {
    if (startedTasks.has(task.id) && task.status === 'pending') return 'in-progress';
    return task.status;
  };

  // Persist "Start Task": move the backing issue into the In Progress state.
  const handleStartTask = useCallback(async (task: RemediationTask) => {
    setTaskActionId(task.id);
    setTaskActionError(null);
    // Optimistically reflect the change while the request is in flight
    setStartedTasks(prev => {
      const next = new Set(prev);
      next.add(task.id);
      return next;
    });
    try {
      await api.enterprise.issues.updateStatus(task.id, 'In_Progress');
      await loadDashboard();
    } catch (err: any) {
      logger.error('Failed to start remediation task:', err);
      setTaskActionError(err?.message || 'Could not start this task. Please try again.');
      // Roll back the optimistic update so the UI matches the server
      setStartedTasks(prev => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    } finally {
      setTaskActionId(null);
    }
  }, [loadDashboard]);

  // Begin editing: seed the controlled inputs from the current task values.
  const handleBeginEdit = useCallback((task: RemediationTask) => {
    if (editingTaskId === task.id) {
      setEditingTaskId(null);
      return;
    }
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description);
    setTaskActionError(null);
  }, [editingTaskId]);

  // Persist edited title/description back to the backing issue.
  const handleSaveEdit = useCallback(async (task: RemediationTask) => {
    setTaskActionId(task.id);
    setTaskActionError(null);
    try {
      await api.enterprise.issues.update(task.id, {
        title: editTitle,
        description: editDescription,
      });
      setEditingTaskId(null);
      await loadDashboard();
    } catch (err: any) {
      logger.error('Failed to save task edits:', err);
      setTaskActionError(err?.message || 'Could not save changes. Please try again.');
    } finally {
      setTaskActionId(null);
    }
  }, [editTitle, editDescription, loadDashboard]);

  // Persist a reassignment: map the selected member to the issue assignee.
  const handleConfirmReassign = useCallback(async (task: RemediationTask) => {
    if (!reassignValue) {
      setTaskActionError('Select a team member to assign.');
      return;
    }
    setTaskActionId(task.id);
    setTaskActionError(null);
    try {
      await api.enterprise.issues.assign(task.id, reassignValue);
      setReassigningTaskId(null);
      setReassignValue('');
      await loadDashboard();
    } catch (err: any) {
      logger.error('Failed to reassign task:', err);
      setTaskActionError(err?.message || 'Could not reassign this task. Please try again.');
    } finally {
      setTaskActionId(null);
    }
  }, [reassignValue, loadDashboard]);

  // Summary stats
  const pendingCount = regulatoryChanges.filter(c => c.status === 'pending').length;
  const remediationCount = regulatoryChanges.filter(c => c.status === 'remediation' || c.status === 'in-review').length;
  const completedCount = regulatoryChanges.filter(c => c.status === 'completed').length;
  const totalTasks = remediationTasks.length;
  const completedTasks = remediationTasks.filter(t => t.status === 'completed').length;
  const criticalChanges = regulatoryChanges.filter(c => c.severity === 'critical' && c.status !== 'completed').length;

  // Distinct monitored sources / jurisdictions derived from the live change feed
  const monitoredSourceCount = new Set(
    regulatoryChanges.map(c => c.source).filter(Boolean)
  ).size;
  const jurisdictionCount = new Set(
    regulatoryChanges.map(c => c.jurisdiction).filter(Boolean)
  ).size;

  const filteredChanges = regulatoryChanges.filter(change => {
    if (searchQuery && !change.title.toLowerCase().includes(searchQuery.toLowerCase()) && !change.source.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (severityFilter !== 'all' && change.severity !== severityFilter) return false;
    if (statusFilter !== 'all' && change.status !== statusFilter) return false;
    return true;
  });

  const filteredTasks = remediationTasks.filter(task => {
    if (selectedChange && task.changeId !== selectedChange) return false;
    if (taskStatusFilter !== 'all' && task.status !== taskStatusFilter) return false;
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filteredImpactItems = impactItems.filter(item => {
    if (impactTypeFilter !== 'all' && item.type !== impactTypeFilter) return false;
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filteredLogs = auditLog.filter(log => {
    if (logTypeFilter !== 'all' && log.type !== logTypeFilter) return false;
    if (selectedChange && log.changeId !== selectedChange) return false;
    return true;
  });

  const [aiError, setAiError] = useState<string | null>(null);
  const [aiInsights, setAiInsights] = useState<{ summary: string; quickWins: string[]; timeline: string } | null>(null);

  const handleRunAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    setAiError(null);

    try {
      // Refresh live regulatory dashboard data first
      await loadDashboard();

      // Build gaps from current regulatory changes that need remediation
      const gaps = regulatoryChanges
        .filter(c => c.status === 'pending' || c.status === 'in-review' || c.status === 'remediation')
        .map(c => ({
          controlId: c.id,
          title: c.title,
          currentStatus: c.status,
          requirement: `${c.source} - ${c.summary} (Effective: ${c.effectiveDate})`,
        }));

      if (gaps.length === 0) {
        setAiError('No pending regulatory changes to analyze.');
        setIsAnalyzing(false);
        return;
      }

      const result = await api.ai.autoRemediation(
        'Multi-Framework',
        gaps,
        'Enterprise compliance organization with active SOC 2, GDPR, ISO 27001, and EU regulatory obligations'
      );

      setAiInsights({
        summary: result.summary || 'Analysis complete.',
        quickWins: result.quickWins || [],
        timeline: result.totalEstimatedTimeline || 'Unknown',
      });
    } catch (error: any) {
      logger.error('Auto-remediation analysis error:', error);
      setAiError(error?.message || 'Failed to run AI analysis. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [loadDashboard, regulatoryChanges]);

  const handleExport = useCallback(() => {
    const exportData = {
      regulatoryChanges: regulatoryChanges,
      remediationTasks: remediationTasks,
      impactItems: impactItems,
      auditLog: auditLog,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `regulatory-remediation-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const tabs = [
    { key: 'pending', label: 'Pending Changes', icon: <AlertCircle size={16} />, count: pendingCount },
    { key: 'remediation', label: 'Remediation Queue', icon: <Zap size={16} />, count: totalTasks - completedTasks },
    { key: 'impact', label: 'Impact Analysis', icon: <GitBranch size={16} />, count: impactItems.length },
    { key: 'history', label: 'History', icon: <History size={16} />, count: auditLog.length },
  ] as const;

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Regulatory Change Auto-Remediation</h2>
            <p className="text-sm text-gray-500 mt-0.5">AI-powered regulatory change detection, impact analysis, and remediation</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <RefreshCw size={16} />
                Scan for Changes
              </>
            )}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Data load status */}
      {dataLoading && (
        <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          <Loader2 size={16} className="animate-spin" />
          Loading regulatory change data...
        </div>
      )}
      {dataError && !dataLoading && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle size={16} />
          {dataError}
          <button onClick={() => void loadDashboard()} className="ml-auto text-xs underline">Retry</button>
        </div>
      )}
      {!dataLoading && !dataError && regulatoryChanges.length === 0 && (
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
          <Info size={16} />
          No regulatory changes detected for your organization. Once the regulatory monitoring engine identifies a change, it will appear here.
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Pending Review</span>
            <AlertCircle size={18} className="text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
          <p className="text-xs text-gray-400 mt-1">regulatory changes detected</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Critical Alerts</span>
            <AlertTriangle size={18} className="text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-600">{criticalChanges}</p>
          <p className="text-xs text-gray-400 mt-1">requiring immediate action</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Active Remediations</span>
            <Zap size={18} className="text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalTasks - completedTasks}</p>
          <p className="text-xs text-gray-400 mt-1">of {totalTasks} total tasks</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Completed</span>
            <CheckCircle2 size={18} className="text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-600">{completedCount}</p>
          <p className="text-xs text-gray-400 mt-1">changes fully remediated</p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-brand-600 text-brand-600 bg-brand-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeTab === 'pending' ? 'regulatory changes' : activeTab === 'remediation' ? 'tasks' : activeTab === 'impact' ? 'affected items' : 'audit log'}...`}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                showFilters ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Filter size={14} />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-200">
              {activeTab === 'pending' && (
                <>
                  <select
                    value={severityFilter}
                    onChange={e => setSeverityFilter(e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="all">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="in-review">In Review</option>
                    <option value="remediation">Remediation</option>
                    <option value="completed">Completed</option>
                  </select>
                </>
              )}
              {activeTab === 'remediation' && (
                <>
                  <select
                    value={taskStatusFilter}
                    onChange={e => setTaskStatusFilter(e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="review">Under Review</option>
                    <option value="completed">Completed</option>
                  </select>
                  <select
                    value={selectedChange || ''}
                    onChange={e => setSelectedChange(e.target.value || null)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">All Changes</option>
                    {regulatoryChanges.map(c => (
                      <option key={c.id} value={c.id}>{c.id}: {c.title.substring(0, 40)}...</option>
                    ))}
                  </select>
                </>
              )}
              {activeTab === 'impact' && (
                <select
                  value={impactTypeFilter}
                  onChange={e => setImpactTypeFilter(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="all">All Types</option>
                  <option value="control">Controls</option>
                  <option value="policy">Policies</option>
                  <option value="procedure">Procedures</option>
                </select>
              )}
              {activeTab === 'history' && (
                <select
                  value={logTypeFilter}
                  onChange={e => setLogTypeFilter(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="all">All Types</option>
                  <option value="detection">Detection</option>
                  <option value="analysis">Analysis</option>
                  <option value="remediation">Remediation</option>
                  <option value="notification">Notification</option>
                  <option value="completion">Completion</option>
                </select>
              )}
            </div>
          )}
        </div>

        {/* ─── Pending Changes Tab ──────────────────────────────── */}
        {activeTab === 'pending' && (
          <div className="p-4 space-y-3">
            {filteredChanges.length === 0 && (
              <div className="text-center py-12">
                <CheckCircle2 size={40} className="text-green-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700">No matching regulatory changes found</p>
                <p className="text-xs text-gray-500 mt-1">Try adjusting your filters or search query</p>
              </div>
            )}
            {filteredChanges.map(change => (
              <div
                key={change.id}
                className={`border rounded-xl overflow-hidden transition-colors ${
                  change.severity === 'critical' ? 'border-red-200 bg-red-50/30' :
                  change.severity === 'high' ? 'border-orange-200 bg-orange-50/20' :
                  'border-gray-200 bg-white'
                }`}
              >
                <button
                  onClick={() => setExpandedChange(expandedChange === change.id ? null : change.id)}
                  className="w-full text-left p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-xs font-mono text-gray-400">{change.id}</span>
                        <SeverityBadge severity={change.severity} />
                        <StatusBadge status={change.status} />
                        <RIFScoreBadge score={change.rifScore} />
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900">{change.title}</h4>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><FileText size={10} />{change.source}</span>
                        <span className="flex items-center gap-1"><Calendar size={10} />Published: {new Date(change.publishDate).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><Clock size={10} />Effective: {new Date(change.effectiveDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {expandedChange === change.id ? <ChevronUp size={16} className="text-gray-400 ml-2" /> : <ChevronDown size={16} className="text-gray-400 ml-2" />}
                  </div>
                </button>

                {expandedChange === change.id && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600 mt-3 leading-relaxed">{change.summary}</p>

                    {/* Impact Summary */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                      <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-gray-900">{change.affectedControls}</p>
                        <p className="text-xs text-gray-500">Controls Affected</p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-gray-900">{change.affectedPolicies}</p>
                        <p className="text-xs text-gray-500">Policies Affected</p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-gray-900">{change.affectedProcedures}</p>
                        <p className="text-xs text-gray-500">Procedures Affected</p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-3">
                        <ComplianceScoreProjection before={change.complianceImpact.before} after={change.complianceImpact.after} />
                      </div>
                    </div>

                    {/* Affected Frameworks */}
                    <div className="mt-3">
                      <p className="text-xs font-medium text-gray-500 mb-1.5">Affected Frameworks:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {change.affectedFrameworks.map(fw => (
                          <span key={fw} className="px-2 py-0.5 bg-brand-50 text-brand-700 text-xs font-medium rounded-full border border-brand-200">{fw}</span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => { setActiveTab('remediation'); setSelectedChange(change.id); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-700 transition-colors"
                      >
                        <Zap size={12} />
                        View Remediation Tasks
                      </button>
                      <button
                        onClick={() => { setActiveTab('impact'); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <GitBranch size={12} />
                        Impact Analysis
                      </button>
                      {change.assignedTo && (
                        <span className="text-xs text-gray-500 ml-auto flex items-center gap-1">
                          <Users size={12} />
                          Assigned to: <span className="font-medium">{change.assignedTo}</span>
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ─── Remediation Queue Tab ────────────────────────────── */}
        {activeTab === 'remediation' && (
          <div className="p-4 space-y-3">
            {selectedChange && (
              <div className="flex items-center gap-2 mb-2 p-2 bg-brand-50 rounded-lg border border-brand-200">
                <Filter size={14} className="text-brand-600" />
                <span className="text-xs text-brand-700 font-medium">
                  Filtered by: {regulatoryChanges.find(c => c.id === selectedChange)?.title.substring(0, 50)}...
                </span>
                <button onClick={() => setSelectedChange(null)} className="ml-auto text-brand-600 hover:text-brand-700">
                  <XCircle size={14} />
                </button>
              </div>
            )}

            {filteredTasks.length === 0 && (
              <div className="text-center py-12">
                <CheckCircle2 size={40} className="text-green-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700">No matching remediation tasks</p>
                <p className="text-xs text-gray-500 mt-1">All tasks are completed or filters are too restrictive</p>
              </div>
            )}

            {filteredTasks.map(task => (
              <div
                key={task.id}
                className={`border rounded-xl overflow-hidden transition-colors ${
                  task.status === 'completed' ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-white'
                }`}
              >
                <button
                  onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                  className="w-full text-left p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-xs font-mono text-gray-400">{task.id}</span>
                        <SeverityBadge severity={task.priority} />
                        <StatusBadge status={getEffectiveTaskStatus(task)} />
                        <TaskTypeBadge type={task.type} />
                        {task.aiGenerated && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 flex items-center gap-1">
                            <Sparkles size={10} />
                            AI Generated
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900">{task.title}</h4>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Hash size={10} />{task.changeName}</span>
                        <span className="flex items-center gap-1"><Users size={10} />{task.assignee}</span>
                        <span className="flex items-center gap-1"><Calendar size={10} />Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><Clock size={10} />{task.estimatedEffort}</span>
                      </div>
                    </div>
                    {expandedTask === task.id ? <ChevronUp size={16} className="text-gray-400 ml-2" /> : <ChevronDown size={16} className="text-gray-400 ml-2" />}
                  </div>
                </button>

                {expandedTask === task.id && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600 mt-3 leading-relaxed">{task.description}</p>
                    <div className="mt-3 p-2 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs font-medium text-gray-500">Affected Item:</p>
                      <p className="text-sm text-gray-700 font-medium mt-0.5">{task.affectedItem}</p>
                    </div>
                    {task.completedDate && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-green-600">
                        <CheckCircle2 size={12} />
                        Completed on {new Date(task.completedDate).toLocaleDateString()}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                      {getEffectiveTaskStatus(task) !== 'completed' && (
                        <>
                          <button
                            onClick={() => void handleStartTask(task)}
                            disabled={startedTasks.has(task.id) || task.status === 'in-progress' || taskActionId === task.id}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-60 ${
                              startedTasks.has(task.id) || task.status === 'in-progress'
                                ? 'bg-green-100 text-green-700 cursor-default'
                                : 'bg-brand-600 text-white hover:bg-brand-700'
                            }`}
                          >
                            {taskActionId === task.id && !startedTasks.has(task.id) ? (
                              <><Loader2 size={12} className="animate-spin" /> Starting...</>
                            ) : startedTasks.has(task.id) || task.status === 'in-progress' ? (
                              <><CheckCircle2 size={12} /> In Progress</>
                            ) : (
                              <><Play size={12} /> Start Task</>
                            )}
                          </button>
                          <button
                            onClick={() => handleBeginEdit(task)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs font-medium rounded-lg transition-colors ${
                              editingTaskId === task.id
                                ? 'border-brand-300 bg-brand-50 text-brand-700'
                                : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <Edit3 size={12} />
                            {editingTaskId === task.id ? 'Close' : 'Edit'}
                          </button>
                          <button
                            onClick={() => {
                              if (reassigningTaskId === task.id) {
                                setReassigningTaskId(null);
                                setReassignValue('');
                              } else {
                                setReassigningTaskId(task.id);
                                setReassignValue(task.assignee);
                              }
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs font-medium rounded-lg transition-colors ${
                              reassigningTaskId === task.id
                                ? 'border-brand-300 bg-brand-50 text-brand-700'
                                : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <Users size={12} />
                            {reassigningTaskId === task.id ? 'Cancel' : 'Reassign'}
                          </button>
                        </>
                      )}
                    </div>

                    {/* Edit mode inline UI */}
                    {editingTaskId === task.id && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs font-semibold text-blue-800 mb-2 flex items-center gap-1.5">
                          <Edit3 size={12} />
                          Edit Task Details
                        </p>
                        <div className="space-y-2">
                          <div>
                            <label className="text-xs text-blue-700 font-medium">Title</label>
                            <input
                              type="text"
                              value={editTitle}
                              onChange={e => setEditTitle(e.target.value)}
                              className="mt-0.5 w-full text-sm border border-blue-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-blue-700 font-medium">Description</label>
                            <textarea
                              value={editDescription}
                              onChange={e => setEditDescription(e.target.value)}
                              rows={2}
                              className="mt-0.5 w-full text-sm border border-blue-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                            />
                          </div>
                          <div className="flex justify-end">
                            <button
                              onClick={() => void handleSaveEdit(task)}
                              disabled={taskActionId === task.id || !editTitle.trim()}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white text-xs font-medium rounded-md hover:bg-brand-700 disabled:opacity-60 transition-colors"
                            >
                              {taskActionId === task.id ? <Loader2 size={12} className="animate-spin" /> : <CheckSquare size={12} />}
                              Save Changes
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Reassign inline UI */}
                    {reassigningTaskId === task.id && (
                      <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <p className="text-xs font-semibold text-orange-800 mb-2 flex items-center gap-1.5">
                          <Users size={12} />
                          Reassign Task
                        </p>
                        <div className="flex items-center gap-2">
                          <select
                            value={reassignValue}
                            onChange={e => setReassignValue(e.target.value)}
                            className="flex-1 text-sm border border-orange-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                          >
                            <option value="">Select a team member...</option>
                            {teamMembers.map(m => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => void handleConfirmReassign(task)}
                            disabled={taskActionId === task.id || !reassignValue}
                            className="flex items-center gap-1.5 px-3 py-1 bg-brand-600 text-white text-xs font-medium rounded-md hover:bg-brand-700 disabled:opacity-60 transition-colors"
                          >
                            {taskActionId === task.id ? <Loader2 size={12} className="animate-spin" /> : null}
                            Confirm
                          </button>
                        </div>
                        {teamMembers.length === 0 && (
                          <p className="text-xs text-orange-600 mt-1.5">No assignable team members are available.</p>
                        )}
                      </div>
                    )}

                    {/* Task action error */}
                    {taskActionError && (editingTaskId === task.id || reassigningTaskId === task.id || taskActionId === task.id) && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
                        <AlertCircle size={12} />
                        {taskActionError}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ─── Impact Analysis Tab ──────────────────────────────── */}
        {activeTab === 'impact' && (
          <div className="p-4 space-y-4">
            {/* Impact Blast Radius Visualization */}
            <div className="bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Target size={16} className="text-orange-600" />
                Impact Blast Radius
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto rounded-full bg-red-100 border-4 border-red-300 flex items-center justify-center mb-2">
                    <div>
                      <p className="text-xl font-bold text-red-700">{impactItems.filter(i => i.impactLevel === 'direct').length}</p>
                      <p className="text-xs text-red-600 -mt-0.5">Direct</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 font-medium">Immediate changes required</p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto rounded-full bg-orange-100 border-4 border-orange-300 flex items-center justify-center mb-2">
                    <div>
                      <p className="text-xl font-bold text-orange-700">{impactItems.filter(i => i.impactLevel === 'indirect').length}</p>
                      <p className="text-xs text-orange-600 -mt-0.5">Indirect</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 font-medium">Review and potential updates</p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto rounded-full bg-yellow-100 border-4 border-yellow-300 flex items-center justify-center mb-2">
                    <div>
                      <p className="text-xl font-bold text-yellow-700">{impactItems.filter(i => i.impactLevel === 'minimal').length}</p>
                      <p className="text-xs text-yellow-600 -mt-0.5">Minimal</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 font-medium">Low or no changes expected</p>
                </div>
              </div>
            </div>

            {/* Before/After Score Projections */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp size={16} className="text-brand-600" />
                Compliance Score Projections (Before/After Remediation)
              </h4>
              <div className="space-y-3">
                {regulatoryChanges.filter(c => c.status !== 'completed').map(change => (
                  <div key={change.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="text-sm font-medium text-gray-900 truncate">{change.title.substring(0, 50)}...</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <SeverityBadge severity={change.severity} />
                        <span className="text-xs text-gray-400">{change.id}</span>
                      </div>
                    </div>
                    <ComplianceScoreProjection before={change.complianceImpact.before} after={change.complianceImpact.after} />
                  </div>
                ))}
              </div>
            </div>

            {/* Affected Items */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Layers size={16} className="text-brand-600" />
                  Affected Controls, Policies & Procedures ({filteredImpactItems.length})
                </h4>
              </div>
              <div className="divide-y divide-gray-100">
                {filteredImpactItems.map(item => (
                  <div key={item.id} className="p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                            item.type === 'control' ? 'bg-blue-100 text-blue-700' :
                            item.type === 'policy' ? 'bg-purple-100 text-purple-700' :
                            'bg-teal-100 text-teal-700'
                          }`}>
                            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                          </span>
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                            item.impactLevel === 'direct' ? 'bg-red-100 text-red-700' :
                            item.impactLevel === 'indirect' ? 'bg-orange-100 text-orange-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {item.impactLevel.charAt(0).toUpperCase() + item.impactLevel.slice(1)} Impact
                          </span>
                          <span className="text-xs text-gray-400">{item.framework}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.requiredAction}</p>
                      </div>
                      <div className="ml-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          item.currentStatus === 'Implemented' ? 'bg-green-100 text-green-700' :
                          item.currentStatus === 'Approved' ? 'bg-blue-100 text-blue-700' :
                          item.currentStatus === 'Partially Implemented' ? 'bg-yellow-100 text-yellow-700' :
                          item.currentStatus === 'Draft' ? 'bg-gray-100 text-gray-600' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {item.currentStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── History Tab ──────────────────────────────────────── */}
        {activeTab === 'history' && (
          <div className="p-4">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[17px] top-0 bottom-0 w-0.5 bg-gray-200" />

              <div className="space-y-4">
                {filteredLogs.map(log => (
                  <div key={log.id} className="relative flex items-start gap-3 pl-0">
                    {/* Timeline dot */}
                    <div className="relative z-10 w-9 h-9 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center flex-shrink-0">
                      <AuditLogIcon type={log.type} />
                    </div>
                    <div className="flex-1 min-w-0 pb-2">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-gray-900">{log.action}</span>
                        <span className="text-xs text-gray-400 font-mono">{log.changeId}</span>
                      </div>
                      <p className="text-sm text-gray-600">{log.details}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Users size={10} />{log.actor}</span>
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {filteredLogs.length === 0 && (
              <div className="text-center py-12">
                <History size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700">No audit log entries found</p>
                <p className="text-xs text-gray-500 mt-1">Try adjusting your filters</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIF Integration Note */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0">
            <Activity size={16} className="text-white" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-purple-900">Regulatory Intelligence Fabric (RIF) Active</h4>
            <p className="text-xs text-purple-700 mt-0.5">
              Monitoring {monitoredSourceCount} regulatory {monitoredSourceCount === 1 ? 'source' : 'sources'} across {jurisdictionCount} {jurisdictionCount === 1 ? 'jurisdiction' : 'jurisdictions'}.
              {lastScanAt ? ` Last scan: ${lastScanAt.toLocaleString()}.` : ''}
              {' '}RIF scores reflect the urgency and relevance of each change to your compliance posture.
            </p>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-xs text-purple-600 flex items-center gap-1"><CheckCircle2 size={10} />{monitoredSourceCount} sources active</span>
              <span className="text-xs text-purple-600 flex items-center gap-1"><Globe size={10} />{jurisdictionCount} {jurisdictionCount === 1 ? 'jurisdiction' : 'jurisdictions'}</span>
              <span className="text-xs text-purple-600 flex items-center gap-1"><RefreshCw size={10} />Real-time scanning</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
