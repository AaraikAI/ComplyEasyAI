/**
 * Privacy Management Platform
 *
 * Comprehensive privacy operations management:
 * - DSAR (Data Subject Access Request) lifecycle management
 * - Consent management and tracking
 * - Data retention schedule enforcement
 * - Cross-border transfer compliance (SCC/BCR/TIA)
 * - Marketing opt-out and suppression list management
 * - Privacy metrics dashboard
 */

import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Shield,
  FileText,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  Plus,
  X,
  Eye,
  Download,
  RefreshCw,
  BarChart3,
  Globe,
  Mail,
  Phone,
  Calendar,
  Lock,
  Trash2,
  UserCheck,
  Send,
  Filter,
  Database,
  Settings,
  ArrowRightLeft,
  Ban,
  Activity,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';

// ── Type Definitions ────────────────────────────────────────────────────────

type TabId = 'overview' | 'dsar' | 'consent' | 'retention' | 'transfers' | 'optout';

type DSARType = 'Access' | 'Deletion' | 'Rectification' | 'Portability' | 'Restriction' | 'Objection';
type DSARStatus = 'Received' | 'Identity Verified' | 'In Progress' | 'Completed' | 'Rejected';
type DSARPriority = 'High' | 'Medium' | 'Low';

interface DSARRequest {
  id: string;
  type: DSARType;
  subjectName: string;
  subjectEmail: string;
  submissionDate: string;
  deadline: string;
  status: DSARStatus;
  assignedTo: string;
  priority: DSARPriority;
  description: string;
}

interface ConsentRecord {
  id: string;
  purpose: string;
  totalRecords: number;
  grantedPct: number;
  withdrawnPct: number;
  pendingPct: number;
  lastUpdated: string;
  legalBasis: string;
}

interface RetentionSchedule {
  id: string;
  dataCategory: string;
  retentionPeriod: string;
  legalBasis: string;
  autoDeleteEnabled: boolean;
  recordsAffected: number;
  lastPurgeDate: string;
  nextPurgeDate: string;
  status: 'Active' | 'Paused' | 'Expired';
}

interface CrossBorderTransfer {
  id: string;
  transferName: string;
  sourceCountry: string;
  destinationCountry: string;
  legalMechanism: 'SCC' | 'BCR' | 'Adequacy Decision' | 'Derogation';
  tiaCompleted: boolean;
  riskLevel: 'Low' | 'Medium' | 'High';
  status: 'Active' | 'Under Review' | 'Suspended';
  reviewDate: string;
}

interface SuppressionEntry {
  id: string;
  name: string;
  email: string;
  channels: string[];
  optOutDate: string;
  source: string;
  status: 'Active' | 'Pending Verification';
}

// ── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_DSARS: DSARRequest[] = [
  { id: 'DSAR-001', type: 'Access', subjectName: 'Emma Lindgren', subjectEmail: 'e.lindgren@nordic.se', submissionDate: '2026-01-22', deadline: '2026-02-21', status: 'Completed', assignedTo: 'Alice Chen', priority: 'High', description: 'Full data access request under GDPR Art. 15' },
  { id: 'DSAR-002', type: 'Deletion', subjectName: 'Carlos Mendez', subjectEmail: 'c.mendez@mail.es', submissionDate: '2026-02-01', deadline: '2026-03-03', status: 'In Progress', assignedTo: 'Bob Tanaka', priority: 'High', description: 'Right to erasure - all personal data and backups' },
  { id: 'DSAR-003', type: 'Portability', subjectName: 'Wei Zhang', subjectEmail: 'w.zhang@tech.cn', submissionDate: '2026-02-05', deadline: '2026-03-07', status: 'Identity Verified', assignedTo: 'Carol Reeves', priority: 'Medium', description: 'Data export in machine-readable format' },
  { id: 'DSAR-004', type: 'Rectification', subjectName: 'Priya Sharma', subjectEmail: 'p.sharma@corp.in', submissionDate: '2026-02-10', deadline: '2026-03-12', status: 'In Progress', assignedTo: 'Alice Chen', priority: 'Medium', description: 'Correction of address and employment data' },
  { id: 'DSAR-005', type: 'Restriction', subjectName: 'Hans Mueller', subjectEmail: 'h.mueller@de.com', submissionDate: '2026-02-12', deadline: '2026-03-14', status: 'Received', assignedTo: 'Unassigned', priority: 'Low', description: 'Restrict processing pending accuracy verification' },
  { id: 'DSAR-006', type: 'Objection', subjectName: 'Sophie Dubois', subjectEmail: 's.dubois@france.fr', submissionDate: '2026-02-14', deadline: '2026-03-16', status: 'Received', assignedTo: 'Unassigned', priority: 'Medium', description: 'Objection to profiling for direct marketing' },
  { id: 'DSAR-007', type: 'Access', subjectName: 'Kenji Mori', subjectEmail: 'k.mori@jpn.co.jp', submissionDate: '2026-02-15', deadline: '2026-03-17', status: 'Rejected', assignedTo: 'Bob Tanaka', priority: 'Low', description: 'Duplicate request - already fulfilled under DSAR-001' },
  { id: 'DSAR-008', type: 'Deletion', subjectName: 'Aisha Okafor', subjectEmail: 'a.okafor@biz.net', submissionDate: '2026-02-18', deadline: '2026-03-20', status: 'Identity Verified', assignedTo: 'Carol Reeves', priority: 'High', description: 'Complete erasure request including third-party systems' },
];

const MOCK_CONSENT: ConsentRecord[] = [
  { id: 'CON-001', purpose: 'Marketing Communications', totalRecords: 124500, grantedPct: 68.2, withdrawnPct: 12.4, pendingPct: 19.4, lastUpdated: '2026-02-18', legalBasis: 'Consent' },
  { id: 'CON-002', purpose: 'Analytics & Performance', totalRecords: 198300, grantedPct: 74.1, withdrawnPct: 8.7, pendingPct: 17.2, lastUpdated: '2026-02-17', legalBasis: 'Legitimate Interest' },
  { id: 'CON-003', purpose: 'Third-Party Data Sharing', totalRecords: 124500, grantedPct: 42.6, withdrawnPct: 31.2, pendingPct: 26.2, lastUpdated: '2026-02-16', legalBasis: 'Consent' },
  { id: 'CON-004', purpose: 'Personalization & Recommendations', totalRecords: 156800, grantedPct: 61.8, withdrawnPct: 15.3, pendingPct: 22.9, lastUpdated: '2026-02-18', legalBasis: 'Consent' },
  { id: 'CON-005', purpose: 'Essential Service Operation', totalRecords: 198300, grantedPct: 97.2, withdrawnPct: 0.8, pendingPct: 2.0, lastUpdated: '2026-02-19', legalBasis: 'Contract Performance' },
  { id: 'CON-006', purpose: 'Research & Development', totalRecords: 89400, grantedPct: 55.4, withdrawnPct: 18.9, pendingPct: 25.7, lastUpdated: '2026-02-15', legalBasis: 'Legitimate Interest' },
];

const MOCK_RETENTION: RetentionSchedule[] = [
  { id: 'RET-001', dataCategory: 'Customer Transaction Records', retentionPeriod: '7 years', legalBasis: 'Tax & Accounting Regulations', autoDeleteEnabled: true, recordsAffected: 2340000, lastPurgeDate: '2026-01-15', nextPurgeDate: '2026-04-15', status: 'Active' },
  { id: 'RET-002', dataCategory: 'Employee HR Records', retentionPeriod: '6 years post-employment', legalBasis: 'Employment Law', autoDeleteEnabled: true, recordsAffected: 45200, lastPurgeDate: '2026-01-01', nextPurgeDate: '2026-07-01', status: 'Active' },
  { id: 'RET-003', dataCategory: 'Marketing Contact Lists', retentionPeriod: '2 years', legalBasis: 'Consent-based', autoDeleteEnabled: true, recordsAffected: 890000, lastPurgeDate: '2025-12-01', nextPurgeDate: '2026-03-01', status: 'Active' },
  { id: 'RET-004', dataCategory: 'Website Access Logs', retentionPeriod: '90 days', legalBasis: 'Security & Fraud Prevention', autoDeleteEnabled: true, recordsAffected: 15600000, lastPurgeDate: '2026-02-15', nextPurgeDate: '2026-02-28', status: 'Active' },
  { id: 'RET-005', dataCategory: 'CCTV Footage', retentionPeriod: '30 days', legalBasis: 'Legitimate Interest', autoDeleteEnabled: false, recordsAffected: 8400, lastPurgeDate: '2026-02-01', nextPurgeDate: '2026-03-01', status: 'Paused' },
  { id: 'RET-006', dataCategory: 'Legacy CRM Data', retentionPeriod: '5 years', legalBasis: 'Contractual Obligation', autoDeleteEnabled: false, recordsAffected: 312000, lastPurgeDate: '2025-06-01', nextPurgeDate: '2025-12-01', status: 'Expired' },
];

const MOCK_TRANSFERS: CrossBorderTransfer[] = [
  { id: 'CBT-001', transferName: 'EU-US Cloud Infrastructure', sourceCountry: 'Germany', destinationCountry: 'United States', legalMechanism: 'SCC', tiaCompleted: true, riskLevel: 'Medium', status: 'Active', reviewDate: '2026-06-15' },
  { id: 'CBT-002', transferName: 'EU-UK Customer Support', sourceCountry: 'France', destinationCountry: 'United Kingdom', legalMechanism: 'Adequacy Decision', tiaCompleted: true, riskLevel: 'Low', status: 'Active', reviewDate: '2026-09-01' },
  { id: 'CBT-003', transferName: 'EU-India Dev Center', sourceCountry: 'Netherlands', destinationCountry: 'India', legalMechanism: 'SCC', tiaCompleted: true, riskLevel: 'High', status: 'Under Review', reviewDate: '2026-03-01' },
  { id: 'CBT-004', transferName: 'Intra-group HR Data', sourceCountry: 'Ireland', destinationCountry: 'Singapore', legalMechanism: 'BCR', tiaCompleted: false, riskLevel: 'Medium', status: 'Under Review', reviewDate: '2026-04-15' },
  { id: 'CBT-005', transferName: 'EU-Japan Analytics', sourceCountry: 'Spain', destinationCountry: 'Japan', legalMechanism: 'Adequacy Decision', tiaCompleted: true, riskLevel: 'Low', status: 'Active', reviewDate: '2026-12-01' },
];

const MOCK_SUPPRESSION: SuppressionEntry[] = [
  { id: 'SUP-001', name: 'Laura Bennett', email: 'l.bennett@mail.com', channels: ['Email', 'SMS', 'Phone'], optOutDate: '2026-02-18', source: 'Web Form', status: 'Active' },
  { id: 'SUP-002', name: 'Marco Rossi', email: 'm.rossi@italia.it', channels: ['Email'], optOutDate: '2026-02-17', source: 'Email Unsubscribe', status: 'Active' },
  { id: 'SUP-003', name: 'Yuki Tanaka', email: 'y.tanaka@jpn.co.jp', channels: ['Email', 'Post'], optOutDate: '2026-02-16', source: 'Customer Service', status: 'Active' },
  { id: 'SUP-004', name: 'Ahmed Hassan', email: 'a.hassan@corp.eg', channels: ['SMS', 'Phone'], optOutDate: '2026-02-15', source: 'Regulatory Request', status: 'Active' },
  { id: 'SUP-005', name: 'Katarina Novak', email: 'k.novak@cz.eu', channels: ['Email', 'SMS', 'Phone', 'Post'], optOutDate: '2026-02-14', source: 'DSAR Request', status: 'Active' },
  { id: 'SUP-006', name: 'James O\'Brien', email: 'j.obrien@ie.com', channels: ['Email'], optOutDate: '2026-02-13', source: 'Email Unsubscribe', status: 'Active' },
  { id: 'SUP-007', name: 'Lin Wei', email: 'l.wei@tech.cn', channels: ['Email', 'SMS'], optOutDate: '2026-02-12', source: 'Web Form', status: 'Pending Verification' },
  { id: 'SUP-008', name: 'Elena Petrova', email: 'e.petrova@ru.net', channels: ['Phone', 'Post'], optOutDate: '2026-02-11', source: 'Customer Service', status: 'Pending Verification' },
];

// ── Status Color Helpers ────────────────────────────────────────────────────

const dsarStatusColors: Record<DSARStatus, string> = {
  'Received': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Identity Verified': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'In Progress': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'Completed': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Rejected': 'bg-red-500/20 text-red-400 border-red-500/30',
};

const dsarTypeColors: Record<DSARType, string> = {
  'Access': 'bg-indigo-500/20 text-indigo-400',
  'Deletion': 'bg-red-500/20 text-red-400',
  'Rectification': 'bg-amber-500/20 text-amber-400',
  'Portability': 'bg-purple-500/20 text-purple-400',
  'Restriction': 'bg-orange-500/20 text-orange-400',
  'Objection': 'bg-rose-500/20 text-rose-400',
};

const priorityColors: Record<DSARPriority, string> = {
  'High': 'text-red-400',
  'Medium': 'text-yellow-400',
  'Low': 'text-slate-400',
};

const retentionStatusColors: Record<string, string> = {
  'Active': 'bg-green-500/20 text-green-400',
  'Paused': 'bg-yellow-500/20 text-yellow-400',
  'Expired': 'bg-red-500/20 text-red-400',
};

const transferRiskColors: Record<string, string> = {
  'Low': 'bg-green-500/20 text-green-400',
  'Medium': 'bg-yellow-500/20 text-yellow-400',
  'High': 'bg-red-500/20 text-red-400',
};

const transferStatusColors: Record<string, string> = {
  'Active': 'bg-green-500/20 text-green-400',
  'Under Review': 'bg-yellow-500/20 text-yellow-400',
  'Suspended': 'bg-red-500/20 text-red-400',
};

// ── Tab Definitions ─────────────────────────────────────────────────────────

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'dsar', label: 'DSAR Management', icon: <FileText className="w-4 h-4" /> },
  { id: 'consent', label: 'Consent', icon: <UserCheck className="w-4 h-4" /> },
  { id: 'retention', label: 'Data Retention', icon: <Database className="w-4 h-4" /> },
  { id: 'transfers', label: 'Cross-Border', icon: <Globe className="w-4 h-4" /> },
  { id: 'optout', label: 'Marketing Opt-Out', icon: <Ban className="w-4 h-4" /> },
];

// ── Component ───────────────────────────────────────────────────────────────

export const PrivacyManagementPlatform: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [dsarStatusFilter, setDsarStatusFilter] = useState<DSARStatus | 'All'>('All');
  const [dsarTypeFilter, setDsarTypeFilter] = useState<DSARType | 'All'>('All');
  const [showCreateDSAR, setShowCreateDSAR] = useState(false);
  const [retentionStatusFilter, setRetentionStatusFilter] = useState<string>('All');
  const [optOutChannelFilter, setOptOutChannelFilter] = useState<string>('All');

  // ── Computed Stats ──────────────────────────────────────────────────────

  const dsarStats = useMemo(() => {
    const total = MOCK_DSARS.length;
    const active = MOCK_DSARS.filter(d => !['Completed', 'Rejected'].includes(d.status)).length;
    const completed = MOCK_DSARS.filter(d => d.status === 'Completed').length;
    const overdue = MOCK_DSARS.filter(d => {
      if (d.status === 'Completed' || d.status === 'Rejected') return false;
      return new Date(d.deadline) < new Date('2026-02-19');
    }).length;
    return { total, active, completed, overdue, avgResponseDays: 12.4 };
  }, []);

  const consentStats = useMemo(() => {
    const avgGranted = MOCK_CONSENT.reduce((sum, c) => sum + c.grantedPct, 0) / MOCK_CONSENT.length;
    const avgWithdrawn = MOCK_CONSENT.reduce((sum, c) => sum + c.withdrawnPct, 0) / MOCK_CONSENT.length;
    return { avgGranted: avgGranted.toFixed(1), avgWithdrawn: avgWithdrawn.toFixed(1), totalPurposes: MOCK_CONSENT.length };
  }, []);

  const retentionStats = useMemo(() => {
    const active = MOCK_RETENTION.filter(r => r.status === 'Active').length;
    const autoDeleteEnabled = MOCK_RETENTION.filter(r => r.autoDeleteEnabled).length;
    const expired = MOCK_RETENTION.filter(r => r.status === 'Expired').length;
    const totalRecords = MOCK_RETENTION.reduce((sum, r) => sum + r.recordsAffected, 0);
    const compliancePct = ((active / MOCK_RETENTION.length) * 100).toFixed(0);
    return { active, autoDeleteEnabled, expired, totalRecords, compliancePct };
  }, []);

  const filteredDSARs = useMemo(() => {
    return MOCK_DSARS.filter(d => {
      const matchesSearch = searchQuery === '' ||
        d.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.subjectEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = dsarStatusFilter === 'All' || d.status === dsarStatusFilter;
      const matchesType = dsarTypeFilter === 'All' || d.type === dsarTypeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [searchQuery, dsarStatusFilter, dsarTypeFilter]);

  const filteredRetention = useMemo(() => {
    if (retentionStatusFilter === 'All') return MOCK_RETENTION;
    return MOCK_RETENTION.filter(r => r.status === retentionStatusFilter);
  }, [retentionStatusFilter]);

  const filteredSuppression = useMemo(() => {
    return MOCK_SUPPRESSION.filter(s => {
      const matchesSearch = searchQuery === '' ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesChannel = optOutChannelFilter === 'All' || s.channels.includes(optOutChannelFilter);
      return matchesSearch && matchesChannel;
    });
  }, [searchQuery, optOutChannelFilter]);

  // ── Overview Tab ────────────────────────────────────────────────────────

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-400 text-sm mb-1">
            <FileText className="w-4 h-4" /> Active DSARs
          </div>
          <div className="text-3xl font-bold text-blue-400">{dsarStats.active}</div>
          <div className="text-xs text-slate-500 mt-1">{dsarStats.total} total requests</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-cyan-400 text-sm mb-1">
            <Clock className="w-4 h-4" /> Avg Response Time
          </div>
          <div className="text-3xl font-bold text-cyan-400">{dsarStats.avgResponseDays}</div>
          <div className="text-xs text-slate-500 mt-1">days (30-day deadline)</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-400 text-sm mb-1">
            <UserCheck className="w-4 h-4" /> Consent Rate
          </div>
          <div className="text-3xl font-bold text-green-400">{consentStats.avgGranted}%</div>
          <div className="text-xs text-slate-500 mt-1">avg across {consentStats.totalPurposes} purposes</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-emerald-400 text-sm mb-1">
            <Database className="w-4 h-4" /> Retention Compliance
          </div>
          <div className="text-3xl font-bold text-emerald-400">{retentionStats.compliancePct}%</div>
          <div className="text-xs text-slate-500 mt-1">{retentionStats.active} of {MOCK_RETENTION.length} schedules active</div>
        </div>
      </div>

      {dsarStats.overdue > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <div className="text-sm font-medium text-red-400">{dsarStats.overdue} DSAR(s) past deadline</div>
            <div className="text-xs text-red-400/70">Immediate attention required to maintain regulatory compliance</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-white mb-3">DSAR Status Distribution</h3>
          <div className="space-y-2">
            {(['Received', 'Identity Verified', 'In Progress', 'Completed', 'Rejected'] as DSARStatus[]).map(status => {
              const count = MOCK_DSARS.filter(d => d.status === status).length;
              const pct = dsarStats.total > 0 ? (count / dsarStats.total) * 100 : 0;
              return (
                <div key={status} className="flex items-center gap-3">
                  <div className="w-28 text-xs text-slate-400">{status}</div>
                  <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        status === 'Completed' ? 'bg-green-500' :
                        status === 'Rejected' ? 'bg-red-500' :
                        status === 'In Progress' ? 'bg-yellow-500' :
                        status === 'Identity Verified' ? 'bg-cyan-500' :
                        'bg-blue-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="w-6 text-xs text-slate-400 text-right">{count}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-white mb-3">Consent Rates by Purpose</h3>
          <div className="space-y-2">
            {MOCK_CONSENT.map(c => (
              <div key={c.id} className="flex items-center gap-3">
                <div className="w-36 text-xs text-slate-400 truncate" title={c.purpose}>{c.purpose}</div>
                <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div className="h-full rounded-full bg-green-500" style={{ width: `${c.grantedPct}%` }} />
                </div>
                <div className="w-12 text-xs text-slate-400 text-right">{c.grantedPct}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-white mb-3">Upcoming Deadlines</h3>
        <div className="space-y-2">
          {MOCK_DSARS
            .filter(d => !['Completed', 'Rejected'].includes(d.status))
            .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
            .map(d => {
              const daysLeft = Math.ceil((new Date(d.deadline).getTime() - new Date('2026-02-19').getTime()) / (1000 * 60 * 60 * 24));
              const isUrgent = daysLeft <= 7;
              return (
                <div key={d.id} className="flex items-center justify-between py-1.5 border-b border-slate-700/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-500">{d.id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${dsarTypeColors[d.type]}`}>{d.type}</span>
                    <span className="text-sm text-slate-300">{d.subjectName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${isUrgent ? 'text-red-400 font-medium' : 'text-slate-400'}`}>
                      {daysLeft <= 0 ? 'OVERDUE' : `${daysLeft} days left`}
                    </span>
                    <Calendar className={`w-3.5 h-3.5 ${isUrgent ? 'text-red-400' : 'text-slate-500'}`} />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-purple-400 text-sm mb-2">
            <Globe className="w-4 h-4" /> Cross-Border Transfers
          </div>
          <div className="text-2xl font-bold text-white">{MOCK_TRANSFERS.length}</div>
          <div className="text-xs text-slate-500 mt-1">
            {MOCK_TRANSFERS.filter(t => t.status === 'Active').length} active, {MOCK_TRANSFERS.filter(t => t.status === 'Under Review').length} under review
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-orange-400 text-sm mb-2">
            <Ban className="w-4 h-4" /> Suppression List
          </div>
          <div className="text-2xl font-bold text-white">{MOCK_SUPPRESSION.length}</div>
          <div className="text-xs text-slate-500 mt-1">
            {MOCK_SUPPRESSION.filter(s => s.status === 'Active').length} active entries
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-400 text-sm mb-2">
            <AlertTriangle className="w-4 h-4" /> Retention Overdue
          </div>
          <div className="text-2xl font-bold text-white">{retentionStats.expired}</div>
          <div className="text-xs text-slate-500 mt-1">schedules past retention period</div>
        </div>
      </div>
    </div>
  );

  // ── DSAR Management Tab ─────────────────────────────────────────────────

  const renderDSAR = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search DSARs..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 w-64"
            />
          </div>
          <select
            value={dsarStatusFilter}
            onChange={e => setDsarStatusFilter(e.target.value as DSARStatus | 'All')}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="All">All Statuses</option>
            {(['Received', 'Identity Verified', 'In Progress', 'Completed', 'Rejected'] as DSARStatus[]).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={dsarTypeFilter}
            onChange={e => setDsarTypeFilter(e.target.value as DSARType | 'All')}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="All">All Types</option>
            {(['Access', 'Deletion', 'Rectification', 'Portability', 'Restriction', 'Objection'] as DSARType[]).map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setShowCreateDSAR(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> New DSAR
        </button>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-4 py-3 text-slate-400 font-medium">ID</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Type</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Data Subject</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Submitted</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Deadline</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Assigned To</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Priority</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDSARs.map(d => {
                const daysLeft = Math.ceil((new Date(d.deadline).getTime() - new Date('2026-02-19').getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <tr key={d.id} className="border-b border-slate-700/50 hover:bg-slate-750/50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-300">{d.id}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${dsarTypeColors[d.type]}`}>{d.type}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-200">{d.subjectName}</div>
                      <div className="text-xs text-slate-500">{d.subjectEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{d.submissionDate}</td>
                    <td className="px-4 py-3">
                      <div className={`text-xs ${daysLeft <= 7 && !['Completed', 'Rejected'].includes(d.status) ? 'text-red-400 font-medium' : 'text-slate-400'}`}>
                        {d.deadline}
                      </div>
                      {!['Completed', 'Rejected'].includes(d.status) && (
                        <div className={`text-xs mt-0.5 ${daysLeft <= 0 ? 'text-red-400' : daysLeft <= 7 ? 'text-orange-400' : 'text-slate-500'}`}>
                          {daysLeft <= 0 ? 'OVERDUE' : `${daysLeft}d remaining`}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded border ${dsarStatusColors[d.status]}`}>{d.status}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{d.assignedTo}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${priorityColors[d.priority]}`}>{d.priority}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {d.status === 'Received' && (
                          <button className="p-1 text-cyan-400 hover:bg-cyan-500/20 rounded" title="Verify Identity">
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {(d.status === 'Received' || d.status === 'Identity Verified') && d.assignedTo === 'Unassigned' && (
                          <button className="p-1 text-blue-400 hover:bg-blue-500/20 rounded" title="Assign">
                            <Users className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {d.status === 'In Progress' && (
                          <button className="p-1 text-green-400 hover:bg-green-500/20 rounded" title="Mark Complete">
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button className="p-1 text-slate-400 hover:bg-slate-700 rounded" title="View Details">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredDSARs.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-sm">No DSARs match the current filters.</div>
        )}
      </div>
    </div>
  );

  // ── Create DSAR Modal ───────────────────────────────────────────────────

  const renderCreateDSARModal = () => {
    if (!showCreateDSAR) return null;
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 w-full max-w-lg mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">New DSAR Request</h3>
            <button onClick={() => setShowCreateDSAR(false)} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Request Type</label>
              <select className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                {(['Access', 'Deletion', 'Rectification', 'Portability', 'Restriction', 'Objection'] as DSARType[]).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Subject Name</label>
                <input type="text" placeholder="Full name" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Subject Email</label>
                <input type="email" placeholder="Email address" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Priority</label>
              <select className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Description</label>
              <textarea rows={3} placeholder="Details of the request..." className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none" />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setShowCreateDSAR(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowCreateDSAR(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
              >
                Create DSAR
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Consent Management Tab ──────────────────────────────────────────────

  const renderConsent = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-400 text-sm mb-1">
            <CheckCircle className="w-4 h-4" /> Avg Consent Rate
          </div>
          <div className="text-3xl font-bold text-green-400">{consentStats.avgGranted}%</div>
          <div className="text-xs text-slate-500 mt-1">across all purposes</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-400 text-sm mb-1">
            <X className="w-4 h-4" /> Avg Withdrawal Rate
          </div>
          <div className="text-3xl font-bold text-red-400">{consentStats.avgWithdrawn}%</div>
          <div className="text-xs text-slate-500 mt-1">across all purposes</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-400 text-sm mb-1">
            <Settings className="w-4 h-4" /> Active Purposes
          </div>
          <div className="text-3xl font-bold text-blue-400">{consentStats.totalPurposes}</div>
          <div className="text-xs text-slate-500 mt-1">configured consent categories</div>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-white mb-4">Consent Rates by Purpose</h3>
        <div className="space-y-4">
          {MOCK_CONSENT.map(c => (
            <div key={c.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">{c.purpose}</span>
                <span className="text-xs text-slate-500">{c.totalRecords.toLocaleString()} records</span>
              </div>
              <div className="flex h-3 rounded-full overflow-hidden bg-slate-700">
                <div
                  className="bg-green-500 transition-all"
                  style={{ width: `${c.grantedPct}%` }}
                  title={`Granted: ${c.grantedPct}%`}
                />
                <div
                  className="bg-red-500 transition-all"
                  style={{ width: `${c.withdrawnPct}%` }}
                  title={`Withdrawn: ${c.withdrawnPct}%`}
                />
                <div
                  className="bg-slate-600 transition-all"
                  style={{ width: `${c.pendingPct}%` }}
                  title={`Pending: ${c.pendingPct}%`}
                />
              </div>
              <div className="flex gap-4 text-xs">
                <span className="text-green-400">Granted: {c.grantedPct}%</span>
                <span className="text-red-400">Withdrawn: {c.withdrawnPct}%</span>
                <span className="text-slate-500">Pending: {c.pendingPct}%</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-4 pt-3 border-t border-slate-700">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-green-500" />
            <span className="text-xs text-slate-400">Granted</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-red-500" />
            <span className="text-xs text-slate-400">Withdrawn</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-slate-600" />
            <span className="text-xs text-slate-400">Pending</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700">
          <h3 className="text-sm font-medium text-white">Consent Purpose Configuration</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Purpose</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Legal Basis</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Total Records</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Granted</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Withdrawn</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_CONSENT.map(c => (
                <tr key={c.id} className="border-b border-slate-700/50 hover:bg-slate-750/50">
                  <td className="px-4 py-3 text-slate-200">{c.purpose}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">{c.legalBasis}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{c.totalRecords.toLocaleString()}</td>
                  <td className="px-4 py-3 text-green-400">{c.grantedPct}%</td>
                  <td className="px-4 py-3 text-red-400">{c.withdrawnPct}%</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{c.lastUpdated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ── Data Retention Tab ──────────────────────────────────────────────────

  const renderRetention = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-400 text-sm mb-1">
            <CheckCircle className="w-4 h-4" /> Active Schedules
          </div>
          <div className="text-2xl font-bold text-green-400">{retentionStats.active}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-400 text-sm mb-1">
            <Settings className="w-4 h-4" /> Auto-Delete On
          </div>
          <div className="text-2xl font-bold text-blue-400">{retentionStats.autoDeleteEnabled}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-400 text-sm mb-1">
            <AlertTriangle className="w-4 h-4" /> Expired
          </div>
          <div className="text-2xl font-bold text-red-400">{retentionStats.expired}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <Database className="w-4 h-4" /> Total Records
          </div>
          <div className="text-2xl font-bold text-white">{(retentionStats.totalRecords / 1000000).toFixed(1)}M</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          value={retentionStatusFilter}
          onChange={e => setRetentionStatusFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Paused">Paused</option>
          <option value="Expired">Expired</option>
        </select>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Data Category</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Retention Period</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Legal Basis</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Auto-Delete</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Records</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Last Purge</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Next Purge</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRetention.map(r => (
                <tr key={r.id} className="border-b border-slate-700/50 hover:bg-slate-750/50">
                  <td className="px-4 py-3 text-slate-200">{r.dataCategory}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{r.retentionPeriod}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{r.legalBasis}</td>
                  <td className="px-4 py-3">
                    {r.autoDeleteEnabled ? (
                      <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Enabled</span>
                    ) : (
                      <span className="text-xs text-slate-500 flex items-center gap-1"><X className="w-3 h-3" /> Disabled</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{r.recordsAffected.toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{r.lastPurgeDate}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${
                      new Date(r.nextPurgeDate) < new Date('2026-02-19') ? 'text-red-400 font-medium' : 'text-slate-400'
                    }`}>
                      {r.nextPurgeDate}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${retentionStatusColors[r.status]}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {r.status === 'Active' && (
                        <button className="p-1 text-red-400 hover:bg-red-500/20 rounded" title="Run Purge">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {r.status === 'Expired' && (
                        <button className="p-1 text-yellow-400 hover:bg-yellow-500/20 rounded" title="Review Schedule">
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button className="p-1 text-slate-400 hover:bg-slate-700 rounded" title="View Details">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ── Cross-Border Transfers Tab ──────────────────────────────────────────

  const renderTransfers = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-white mb-3">Transfer Mechanisms</h3>
          <div className="space-y-2">
            {(['SCC', 'BCR', 'Adequacy Decision', 'Derogation'] as const).map(mechanism => {
              const count = MOCK_TRANSFERS.filter(t => t.legalMechanism === mechanism).length;
              return (
                <div key={mechanism} className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{mechanism}</span>
                  <span className="text-xs font-medium text-slate-300">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-white mb-3">Risk Distribution</h3>
          <div className="space-y-2">
            {(['Low', 'Medium', 'High'] as const).map(risk => {
              const count = MOCK_TRANSFERS.filter(t => t.riskLevel === risk).length;
              const pct = MOCK_TRANSFERS.length > 0 ? (count / MOCK_TRANSFERS.length) * 100 : 0;
              return (
                <div key={risk} className="flex items-center gap-3">
                  <div className="w-16 text-xs text-slate-400">{risk}</div>
                  <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        risk === 'Low' ? 'bg-green-500' : risk === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="w-6 text-xs text-slate-400 text-right">{count}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-white mb-3">BCR Status Summary</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">BCR Transfers</span>
              <span className="text-xs font-medium text-white">{MOCK_TRANSFERS.filter(t => t.legalMechanism === 'BCR').length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">TIA Completed</span>
              <span className="text-xs font-medium text-green-400">{MOCK_TRANSFERS.filter(t => t.tiaCompleted).length} / {MOCK_TRANSFERS.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Pending Review</span>
              <span className="text-xs font-medium text-yellow-400">{MOCK_TRANSFERS.filter(t => t.status === 'Under Review').length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">TIA Missing</span>
              <span className={`text-xs font-medium ${MOCK_TRANSFERS.filter(t => !t.tiaCompleted).length > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {MOCK_TRANSFERS.filter(t => !t.tiaCompleted).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">Transfer Registry</h3>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Transfer
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Transfer Name</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Source</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Destination</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Mechanism</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">TIA</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Risk</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Review Date</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_TRANSFERS.map(t => (
                <tr key={t.id} className="border-b border-slate-700/50 hover:bg-slate-750/50">
                  <td className="px-4 py-3 text-slate-200">{t.transferName}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{t.sourceCountry}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{t.destinationCountry}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">{t.legalMechanism}</span>
                  </td>
                  <td className="px-4 py-3">
                    {t.tiaCompleted ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${transferRiskColors[t.riskLevel]}`}>{t.riskLevel}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${transferStatusColors[t.status]}`}>{t.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{t.reviewDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ── Marketing Opt-Out Tab ───────────────────────────────────────────────

  const renderOptOut = () => {
    const channelCounts: Record<string, number> = {};
    MOCK_SUPPRESSION.forEach(s => {
      s.channels.forEach(ch => {
        channelCounts[ch] = (channelCounts[ch] || 0) + 1;
      });
    });
    const activeEntries = MOCK_SUPPRESSION.filter(s => s.status === 'Active').length;
    const recentOptOuts = MOCK_SUPPRESSION.filter(s => {
      const daysDiff = Math.ceil((new Date('2026-02-19').getTime() - new Date(s.optOutDate).getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 7;
    }).length;
    const complianceRate = MOCK_SUPPRESSION.length > 0
      ? ((activeEntries / MOCK_SUPPRESSION.length) * 100).toFixed(1)
      : '0';

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-400 text-sm mb-1">
              <Ban className="w-4 h-4" /> Suppression Entries
            </div>
            <div className="text-2xl font-bold text-blue-400">{MOCK_SUPPRESSION.length}</div>
            <div className="text-xs text-slate-500 mt-1">{activeEntries} active</div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center gap-2 text-purple-400 text-sm mb-1">
              <Activity className="w-4 h-4" /> Recent Opt-Outs
            </div>
            <div className="text-2xl font-bold text-purple-400">{recentOptOuts}</div>
            <div className="text-xs text-slate-500 mt-1">last 7 days</div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-400 text-sm mb-1">
              <CheckCircle className="w-4 h-4" /> Compliance Rate
            </div>
            <div className="text-2xl font-bold text-green-400">{complianceRate}%</div>
            <div className="text-xs text-slate-500 mt-1">verified suppressions</div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
              <MessageSquare className="w-4 h-4" /> Channels Tracked
            </div>
            <div className="text-2xl font-bold text-white">{Object.keys(channelCounts).length}</div>
            <div className="text-xs text-slate-500 mt-1">Email, SMS, Phone, Post</div>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-white mb-3">Opt-Out by Channel</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { channel: 'Email', icon: <Mail className="w-5 h-5" />, color: 'text-blue-400' },
              { channel: 'SMS', icon: <MessageSquare className="w-5 h-5" />, color: 'text-green-400' },
              { channel: 'Phone', icon: <Phone className="w-5 h-5" />, color: 'text-purple-400' },
              { channel: 'Post', icon: <Send className="w-5 h-5" />, color: 'text-orange-400' },
            ].map(({ channel, icon, color }) => (
              <div key={channel} className="bg-slate-700/50 rounded-lg p-3 text-center">
                <div className={`${color} flex justify-center mb-2`}>{icon}</div>
                <div className="text-lg font-bold text-white">{channelCounts[channel] || 0}</div>
                <div className="text-xs text-slate-400">{channel}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-2 items-center">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search suppression list..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 w-64"
              />
            </div>
            <select
              value={optOutChannelFilter}
              onChange={e => setOptOutChannelFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Channels</option>
              <option value="Email">Email</option>
              <option value="SMS">SMS</option>
              <option value="Phone">Phone</option>
              <option value="Post">Post</option>
            </select>
          </div>
          <button className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors">
            <Download className="w-4 h-4" /> Export List
          </button>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Name</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Email</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Channels</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Opt-Out Date</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Source</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppression.map(s => (
                  <tr key={s.id} className="border-b border-slate-700/50 hover:bg-slate-750/50">
                    <td className="px-4 py-3 text-slate-200">{s.name}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{s.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {s.channels.map(ch => (
                          <span key={ch} className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">{ch}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{s.optOutDate}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{s.source}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        s.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredSuppression.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-sm">No entries match the current filters.</div>
          )}
        </div>
      </div>
    );
  };

  // ── Content Router ──────────────────────────────────────────────────────

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'dsar': return renderDSAR();
      case 'consent': return renderConsent();
      case 'retention': return renderRetention();
      case 'transfers': return renderTransfers();
      case 'optout': return renderOptOut();
      default: return null;
    }
  };

  // ── Main Return ─────────────────────────────────────────────────────────

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
                <Shield className="w-5 h-5 text-blue-400" />
                <h1 className="text-lg font-semibold text-white">Privacy Management Platform</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Last sync: 3 min ago</span>
              <button className="p-2 text-slate-400 hover:text-white transition-colors" title="Refresh">
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

      {renderCreateDSARModal()}
    </div>
  );
};
