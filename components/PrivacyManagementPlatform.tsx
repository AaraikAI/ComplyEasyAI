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

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { api } from '../services/api';
import { logger } from '../utils/logger';
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

// Mock data constants removed — component now initializes with empty state
// and shows error UI when API calls fail instead of silently displaying fake data.

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
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [dsarStatusFilter, setDsarStatusFilter] = useState<DSARStatus | 'All'>('All');
  const [dsarTypeFilter, setDsarTypeFilter] = useState<DSARType | 'All'>('All');
  const [showCreateDSAR, setShowCreateDSAR] = useState(false);
  const [retentionStatusFilter, setRetentionStatusFilter] = useState<string>('All');
  const [optOutChannelFilter, setOptOutChannelFilter] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dsars, setDsars] = useState<DSARRequest[]>([]);
  const [consent, setConsent] = useState<ConsentRecord[]>([]);
  const [retention, setRetention] = useState<RetentionSchedule[]>([]);
  const [transfers, setTransfers] = useState<CrossBorderTransfer[]>([]);
  const [suppression, setSuppression] = useState<SuppressionEntry[]>([]);
  const [avgResponseDays, setAvgResponseDays] = useState<number | null>(null);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [syncTick, forceSyncTick] = useState(0);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [assignTarget, setAssignTarget] = useState<DSARRequest | null>(null);
  const [assignName, setAssignName] = useState('');
  const [viewDSAR, setViewDSAR] = useState<DSARRequest | null>(null);
  const [showAddTransfer, setShowAddTransfer] = useState(false);
  const [newTransfer, setNewTransfer] = useState({ transferName: '', sourceCountry: '', destinationCountry: '', legalMechanism: 'SCC' });

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [dashRes, dsarRes, consentRes, retRes, sccRes, suppressionRes] = await Promise.allSettled([
        api.privacy.getDashboard(),
        api.privacy.listDSARs(),
        api.privacy.getConsentPurposes(),
        api.privacy.listRetention(),
        api.privacy.listSCCTIA(),
        api.privacy.getSuppressionList(),
      ]);
      const failedApis: string[] = [];
      if (dashRes.status === 'fulfilled') {
        const d: any = dashRes.value;
        if (d && typeof d.avgResponseTime === 'number') setAvgResponseDays(d.avgResponseTime);
      } else { failedApis.push('Dashboard'); }
      if (dsarRes.status === 'fulfilled') {
        const d = dsarRes.value;
        if (Array.isArray(d)) setDsars(d);
        else if (d?.data) setDsars(d.data);
      } else { failedApis.push('DSARs'); }
      if (consentRes.status === 'fulfilled') {
        const d = consentRes.value;
        if (Array.isArray(d)) setConsent(d);
        else if (d?.data) setConsent(d.data);
      } else { failedApis.push('Consent'); }
      if (retRes.status === 'fulfilled') {
        const d = retRes.value;
        if (Array.isArray(d)) setRetention(d);
        else if (d?.data) setRetention(d.data);
      } else { failedApis.push('Retention'); }
      if (sccRes.status === 'fulfilled') {
        const d = sccRes.value;
        if (Array.isArray(d)) setTransfers(d);
        else if (d?.data) setTransfers(d.data);
      } else { failedApis.push('Cross-Border Transfers'); }
      if (suppressionRes.status === 'fulfilled') {
        const d = suppressionRes.value;
        if (Array.isArray(d)) setSuppression(d);
        else if (d?.data) setSuppression(d.data);
      } else { failedApis.push('Suppression List'); }
      if (failedApis.length > 0) {
        setLoadError(`Failed to load: ${failedApis.join(', ')}. Showing available data only.`);
      }
      setLastSync(Date.now());
    } catch (err) {
      setLoadError('Failed to connect to the server. Please check your connection and try again.');
      logger.error('PrivacyManagementPlatform data load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Refresh the relative "last sync" label once a minute.
  useEffect(() => {
    const interval = setInterval(() => forceSyncTick(n => n + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  const lastSyncLabel = useMemo(() => {
    if (lastSync == null) return null;
    const diffMin = Math.floor((Date.now() - lastSync) / 60_000);
    if (diffMin < 1) return 'just now';
    if (diffMin === 1) return '1 min ago';
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHr = Math.floor(diffMin / 60);
    return diffHr === 1 ? '1 hour ago' : `${diffHr} hours ago`;
  }, [lastSync, syncTick]);

  // ── DSAR / Retention / Transfer Actions ─────────────────────────────────

  const runAction = useCallback(async (id: string, label: string, fn: () => Promise<unknown>) => {
    setActionBusyId(id);
    setActionError(null);
    try {
      await fn();
      await loadData();
    } catch (err) {
      logger.error(`Privacy ${label} action failed:`, err);
      setActionError(`Could not ${label}. Please try again.`);
    } finally {
      setActionBusyId(null);
    }
  }, [loadData]);

  const handleVerifyIdentity = useCallback((d: DSARRequest) => {
    runAction(d.id, 'verify identity', () => api.privacy.verifyDSARIdentity(d.id, { verificationMethod: 'manual review' }));
  }, [runAction]);

  const handleCompleteDSAR = useCallback((d: DSARRequest) => {
    runAction(d.id, 'mark complete', () => api.privacy.completeDSAR(d.id));
  }, [runAction]);

  const submitAssign = useCallback(() => {
    if (!assignTarget || !assignName.trim()) return;
    const target = assignTarget;
    const name = assignName.trim();
    setAssignTarget(null);
    setAssignName('');
    runAction(target.id, 'assign request', () => api.privacy.updateDSAR(target.id, { assignedTo: name }));
  }, [assignTarget, assignName, runAction]);

  const handleRunPurge = useCallback((r: RetentionSchedule) => {
    runAction(r.id, 'run purge', () => api.privacy.runRetentionJob(r.id));
  }, [runAction]);

  const handleReviewSchedule = useCallback((r: RetentionSchedule) => {
    runAction(r.id, 'review schedule', () => api.privacy.updateRetention(r.id, { status: 'Active' }));
  }, [runAction]);

  const submitAddTransfer = useCallback(() => {
    if (!newTransfer.transferName.trim()) return;
    // Map the transfer form to the SCC template fields the backend persists.
    const payload = {
      name: newTransfer.transferName.trim(),
      templateType: newTransfer.legalMechanism,
      dataExporter: newTransfer.sourceCountry,
      dataImporter: newTransfer.destinationCountry,
      transferDescription: `${newTransfer.sourceCountry} → ${newTransfer.destinationCountry} (${newTransfer.legalMechanism})`,
      status: 'Draft',
    };
    setShowAddTransfer(false);
    setNewTransfer({ transferName: '', sourceCountry: '', destinationCountry: '', legalMechanism: 'SCC' });
    runAction('new-transfer', 'add transfer', () => api.privacy.createSCCTIA(payload));
  }, [newTransfer, runAction]);

  // ── Computed Stats ──────────────────────────────────────────────────────

  const dsarStats = useMemo(() => {
    const total = dsars.length;
    const active = dsars.filter(d => !['Completed', 'Rejected'].includes(d.status)).length;
    const completed = dsars.filter(d => d.status === 'Completed').length;
    const overdue = dsars.filter(d => {
      if (d.status === 'Completed' || d.status === 'Rejected') return false;
      return new Date(d.deadline) < new Date();
    }).length;
    return { total, active, completed, overdue, avgResponseDays };
  }, [dsars, avgResponseDays]);

  const consentStats = useMemo(() => {
    if (consent.length === 0) return { avgGranted: '0', avgWithdrawn: '0', totalPurposes: 0 };
    const avgGranted = consent.reduce((sum, c) => sum + c.grantedPct, 0) / consent.length;
    const avgWithdrawn = consent.reduce((sum, c) => sum + c.withdrawnPct, 0) / consent.length;
    return { avgGranted: avgGranted.toFixed(1), avgWithdrawn: avgWithdrawn.toFixed(1), totalPurposes: consent.length };
  }, [consent]);

  const retentionStats = useMemo(() => {
    if (retention.length === 0) return { active: 0, autoDeleteEnabled: 0, expired: 0, totalRecords: 0, compliancePct: '0' };
    const active = retention.filter(r => r.status === 'Active').length;
    const autoDeleteEnabled = retention.filter(r => r.autoDeleteEnabled).length;
    const expired = retention.filter(r => r.status === 'Expired').length;
    const totalRecords = retention.reduce((sum, r) => sum + r.recordsAffected, 0);
    const compliancePct = ((active / retention.length) * 100).toFixed(0);
    return { active, autoDeleteEnabled, expired, totalRecords, compliancePct };
  }, [retention]);

  const filteredDSARs = useMemo(() => {
    return dsars.filter(d => {
      const matchesSearch = searchQuery === '' ||
        d.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.subjectEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = dsarStatusFilter === 'All' || d.status === dsarStatusFilter;
      const matchesType = dsarTypeFilter === 'All' || d.type === dsarTypeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [dsars, searchQuery, dsarStatusFilter, dsarTypeFilter]);

  const filteredRetention = useMemo(() => {
    if (retentionStatusFilter === 'All') return retention;
    return retention.filter(r => r.status === retentionStatusFilter);
  }, [retention, retentionStatusFilter]);

  const filteredSuppression = useMemo(() => {
    return suppression.filter(s => {
      const matchesSearch = searchQuery === '' ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesChannel = optOutChannelFilter === 'All' || s.channels.includes(optOutChannelFilter);
      return matchesSearch && matchesChannel;
    });
  }, [suppression, searchQuery, optOutChannelFilter]);

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
          <div className="text-3xl font-bold text-cyan-400">{dsarStats.avgResponseDays != null ? dsarStats.avgResponseDays : '—'}</div>
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
          <div className="text-xs text-slate-500 mt-1">{retentionStats.active} of {retention.length} schedules active</div>
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
              const count = dsars.filter(d => d.status === status).length;
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
            {consent.map(c => (
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
          {dsars
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
            <Globe className="w-4 h-4" /> {t('privacy.crossBorderTransfers')}
          </div>
          <div className="text-2xl font-bold text-white">{transfers.length}</div>
          <div className="text-xs text-slate-500 mt-1">
            {transfers.filter(xfer => xfer.status === 'Active').length} active, {transfers.filter(xfer => xfer.status === 'Under Review').length} under review
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-orange-400 text-sm mb-2">
            <Ban className="w-4 h-4" /> Suppression List
          </div>
          <div className="text-2xl font-bold text-white">{suppression.length}</div>
          <div className="text-xs text-slate-500 mt-1">
            {suppression.filter(s => s.status === 'Active').length} active entries
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
              placeholder={`${t('common.search')}...`}
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
            {(['Access', 'Deletion', 'Rectification', 'Portability', 'Restriction', 'Objection'] as DSARType[]).map(item => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setShowCreateDSAR(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> {t('privacy.dataSubjectRequests')}
        </button>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-4 py-3 text-slate-400 font-medium">ID</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">{t('common.type')}</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">{t('dpia.dataSubjects')}</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Submitted</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Deadline</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">{t('common.status')}</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">{t('common.assignee')}</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">{t('common.priority')}</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">{t('common.actions')}</th>
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
                          <button onClick={() => handleVerifyIdentity(d)} disabled={actionBusyId === d.id} className="p-1 text-cyan-400 hover:bg-cyan-500/20 rounded disabled:opacity-40" title="Verify Identity">
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {(d.status === 'Received' || d.status === 'Identity Verified') && d.assignedTo === 'Unassigned' && (
                          <button onClick={() => { setAssignTarget(d); setAssignName(''); }} disabled={actionBusyId === d.id} className="p-1 text-blue-400 hover:bg-blue-500/20 rounded disabled:opacity-40" title="Assign">
                            <Users className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {d.status === 'In Progress' && (
                          <button onClick={() => handleCompleteDSAR(d)} disabled={actionBusyId === d.id} className="p-1 text-green-400 hover:bg-green-500/20 rounded disabled:opacity-40" title="Mark Complete">
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => setViewDSAR(d)} className="p-1 text-slate-400 hover:bg-slate-700 rounded" title="View Details">
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
            <h3 className="text-lg font-medium text-white">{t('privacy.dataSubjectRequests')}</h3>
            <button onClick={() => setShowCreateDSAR(false)} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Request Type</label>
              <select className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                {(['Access', 'Deletion', 'Rectification', 'Portability', 'Restriction', 'Objection'] as DSARType[]).map(item => (
                  <option key={item} value={item}>{item}</option>
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
              <label className="block text-sm text-slate-400 mb-1">{t('common.priority')}</label>
              <select className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">{t('common.description')}</label>
              <textarea rows={3} placeholder="Details of the request..." className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none" />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setShowCreateDSAR(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={async () => {
                  try { await api.privacy.createDSAR({ type: 'Access', status: 'Received' }); setShowCreateDSAR(false); loadData(); } catch { setShowCreateDSAR(false); }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
              >
                {t('common.create')}
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
          {consent.map(c => (
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
          <h3 className="text-sm font-medium text-white">{t('privacy.consentManagement')}</h3>
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
              {consent.map(c => (
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
                        <button
                          onClick={() => { if (window.confirm(`Run purge for "${r.dataCategory}"? This enforces the retention policy.`)) handleRunPurge(r); }}
                          disabled={actionBusyId === r.id}
                          className="p-1 text-red-400 hover:bg-red-500/20 rounded disabled:opacity-40"
                          title="Run Purge"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {r.status === 'Expired' && (
                        <button onClick={() => handleReviewSchedule(r)} disabled={actionBusyId === r.id} className="p-1 text-yellow-400 hover:bg-yellow-500/20 rounded disabled:opacity-40" title="Review Schedule">
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      )}
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
              const count = transfers.filter(xfer => xfer.legalMechanism === mechanism).length;
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
              const count = transfers.filter(xfer => xfer.riskLevel === risk).length;
              const pct = transfers.length > 0 ? (count / transfers.length) * 100 : 0;
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
              <span className="text-xs font-medium text-white">{transfers.filter(xfer => xfer.legalMechanism === 'BCR').length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">TIA Completed</span>
              <span className="text-xs font-medium text-green-400">{transfers.filter(xfer => xfer.tiaCompleted).length} / {transfers.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Pending Review</span>
              <span className="text-xs font-medium text-yellow-400">{transfers.filter(xfer => xfer.status === 'Under Review').length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">TIA Missing</span>
              <span className={`text-xs font-medium ${transfers.filter(xfer => !xfer.tiaCompleted).length > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {transfers.filter(xfer => !xfer.tiaCompleted).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">{t('privacy.crossBorderTransfers')}</h3>
          <button onClick={() => setShowAddTransfer(true)} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs transition-colors">
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
              {transfers.map(xfer => (
                <tr key={xfer.id} className="border-b border-slate-700/50 hover:bg-slate-750/50">
                  <td className="px-4 py-3 text-slate-200">{xfer.transferName}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{xfer.sourceCountry}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{xfer.destinationCountry}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">{xfer.legalMechanism}</span>
                  </td>
                  <td className="px-4 py-3">
                    {xfer.tiaCompleted ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${transferRiskColors[xfer.riskLevel]}`}>{xfer.riskLevel}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${transferStatusColors[xfer.status]}`}>{xfer.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{xfer.reviewDate}</td>
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
    suppression.forEach(s => {
      s.channels.forEach(ch => {
        channelCounts[ch] = (channelCounts[ch] || 0) + 1;
      });
    });
    const activeEntries = suppression.filter(s => s.status === 'Active').length;
    const recentOptOuts = suppression.filter(s => {
      const daysDiff = Math.ceil((new Date('2026-02-19').getTime() - new Date(s.optOutDate).getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 7;
    }).length;
    const complianceRate = suppression.length > 0
      ? ((activeEntries / suppression.length) * 100).toFixed(1)
      : '0';

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-400 text-sm mb-1">
              <Ban className="w-4 h-4" /> Suppression Entries
            </div>
            <div className="text-2xl font-bold text-blue-400">{suppression.length}</div>
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
                placeholder={`${t('common.search')}...`}
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
            <Download className="w-4 h-4" /> {t('common.export')}
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

  // ── Action Modals ───────────────────────────────────────────────────────

  const renderAssignModal = () => {
    if (!assignTarget) return null;
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 w-full max-w-sm mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">Assign Request {assignTarget.id}</h3>
            <button onClick={() => setAssignTarget(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          <label className="block text-sm text-slate-400 mb-1">Assignee</label>
          <input
            type="text"
            autoFocus
            value={assignName}
            onChange={e => setAssignName(e.target.value)}
            placeholder="Team member name"
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="flex gap-3 justify-end pt-4">
            <button onClick={() => setAssignTarget(null)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">{t('common.cancel')}</button>
            <button onClick={submitAssign} disabled={!assignName.trim()} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm rounded-lg transition-colors">Assign</button>
          </div>
        </div>
      </div>
    );
  };

  const renderViewDSARModal = () => {
    if (!viewDSAR) return null;
    const d = viewDSAR;
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 w-full max-w-lg mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">Request {d.id}</h3>
            <button onClick={() => setViewDSAR(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-400">{t('common.type')}</span><span className="text-slate-200">{d.type}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">{t('dpia.dataSubjects')}</span><span className="text-slate-200">{d.subjectName}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Email</span><span className="text-slate-200">{d.subjectEmail}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">{t('common.status')}</span><span className="text-slate-200">{d.status}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">{t('common.assignee')}</span><span className="text-slate-200">{d.assignedTo}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">{t('common.priority')}</span><span className="text-slate-200">{d.priority}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Submitted</span><span className="text-slate-200">{d.submissionDate}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Deadline</span><span className="text-slate-200">{d.deadline}</span></div>
            {d.description && <div className="pt-2 text-slate-300">{d.description}</div>}
          </div>
        </div>
      </div>
    );
  };

  const renderAddTransferModal = () => {
    if (!showAddTransfer) return null;
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 w-full max-w-lg mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">Add Cross-Border Transfer</h3>
            <button onClick={() => setShowAddTransfer(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Transfer Name</label>
              <input type="text" value={newTransfer.transferName} onChange={e => setNewTransfer(v => ({ ...v, transferName: e.target.value }))} placeholder="Transfer name" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Source Country</label>
                <input type="text" value={newTransfer.sourceCountry} onChange={e => setNewTransfer(v => ({ ...v, sourceCountry: e.target.value }))} placeholder="e.g. Germany" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Destination Country</label>
                <input type="text" value={newTransfer.destinationCountry} onChange={e => setNewTransfer(v => ({ ...v, destinationCountry: e.target.value }))} placeholder="e.g. United States" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Legal Mechanism</label>
              <select value={newTransfer.legalMechanism} onChange={e => setNewTransfer(v => ({ ...v, legalMechanism: e.target.value }))} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                {(['SCC', 'BCR', 'Adequacy Decision', 'Derogation'] as const).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setShowAddTransfer(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">{t('common.cancel')}</button>
              <button onClick={submitAddTransfer} disabled={!newTransfer.transferName.trim()} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm rounded-lg transition-colors">{t('common.create')}</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Content Router ──────────────────────────────────────────────────────

  const renderActionError = () => actionError ? (
    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-between">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
        <span className="text-sm text-red-300">{actionError}</span>
      </div>
      <button onClick={() => setActionError(null)} className="text-red-300/70 hover:text-red-300"><X className="w-4 h-4" /></button>
    </div>
  ) : null;

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
                <span className="text-sm">{t('common.back')}</span>
              </button>
              <div className="h-5 w-px bg-slate-700" />
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                <h1 className="text-lg font-semibold text-white">{t('privacy.title')}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {lastSyncLabel && <span className="text-xs text-slate-500">Last sync: {lastSyncLabel}</span>}
              <button onClick={loadData} disabled={loading} className="p-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50" title="Refresh">
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
        {renderActionError()}
        {renderContent()}
      </div>

      {renderCreateDSARModal()}
      {renderAssignModal()}
      {renderViewDSARModal()}
      {renderAddTransferModal()}
    </div>
  );
};

export default PrivacyManagementPlatform;
