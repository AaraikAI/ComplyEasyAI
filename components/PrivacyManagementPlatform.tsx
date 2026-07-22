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
  'Received': 'bg-signal-blue/20 text-signal-blue border-signal-blue/30',
  'Identity Verified': 'bg-signal-blue/20 text-signal-blue border-signal-blue/30',
  'In Progress': 'bg-signal-warn/20 text-signal-warn border-signal-warn/30',
  'Completed': 'bg-signal-good/20 text-signal-good border-signal-good/30',
  'Rejected': 'bg-signal-bad/20 text-signal-bad border-signal-bad/30',
};

const dsarTypeColors: Record<DSARType, string> = {
  'Access': 'bg-signal-blue/20 text-signal-blue',
  'Deletion': 'bg-signal-bad/20 text-signal-bad',
  'Rectification': 'bg-signal-warn/20 text-signal-warn',
  'Portability': 'bg-signal-violet/20 text-signal-violet',
  'Restriction': 'bg-signal-amber/20 text-signal-amber',
  'Objection': 'bg-signal-bad/20 text-signal-bad',
};

const priorityColors: Record<DSARPriority, string> = {
  'High': 'text-signal-bad',
  'Medium': 'text-signal-warn',
  'Low': 'text-signal-body',
};

const retentionStatusColors: Record<string, string> = {
  'Active': 'bg-signal-good/20 text-signal-good',
  'Paused': 'bg-signal-warn/20 text-signal-warn',
  'Expired': 'bg-signal-bad/20 text-signal-bad',
};

const transferRiskColors: Record<string, string> = {
  'Low': 'bg-signal-good/20 text-signal-good',
  'Medium': 'bg-signal-warn/20 text-signal-warn',
  'High': 'bg-signal-bad/20 text-signal-bad',
};

const transferStatusColors: Record<string, string> = {
  'Active': 'bg-signal-good/20 text-signal-good',
  'Under Review': 'bg-signal-warn/20 text-signal-warn',
  'Suspended': 'bg-signal-bad/20 text-signal-bad',
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
  const [newDSAR, setNewDSAR] = useState<{ type: DSARType; subjectName: string; subjectEmail: string; priority: DSARPriority; description: string }>({ type: 'Access', subjectName: '', subjectEmail: '', priority: 'Medium', description: '' });

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
    if (lastSync === null || lastSync === undefined) return null;
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

  const submitCreateDSAR = useCallback(() => {
    if (!newDSAR.subjectName.trim() || !newDSAR.subjectEmail.trim()) return;
    const payload = {
      type: newDSAR.type,
      status: 'Received',
      subjectName: newDSAR.subjectName.trim(),
      subjectEmail: newDSAR.subjectEmail.trim(),
      priority: newDSAR.priority,
      description: newDSAR.description.trim(),
    };
    setShowCreateDSAR(false);
    setNewDSAR({ type: 'Access', subjectName: '', subjectEmail: '', priority: 'Medium', description: '' });
    runAction('new-dsar', 'create request', () => api.privacy.createDSAR(payload));
  }, [newDSAR, runAction]);

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
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
          <div className="flex items-center gap-2 text-signal-blue font-mono text-[10px] uppercase tracking-[0.14em] mb-1">
            <FileText className="w-4 h-4" /> Active DSARs
          </div>
          <div className="text-3xl font-display font-bold text-signal-blue">{dsarStats.active}</div>
          <div className="text-xs text-signal-muted mt-1">{dsarStats.total} total requests</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
          <div className="flex items-center gap-2 text-signal-blue font-mono text-[10px] uppercase tracking-[0.14em] mb-1">
            <Clock className="w-4 h-4" /> Avg Response Time
          </div>
          <div className="text-3xl font-display font-bold text-signal-blue">{dsarStats.avgResponseDays !== null && dsarStats.avgResponseDays !== undefined ? dsarStats.avgResponseDays : '—'}</div>
          <div className="text-xs text-signal-muted mt-1">days (30-day deadline)</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
          <div className="flex items-center gap-2 text-signal-good font-mono text-[10px] uppercase tracking-[0.14em] mb-1">
            <UserCheck className="w-4 h-4" /> Consent Rate
          </div>
          <div className="text-3xl font-display font-bold text-signal-good">{consentStats.avgGranted}%</div>
          <div className="text-xs text-signal-muted mt-1">avg across {consentStats.totalPurposes} purposes</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
          <div className="flex items-center gap-2 text-signal-good font-mono text-[10px] uppercase tracking-[0.14em] mb-1">
            <Database className="w-4 h-4" /> Retention Compliance
          </div>
          <div className="text-3xl font-display font-bold text-signal-good">{retentionStats.compliancePct}%</div>
          <div className="text-xs text-signal-muted mt-1">{retentionStats.active} of {retention.length} schedules active</div>
        </div>
      </div>

      {dsarStats.overdue > 0 && (
        <div className="bg-signal-bad/10 border border-signal-bad/30 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-signal-bad flex-shrink-0" />
          <div>
            <div className="text-sm font-medium text-signal-bad">{dsarStats.overdue} DSAR(s) past deadline</div>
            <div className="text-xs text-signal-bad/70">Immediate attention required to maintain regulatory compliance</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
          <h3 className="text-sm font-medium text-signal-ink mb-3">DSAR Status Distribution</h3>
          <div className="space-y-2">
            {(['Received', 'Identity Verified', 'In Progress', 'Completed', 'Rejected'] as DSARStatus[]).map(status => {
              const count = dsars.filter(d => d.status === status).length;
              const pct = dsarStats.total > 0 ? (count / dsarStats.total) * 100 : 0;
              return (
                <div key={status} className="flex items-center gap-3">
                  <div className="w-28 text-xs text-signal-body">{status}</div>
                  <div className="flex-1 bg-white/[0.06] rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        status === 'Completed' ? 'bg-signal-good' :
                        status === 'Rejected' ? 'bg-signal-bad' :
                        status === 'In Progress' ? 'bg-signal-warn' :
                        status === 'Identity Verified' ? 'bg-signal-blue' :
                        'bg-signal-blue'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="w-6 text-xs text-signal-body text-right">{count}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
          <h3 className="text-sm font-medium text-signal-ink mb-3">Consent Rates by Purpose</h3>
          <div className="space-y-2">
            {consent.map(c => (
              <div key={c.id} className="flex items-center gap-3">
                <div className="w-36 text-xs text-signal-body truncate" title={c.purpose}>{c.purpose}</div>
                <div className="flex-1 bg-white/[0.06] rounded-full h-2 overflow-hidden">
                  <div className="h-full rounded-full bg-signal-good" style={{ width: `${c.grantedPct}%` }} />
                </div>
                <div className="w-12 text-xs text-signal-body text-right">{c.grantedPct}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
        <h3 className="text-sm font-medium text-signal-ink mb-3">Upcoming Deadlines</h3>
        <div className="space-y-2">
          {dsars
            .filter(d => !['Completed', 'Rejected'].includes(d.status))
            .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
            .map(d => {
              const daysLeft = Math.ceil((new Date(d.deadline).getTime() - new Date('2026-02-19').getTime()) / (1000 * 60 * 60 * 24));
              const isUrgent = daysLeft <= 7;
              return (
                <div key={d.id} className="flex items-center justify-between py-1.5 border-b border-white/[0.06] last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-signal-muted">{d.id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${dsarTypeColors[d.type]}`}>{d.type}</span>
                    <span className="text-sm text-signal-body">{d.subjectName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${isUrgent ? 'text-signal-bad font-medium' : 'text-signal-body'}`}>
                      {daysLeft <= 0 ? 'OVERDUE' : `${daysLeft} days left`}
                    </span>
                    <Calendar className={`w-3.5 h-3.5 ${isUrgent ? 'text-signal-bad' : 'text-signal-muted'}`} />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
          <div className="flex items-center gap-2 text-signal-violet font-mono text-[10px] uppercase tracking-[0.14em] mb-2">
            <Globe className="w-4 h-4" /> {t('privacy.crossBorderTransfers')}
          </div>
          <div className="text-2xl font-display font-bold text-signal-ink">{transfers.length}</div>
          <div className="text-xs text-signal-muted mt-1">
            {transfers.filter(xfer => xfer.status === 'Active').length} active, {transfers.filter(xfer => xfer.status === 'Under Review').length} under review
          </div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
          <div className="flex items-center gap-2 text-signal-amber font-mono text-[10px] uppercase tracking-[0.14em] mb-2">
            <Ban className="w-4 h-4" /> Suppression List
          </div>
          <div className="text-2xl font-display font-bold text-signal-ink">{suppression.length}</div>
          <div className="text-xs text-signal-muted mt-1">
            {suppression.filter(s => s.status === 'Active').length} active entries
          </div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
          <div className="flex items-center gap-2 text-signal-bad font-mono text-[10px] uppercase tracking-[0.14em] mb-2">
            <AlertTriangle className="w-4 h-4" /> Retention Overdue
          </div>
          <div className="text-2xl font-display font-bold text-signal-ink">{retentionStats.expired}</div>
          <div className="text-xs text-signal-muted mt-1">schedules past retention period</div>
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
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-signal-body" />
            <input
              type="text"
              placeholder={`${t('common.search')}...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 bg-white/[0.04] border border-white/[0.10] rounded-xl text-sm text-signal-ink placeholder-signal-muted focus:outline-none focus:ring-1 focus:ring-signal-green w-64"
            />
          </div>
          <select
            value={dsarStatusFilter}
            onChange={e => setDsarStatusFilter(e.target.value as DSARStatus | 'All')}
            className="bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-sm text-signal-ink focus:outline-none focus:ring-1 focus:ring-signal-green"
          >
            <option value="All">All Statuses</option>
            {(['Received', 'Identity Verified', 'In Progress', 'Completed', 'Rejected'] as DSARStatus[]).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={dsarTypeFilter}
            onChange={e => setDsarTypeFilter(e.target.value as DSARType | 'All')}
            className="bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-sm text-signal-ink focus:outline-none focus:ring-1 focus:ring-signal-green"
          >
            <option value="All">All Types</option>
            {(['Access', 'Deletion', 'Rectification', 'Portability', 'Restriction', 'Objection'] as DSARType[]).map(item => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setShowCreateDSAR(true)}
          className="flex items-center gap-2 px-4 py-2 bg-signal-green hover:bg-signal-green/90 text-signal-canvas font-medium rounded-lg text-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> {t('privacy.dataSubjectRequests')}
        </button>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-4 py-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">ID</th>
                <th className="text-left px-4 py-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">{t('common.type')}</th>
                <th className="text-left px-4 py-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">{t('dpia.dataSubjects')}</th>
                <th className="text-left px-4 py-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Submitted</th>
                <th className="text-left px-4 py-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Deadline</th>
                <th className="text-left px-4 py-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">{t('common.status')}</th>
                <th className="text-left px-4 py-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">{t('common.assignee')}</th>
                <th className="text-left px-4 py-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">{t('common.priority')}</th>
                <th className="text-left px-4 py-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredDSARs.map(d => {
                const daysLeft = Math.ceil((new Date(d.deadline).getTime() - new Date('2026-02-19').getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <tr key={d.id} className="border-b border-white/[0.06] hover:bg-white/[0.04]">
                    <td className="px-4 py-3 font-mono text-xs text-signal-body">{d.id}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${dsarTypeColors[d.type]}`}>{d.type}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-signal-body">{d.subjectName}</div>
                      <div className="text-xs text-signal-muted">{d.subjectEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-signal-body text-xs">{d.submissionDate}</td>
                    <td className="px-4 py-3">
                      <div className={`text-xs ${daysLeft <= 7 && !['Completed', 'Rejected'].includes(d.status) ? 'text-signal-bad font-medium' : 'text-signal-body'}`}>
                        {d.deadline}
                      </div>
                      {!['Completed', 'Rejected'].includes(d.status) && (
                        <div className={`text-xs mt-0.5 ${daysLeft <= 0 ? 'text-signal-bad' : daysLeft <= 7 ? 'text-signal-amber' : 'text-signal-muted'}`}>
                          {daysLeft <= 0 ? 'OVERDUE' : `${daysLeft}d remaining`}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded border ${dsarStatusColors[d.status]}`}>{d.status}</span>
                    </td>
                    <td className="px-4 py-3 text-signal-body text-xs">{d.assignedTo}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${priorityColors[d.priority]}`}>{d.priority}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {d.status === 'Received' && (
                          <button onClick={() => handleVerifyIdentity(d)} disabled={actionBusyId === d.id} className="p-1 text-signal-blue hover:bg-signal-blue/20 rounded disabled:opacity-40" title="Verify Identity">
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {(d.status === 'Received' || d.status === 'Identity Verified') && d.assignedTo === 'Unassigned' && (
                          <button onClick={() => { setAssignTarget(d); setAssignName(''); }} disabled={actionBusyId === d.id} className="p-1 text-signal-blue hover:bg-signal-blue/20 rounded disabled:opacity-40" title="Assign">
                            <Users className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {d.status === 'In Progress' && (
                          <button onClick={() => handleCompleteDSAR(d)} disabled={actionBusyId === d.id} className="p-1 text-signal-good hover:bg-signal-good/20 rounded disabled:opacity-40" title="Mark Complete">
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => setViewDSAR(d)} className="p-1 text-signal-body hover:bg-white/[0.06] rounded" title="View Details">
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
          <div className="text-center py-8 text-signal-muted text-sm">No DSARs match the current filters.</div>
        )}
      </div>
    </div>
  );

  // ── Create DSAR Modal ───────────────────────────────────────────────────

  const renderCreateDSARModal = () => {
    if (!showCreateDSAR) return null;
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-signal-panel2 border border-white/[0.08] rounded-2xl p-6 w-full max-w-lg mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-signal-ink">{t('privacy.dataSubjectRequests')}</h3>
            <button onClick={() => setShowCreateDSAR(false)} className="text-signal-body hover:text-signal-ink">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-signal-body mb-1">Request Type</label>
              <select
                value={newDSAR.type}
                onChange={e => setNewDSAR(v => ({ ...v, type: e.target.value as DSARType }))}
                className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-sm text-signal-ink focus:outline-none focus:ring-1 focus:ring-signal-green"
              >
                {(['Access', 'Deletion', 'Rectification', 'Portability', 'Restriction', 'Objection'] as DSARType[]).map(item => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-signal-body mb-1">Subject Name</label>
                <input type="text" value={newDSAR.subjectName} onChange={e => setNewDSAR(v => ({ ...v, subjectName: e.target.value }))} placeholder="Full name" className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-sm text-signal-ink placeholder-signal-muted focus:outline-none focus:ring-1 focus:ring-signal-green" />
              </div>
              <div>
                <label className="block text-sm text-signal-body mb-1">Subject Email</label>
                <input type="email" value={newDSAR.subjectEmail} onChange={e => setNewDSAR(v => ({ ...v, subjectEmail: e.target.value }))} placeholder="Email address" className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-sm text-signal-ink placeholder-signal-muted focus:outline-none focus:ring-1 focus:ring-signal-green" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-signal-body mb-1">{t('common.priority')}</label>
              <select
                value={newDSAR.priority}
                onChange={e => setNewDSAR(v => ({ ...v, priority: e.target.value as DSARPriority }))}
                className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-sm text-signal-ink focus:outline-none focus:ring-1 focus:ring-signal-green"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-signal-body mb-1">{t('common.description')}</label>
              <textarea rows={3} value={newDSAR.description} onChange={e => setNewDSAR(v => ({ ...v, description: e.target.value }))} placeholder="Details of the request..." className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-sm text-signal-ink placeholder-signal-muted focus:outline-none focus:ring-1 focus:ring-signal-green resize-none" />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setShowCreateDSAR(false)}
                className="px-4 py-2 text-sm text-signal-body hover:text-signal-ink transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={submitCreateDSAR}
                disabled={!newDSAR.subjectName.trim() || !newDSAR.subjectEmail.trim()}
                className="px-4 py-2 bg-signal-green hover:bg-signal-green/90 disabled:opacity-40 text-signal-canvas font-medium text-sm rounded-lg transition-colors"
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
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
          <div className="flex items-center gap-2 text-signal-good font-mono text-[10px] uppercase tracking-[0.14em] mb-1">
            <CheckCircle className="w-4 h-4" /> Avg Consent Rate
          </div>
          <div className="text-3xl font-display font-bold text-signal-good">{consentStats.avgGranted}%</div>
          <div className="text-xs text-signal-muted mt-1">across all purposes</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
          <div className="flex items-center gap-2 text-signal-bad font-mono text-[10px] uppercase tracking-[0.14em] mb-1">
            <X className="w-4 h-4" /> Avg Withdrawal Rate
          </div>
          <div className="text-3xl font-display font-bold text-signal-bad">{consentStats.avgWithdrawn}%</div>
          <div className="text-xs text-signal-muted mt-1">across all purposes</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
          <div className="flex items-center gap-2 text-signal-blue font-mono text-[10px] uppercase tracking-[0.14em] mb-1">
            <Settings className="w-4 h-4" /> Active Purposes
          </div>
          <div className="text-3xl font-display font-bold text-signal-blue">{consentStats.totalPurposes}</div>
          <div className="text-xs text-signal-muted mt-1">configured consent categories</div>
        </div>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
        <h3 className="text-sm font-medium text-signal-ink mb-4">Consent Rates by Purpose</h3>
        <div className="space-y-4">
          {consent.map(c => (
            <div key={c.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-signal-body">{c.purpose}</span>
                <span className="text-xs text-signal-muted">{c.totalRecords.toLocaleString()} records</span>
              </div>
              <div className="flex h-3 rounded-full overflow-hidden bg-white/[0.06]">
                <div
                  className="bg-signal-good transition-all"
                  style={{ width: `${c.grantedPct}%` }}
                  title={`Granted: ${c.grantedPct}%`}
                />
                <div
                  className="bg-signal-bad transition-all"
                  style={{ width: `${c.withdrawnPct}%` }}
                  title={`Withdrawn: ${c.withdrawnPct}%`}
                />
                <div
                  className="bg-white/20 transition-all"
                  style={{ width: `${c.pendingPct}%` }}
                  title={`Pending: ${c.pendingPct}%`}
                />
              </div>
              <div className="flex gap-4 text-xs">
                <span className="text-signal-good">Granted: {c.grantedPct}%</span>
                <span className="text-signal-bad">Withdrawn: {c.withdrawnPct}%</span>
                <span className="text-signal-muted">Pending: {c.pendingPct}%</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-4 pt-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-signal-good" />
            <span className="text-xs text-signal-body">Granted</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-signal-bad" />
            <span className="text-xs text-signal-body">Withdrawn</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-white/20" />
            <span className="text-xs text-signal-body">Pending</span>
          </div>
        </div>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.06]">
          <h3 className="text-sm font-medium text-signal-ink">{t('privacy.consentManagement')}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-4 py-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Purpose</th>
                <th className="text-left px-4 py-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Legal Basis</th>
                <th className="text-left px-4 py-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Total Records</th>
                <th className="text-left px-4 py-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Granted</th>
                <th className="text-left px-4 py-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Withdrawn</th>
                <th className="text-left px-4 py-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {consent.map(c => (
                <tr key={c.id} className="border-b border-white/[0.06] hover:bg-white/[0.04]">
                  <td className="px-4 py-3 text-signal-body">{c.purpose}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded bg-white/[0.06] text-signal-body">{c.legalBasis}</span>
                  </td>
                  <td className="px-4 py-3 text-signal-body">{c.totalRecords.toLocaleString()}</td>
                  <td className="px-4 py-3 text-signal-good">{c.grantedPct}%</td>
                  <td className="px-4 py-3 text-signal-bad">{c.withdrawnPct}%</td>
                  <td className="px-4 py-3 text-signal-body text-xs">{c.lastUpdated}</td>
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
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
          <div className="flex items-center gap-2 text-signal-good font-mono text-[10px] uppercase tracking-[0.14em] mb-1">
            <CheckCircle className="w-4 h-4" /> Active Schedules
          </div>
          <div className="text-2xl font-display font-bold text-signal-good">{retentionStats.active}</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
          <div className="flex items-center gap-2 text-signal-blue font-mono text-[10px] uppercase tracking-[0.14em] mb-1">
            <Settings className="w-4 h-4" /> Auto-Delete On
          </div>
          <div className="text-2xl font-display font-bold text-signal-blue">{retentionStats.autoDeleteEnabled}</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
          <div className="flex items-center gap-2 text-signal-bad font-mono text-[10px] uppercase tracking-[0.14em] mb-1">
            <AlertTriangle className="w-4 h-4" /> Expired
          </div>
          <div className="text-2xl font-display font-bold text-signal-bad">{retentionStats.expired}</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
          <div className="flex items-center gap-2 text-signal-body font-mono text-[10px] uppercase tracking-[0.14em] mb-1">
            <Database className="w-4 h-4" /> Total Records
          </div>
          <div className="text-2xl font-display font-bold text-signal-ink">{(retentionStats.totalRecords / 1000000).toFixed(1)}M</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-signal-body" />
        <select
          value={retentionStatusFilter}
          onChange={e => setRetentionStatusFilter(e.target.value)}
          className="bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-sm text-signal-ink focus:outline-none focus:ring-1 focus:ring-signal-green"
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Paused">Paused</option>
          <option value="Expired">Expired</option>
        </select>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-4 py-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Data Category</th>
                <th className="text-left px-4 py-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Retention Period</th>
                <th className="text-left px-4 py-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Legal Basis</th>
                <th className="text-left px-4 py-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Auto-Delete</th>
                <th className="text-left px-4 py-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Records</th>
                <th className="text-left px-4 py-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Last Purge</th>
                <th className="text-left px-4 py-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Next Purge</th>
                <th className="text-left px-4 py-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Status</th>
                <th className="text-left px-4 py-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRetention.map(r => (
                <tr key={r.id} className="border-b border-white/[0.06] hover:bg-white/[0.04]">
                  <td className="px-4 py-3 text-signal-body">{r.dataCategory}</td>
                  <td className="px-4 py-3 text-signal-body text-xs">{r.retentionPeriod}</td>
                  <td className="px-4 py-3 text-signal-body text-xs">{r.legalBasis}</td>
                  <td className="px-4 py-3">
                    {r.autoDeleteEnabled ? (
                      <span className="text-xs text-signal-good flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Enabled</span>
                    ) : (
                      <span className="text-xs text-signal-muted flex items-center gap-1"><X className="w-3 h-3" /> Disabled</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-signal-body text-xs">{r.recordsAffected.toLocaleString()}</td>
                  <td className="px-4 py-3 text-signal-body text-xs">{r.lastPurgeDate}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${
                      new Date(r.nextPurgeDate) < new Date('2026-02-19') ? 'text-signal-bad font-medium' : 'text-signal-body'
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
                          className="p-1 text-signal-bad hover:bg-signal-bad/20 rounded disabled:opacity-40"
                          title="Run Purge"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {r.status === 'Expired' && (
                        <button onClick={() => handleReviewSchedule(r)} disabled={actionBusyId === r.id} className="p-1 text-signal-warn hover:bg-signal-warn/20 rounded disabled:opacity-40" title="Review Schedule">
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
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
          <h3 className="text-sm font-medium text-signal-ink mb-3">Transfer Mechanisms</h3>
          <div className="space-y-2">
            {(['SCC', 'BCR', 'Adequacy Decision', 'Derogation'] as const).map(mechanism => {
              const count = transfers.filter(xfer => xfer.legalMechanism === mechanism).length;
              return (
                <div key={mechanism} className="flex items-center justify-between">
                  <span className="text-xs text-signal-body">{mechanism}</span>
                  <span className="text-xs font-medium text-signal-body">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
          <h3 className="text-sm font-medium text-signal-ink mb-3">Risk Distribution</h3>
          <div className="space-y-2">
            {(['Low', 'Medium', 'High'] as const).map(risk => {
              const count = transfers.filter(xfer => xfer.riskLevel === risk).length;
              const pct = transfers.length > 0 ? (count / transfers.length) * 100 : 0;
              return (
                <div key={risk} className="flex items-center gap-3">
                  <div className="w-16 text-xs text-signal-body">{risk}</div>
                  <div className="flex-1 bg-white/[0.06] rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        risk === 'Low' ? 'bg-signal-good' : risk === 'Medium' ? 'bg-signal-warn' : 'bg-signal-bad'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="w-6 text-xs text-signal-body text-right">{count}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
          <h3 className="text-sm font-medium text-signal-ink mb-3">BCR Status Summary</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-signal-body">BCR Transfers</span>
              <span className="text-xs font-medium text-signal-ink">{transfers.filter(xfer => xfer.legalMechanism === 'BCR').length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-signal-body">TIA Completed</span>
              <span className="text-xs font-medium text-signal-good">{transfers.filter(xfer => xfer.tiaCompleted).length} / {transfers.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-signal-body">Pending Review</span>
              <span className="text-xs font-medium text-signal-warn">{transfers.filter(xfer => xfer.status === 'Under Review').length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-signal-body">TIA Missing</span>
              <span className={`text-xs font-medium ${transfers.filter(xfer => !xfer.tiaCompleted).length > 0 ? 'text-signal-bad' : 'text-signal-good'}`}>
                {transfers.filter(xfer => !xfer.tiaCompleted).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
          <h3 className="text-sm font-medium text-signal-ink">{t('privacy.crossBorderTransfers')}</h3>
          <button onClick={() => setShowAddTransfer(true)} className="flex items-center gap-2 px-3 py-1.5 bg-signal-green hover:bg-signal-green/90 text-signal-canvas font-medium rounded-lg text-xs transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Transfer
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-4 py-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Transfer Name</th>
                <th className="text-left px-4 py-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Source</th>
                <th className="text-left px-4 py-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Destination</th>
                <th className="text-left px-4 py-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Mechanism</th>
                <th className="text-left px-4 py-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">TIA</th>
                <th className="text-left px-4 py-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Risk</th>
                <th className="text-left px-4 py-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Status</th>
                <th className="text-left px-4 py-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Review Date</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map(xfer => (
                <tr key={xfer.id} className="border-b border-white/[0.06] hover:bg-white/[0.04]">
                  <td className="px-4 py-3 text-signal-body">{xfer.transferName}</td>
                  <td className="px-4 py-3 text-signal-body text-xs">{xfer.sourceCountry}</td>
                  <td className="px-4 py-3 text-signal-body text-xs">{xfer.destinationCountry}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded bg-white/[0.06] text-signal-body">{xfer.legalMechanism}</span>
                  </td>
                  <td className="px-4 py-3">
                    {xfer.tiaCompleted ? (
                      <CheckCircle className="w-4 h-4 text-signal-good" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-signal-bad" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${transferRiskColors[xfer.riskLevel]}`}>{xfer.riskLevel}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${transferStatusColors[xfer.status]}`}>{xfer.status}</span>
                  </td>
                  <td className="px-4 py-3 text-signal-body text-xs">{xfer.reviewDate}</td>
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
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
            <div className="flex items-center gap-2 text-signal-blue font-mono text-[10px] uppercase tracking-[0.14em] mb-1">
              <Ban className="w-4 h-4" /> Suppression Entries
            </div>
            <div className="text-2xl font-display font-bold text-signal-blue">{suppression.length}</div>
            <div className="text-xs text-signal-muted mt-1">{activeEntries} active</div>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
            <div className="flex items-center gap-2 text-signal-violet font-mono text-[10px] uppercase tracking-[0.14em] mb-1">
              <Activity className="w-4 h-4" /> Recent Opt-Outs
            </div>
            <div className="text-2xl font-display font-bold text-signal-violet">{recentOptOuts}</div>
            <div className="text-xs text-signal-muted mt-1">last 7 days</div>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
            <div className="flex items-center gap-2 text-signal-good font-mono text-[10px] uppercase tracking-[0.14em] mb-1">
              <CheckCircle className="w-4 h-4" /> Compliance Rate
            </div>
            <div className="text-2xl font-display font-bold text-signal-good">{complianceRate}%</div>
            <div className="text-xs text-signal-muted mt-1">verified suppressions</div>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
            <div className="flex items-center gap-2 text-signal-body font-mono text-[10px] uppercase tracking-[0.14em] mb-1">
              <MessageSquare className="w-4 h-4" /> Channels Tracked
            </div>
            <div className="text-2xl font-display font-bold text-signal-ink">{Object.keys(channelCounts).length}</div>
            <div className="text-xs text-signal-muted mt-1">Email, SMS, Phone, Post</div>
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
          <h3 className="text-sm font-medium text-signal-ink mb-3">Opt-Out by Channel</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { channel: 'Email', icon: <Mail className="w-5 h-5" />, color: 'text-signal-blue' },
              { channel: 'SMS', icon: <MessageSquare className="w-5 h-5" />, color: 'text-signal-good' },
              { channel: 'Phone', icon: <Phone className="w-5 h-5" />, color: 'text-signal-violet' },
              { channel: 'Post', icon: <Send className="w-5 h-5" />, color: 'text-signal-amber' },
            ].map(({ channel, icon, color }) => (
              <div key={channel} className="bg-white/[0.04] rounded-xl p-3 text-center">
                <div className={`${color} flex justify-center mb-2`}>{icon}</div>
                <div className="text-lg font-display font-bold text-signal-ink">{channelCounts[channel] || 0}</div>
                <div className="text-xs text-signal-body">{channel}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-2 items-center">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-signal-body" />
              <input
                type="text"
                placeholder={`${t('common.search')}...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 bg-white/[0.04] border border-white/[0.10] rounded-xl text-sm text-signal-ink placeholder-signal-muted focus:outline-none focus:ring-1 focus:ring-signal-green w-64"
              />
            </div>
            <select
              value={optOutChannelFilter}
              onChange={e => setOptOutChannelFilter(e.target.value)}
              className="bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-sm text-signal-ink focus:outline-none focus:ring-1 focus:ring-signal-green"
            >
              <option value="All">All Channels</option>
              <option value="Email">Email</option>
              <option value="SMS">SMS</option>
              <option value="Phone">Phone</option>
              <option value="Post">Post</option>
            </select>
          </div>
          <button className="flex items-center gap-2 px-3 py-2 bg-white/[0.06] hover:bg-white/[0.10] text-signal-ink rounded-lg text-sm transition-colors">
            <Download className="w-4 h-4" /> {t('common.export')}
          </button>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-4 py-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Name</th>
                  <th className="text-left px-4 py-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Email</th>
                  <th className="text-left px-4 py-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Channels</th>
                  <th className="text-left px-4 py-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Opt-Out Date</th>
                  <th className="text-left px-4 py-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Source</th>
                  <th className="text-left px-4 py-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppression.map(s => (
                  <tr key={s.id} className="border-b border-white/[0.06] hover:bg-white/[0.04]">
                    <td className="px-4 py-3 text-signal-body">{s.name}</td>
                    <td className="px-4 py-3 text-signal-body text-xs">{s.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {s.channels.map(ch => (
                          <span key={ch} className="text-xs px-1.5 py-0.5 rounded bg-white/[0.06] text-signal-body">{ch}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-signal-body text-xs">{s.optOutDate}</td>
                    <td className="px-4 py-3 text-signal-body text-xs">{s.source}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        s.status === 'Active' ? 'bg-signal-good/20 text-signal-good' : 'bg-signal-warn/20 text-signal-warn'
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
            <div className="text-center py-8 text-signal-muted text-sm">No entries match the current filters.</div>
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
        <div className="bg-signal-panel2 border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-signal-ink">Assign Request {assignTarget.id}</h3>
            <button onClick={() => setAssignTarget(null)} className="text-signal-body hover:text-signal-ink"><X className="w-5 h-5" /></button>
          </div>
          <label className="block text-sm text-signal-body mb-1">Assignee</label>
          <input
            type="text"
            autoFocus
            value={assignName}
            onChange={e => setAssignName(e.target.value)}
            placeholder="Team member name"
            className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-sm text-signal-ink placeholder-signal-muted focus:outline-none focus:ring-1 focus:ring-signal-green"
          />
          <div className="flex gap-3 justify-end pt-4">
            <button onClick={() => setAssignTarget(null)} className="px-4 py-2 text-sm text-signal-body hover:text-signal-ink transition-colors">{t('common.cancel')}</button>
            <button onClick={submitAssign} disabled={!assignName.trim()} className="px-4 py-2 bg-signal-green hover:bg-signal-green/90 disabled:opacity-40 text-signal-canvas font-medium text-sm rounded-lg transition-colors">Assign</button>
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
        <div className="bg-signal-panel2 border border-white/[0.08] rounded-2xl p-6 w-full max-w-lg mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-signal-ink">Request {d.id}</h3>
            <button onClick={() => setViewDSAR(null)} className="text-signal-body hover:text-signal-ink"><X className="w-5 h-5" /></button>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-signal-body">{t('common.type')}</span><span className="text-signal-body">{d.type}</span></div>
            <div className="flex justify-between"><span className="text-signal-body">{t('dpia.dataSubjects')}</span><span className="text-signal-body">{d.subjectName}</span></div>
            <div className="flex justify-between"><span className="text-signal-body">Email</span><span className="text-signal-body">{d.subjectEmail}</span></div>
            <div className="flex justify-between"><span className="text-signal-body">{t('common.status')}</span><span className="text-signal-body">{d.status}</span></div>
            <div className="flex justify-between"><span className="text-signal-body">{t('common.assignee')}</span><span className="text-signal-body">{d.assignedTo}</span></div>
            <div className="flex justify-between"><span className="text-signal-body">{t('common.priority')}</span><span className="text-signal-body">{d.priority}</span></div>
            <div className="flex justify-between"><span className="text-signal-body">Submitted</span><span className="text-signal-body">{d.submissionDate}</span></div>
            <div className="flex justify-between"><span className="text-signal-body">Deadline</span><span className="text-signal-body">{d.deadline}</span></div>
            {d.description && <div className="pt-2 text-signal-body">{d.description}</div>}
          </div>
        </div>
      </div>
    );
  };

  const renderAddTransferModal = () => {
    if (!showAddTransfer) return null;
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-signal-panel2 border border-white/[0.08] rounded-2xl p-6 w-full max-w-lg mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-signal-ink">Add Cross-Border Transfer</h3>
            <button onClick={() => setShowAddTransfer(false)} className="text-signal-body hover:text-signal-ink"><X className="w-5 h-5" /></button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-signal-body mb-1">Transfer Name</label>
              <input type="text" value={newTransfer.transferName} onChange={e => setNewTransfer(v => ({ ...v, transferName: e.target.value }))} placeholder="Transfer name" className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-sm text-signal-ink placeholder-signal-muted focus:outline-none focus:ring-1 focus:ring-signal-green" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-signal-body mb-1">Source Country</label>
                <input type="text" value={newTransfer.sourceCountry} onChange={e => setNewTransfer(v => ({ ...v, sourceCountry: e.target.value }))} placeholder="e.g. Germany" className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-sm text-signal-ink placeholder-signal-muted focus:outline-none focus:ring-1 focus:ring-signal-green" />
              </div>
              <div>
                <label className="block text-sm text-signal-body mb-1">Destination Country</label>
                <input type="text" value={newTransfer.destinationCountry} onChange={e => setNewTransfer(v => ({ ...v, destinationCountry: e.target.value }))} placeholder="e.g. United States" className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-sm text-signal-ink placeholder-signal-muted focus:outline-none focus:ring-1 focus:ring-signal-green" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-signal-body mb-1">Legal Mechanism</label>
              <select value={newTransfer.legalMechanism} onChange={e => setNewTransfer(v => ({ ...v, legalMechanism: e.target.value }))} className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-sm text-signal-ink focus:outline-none focus:ring-1 focus:ring-signal-green">
                {(['SCC', 'BCR', 'Adequacy Decision', 'Derogation'] as const).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setShowAddTransfer(false)} className="px-4 py-2 text-sm text-signal-body hover:text-signal-ink transition-colors">{t('common.cancel')}</button>
              <button onClick={submitAddTransfer} disabled={!newTransfer.transferName.trim()} className="px-4 py-2 bg-signal-green hover:bg-signal-green/90 disabled:opacity-40 text-signal-canvas font-medium text-sm rounded-lg transition-colors">{t('common.create')}</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Content Router ──────────────────────────────────────────────────────

  const renderActionError = () => actionError ? (
    <div className="mb-4 p-3 bg-signal-bad/10 border border-signal-bad/30 rounded-lg flex items-center justify-between">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-signal-bad flex-shrink-0" />
        <span className="text-sm text-signal-bad">{actionError}</span>
      </div>
      <button onClick={() => setActionError(null)} className="text-signal-bad/70 hover:text-signal-bad"><X className="w-4 h-4" /></button>
    </div>
  ) : null;

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
    <div className="min-h-screen bg-signal-canvas text-signal-ink">
      <div className="border-b border-white/[0.06] bg-signal-canvas/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-signal-body hover:text-signal-ink transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">{t('common.back')}</span>
              </button>
              <div className="h-5 w-px bg-white/[0.10]" />
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-signal-blue" />
                <h1 className="text-lg font-display font-semibold text-signal-ink">{t('privacy.title')}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {lastSyncLabel && <span className="text-xs text-signal-muted">Last sync: {lastSyncLabel}</span>}
              <button onClick={loadData} disabled={loading} className="p-2 text-signal-body hover:text-signal-ink transition-colors disabled:opacity-50" title="Refresh">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-1 mb-6 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white/[0.08] text-signal-ink font-medium'
                  : 'text-signal-body hover:text-signal-ink hover:bg-white/[0.04]'
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
