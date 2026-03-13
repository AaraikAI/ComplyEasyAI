/**
 * Exception Management Component
 *
 * Compliance exception tracking with:
 * - Request form with justification
 * - Approval workflow (Pending -> Under Review -> Approved/Denied -> Expired)
 * - Compensating controls documentation
 * - Auto-expiry tracking
 * - Exception metrics dashboard
 * - Auditor view
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useI18n } from '../contexts/I18nContext';
import {
  AlertTriangle,
  Plus,
  X,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Shield,
  FileText,
  BarChart3,
  Calendar,
  User,
  ChevronRight,
  Trash2,
  AlertOctagon,
} from 'lucide-react';

// ── Types ───────────────────────────────────────────────────────────────────

type ExceptionStatus = 'Pending' | 'UnderReview' | 'Approved' | 'Denied' | 'Expired';
type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';
type TabId = 'exceptions' | 'metrics' | 'auditor';

interface CompensatingControl {
  id: string;
  description: string;
  owner: string;
  status: 'Implemented' | 'Planned' | 'NotStarted';
}

interface ExceptionRecord {
  id: string;
  title: string;
  description: string;
  controlId: string;
  controlName: string;
  framework: string;
  status: ExceptionStatus;
  riskLevel: RiskLevel;
  requestedBy: string;
  requestedDate: string;
  reviewedBy: string | null;
  reviewedDate: string | null;
  expiryDate: string;
  justification: string;
  compensatingControls: CompensatingControl[];
  approvalComments: string;
}

interface ExceptionForm {
  title: string;
  description: string;
  controlId: string;
  controlName: string;
  framework: string;
  riskLevel: RiskLevel;
  justification: string;
  expiryDate: string;
  compensatingControl: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

const statusConfig: Record<ExceptionStatus, { color: string; icon: React.ReactNode }> = {
  Pending: { color: 'bg-slate-500/20 text-slate-400', icon: <Clock className="w-3.5 h-3.5" /> },
  UnderReview: { color: 'bg-blue-500/20 text-blue-400', icon: <Eye className="w-3.5 h-3.5" /> },
  Approved: { color: 'bg-green-500/20 text-green-400', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  Denied: { color: 'bg-red-500/20 text-red-400', icon: <XCircle className="w-3.5 h-3.5" /> },
  Expired: { color: 'bg-orange-500/20 text-orange-400', icon: <AlertOctagon className="w-3.5 h-3.5" /> },
};

const riskColors: Record<RiskLevel, string> = {
  Low: 'bg-green-500/20 text-green-400 border-green-500/30',
  Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  High: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Critical: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const defaultForm: ExceptionForm = {
  title: '', description: '', controlId: '', controlName: '', framework: 'SOC 2',
  riskLevel: 'Medium', justification: '', expiryDate: '', compensatingControl: '',
};

// ── Mock Data ───────────────────────────────────────────────────────────────

const initialExceptions: ExceptionRecord[] = [
  {
    id: 'EXC-001', title: 'Legacy System MFA Exception', description: 'Legacy CRM system does not support modern MFA protocols. Requesting exception until migration completes.',
    controlId: 'CC-6.1', controlName: 'Multi-Factor Authentication', framework: 'SOC 2', status: 'Approved',
    riskLevel: 'High', requestedBy: 'Alex Kumar', requestedDate: '2025-10-01', reviewedBy: 'Sarah Chen', reviewedDate: '2025-10-05',
    expiryDate: '2026-06-30', justification: 'Legacy CRM does not support SAML/OIDC. Migration to new platform scheduled for Q2 2026.',
    compensatingControls: [
      { id: 'cc1', description: 'IP allowlisting restricted to office and VPN ranges', owner: 'DevOps', status: 'Implemented' },
      { id: 'cc2', description: 'Enhanced logging and monitoring on legacy system', owner: 'Security', status: 'Implemented' },
      { id: 'cc3', description: 'Quarterly access reviews for all legacy system users', owner: 'IT Admin', status: 'Implemented' },
    ],
    approvalComments: 'Approved with compensating controls. Must migrate before expiry.',
  },
  {
    id: 'EXC-002', title: 'Encryption at Rest Exception for Dev Environment', description: 'Development database does not use encryption at rest due to performance constraints.',
    controlId: 'CC-6.7', controlName: 'Data Encryption at Rest', framework: 'SOC 2', status: 'Approved',
    riskLevel: 'Medium', requestedBy: 'DevOps Team', requestedDate: '2025-11-15', reviewedBy: 'James Wilson', reviewedDate: '2025-11-18',
    expiryDate: '2026-05-15', justification: 'Dev environment uses synthetic data only. Encryption causes 40% performance overhead affecting developer productivity.',
    compensatingControls: [
      { id: 'cc4', description: 'Dev environment contains only synthetic/anonymized data', owner: 'Data Team', status: 'Implemented' },
      { id: 'cc5', description: 'Network segmentation isolating dev from production', owner: 'DevOps', status: 'Implemented' },
    ],
    approvalComments: 'Approved given synthetic data. Data masking must be validated quarterly.',
  },
  {
    id: 'EXC-003', title: 'Vendor SOC 2 Report Delay', description: 'Critical vendor has not yet completed their SOC 2 Type II audit for current period.',
    controlId: 'CC-9.2', controlName: 'Vendor Risk Management', framework: 'SOC 2', status: 'UnderReview',
    riskLevel: 'High', requestedBy: 'Procurement', requestedDate: '2026-01-10', reviewedBy: null, reviewedDate: null,
    expiryDate: '2026-04-30', justification: 'Vendor is undergoing audit; report expected by March 2026. Vendor has provided bridge letter.',
    compensatingControls: [
      { id: 'cc6', description: 'Bridge letter obtained from vendor', owner: 'Procurement', status: 'Implemented' },
      { id: 'cc7', description: 'Enhanced monitoring of vendor data access', owner: 'Security', status: 'Planned' },
    ],
    approvalComments: '',
  },
  {
    id: 'EXC-004', title: 'Password Length Exception for IoT Devices', description: 'IoT sensors cannot support 16-character minimum password requirement.',
    controlId: 'CC-6.1', controlName: 'Authentication Controls', framework: 'ISO 27001', status: 'Pending',
    riskLevel: 'Medium', requestedBy: 'IoT Team', requestedDate: '2026-02-20', reviewedBy: null, reviewedDate: null,
    expiryDate: '2026-08-20', justification: 'Hardware limitation on IoT devices restricts password length to 12 characters. Device firmware update planned.',
    compensatingControls: [
      { id: 'cc8', description: 'Certificate-based authentication supplement', owner: 'IoT Team', status: 'Planned' },
    ],
    approvalComments: '',
  },
  {
    id: 'EXC-005', title: 'Patch Management Delay for Production DB', description: 'Critical security patch deferred due to compatibility concerns.',
    controlId: 'CC-7.1', controlName: 'System Patching', framework: 'SOC 2', status: 'Expired',
    riskLevel: 'Critical', requestedBy: 'DBA Team', requestedDate: '2025-08-01', reviewedBy: 'Sarah Chen', reviewedDate: '2025-08-03',
    expiryDate: '2025-11-30', justification: 'Patch causes compatibility issues with ORM layer. Requires application code changes first.',
    compensatingControls: [
      { id: 'cc9', description: 'WAF rules to mitigate known vulnerability', owner: 'Security', status: 'Implemented' },
      { id: 'cc10', description: 'Network segmentation limiting DB exposure', owner: 'DevOps', status: 'Implemented' },
    ],
    approvalComments: 'Approved with 90-day window. Patch must be applied before expiry.',
  },
];

// ── Component ───────────────────────────────────────────────────────────────

const ExceptionManagement: React.FC = () => {
  const { t } = useI18n();
  const [exceptions, setExceptions] = useState<ExceptionRecord[]>(initialExceptions);
  const [activeTab, setActiveTab] = useState<TabId>('exceptions');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ExceptionStatus | 'all'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedExc, setSelectedExc] = useState<ExceptionRecord | null>(null);
  const [form, setForm] = useState<ExceptionForm>(defaultForm);

  const filtered = useMemo(() => {
    return exceptions.filter(e => {
      const matchSearch = searchQuery === '' || e.title.toLowerCase().includes(searchQuery.toLowerCase()) || e.controlName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'all' || e.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [exceptions, searchQuery, statusFilter]);

  const metrics = useMemo(() => ({
    total: exceptions.length,
    active: exceptions.filter(e => e.status === 'Approved').length,
    pending: exceptions.filter(e => e.status === 'Pending' || e.status === 'UnderReview').length,
    expired: exceptions.filter(e => e.status === 'Expired').length,
    denied: exceptions.filter(e => e.status === 'Denied').length,
    avgDaysToReview: (() => {
      const reviewed = exceptions.filter(e => e.reviewedDate);
      if (reviewed.length === 0) return 0;
      return Math.round(reviewed.reduce((sum, e) => {
        return sum + (new Date(e.reviewedDate!).getTime() - new Date(e.requestedDate).getTime()) / (1000 * 60 * 60 * 24);
      }, 0) / reviewed.length);
    })(),
    byRisk: (['Low', 'Medium', 'High', 'Critical'] as RiskLevel[]).map(r => ({ risk: r, count: exceptions.filter(e => e.riskLevel === r && e.status === 'Approved').length })),
    byFramework: [...new Set(exceptions.map(e => e.framework))].map(f => ({ framework: f, count: exceptions.filter(e => e.framework === f).length })),
  }), [exceptions]);

  const handleCreate = useCallback(() => {
    const newExc: ExceptionRecord = {
      id: `EXC-${String(exceptions.length + 1).padStart(3, '0')}`, title: form.title, description: form.description,
      controlId: form.controlId, controlName: form.controlName, framework: form.framework, status: 'Pending',
      riskLevel: form.riskLevel, requestedBy: 'Current User', requestedDate: new Date().toISOString().split('T')[0],
      reviewedBy: null, reviewedDate: null, expiryDate: form.expiryDate, justification: form.justification,
      compensatingControls: form.compensatingControl ? [{ id: `cc-${Date.now()}`, description: form.compensatingControl, owner: 'Current User', status: 'Planned' as const }] : [],
      approvalComments: '',
    };
    setExceptions(prev => [newExc, ...prev]);
    setShowCreateForm(false);
    setForm(defaultForm);
  }, [form, exceptions.length]);

  const updateStatus = useCallback((id: string, newStatus: ExceptionStatus) => {
    setExceptions(prev => prev.map(e => e.id === id ? {
      ...e, status: newStatus,
      reviewedBy: newStatus === 'Approved' || newStatus === 'Denied' ? 'Current Reviewer' : e.reviewedBy,
      reviewedDate: newStatus === 'Approved' || newStatus === 'Denied' ? new Date().toISOString().split('T')[0] : e.reviewedDate,
    } : e));
  }, []);

  const daysUntilExpiry = (date: string) => {
    const diff = Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="min-h-screen bg-slate-900 dark:bg-slate-950 text-white p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-yellow-500/20 rounded-lg"><AlertTriangle className="w-6 h-6 text-yellow-400" /></div>
          <div>
            <h1 className="text-2xl font-bold">{t('exceptions.title')}</h1>
            <p className="text-slate-400 text-sm">Track and manage compliance exceptions and waivers</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800 dark:bg-slate-900 rounded-xl border border-slate-700 p-4"><span className="text-slate-400 text-sm">{t('common.total')} {t('exceptions.title')}</span><div className="text-2xl font-bold mt-1">{metrics.total}</div></div>
        <div className="bg-slate-800 dark:bg-slate-900 rounded-xl border border-slate-700 p-4"><span className="text-green-400 text-sm">{t('common.active')}</span><div className="text-2xl font-bold mt-1 text-green-400">{metrics.active}</div></div>
        <div className="bg-slate-800 dark:bg-slate-900 rounded-xl border border-slate-700 p-4"><span className="text-yellow-400 text-sm">{t('common.pending')}</span><div className="text-2xl font-bold mt-1 text-yellow-400">{metrics.pending}</div></div>
        <div className="bg-slate-800 dark:bg-slate-900 rounded-xl border border-slate-700 p-4"><span className="text-red-400 text-sm">{t('certifications.expired')}</span><div className="text-2xl font-bold mt-1 text-red-400">{metrics.expired}</div></div>
      </div>

      <div className="flex items-center gap-1 mb-6 bg-slate-800 rounded-xl p-1 w-fit border border-slate-700">
        {[{ id: 'exceptions' as TabId, label: 'Exceptions', icon: <FileText className="w-4 h-4" /> }, { id: 'metrics' as TabId, label: 'Metrics', icon: <BarChart3 className="w-4 h-4" /> }, { id: 'auditor' as TabId, label: 'Auditor View', icon: <Eye className="w-4 h-4" /> }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>{tab.icon}{tab.label}</button>
        ))}
      </div>

      {activeTab === 'exceptions' && !selectedExc && (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
            <div className="relative flex-1 w-full"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" /><input type="text" placeholder={t('common.search')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as ExceptionStatus | 'all')} className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="all">All Statuses</option>{Object.keys(statusConfig).map(s => <option key={s} value={s}>{s === 'UnderReview' ? 'Under Review' : s}</option>)}</select>
            <button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"><Plus className="w-4 h-4" /> {t('exceptions.createException')}</button>
          </div>
          <div className="space-y-3">
            {filtered.map(exc => {
              const expDays = daysUntilExpiry(exc.expiryDate);
              return (
                <div key={exc.id} onClick={() => setSelectedExc(exc)} className="bg-slate-800 rounded-xl border border-slate-700 p-4 hover:border-slate-600 cursor-pointer transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-slate-500">{exc.id}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${statusConfig[exc.status].color}`}>{statusConfig[exc.status].icon}{exc.status === 'UnderReview' ? 'Under Review' : exc.status}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${riskColors[exc.riskLevel]}`}>{exc.riskLevel}</span>
                        {exc.status === 'Approved' && expDays <= 30 && expDays > 0 && <span className="text-xs text-orange-400 flex items-center gap-1"><Clock className="w-3 h-3" />{expDays}d until expiry</span>}
                      </div>
                      <h3 className="text-sm font-medium">{exc.title}</h3>
                      <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                        <span>{exc.framework} | {exc.controlName}</span>
                        <span>Requested: {exc.requestedDate}</span>
                        <span>Expires: {exc.expiryDate}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && <div className="text-center py-12 text-slate-500"><AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" /><p>{t('common.noResults')}</p></div>}
          </div>
        </>
      )}

      {activeTab === 'exceptions' && selectedExc && (
        <div className="space-y-6">
          <button onClick={() => setSelectedExc(null)} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm"><ChevronRight className="w-4 h-4 rotate-180" /> Back</button>
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono text-slate-500">{selectedExc.id}</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${statusConfig[selectedExc.status].color}`}>{statusConfig[selectedExc.status].icon}{selectedExc.status}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs border ${riskColors[selectedExc.riskLevel]}`}>{selectedExc.riskLevel}</span>
            </div>
            <h2 className="text-xl font-bold mb-1">{selectedExc.title}</h2>
            <p className="text-slate-400 text-sm mb-4">{selectedExc.description}</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div><span className="text-xs text-slate-500">Control</span><p className="text-sm">{selectedExc.controlId} - {selectedExc.controlName}</p></div>
              <div><span className="text-xs text-slate-500">Framework</span><p className="text-sm">{selectedExc.framework}</p></div>
              <div><span className="text-xs text-slate-500">Requested By</span><p className="text-sm">{selectedExc.requestedBy} on {selectedExc.requestedDate}</p></div>
              <div><span className="text-xs text-slate-500">{t('exceptions.expirationDate')}</span><p className="text-sm">{selectedExc.expiryDate} ({daysUntilExpiry(selectedExc.expiryDate)}d)</p></div>
            </div>
            <div className="mb-6"><h3 className="text-sm font-semibold mb-2">{t('exceptions.justification')}</h3><p className="text-sm text-slate-300 p-3 bg-slate-700/30 rounded-lg">{selectedExc.justification}</p></div>
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-2">{t('exceptions.compensatingControls')} ({selectedExc.compensatingControls.length})</h3>
              <div className="space-y-2">
                {selectedExc.compensatingControls.map(cc => (
                  <div key={cc.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <div><p className="text-sm">{cc.description}</p><p className="text-xs text-slate-500">Owner: {cc.owner}</p></div>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${cc.status === 'Implemented' ? 'bg-green-500/20 text-green-400' : cc.status === 'Planned' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-500/20 text-slate-400'}`}>{cc.status}</span>
                  </div>
                ))}
              </div>
            </div>
            {(selectedExc.status === 'Pending' || selectedExc.status === 'UnderReview') && (
              <div className="flex items-center gap-3 pt-4 border-t border-slate-700">
                <button onClick={() => { updateStatus(selectedExc.id, 'Approved'); setSelectedExc(null); }} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors"><CheckCircle className="w-4 h-4" /> {t('common.approved')}</button>
                <button onClick={() => { updateStatus(selectedExc.id, 'Denied'); setSelectedExc(null); }} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"><XCircle className="w-4 h-4" /> {t('common.rejected')}</button>
                {selectedExc.status === 'Pending' && <button onClick={() => updateStatus(selectedExc.id, 'UnderReview')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"><Eye className="w-4 h-4" /> Start Review</button>}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'metrics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h3 className="text-sm font-semibold mb-4">Active Exceptions by Risk Level</h3>
              <div className="space-y-3">
                {metrics.byRisk.map(item => (
                  <div key={item.risk} className="flex items-center gap-3">
                    <span className={`text-xs font-medium w-16 ${riskColors[item.risk].split(' ')[1]}`}>{item.risk}</span>
                    <div className="flex-1 bg-slate-700 rounded-full h-4 overflow-hidden">
                      <div className={`h-full rounded-full ${item.risk === 'Critical' ? 'bg-red-500' : item.risk === 'High' ? 'bg-orange-500' : item.risk === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${metrics.active > 0 ? (item.count / metrics.active) * 100 : 0}%` }} />
                    </div>
                    <span className="text-sm font-mono w-8 text-right">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h3 className="text-sm font-semibold mb-4">Exceptions by Framework</h3>
              <div className="space-y-3">
                {metrics.byFramework.map(item => (
                  <div key={item.framework} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <span className="text-sm">{item.framework}</span>
                    <span className="text-sm font-bold">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h3 className="text-sm font-semibold mb-4">Key Metrics</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-700/30 rounded-xl text-center"><div className="text-2xl font-bold">{metrics.avgDaysToReview}</div><div className="text-xs text-slate-400 mt-1">Avg Days to Review</div></div>
              <div className="p-4 bg-slate-700/30 rounded-xl text-center"><div className="text-2xl font-bold text-green-400">{metrics.active}</div><div className="text-xs text-slate-400 mt-1">Active Exceptions</div></div>
              <div className="p-4 bg-slate-700/30 rounded-xl text-center"><div className="text-2xl font-bold text-red-400">{metrics.expired}</div><div className="text-xs text-slate-400 mt-1">Expired (Action Needed)</div></div>
              <div className="p-4 bg-slate-700/30 rounded-xl text-center"><div className="text-2xl font-bold">{exceptions.reduce((s, e) => s + e.compensatingControls.length, 0)}</div><div className="text-xs text-slate-400 mt-1">Compensating Controls</div></div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'auditor' && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h3 className="text-sm font-semibold mb-4">Auditor View - All Exceptions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-700">
                <th className="text-left py-2 px-3 text-slate-400 font-medium">ID</th>
                <th className="text-left py-2 px-3 text-slate-400 font-medium">Exception</th>
                <th className="text-left py-2 px-3 text-slate-400 font-medium">Control</th>
                <th className="text-left py-2 px-3 text-slate-400 font-medium">Risk</th>
                <th className="text-left py-2 px-3 text-slate-400 font-medium">Status</th>
                <th className="text-left py-2 px-3 text-slate-400 font-medium">Expiry</th>
                <th className="text-left py-2 px-3 text-slate-400 font-medium">Controls</th>
              </tr></thead>
              <tbody>
                {exceptions.map(exc => (
                  <tr key={exc.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="py-2 px-3 font-mono text-xs">{exc.id}</td>
                    <td className="py-2 px-3">{exc.title}</td>
                    <td className="py-2 px-3 text-xs text-slate-400">{exc.controlId}</td>
                    <td className="py-2 px-3"><span className={`px-1.5 py-0.5 rounded text-xs border ${riskColors[exc.riskLevel]}`}>{exc.riskLevel}</span></td>
                    <td className="py-2 px-3"><span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs ${statusConfig[exc.status].color}`}>{statusConfig[exc.status].icon}{exc.status}</span></td>
                    <td className="py-2 px-3 text-xs">{exc.expiryDate}</td>
                    <td className="py-2 px-3 text-xs">{exc.compensatingControls.filter(c => c.status === 'Implemented').length}/{exc.compensatingControls.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-700"><h2 className="text-lg font-semibold">{t('exceptions.createException')}</h2><button onClick={() => setShowCreateForm(false)} className="p-1 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button></div>
            <div className="p-4 space-y-4">
              <div><label className="block text-sm text-slate-400 mb-1">Title</label><input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm text-slate-400 mb-1">Description</label><textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-slate-400 mb-1">Control ID</label><input type="text" value={form.controlId} onChange={e => setForm(p => ({ ...p, controlId: e.target.value }))} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. CC-6.1" /></div>
                <div><label className="block text-sm text-slate-400 mb-1">Control Name</label><input type="text" value={form.controlName} onChange={e => setForm(p => ({ ...p, controlName: e.target.value }))} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-slate-400 mb-1">Framework</label><select value={form.framework} onChange={e => setForm(p => ({ ...p, framework: e.target.value }))} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"><option>SOC 2</option><option>ISO 27001</option><option>GDPR</option><option>HIPAA</option><option>PCI DSS</option></select></div>
                <div><label className="block text-sm text-slate-400 mb-1">Risk Level</label><select value={form.riskLevel} onChange={e => setForm(p => ({ ...p, riskLevel: e.target.value as RiskLevel }))} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></div>
              </div>
              <div><label className="block text-sm text-slate-400 mb-1">Justification</label><textarea value={form.justification} onChange={e => setForm(p => ({ ...p, justification: e.target.value }))} rows={3} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Why is this exception needed?" /></div>
              <div><label className="block text-sm text-slate-400 mb-1">Expiry Date</label><input type="date" value={form.expiryDate} onChange={e => setForm(p => ({ ...p, expiryDate: e.target.value }))} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm text-slate-400 mb-1">Compensating Control</label><input type="text" value={form.compensatingControl} onChange={e => setForm(p => ({ ...p, compensatingControl: e.target.value }))} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Describe the compensating control" /></div>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-700">
              <button onClick={() => { setShowCreateForm(false); setForm(defaultForm); }} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors">{t('common.cancel')}</button>
              <button onClick={handleCreate} disabled={!form.title.trim()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"><Plus className="w-4 h-4" /> {t('common.submit')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExceptionManagement;
