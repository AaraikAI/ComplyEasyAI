import React, { useState, useMemo } from 'react';
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

const MOCK_REQUESTS: DeletionRequest[] = [
  { id: 'DEL-001', accountName: 'John Patterson', email: 'j.patterson@email.com', submittedDate: '2026-02-15', status: 'Completed', reason: 'GDPR Right to Erasure', dataLocations: ['Primary DB', 'Analytics', 'CRM', 'Email'], conflicts: [], assignedTo: 'Alice Chen', priority: 'High', estimatedCompletion: '2026-02-18' },
  { id: 'DEL-002', accountName: 'Maria Gonzalez', email: 'm.gonzalez@corp.io', submittedDate: '2026-02-16', status: 'Executing', reason: 'Account closure request', dataLocations: ['Primary DB', 'Analytics', 'Backups'], conflicts: [], assignedTo: 'Bob Tanaka', priority: 'Medium', estimatedCompletion: '2026-02-20' },
  { id: 'DEL-003', accountName: 'Wei Li', email: 'wei.li@tech.co', submittedDate: '2026-02-16', status: 'Review', reason: 'CCPA deletion request', dataLocations: ['Primary DB', 'CRM', 'Third-party'], conflicts: ['Active subscription until 2026-03-01'], assignedTo: 'Carol Reeves', priority: 'High', estimatedCompletion: '2026-02-22' },
  { id: 'DEL-004', accountName: 'Aisha Okafor', email: 'a.okafor@biz.net', submittedDate: '2026-02-17', status: 'Located', reason: 'GDPR Right to Erasure', dataLocations: ['Primary DB', 'Analytics', 'Email', 'Backups'], conflicts: [], assignedTo: 'Alice Chen', priority: 'Medium', estimatedCompletion: '2026-02-23' },
  { id: 'DEL-005', accountName: 'Dmitri Volkov', email: 'd.volkov@mail.ru', submittedDate: '2026-02-17', status: 'Verified', reason: 'User-initiated deletion', dataLocations: ['Primary DB', 'CRM'], conflicts: ['Pending invoice #4821'], assignedTo: 'Bob Tanaka', priority: 'Low', estimatedCompletion: '2026-02-24' },
  { id: 'DEL-006', accountName: 'Sophie Dubois', email: 's.dubois@france.fr', submittedDate: '2026-02-17', status: 'Submitted', reason: 'GDPR Right to Erasure', dataLocations: [], conflicts: [], assignedTo: 'Unassigned', priority: 'Medium', estimatedCompletion: '2026-02-25' },
  { id: 'DEL-007', accountName: 'Kenji Mori', email: 'k.mori@jpn.co.jp', submittedDate: '2026-02-18', status: 'Denied', reason: 'Account closure request', dataLocations: ['Primary DB', 'Analytics'], conflicts: ['Legal hold - Case #LH-2290'], assignedTo: 'Carol Reeves', priority: 'High', estimatedCompletion: 'N/A' },
  { id: 'DEL-008', accountName: 'Emma Lindgren', email: 'e.lindgren@nordic.se', submittedDate: '2026-02-18', status: 'Approved', reason: 'GDPR Right to Erasure', dataLocations: ['Primary DB', 'Analytics', 'CRM', 'Email', 'Backups', 'Third-party'], conflicts: [], assignedTo: 'Alice Chen', priority: 'High', estimatedCompletion: '2026-02-21' },
  { id: 'DEL-009', accountName: 'Raj Patel', email: 'raj.patel@startup.in', submittedDate: '2026-02-18', status: 'Submitted', reason: 'User-initiated deletion', dataLocations: [], conflicts: [], assignedTo: 'Unassigned', priority: 'Low', estimatedCompletion: '2026-02-26' },
  { id: 'DEL-010', accountName: 'Lena Braun', email: 'l.braun@de.com', submittedDate: '2026-02-19', status: 'Submitted', reason: 'CCPA deletion request', dataLocations: [], conflicts: [], assignedTo: 'Unassigned', priority: 'Medium', estimatedCompletion: '2026-02-27' },
];

const MOCK_SYSTEMS: SystemDeletion[] = [
  { system: 'Primary Database', icon: <Database className="w-4 h-4" />, status: 'Completed', records: 1247, deletedAt: '2026-02-18 14:32', verifiedBy: 'System Auto-Check', evidence: 'CERT-DB-20260218-001', rollbackAvailable: false },
  { system: 'Analytics Platform', icon: <BarChart3 className="w-4 h-4" />, status: 'Completed', records: 8432, deletedAt: '2026-02-18 14:45', verifiedBy: 'Alice Chen', evidence: 'CERT-AN-20260218-001', rollbackAvailable: false },
  { system: 'CRM System', icon: <User className="w-4 h-4" />, status: 'In Progress', records: 342, rollbackAvailable: true },
  { system: 'Email Marketing', icon: <Mail className="w-4 h-4" />, status: 'Pending', records: 89, rollbackAvailable: true },
  { system: 'Backup Archives', icon: <HardDrive className="w-4 h-4" />, status: 'Pending', records: 15200, rollbackAvailable: true },
  { system: 'Third-party Integrations', icon: <Globe className="w-4 h-4" />, status: 'Failed', records: 56, rollbackAvailable: true },
];

const MOCK_AUDIT: AuditEntry[] = [
  { id: 'AUD-001', timestamp: '2026-02-19 09:15:22', action: 'Request DEL-010 submitted', user: 'System', requestId: 'DEL-010', details: 'New deletion request received via CCPA portal', category: 'system' },
  { id: 'AUD-002', timestamp: '2026-02-18 16:42:11', action: 'Deletion verified for DEL-001', user: 'Alice Chen', requestId: 'DEL-001', details: 'All systems confirmed data erasure. Certificate generated.', category: 'verification' },
  { id: 'AUD-003', timestamp: '2026-02-18 14:45:00', action: 'Analytics data purged for DEL-002', user: 'System', requestId: 'DEL-002', details: '8,432 records removed from analytics platform', category: 'deletion' },
  { id: 'AUD-004', timestamp: '2026-02-18 14:32:00', action: 'Primary DB records deleted for DEL-002', user: 'System', requestId: 'DEL-002', details: '1,247 records removed from primary database', category: 'deletion' },
  { id: 'AUD-005', timestamp: '2026-02-18 11:20:33', action: 'Request DEL-008 approved', user: 'Carol Reeves', requestId: 'DEL-008', details: 'No conflicts detected. Approved for execution.', category: 'status_change' },
  { id: 'AUD-006', timestamp: '2026-02-18 10:05:17', action: 'Request DEL-007 denied', user: 'Carol Reeves', requestId: 'DEL-007', details: 'Legal hold in effect - Case #LH-2290. Cannot proceed.', category: 'review' },
  { id: 'AUD-007', timestamp: '2026-02-17 15:30:44', action: 'Data located for DEL-004', user: 'Bob Tanaka', requestId: 'DEL-004', details: 'Found records in Primary DB, Analytics, Email, Backups', category: 'status_change' },
  { id: 'AUD-008', timestamp: '2026-02-17 14:12:09', action: 'Conflict detected for DEL-005', user: 'System', requestId: 'DEL-005', details: 'Pending invoice #4821 blocks immediate deletion', category: 'system' },
  { id: 'AUD-009', timestamp: '2026-02-17 09:00:00', action: 'Identity verified for DEL-005', user: 'Bob Tanaka', requestId: 'DEL-005', details: 'Identity verification completed via 2FA confirmation', category: 'verification' },
  { id: 'AUD-010', timestamp: '2026-02-16 16:55:28', action: 'Request DEL-003 under review', user: 'Carol Reeves', requestId: 'DEL-003', details: 'Active subscription conflict requires manual review', category: 'review' },
  { id: 'AUD-011', timestamp: '2026-02-16 08:30:00', action: 'Batch verification initiated', user: 'System', requestId: 'N/A', details: 'Automated verification cycle started for 3 requests', category: 'system' },
  { id: 'AUD-012', timestamp: '2026-02-15 17:10:55', action: 'DEL-001 execution completed', user: 'System', requestId: 'DEL-001', details: 'All personal data erased across 4 systems. Compliance certificate issued.', category: 'deletion' },
];

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'requests', label: 'Requests', icon: <FileText className="w-4 h-4" /> },
  { id: 'execution', label: 'Execution', icon: <Server className="w-4 h-4" /> },
  { id: 'audit', label: 'Audit', icon: <Shield className="w-4 h-4" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
];

export const AccountDeletionWorkflow: React.FC<AccountDeletionWorkflowProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'All'>('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<DeletionRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [gracePeriodDays, setGracePeriodDays] = useState(7);
  const [deletionMethod, setDeletionMethod] = useState<'deletion' | 'anonymization'>('deletion');
  const [autoVerify, setAutoVerify] = useState(true);
  const [notifyOnComplete, setNotifyOnComplete] = useState(true);
  const [notifyOnDenied, setNotifyOnDenied] = useState(true);
  const [retentionOverride, setRetentionOverride] = useState(false);
  const [auditCategoryFilter, setAuditCategoryFilter] = useState<string>('all');
  const [selectedExecRequest, setSelectedExecRequest] = useState<string>('DEL-002');

  const stats = useMemo(() => {
    const total = MOCK_REQUESTS.length;
    const pending = MOCK_REQUESTS.filter(r => r.status === 'Submitted').length;
    const inProgress = MOCK_REQUESTS.filter(r => !['Submitted', 'Completed', 'Denied'].includes(r.status)).length;
    const completed = MOCK_REQUESTS.filter(r => r.status === 'Completed').length;
    const denied = MOCK_REQUESTS.filter(r => r.status === 'Denied').length;
    const withConflicts = MOCK_REQUESTS.filter(r => r.conflicts.length > 0).length;
    return { total, pending, inProgress, completed, denied, avgProcessingDays: 3.2, withConflicts };
  }, []);

  const filteredRequests = useMemo(() => {
    return MOCK_REQUESTS.filter(r => {
      const matchesSearch = searchQuery === '' ||
        r.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter]);

  const filteredAudit = useMemo(() => {
    if (auditCategoryFilter === 'all') return MOCK_AUDIT;
    return MOCK_AUDIT.filter(a => a.category === auditCategoryFilter);
  }, [auditCategoryFilter]);

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
            const count = MOCK_REQUESTS.filter(r => r.status === status).length;
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
          {MOCK_AUDIT.slice(0, 5).map(entry => (
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
            <h3 className="text-lg font-medium text-white">New Deletion Request</h3>
            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Account Name</label>
              <input type="text" className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" placeholder="Full name" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Email Address</label>
              <input type="email" className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" placeholder="user@example.com" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Reason</label>
              <select className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
                <option>GDPR Right to Erasure</option>
                <option>CCPA deletion request</option>
                <option>Account closure request</option>
                <option>User-initiated deletion</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Priority</label>
              <select className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Additional Notes</label>
              <textarea className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 h-20 resize-none" placeholder="Any additional context..." />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
              Cancel
            </button>
            <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors">
              Submit Request
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
                <div className="text-xs text-slate-500">Priority</div>
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
              <div className="text-xs text-slate-500 mb-2">Status Flow</div>
              {renderStatusFlow(selectedRequest.status)}
            </div>

            <div>
              <div className="text-xs text-slate-500 mb-2">Data Inventory</div>
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
              Close
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
              placeholder="Search requests..."
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
          <Plus className="w-4 h-4" /> New Request
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
    const execRequest = MOCK_REQUESTS.find(r => r.id === selectedExecRequest);
    const completedSystems = MOCK_SYSTEMS.filter(s => s.status === 'Completed' || s.status === 'Verified').length;
    const totalSystems = MOCK_SYSTEMS.length;
    const progressPct = totalSystems > 0 ? Math.round((completedSystems / totalSystems) * 100) : 0;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-400">Tracking request:</label>
          <select
            value={selectedExecRequest}
            onChange={(e) => setSelectedExecRequest(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            {MOCK_REQUESTS.filter(r => ['Executing', 'Approved', 'Completed'].includes(r.status)).map(r => (
              <option key={r.id} value={r.id}>{r.id} - {r.accountName}</option>
            ))}
          </select>
        </div>

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
          {MOCK_SYSTEMS.map((sys, idx) => (
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
          <Download className="w-4 h-4" /> Export Log
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

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
          <span className="ml-3 text-slate-400">Loading...</span>
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
                <span className="text-sm">Back</span>
              </button>
              <div className="h-5 w-px bg-slate-700" />
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-400" />
                <h1 className="text-lg font-semibold text-white">Account Deletion Workflow</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Last sync: 2 min ago</span>
              <button
                onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 1000); }}
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

        {renderContent()}
      </div>
    </div>
  );
};

export default AccountDeletionWorkflow;
