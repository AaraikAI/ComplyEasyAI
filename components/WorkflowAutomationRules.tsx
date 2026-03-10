/**
 * Workflow Automation Rules Component
 *
 * Full workflow management UI:
 * - List workflows with status, trigger type, last run, run count
 * - Create/edit workflow modal with trigger, conditions, and actions builders
 * - Pre-built templates for common automation patterns
 * - Execution history tab with step-by-step detail
 * - Enable/disable toggle, delete with confirmation
 * - Dashboard stats: total, active, executions, success rate
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Workflow,
  Play,
  Pause,
  Trash2,
  Plus,
  Settings,
  Clock,
  Zap,
  Bell,
  Mail,
  Webhook,
  Tag,
  AlertTriangle,
  X,
  ChevronRight,
  Search,
  CheckCircle,
  XCircle,
  RotateCcw,
  Copy,
  Edit,
  ToggleLeft,
  ToggleRight,
  Filter,
  Activity,
  ArrowUpRight,
  Users,
  FileText,
  Shield,
  History,
  Layers,
} from 'lucide-react';
import { api } from '../services/api';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type TabId = 'workflows' | 'templates' | 'history';
type TriggerType = 'event' | 'schedule' | 'condition';
type ConditionOperator = 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'not_contains' | 'matches' | 'in' | 'not_in';
type ActionType = 'send_notification' | 'assign_task' | 'update_status' | 'create_incident' | 'send_email' | 'call_webhook' | 'add_tag' | 'escalate';

interface WorkflowTrigger {
  type: TriggerType;
  eventType?: string;
  schedule?: string;
  conditionField?: string;
  conditionOperator?: string;
  conditionValue?: string;
}

interface WorkflowCondition {
  id: string;
  field: string;
  operator: ConditionOperator;
  value: string;
  logicalOperator?: 'AND' | 'OR';
}

interface WorkflowAction {
  id: string;
  type: ActionType;
  config: Record<string, unknown>;
}

interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  enabled: boolean;
  status: string;
  lastRunAt: string | null;
  runCount: number;
  successCount: number;
  failureCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ExecutionRecord {
  id: string;
  workflowId: string;
  workflowName: string;
  triggerType: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  duration: number | null;
  error: string | null;
  nodeResults: StepDetail[];
}

interface StepDetail {
  step: number;
  actionType: string;
  status: string;
  detail: string;
  durationMs: number;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
}

interface WorkflowForm {
  name: string;
  description: string;
  enabled: boolean;
  trigger: WorkflowTrigger;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const EVENT_TYPES = [
  { value: 'risk.created', label: 'Risk Created' },
  { value: 'risk.updated', label: 'Risk Updated' },
  { value: 'risk.threshold_exceeded', label: 'Risk Threshold Exceeded' },
  { value: 'control.failed', label: 'Control Failed' },
  { value: 'control.expiring', label: 'Control Expiring' },
  { value: 'evidence.uploaded', label: 'Evidence Uploaded' },
  { value: 'evidence.expired', label: 'Evidence Expired' },
  { value: 'incident.created', label: 'Incident Created' },
  { value: 'incident.escalated', label: 'Incident Escalated' },
  { value: 'vendor.risk_change', label: 'Vendor Risk Change' },
  { value: 'policy.review_due', label: 'Policy Review Due' },
  { value: 'compliance.deadline', label: 'Compliance Deadline' },
  { value: 'audit.finding', label: 'Audit Finding' },
  { value: 'user.access_review', label: 'User Access Review Due' },
];

const CONDITION_OPERATORS: { value: ConditionOperator; label: string }[] = [
  { value: 'eq', label: 'Equals' },
  { value: 'ne', label: 'Not equals' },
  { value: 'gt', label: 'Greater than' },
  { value: 'lt', label: 'Less than' },
  { value: 'gte', label: 'Greater or equal' },
  { value: 'lte', label: 'Less or equal' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does not contain' },
  { value: 'matches', label: 'Matches regex' },
  { value: 'in', label: 'In list' },
  { value: 'not_in', label: 'Not in list' },
];

const ACTION_TYPES: { value: ActionType; label: string; icon: React.ReactNode }[] = [
  { value: 'send_notification', label: 'Send Notification', icon: <Bell className="w-4 h-4" /> },
  { value: 'send_email', label: 'Send Email', icon: <Mail className="w-4 h-4" /> },
  { value: 'assign_task', label: 'Assign Task', icon: <Users className="w-4 h-4" /> },
  { value: 'update_status', label: 'Update Status', icon: <Activity className="w-4 h-4" /> },
  { value: 'create_incident', label: 'Create Incident', icon: <AlertTriangle className="w-4 h-4" /> },
  { value: 'call_webhook', label: 'Call Webhook', icon: <Webhook className="w-4 h-4" /> },
  { value: 'add_tag', label: 'Add Tag', icon: <Tag className="w-4 h-4" /> },
  { value: 'escalate', label: 'Escalate', icon: <ArrowUpRight className="w-4 h-4" /> },
];

const TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'tpl-sev1-escalate',
    name: 'Auto-escalate SEV1 Incidents',
    description: 'Automatically escalate SEV1 incidents to the CISO and security team with high-priority notifications.',
    trigger: { type: 'event', eventType: 'incident.created' },
    conditions: [{ id: 'c1', field: 'severity', operator: 'eq', value: 'SEV1' }],
    actions: [
      { id: 'a1', type: 'escalate', config: { priority: 'critical', reason: 'SEV1 incident requires immediate attention' } },
      { id: 'a2', type: 'send_notification', config: { title: 'SEV1 Incident Alert', message: 'A critical incident has been created and requires immediate response.' } },
    ],
  },
  {
    id: 'tpl-quarterly-review',
    name: 'Quarterly Access Review Reminder',
    description: 'Send reminders for quarterly user access reviews 7 days before the review deadline.',
    trigger: { type: 'schedule', schedule: '0 9 1 1,4,7,10 *' },
    conditions: [],
    actions: [
      { id: 'a1', type: 'send_notification', config: { title: 'Quarterly Access Review', message: 'The quarterly user access review is due in 7 days. Please review all user permissions.' } },
      { id: 'a2', type: 'assign_task', config: { taskTitle: 'Complete Quarterly Access Review', dueDays: 7 } },
    ],
  },
  {
    id: 'tpl-vendor-onboarding',
    name: 'New Vendor Onboarding Checklist',
    description: 'When a new vendor risk assessment is created, automatically generate onboarding tasks and notify the procurement team.',
    trigger: { type: 'event', eventType: 'vendor.risk_change' },
    conditions: [{ id: 'c1', field: 'status', operator: 'eq', value: 'new' }],
    actions: [
      { id: 'a1', type: 'assign_task', config: { taskTitle: 'Complete vendor security questionnaire', dueDays: 14 } },
      { id: 'a2', type: 'assign_task', config: { taskTitle: 'Review vendor SOC2 report', dueDays: 7 } },
      { id: 'a3', type: 'assign_task', config: { taskTitle: 'Conduct vendor risk assessment', dueDays: 21 } },
      { id: 'a4', type: 'send_notification', config: { title: 'New Vendor Onboarding', message: 'A new vendor has been added. Onboarding tasks have been created.' } },
    ],
  },
];

const defaultForm: WorkflowForm = {
  name: '',
  description: '',
  enabled: true,
  trigger: { type: 'event', eventType: 'risk.created' },
  conditions: [],
  actions: [],
};

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDuration(ms: number | null): string {
  if (!ms) return '--';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const WorkflowAutomationRules: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('workflows');
  const [workflows, setWorkflows] = useState<WorkflowRule[]>([]);
  const [executions, setExecutions] = useState<ExecutionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<WorkflowForm>({ ...defaultForm });
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Execution detail
  const [selectedExecution, setSelectedExecution] = useState<ExecutionRecord | null>(null);

  // --------------------------------------------------------------------------
  // Data Loading
  // --------------------------------------------------------------------------

  const loadWorkflows = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.workflows.list();
      setWorkflows(Array.isArray(data) ? data : data?.workflows || data?.data || []);
    } catch (err: any) {
      console.error('Failed to load workflows:', err);
      // Use demo data on failure
      setWorkflows(DEMO_WORKFLOWS);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadExecutions = useCallback(async () => {
    try {
      const data = await api.workflows.listRuns();
      setExecutions(Array.isArray(data) ? data : data?.runs || data?.data || []);
    } catch {
      setExecutions(DEMO_EXECUTIONS);
    }
  }, []);

  useEffect(() => {
    loadWorkflows();
    loadExecutions();
  }, [loadWorkflows, loadExecutions]);

  // --------------------------------------------------------------------------
  // Computed Values
  // --------------------------------------------------------------------------

  const stats = useMemo(() => {
    const total = workflows.length;
    const active = workflows.filter(w => w.enabled).length;
    const totalExecs = workflows.reduce((sum, w) => sum + (w.runCount || 0), 0);
    const totalSuccess = workflows.reduce((sum, w) => sum + (w.successCount || 0), 0);
    const successRate = totalExecs > 0 ? Math.round((totalSuccess / totalExecs) * 100) : 0;
    return { total, active, totalExecs, successRate };
  }, [workflows]);

  const filteredWorkflows = useMemo(() => {
    let list = workflows;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(w =>
        w.name.toLowerCase().includes(q) || w.description?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      list = list.filter(w =>
        statusFilter === 'active' ? w.enabled : !w.enabled
      );
    }
    return list;
  }, [workflows, searchQuery, statusFilter]);

  // --------------------------------------------------------------------------
  // Actions
  // --------------------------------------------------------------------------

  const openCreateModal = useCallback(() => {
    setEditingId(null);
    setForm({ ...defaultForm });
    setShowModal(true);
  }, []);

  const openEditModal = useCallback((workflow: WorkflowRule) => {
    setEditingId(workflow.id);
    setForm({
      name: workflow.name,
      description: workflow.description || '',
      enabled: workflow.enabled,
      trigger: workflow.trigger || { type: 'event', eventType: 'risk.created' },
      conditions: workflow.conditions || [],
      actions: workflow.actions || [],
    });
    setShowModal(true);
  }, []);

  const useTemplate = useCallback((template: WorkflowTemplate) => {
    setEditingId(null);
    setForm({
      name: template.name,
      description: template.description,
      enabled: true,
      trigger: { ...template.trigger },
      conditions: template.conditions.map(c => ({ ...c, id: generateId() })),
      actions: template.actions.map(a => ({ ...a, id: generateId() })),
    });
    setShowModal(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        enabled: form.enabled,
        trigger: form.trigger,
        nodes: form.actions,
        variables: { conditions: form.conditions },
        status: form.enabled ? 'Active' : 'Draft',
        workflowType: 'Custom',
      };
      if (editingId) {
        await api.workflows.update(editingId, payload);
      } else {
        await api.workflows.create(payload);
      }
      setShowModal(false);
      await loadWorkflows();
    } catch (err: any) {
      console.error('Failed to save workflow:', err);
    } finally {
      setSaving(false);
    }
  }, [form, editingId, loadWorkflows]);

  const toggleWorkflow = useCallback(async (id: string, enabled: boolean) => {
    try {
      await api.workflows.update(id, { enabled: !enabled, status: !enabled ? 'Active' : 'Paused' });
      setWorkflows(prev => prev.map(w => w.id === id ? { ...w, enabled: !enabled, status: !enabled ? 'Active' : 'Paused' } : w));
    } catch (err: any) {
      console.error('Failed to toggle workflow:', err);
    }
  }, []);

  const deleteWorkflow = useCallback(async (id: string) => {
    try {
      await api.workflows.delete(id);
      setWorkflows(prev => prev.filter(w => w.id !== id));
      setDeleteTarget(null);
    } catch (err: any) {
      console.error('Failed to delete workflow:', err);
    }
  }, []);

  const runWorkflow = useCallback(async (id: string) => {
    try {
      await api.workflows.run(id);
      await loadWorkflows();
      await loadExecutions();
    } catch (err: any) {
      console.error('Failed to run workflow:', err);
    }
  }, [loadWorkflows, loadExecutions]);

  // --------------------------------------------------------------------------
  // Form Helpers
  // --------------------------------------------------------------------------

  const addCondition = useCallback(() => {
    setForm(prev => ({
      ...prev,
      conditions: [
        ...prev.conditions,
        { id: generateId(), field: '', operator: 'eq' as ConditionOperator, value: '', logicalOperator: 'AND' },
      ],
    }));
  }, []);

  const removeCondition = useCallback((id: string) => {
    setForm(prev => ({
      ...prev,
      conditions: prev.conditions.filter(c => c.id !== id),
    }));
  }, []);

  const updateCondition = useCallback((id: string, updates: Partial<WorkflowCondition>) => {
    setForm(prev => ({
      ...prev,
      conditions: prev.conditions.map(c => c.id === id ? { ...c, ...updates } : c),
    }));
  }, []);

  const addAction = useCallback(() => {
    setForm(prev => ({
      ...prev,
      actions: [
        ...prev.actions,
        { id: generateId(), type: 'send_notification' as ActionType, config: {} },
      ],
    }));
  }, []);

  const removeAction = useCallback((id: string) => {
    setForm(prev => ({
      ...prev,
      actions: prev.actions.filter(a => a.id !== id),
    }));
  }, []);

  const updateAction = useCallback((id: string, updates: Partial<WorkflowAction>) => {
    setForm(prev => ({
      ...prev,
      actions: prev.actions.map(a => a.id === id ? { ...a, ...updates } : a),
    }));
  }, []);

  const updateActionConfig = useCallback((id: string, key: string, value: unknown) => {
    setForm(prev => ({
      ...prev,
      actions: prev.actions.map(a =>
        a.id === id ? { ...a, config: { ...a.config, [key]: value } } : a
      ),
    }));
  }, []);

  // --------------------------------------------------------------------------
  // Tab Config
  // --------------------------------------------------------------------------

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'workflows', label: 'Workflows', icon: <Workflow className="w-4 h-4" /> },
    { id: 'templates', label: 'Templates', icon: <Layers className="w-4 h-4" /> },
    { id: 'history', label: 'History', icon: <History className="w-4 h-4" /> },
  ];

  // --------------------------------------------------------------------------
  // Render Helpers
  // --------------------------------------------------------------------------

  const getTriggerBadge = (trigger: WorkflowTrigger) => {
    switch (trigger?.type) {
      case 'event':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Zap className="w-3 h-3" /> {trigger.eventType || 'Event'}
          </span>
        );
      case 'schedule':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Clock className="w-3 h-3" /> {trigger.schedule || 'Schedule'}
          </span>
        );
      case 'condition':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Filter className="w-3 h-3" /> Condition
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-white/10 text-white/60">
            Unknown
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400"><CheckCircle className="w-3 h-3" /> Completed</span>;
      case 'Failed':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-400"><XCircle className="w-3 h-3" /> Failed</span>;
      case 'Running':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-400"><Activity className="w-3 h-3 animate-pulse" /> Running</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-white/10 text-white/60">{status}</span>;
    }
  };

  // --------------------------------------------------------------------------
  // Action Config Forms
  // --------------------------------------------------------------------------

  const renderActionConfig = (action: WorkflowAction) => {
    const cfg = action.config;
    switch (action.type) {
      case 'send_notification':
        return (
          <div className="space-y-2 mt-2">
            <input
              type="text"
              placeholder="Notification title"
              value={(cfg.title as string) || ''}
              onChange={(e) => updateActionConfig(action.id, 'title', e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
            <textarea
              placeholder="Notification message (supports {{variable}} placeholders)"
              value={(cfg.message as string) || ''}
              onChange={(e) => updateActionConfig(action.id, 'message', e.target.value)}
              rows={2}
              className="w-full px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none"
            />
          </div>
        );
      case 'send_email':
        return (
          <div className="space-y-2 mt-2">
            <input
              type="email"
              placeholder="Recipient email"
              value={(cfg.to as string) || ''}
              onChange={(e) => updateActionConfig(action.id, 'to', e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
            <input
              type="text"
              placeholder="Subject"
              value={(cfg.subject as string) || ''}
              onChange={(e) => updateActionConfig(action.id, 'subject', e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
            <textarea
              placeholder="Email body"
              value={(cfg.body as string) || ''}
              onChange={(e) => updateActionConfig(action.id, 'body', e.target.value)}
              rows={3}
              className="w-full px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none"
            />
          </div>
        );
      case 'assign_task':
        return (
          <div className="space-y-2 mt-2">
            <input
              type="text"
              placeholder="Task title"
              value={(cfg.taskTitle as string) || ''}
              onChange={(e) => updateActionConfig(action.id, 'taskTitle', e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
            <input
              type="text"
              placeholder="Task description"
              value={(cfg.taskDescription as string) || ''}
              onChange={(e) => updateActionConfig(action.id, 'taskDescription', e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
            <input
              type="number"
              placeholder="Due in (days)"
              value={(cfg.dueDays as number) || ''}
              onChange={(e) => updateActionConfig(action.id, 'dueDays', parseInt(e.target.value) || 7)}
              className="w-full px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
          </div>
        );
      case 'update_status':
        return (
          <div className="space-y-2 mt-2">
            <input
              type="text"
              placeholder="New status value"
              value={(cfg.newStatus as string) || ''}
              onChange={(e) => updateActionConfig(action.id, 'newStatus', e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
            <input
              type="text"
              placeholder="Model (e.g. RiskItem, Incident)"
              value={(cfg.model as string) || ''}
              onChange={(e) => updateActionConfig(action.id, 'model', e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
          </div>
        );
      case 'create_incident':
        return (
          <div className="space-y-2 mt-2">
            <input
              type="text"
              placeholder="Incident title"
              value={(cfg.title as string) || ''}
              onChange={(e) => updateActionConfig(action.id, 'title', e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
            <textarea
              placeholder="Incident description"
              value={(cfg.description as string) || ''}
              onChange={(e) => updateActionConfig(action.id, 'description', e.target.value)}
              rows={2}
              className="w-full px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none"
            />
            <select
              value={(cfg.severity as string) || 'medium'}
              onChange={(e) => updateActionConfig(action.id, 'severity', e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        );
      case 'call_webhook':
        return (
          <div className="space-y-2 mt-2">
            <input
              type="url"
              placeholder="Webhook URL"
              value={(cfg.url as string) || ''}
              onChange={(e) => updateActionConfig(action.id, 'url', e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
            <select
              value={(cfg.method as string) || 'POST'}
              onChange={(e) => updateActionConfig(action.id, 'method', e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            >
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="GET">GET</option>
            </select>
          </div>
        );
      case 'add_tag':
        return (
          <div className="mt-2">
            <input
              type="text"
              placeholder="Tag name"
              value={(cfg.tagName as string) || ''}
              onChange={(e) => updateActionConfig(action.id, 'tagName', e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
          </div>
        );
      case 'escalate':
        return (
          <div className="space-y-2 mt-2">
            <input
              type="text"
              placeholder="Escalate to (user ID or role)"
              value={(cfg.escalateTo as string) || ''}
              onChange={(e) => updateActionConfig(action.id, 'escalateTo', e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
            <input
              type="text"
              placeholder="Reason for escalation"
              value={(cfg.reason as string) || ''}
              onChange={(e) => updateActionConfig(action.id, 'reason', e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
            <select
              value={(cfg.priority as string) || 'high'}
              onChange={(e) => updateActionConfig(action.id, 'priority', e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        );
      default:
        return null;
    }
  };

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Workflow className="w-7 h-7 text-blue-400" />
            Workflow Automation
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Create automated rules to streamline compliance operations
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Create Workflow
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Workflows', value: stats.total, icon: <Workflow className="w-5 h-5 text-blue-400" /> },
          { label: 'Active', value: stats.active, icon: <Play className="w-5 h-5 text-green-400" /> },
          { label: 'Total Executions', value: stats.totalExecs, icon: <Activity className="w-5 h-5 text-purple-400" /> },
          { label: 'Success Rate', value: `${stats.successRate}%`, icon: <CheckCircle className="w-5 h-5 text-emerald-400" /> },
        ].map((stat) => (
          <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/50 uppercase tracking-wider">{stat.label}</span>
              {stat.icon}
            </div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white/5 border border-white/10 rounded-xl p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* WORKFLOWS TAB */}
      {activeTab === 'workflows' && (
        <div>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Search workflows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Workflow List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredWorkflows.length === 0 ? (
            <div className="text-center py-20 bg-white/5 border border-white/10 rounded-xl">
              <Workflow className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/50 text-sm">No workflows found</p>
              <button
                onClick={openCreateModal}
                className="mt-3 text-sm text-blue-400 hover:text-blue-300"
              >
                Create your first workflow
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredWorkflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/[0.07] transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-medium truncate">{workflow.name}</h3>
                        {getTriggerBadge(workflow.trigger)}
                        {workflow.enabled ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-white/10 text-white/40 border border-white/10">
                            Paused
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-white/50 truncate">{workflow.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Last run: {formatDate(workflow.lastRunAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Activity className="w-3 h-3" /> Runs: {workflow.runCount || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Success: {workflow.successCount || 0}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => runWorkflow(workflow.id)}
                        className="p-2 text-white/40 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                        title="Run now"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleWorkflow(workflow.id, workflow.enabled)}
                        className="p-2 text-white/40 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors"
                        title={workflow.enabled ? 'Pause' : 'Enable'}
                      >
                        {workflow.enabled ? <ToggleRight className="w-4 h-4 text-green-400" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => openEditModal(workflow)}
                        className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(workflow.id)}
                        className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TEMPLATES TAB */}
      {activeTab === 'templates' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((tpl) => (
            <div key={tpl.id} className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-blue-500/20 rounded-lg shrink-0">
                  <FileText className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium text-sm">{tpl.name}</h3>
                  <p className="text-xs text-white/50 mt-1">{tpl.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-auto pt-3 border-t border-white/5">
                {getTriggerBadge(tpl.trigger)}
                <span className="text-xs text-white/40">
                  {tpl.conditions.length} condition{tpl.conditions.length !== 1 ? 's' : ''} | {tpl.actions.length} action{tpl.actions.length !== 1 ? 's' : ''}
                </span>
              </div>
              <button
                onClick={() => useTemplate(tpl)}
                className="mt-3 flex items-center justify-center gap-2 w-full px-3 py-2 text-sm bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg transition-colors"
              >
                <Copy className="w-3.5 h-3.5" /> Use Template
              </button>
            </div>
          ))}
        </div>
      )}

      {/* HISTORY TAB */}
      {activeTab === 'history' && (
        <div>
          {executions.length === 0 ? (
            <div className="text-center py-20 bg-white/5 border border-white/10 rounded-xl">
              <History className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/50 text-sm">No execution history yet</p>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-4 py-3 text-xs text-white/50 font-medium uppercase tracking-wider">Workflow</th>
                    <th className="text-left px-4 py-3 text-xs text-white/50 font-medium uppercase tracking-wider">Trigger</th>
                    <th className="text-left px-4 py-3 text-xs text-white/50 font-medium uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs text-white/50 font-medium uppercase tracking-wider">Duration</th>
                    <th className="text-left px-4 py-3 text-xs text-white/50 font-medium uppercase tracking-wider">Started</th>
                    <th className="text-left px-4 py-3 text-xs text-white/50 font-medium uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody>
                  {executions.map((exec) => (
                    <tr key={exec.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-white">{exec.workflowName || exec.workflowId?.slice(0, 8)}</td>
                      <td className="px-4 py-3 text-white/60">{exec.triggerType}</td>
                      <td className="px-4 py-3">{getStatusBadge(exec.status)}</td>
                      <td className="px-4 py-3 text-white/60">{formatDuration(exec.duration)}</td>
                      <td className="px-4 py-3 text-white/60">{formatDate(exec.startedAt)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedExecution(exec)}
                          className="text-white/40 hover:text-white"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-white font-semibold">Delete Workflow</h3>
            </div>
            <p className="text-sm text-white/60 mb-6">
              Are you sure you want to delete this workflow? This action cannot be undone. All execution history will also be removed.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteWorkflow(deleteTarget)}
                className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXECUTION DETAIL MODAL */}
      {selectedExecution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Execution Details</h3>
              <button onClick={() => setSelectedExecution(null)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Status</span>
                {getStatusBadge(selectedExecution.status)}
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Duration</span>
                <span className="text-white">{formatDuration(selectedExecution.duration)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Trigger</span>
                <span className="text-white">{selectedExecution.triggerType}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Started</span>
                <span className="text-white">{formatDate(selectedExecution.startedAt)}</span>
              </div>
              {selectedExecution.error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                  {selectedExecution.error}
                </div>
              )}
            </div>
            {selectedExecution.nodeResults && selectedExecution.nodeResults.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-white/70 mb-2">Steps</h4>
                <div className="space-y-2">
                  {selectedExecution.nodeResults.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-white/5 border border-white/5 rounded-lg">
                      <div className="shrink-0 mt-0.5">
                        {step.status === 'success' ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : step.status === 'failure' ? (
                          <XCircle className="w-4 h-4 text-red-400" />
                        ) : (
                          <RotateCcw className="w-4 h-4 text-white/30" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-white/80">{step.actionType}</span>
                          <span className="text-xs text-white/40">{formatDuration(step.durationMs)}</span>
                        </div>
                        <p className="text-xs text-white/50 mt-0.5 truncate">{step.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-slate-900 z-10">
              <h2 className="text-lg font-semibold text-white">
                {editingId ? 'Edit Workflow' : 'Create Workflow'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1">Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Auto-escalate critical risks"
                    className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this workflow does..."
                    rows={2}
                    className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setForm(prev => ({ ...prev, enabled: !prev.enabled }))}
                    className="text-white/60 hover:text-white"
                  >
                    {form.enabled ? (
                      <ToggleRight className="w-6 h-6 text-green-400" />
                    ) : (
                      <ToggleLeft className="w-6 h-6" />
                    )}
                  </button>
                  <span className="text-sm text-white/70">{form.enabled ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>

              {/* Trigger Configuration */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-sm font-medium text-white flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-blue-400" /> Trigger
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Trigger Type</label>
                    <select
                      value={form.trigger.type}
                      onChange={(e) => setForm(prev => ({
                        ...prev,
                        trigger: { ...prev.trigger, type: e.target.value as TriggerType },
                      }))}
                      className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                    >
                      <option value="event">Event-based</option>
                      <option value="schedule">Scheduled (Cron)</option>
                      <option value="condition">Condition-based</option>
                    </select>
                  </div>

                  {form.trigger.type === 'event' && (
                    <div>
                      <label className="block text-xs text-white/50 mb-1">Event Type</label>
                      <select
                        value={form.trigger.eventType || ''}
                        onChange={(e) => setForm(prev => ({
                          ...prev,
                          trigger: { ...prev.trigger, eventType: e.target.value },
                        }))}
                        className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                      >
                        <option value="">Select event...</option>
                        {EVENT_TYPES.map((et) => (
                          <option key={et.value} value={et.value}>{et.label}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {form.trigger.type === 'schedule' && (
                    <div>
                      <label className="block text-xs text-white/50 mb-1">
                        Cron Expression
                        <span className="ml-2 text-white/30">(e.g. 0 9 * * 1-5 = weekdays at 9am)</span>
                      </label>
                      <input
                        type="text"
                        value={form.trigger.schedule || ''}
                        onChange={(e) => setForm(prev => ({
                          ...prev,
                          trigger: { ...prev.trigger, schedule: e.target.value },
                        }))}
                        placeholder="0 9 * * *"
                        className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500/50 font-mono"
                      />
                    </div>
                  )}

                  {form.trigger.type === 'condition' && (
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs text-white/50 mb-1">Field</label>
                        <input
                          type="text"
                          value={form.trigger.conditionField || ''}
                          onChange={(e) => setForm(prev => ({
                            ...prev,
                            trigger: { ...prev.trigger, conditionField: e.target.value },
                          }))}
                          placeholder="severity"
                          className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white/50 mb-1">Operator</label>
                        <select
                          value={form.trigger.conditionOperator || 'eq'}
                          onChange={(e) => setForm(prev => ({
                            ...prev,
                            trigger: { ...prev.trigger, conditionOperator: e.target.value },
                          }))}
                          className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                        >
                          <option value="eq">Equals</option>
                          <option value="ne">Not equals</option>
                          <option value="gt">Greater than</option>
                          <option value="lt">Less than</option>
                          <option value="contains">Contains</option>
                          <option value="matches">Matches</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-white/50 mb-1">Value</label>
                        <input
                          type="text"
                          value={form.trigger.conditionValue || ''}
                          onChange={(e) => setForm(prev => ({
                            ...prev,
                            trigger: { ...prev.trigger, conditionValue: e.target.value },
                          }))}
                          placeholder="critical"
                          className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Conditions Builder */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-white flex items-center gap-2">
                    <Filter className="w-4 h-4 text-amber-400" /> Conditions
                    <span className="text-xs text-white/40 font-normal">({form.conditions.length})</span>
                  </h3>
                  <button
                    onClick={addCondition}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>

                {form.conditions.length === 0 ? (
                  <p className="text-xs text-white/40 text-center py-3">
                    No conditions - workflow will trigger on every matching event
                  </p>
                ) : (
                  <div className="space-y-2">
                    {form.conditions.map((cond, idx) => (
                      <div key={cond.id} className="flex items-center gap-2">
                        {idx > 0 && (
                          <select
                            value={cond.logicalOperator || 'AND'}
                            onChange={(e) => updateCondition(cond.id, { logicalOperator: e.target.value as 'AND' | 'OR' })}
                            className="w-16 px-2 py-1.5 text-xs bg-white/5 border border-white/10 rounded text-white focus:outline-none"
                          >
                            <option value="AND">AND</option>
                            <option value="OR">OR</option>
                          </select>
                        )}
                        {idx === 0 && <div className="w-16 text-xs text-white/30 text-center">Where</div>}
                        <input
                          type="text"
                          placeholder="field"
                          value={cond.field}
                          onChange={(e) => updateCondition(cond.id, { field: e.target.value })}
                          className="flex-1 px-2 py-1.5 text-xs bg-white/5 border border-white/10 rounded text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                        />
                        <select
                          value={cond.operator}
                          onChange={(e) => updateCondition(cond.id, { operator: e.target.value as ConditionOperator })}
                          className="w-32 px-2 py-1.5 text-xs bg-white/5 border border-white/10 rounded text-white focus:outline-none"
                        >
                          {CONDITION_OPERATORS.map((op) => (
                            <option key={op.value} value={op.value}>{op.label}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="value"
                          value={cond.value}
                          onChange={(e) => updateCondition(cond.id, { value: e.target.value })}
                          className="flex-1 px-2 py-1.5 text-xs bg-white/5 border border-white/10 rounded text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                        />
                        <button
                          onClick={() => removeCondition(cond.id)}
                          className="p-1 text-white/30 hover:text-red-400 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions Builder */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-white flex items-center gap-2">
                    <Settings className="w-4 h-4 text-green-400" /> Actions
                    <span className="text-xs text-white/40 font-normal">({form.actions.length})</span>
                  </h3>
                  <button
                    onClick={addAction}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>

                {form.actions.length === 0 ? (
                  <p className="text-xs text-white/40 text-center py-3">
                    Add at least one action for this workflow
                  </p>
                ) : (
                  <div className="space-y-3">
                    {form.actions.map((action, idx) => (
                      <div key={action.id} className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-white/30 font-mono">#{idx + 1}</span>
                            <select
                              value={action.type}
                              onChange={(e) => updateAction(action.id, { type: e.target.value as ActionType, config: {} })}
                              className="px-2 py-1.5 text-xs bg-white/5 border border-white/10 rounded text-white focus:outline-none"
                            >
                              {ACTION_TYPES.map((at) => (
                                <option key={at.value} value={at.value}>{at.label}</option>
                              ))}
                            </select>
                          </div>
                          <button
                            onClick={() => removeAction(action.id)}
                            className="p-1 text-white/30 hover:text-red-400 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {renderActionConfig(action)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10 sticky bottom-0 bg-slate-900">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                {editingId ? 'Save Changes' : 'Create Workflow'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// DEMO DATA (used when API is unavailable)
// ============================================================================

const DEMO_WORKFLOWS: WorkflowRule[] = [
  {
    id: 'wf-001',
    name: 'Auto-escalate SEV1 Incidents',
    description: 'Automatically escalate SEV1 incidents to the CISO and create high-priority tasks.',
    trigger: { type: 'event', eventType: 'incident.created' },
    conditions: [{ id: 'c1', field: 'severity', operator: 'eq', value: 'SEV1' }],
    actions: [
      { id: 'a1', type: 'escalate', config: { priority: 'critical' } },
      { id: 'a2', type: 'send_notification', config: { title: 'SEV1 Alert' } },
    ],
    enabled: true,
    status: 'Active',
    lastRunAt: '2026-03-08T14:30:00Z',
    runCount: 12,
    successCount: 11,
    failureCount: 1,
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-03-08T14:30:00Z',
  },
  {
    id: 'wf-002',
    name: 'Quarterly Access Review Reminder',
    description: 'Send reminders for quarterly user access reviews.',
    trigger: { type: 'schedule', schedule: '0 9 1 1,4,7,10 *' },
    conditions: [],
    actions: [
      { id: 'a1', type: 'send_notification', config: { title: 'Access Review Due' } },
      { id: 'a2', type: 'assign_task', config: { taskTitle: 'Quarterly Access Review', dueDays: 7 } },
    ],
    enabled: true,
    status: 'Active',
    lastRunAt: '2026-01-01T09:00:00Z',
    runCount: 4,
    successCount: 4,
    failureCount: 0,
    createdAt: '2025-10-01T08:00:00Z',
    updatedAt: '2026-01-01T09:00:00Z',
  },
  {
    id: 'wf-003',
    name: 'Control Failure Alert',
    description: 'Notify the compliance team when a control test fails.',
    trigger: { type: 'event', eventType: 'control.failed' },
    conditions: [],
    actions: [
      { id: 'a1', type: 'send_email', config: { to: 'compliance@company.com', subject: 'Control Failure Alert' } },
      { id: 'a2', type: 'create_incident', config: { title: 'Control Failure', severity: 'high' } },
    ],
    enabled: false,
    status: 'Paused',
    lastRunAt: null,
    runCount: 0,
    successCount: 0,
    failureCount: 0,
    createdAt: '2026-02-20T16:00:00Z',
    updatedAt: '2026-02-20T16:00:00Z',
  },
  {
    id: 'wf-004',
    name: 'New Vendor Risk Assessment',
    description: 'Generate onboarding checklist tasks when a new vendor is added.',
    trigger: { type: 'event', eventType: 'vendor.risk_change' },
    conditions: [{ id: 'c1', field: 'status', operator: 'eq', value: 'new' }],
    actions: [
      { id: 'a1', type: 'assign_task', config: { taskTitle: 'Complete vendor questionnaire', dueDays: 14 } },
      { id: 'a2', type: 'assign_task', config: { taskTitle: 'Review SOC2 report', dueDays: 7 } },
    ],
    enabled: true,
    status: 'Active',
    lastRunAt: '2026-03-05T11:15:00Z',
    runCount: 8,
    successCount: 8,
    failureCount: 0,
    createdAt: '2025-11-10T09:00:00Z',
    updatedAt: '2026-03-05T11:15:00Z',
  },
];

const DEMO_EXECUTIONS: ExecutionRecord[] = [
  {
    id: 'exec-001',
    workflowId: 'wf-001',
    workflowName: 'Auto-escalate SEV1 Incidents',
    triggerType: 'event',
    status: 'Completed',
    startedAt: '2026-03-08T14:30:00Z',
    completedAt: '2026-03-08T14:30:02Z',
    duration: 1840,
    error: null,
    nodeResults: [
      { step: 1, actionType: 'escalate', status: 'success', detail: 'Escalated to CISO with critical priority', durationMs: 320 },
      { step: 2, actionType: 'send_notification', status: 'success', detail: 'Sent notification to 3 user(s)', durationMs: 180 },
    ],
  },
  {
    id: 'exec-002',
    workflowId: 'wf-002',
    workflowName: 'Quarterly Access Review Reminder',
    triggerType: 'schedule',
    status: 'Completed',
    startedAt: '2026-01-01T09:00:00Z',
    completedAt: '2026-01-01T09:00:03Z',
    duration: 2560,
    error: null,
    nodeResults: [
      { step: 1, actionType: 'send_notification', status: 'success', detail: 'Access review notification sent', durationMs: 150 },
      { step: 2, actionType: 'assign_task', status: 'success', detail: 'Task "Quarterly Access Review" assigned, due 2026-01-08', durationMs: 410 },
    ],
  },
  {
    id: 'exec-003',
    workflowId: 'wf-004',
    workflowName: 'New Vendor Risk Assessment',
    triggerType: 'event',
    status: 'Completed',
    startedAt: '2026-03-05T11:15:00Z',
    completedAt: '2026-03-05T11:15:01Z',
    duration: 980,
    error: null,
    nodeResults: [
      { step: 1, actionType: 'assign_task', status: 'success', detail: 'Task "Complete vendor questionnaire" assigned', durationMs: 280 },
      { step: 2, actionType: 'assign_task', status: 'success', detail: 'Task "Review SOC2 report" assigned', durationMs: 250 },
    ],
  },
  {
    id: 'exec-004',
    workflowId: 'wf-001',
    workflowName: 'Auto-escalate SEV1 Incidents',
    triggerType: 'event',
    status: 'Failed',
    startedAt: '2026-02-28T10:45:00Z',
    completedAt: '2026-02-28T10:45:05Z',
    duration: 5120,
    error: 'Webhook timeout: escalation endpoint unreachable',
    nodeResults: [
      { step: 1, actionType: 'escalate', status: 'failure', detail: 'Webhook timeout after 5000ms', durationMs: 5010 },
    ],
  },
];

export default WorkflowAutomationRules;
