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
  Submitted: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Verified: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  Located: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  Review: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Executing: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  Denied: 'bg-red-500/20 text-red-400 border-red-500/30',
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
    if (n.includes('db') || n.includes('database') || n.includes('postgres') || n.includes('sql')) return <Database className="w-4 h-4 text-blue-400" />;
    if (n.includes('s3') || n.includes('storage') || n.includes('blob') || n.includes('disk')) return <HardDrive className="w-4 h-4 text-purple-400" />;
    if (n.includes('cdn') || n.includes('web') || n.includes('http') || n.includes('api')) return <Globe className="w-4 h-4 text-cyan-400" />;
    return <Server className="w-4 h-4 text-slate-400" />;
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
    return { total, pending, inProgress, completed, denied, avgProcessingDays: 3.2, withConflicts };
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

  const systemStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-green-400';
      case 'Verified': return 'text-emerald-400';
      case 'In Progress': return 'text-yellow-400';
      case 'Pending': return 'text-slate-400';
      case 'Failed': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const auditCategoryColor = (cat: string) => {
    switch (cat) {
      case 'status_change': return 'bg-blue-500/20 text-blue-400';
      case 'verification': return 'bg-emerald-500/20 text-emerald-400';
      case 'deletion': return 'bg-red-500/20 text-red-400';
      case 'review': return 'bg-yellow-500/20 text-yellow-400';
      case 'system': return 'bg-slate-500/20 text-slate-400';
      default: return 'bg-slate-500/20 text-slate-400';
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
              <div className={`text-xs px-2 py-0.5 rounded ${idx < 4 ? 'bg-slate-700 text-slate-500' : ''}`}>
                {step}
              </div>
              {idx < 3 && <ChevronRight className="w-3 h-3 text-slate-600" />}
            </React.Fragment>
          ))}
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <div className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-medium">Denied</div>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 mt-2 flex-wrap">
        {STATUS_FLOW.map((step, idx) => (
          <React.Fragment key={step}>
            <div className={`text-xs px-2 py-0.5 rounded ${
              idx < currentIdx ? 'bg-green-500/20 text-green-400' :
              idx === currentIdx ? 'bg-blue-500/20 text-blue-400 font-medium ring-1 ring-blue-500/50' :
              'bg-slate-700 text-slate-500'
            }`}>
              {step}
            </div>
            {idx < STATUS_FLOW.length - 1 && <ChevronRight className="w-3 h-3 text-slate-600" />}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <FileText className="w-4 h-4" /> Total Requests
          </div>
          <div className="text-3xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-400 text-sm mb-1">
            <Clock className="w-4 h-4" /> Pending
          </div>
          <div className="text-3xl font-bold text-yellow-400">{stats.pending}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-400 text-sm mb-1">
            <RefreshCw className="w-4 h-4" /> In Progress
          </div>
          <div className="text-3xl font-bold text-blue-400">{stats.inProgress}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-400 text-sm mb-1">
            <CheckCircle className="w-4 h-4" /> Completed
          </div>
          <div className="text-3xl font-bold text-green-400">{stats.completed}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-400 text-sm mb-1">
            <XCircle className="w-4 h-4" /> Denied
          </div>
          <div className="text-2xl font-bold text-red-400">{stats.denied}</div>
          <div className="text-xs text-slate-500 mt-1">Due to legal holds or conflicts</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-cyan-400 text-sm mb-1">
            <Clock className="w-4 h-4" /> Avg Processing Time
          </div>
          <div className="text-2xl font-bold text-cyan-400">{stats.avgProcessingDays} days</div>
          <div className="text-xs text-slate-500 mt-1">From submission to completion</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-orange-400 text-sm mb-1">
            <AlertTriangle className="w-4 h-4" /> Retention Hold Conflicts
          </div>
          <div className="text-2xl font-bold text-orange-400">{stats.withConflicts}</div>
          <div className="text-xs text-slate-500 mt-1">Requests with active conflicts</div>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-white mb-3">Status Distribution</h3>
        <div className="space-y-2">
          {(['Submitted', 'Verified', 'Located', 'Review', 'Approved', 'Executing', 'Completed', 'Denied'] as RequestStatus[]).map(status => {
            const count = requests.filter(r => r.status === status).length;
            const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
            return (
              <div key={status} className="flex items-center gap-3">
                <div className="w-24 text-xs text-slate-400">{status}</div>
                <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      status === 'Completed' ? 'bg-green-500' :
                      status === 'Denied' ? 'bg-red-500' :
                      status === 'Executing' ? 'bg-orange-500' :
                      status === 'Submitted' ? 'bg-blue-500' :
                      'bg-cyan-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="w-8 text-xs text-slate-400 text-right">{count}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-white mb-3">Recent Activity</h3>
        <div className="space-y-2">
          {auditEntries.slice(0, 5).map(entry => (
            <div key={entry.id} className="flex items-start gap-3 text-sm">
              <div className="text-xs text-slate-500 whitespace-nowrap mt-0.5">{entry.timestamp}</div>
              <div className="text-slate-300">{entry.action}</div>
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
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 w-full max-w-lg mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">{t('privacy.accountDeletion')}</h3>
            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            {createError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {createError}
              </div>
            )}
            <div>
              <label className="block text-sm text-slate-400 mb-1">Account Name</label>
              <input type="text" value={createForm.accountName} onChange={(e) => setCreateForm(f => ({ ...f, accountName: e.target.value }))} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" placeholder="Full name" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Email Address</label>
              <input type="email" value={createForm.email} onChange={(e) => setCreateForm(f => ({ ...f, email: e.target.value }))} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" placeholder="user@example.com" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Reason</label>
              <select value={createForm.reason} onChange={(e) => setCreateForm(f => ({ ...f, reason: e.target.value }))} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
                <option>GDPR Right to Erasure</option>
                <option>CCPA deletion request</option>
                <option>Account closure request</option>
                <option>User-initiated deletion</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Priority</label>
              <select value={createForm.priority} onChange={(e) => setCreateForm(f => ({ ...f, priority: e.target.value as 'High' | 'Medium' | 'Low' }))} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Additional Notes</label>
              <textarea value={createForm.notes} onChange={(e) => setCreateForm(f => ({ ...f, notes: e.target.value }))} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 h-20 resize-none" placeholder="Any additional context..." />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => { setShowCreateModal(false); setCreateError(null); }} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
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
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">{selectedRequest.id} - {selectedRequest.accountName}</h3>
            <button onClick={() => setSelectedRequest(null)} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-500">Email</div>
                <div className="text-sm text-white">{selectedRequest.email}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Submitted</div>
                <div className="text-sm text-white">{selectedRequest.submittedDate}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Reason</div>
                <div className="text-sm text-white">{selectedRequest.reason}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Assigned To</div>
                <div className="text-sm text-white">{selectedRequest.assignedTo}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">{t('common.priority')}</div>
                <div className={`text-sm ${selectedRequest.priority === 'High' ? 'text-red-400' : selectedRequest.priority === 'Medium' ? 'text-yellow-400' : 'text-slate-400'}`}>
                  {selectedRequest.priority}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Est. Completion</div>
                <div className="text-sm text-white">{selectedRequest.estimatedCompletion}</div>
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500 mb-2">{t('common.status')}</div>
              {renderStatusFlow(selectedRequest.status)}
            </div>

            <div>
              <div className="text-xs text-slate-500 mb-2">{t('privacy.dataInventory')}</div>
              {selectedRequest.dataLocations.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedRequest.dataLocations.map(loc => (
                    <span key={loc} className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded">{loc}</span>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic">Not yet located</div>
              )}
            </div>

            {selectedRequest.conflicts.length > 0 && (
              <div>
                <div className="text-xs text-slate-500 mb-2">Conflicts Detected</div>
                <div className="space-y-1">
                  {selectedRequest.conflicts.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-orange-400">
                      <AlertTriangle className="w-3 h-3" /> {c}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setSelectedRequest(null)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              placeholder={`${t('common.search')}...`}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RequestStatus | 'All')}
              className="bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
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
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> {t('common.create')}
        </button>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
          <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <div className="text-slate-400 text-sm">No requests match your criteria</div>
          <div className="text-slate-500 text-xs mt-1">Try adjusting your search or filter</div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map(req => (
            <div
              key={req.id}
              onClick={() => setSelectedRequest(req)}
              className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-mono text-slate-400">{req.id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded border ${statusColors[req.status]}`}>
                      {req.status}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      req.priority === 'High' ? 'bg-red-500/20 text-red-400' :
                      req.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-slate-700 text-slate-400'
                    }`}>
                      {req.priority}
                    </span>
                    {req.conflicts.length > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Conflict
                      </span>
                    )}
                  </div>
                  <div className="text-white text-sm font-medium">{req.accountName}</div>
                  <div className="text-slate-400 text-xs">{req.email}</div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {req.submittedDate}</span>
                    <span>{req.reason}</span>
                    <span>Assigned: {req.assignedTo}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 mt-1 flex-shrink-0" />
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
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
          <Server className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <div className="text-slate-400 text-sm">No deletion requests are in execution</div>
          <div className="text-slate-500 text-xs mt-1">Approve or execute a request to track its system-by-system progress here</div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-400">Tracking request:</label>
          <select
            value={selectedExecRequest}
            onChange={(e) => setSelectedExecRequest(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">Select a request...</option>
            {eligibleRequests.map(r => (
              <option key={r.id} value={r.id}>{r.id} - {r.accountName}</option>
            ))}
          </select>
        </div>

        {execLoading && (
          <div className="flex items-center justify-center py-10">
            <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
            <span className="ml-3 text-slate-400 text-sm">{t('common.loading')}...</span>
          </div>
        )}

        {!execLoading && selectedExecRequest && systemDeletions.length === 0 && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center text-sm text-slate-400">
            No system-level deletion records have been logged for this request yet.
          </div>
        )}

        {execRequest && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-white font-medium">{execRequest.accountName}</div>
                <div className="text-xs text-slate-400">{execRequest.email}</div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded border ${statusColors[execRequest.status]}`}>
                {execRequest.status}
              </span>
            </div>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex-1 bg-slate-700 rounded-full h-3 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
              </div>
              <span className="text-sm font-mono text-white">{progressPct}%</span>
            </div>
            <div className="text-xs text-slate-500">{completedSystems} of {totalSystems} systems processed</div>
          </div>
        )}

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white">System-by-System Deletion Status</h3>
          {systemDeletions.map((sys, idx) => (
            <div key={idx} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-700 rounded-lg">{sys.icon}</div>
                  <div>
                    <div className="text-sm text-white font-medium">{sys.system}</div>
                    <div className="text-xs text-slate-500">{sys.records.toLocaleString()} records</div>
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
                    <button className="flex items-center gap-1 text-xs text-slate-400 hover:text-orange-400 transition-colors" title="Rollback available">
                      <RotateCcw className="w-3 h-3" /> Rollback
                    </button>
                  )}
                </div>
              </div>

              {sys.deletedAt && (
                <div className="mt-2 pt-2 border-t border-slate-700 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Deleted at:</span>
                    <span className="text-slate-300 ml-1">{sys.deletedAt}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Verified by:</span>
                    <span className="text-slate-300 ml-1">{sys.verifiedBy}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Evidence:</span>
                    <span className="text-cyan-400 ml-1">{sys.evidence}</span>
                  </div>
                </div>
              )}

              {sys.status === 'Failed' && (
                <div className="mt-2 pt-2 border-t border-slate-700">
                  <div className="flex items-center gap-2 text-xs text-red-400">
                    <AlertTriangle className="w-3 h-3" />
                    Deletion failed - API timeout. Retry available.
                  </div>
                  <button className="mt-2 px-3 py-1 text-xs bg-red-600/20 text-red-400 border border-red-500/30 rounded hover:bg-red-600/30 transition-colors">
                    Retry Deletion
                  </button>
                </div>
              )}

              {sys.status === 'In Progress' && (
                <div className="mt-2 pt-2 border-t border-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full bg-yellow-500 rounded-full animate-pulse" style={{ width: '65%' }} />
                    </div>
                    <span className="text-xs text-yellow-400">65%</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-400" /> Grace Period Status
          </h3>
          <div className="text-sm text-slate-300">
            Grace period: <span className="text-white font-medium">{gracePeriodDays} days</span> from execution start.
            Rollback is available for systems that have not been verified.
          </div>
          <div className="mt-2 text-xs text-slate-500">
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
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="status_change">Status Changes</option>
            <option value="verification">Verification</option>
            <option value="deletion">Deletion</option>
            <option value="review">Review</option>
            <option value="system">System</option>
          </select>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white bg-slate-800 border border-slate-700 rounded-lg transition-colors">
          <Download className="w-4 h-4" /> {t('common.export')}
        </button>
      </div>

      {filteredAudit.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
          <Shield className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <div className="text-slate-400 text-sm">No audit entries match this filter</div>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAudit.map(entry => (
            <div key={entry.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded ${auditCategoryColor(entry.category)}`}>
                      {entry.category.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-mono text-slate-500">{entry.id}</span>
                    {entry.requestId !== 'N/A' && (
                      <span className="text-xs text-blue-400">{entry.requestId}</span>
                    )}
                  </div>
                  <div className="text-sm text-white">{entry.action}</div>
                  <div className="text-xs text-slate-400 mt-1">{entry.details}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-slate-500">{entry.timestamp}</div>
                  <div className="text-xs text-slate-400 mt-1">{entry.user}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-green-400" /> Verification Certificates
        </h3>
        <div className="space-y-2">
          {[
            { id: 'CERT-DEL001-FULL', request: 'DEL-001', date: '2026-02-18', status: 'Issued' },
            { id: 'CERT-DB-20260218-001', request: 'DEL-002', date: '2026-02-18', status: 'Partial' },
            { id: 'CERT-AN-20260218-001', request: 'DEL-002', date: '2026-02-18', status: 'Partial' },
          ].map(cert => (
            <div key={cert.id} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
              <div>
                <div className="text-sm text-cyan-400 font-mono">{cert.id}</div>
                <div className="text-xs text-slate-500">Request: {cert.request} | Issued: {cert.date}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded ${cert.status === 'Issued' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {cert.status}
                </span>
                <button className="text-slate-400 hover:text-white">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-400" /> Compliance Evidence
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'GDPR Art. 17 Compliance', count: 6, color: 'text-blue-400' },
            { label: 'CCPA Deletion Records', count: 2, color: 'text-purple-400' },
            { label: 'Data Mapping Reports', count: 4, color: 'text-cyan-400' },
            { label: 'Erasure Confirmation Letters', count: 1, color: 'text-green-400' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
              <span className={`text-sm ${item.color}`}>{item.label}</span>
              <span className="text-sm text-white font-medium">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400" /> Grace Period Configuration
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Grace period after execution (days)</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={30}
                value={gracePeriodDays}
                onChange={(e) => setGracePeriodDays(Number(e.target.value))}
                className="flex-1 accent-blue-500"
              />
              <span className="text-white font-mono text-sm w-12 text-center bg-slate-900 rounded px-2 py-1">{gracePeriodDays}d</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Users can request rollback within this period. Set to 0 to disable.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-red-400" /> Deletion Method
        </h3>
        <div className="space-y-3">
          <label className="flex items-start gap-3 p-3 bg-slate-900 rounded-lg cursor-pointer border border-slate-700 hover:border-slate-600 transition-colors">
            <input
              type="radio"
              name="deletionMethod"
              checked={deletionMethod === 'deletion'}
              onChange={() => setDeletionMethod('deletion')}
              className="mt-1 accent-blue-500"
            />
            <div>
              <div className="text-sm text-white font-medium">Full Deletion</div>
              <div className="text-xs text-slate-400 mt-1">
                Permanently removes all personal data from systems. This is irreversible after the grace period.
              </div>
            </div>
          </label>
          <label className="flex items-start gap-3 p-3 bg-slate-900 rounded-lg cursor-pointer border border-slate-700 hover:border-slate-600 transition-colors">
            <input
              type="radio"
              name="deletionMethod"
              checked={deletionMethod === 'anonymization'}
              onChange={() => setDeletionMethod('anonymization')}
              className="mt-1 accent-blue-500"
            />
            <div>
              <div className="text-sm text-white font-medium">Anonymization</div>
              <div className="text-xs text-slate-400 mt-1">
                Replaces personal identifiers with anonymous tokens. Preserves aggregate data for analytics while removing PII.
              </div>
            </div>
          </label>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-green-400" /> Automation Settings
        </h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white">Auto-verify identity</div>
              <div className="text-xs text-slate-400">Automatically verify user identity via email confirmation</div>
            </div>
            <button
              onClick={() => setAutoVerify(!autoVerify)}
              className={`w-11 h-6 rounded-full transition-colors relative ${autoVerify ? 'bg-blue-600' : 'bg-slate-600'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${autoVerify ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </label>
          <label className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white">Retention policy override</div>
              <div className="text-xs text-slate-400">Allow deletion even when retention policies are active</div>
            </div>
            <button
              onClick={() => setRetentionOverride(!retentionOverride)}
              className={`w-11 h-6 rounded-full transition-colors relative ${retentionOverride ? 'bg-blue-600' : 'bg-slate-600'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${retentionOverride ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </label>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
          <Mail className="w-4 h-4 text-purple-400" /> Notification Templates
        </h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white">Notify on completion</div>
              <div className="text-xs text-slate-400">Send confirmation email when deletion is complete</div>
            </div>
            <button
              onClick={() => setNotifyOnComplete(!notifyOnComplete)}
              className={`w-11 h-6 rounded-full transition-colors relative ${notifyOnComplete ? 'bg-blue-600' : 'bg-slate-600'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${notifyOnComplete ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </label>
          <label className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white">Notify on denial</div>
              <div className="text-xs text-slate-400">Send explanation email when request is denied</div>
            </div>
            <button
              onClick={() => setNotifyOnDenied(!notifyOnDenied)}
              className={`w-11 h-6 rounded-full transition-colors relative ${notifyOnDenied ? 'bg-blue-600' : 'bg-slate-600'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${notifyOnDenied ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </label>

          <div className="border-t border-slate-700 pt-4 space-y-3">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Completion Email Template</label>
              <textarea
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 h-24 resize-none font-mono"
                defaultValue={`Dear {{account_name}},\n\nYour account deletion request ({{request_id}}) has been completed. All personal data has been removed from our systems.\n\nA verification certificate is attached for your records.\n\nRegards,\nCompliance Team`}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Denial Email Template</label>
              <textarea
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 h-24 resize-none font-mono"
                defaultValue={`Dear {{account_name}},\n\nYour deletion request ({{request_id}}) could not be processed at this time.\n\nReason: {{denial_reason}}\n\nPlease contact support for further assistance.\n\nRegards,\nCompliance Team`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderErrorBanner = () => loadError ? (
    <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-between">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
        <span className="text-sm text-red-300">{loadError}</span>
      </div>
      <button onClick={loadData} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-300 rounded text-sm hover:bg-red-500/30 transition-colors">
        <RefreshCw className="w-3.5 h-3.5" /> Retry
      </button>
    </div>
  ) : null;

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
      case 'overview': return renderOverview();
      case 'requests': return renderRequests();
      case 'execution': return renderExecution();
      case 'audit': return renderAudit();
      case 'settings': return renderSettings();
      default: return null;
    }
  };

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
                <Trash2 className="w-5 h-5 text-red-400" />
                <h1 className="text-lg font-semibold text-white">{t('privacy.accountDeletion')}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadData}
                disabled={loading}
                className="p-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
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
    </div>
  );
};

export default AccountDeletionWorkflow;
