import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useI18n } from '../contexts/I18nContext';
import {
  ArrowLeft, Plus, Search, Filter, X, Play, Pause, Copy, Trash2, Edit3,
  Eye, Clock, CheckCircle, XCircle, AlertTriangle, Zap, GitBranch, Bell,
  Calendar, ChevronDown, ChevronRight, BarChart3, Settings, Workflow,
  ArrowDown, Shield, Users, Star, Download, RefreshCw, Activity,
  Timer, FileText, Lock, UserCheck, LayoutGrid, List, Loader2
} from 'lucide-react';
import { api } from '../services/api';

// ── Types ──────────────────────────────────────────────────────────────

type TabKey = 'workflows' | 'templates' | 'builder' | 'runs' | 'rules';

type TriggerType = 'Manual' | 'Schedule' | 'Event' | 'Webhook';
type WorkflowStatus = 'Active' | 'Draft' | 'Paused' | 'Error';
type TemplateCategory = 'Risk' | 'Compliance' | 'Audit' | 'Incident' | 'Privacy' | 'Onboarding';
type NodeType = 'Trigger' | 'Action' | 'Condition' | 'Notification' | 'Approval' | 'Wait';
type RunStatus = 'Completed' | 'Running' | 'Failed' | 'Cancelled';
type RuleStatus = 'Active' | 'Inactive';

interface WorkflowItem {
  id: string;
  name: string;
  description: string;
  triggerType: TriggerType;
  status: WorkflowStatus;
  lastRun: string;
  nextRun: string;
  successRate: number;
  nodeCount: number;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  stepsCount: number;
  popularity: number;
}

interface WorkflowNode {
  id: string;
  step: number;
  type: NodeType;
  title: string;
  configSummary: string;
}

interface WorkflowRun {
  id: string;
  fullId: string;
  workflowName: string;
  triggeredBy: string;
  startedAt: string;
  duration: string;
  status: RunStatus;
  stepsCompleted: number;
  stepsTotal: number;
}

// A single step rendered in the run-detail modal, derived from the run's own
// workflow definition and the run's recorded completedNodes / nodeResults.
interface RunStepDetail {
  id: string;
  step: number;
  type: NodeType;
  title: string;
  configSummary: string;
  state: 'done' | 'failed' | 'running' | 'pending';
}

interface AutomationRule {
  id: string;
  name: string;
  triggerEvent: string;
  conditions: string;
  actions: string;
  status: RuleStatus;
  lastTriggered: string;
  triggerCount: number;
}

// ── API data mapping helpers ─────────────────────────────────────────

function mapApiWorkflow(w: any): WorkflowItem {
  const trigger = (w.trigger as any) || {};
  const triggerMap: Record<string, TriggerType> = { manual: 'Manual', schedule: 'Schedule', event: 'Event', webhook: 'Webhook' };
  const nodes = Array.isArray(w.nodes) ? w.nodes : [];
  const execCount = w._count?.executions ?? w.runCount ?? 0;
  return {
    id: w.id,
    name: w.name,
    description: w.description || '',
    triggerType: triggerMap[trigger.type] || 'Manual',
    status: (w.status as WorkflowStatus) || 'Draft',
    lastRun: w.lastRunAt ? new Date(w.lastRunAt).toLocaleString() : 'Never',
    nextRun: trigger.type === 'schedule' ? (w.nextRunAt ? new Date(w.nextRunAt).toLocaleString() : 'Scheduled') : trigger.type === 'event' ? 'On event' : trigger.type === 'webhook' ? 'On webhook' : 'N/A',
    successRate: execCount > 0 ? Math.round((w.successCount ?? execCount) / execCount * 100) : 0,
    nodeCount: nodes.length,
  };
}

function mapApiRun(r: any): WorkflowRun {
  const completed = Array.isArray(r.completedNodes) ? r.completedNodes.length : 0;
  const total = r.workflow?.nodes ? (Array.isArray(r.workflow.nodes) ? r.workflow.nodes.length : 0) : completed;
  const durationMs = r.completedAt && r.startedAt ? new Date(r.completedAt).getTime() - new Date(r.startedAt).getTime() : 0;
  const durationStr = durationMs > 0 ? `${Math.floor(durationMs / 60000)}m ${Math.floor((durationMs % 60000) / 1000)}s` : '—';
  return {
    id: r.id.substring(0, 8).toUpperCase(),
    fullId: r.id,
    workflowName: r.workflow?.name || 'Unknown',
    triggeredBy: r.triggerType === 'manual' ? 'Manual' : r.triggerType || 'System',
    startedAt: r.startedAt ? new Date(r.startedAt).toLocaleString() : '—',
    duration: durationStr,
    status: (r.status as RunStatus) || 'Running',
    stepsCompleted: completed,
    stepsTotal: total || completed,
  };
}

// Normalize a stored node-type string (e.g. 'trigger', 'Action') to a NodeType.
function normalizeNodeType(raw: any): NodeType {
  const map: Record<string, NodeType> = {
    trigger: 'Trigger', action: 'Action', condition: 'Condition',
    notification: 'Notification', approval: 'Approval', wait: 'Wait',
  };
  const key = String(raw ?? '').toLowerCase();
  return map[key] || 'Action';
}

// Build the run-detail step list from the run's own workflow node definition plus
// the run record's completedNodes / nodeResults / status. Falls back to the run's
// step counts when the workflow definition has no usable nodes.
function buildRunSteps(run: any): RunStepDetail[] {
  const wfNodes = Array.isArray(run?.workflow?.nodes) ? run.workflow.nodes : [];
  const completedIds: string[] = Array.isArray(run?.completedNodes)
    ? run.completedNodes.map((n: any) => (typeof n === 'string' ? n : n?.id)).filter(Boolean)
    : [];
  const nodeResults: Record<string, any> = run?.nodeResults && typeof run.nodeResults === 'object' ? run.nodeResults : {};
  const status: RunStatus = (run?.status as RunStatus) || 'Running';

  if (wfNodes.length > 0) {
    return wfNodes.map((n: any, idx: number): RunStepDetail => {
      const nodeId = n.id || `node-${idx}`;
      const result = nodeResults[nodeId];
      const isDone = completedIds.includes(nodeId) || result?.status === 'success' || result?.status === 'completed';
      const isFailed = result?.status === 'failed' || result?.status === 'error';
      const isCurrent = !isDone && !isFailed && status === 'Running' && idx === completedIds.length;
      let state: RunStepDetail['state'] = 'pending';
      if (isFailed) state = 'failed';
      else if (isDone) state = 'done';
      else if (isCurrent) state = 'running';
      return {
        id: nodeId,
        step: idx + 1,
        type: normalizeNodeType(n.type),
        title: n.title || n.label || `Step ${idx + 1}`,
        configSummary: n.config?.summary || n.configSummary || n.description || '—',
        state,
      };
    });
  }

  // No node definition available: synthesize steps from the run's progress counts.
  const total = Math.max(completedIds.length, run?.stepsTotal || 0);
  return Array.from({ length: total }, (_, idx): RunStepDetail => {
    const isDone = idx < completedIds.length;
    const isFailed = status === 'Failed' && idx === completedIds.length;
    const isCurrent = status === 'Running' && idx === completedIds.length;
    let state: RunStepDetail['state'] = 'pending';
    if (isFailed) state = 'failed';
    else if (isDone) state = 'done';
    else if (isCurrent) state = 'running';
    return { id: `step-${idx}`, step: idx + 1, type: 'Action', title: `Step ${idx + 1}`, configSummary: '—', state };
  });
}

function mapApiRule(r: any): AutomationRule {
  const trigger = (r.trigger as any) || {};
  const nodes = Array.isArray(r.nodes) ? r.nodes : [];
  const conditions = nodes.filter((n: any) => n.type === 'condition').map((n: any) => n.label || n.title || '').join(', ');
  const actions = nodes.filter((n: any) => n.type !== 'condition').map((n: any) => n.label || n.title || '').join(', ');
  return {
    id: r.id,
    name: r.name,
    triggerEvent: trigger.config?.event || 'Custom event',
    conditions: conditions || 'No conditions configured',
    actions: actions || 'No actions configured',
    status: r.status === 'Active' ? 'Active' : 'Inactive',
    lastTriggered: r.lastRunAt ? new Date(r.lastRunAt).toLocaleString() : 'Never',
    triggerCount: r.runCount ?? 0,
  };
}

function mapApiTemplate(tpl: any): WorkflowTemplate {
  return {
    id: tpl.id,
    name: tpl.name,
    category: (tpl.category as TemplateCategory) || 'Compliance',
    description: tpl.description || '',
    stepsCount: tpl.steps ?? tpl.stepsCount ?? 0,
    popularity: tpl.popularity ?? 0,
  };
}

// ── Helper Functions ───────────────────────────────────────────────────

const statusBadge = (status: WorkflowStatus) => {
  switch (status) {
    case 'Active': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'Draft': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    case 'Paused': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'Error': return 'bg-red-500/20 text-red-400 border-red-500/30';
  }
};

const triggerBadge = (trigger: TriggerType) => {
  switch (trigger) {
    case 'Manual': return 'bg-blue-500/20 text-blue-400';
    case 'Schedule': return 'bg-purple-500/20 text-purple-400';
    case 'Event': return 'bg-cyan-500/20 text-cyan-400';
    case 'Webhook': return 'bg-orange-500/20 text-orange-400';
  }
};

const runStatusBadge = (status: RunStatus) => {
  switch (status) {
    case 'Completed': return 'bg-emerald-500/20 text-emerald-400';
    case 'Running': return 'bg-blue-500/20 text-blue-400';
    case 'Failed': return 'bg-red-500/20 text-red-400';
    case 'Cancelled': return 'bg-slate-500/20 text-slate-400';
  }
};

const runStatusIcon = (status: RunStatus) => {
  switch (status) {
    case 'Completed': return <CheckCircle size={14} />;
    case 'Running': return <RefreshCw size={14} className="animate-spin" />;
    case 'Failed': return <XCircle size={14} />;
    case 'Cancelled': return <X size={14} />;
  }
};

const nodeTypeColor = (type: NodeType) => {
  switch (type) {
    case 'Trigger': return 'border-green-500 bg-green-500/10';
    case 'Action': return 'border-blue-500 bg-blue-500/10';
    case 'Condition': return 'border-amber-500 bg-amber-500/10';
    case 'Notification': return 'border-purple-500 bg-purple-500/10';
    case 'Approval': return 'border-cyan-500 bg-cyan-500/10';
    case 'Wait': return 'border-orange-500 bg-orange-500/10';
  }
};

const nodeTypeIcon = (type: NodeType) => {
  switch (type) {
    case 'Trigger': return <Zap size={16} className="text-green-400" />;
    case 'Action': return <Play size={16} className="text-blue-400" />;
    case 'Condition': return <GitBranch size={16} className="text-amber-400" />;
    case 'Notification': return <Bell size={16} className="text-purple-400" />;
    case 'Approval': return <UserCheck size={16} className="text-cyan-400" />;
    case 'Wait': return <Timer size={16} className="text-orange-400" />;
  }
};

const categoryColor = (cat: TemplateCategory) => {
  switch (cat) {
    case 'Risk': return 'bg-red-500/20 text-red-400';
    case 'Compliance': return 'bg-blue-500/20 text-blue-400';
    case 'Audit': return 'bg-purple-500/20 text-purple-400';
    case 'Incident': return 'bg-orange-500/20 text-orange-400';
    case 'Privacy': return 'bg-emerald-500/20 text-emerald-400';
    case 'Onboarding': return 'bg-cyan-500/20 text-cyan-400';
  }
};

const NODE_PALETTE: { type: NodeType; label: string }[] = [
  { type: 'Trigger', label: 'Trigger' },
  { type: 'Action', label: 'Action' },
  { type: 'Condition', label: 'Condition' },
  { type: 'Notification', label: 'Notification' },
  { type: 'Approval', label: 'Approval' },
  { type: 'Wait', label: 'Wait' },
];

// ── Component ──────────────────────────────────────────────────────────

export const WorkflowBuilder: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabKey>('workflows');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRun, setSelectedRun] = useState<WorkflowRun | null>(null);
  // The selected run's own executed steps, fetched from the backend run record.
  const [runSteps, setRunSteps] = useState<RunStepDetail[]>([]);
  const [runDetailLoading, setRunDetailLoading] = useState(false);
  const [runDetailError, setRunDetailError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Create workflow form state
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTrigger, setNewTrigger] = useState<TriggerType>('Manual');

  // API-loaded data
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [builderNodes, setBuilderNodes] = useState<WorkflowNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadWorkflows = useCallback(async () => {
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : undefined;
      const res = await api.workflows.list(params);
      setWorkflows((res.workflows || []).map(mapApiWorkflow));
    } catch (e: any) { setError(e?.message || 'Failed to load workflows'); }
  }, [statusFilter]);

  const loadTemplates = useCallback(async () => {
    try {
      const res = await api.workflows.listTemplates();
      setTemplates(Array.isArray(res) ? res.map(mapApiTemplate) : []);
    } catch (e: any) { setError(e?.message || 'Failed to load templates'); }
  }, []);

  const loadRuns = useCallback(async () => {
    try {
      const res = await api.workflows.listRuns();
      setRuns((res.runs || []).map(mapApiRun));
    } catch (e: any) { setError(e?.message || 'Failed to load runs'); }
  }, []);

  const loadRules = useCallback(async () => {
    try {
      const res = await api.workflows.listRules();
      setRules((res.rules || []).map(mapApiRule));
    } catch (e: any) { setError(e?.message || 'Failed to load rules'); }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([loadWorkflows(), loadTemplates(), loadRuns(), loadRules()]);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load workflow data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [loadWorkflows, loadTemplates, loadRuns, loadRules]);

  // When a run is selected, fetch its own execution record so the detail modal
  // renders the run's actual executed steps (not the in-memory builder canvas).
  useEffect(() => {
    if (!selectedRun) { setRunSteps([]); setRunDetailError(null); return; }
    let cancelled = false;
    setRunDetailLoading(true);
    setRunDetailError(null);
    (async () => {
      try {
        const run = await api.workflows.getRun(selectedRun.fullId);
        if (!cancelled) setRunSteps(buildRunSteps(run));
      } catch (e: any) {
        if (!cancelled) setRunDetailError(e?.message || 'Failed to load run details');
      } finally {
        if (!cancelled) setRunDetailLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedRun]);

  const handleCreateWorkflow = async () => {
    if (!newName.trim()) return;
    setActionLoading('create');
    try {
      const triggerMap: Record<TriggerType, string> = { Manual: 'manual', Schedule: 'schedule', Event: 'event', Webhook: 'webhook' };
      await api.workflows.create({ name: newName, description: newDescription, trigger: { type: triggerMap[newTrigger], config: {} } });
      setShowCreateModal(false);
      setNewName(''); setNewDescription(''); setNewTrigger('Manual');
      await loadWorkflows();
    } catch (e: any) {
      setError(e?.message || 'Failed to create workflow');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteWorkflow = async (id: string) => {
    setActionLoading(id);
    try {
      await api.workflows.delete(id);
      await loadWorkflows();
    } catch (e: any) {
      setError(e?.message || 'Failed to delete workflow');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDuplicateWorkflow = async (id: string) => {
    setActionLoading(id);
    try {
      await api.workflows.duplicate(id);
      await loadWorkflows();
    } catch (e: any) {
      setError(e?.message || 'Failed to duplicate workflow');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRunWorkflow = async (id: string) => {
    setActionLoading(id);
    try {
      await api.workflows.run(id);
      await Promise.all([loadWorkflows(), loadRuns()]);
    } catch (e: any) {
      setError(e?.message || 'Failed to run workflow');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUseTemplate = async (id: string) => {
    setActionLoading(id);
    try {
      await api.workflows.useTemplate(id);
      await loadWorkflows();
      setActiveTab('workflows');
    } catch (e: any) {
      setError(e?.message || 'Failed to use template');
    } finally {
      setActionLoading(null);
    }
  };

  const [showNodeModal, setShowNodeModal] = useState(false);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const [editingWorkflowName, setEditingWorkflowName] = useState('New Workflow');
  const [builderWorkflowId, setBuilderWorkflowId] = useState<string | null>(null);
  const [builderPreview, setBuilderPreview] = useState(false);

  // Automation Rules editor state
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [ruleForm, setRuleForm] = useState<{ name: string; triggerEvent: string; status: RuleStatus }>({ name: '', triggerEvent: '', status: 'Active' });

  // Persist the visual builder canvas as a workflow (create on first save, update thereafter).
  const handleSaveBuilder = async () => {
    setActionLoading('builder-save');
    setError(null);
    try {
      const payload = {
        name: editingWorkflowName.trim() || 'Untitled Workflow',
        nodes: builderNodes.map(n => ({ type: n.type.toLowerCase(), title: n.title, config: { summary: n.configSummary }, step: n.step })),
      };
      if (builderWorkflowId) {
        await api.workflows.update(builderWorkflowId, payload);
      } else {
        const created = await api.workflows.create(payload);
        if (created?.id) setBuilderWorkflowId(created.id);
      }
      await loadWorkflows();
    } catch (e: any) {
      setError(e?.message || 'Failed to save workflow');
    } finally {
      setActionLoading(null);
    }
  };

  // Save the canvas (if needed) then trigger an execution run for it.
  const handleTestRunBuilder = async () => {
    if (builderNodes.length === 0) { setError('Add at least one node before running.'); return; }
    setActionLoading('builder-run');
    setError(null);
    try {
      let id = builderWorkflowId;
      const payload = {
        name: editingWorkflowName.trim() || 'Untitled Workflow',
        nodes: builderNodes.map(n => ({ type: n.type.toLowerCase(), title: n.title, config: { summary: n.configSummary }, step: n.step })),
      };
      if (id) {
        await api.workflows.update(id, payload);
      } else {
        const created = await api.workflows.create(payload);
        id = created?.id || null;
        if (id) setBuilderWorkflowId(id);
      }
      if (!id) throw new Error('Workflow could not be created for test run.');
      await api.workflows.run(id);
      await Promise.all([loadWorkflows(), loadRuns()]);
    } catch (e: any) {
      setError(e?.message || 'Failed to test-run workflow');
    } finally {
      setActionLoading(null);
    }
  };

  const openCreateRule = () => {
    setEditingRule(null);
    setRuleForm({ name: '', triggerEvent: '', status: 'Active' });
    setShowRuleModal(true);
  };

  const openEditRule = (rule: AutomationRule) => {
    setEditingRule(rule);
    setRuleForm({ name: rule.name, triggerEvent: rule.triggerEvent, status: rule.status });
    setShowRuleModal(true);
  };

  const handleSaveRule = async () => {
    if (!ruleForm.name.trim()) return;
    setActionLoading('rule-save');
    setError(null);
    try {
      const payload = {
        name: ruleForm.name.trim(),
        status: ruleForm.status,
        trigger: { type: 'event', config: { event: ruleForm.triggerEvent.trim() || 'Custom event' } },
      };
      if (editingRule) {
        await api.workflows.updateRule(editingRule.id, payload);
      } else {
        await api.workflows.createRule(payload);
      }
      setShowRuleModal(false);
      setEditingRule(null);
      await loadRules();
    } catch (e: any) {
      setError(e?.message || 'Failed to save rule');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteRule = async (id: string) => {
    setActionLoading(id);
    setError(null);
    try {
      await api.workflows.deleteRule(id);
      await loadRules();
    } catch (e: any) {
      setError(e?.message || 'Failed to delete rule');
    } finally {
      setActionLoading(null);
    }
  };

  const addNode = (type: NodeType, atIndex?: number) => {
    const defaultTitles: Record<NodeType, string> = {
      Trigger: 'New Trigger', Action: 'New Action', Condition: 'New Condition',
      Notification: 'Send Notification', Approval: 'Request Approval', Wait: 'Wait Step',
    };
    const defaultConfigs: Record<NodeType, string> = {
      Trigger: 'Configure trigger event', Action: 'Configure action', Condition: 'Set condition logic',
      Notification: 'Configure notification channel', Approval: 'Set approvers', Wait: 'Set wait duration',
    };
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      step: 0,
      type,
      title: defaultTitles[type],
      configSummary: defaultConfigs[type],
    };
    setBuilderNodes(prev => {
      const next = [...prev];
      const idx = atIndex !== undefined && atIndex !== null ? atIndex + 1 : next.length;
      next.splice(idx, 0, newNode);
      return next.map((n, i) => ({ ...n, step: i + 1 }));
    });
    setShowNodeModal(false);
    setInsertIndex(null);
  };

  const removeNode = (nodeId: string) => {
    setBuilderNodes(prev => prev.filter(n => n.id !== nodeId).map((n, i) => ({ ...n, step: i + 1 })));
  };

  const openNodePicker = (atIndex?: number) => {
    setInsertIndex(atIndex ?? null);
    setShowNodeModal(true);
  };

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'workflows', label: 'My Workflows', icon: <Workflow size={15} /> },
    { key: 'templates', label: 'Templates', icon: <LayoutGrid size={15} /> },
    { key: 'builder', label: 'Builder', icon: <GitBranch size={15} /> },
    { key: 'runs', label: 'Runs', icon: <Activity size={15} /> },
    { key: 'rules', label: 'Automation Rules', icon: <Zap size={15} /> },
  ];

  // ── Filtered data ────────────────────────────────────────────────────

  const filteredWorkflows = useMemo(() => {
    return workflows.filter(w => {
      if (statusFilter !== 'all' && w.status !== statusFilter) return false;
      if (searchQuery && !w.name.toLowerCase().includes(searchQuery.toLowerCase()) && !w.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [workflows, searchQuery, statusFilter]);

  const filteredTemplates = useMemo(() => {
    return templates.filter(tpl => {
      if (categoryFilter !== 'all' && tpl.category !== categoryFilter) return false;
      if (searchQuery && !tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) && !tpl.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [templates, searchQuery, categoryFilter]);

  const filteredRuns = useMemo(() => {
    return runs.filter(r => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (searchQuery && !r.workflowName.toLowerCase().includes(searchQuery.toLowerCase()) && !r.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [runs, searchQuery, statusFilter]);

  const filteredRules = useMemo(() => {
    return rules.filter(r => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (searchQuery && !r.name.toLowerCase().includes(searchQuery.toLowerCase()) && !r.triggerEvent.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [rules, searchQuery, statusFilter]);

  // ── My Workflows Tab ─────────────────────────────────────────────────

  const renderWorkflows = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Draft">Draft</option>
            <option value="Paused">Paused</option>
            <option value="Error">Error</option>
          </select>
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-l-lg ${viewMode === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}><LayoutGrid size={16} /></button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-r-lg ${viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}><List size={16} /></button>
          </div>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> {t('workflow.createWorkflow')}
        </button>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorkflows.map(wf => (
            <div key={wf.id} className="bg-slate-800 border border-slate-700 rounded-lg p-5 hover:border-slate-600 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium text-sm truncate">{wf.name}</h3>
                  <p className="text-slate-400 text-xs mt-1 line-clamp-2">{wf.description}</p>
                </div>
                <span className={`ml-2 px-2 py-0.5 text-xs rounded border ${statusBadge(wf.status)}`}>{wf.status}</span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-2 py-0.5 text-xs rounded ${triggerBadge(wf.triggerType)}`}>{wf.triggerType}</span>
                <span className="text-xs text-slate-500">{wf.nodeCount} nodes</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                <div><span className="text-slate-500">{t('workflow.lastRun')}: </span><span className="text-slate-300">{wf.lastRun}</span></div>
                <div><span className="text-slate-500">Next run: </span><span className="text-slate-300">{wf.nextRun}</span></div>
                <div className="col-span-2">
                  <span className="text-slate-500">Success rate: </span>
                  <span className={wf.successRate >= 90 ? 'text-emerald-400' : wf.successRate >= 70 ? 'text-amber-400' : 'text-red-400'}>{wf.successRate}%</span>
                </div>
              </div>
              <div className="flex items-center gap-1 border-t border-slate-700 pt-3">
                <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" title="Edit"><Edit3 size={14} /></button>
                <button onClick={() => handleDuplicateWorkflow(wf.id)} disabled={actionLoading === wf.id} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" title="Duplicate">{actionLoading === wf.id ? <Loader2 size={14} className="animate-spin" /> : <Copy size={14} />}</button>
                <button onClick={() => handleRunWorkflow(wf.id)} disabled={actionLoading === wf.id} className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 rounded transition-colors" title="Run"><Play size={14} /></button>
                <button onClick={() => handleDeleteWorkflow(wf.id)} disabled={actionLoading === wf.id} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors ml-auto" title="Delete"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Name</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Trigger</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Last Run</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Success Rate</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Nodes</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkflows.map(wf => (
                <tr key={wf.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-white font-medium">{wf.name}</div>
                    <div className="text-slate-500 text-xs mt-0.5 max-w-xs truncate">{wf.description}</div>
                  </td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 text-xs rounded ${triggerBadge(wf.triggerType)}`}>{wf.triggerType}</span></td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 text-xs rounded border ${statusBadge(wf.status)}`}>{wf.status}</span></td>
                  <td className="px-4 py-3 text-slate-300 text-xs">{wf.lastRun}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-medium ${wf.successRate >= 90 ? 'text-emerald-400' : wf.successRate >= 70 ? 'text-amber-400' : 'text-red-400'}`}>{wf.successRate}%</span></td>
                  <td className="px-4 py-3 text-slate-300 text-xs">{wf.nodeCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded" title="Edit"><Edit3 size={14} /></button>
                      <button onClick={() => handleDuplicateWorkflow(wf.id)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded" title="Duplicate"><Copy size={14} /></button>
                      <button onClick={() => handleRunWorkflow(wf.id)} className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 rounded" title="Run"><Play size={14} /></button>
                      <button onClick={() => handleDeleteWorkflow(wf.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded" title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredWorkflows.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <Workflow size={40} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">No workflows match your filters.</p>
        </div>
      )}
    </div>
  );

  // ── Templates Tab ────────────────────────────────────────────────────

  const renderTemplates = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Categories</option>
          {(['Risk', 'Compliance', 'Audit', 'Incident', 'Privacy', 'Onboarding'] as TemplateCategory[]).map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredTemplates.map(tpl => (
          <div key={tpl.id} className="bg-slate-800 border border-slate-700 rounded-lg p-5 hover:border-slate-600 transition-colors flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className={`px-2 py-0.5 text-xs rounded ${categoryColor(tpl.category)}`}>{tpl.category}</span>
              <div className="flex items-center gap-1 text-amber-400">
                <Star size={12} fill="currentColor" />
                <span className="text-xs">{tpl.popularity}</span>
              </div>
            </div>
            <h3 className="text-white font-medium text-sm mb-2">{tpl.name}</h3>
            <p className="text-slate-400 text-xs mb-4 flex-1">{tpl.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">{tpl.stepsCount} steps</span>
              <button onClick={() => handleUseTemplate(tpl.id)} disabled={actionLoading === tpl.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors disabled:opacity-50">
                {actionLoading === tpl.id ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />} Use Template
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <LayoutGrid size={40} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">No templates match your filters.</p>
        </div>
      )}
    </div>
  );

  // ── Builder Tab ──────────────────────────────────────────────────────

  const renderBuilder = () => (
    <div className="flex gap-6">
      {/* Node Palette Sidebar */}
      <div className="w-56 flex-shrink-0">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 sticky top-24">
          <h3 className="text-white text-sm font-medium mb-3">Node Palette</h3>
          <div className="space-y-2">
            {NODE_PALETTE.map(np => (
              <div
                key={np.type}
                onClick={() => addNode(np.type)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm ${nodeTypeColor(np.type)} hover:opacity-80 transition-opacity`}
              >
                {nodeTypeIcon(np.type)}
                <span className="text-white text-xs">{np.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-700">
            <p className="text-xs text-slate-500">Click a node type to add it to the end, or use the + buttons between steps to insert.</p>
          </div>
        </div>
      </div>

      {/* Workflow Canvas */}
      <div className="flex-1 min-w-0">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <input
                type="text"
                value={editingWorkflowName}
                onChange={e => setEditingWorkflowName(e.target.value)}
                className="text-white font-medium bg-transparent border-b border-transparent hover:border-slate-600 focus:border-blue-500 focus:outline-none transition-colors"
              />
              <p className="text-slate-400 text-xs mt-1">Visual workflow editor — {builderNodes.length} node{builderNodes.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setBuilderPreview(p => !p)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors ${builderPreview ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}>
                <Eye size={14} /> {builderPreview ? 'Editing' : 'Preview'}
              </button>
              <button onClick={handleSaveBuilder} disabled={actionLoading === 'builder-save'} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded text-xs transition-colors">
                {actionLoading === 'builder-save' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Save
              </button>
              <button onClick={handleTestRunBuilder} disabled={actionLoading === 'builder-run' || builderNodes.length === 0} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded text-xs transition-colors">
                {actionLoading === 'builder-run' ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} Test Run
              </button>
            </div>
          </div>

          {/* Vertical Node Flow */}
          <div className="flex flex-col items-center">
            {builderNodes.map((node, idx) => (
              <React.Fragment key={node.id}>
                {/* Node Card */}
                <div className={`w-full max-w-lg border-l-4 rounded-lg p-4 bg-slate-800 border border-slate-700 ${nodeTypeColor(node.type)} relative`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-700 text-xs text-white font-bold">{node.step}</div>
                    {nodeTypeIcon(node.type)}
                    <span className={`px-2 py-0.5 text-xs rounded ${nodeTypeColor(node.type)}`}>{node.type}</span>
                    <span className="text-white text-sm font-medium flex-1">{node.title}</span>
                    {!builderPreview && (
                      <button onClick={() => removeNode(node.id)} title="Remove node" className="p-1 text-slate-400 hover:text-red-400 rounded hover:bg-slate-700"><Trash2 size={14} /></button>
                    )}
                  </div>
                  <p className="text-slate-400 text-xs ml-10">{node.configSummary}</p>
                </div>

                {/* Connector + Add Button */}
                {idx < builderNodes.length - 1 && (
                  <div className="flex flex-col items-center py-1">
                    <div className="w-px h-4 bg-slate-600" />
                    {!builderPreview && (
                      <button onClick={() => openNodePicker(idx)} className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-700 border border-slate-600 text-slate-400 hover:text-white hover:border-blue-500 hover:bg-blue-600/20 transition-colors">
                        <Plus size={12} />
                      </button>
                    )}
                    <div className="w-px h-4 bg-slate-600" />
                    <ArrowDown size={14} className="text-slate-600" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Add node at end */}
          {!builderPreview && (
            <div className="flex flex-col items-center pt-2">
              <div className="w-px h-4 bg-slate-600" />
              <button onClick={() => openNodePicker()} className="flex items-center gap-2 px-4 py-2 border border-dashed border-slate-600 rounded-lg text-slate-400 hover:text-white hover:border-blue-500 transition-colors text-xs">
                <Plus size={14} /> Add Node
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ── Runs Tab ─────────────────────────────────────────────────────────

  const renderRuns = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search runs by ID or workflow..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Status</option>
          <option value="Completed">Completed</option>
          <option value="Running">Running</option>
          <option value="Failed">Failed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1"><Activity size={14} /> Total Runs</div>
          <div className="text-2xl font-bold text-white">{runs.length}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-emerald-400 text-sm mb-1"><CheckCircle size={14} /> Completed</div>
          <div className="text-2xl font-bold text-emerald-400">{runs.filter(r => r.status === 'Completed').length}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-400 text-sm mb-1"><XCircle size={14} /> Failed</div>
          <div className="text-2xl font-bold text-red-400">{runs.filter(r => r.status === 'Failed').length}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-400 text-sm mb-1"><RefreshCw size={14} /> Running</div>
          <div className="text-2xl font-bold text-blue-400">{runs.filter(r => r.status === 'Running').length}</div>
        </div>
      </div>

      {/* Runs Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Run ID</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Workflow</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Triggered By</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Started</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Duration</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Progress</th>
              <th className="text-right px-4 py-3 text-slate-400 font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredRuns.map(run => (
              <tr key={run.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                <td className="px-4 py-3 text-white font-mono text-xs">{run.id}</td>
                <td className="px-4 py-3 text-white">{run.workflowName}</td>
                <td className="px-4 py-3 text-slate-300 text-xs">{run.triggeredBy}</td>
                <td className="px-4 py-3 text-slate-300 text-xs">{run.startedAt}</td>
                <td className="px-4 py-3 text-slate-300 text-xs font-mono">{run.duration}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded ${runStatusBadge(run.status)}`}>
                    {runStatusIcon(run.status)} {run.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-slate-700 rounded-full">
                      <div
                        className={`h-1.5 rounded-full ${run.status === 'Failed' ? 'bg-red-500' : run.status === 'Cancelled' ? 'bg-slate-500' : 'bg-emerald-500'}`}
                        style={{ width: `${(run.stepsCompleted / run.stepsTotal) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400">{run.stepsCompleted}/{run.stepsTotal}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setSelectedRun(run)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" title="View Details"><Eye size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredRuns.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <Activity size={40} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">No runs match your filters.</p>
        </div>
      )}
    </div>
  );

  // ── Automation Rules Tab ─────────────────────────────────────────────

  const renderRules = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search rules..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <button onClick={openCreateRule} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> New Rule
        </button>
      </div>

      <div className="space-y-3">
        {filteredRules.map(rule => (
          <div key={rule.id} className="bg-slate-800 border border-slate-700 rounded-lg p-5 hover:border-slate-600 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${rule.status === 'Active' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                <h3 className="text-white font-medium text-sm">{rule.name}</h3>
                <span className={`px-2 py-0.5 text-xs rounded ${rule.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>{rule.status}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openEditRule(rule)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded" title="Edit"><Edit3 size={14} /></button>
                <button onClick={() => handleDeleteRule(rule.id)} disabled={actionLoading === rule.id} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded disabled:opacity-50" title="Delete">{actionLoading === rule.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block mb-1">Trigger Event</span>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Zap size={12} className="text-amber-400" />
                  {rule.triggerEvent}
                </div>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Conditions</span>
                <p className="text-slate-300">{rule.conditions}</p>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Actions</span>
                <p className="text-slate-300">{rule.actions}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-700 text-xs text-slate-500">
              <span className="flex items-center gap-1"><Clock size={12} /> Last: {rule.lastTriggered}</span>
              <span className="flex items-center gap-1"><Activity size={12} /> Triggered {rule.triggerCount} times</span>
            </div>
          </div>
        ))}
      </div>

      {filteredRules.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <Zap size={40} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">No rules match your filters.</p>
        </div>
      )}
    </div>
  );

  // ── Create Workflow Modal ────────────────────────────────────────────

  const renderCreateModal = () => {
    if (!showCreateModal) return null;
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
        <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-5 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-white">{t('workflow.createWorkflow')}</h3>
            <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-slate-700 rounded"><X size={18} className="text-slate-400" /></button>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Workflow Name</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Quarterly Compliance Review"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Description</label>
              <textarea
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                placeholder="Describe the purpose and scope of this workflow..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 h-20 resize-none focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Trigger Type</label>
              <select
                value={newTrigger}
                onChange={e => setNewTrigger(e.target.value as TriggerType)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="Manual">Manual</option>
                <option value="Schedule">Schedule</option>
                <option value="Event">Event</option>
                <option value="Webhook">Webhook</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 p-5 border-t border-slate-700">
            <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">{t('common.cancel')}</button>
            <button
              onClick={handleCreateWorkflow}
              disabled={actionLoading === 'create' || !newName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {actionLoading === 'create' ? t('common.loading') : t('workflow.createWorkflow')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Automation Rule Modal ────────────────────────────────────────────

  const renderRuleModal = () => {
    if (!showRuleModal) return null;
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowRuleModal(false)}>
        <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-5 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-white">{editingRule ? 'Edit Rule' : 'New Rule'}</h3>
            <button onClick={() => setShowRuleModal(false)} className="p-1 hover:bg-slate-700 rounded"><X size={18} className="text-slate-400" /></button>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Rule Name</label>
              <input
                type="text"
                value={ruleForm.name}
                onChange={e => setRuleForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Auto-escalate critical risks"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Trigger Event</label>
              <input
                type="text"
                value={ruleForm.triggerEvent}
                onChange={e => setRuleForm(f => ({ ...f, triggerEvent: e.target.value }))}
                placeholder="e.g. risk.created"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Status</label>
              <select
                value={ruleForm.status}
                onChange={e => setRuleForm(f => ({ ...f, status: e.target.value as RuleStatus }))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 p-5 border-t border-slate-700">
            <button onClick={() => setShowRuleModal(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">{t('common.cancel')}</button>
            <button
              onClick={handleSaveRule}
              disabled={actionLoading === 'rule-save' || !ruleForm.name.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {actionLoading === 'rule-save' ? t('common.loading') : t('common.save')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Node Picker Modal ────────────────────────────────────────────────

  const renderNodePickerModal = () => {
    if (!showNodeModal) return null;
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => { setShowNodeModal(false); setInsertIndex(null); }}>
        <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-sm" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-5 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-white">Add Node</h3>
            <button onClick={() => { setShowNodeModal(false); setInsertIndex(null); }} className="p-1 hover:bg-slate-700 rounded"><X size={18} className="text-slate-400" /></button>
          </div>
          <div className="p-5 grid grid-cols-2 gap-3">
            {NODE_PALETTE.map(np => (
              <button
                key={np.type}
                onClick={() => addNode(np.type, insertIndex ?? undefined)}
                className={`flex items-center gap-2 px-3 py-3 rounded-lg border text-sm ${nodeTypeColor(np.type)} hover:opacity-80 transition-opacity`}
              >
                {nodeTypeIcon(np.type)}
                <span className="text-white text-xs font-medium">{np.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ── Run Detail Modal ─────────────────────────────────────────────────

  const renderRunDetailModal = () => {
    if (!selectedRun) return null;
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedRun(null)}>
        <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-5 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
            <div>
              <h3 className="text-lg font-semibold text-white">Run Details: {selectedRun.id}</h3>
              <p className="text-sm text-slate-400 mt-0.5">{selectedRun.workflowName}</p>
            </div>
            <button onClick={() => setSelectedRun(null)} className="p-1 hover:bg-slate-700 rounded"><X size={18} className="text-slate-400" /></button>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-900 rounded-lg p-3">
                <span className="text-xs text-slate-500 block">Status</span>
                <span className={`inline-flex items-center gap-1 mt-1 text-sm font-medium ${runStatusBadge(selectedRun.status)} px-2 py-0.5 rounded`}>
                  {runStatusIcon(selectedRun.status)} {selectedRun.status}
                </span>
              </div>
              <div className="bg-slate-900 rounded-lg p-3">
                <span className="text-xs text-slate-500 block">Triggered By</span>
                <span className="text-sm text-white mt-1 block">{selectedRun.triggeredBy}</span>
              </div>
              <div className="bg-slate-900 rounded-lg p-3">
                <span className="text-xs text-slate-500 block">Started</span>
                <span className="text-sm text-white mt-1 block">{selectedRun.startedAt}</span>
              </div>
              <div className="bg-slate-900 rounded-lg p-3">
                <span className="text-xs text-slate-500 block">Duration</span>
                <span className="text-sm text-white mt-1 block font-mono">{selectedRun.duration}</span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-white mb-3">Step-by-Step Execution</h4>
              {runDetailError && (
                <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{runDetailError}</div>
              )}
              {runDetailLoading ? (
                <div className="flex items-center justify-center py-8 text-slate-400">
                  <Loader2 size={20} className="animate-spin mr-2" /> Loading run steps...
                </div>
              ) : runSteps.length === 0 ? (
                <p className="text-sm text-slate-500 py-4">No recorded steps for this run.</p>
              ) : (
                <div className="space-y-2">
                  {runSteps.map(step => {
                    const isCompleted = step.state === 'done';
                    const isCurrent = step.state === 'running';
                    const isFailed = step.state === 'failed';
                    return (
                      <div key={step.id} className={`flex items-center gap-3 p-3 rounded-lg border ${isCompleted ? 'bg-emerald-500/5 border-emerald-500/20' : isCurrent ? 'bg-blue-500/5 border-blue-500/20' : isFailed ? 'bg-red-500/5 border-red-500/20' : 'bg-slate-900 border-slate-700'}`}>
                        <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${isCompleted ? 'bg-emerald-500/20 text-emerald-400' : isCurrent ? 'bg-blue-500/20 text-blue-400' : isFailed ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-500'}`}>
                          {isCompleted ? <CheckCircle size={14} /> : isFailed ? <XCircle size={14} /> : isCurrent ? <RefreshCw size={14} className="animate-spin" /> : step.step}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-white">{step.title}</span>
                            <span className={`px-1.5 py-0.5 text-xs rounded ${nodeTypeColor(step.type)}`}>{step.type}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">{step.configSummary}</p>
                        </div>
                        <span className={`text-xs ${isCompleted ? 'text-emerald-400' : isFailed ? 'text-red-400' : isCurrent ? 'text-blue-400' : 'text-slate-600'}`}>
                          {isCompleted ? 'Done' : isFailed ? 'Failed' : isCurrent ? 'Running' : 'Pending'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Main Render ──────────────────────────────────────────────────────

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
                <Workflow className="w-5 h-5 text-blue-400" />
                <h1 className="text-lg font-semibold text-white">{t('workflow.title')}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{workflows.filter(w => w.status === 'Active').length} active workflows</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-1 mb-6 bg-slate-800 rounded-lg p-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSearchQuery(''); setStatusFilter('all'); setCategoryFilter('all'); }}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-slate-700 text-white font-medium'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-between">
            <span className="text-red-400 text-sm">{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300"><X size={14} /></button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-blue-400" />
            <span className="ml-3 text-slate-400">Loading workflows...</span>
          </div>
        ) : (
          <>
            {activeTab === 'workflows' && renderWorkflows()}
            {activeTab === 'templates' && renderTemplates()}
            {activeTab === 'builder' && renderBuilder()}
            {activeTab === 'runs' && renderRuns()}
            {activeTab === 'rules' && renderRules()}
          </>
        )}
      </div>

      {renderCreateModal()}
      {renderNodePickerModal()}
      {renderRuleModal()}
      {renderRunDetailModal()}
    </div>
  );
};

export default WorkflowBuilder;
