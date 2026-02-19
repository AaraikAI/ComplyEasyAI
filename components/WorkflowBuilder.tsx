import React, { useState, useMemo } from 'react';
import {
  ArrowLeft, Plus, Search, Filter, X, Play, Pause, Copy, Trash2, Edit3,
  Eye, Clock, CheckCircle, XCircle, AlertTriangle, Zap, GitBranch, Bell,
  Calendar, ChevronDown, ChevronRight, BarChart3, Settings, Workflow,
  ArrowDown, Shield, Users, Star, Download, RefreshCw, Activity,
  Timer, FileText, Lock, UserCheck, LayoutGrid, List
} from 'lucide-react';

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
  workflowName: string;
  triggeredBy: string;
  startedAt: string;
  duration: string;
  status: RunStatus;
  stepsCompleted: number;
  stepsTotal: number;
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

// ── Mock Data ──────────────────────────────────────────────────────────

const MOCK_WORKFLOWS: WorkflowItem[] = [
  { id: 'wf-1', name: 'Risk Assessment Review', description: 'Automated quarterly risk assessment collection and review pipeline', triggerType: 'Schedule', status: 'Active', lastRun: '2026-02-18 14:30', nextRun: '2026-03-18 14:30', successRate: 96, nodeCount: 8 },
  { id: 'wf-2', name: 'Incident Response Triage', description: 'Classify, assign, and escalate incoming security incidents automatically', triggerType: 'Event', status: 'Active', lastRun: '2026-02-19 09:12', nextRun: 'On event', successRate: 92, nodeCount: 6 },
  { id: 'wf-3', name: 'Vendor Onboarding Due Diligence', description: 'End-to-end vendor risk evaluation including questionnaire dispatch and scoring', triggerType: 'Manual', status: 'Draft', lastRun: 'Never', nextRun: 'N/A', successRate: 0, nodeCount: 5 },
  { id: 'wf-4', name: 'Policy Approval Pipeline', description: 'Route new and updated policies through stakeholder review and sign-off', triggerType: 'Webhook', status: 'Active', lastRun: '2026-02-17 11:00', nextRun: 'On webhook', successRate: 100, nodeCount: 7 },
  { id: 'wf-5', name: 'GDPR Data Subject Request', description: 'Handle DSAR intake, verification, data discovery, and response within SLA', triggerType: 'Event', status: 'Paused', lastRun: '2026-02-10 16:45', nextRun: 'Paused', successRate: 88, nodeCount: 9 },
  { id: 'wf-6', name: 'Compliance Training Reminder', description: 'Send scheduled training reminders and track completion rates', triggerType: 'Schedule', status: 'Error', lastRun: '2026-02-15 08:00', nextRun: '2026-02-22 08:00', successRate: 73, nodeCount: 4 },
];

const MOCK_TEMPLATES: WorkflowTemplate[] = [
  { id: 'tpl-1', name: 'Risk Register Auto-Update', category: 'Risk', description: 'Automatically update risk register entries when control assessments change', stepsCount: 5, popularity: 4.8 },
  { id: 'tpl-2', name: 'SOC 2 Evidence Collection', category: 'Compliance', description: 'Gather, validate, and organize evidence artifacts for SOC 2 audits', stepsCount: 7, popularity: 4.9 },
  { id: 'tpl-3', name: 'Internal Audit Scheduling', category: 'Audit', description: 'Schedule audits, notify stakeholders, and track preparation tasks', stepsCount: 6, popularity: 4.5 },
  { id: 'tpl-4', name: 'Security Incident Escalation', category: 'Incident', description: 'Classify severity, notify response team, and trigger containment steps', stepsCount: 8, popularity: 4.7 },
  { id: 'tpl-5', name: 'DSAR Processing Pipeline', category: 'Privacy', description: 'Intake, verify identity, discover data, and generate response packages', stepsCount: 9, popularity: 4.6 },
  { id: 'tpl-6', name: 'New Employee Compliance Setup', category: 'Onboarding', description: 'Assign mandatory training, provision access, and verify background checks', stepsCount: 6, popularity: 4.4 },
  { id: 'tpl-7', name: 'Continuous Control Monitoring', category: 'Compliance', description: 'Monitor control effectiveness and alert on deviations in real time', stepsCount: 4, popularity: 4.3 },
  { id: 'tpl-8', name: 'Third-Party Risk Re-Assessment', category: 'Risk', description: 'Periodic re-evaluation of vendor risk posture with automated scoring', stepsCount: 7, popularity: 4.5 },
];

const MOCK_BUILDER_NODES: WorkflowNode[] = [
  { id: 'bn-1', step: 1, type: 'Trigger', title: 'New Incident Reported', configSummary: 'Source: SIEM webhook, Filter: severity >= medium' },
  { id: 'bn-2', step: 2, type: 'Condition', title: 'Check Severity Level', configSummary: 'If severity is Critical or High -> fast path, else -> standard path' },
  { id: 'bn-3', step: 3, type: 'Notification', title: 'Alert Response Team', configSummary: 'Slack: #incident-response, Email: security-team@company.com' },
  { id: 'bn-4', step: 4, type: 'Approval', title: 'Manager Approval', configSummary: 'Approver: Incident Manager, Timeout: 30 min, Auto-escalate on timeout' },
  { id: 'bn-5', step: 5, type: 'Action', title: 'Create JIRA Ticket', configSummary: 'Project: SEC, Type: Incident, Priority: mapped from severity' },
  { id: 'bn-6', step: 6, type: 'Wait', title: 'Await Resolution', configSummary: 'Wait for ticket status = Resolved, Max wait: 72 hours' },
];

const MOCK_RUNS: WorkflowRun[] = [
  { id: 'RUN-001', workflowName: 'Risk Assessment Review', triggeredBy: 'Scheduler', startedAt: '2026-02-18 14:30', duration: '4m 12s', status: 'Completed', stepsCompleted: 8, stepsTotal: 8 },
  { id: 'RUN-002', workflowName: 'Incident Response Triage', triggeredBy: 'SIEM Event', startedAt: '2026-02-19 09:12', duration: '1m 45s', status: 'Completed', stepsCompleted: 6, stepsTotal: 6 },
  { id: 'RUN-003', workflowName: 'Policy Approval Pipeline', triggeredBy: 'Webhook', startedAt: '2026-02-17 11:00', duration: '23m 08s', status: 'Completed', stepsCompleted: 7, stepsTotal: 7 },
  { id: 'RUN-004', workflowName: 'GDPR Data Subject Request', triggeredBy: 'Portal Event', startedAt: '2026-02-10 16:45', duration: '15m 32s', status: 'Failed', stepsCompleted: 5, stepsTotal: 9 },
  { id: 'RUN-005', workflowName: 'Compliance Training Reminder', triggeredBy: 'Scheduler', startedAt: '2026-02-15 08:00', duration: '2m 01s', status: 'Failed', stepsCompleted: 2, stepsTotal: 4 },
  { id: 'RUN-006', workflowName: 'Incident Response Triage', triggeredBy: 'SIEM Event', startedAt: '2026-02-18 22:05', duration: '1m 33s', status: 'Completed', stepsCompleted: 6, stepsTotal: 6 },
  { id: 'RUN-007', workflowName: 'Risk Assessment Review', triggeredBy: 'Manual', startedAt: '2026-02-16 10:20', duration: '5m 47s', status: 'Completed', stepsCompleted: 8, stepsTotal: 8 },
  { id: 'RUN-008', workflowName: 'Policy Approval Pipeline', triggeredBy: 'Webhook', startedAt: '2026-02-19 08:30', duration: '—', status: 'Running', stepsCompleted: 3, stepsTotal: 7 },
  { id: 'RUN-009', workflowName: 'Vendor Onboarding Due Diligence', triggeredBy: 'Manual', startedAt: '2026-02-14 13:15', duration: '8m 22s', status: 'Cancelled', stepsCompleted: 3, stepsTotal: 5 },
  { id: 'RUN-010', workflowName: 'Incident Response Triage', triggeredBy: 'SIEM Event', startedAt: '2026-02-13 03:41', duration: '1m 58s', status: 'Completed', stepsCompleted: 6, stepsTotal: 6 },
];

const MOCK_RULES: AutomationRule[] = [
  { id: 'rule-1', name: 'Critical Risk Auto-Escalate', triggerEvent: 'Risk score exceeds threshold', conditions: 'Risk score >= 90 AND category = "Operational"', actions: 'Notify CISO, Create escalation ticket, Set risk status to Critical', status: 'Active', lastTriggered: '2026-02-17 15:20', triggerCount: 12 },
  { id: 'rule-2', name: 'Overdue Control Remediation', triggerEvent: 'Remediation deadline passed', conditions: 'Days overdue > 0 AND status != "Closed"', actions: 'Send reminder to owner, CC manager, Update status to Overdue', status: 'Active', lastTriggered: '2026-02-19 06:00', triggerCount: 34 },
  { id: 'rule-3', name: 'New Vendor Risk Screening', triggerEvent: 'Vendor created in system', conditions: 'Vendor type = "Third-Party" OR "Fourth-Party"', actions: 'Trigger due diligence workflow, Assign risk analyst, Send questionnaire', status: 'Active', lastTriggered: '2026-02-16 10:30', triggerCount: 8 },
  { id: 'rule-4', name: 'Compliance Certificate Expiry', triggerEvent: 'Certificate expiry within 30 days', conditions: 'Certificate type IN ("ISO 27001", "SOC 2", "PCI DSS")', actions: 'Notify vendor manager, Create renewal task, Flag vendor profile', status: 'Inactive', lastTriggered: '2026-01-28 09:00', triggerCount: 5 },
  { id: 'rule-5', name: 'Failed Login Lockout', triggerEvent: 'Consecutive failed login attempts', conditions: 'Failed attempts >= 5 within 10 minutes', actions: 'Lock account, Notify IT Security, Log audit event', status: 'Active', lastTriggered: '2026-02-19 07:45', triggerCount: 21 },
];

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
  const [activeTab, setActiveTab] = useState<TabKey>('workflows');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRun, setSelectedRun] = useState<WorkflowRun | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Create workflow form state
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTrigger, setNewTrigger] = useState<TriggerType>('Manual');

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'workflows', label: 'My Workflows', icon: <Workflow size={15} /> },
    { key: 'templates', label: 'Templates', icon: <LayoutGrid size={15} /> },
    { key: 'builder', label: 'Builder', icon: <GitBranch size={15} /> },
    { key: 'runs', label: 'Runs', icon: <Activity size={15} /> },
    { key: 'rules', label: 'Automation Rules', icon: <Zap size={15} /> },
  ];

  // ── Filtered data ────────────────────────────────────────────────────

  const filteredWorkflows = useMemo(() => {
    return MOCK_WORKFLOWS.filter(w => {
      if (statusFilter !== 'all' && w.status !== statusFilter) return false;
      if (searchQuery && !w.name.toLowerCase().includes(searchQuery.toLowerCase()) && !w.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [searchQuery, statusFilter]);

  const filteredTemplates = useMemo(() => {
    return MOCK_TEMPLATES.filter(t => {
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase()) && !t.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [searchQuery, categoryFilter]);

  const filteredRuns = useMemo(() => {
    return MOCK_RUNS.filter(r => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (searchQuery && !r.workflowName.toLowerCase().includes(searchQuery.toLowerCase()) && !r.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [searchQuery, statusFilter]);

  const filteredRules = useMemo(() => {
    return MOCK_RULES.filter(r => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (searchQuery && !r.name.toLowerCase().includes(searchQuery.toLowerCase()) && !r.triggerEvent.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [searchQuery, statusFilter]);

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
          <Plus size={16} /> Create Workflow
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
                <div><span className="text-slate-500">Last run: </span><span className="text-slate-300">{wf.lastRun}</span></div>
                <div><span className="text-slate-500">Next run: </span><span className="text-slate-300">{wf.nextRun}</span></div>
                <div className="col-span-2">
                  <span className="text-slate-500">Success rate: </span>
                  <span className={wf.successRate >= 90 ? 'text-emerald-400' : wf.successRate >= 70 ? 'text-amber-400' : 'text-red-400'}>{wf.successRate}%</span>
                </div>
              </div>
              <div className="flex items-center gap-1 border-t border-slate-700 pt-3">
                <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" title="Edit"><Edit3 size={14} /></button>
                <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" title="Duplicate"><Copy size={14} /></button>
                <button className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 rounded transition-colors" title="Run"><Play size={14} /></button>
                <button className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors ml-auto" title="Delete"><Trash2 size={14} /></button>
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
                      <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded" title="Duplicate"><Copy size={14} /></button>
                      <button className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 rounded" title="Run"><Play size={14} /></button>
                      <button className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded" title="Delete"><Trash2 size={14} /></button>
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
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors">
                <Download size={12} /> Use Template
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
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-grab text-sm ${nodeTypeColor(np.type)} hover:opacity-80 transition-opacity`}
              >
                {nodeTypeIcon(np.type)}
                <span className="text-white text-xs">{np.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-700">
            <p className="text-xs text-slate-500">Drag a node type onto the canvas or click the + buttons between steps to insert.</p>
          </div>
        </div>
      </div>

      {/* Workflow Canvas */}
      <div className="flex-1 min-w-0">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-white font-medium">Incident Response Triage</h3>
              <p className="text-slate-400 text-xs mt-1">Visual workflow editor - 6 nodes</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs transition-colors">
                <Eye size={14} /> Preview
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs transition-colors">
                <Play size={14} /> Test Run
              </button>
            </div>
          </div>

          {/* Vertical Node Flow */}
          <div className="flex flex-col items-center">
            {MOCK_BUILDER_NODES.map((node, idx) => (
              <React.Fragment key={node.id}>
                {/* Node Card */}
                <div className={`w-full max-w-lg border-l-4 rounded-lg p-4 bg-slate-800 border border-slate-700 ${nodeTypeColor(node.type)} relative`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-700 text-xs text-white font-bold">{node.step}</div>
                    {nodeTypeIcon(node.type)}
                    <span className={`px-2 py-0.5 text-xs rounded ${nodeTypeColor(node.type)}`}>{node.type}</span>
                    <span className="text-white text-sm font-medium flex-1">{node.title}</span>
                    <button className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700"><Settings size={14} /></button>
                  </div>
                  <p className="text-slate-400 text-xs ml-10">{node.configSummary}</p>
                </div>

                {/* Connector + Add Button */}
                {idx < MOCK_BUILDER_NODES.length - 1 && (
                  <div className="flex flex-col items-center py-1">
                    <div className="w-px h-4 bg-slate-600" />
                    <button className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-700 border border-slate-600 text-slate-400 hover:text-white hover:border-blue-500 hover:bg-blue-600/20 transition-colors">
                      <Plus size={12} />
                    </button>
                    <div className="w-px h-4 bg-slate-600" />
                    <ArrowDown size={14} className="text-slate-600" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Add node at end */}
          <div className="flex flex-col items-center pt-2">
            <div className="w-px h-4 bg-slate-600" />
            <button className="flex items-center gap-2 px-4 py-2 border border-dashed border-slate-600 rounded-lg text-slate-400 hover:text-white hover:border-blue-500 transition-colors text-xs">
              <Plus size={14} /> Add Node
            </button>
          </div>
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
          <div className="text-2xl font-bold text-white">{MOCK_RUNS.length}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-emerald-400 text-sm mb-1"><CheckCircle size={14} /> Completed</div>
          <div className="text-2xl font-bold text-emerald-400">{MOCK_RUNS.filter(r => r.status === 'Completed').length}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-400 text-sm mb-1"><XCircle size={14} /> Failed</div>
          <div className="text-2xl font-bold text-red-400">{MOCK_RUNS.filter(r => r.status === 'Failed').length}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-400 text-sm mb-1"><RefreshCw size={14} /> Running</div>
          <div className="text-2xl font-bold text-blue-400">{MOCK_RUNS.filter(r => r.status === 'Running').length}</div>
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
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
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
                <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded" title="Edit"><Edit3 size={14} /></button>
                <button className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded" title="Delete"><Trash2 size={14} /></button>
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
            <h3 className="text-lg font-semibold text-white">Create Workflow</h3>
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
            <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
            <button
              onClick={() => { setShowCreateModal(false); setNewName(''); setNewDescription(''); setNewTrigger('Manual'); }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors font-medium"
            >
              Create Workflow
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Run Detail Modal ─────────────────────────────────────────────────

  const renderRunDetailModal = () => {
    if (!selectedRun) return null;
    const steps = MOCK_BUILDER_NODES.slice(0, selectedRun.stepsTotal);
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
              <div className="space-y-2">
                {steps.map((step, idx) => {
                  const isCompleted = idx < selectedRun.stepsCompleted;
                  const isCurrent = idx === selectedRun.stepsCompleted && selectedRun.status === 'Running';
                  const isFailed = idx === selectedRun.stepsCompleted - 1 && selectedRun.status === 'Failed';
                  return (
                    <div key={step.id} className={`flex items-center gap-3 p-3 rounded-lg border ${isCompleted && !isFailed ? 'bg-emerald-500/5 border-emerald-500/20' : isCurrent ? 'bg-blue-500/5 border-blue-500/20' : isFailed ? 'bg-red-500/5 border-red-500/20' : 'bg-slate-900 border-slate-700'}`}>
                      <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${isCompleted && !isFailed ? 'bg-emerald-500/20 text-emerald-400' : isCurrent ? 'bg-blue-500/20 text-blue-400' : isFailed ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-500'}`}>
                        {isCompleted && !isFailed ? <CheckCircle size={14} /> : isFailed ? <XCircle size={14} /> : isCurrent ? <RefreshCw size={14} className="animate-spin" /> : step.step}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white">{step.title}</span>
                          <span className={`px-1.5 py-0.5 text-xs rounded ${nodeTypeColor(step.type)}`}>{step.type}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{step.configSummary}</p>
                      </div>
                      <span className={`text-xs ${isCompleted && !isFailed ? 'text-emerald-400' : isFailed ? 'text-red-400' : isCurrent ? 'text-blue-400' : 'text-slate-600'}`}>
                        {isCompleted && !isFailed ? 'Done' : isFailed ? 'Failed' : isCurrent ? 'Running' : 'Pending'}
                      </span>
                    </div>
                  );
                })}
              </div>
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
                <span className="text-sm">Back</span>
              </button>
              <div className="h-5 w-px bg-slate-700" />
              <div className="flex items-center gap-2">
                <Workflow className="w-5 h-5 text-blue-400" />
                <h1 className="text-lg font-semibold text-white">Workflow Builder</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{MOCK_WORKFLOWS.filter(w => w.status === 'Active').length} active workflows</span>
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

        {activeTab === 'workflows' && renderWorkflows()}
        {activeTab === 'templates' && renderTemplates()}
        {activeTab === 'builder' && renderBuilder()}
        {activeTab === 'runs' && renderRuns()}
        {activeTab === 'rules' && renderRules()}
      </div>

      {renderCreateModal()}
      {renderRunDetailModal()}
    </div>
  );
};

export default WorkflowBuilder;
