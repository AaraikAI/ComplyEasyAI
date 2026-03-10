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

import React, { useState, useMemo, useCallback } from 'react';
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

// ── Mock Data ───────────────────────────────────────────────────────────────

const initialIncidents: Incident[] = [
  {
    id: 'INC-001',
    title: 'Unauthorized API Access Detected',
    description: 'Multiple failed authentication attempts detected from suspicious IP ranges targeting the customer API.',
    severity: 'SEV2',
    status: 'Contained',
    category: 'UNAUTHORIZED_ACCESS',
    detectedAt: '2025-12-15T08:30:00Z',
    triagedAt: '2025-12-15T08:45:00Z',
    containedAt: '2025-12-15T09:15:00Z',
    eradicatedAt: null,
    recoveredAt: null,
    closedAt: null,
    assignedTo: 'Sarah Chen',
    reporter: 'SIEM Alert',
    affectedSystems: ['Customer API', 'Auth Service'],
    timeline: [
      { id: 'e1', timestamp: '2025-12-15T08:30:00Z', action: 'Incident Detected', actor: 'SIEM', details: 'Anomalous authentication pattern detected' },
      { id: 'e2', timestamp: '2025-12-15T08:45:00Z', action: 'Triaged', actor: 'Sarah Chen', details: 'Confirmed as SEV-2, assigned to security team' },
      { id: 'e3', timestamp: '2025-12-15T09:15:00Z', action: 'Contained', actor: 'Sarah Chen', details: 'Blocked offending IP ranges at WAF level' },
    ],
    tasks: [
      { id: 't1', title: 'Block IP ranges at WAF', assignee: 'Sarah Chen', status: 'Done', dueDate: '2025-12-15' },
      { id: 't2', title: 'Review access logs for data exfiltration', assignee: 'Mike Johnson', status: 'InProgress', dueDate: '2025-12-16' },
      { id: 't3', title: 'Rotate affected API keys', assignee: 'Sarah Chen', status: 'Pending', dueDate: '2025-12-16' },
    ],
  },
  {
    id: 'INC-002',
    title: 'Phishing Campaign Targeting Employees',
    description: 'Coordinated phishing campaign detected targeting finance department with credential harvesting links.',
    severity: 'SEV1',
    status: 'Triaged',
    category: 'PHISHING',
    detectedAt: '2025-12-18T14:00:00Z',
    triagedAt: '2025-12-18T14:15:00Z',
    containedAt: null,
    eradicatedAt: null,
    recoveredAt: null,
    closedAt: null,
    assignedTo: 'James Wilson',
    reporter: 'Employee Report',
    affectedSystems: ['Email Gateway', 'Active Directory'],
    timeline: [
      { id: 'e4', timestamp: '2025-12-18T14:00:00Z', action: 'Incident Detected', actor: 'Employee Report', details: 'Finance team member reported suspicious email' },
      { id: 'e5', timestamp: '2025-12-18T14:15:00Z', action: 'Triaged', actor: 'James Wilson', details: 'Escalated to SEV-1, multiple employees affected' },
    ],
    tasks: [
      { id: 't4', title: 'Quarantine phishing emails', assignee: 'James Wilson', status: 'InProgress', dueDate: '2025-12-18' },
      { id: 't5', title: 'Reset credentials for affected users', assignee: 'Help Desk', status: 'Pending', dueDate: '2025-12-18' },
    ],
  },
  {
    id: 'INC-003',
    title: 'Database Performance Degradation',
    description: 'Primary database cluster experiencing severe performance degradation affecting customer-facing services.',
    severity: 'SEV3',
    status: 'Closed',
    category: 'SYSTEM_FAILURE',
    detectedAt: '2025-12-10T06:00:00Z',
    triagedAt: '2025-12-10T06:20:00Z',
    containedAt: '2025-12-10T07:00:00Z',
    eradicatedAt: '2025-12-10T09:00:00Z',
    recoveredAt: '2025-12-10T10:00:00Z',
    closedAt: '2025-12-11T14:00:00Z',
    assignedTo: 'Alex Kumar',
    reporter: 'Monitoring Alert',
    affectedSystems: ['PostgreSQL Cluster', 'Application Backend'],
    timeline: [
      { id: 'e6', timestamp: '2025-12-10T06:00:00Z', action: 'Incident Detected', actor: 'Datadog Alert', details: 'Query latency exceeded 5s threshold' },
      { id: 'e7', timestamp: '2025-12-10T06:20:00Z', action: 'Triaged', actor: 'Alex Kumar', details: 'Root cause: runaway query from batch job' },
      { id: 'e8', timestamp: '2025-12-10T07:00:00Z', action: 'Contained', actor: 'Alex Kumar', details: 'Killed runaway queries, throttled batch job' },
      { id: 'e9', timestamp: '2025-12-10T09:00:00Z', action: 'Eradicated', actor: 'Alex Kumar', details: 'Fixed batch job query with proper indexes' },
      { id: 'e10', timestamp: '2025-12-10T10:00:00Z', action: 'Recovered', actor: 'Alex Kumar', details: 'All services restored to normal' },
      { id: 'e11', timestamp: '2025-12-11T14:00:00Z', action: 'Closed', actor: 'Alex Kumar', details: 'Post-incident review completed' },
    ],
    tasks: [
      { id: 't6', title: 'Kill runaway queries', assignee: 'Alex Kumar', status: 'Done', dueDate: '2025-12-10' },
      { id: 't7', title: 'Add missing indexes', assignee: 'Alex Kumar', status: 'Done', dueDate: '2025-12-10' },
      { id: 't8', title: 'Write post-mortem', assignee: 'Alex Kumar', status: 'Done', dueDate: '2025-12-11' },
    ],
  },
  {
    id: 'INC-004',
    title: 'Malware Detected on Engineering Workstation',
    description: 'Endpoint protection flagged trojan on developer workstation with potential lateral movement.',
    severity: 'SEV2',
    status: 'Eradicated',
    category: 'MALWARE',
    detectedAt: '2025-12-19T10:30:00Z',
    triagedAt: '2025-12-19T10:40:00Z',
    containedAt: '2025-12-19T11:00:00Z',
    eradicatedAt: '2025-12-19T14:00:00Z',
    recoveredAt: null,
    closedAt: null,
    assignedTo: 'Sarah Chen',
    reporter: 'CrowdStrike Alert',
    affectedSystems: ['Dev Workstation W-1042', 'Internal Network'],
    timeline: [
      { id: 'e12', timestamp: '2025-12-19T10:30:00Z', action: 'Incident Detected', actor: 'CrowdStrike', details: 'Trojan.GenericKD detected on endpoint' },
      { id: 'e13', timestamp: '2025-12-19T10:40:00Z', action: 'Triaged', actor: 'Sarah Chen', details: 'Isolated workstation from network' },
      { id: 'e14', timestamp: '2025-12-19T11:00:00Z', action: 'Contained', actor: 'Sarah Chen', details: 'Network segment isolated, no lateral movement confirmed' },
      { id: 'e15', timestamp: '2025-12-19T14:00:00Z', action: 'Eradicated', actor: 'Sarah Chen', details: 'Workstation reimaged, credentials rotated' },
    ],
    tasks: [
      { id: 't9', title: 'Isolate workstation', assignee: 'Sarah Chen', status: 'Done', dueDate: '2025-12-19' },
      { id: 't10', title: 'Scan adjacent systems', assignee: 'Mike Johnson', status: 'Done', dueDate: '2025-12-19' },
      { id: 't11', title: 'Restore from clean image', assignee: 'IT Support', status: 'Done', dueDate: '2025-12-20' },
      { id: 't12', title: 'Validate no data exfiltration', assignee: 'Sarah Chen', status: 'InProgress', dueDate: '2025-12-20' },
    ],
  },
  {
    id: 'INC-005',
    title: 'Employee Data Leaked via Misconfigured S3 Bucket',
    description: 'Public-facing S3 bucket found containing employee PII due to infrastructure misconfiguration.',
    severity: 'SEV1',
    status: 'Recovered',
    category: 'DATA_BREACH',
    detectedAt: '2025-12-05T16:00:00Z',
    triagedAt: '2025-12-05T16:10:00Z',
    containedAt: '2025-12-05T16:20:00Z',
    eradicatedAt: '2025-12-05T17:00:00Z',
    recoveredAt: '2025-12-06T10:00:00Z',
    closedAt: null,
    assignedTo: 'James Wilson',
    reporter: 'Security Scanner',
    affectedSystems: ['AWS S3', 'HR Portal'],
    timeline: [
      { id: 'e16', timestamp: '2025-12-05T16:00:00Z', action: 'Incident Detected', actor: 'CloudSploit', details: 'Public S3 bucket with employee data found' },
      { id: 'e17', timestamp: '2025-12-05T16:10:00Z', action: 'Triaged', actor: 'James Wilson', details: 'Confirmed PII exposure, escalated to SEV-1' },
      { id: 'e18', timestamp: '2025-12-05T16:20:00Z', action: 'Contained', actor: 'James Wilson', details: 'Bucket access set to private' },
      { id: 'e19', timestamp: '2025-12-05T17:00:00Z', action: 'Eradicated', actor: 'DevOps', details: 'IaC templates corrected, bucket policies enforced' },
      { id: 'e20', timestamp: '2025-12-06T10:00:00Z', action: 'Recovered', actor: 'James Wilson', details: 'All affected employees notified, monitoring enhanced' },
    ],
    tasks: [
      { id: 't13', title: 'Lock down S3 bucket', assignee: 'James Wilson', status: 'Done', dueDate: '2025-12-05' },
      { id: 't14', title: 'Audit all S3 bucket policies', assignee: 'DevOps', status: 'Done', dueDate: '2025-12-06' },
      { id: 't15', title: 'Notify affected employees', assignee: 'HR', status: 'Done', dueDate: '2025-12-06' },
      { id: 't16', title: 'File regulatory notification', assignee: 'Legal', status: 'InProgress', dueDate: '2025-12-08' },
    ],
  },
];

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
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);
  const [activeTab, setActiveTab] = useState<TabId>('incidents');
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<IncidentSeverity | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<IncidentCategory | 'all'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [form, setForm] = useState<IncidentForm>(defaultForm);
  const [showFilters, setShowFilters] = useState(false);

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

  const handleCreateIncident = useCallback(() => {
    const newIncident: Incident = {
      id: `INC-${String(incidents.length + 1).padStart(3, '0')}`,
      title: form.title,
      description: form.description,
      severity: form.severity,
      status: 'Detected',
      category: form.category,
      detectedAt: new Date().toISOString(),
      triagedAt: null,
      containedAt: null,
      eradicatedAt: null,
      recoveredAt: null,
      closedAt: null,
      assignedTo: form.assignedTo,
      reporter: 'Manual Entry',
      affectedSystems: form.affectedSystems.split(',').map(s => s.trim()).filter(Boolean),
      timeline: [{
        id: `e-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'Incident Created',
        actor: 'Current User',
        details: `Incident created with severity ${form.severity}`,
      }],
      tasks: [],
    };
    setIncidents(prev => [newIncident, ...prev]);
    setShowCreateForm(false);
    setForm(defaultForm);
  }, [form, incidents.length]);

  const advanceStatus = useCallback((incidentId: string) => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id !== incidentId) return inc;
      const currentIdx = statusOrder.indexOf(inc.status);
      if (currentIdx >= statusOrder.length - 1) return inc;
      const nextStatus = statusOrder[currentIdx + 1];
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
        details: `Incident advanced from ${inc.status} to ${nextStatus}`,
      };
      return { ...inc, ...updates, timeline: [...inc.timeline, newEvent] };
    }));
    if (selectedIncident) {
      setSelectedIncident(prev => {
        if (!prev) return prev;
        const currentIdx = statusOrder.indexOf(prev.status);
        if (currentIdx >= statusOrder.length - 1) return prev;
        const nextStatus = statusOrder[currentIdx + 1];
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
          details: `Incident advanced from ${prev.status} to ${nextStatus}`,
        };
        return { ...prev, ...updates, timeline: [...prev.timeline, newEvent] };
      });
    }
  }, [selectedIncident]);

  const deleteIncident = useCallback((id: string) => {
    setIncidents(prev => prev.filter(i => i.id !== id));
    if (selectedIncident?.id === id) setSelectedIncident(null);
  }, [selectedIncident]);

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-900 dark:bg-slate-950 text-white p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-red-500/20 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Incident Management</h1>
            <p className="text-slate-400 text-sm">Track, manage, and resolve security incidents</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800 dark:bg-slate-900 rounded-xl border border-slate-700 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Total Incidents</span>
            <Activity className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold">{metrics.total}</div>
          <div className="text-xs text-slate-500 mt-1">{metrics.open} open</div>
        </div>
        <div className="bg-slate-800 dark:bg-slate-900 rounded-xl border border-slate-700 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Avg. MTTD</span>
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
            <span className="text-slate-400 text-sm">Avg. MTTR</span>
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
                placeholder="Search incidents..."
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
              <Filter className="w-4 h-4" /> Filters
            </button>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> New Incident
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
                <p>No incidents match your filters</p>
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
                <span className="text-xs text-slate-500">Assigned To</span>
                <p className="text-sm font-medium">{selectedIncident.assignedTo}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Reporter</span>
                <p className="text-sm font-medium">{selectedIncident.reporter}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Affected Systems</span>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {selectedIncident.affectedSystems.map(sys => (
                    <span key={sys} className="text-xs px-1.5 py-0.5 bg-slate-700 rounded">{sys}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400" /> Timeline</h3>
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
          <h2 className="text-lg font-semibold mb-4">Global Incident Timeline</h2>
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
                    <span className="text-xs text-slate-500 w-16">{item.open} open</span>
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
              <h2 className="text-lg font-semibold">Create New Incident</h2>
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
                <label className="block text-sm text-slate-400 mb-1">Description</label>
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
                  <label className="block text-sm text-slate-400 mb-1">Severity</label>
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
                <label className="block text-sm text-slate-400 mb-1">Assigned To</label>
                <input
                  type="text"
                  value={form.assignedTo}
                  onChange={e => setForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Assignee name"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Affected Systems (comma separated)</label>
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
                Cancel
              </button>
              <button
                onClick={handleCreateIncident}
                disabled={!form.title.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" /> Create Incident
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentManagement;
