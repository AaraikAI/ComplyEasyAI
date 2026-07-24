import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { api } from '../services/api';
import { logger } from '../utils/logger';
import {
  ArrowLeft,
  Trash2,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  Database,
  FileText,
  Settings,
  Plus,
  ChevronRight,
  RefreshCw,
  Download,
  Eye,
  RotateCcw,
  User,
  Mail,
  BarChart3,
  Server,
  Globe,
  HardDrive,
  X,
  Filter,
  Calendar,
  Lock,
  Unlock,
  Activity,
  Info,
} from 'lucide-react';

interface AccountDeletionWorkflowProps {
  onBack: () => void;
}

type TabId = 'overview' | 'requests' | 'execution' | 'audit' | 'settings';

type RequestStatus = 'Submitted' | 'Verified' | 'Located' | 'Review' | 'Approved' | 'Executing' | 'Completed' | 'Denied';

interface DeletionRequest {
  id: string;
  accountName: string;
  email: string;
  submittedDate: string;
  status: RequestStatus;
  reason: string;
  dataLocations: string[];
  conflicts: string[];
  assignedTo: string;
  priority: 'High' | 'Medium' | 'Low';
  estimatedCompletion: string;
}

interface SystemDeletion {
  system: string;
  icon: React.ReactNode;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Failed' | 'Verified';
  records: number;
  deletedAt?: string;
  verifiedBy?: string;
  evidence?: string;
  rollbackAvailable: boolean;
}

interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  requestId: string;
  details: string;
  category: 'status_change' | 'verification' | 'deletion' | 'review' | 'system';
}

const STATUS_FLOW: RequestStatus[] = ['Submitted', 'Verified', 'Located', 'Review', 'Approved', 'Executing', 'Completed'];

const statusColors: Record<RequestStatus, string> = {
  Submitted: 'bg-signal-blue/20 text-signal-blue border-signal-blue/30',
  Verified: 'bg-signal-blue/20 text-signal-blue border-signal-blue/30',
  Located: 'bg-signal-violet/20 text-signal-violet border-signal-violet/30',
  Review: 'bg-signal-warn/20 text-signal-warn border-signal-warn/30',
  Approved: 'bg-signal-good/20 text-signal-good border-signal-good/30',
  Executing: 'bg-signal-warn/20 text-signal-warn border-signal-warn/30',
  Completed: 'bg-signal-good/20 text-signal-good border-signal-good/30',
  Denied: 'bg-signal-bad/20 text-signal-bad border-signal-bad/30',
};

// Component initializes with empty state and populates from the privacy API with full error handling.

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'requests', label: 'Requests', icon: <FileText className="w-4 h-4" /> },
  { id: 'execution', label: 'Execution', icon: <Server className="w-4 h-4" /> },
  { id: 'audit', label: 'Audit', icon: <Shield className="w-4 h-4" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
];

export const AccountDeletionWorkflow: React.FC<AccountDeletionWorkflowProps> = ({ onBack }) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'All'>('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<DeletionRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  const [systemDeletions, setSystemDeletions] = useState<SystemDeletion[]>([]);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [createForm, setCreateForm] = useState({ accountName: '', email: '', reason: 'GDPR Right to Erasure', priority: 'Medium' as 'High' | 'Medium' | 'Low', notes: '' });
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [deletionRes, auditRes] = await Promise.allSettled([
        api.privacy.listDeletions(),
        api.privacy.getDeletionAuditLog(),
      ]);
      const failures: string[] = [];
      if (deletionRes.status === 'fulfilled') {
        const d = deletionRes.value;
        if (Array.isArray(d)) setRequests(d);
        else if (d?.data) setRequests(d.data);
      } else {
        failures.push('deletion requests');
      }
      if (auditRes.status === 'fulfilled') {
        const d = auditRes.value;
        if (Array.isArray(d)) setAuditEntries(d);
        else if (d?.data) setAuditEntries(d.data);
      } else {
        failures.push('audit log');
      }
      if (failures.length > 0) {
        setLoadError(`Failed to load ${failures.join(' and ')}. Some data may be incomplete.`);
      }
    } catch (err) {
      setLoadError('Failed to connect to the server. Please check your connection and try again.');
      logger.error('AccountDeletionWorkflow data load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Derive a system icon from the system/datastore name.
  const iconForSystem = useCallback((name: string): React.ReactNode => {
    const n = name.toLowerCase();
    if (n.includes('db') || n.includes('database') || n.includes('postgres') || n.includes('sql')) return <Database className="w-4 h-4 text-signal-blue" />;
    if (n.includes('s3') || n.includes('storage') || n.includes('blob') || n.includes('disk')) return <HardDrive className="w-4 h-4 text-signal-violet" />;
    if (n.includes('cdn') || n.includes('web') || n.includes('http') || n.includes('api')) return <Globe className="w-4 h-4 text-signal-blue" />;
    return <Server className="w-4 h-4 text-signal-muted" />;
  }, []);

  // Map the backend deletion record's systemsAffected + deletionLog into per-system rows.
  const mapSystemDeletions = useCallback((record: any): SystemDeletion[] => {
    const affected: any[] = Array.isArray(record?.systemsAffected) ? record.systemsAffected : [];
    const log: any[] = Array.isArray(record?.deletionLog) ? record.deletionLog : [];
    return affected.map((sys: any) => {
      const systemName = typeof sys === 'string' ? sys : (sys.system || sys.name || 'Unknown System');
      const logEntry = log.find((l: any) => (l.system || l.target) === systemName);
      const status: SystemDeletion['status'] =
        (typeof sys === 'object' && sys.status) ? sys.status
        : logEntry?.status === 'verified' ? 'Verified'
        : logEntry ? 'Completed'
        : record?.status === 'Completed' ? 'Completed'
        : record?.status === 'InProgress' ? 'In Progress'
        : 'Pending';
      return {
        system: systemName,
        icon: iconForSystem(systemName),
        status,
        records: typeof sys === 'object' && typeof sys.records === 'number' ? sys.records : 0,
        deletedAt: logEntry?.timestamp || (typeof sys === 'object' ? sys.deletedAt : undefined),
        verifiedBy: logEntry?.userId || (typeof sys === 'object' ? sys.verifiedBy : undefined),
        evidence: logEntry?.evidence || (typeof sys === 'object' ? sys.evidence : undefined),
        rollbackAvailable: status !== 'Verified',
      };
    });
  }, [iconForSystem]);

  const loadExecutionDetail = useCallback(async (requestId: string) => {
    if (!requestId) { setSystemDeletions([]); return; }
    setExecLoading(true);
    try {
      const record = await api.privacy.getDeletion(requestId);
      setSystemDeletions(mapSystemDeletions(record));
    } catch (err) {
      setSystemDeletions([]);
      logger.error('Failed to load deletion execution detail:', err);
    } finally {
      setExecLoading(false);
    }
  }, [mapSystemDeletions]);

  const [gracePeriodDays, setGracePeriodDays] = useState(7);
  const [deletionMethod, setDeletionMethod] = useState<'deletion' | 'anonymization'>('deletion');
  const [autoVerify, setAutoVerify] = useState(true);
  const [notifyOnComplete, setNotifyOnComplete] = useState(true);
  const [notifyOnDenied, setNotifyOnDenied] = useState(true);
  const [retentionOverride, setRetentionOverride] = useState(false);
  const [auditCategoryFilter, setAuditCategoryFilter] = useState<string>('all');
  const [selectedExecRequest, setSelectedExecRequest] = useState<string>('');
  const [execLoading, setExecLoading] = useState(false);

  useEffect(() => { loadExecutionDetail(selectedExecRequest); }, [selectedExecRequest, loadExecutionDetail]);

  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter(r => r.status === 'Submitted').length;
    const inProgress = requests.filter(r => !['Submitted', 'Completed', 'Denied'].includes(r.status)).length;
    const completed = requests.filter(r => r.status === 'Completed').length;
    const denied = requests.filter(r => r.status === 'Denied').length;
    const withConflicts = requests.filter(r => r.conflicts.length > 0).length;
    // Derive average processing time (days) from completed requests' submission
    // and completion dates rather than presenting a fixed value as a live metric.
    const completedRequests = requests.filter(r => r.status === 'Completed' && r.submittedDate && r.estimatedCompletion);
    const durations = completedRequests
      .map(r => {
        const start = new Date(r.submittedDate).getTime();
        const end = new Date(r.estimatedCompletion).getTime();
        return Number.isFinite(start) && Number.isFinite(end) && end >= start
          ? (end - start) / (1000 * 60 * 60 * 24)
          : null;
      })
      .filter((d): d is number => d !== null);
    const avgProcessingDays = durations.length > 0
      ? Math.round((durations.reduce((sum, d) => sum + d, 0) / durations.length) * 10) / 10
      : null;
    return { total, pending, inProgress, completed, denied, avgProcessingDays, withConflicts };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      const matchesSearch = searchQuery === '' ||
        r.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [requests, searchQuery, statusFilter]);

  const filteredAudit = useMemo(() => {
    if (auditCategoryFilter === 'all') return auditEntries;
    return auditEntries.filter(a => a.category === auditCategoryFilter);
  }, [auditEntries, auditCategoryFilter]);

  // Derive verification certificates from completed/denied deletion requests.
  // A certificate is "Issued" once the request is fully Completed, otherwise it
  // reflects the in-progress state. This replaces any static placeholder list.
  const verificationCertificates = useMemo(() => {
    return requests
      .filter(r => r.status === 'Completed' || r.status === 'Denied')
      .map(r => ({
        id: `CERT-${r.id}-${r.status === 'Completed' ? 'FULL' : 'DENIED'}`,
        request: r.id,
        date: r.estimatedCompletion || r.submittedDate,
        status: r.status === 'Completed' ? 'Issued' : 'Denied',
      }));
  }, [requests]);

  // Derive compliance-evidence counts from the loaded deletion requests' reasons
  // and the audit log, rather than presenting fixed numbers as live data.
  const complianceEvidence = useMemo(() => {
    const reasonMatches = (needle: string) =>
      requests.filter(r => (r.reason || '').toLowerCase().includes(needle)).length;
    const completedCount = requests.filter(r => r.status === 'Completed').length;
    const dataMappingCount = auditEntries.filter(a => a.category === 'system' || a.category === 'verification').length;
    return [
      { label: 'GDPR Art. 17 Compliance', count: reasonMatches('gdpr') || reasonMatches('erasure'), color: 'text-signal-blue' },
      { label: 'CCPA Deletion Records', count: reasonMatches('ccpa'), color: 'text-signal-violet' },
      { label: 'Data Mapping Reports', count: dataMappingCount, color: 'text-signal-blue' },
      { label: 'Erasure Confirmation Letters', count: completedCount, color: 'text-signal-good' },
    ];
  }, [requests, auditEntries]);

  // Export the audit log as a CSV the operator can download. Cells are escaped
  // and formula-prefixed cells neutralized to avoid CSV-injection on open.
  const handleExportAudit = useCallback(() => {
    const escapeCell = (value: string) => {
      const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
      return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
    };
    const header = ['ID', 'Timestamp', 'Category', 'Action', 'User', 'Request', 'Details'];
    const rows = filteredAudit.map(a => [a.id, a.timestamp, a.category, a.action, a.user, a.requestId, a.details]);
    const csv = [header, ...rows].map(r => r.map(c => escapeCell(String(c ?? ''))).join(',')).join('\n');
    try {
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `deletion-audit-log-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      logger.error('Failed to export deletion audit log:', err);
    }
  }, [filteredAudit]);

  // Download a single verification certificate as a self-contained HTML document
  // built from the originating request's loaded data.
  const handleDownloadCertificate = useCallback((cert: { id: string; request: string; date: string; status: string }) => {
    const req = requests.find(r => r.id === cert.request);
    const esc = (s: string) => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string));
    const lines: [string, string][] = [
      ['Certificate ID', cert.id],
      ['Request ID', cert.request],
      ['Account', req?.accountName || cert.request],
      ['Email', req?.email || '—'],
      ['Reason', req?.reason || '—'],
      ['Status', cert.status],
      ['Date', cert.date],
    ];
    const body = lines.map(([k, v]) => `<tr><th style="text-align:left;padding:6px 12px;border-bottom:1px solid #e5e7eb">${esc(k)}</th><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb">${esc(v)}</td></tr>`).join('');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(cert.id)}</title>` +
      `<style>body{font-family:system-ui,Arial,sans-serif;padding:32px;max-width:720px;margin:auto}h1{font-size:18px}table{border-collapse:collapse;width:100%;margin-top:16px}</style></head>` +
      `<body><h1>Data Deletion Verification Certificate</h1><table>${body}</table></body></html>`;
    try {
      const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${cert.id}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      logger.error('Failed to download verification certificate:', err);
    }
  }, [requests]);

  const systemStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-signal-good';
      case 'Verified': return 'text-signal-good';
      case 'In Progress': return 'text-signal-warn';
      case 'Pending': return 'text-signal-muted';
      case 'Failed': return 'text-signal-bad';
      default: return 'text-signal-muted';
    }
  };

  const auditCategoryColor = (cat: string) => {
    switch (cat) {
      case 'status_change': return 'bg-signal-blue/20 text-signal-blue';
      case 'verification': return 'bg-signal-good/20 text-signal-good';
      case 'deletion': return 'bg-signal-bad/20 text-signal-bad';
      case 'review': return 'bg-signal-warn/20 text-signal-warn';
      case 'system': return 'bg-white/[0.06] text-signal-muted';
      default: return 'bg-white/[0.06] text-signal-muted';
    }
  };

  const getStatusStepIndex = (status: RequestStatus) => {
    if (status === 'Denied') return -1;
    return STATUS_FLOW.indexOf(status);
  };

  const renderStatusFlow = (currentStatus: RequestStatus) => {
    const currentIdx = getStatusStepIndex(currentStatus);
    if (currentStatus === 'Denied') {
      return (
        <div className="flex items-center gap-1 mt-2">
          {STATUS_FLOW.slice(0, 4).map((step, idx) => (
            <React.Fragment key={step}>
              <div className={`text-xs px-2 py-0.5 rounded ${idx < 4 ? 'bg-white/[0.06] text-signal-muted' : ''}`}>
                {step}
              </div>
              {idx < 3 && <ChevronRight className="w-3 h-3 text-signal-muted" />}
            </React.Fragment>
          ))}
          <ChevronRight className="w-3 h-3 text-signal-muted" />
          <div className="text-xs px-2 py-0.5 rounded bg-signal-bad/20 text-signal-bad font-medium">Denied</div>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 mt-2 flex-wrap">
        {STATUS_FLOW.map((step, idx) => (
          <React.Fragment key={step}>
            <div className={`text-xs px-2 py-0.5 rounded ${
              idx < currentIdx ? 'bg-signal-good/20 text-signal-good' :
              idx === currentIdx ? 'bg-signal-blue/20 text-signal-blue font-medium ring-1 ring-signal-blue/40' :
              'bg-white/[0.06] text-signal-muted'
            }`}>
              {step}
            </div>
            {idx < STATUS_FLOW.length - 1 && <ChevronRight className="w-3 h-3 text-signal-muted" />}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
          <div className="flex items-center gap-2 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em] mb-2">
            <FileText className="w-4 h-4" /> Total Requests
          </div>
          <div className="text-3xl font-display font-bold text-signal-ink">{stats.total}</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
          <div className="flex items-center gap-2 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em] mb-2">
            <Clock className="w-4 h-4" /> Pending
          </div>
          <div className="text-3xl font-display font-bold text-signal-warn">{stats.pending}</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
          <div className="flex items-center gap-2 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em] mb-2">
            <RefreshCw className="w-4 h-4" /> In Progress
          </div>
          <div className="text-3xl font-display font-bold text-signal-blue">{stats.inProgress}</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
          <div className="flex items-center gap-2 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em] mb-2">
            <CheckCircle className="w-4 h-4" /> Completed
          </div>
          <div className="text-3xl font-display font-bold text-signal-good">{stats.completed}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
          <div className="flex items-center gap-2 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em] mb-2">
            <XCircle className="w-4 h-4" /> Denied
          </div>
          <div className="text-2xl font-display font-bold text-signal-bad">{stats.denied}</div>
          <div className="text-xs text-signal-muted mt-1">Due to legal holds or conflicts</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
          <div className="flex items-center gap-2 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em] mb-2">
            <Clock className="w-4 h-4" /> Avg Processing Time
          </div>
          <div className="text-2xl font-display font-bold text-signal-blue">{stats.avgProcessingDays !== null ? `${stats.avgProcessingDays} days` : '—'}</div>
          <div className="text-xs text-signal-muted mt-1">From submission to completion</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
          <div className="flex items-center gap-2 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em] mb-2">
            <AlertTriangle className="w-4 h-4" /> Retention Hold Conflicts
          </div>
          <div className="text-2xl font-display font-bold text-signal-warn">{stats.withConflicts}</div>
          <div className="text-xs text-signal-muted mt-1">Requests with active conflicts</div>
        </div>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
        <h3 className="text-sm font-medium text-signal-ink mb-3">Status Distribution</h3>
        <div className="space-y-2">
          {(['Submitted', 'Verified', 'Located', 'Review', 'Approved', 'Executing', 'Completed', 'Denied'] as RequestStatus[]).map(status => {
            const count = requests.filter(r => r.status === status).length;
            const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
            return (
              <div key={status} className="flex items-center gap-3">
                <div className="w-24 text-xs text-signal-muted">{status}</div>
                <div className="flex-1 bg-white/[0.06] rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      status === 'Completed' ? 'bg-signal-good' :
                      status === 'Denied' ? 'bg-signal-bad' :
                      status === 'Executing' ? 'bg-signal-warn' :
                      status === 'Submitted' ? 'bg-signal-blue' :
                      'bg-signal-blue'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="w-8 text-xs text-signal-muted text-right">{count}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
        <h3 className="text-sm font-medium text-signal-ink mb-3">Recent Activity</h3>
        <div className="space-y-2">
          {auditEntries.slice(0, 5).map(entry => (
            <div key={entry.id} className="flex items-start gap-3 text-sm">
              <div className="text-xs text-signal-muted whitespace-nowrap mt-0.5">{entry.timestamp}</div>
              <div className="text-signal-body">{entry.action}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCreateModal = () => {
    if (!showCreateModal) return null;
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-signal-panel2 border border-white/[0.08] rounded-2xl p-6 w-full max-w-lg mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-signal-ink">{t('privacy.accountDeletion')}</h3>
            <button onClick={() => setShowCreateModal(false)} className="text-signal-muted hover:text-signal-ink">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            {createError && (
              <div className="p-3 bg-signal-bad/10 border border-signal-bad/30 rounded text-sm text-signal-bad flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {createError}
              </div>
            )}
            <div>
              <label className="block text-sm text-signal-muted mb-1">Account Name</label>
              <input type="text" value={createForm.accountName} onChange={(e) => setCreateForm(f => ({ ...f, accountName: e.target.value }))} className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-signal-ink text-sm focus:outline-none focus:border-signal-green/60" placeholder="Full name" />
            </div>
            <div>
              <label className="block text-sm text-signal-muted mb-1">Email Address</label>
              <input type="email" value={createForm.email} onChange={(e) => setCreateForm(f => ({ ...f, email: e.target.value }))} className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-signal-ink text-sm focus:outline-none focus:border-signal-green/60" placeholder="user@example.com" />
            </div>
            <div>
              <label className="block text-sm text-signal-muted mb-1">Reason</label>
              <select value={createForm.reason} onChange={(e) => setCreateForm(f => ({ ...f, reason: e.target.value }))} className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-signal-ink text-sm focus:outline-none focus:border-signal-green/60">
                <option>GDPR Right to Erasure</option>
                <option>CCPA deletion request</option>
                <option>Account closure request</option>
                <option>User-initiated deletion</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-signal-muted mb-1">Priority</label>
              <select value={createForm.priority} onChange={(e) => setCreateForm(f => ({ ...f, priority: e.target.value as 'High' | 'Medium' | 'Low' }))} className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-signal-ink text-sm focus:outline-none focus:border-signal-green/60">
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-signal-muted mb-1">Additional Notes</label>
              <textarea value={createForm.notes} onChange={(e) => setCreateForm(f => ({ ...f, notes: e.target.value }))} className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-signal-ink text-sm focus:outline-none focus:border-signal-green/60 h-20 resize-none" placeholder="Any additional context..." />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => { setShowCreateModal(false); setCreateError(null); }} className="px-4 py-2 text-sm text-signal-muted hover:text-signal-ink transition-colors">
              {t('common.cancel')}
            </button>
            <button
              disabled={createSubmitting || !createForm.accountName.trim() || !createForm.email.trim()}
              onClick={async () => {
                setCreateError(null);
                setCreateSubmitting(true);
                try {
                  await api.privacy.createDeletion({
                    accountName: createForm.accountName.trim(),
                    email: createForm.email.trim(),
                    reason: createForm.reason,
                    priority: createForm.priority,
                    notes: createForm.notes.trim() || undefined,
                    status: 'Submitted',
                  });
                  setShowCreateModal(false);
                  setCreateForm({ accountName: '', email: '', reason: 'GDPR Right to Erasure', priority: 'Medium', notes: '' });
                  loadData();
                } catch (err) {
                  setCreateError(err instanceof Error ? err.message : 'Failed to submit deletion request. Please try again.');
                  logger.error('Create deletion request error:', err);
                } finally {
                  setCreateSubmitting(false);
                }
              }}
              className="px-4 py-2 text-sm bg-signal-green hover:bg-signal-green/90 text-signal-canvas font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createSubmitting ? `${t('common.loading')}...` : t('common.submit')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderRequestDetail = () => {
    if (!selectedRequest) return null;
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-signal-panel2 border border-white/[0.08] rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-signal-ink">{selectedRequest.id} - {selectedRequest.accountName}</h3>
            <button onClick={() => setSelectedRequest(null)} className="text-signal-muted hover:text-signal-ink">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-signal-muted">Email</div>
                <div className="text-sm text-signal-ink">{selectedRequest.email}</div>
              </div>
              <div>
                <div className="text-xs text-signal-muted">Submitted</div>
                <div className="text-sm text-signal-ink">{selectedRequest.submittedDate}</div>
              </div>
              <div>
                <div className="text-xs text-signal-muted">Reason</div>
                <div className="text-sm text-signal-ink">{selectedRequest.reason}</div>
              </div>
              <div>
                <div className="text-xs text-signal-muted">Assigned To</div>
                <div className="text-sm text-signal-ink">{selectedRequest.assignedTo}</div>
              </div>
              <div>
                <div className="text-xs text-signal-muted">{t('common.priority')}</div>
                <div className={`text-sm ${selectedRequest.priority === 'High' ? 'text-signal-bad' : selectedRequest.priority === 'Medium' ? 'text-signal-warn' : 'text-signal-muted'}`}>
                  {selectedRequest.priority}
                </div>
              </div>
              <div>
                <div className="text-xs text-signal-muted">Est. Completion</div>
                <div className="text-sm text-signal-ink">{selectedRequest.estimatedCompletion}</div>
              </div>
            </div>

            <div>
              <div className="text-xs text-signal-muted mb-2">{t('common.status')}</div>
              {renderStatusFlow(selectedRequest.status)}
            </div>

            <div>
              <div className="text-xs text-signal-muted mb-2">{t('privacy.dataInventory')}</div>
              {selectedRequest.dataLocations.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedRequest.dataLocations.map(loc => (
                    <span key={loc} className="text-xs px-2 py-1 bg-white/[0.06] text-signal-body rounded">{loc}</span>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-signal-muted italic">Not yet located</div>
              )}
            </div>

            {selectedRequest.conflicts.length > 0 && (
              <div>
                <div className="text-xs text-signal-muted mb-2">Conflicts Detected</div>
                <div className="space-y-1">
                  {selectedRequest.conflicts.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-signal-warn">
                      <AlertTriangle className="w-3 h-3" /> {c}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setSelectedRequest(null)} className="px-4 py-2 text-sm text-signal-muted hover:text-signal-ink transition-colors">
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderRequests = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-signal-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg pl-9 pr-3 py-2 text-sm text-signal-ink placeholder-signal-muted focus:outline-none focus:border-signal-green/60"
              placeholder={`${t('common.search')}...`}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-signal-muted" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RequestStatus | 'All')}
              className="bg-white/[0.03] border border-white/[0.06] rounded-lg pl-9 pr-3 py-2 text-sm text-signal-ink focus:outline-none focus:border-signal-green/60 appearance-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              {[...STATUS_FLOW, 'Denied' as RequestStatus].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-signal-green hover:bg-signal-green/90 text-signal-canvas font-semibold text-sm rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> {t('common.create')}
        </button>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-12 text-center">
          <FileText className="w-10 h-10 text-signal-muted mx-auto mb-3" />
          <div className="text-signal-muted text-sm">No requests match your criteria</div>
          <div className="text-signal-muted text-xs mt-1">Try adjusting your search or filter</div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map(req => (
            <div
              key={req.id}
              onClick={() => setSelectedRequest(req)}
              className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4 hover:border-white/[0.10] transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-mono text-signal-muted">{req.id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded border ${statusColors[req.status]}`}>
                      {req.status}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      req.priority === 'High' ? 'bg-signal-bad/20 text-signal-bad' :
                      req.priority === 'Medium' ? 'bg-signal-warn/20 text-signal-warn' :
                      'bg-white/[0.06] text-signal-muted'
                    }`}>
                      {req.priority}
                    </span>
                    {req.conflicts.length > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded bg-signal-warn/20 text-signal-warn flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Conflict
                      </span>
                    )}
                  </div>
                  <div className="text-signal-ink text-sm font-medium">{req.accountName}</div>
                  <div className="text-signal-muted text-xs">{req.email}</div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-signal-muted">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {req.submittedDate}</span>
                    <span>{req.reason}</span>
                    <span>Assigned: {req.assignedTo}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-signal-muted mt-1 flex-shrink-0" />
              </div>
              {renderStatusFlow(req.status)}
            </div>
          ))}
        </div>
      )}
      {renderCreateModal()}
      {renderRequestDetail()}
    </div>
  );

  const renderExecution = () => {
    const eligibleRequests = requests.filter(r => ['Executing', 'Approved', 'Completed'].includes(r.status));
    const execRequest = requests.find(r => r.id === selectedExecRequest);
    const completedSystems = systemDeletions.filter(s => s.status === 'Completed' || s.status === 'Verified').length;
    const totalSystems = systemDeletions.length;
    const progressPct = totalSystems > 0 ? Math.round((completedSystems / totalSystems) * 100) : 0;

    if (eligibleRequests.length === 0) {
      return (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-12 text-center">
          <Server className="w-10 h-10 text-signal-muted mx-auto mb-3" />
          <div className="text-signal-muted text-sm">No deletion requests are in execution</div>
          <div className="text-signal-muted text-xs mt-1">Approve or execute a request to track its system-by-system progress here</div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <label className="text-sm text-signal-muted">Tracking request:</label>
          <select
            value={selectedExecRequest}
            onChange={(e) => setSelectedExecRequest(e.target.value)}
            className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-1.5 text-sm text-signal-ink focus:outline-none focus:border-signal-green/60"
          >
            <option value="">Select a request...</option>
            {eligibleRequests.map(r => (
              <option key={r.id} value={r.id}>{r.id} - {r.accountName}</option>
            ))}
          </select>
        </div>

        {execLoading && (
          <div className="flex items-center justify-center py-10">
            <RefreshCw className="w-5 h-5 text-signal-blue animate-spin" />
            <span className="ml-3 text-signal-muted text-sm">{t('common.loading')}...</span>
          </div>
        )}

        {!execLoading && selectedExecRequest && systemDeletions.length === 0 && (
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-8 text-center text-sm text-signal-muted">
            No system-level deletion records have been logged for this request yet.
          </div>
        )}

        {execRequest && (
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-signal-ink font-medium">{execRequest.accountName}</div>
                <div className="text-xs text-signal-muted">{execRequest.email}</div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded border ${statusColors[execRequest.status]}`}>
                {execRequest.status}
              </span>
            </div>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex-1 bg-white/[0.06] rounded-full h-3 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-signal-blue to-signal-good rounded-full transition-all" style={{ width: `${progressPct}%` }} />
              </div>
              <span className="text-sm font-mono text-signal-ink">{progressPct}%</span>
            </div>
            <div className="text-xs text-signal-muted">{completedSystems} of {totalSystems} systems processed</div>
          </div>
        )}

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-signal-ink">System-by-System Deletion Status</h3>
          {systemDeletions.map((sys, idx) => (
            <div key={idx} className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/[0.06] rounded-lg">{sys.icon}</div>
                  <div>
                    <div className="text-sm text-signal-ink font-medium">{sys.system}</div>
                    <div className="text-xs text-signal-muted">{sys.records.toLocaleString()} records</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium ${systemStatusColor(sys.status)}`}>
                    {sys.status === 'In Progress' && <RefreshCw className="w-3 h-3 inline mr-1 animate-spin" />}
                    {sys.status === 'Completed' && <CheckCircle className="w-3 h-3 inline mr-1" />}
                    {sys.status === 'Failed' && <XCircle className="w-3 h-3 inline mr-1" />}
                    {sys.status === 'Verified' && <Shield className="w-3 h-3 inline mr-1" />}
                    {sys.status}
                  </span>
                  {sys.rollbackAvailable && (
                    <button className="flex items-center gap-1 text-xs text-signal-muted hover:text-signal-warn transition-colors" title="Rollback available">
                      <RotateCcw className="w-3 h-3" /> Rollback
                    </button>
                  )}
                </div>
              </div>

              {sys.deletedAt && (
                <div className="mt-2 pt-2 border-t border-white/[0.06] grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-signal-muted">Deleted at:</span>
                    <span className="text-signal-body ml-1">{sys.deletedAt}</span>
                  </div>
                  <div>
                    <span className="text-signal-muted">Verified by:</span>
                    <span className="text-signal-body ml-1">{sys.verifiedBy}</span>
                  </div>
                  <div>
                    <span className="text-signal-muted">Evidence:</span>
                    <span className="text-signal-blue ml-1">{sys.evidence}</span>
                  </div>
                </div>
              )}

              {sys.status === 'Failed' && (
                <div className="mt-2 pt-2 border-t border-white/[0.06]">
                  <div className="flex items-center gap-2 text-xs text-signal-bad">
                    <AlertTriangle className="w-3 h-3" />
                    Deletion failed - API timeout. Retry available.
                  </div>
                  <button className="mt-2 px-3 py-1 text-xs bg-signal-bad/20 text-signal-bad border border-signal-bad/30 rounded hover:bg-signal-bad/30 transition-colors">
                    Retry Deletion
                  </button>
                </div>
              )}

              {sys.status === 'In Progress' && (
                <div className="mt-2 pt-2 border-t border-white/[0.06]">
                  {/* No per-system numeric progress is reported by the backend, so an
                      indeterminate indicator is shown instead of a fixed percentage. */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
                      <div className="h-full bg-signal-warn rounded-full animate-pulse w-1/3" />
                    </div>
                    <span className="text-xs text-signal-warn flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Deleting
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
          <h3 className="text-sm font-medium text-signal-ink mb-3 flex items-center gap-2">
            <Info className="w-4 h-4 text-signal-blue" /> Grace Period Status
          </h3>
          <div className="text-sm text-signal-body">
            Grace period: <span className="text-signal-ink font-medium">{gracePeriodDays} days</span> from execution start.
            Rollback is available for systems that have not been verified.
          </div>
          <div className="mt-2 text-xs text-signal-muted">
            After verification, deletion is permanent and cannot be reversed.
          </div>
        </div>
      </div>
    );
  };

  const renderAudit = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <select
            value={auditCategoryFilter}
            onChange={(e) => setAuditCategoryFilter(e.target.value)}
            className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-signal-ink focus:outline-none focus:border-signal-green/60"
          >
            <option value="all">All Categories</option>
            <option value="status_change">Status Changes</option>
            <option value="verification">Verification</option>
            <option value="deletion">Deletion</option>
            <option value="review">Review</option>
            <option value="system">System</option>
          </select>
        </div>
        <button
          onClick={handleExportAudit}
          disabled={filteredAudit.length === 0}
          className="flex items-center gap-2 px-3 py-2 text-sm text-signal-muted hover:text-signal-ink bg-white/[0.03] border border-white/[0.06] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" /> {t('common.export')}
        </button>
      </div>

      {filteredAudit.length === 0 ? (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-12 text-center">
          <Shield className="w-10 h-10 text-signal-muted mx-auto mb-3" />
          <div className="text-signal-muted text-sm">No audit entries match this filter</div>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAudit.map(entry => (
            <div key={entry.id} className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded ${auditCategoryColor(entry.category)}`}>
                      {entry.category.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-mono text-signal-muted">{entry.id}</span>
                    {entry.requestId !== 'N/A' && (
                      <span className="text-xs text-signal-blue">{entry.requestId}</span>
                    )}
                  </div>
                  <div className="text-sm text-signal-ink">{entry.action}</div>
                  <div className="text-xs text-signal-muted mt-1">{entry.details}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-signal-muted">{entry.timestamp}</div>
                  <div className="text-xs text-signal-muted mt-1">{entry.user}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
        <h3 className="text-sm font-medium text-signal-ink mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-signal-good" /> Verification Certificates
        </h3>
        {verificationCertificates.length === 0 ? (
          <div className="text-xs text-signal-muted italic py-2">
            No verification certificates yet. Certificates are issued once a deletion request reaches a terminal state.
          </div>
        ) : (
          <div className="space-y-2">
            {verificationCertificates.map(cert => (
              <div key={cert.id} className="flex items-center justify-between py-2 border-b border-white/[0.06] last:border-0">
                <div>
                  <div className="text-sm text-signal-blue font-mono">{cert.id}</div>
                  <div className="text-xs text-signal-muted">Request: {cert.request} | Issued: {cert.date}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${cert.status === 'Issued' ? 'bg-signal-good/20 text-signal-good' : 'bg-signal-bad/20 text-signal-bad'}`}>
                    {cert.status}
                  </span>
                  <button
                    onClick={() => handleDownloadCertificate(cert)}
                    className="text-signal-muted hover:text-signal-ink"
                    title="Download certificate"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
        <h3 className="text-sm font-medium text-signal-ink mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-signal-blue" /> Compliance Evidence
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {complianceEvidence.map(item => (
            <div key={item.label} className="flex items-center justify-between p-3 bg-white/[0.04] rounded-lg">
              <span className={`text-sm ${item.color}`}>{item.label}</span>
              <span className="text-sm text-signal-ink font-medium">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
        <h3 className="text-sm font-medium text-signal-ink mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-signal-blue" /> Grace Period Configuration
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-signal-muted mb-2">Grace period after execution (days)</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={30}
                value={gracePeriodDays}
                onChange={(e) => setGracePeriodDays(Number(e.target.value))}
                className="flex-1 accent-signal-green"
              />
              <span className="text-signal-ink font-mono text-sm w-12 text-center bg-white/[0.06] rounded px-2 py-1">{gracePeriodDays}d</span>
            </div>
            <p className="text-xs text-signal-muted mt-1">
              Users can request rollback within this period. Set to 0 to disable.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
        <h3 className="text-sm font-medium text-signal-ink mb-4 flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-signal-bad" /> Deletion Method
        </h3>
        <div className="space-y-3">
          <label className="flex items-start gap-3 p-3 bg-white/[0.04] rounded-lg cursor-pointer border border-white/[0.06] hover:border-white/[0.10] transition-colors">
            <input
              type="radio"
              name="deletionMethod"
              checked={deletionMethod === 'deletion'}
              onChange={() => setDeletionMethod('deletion')}
              className="mt-1 accent-signal-green"
            />
            <div>
              <div className="text-sm text-signal-ink font-medium">Full Deletion</div>
              <div className="text-xs text-signal-muted mt-1">
                Permanently removes all personal data from systems. This is irreversible after the grace period.
              </div>
            </div>
          </label>
          <label className="flex items-start gap-3 p-3 bg-white/[0.04] rounded-lg cursor-pointer border border-white/[0.06] hover:border-white/[0.10] transition-colors">
            <input
              type="radio"
              name="deletionMethod"
              checked={deletionMethod === 'anonymization'}
              onChange={() => setDeletionMethod('anonymization')}
              className="mt-1 accent-signal-green"
            />
            <div>
              <div className="text-sm text-signal-ink font-medium">Anonymization</div>
              <div className="text-xs text-signal-muted mt-1">
                Replaces personal identifiers with anonymous tokens. Preserves aggregate data for analytics while removing PII.
              </div>
            </div>
          </label>
        </div>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
        <h3 className="text-sm font-medium text-signal-ink mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-signal-good" /> Automation Settings
        </h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <div className="text-sm text-signal-ink">Auto-verify identity</div>
              <div className="text-xs text-signal-muted">Automatically verify user identity via email confirmation</div>
            </div>
            <button
              onClick={() => setAutoVerify(!autoVerify)}
              className={`w-11 h-6 rounded-full transition-colors relative ${autoVerify ? 'bg-signal-green' : 'bg-white/[0.12]'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${autoVerify ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </label>
          <label className="flex items-center justify-between">
            <div>
              <div className="text-sm text-signal-ink">Retention policy override</div>
              <div className="text-xs text-signal-muted">Allow deletion even when retention policies are active</div>
            </div>
            <button
              onClick={() => setRetentionOverride(!retentionOverride)}
              className={`w-11 h-6 rounded-full transition-colors relative ${retentionOverride ? 'bg-signal-green' : 'bg-white/[0.12]'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${retentionOverride ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </label>
        </div>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
        <h3 className="text-sm font-medium text-signal-ink mb-4 flex items-center gap-2">
          <Mail className="w-4 h-4 text-signal-violet" /> Notification Templates
        </h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <div className="text-sm text-signal-ink">Notify on completion</div>
              <div className="text-xs text-signal-muted">Send confirmation email when deletion is complete</div>
            </div>
            <button
              onClick={() => setNotifyOnComplete(!notifyOnComplete)}
              className={`w-11 h-6 rounded-full transition-colors relative ${notifyOnComplete ? 'bg-signal-green' : 'bg-white/[0.12]'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${notifyOnComplete ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </label>
          <label className="flex items-center justify-between">
            <div>
              <div className="text-sm text-signal-ink">Notify on denial</div>
              <div className="text-xs text-signal-muted">Send explanation email when request is denied</div>
            </div>
            <button
              onClick={() => setNotifyOnDenied(!notifyOnDenied)}
              className={`w-11 h-6 rounded-full transition-colors relative ${notifyOnDenied ? 'bg-signal-green' : 'bg-white/[0.12]'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${notifyOnDenied ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </label>

          <div className="border-t border-white/[0.06] pt-4 space-y-3">
            <div>
              <label className="block text-sm text-signal-muted mb-1">Completion Email Template</label>
              <textarea
                className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-signal-ink text-sm focus:outline-none focus:border-signal-green/60 h-24 resize-none font-mono"
                defaultValue={`Dear {{account_name}},\n\nYour account deletion request ({{request_id}}) has been completed. All personal data has been removed from our systems.\n\nA verification certificate is attached for your records.\n\nRegards,\nCompliance Team`}
              />
            </div>
            <div>
              <label className="block text-sm text-signal-muted mb-1">Denial Email Template</label>
              <textarea
                className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-signal-ink text-sm focus:outline-none focus:border-signal-green/60 h-24 resize-none font-mono"
                defaultValue={`Dear {{account_name}},\n\nYour deletion request ({{request_id}}) could not be processed at this time.\n\nReason: {{denial_reason}}\n\nPlease contact support for further assistance.\n\nRegards,\nCompliance Team`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderErrorBanner = () => loadError ? (
    <div className="mb-4 p-4 bg-signal-bad/10 border border-signal-bad/30 rounded-lg flex items-center justify-between">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-signal-bad flex-shrink-0" />
        <span className="text-sm text-signal-bad">{loadError}</span>
      </div>
      <button onClick={loadData} className="flex items-center gap-1.5 px-3 py-1.5 bg-signal-bad/20 text-signal-bad rounded text-sm hover:bg-signal-bad/30 transition-colors">
        <RefreshCw className="w-3.5 h-3.5" /> Retry
      </button>
    </div>
  ) : null;

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 text-signal-blue animate-spin" />
          <span className="ml-3 text-signal-muted">{t('common.loading')}...</span>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'requests': return renderRequests();
      case 'execution': return renderExecution();
      case 'audit': return renderAudit();
      case 'settings': return renderSettings();
      default: return null;
    }
  };

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
              <div className="h-5 w-px bg-white/[0.06]" />
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-signal-bad" />
                <h1 className="text-lg font-semibold text-signal-ink">{t('privacy.accountDeletion')}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadData}
                disabled={loading}
                className="p-2 text-signal-muted hover:text-signal-ink transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-1 mb-6 bg-white/[0.03] rounded-lg p-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-signal-green/15 text-signal-ink font-medium ring-1 ring-signal-green/25'
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
    </div>
  );
};

export default AccountDeletionWorkflow;
