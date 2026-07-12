/**
 * Certification Tracker Component
 *
 * Certificate lifecycle management with:
 * - Cert registry with status tracking
 * - Expiry alerts and countdown
 * - Surveillance audit scheduling
 * - Document management
 * - Status dashboard
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { csrfFetch } from '../services/api';
import {
  Award,
  Plus,
  X,
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  FileText,
  Shield,
  Eye,
  Upload,
  Download,
  Bell,
  BarChart3,
  Trash2,
  ChevronRight,
  RefreshCw,
  Loader2,
} from 'lucide-react';

// ── Types ───────────────────────────────────────────────────────────────────

type CertStatus = 'Active' | 'Expiring' | 'Expired' | 'Suspended' | 'InProgress';
type TabId = 'registry' | 'schedule' | 'documents';

interface SurveillanceAudit {
  id: string;
  type: 'Surveillance' | 'Recertification' | 'Internal';
  date: string;
  auditor: string;
  status: 'Scheduled' | 'InProgress' | 'Completed' | 'Cancelled';
  findings: number;
}

interface CertDocument {
  id: string;
  name: string;
  type: 'Certificate' | 'Audit Report' | 'Corrective Action' | 'Scope Statement' | 'Policy';
  uploadedDate: string;
  uploadedBy: string;
  size: string;
}

interface Certification {
  id: string;
  name: string;
  standard: string;
  scope: string;
  status: CertStatus;
  certBody: string;
  issueDate: string;
  expiryDate: string;
  lastAuditDate: string;
  nextAuditDate: string;
  owner: string;
  audits: SurveillanceAudit[];
  documents: CertDocument[];
  controlsInScope: number;
  nonconformities: number;
}

// ── Constants & Mock Data ───────────────────────────────────────────────────

const statusConfig: Record<CertStatus, { color: string; icon: React.ReactNode }> = {
  Active: { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  Expiring: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: <Clock className="w-3.5 h-3.5" /> },
  Expired: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  Suspended: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  InProgress: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: <RefreshCw className="w-3.5 h-3.5" /> },
};

// ── API Helper ──────────────────────────────────────────────────────────────

const API_BASE = '/api/certifications';

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await csrfFetch(url, { credentials: 'include', ...options });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(body.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

function mapBackendStatus(status: string): CertStatus {
  switch (status) {
    case 'CERT_ACTIVE': return 'Active';
    case 'EXPIRING_SOON': return 'Expiring';
    case 'CERT_EXPIRED': return 'Expired';
    case 'SUSPENDED': return 'Suspended';
    case 'IN_PROGRESS': return 'InProgress';
    default: return 'Active';
  }
}

function mapAuditType(type: string): SurveillanceAudit['type'] {
  if (type.includes('SURVEILLANCE')) return 'Surveillance';
  if (type === 'RECERTIFICATION') return 'Recertification';
  if (type === 'INITIAL') return 'Internal';
  return 'Surveillance';
}

function mapAuditStatus(audit: any): SurveillanceAudit['status'] {
  if (audit.completedDate) return 'Completed';
  if (audit.result === 'CANCELLED') return 'Cancelled';
  return 'Scheduled';
}

// ── Component ───────────────────────────────────────────────────────────────

const CertificationTracker: React.FC = () => {
  const { t } = useI18n();
  const [certs, setCerts] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('registry');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CertStatus | 'all'>('all');
  const [selectedCert, setSelectedCert] = useState<Certification | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formStandard, setFormStandard] = useState('');
  const [formScope, setFormScope] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formOwner, setFormOwner] = useState('');
  const [formExpiry, setFormExpiry] = useState('');

  // Fetch certifications from backend
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    apiFetch<{ status: string; data: { certifications: any[] } }>(`${API_BASE}?limit=100`)
      .then((res) => {
        if (cancelled) return;
        const mapped: Certification[] = res.data.certifications.map((c: any) => {
          const audits: SurveillanceAudit[] = (c.surveillanceAudits || []).map((a: any) => ({
            id: a.id,
            type: mapAuditType(a.type),
            date: a.scheduledDate ? new Date(a.scheduledDate).toISOString().split('T')[0] : '',
            auditor: a.auditorName || '',
            status: mapAuditStatus(a),
            findings: a.findings || 0,
          }));

          const documents: CertDocument[] = Array.isArray(c.documents)
            ? c.documents.map((d: any, idx: number) => ({
                id: d.id || `doc-${idx}`,
                name: d.name || 'Document',
                type: d.type || 'Certificate',
                uploadedDate: d.uploadedDate || '',
                uploadedBy: d.uploadedBy || '',
                size: d.size || '',
              }))
            : [];

          return {
            id: c.id,
            name: c.name || '',
            standard: c.frameworkId || '',
            scope: c.scope || '',
            status: mapBackendStatus(c.status),
            certBody: c.certBody || '',
            issueDate: c.issueDate ? new Date(c.issueDate).toISOString().split('T')[0] : '',
            expiryDate: c.expiryDate ? new Date(c.expiryDate).toISOString().split('T')[0] : '',
            lastAuditDate: '',
            nextAuditDate: audits.find(a => a.status === 'Scheduled')?.date || '',
            owner: '',
            audits,
            documents,
            controlsInScope: 0,
            nonconformities: 0,
          };
        });
        setCerts(mapped);
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('Failed to fetch certifications:', err);
        setError(err.message || 'Failed to load certifications');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => certs.filter(c => {
    const matchSearch = searchQuery === '' || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.standard.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  }), [certs, searchQuery, statusFilter]);

  const stats = useMemo(() => ({
    total: certs.length, active: certs.filter(c => c.status === 'Active').length,
    expiring: certs.filter(c => c.status === 'Expiring').length, expired: certs.filter(c => c.status === 'Expired').length,
    upcomingAudits: certs.flatMap(c => c.audits).filter(a => a.status === 'Scheduled').length,
  }), [certs]);

  const allAudits = useMemo(() => {
    return certs.flatMap(c => c.audits.map(a => ({ ...a, certName: c.name, certId: c.id })))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [certs]);

  const allDocs = useMemo(() => {
    return certs.flatMap(c => c.documents.map(d => ({ ...d, certName: c.name, certId: c.id })))
      .sort((a, b) => new Date(b.uploadedDate).getTime() - new Date(a.uploadedDate).getTime());
  }, [certs]);

  const handleCreate = useCallback(async () => {
    try {
      const issueDate = new Date().toISOString().split('T')[0];
      const payload = {
        name: formName,
        certBody: formBody,
        issueDate,
        expiryDate: formExpiry || new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
        scope: formScope || null,
      };

      const res = await apiFetch<{ status: string; data: any }>(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const c = res.data;
      const newCert: Certification = {
        id: c.id,
        name: c.name || formName,
        standard: formStandard,
        scope: c.scope || formScope,
        status: 'InProgress',
        certBody: c.certBody || formBody,
        issueDate: c.issueDate ? new Date(c.issueDate).toISOString().split('T')[0] : '',
        expiryDate: c.expiryDate ? new Date(c.expiryDate).toISOString().split('T')[0] : formExpiry,
        lastAuditDate: '',
        nextAuditDate: '',
        owner: formOwner,
        audits: [],
        documents: [],
        controlsInScope: 0,
        nonconformities: 0,
      };
      setCerts(prev => [newCert, ...prev]);
      setShowCreateForm(false);
      setFormName(''); setFormStandard(''); setFormScope(''); setFormBody(''); setFormOwner(''); setFormExpiry('');
    } catch (err: any) {
      console.warn('Failed to create certification:', err);
      setError(err.message || 'Failed to create certification');
    }
  }, [formName, formStandard, formScope, formBody, formOwner, formExpiry]);

  const daysUntil = (date: string) => date ? Math.ceil((new Date(date).getTime() - Date.now()) / 86400000) : null;

  return (
    <div className="min-h-screen bg-slate-900 dark:bg-slate-950 text-white p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-purple-500/20 rounded-lg"><Award className="w-6 h-6 text-purple-400" /></div>
          <div><h1 className="text-2xl font-bold">{t('certifications.title')}</h1><p className="text-slate-400 text-sm">Manage certification lifecycle and compliance</p></div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4"><span className="text-slate-400 text-sm">{t('common.total')}</span><div className="text-2xl font-bold mt-1">{stats.total}</div></div>
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4"><span className="text-green-400 text-sm">{t('certifications.valid')}</span><div className="text-2xl font-bold mt-1 text-green-400">{stats.active}</div></div>
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4"><span className="text-yellow-400 text-sm">{t('certifications.expiring')}</span><div className="text-2xl font-bold mt-1 text-yellow-400">{stats.expiring}</div></div>
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4"><span className="text-red-400 text-sm">{t('certifications.expired')}</span><div className="text-2xl font-bold mt-1 text-red-400">{stats.expired}</div></div>
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4"><span className="text-blue-400 text-sm">Upcoming Audits</span><div className="text-2xl font-bold mt-1 text-blue-400">{stats.upcomingAudits}</div></div>
      </div>

      <div className="flex items-center gap-1 mb-6 bg-slate-800 rounded-xl p-1 w-fit border border-slate-700">
        {([{ id: 'registry' as TabId, label: 'Registry', icon: <Award className="w-4 h-4" /> }, { id: 'schedule' as TabId, label: 'Audit Schedule', icon: <Calendar className="w-4 h-4" /> }, { id: 'documents' as TabId, label: 'Documents', icon: <FileText className="w-4 h-4" /> }]).map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSelectedCert(null); }} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>{tab.icon}{tab.label}</button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          <span className="ml-3 text-slate-400">Loading certifications...</span>
        </div>
      )}

      {error && !loading && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-3 underline text-red-300 hover:text-red-200">Dismiss</button>
        </div>
      )}

      {!loading && activeTab === 'registry' && !selectedCert && (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
            <div className="relative flex-1 w-full"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" /><input type="text" placeholder={t('common.search')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as CertStatus | 'all')} className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="all">All Status</option>{Object.keys(statusConfig).map(s => <option key={s} value={s}>{s}</option>)}</select>
            <button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"><Plus className="w-4 h-4" /> {t('common.add')} {t('certifications.certificationName')}</button>
          </div>
          <div className="space-y-3">
            {filtered.map(cert => {
              const days = daysUntil(cert.expiryDate);
              return (
                <div key={cert.id} onClick={() => setSelectedCert(cert)} className="bg-slate-800 rounded-xl border border-slate-700 p-4 hover:border-slate-600 cursor-pointer transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${statusConfig[cert.status].color}`}>{statusConfig[cert.status].icon}{cert.status}</span>
                        {days !== null && days > 0 && days <= 90 && <span className="text-xs text-yellow-400 flex items-center gap-1"><Bell className="w-3 h-3" />{days}d until expiry</span>}
                        {days !== null && days <= 0 && cert.status !== 'InProgress' && <span className="text-xs text-red-400 font-medium">EXPIRED</span>}
                      </div>
                      <h3 className="text-sm font-medium">{cert.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{cert.standard} | {cert.certBody}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <span>Scope: {cert.controlsInScope} controls</span>
                        <span>Owner: {cert.owner}</span>
                        {cert.expiryDate && <span>Expires: {cert.expiryDate}</span>}
                        {cert.nonconformities > 0 && <span className="text-orange-400">{cert.nonconformities} nonconformities</span>}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {!loading && activeTab === 'registry' && selectedCert && (
        <div className="space-y-6">
          <button onClick={() => setSelectedCert(null)} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm"><ChevronRight className="w-4 h-4 rotate-180" /> Back</button>
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${statusConfig[selectedCert.status].color}`}>{statusConfig[selectedCert.status].icon}{selectedCert.status}</span>
            </div>
            <h2 className="text-xl font-bold mb-1">{selectedCert.name}</h2>
            <p className="text-slate-400 text-sm">{selectedCert.scope}</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 mb-6">
              <div className="p-3 bg-slate-700/30 rounded-lg"><span className="text-xs text-slate-500">{t('certifications.issuingBody')}</span><p className="text-sm font-medium mt-0.5">{selectedCert.certBody}</p></div>
              <div className="p-3 bg-slate-700/30 rounded-lg"><span className="text-xs text-slate-500">{t('certifications.issueDate')}</span><p className="text-sm font-medium mt-0.5">{selectedCert.issueDate || 'Pending'}</p></div>
              <div className="p-3 bg-slate-700/30 rounded-lg"><span className="text-xs text-slate-500">{t('certifications.expiryDate')}</span><p className="text-sm font-medium mt-0.5">{selectedCert.expiryDate || 'N/A'}</p></div>
              <div className="p-3 bg-slate-700/30 rounded-lg"><span className="text-xs text-slate-500">Next Audit</span><p className="text-sm font-medium mt-0.5">{selectedCert.nextAuditDate || 'TBD'}</p></div>
            </div>
            <h3 className="text-sm font-semibold mb-3">Audit History</h3>
            <div className="space-y-2 mb-6">
              {selectedCert.audits.map(audit => (
                <div key={audit.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${audit.type === 'Recertification' ? 'bg-purple-500/20 text-purple-400' : audit.type === 'Surveillance' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-500/20 text-slate-400'}`}>{audit.type}</span>
                    <span className="text-sm">{audit.date}</span>
                    <span className="text-xs text-slate-500">{audit.auditor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {audit.findings > 0 && <span className="text-xs text-orange-400">{audit.findings} findings</span>}
                    <span className={`px-2 py-0.5 rounded-full text-xs ${audit.status === 'Completed' ? 'bg-green-500/20 text-green-400' : audit.status === 'Scheduled' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{audit.status}</span>
                  </div>
                </div>
              ))}
            </div>
            <h3 className="text-sm font-semibold mb-3">Documents ({selectedCert.documents.length})</h3>
            <div className="space-y-2">
              {selectedCert.documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-3"><FileText className="w-4 h-4 text-slate-400" /><div><p className="text-sm">{doc.name}</p><p className="text-xs text-slate-500">{doc.type} | {doc.size} | {doc.uploadedDate}</p></div></div>
                  <button className="p-1.5 text-slate-400 hover:text-blue-400 transition-colors"><Download className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!loading && activeTab === 'schedule' && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h3 className="text-sm font-semibold mb-4">{t('calendar.upcoming')} Audit Schedule</h3>
          <div className="space-y-3">
            {allAudits.filter(a => a.status === 'Scheduled').map(audit => (
              <div key={audit.id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-500/20 rounded-lg"><Calendar className="w-5 h-5 text-blue-400" /></div>
                  <div>
                    <p className="text-sm font-medium">{audit.certName}</p>
                    <p className="text-xs text-slate-400">{audit.type} Audit by {audit.auditor}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{audit.date}</p>
                  <p className="text-xs text-slate-500">{daysUntil(audit.date)}d away</p>
                </div>
              </div>
            ))}
            {allAudits.filter(a => a.status === 'Scheduled').length === 0 && <p className="text-sm text-slate-500 text-center py-8">No upcoming audits scheduled</p>}
          </div>
        </div>
      )}

      {!loading && activeTab === 'documents' && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h3 className="text-sm font-semibold mb-4">All Documents</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-700"><th className="text-left py-2 px-3 text-slate-400 font-medium">Document</th><th className="text-left py-2 px-3 text-slate-400 font-medium">Certification</th><th className="text-left py-2 px-3 text-slate-400 font-medium">Type</th><th className="text-left py-2 px-3 text-slate-400 font-medium">Uploaded</th><th className="text-left py-2 px-3 text-slate-400 font-medium">Size</th></tr></thead>
              <tbody>
                {allDocs.map(doc => (
                  <tr key={doc.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="py-2 px-3 flex items-center gap-2"><FileText className="w-4 h-4 text-slate-400" />{doc.name}</td>
                    <td className="py-2 px-3 text-slate-400">{doc.certName}</td>
                    <td className="py-2 px-3"><span className="px-1.5 py-0.5 bg-slate-700 rounded text-xs">{doc.type}</span></td>
                    <td className="py-2 px-3 text-slate-400">{doc.uploadedDate}</td>
                    <td className="py-2 px-3 text-slate-400">{doc.size}</td>
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
            <div className="flex items-center justify-between p-4 border-b border-slate-700"><h2 className="text-lg font-semibold">{t('common.add')} {t('certifications.certificationName')}</h2><button onClick={() => setShowCreateForm(false)} className="p-1 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button></div>
            <div className="p-4 space-y-4">
              <div><label className="block text-sm text-slate-400 mb-1">Name</label><input type="text" value={formName} onChange={e => setFormName(e.target.value)} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. SOC 2 Type II" /></div>
              <div><label className="block text-sm text-slate-400 mb-1">Standard</label><input type="text" value={formStandard} onChange={e => setFormStandard(e.target.value)} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm text-slate-400 mb-1">Scope</label><textarea value={formScope} onChange={e => setFormScope(e.target.value)} rows={2} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-slate-400 mb-1">Cert Body</label><input type="text" value={formBody} onChange={e => setFormBody(e.target.value)} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm text-slate-400 mb-1">Owner</label><input type="text" value={formOwner} onChange={e => setFormOwner(e.target.value)} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              </div>
              <div><label className="block text-sm text-slate-400 mb-1">Target Expiry</label><input type="date" value={formExpiry} onChange={e => setFormExpiry(e.target.value)} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-700">
              <button onClick={() => setShowCreateForm(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors">{t('common.cancel')}</button>
              <button onClick={handleCreate} disabled={!formName.trim()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"><Plus className="w-4 h-4" /> {t('common.add')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificationTracker;
