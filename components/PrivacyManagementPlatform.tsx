/**
 * Privacy Management Platform
 * Comprehensive privacy compliance: DSAR, Consent, Retention, Cross-Border Transfers, Marketing Opt-Out
 */
import React, { useState, useMemo } from 'react';
import {
  ArrowLeft, Shield, Search, Plus, X, FileText, Clock, ChevronRight,
  Eye, Download, Filter, Calendar, Activity, CheckCircle, AlertTriangle,
  XCircle, BarChart3, Globe, Lock, Users, Trash2, Mail, Bell, MapPin,
  Fingerprint, UserX, RefreshCw, AlertCircle
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────
type TabKey = 'overview' | 'dsar' | 'consent' | 'retention' | 'transfers' | 'marketing';
type DSARType = 'Access' | 'Deletion' | 'Rectification' | 'Portability' | 'Restriction' | 'Objection';
type DSARStatus = 'Received' | 'Identity Verified' | 'In Progress' | 'Completed' | 'Rejected';
type Priority = 'High' | 'Medium' | 'Low';
type RetentionStatus = 'Active' | 'Paused' | 'Expired';
type TransferMechanism = 'SCC' | 'BCR' | 'Adequacy Decision' | 'Derogation';
type RiskLevel = 'High' | 'Medium' | 'Low';

interface DSAR {
  id: string; type: DSARType; subjectName: string; subjectEmail: string;
  submissionDate: string; deadline: string; status: DSARStatus;
  assignedTo: string; priority: Priority; regulation: string;
}

interface ConsentPurpose {
  id: string; name: string; description: string; totalRecords: number;
  grantedPercent: number; withdrawnPercent: number; lastUpdated: string;
  legalBasis: string; active: boolean;
}

interface RetentionSchedule {
  id: string; dataCategory: string; retentionPeriod: string; legalBasis: string;
  autoDelete: boolean; recordsAffected: number; lastPurgeDate: string;
  nextPurgeDate: string; status: RetentionStatus; owner: string;
}

interface CrossBorderTransfer {
  id: string; name: string; sourceCountry: string; destCountry: string;
  mechanism: TransferMechanism; tiaCompleted: boolean; riskLevel: RiskLevel;
  status: string; reviewDate: string; provider: string;
}

interface SuppressionEntry {
  id: string; email: string; channel: string; optOutDate: string;
  reason: string; source: string;
}

// ── Mock Data ──────────────────────────────────────────────────────────
const MOCK_DSARS: DSAR[] = [
  { id: 'DSAR-001', type: 'Access', subjectName: 'John Smith', subjectEmail: 'john.smith@example.com', submissionDate: '2026-02-01', deadline: '2026-03-03', status: 'In Progress', assignedTo: 'Privacy Team', priority: 'High', regulation: 'GDPR Art. 15' },
  { id: 'DSAR-002', type: 'Deletion', subjectName: 'Maria Garcia', subjectEmail: 'maria.g@example.com', submissionDate: '2026-02-05', deadline: '2026-03-07', status: 'Identity Verified', assignedTo: 'Data Ops', priority: 'High', regulation: 'GDPR Art. 17' },
  { id: 'DSAR-003', type: 'Portability', subjectName: 'Alex Chen', subjectEmail: 'alex.chen@example.com', submissionDate: '2026-02-08', deadline: '2026-03-10', status: 'Received', assignedTo: 'Unassigned', priority: 'Medium', regulation: 'GDPR Art. 20' },
  { id: 'DSAR-004', type: 'Rectification', subjectName: 'Sarah Johnson', subjectEmail: 'sarah.j@example.com', submissionDate: '2026-01-20', deadline: '2026-02-19', status: 'Completed', assignedTo: 'Privacy Team', priority: 'Low', regulation: 'GDPR Art. 16' },
  { id: 'DSAR-005', type: 'Access', subjectName: 'Michael Brown', subjectEmail: 'm.brown@example.com', submissionDate: '2026-02-10', deadline: '2026-03-12', status: 'In Progress', assignedTo: 'Legal', priority: 'Medium', regulation: 'CCPA' },
  { id: 'DSAR-006', type: 'Deletion', subjectName: 'Emma Wilson', subjectEmail: 'e.wilson@example.com', submissionDate: '2026-02-12', deadline: '2026-03-14', status: 'Received', assignedTo: 'Unassigned', priority: 'High', regulation: 'GDPR Art. 17' },
  { id: 'DSAR-007', type: 'Objection', subjectName: 'Robert Taylor', subjectEmail: 'r.taylor@example.com', submissionDate: '2026-01-15', deadline: '2026-02-14', status: 'Completed', assignedTo: 'Privacy Team', priority: 'Low', regulation: 'GDPR Art. 21' },
  { id: 'DSAR-008', type: 'Restriction', subjectName: 'Lisa Anderson', subjectEmail: 'l.anderson@example.com', submissionDate: '2026-02-14', deadline: '2026-03-16', status: 'Identity Verified', assignedTo: 'Data Ops', priority: 'Medium', regulation: 'GDPR Art. 18' },
];

const MOCK_CONSENT: ConsentPurpose[] = [
  { id: 'cp-1', name: 'Marketing Communications', description: 'Email and SMS marketing campaigns', totalRecords: 45200, grantedPercent: 62, withdrawnPercent: 8, lastUpdated: '2026-02-15', legalBasis: 'Consent', active: true },
  { id: 'cp-2', name: 'Analytics & Performance', description: 'Website analytics and performance tracking', totalRecords: 78500, grantedPercent: 74, withdrawnPercent: 3, lastUpdated: '2026-02-14', legalBasis: 'Legitimate Interest', active: true },
  { id: 'cp-3', name: 'Third-Party Sharing', description: 'Sharing data with partner organizations', totalRecords: 45200, grantedPercent: 31, withdrawnPercent: 15, lastUpdated: '2026-02-13', legalBasis: 'Consent', active: true },
  { id: 'cp-4', name: 'Personalization', description: 'Personalized content and recommendations', totalRecords: 62300, grantedPercent: 68, withdrawnPercent: 5, lastUpdated: '2026-02-12', legalBasis: 'Consent', active: true },
  { id: 'cp-5', name: 'Essential Cookies', description: 'Required for website functionality', totalRecords: 98700, grantedPercent: 99, withdrawnPercent: 0, lastUpdated: '2026-02-15', legalBasis: 'Legitimate Interest', active: true },
  { id: 'cp-6', name: 'Performance Cookies', description: 'Performance monitoring cookies', totalRecords: 78500, grantedPercent: 56, withdrawnPercent: 7, lastUpdated: '2026-02-10', legalBasis: 'Consent', active: true },
];

const MOCK_RETENTION: RetentionSchedule[] = [
  { id: 'ret-1', dataCategory: 'Customer PII', retentionPeriod: '7 years', legalBasis: 'Tax regulation', autoDelete: true, recordsAffected: 125000, lastPurgeDate: '2026-01-15', nextPurgeDate: '2026-04-15', status: 'Active', owner: 'Data Governance' },
  { id: 'ret-2', dataCategory: 'Marketing Leads', retentionPeriod: '2 years', legalBasis: 'Consent', autoDelete: true, recordsAffected: 45000, lastPurgeDate: '2026-02-01', nextPurgeDate: '2026-05-01', status: 'Active', owner: 'Marketing Ops' },
  { id: 'ret-3', dataCategory: 'Employee Records', retentionPeriod: '10 years', legalBasis: 'Employment law', autoDelete: false, recordsAffected: 8500, lastPurgeDate: '2025-12-01', nextPurgeDate: '2026-06-01', status: 'Active', owner: 'HR' },
  { id: 'ret-4', dataCategory: 'Website Logs', retentionPeriod: '90 days', legalBasis: 'Legitimate Interest', autoDelete: true, recordsAffected: 2500000, lastPurgeDate: '2026-02-10', nextPurgeDate: '2026-02-20', status: 'Active', owner: 'IT Ops' },
  { id: 'ret-5', dataCategory: 'Support Tickets', retentionPeriod: '3 years', legalBasis: 'Contract', autoDelete: false, recordsAffected: 32000, lastPurgeDate: '2025-11-15', nextPurgeDate: '2026-05-15', status: 'Active', owner: 'Customer Support' },
  { id: 'ret-6', dataCategory: 'Archived Accounts', retentionPeriod: '1 year', legalBasis: 'Consent expired', autoDelete: true, recordsAffected: 12000, lastPurgeDate: '2026-01-01', nextPurgeDate: '2026-03-01', status: 'Paused', owner: 'Data Governance' },
];

const MOCK_TRANSFERS: CrossBorderTransfer[] = [
  { id: 'xbt-1', name: 'EU to US Cloud Hosting', sourceCountry: 'Germany', destCountry: 'United States', mechanism: 'SCC', tiaCompleted: true, riskLevel: 'Medium', status: 'Active', reviewDate: '2026-06-15', provider: 'AWS' },
  { id: 'xbt-2', name: 'EU to UK HR Data', sourceCountry: 'France', destCountry: 'United Kingdom', mechanism: 'Adequacy Decision', tiaCompleted: true, riskLevel: 'Low', status: 'Active', reviewDate: '2026-09-01', provider: 'Workday' },
  { id: 'xbt-3', name: 'EU to India Support', sourceCountry: 'Netherlands', destCountry: 'India', mechanism: 'SCC', tiaCompleted: true, riskLevel: 'High', status: 'Under Review', reviewDate: '2026-03-01', provider: 'Tata Consultancy' },
  { id: 'xbt-4', name: 'Intra-Group BCR', sourceCountry: 'Multiple EU', destCountry: 'Multiple', mechanism: 'BCR', tiaCompleted: false, riskLevel: 'Medium', status: 'Pending Approval', reviewDate: '2026-04-15', provider: 'Internal' },
  { id: 'xbt-5', name: 'EU to Japan Analytics', sourceCountry: 'Ireland', destCountry: 'Japan', mechanism: 'Adequacy Decision', tiaCompleted: true, riskLevel: 'Low', status: 'Active', reviewDate: '2026-12-01', provider: 'Mixpanel' },
];

const MOCK_SUPPRESSION: SuppressionEntry[] = [
  { id: 'sup-1', email: 'jane.doe@example.com', channel: 'Email', optOutDate: '2026-02-15', reason: 'Unsubscribe link', source: 'Marketing Campaign' },
  { id: 'sup-2', email: 'mark.smith@example.com', channel: 'SMS', optOutDate: '2026-02-14', reason: 'STOP reply', source: 'Promotional SMS' },
  { id: 'sup-3', email: 'susan.lee@example.com', channel: 'Email', optOutDate: '2026-02-12', reason: 'Preference center', source: 'Account Settings' },
  { id: 'sup-4', email: 'david.park@example.com', channel: 'Phone', optOutDate: '2026-02-10', reason: 'Do Not Call request', source: 'Sales Call' },
  { id: 'sup-5', email: 'anna.white@example.com', channel: 'Email', optOutDate: '2026-02-08', reason: 'Spam complaint', source: 'Newsletter' },
  { id: 'sup-6', email: 'peter.jones@example.com', channel: 'Post', optOutDate: '2026-02-05', reason: 'Written request', source: 'Customer Service' },
  { id: 'sup-7', email: 'rachel.green@example.com', channel: 'Email', optOutDate: '2026-02-01', reason: 'Unsubscribe link', source: 'Product Update' },
  { id: 'sup-8', email: 'tom.harris@example.com', channel: 'SMS', optOutDate: '2026-01-28', reason: 'STOP reply', source: 'Appointment Reminder' },
];

// ── Helpers ────────────────────────────────────────────────────────────
const statusColor = (s: string) => {
  const map: Record<string, string> = {
    'Received': 'bg-blue-500/20 text-blue-400', 'Identity Verified': 'bg-purple-500/20 text-purple-400',
    'In Progress': 'bg-yellow-500/20 text-yellow-400', 'Completed': 'bg-emerald-500/20 text-emerald-400',
    'Rejected': 'bg-red-500/20 text-red-400', 'Active': 'bg-emerald-500/20 text-emerald-400',
    'Paused': 'bg-yellow-500/20 text-yellow-400', 'Expired': 'bg-red-500/20 text-red-400',
    'Under Review': 'bg-yellow-500/20 text-yellow-400', 'Pending Approval': 'bg-blue-500/20 text-blue-400',
  };
  return map[s] || 'bg-slate-500/20 text-slate-400';
};

const priorityColor = (p: Priority) => {
  const map: Record<Priority, string> = { High: 'bg-red-500/20 text-red-400', Medium: 'bg-yellow-500/20 text-yellow-400', Low: 'bg-emerald-500/20 text-emerald-400' };
  return map[p];
};

const riskColor = (r: RiskLevel) => {
  const map: Record<RiskLevel, string> = { High: 'bg-red-500/20 text-red-400', Medium: 'bg-yellow-500/20 text-yellow-400', Low: 'bg-emerald-500/20 text-emerald-400' };
  return map[r];
};

const daysUntil = (dateStr: string): number => {
  const diff = new Date(dateStr).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// ── Component ──────────────────────────────────────────────────────────
export const PrivacyManagementPlatform: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [dsarTypeFilter, setDsarTypeFilter] = useState<string>('all');
  const [dsarStatusFilter, setDsarStatusFilter] = useState<string>('all');
  const [showCreateDSAR, setShowCreateDSAR] = useState(false);

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'dsar', label: 'DSAR Management' },
    { key: 'consent', label: 'Consent' },
    { key: 'retention', label: 'Data Retention' },
    { key: 'transfers', label: 'Cross-Border' },
    { key: 'marketing', label: 'Marketing Opt-Out' },
  ];

  // ── Filtered DSARs ──
  const filteredDSARs = useMemo(() => {
    return MOCK_DSARS.filter(d => {
      const matchSearch = !searchQuery || d.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) || d.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = dsarTypeFilter === 'all' || d.type === dsarTypeFilter;
      const matchStatus = dsarStatusFilter === 'all' || d.status === dsarStatusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }, [searchQuery, dsarTypeFilter, dsarStatusFilter]);

  // ── Stats ──
  const activeDSARs = MOCK_DSARS.filter(d => d.status !== 'Completed' && d.status !== 'Rejected').length;
  const overdueDSARs = MOCK_DSARS.filter(d => d.status !== 'Completed' && d.status !== 'Rejected' && daysUntil(d.deadline) < 0).length;
  const avgConsentRate = Math.round(MOCK_CONSENT.reduce((s, c) => s + c.grantedPercent, 0) / MOCK_CONSENT.length);
  const retentionCompliance = Math.round((MOCK_RETENTION.filter(r => r.status === 'Active' && r.autoDelete).length / MOCK_RETENTION.length) * 100);

  // ── Overview Tab ──
  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active DSARs', value: activeDSARs, icon: FileText, color: 'blue', sub: `${overdueDSARs} overdue` },
          { label: 'Avg Consent Rate', value: `${avgConsentRate}%`, icon: CheckCircle, color: 'emerald', sub: `${MOCK_CONSENT.length} purposes tracked` },
          { label: 'Retention Compliance', value: `${retentionCompliance}%`, icon: Clock, color: 'purple', sub: `${MOCK_RETENTION.length} schedules active` },
          { label: 'Cross-Border Transfers', value: MOCK_TRANSFERS.length, icon: Globe, color: 'amber', sub: `${MOCK_TRANSFERS.filter(t => t.riskLevel === 'High').length} high-risk` },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg bg-${stat.color}-500/20`}>
                <stat.icon size={18} className={`text-${stat.color}-400`} />
              </div>
              <span className="text-sm text-slate-400">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-slate-500 mt-1">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Upcoming Deadlines */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Upcoming DSAR Deadlines</h3>
        <div className="space-y-3">
          {MOCK_DSARS.filter(d => d.status !== 'Completed' && d.status !== 'Rejected').sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()).slice(0, 5).map(d => {
            const days = daysUntil(d.deadline);
            const urgent = days <= 5;
            return (
              <div key={d.id} className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded ${urgent ? 'bg-red-500/20' : 'bg-blue-500/20'}`}>
                    {urgent ? <AlertTriangle size={14} className="text-red-400" /> : <Clock size={14} className="text-blue-400" />}
                  </div>
                  <div>
                    <span className="text-sm text-white font-medium">{d.id}</span>
                    <span className="text-xs text-slate-400 ml-2">{d.type} - {d.subjectName}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColor(d.status)}`}>{d.status}</span>
                  <span className={`text-xs ${urgent ? 'text-red-400 font-semibold' : 'text-slate-400'}`}>
                    {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d remaining`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <h3 className="text-lg font-semibold text-white mb-4">DSAR by Type</h3>
          <div className="space-y-2">
            {(['Access', 'Deletion', 'Rectification', 'Portability', 'Restriction', 'Objection'] as DSARType[]).map(type => {
              const count = MOCK_DSARS.filter(d => d.type === type).length;
              return (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">{type}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(count / MOCK_DSARS.length) * 100}%` }} />
                    </div>
                    <span className="text-xs text-slate-400 w-6 text-right">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Marketing Opt-Out Summary</h3>
          <div className="space-y-2">
            {['Email', 'SMS', 'Phone', 'Post'].map(channel => {
              const count = MOCK_SUPPRESSION.filter(s => s.channel === channel).length;
              return (
                <div key={channel} className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">{channel}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(count / MOCK_SUPPRESSION.length) * 100}%` }} />
                    </div>
                    <span className="text-xs text-slate-400 w-6 text-right">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  // ── DSAR Tab ──
  const renderDSAR = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search DSARs..." className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm" />
        </div>
        <select value={dsarTypeFilter} onChange={e => setDsarTypeFilter(e.target.value)} className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm">
          <option value="all">All Types</option>
          {(['Access', 'Deletion', 'Rectification', 'Portability', 'Restriction', 'Objection'] as DSARType[]).map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={dsarStatusFilter} onChange={e => setDsarStatusFilter(e.target.value)} className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm">
          <option value="all">All Status</option>
          {(['Received', 'Identity Verified', 'In Progress', 'Completed', 'Rejected'] as DSARStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={() => setShowCreateDSAR(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2">
          <Plus size={16} /> New DSAR
        </button>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-700 text-slate-400">
              <th className="text-left p-3 font-medium">ID</th>
              <th className="text-left p-3 font-medium">Type</th>
              <th className="text-left p-3 font-medium">Data Subject</th>
              <th className="text-left p-3 font-medium">Submitted</th>
              <th className="text-left p-3 font-medium">Deadline</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Priority</th>
              <th className="text-left p-3 font-medium">Assigned To</th>
              <th className="text-left p-3 font-medium">Actions</th>
            </tr></thead>
            <tbody>
              {filteredDSARs.map(d => {
                const days = daysUntil(d.deadline);
                return (
                  <tr key={d.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="p-3 text-blue-400 font-mono text-xs">{d.id}</td>
                    <td className="p-3 text-white">{d.type}</td>
                    <td className="p-3">
                      <div className="text-white text-sm">{d.subjectName}</div>
                      <div className="text-slate-500 text-xs">{d.subjectEmail}</div>
                    </td>
                    <td className="p-3 text-slate-300">{d.submissionDate}</td>
                    <td className="p-3">
                      <span className={days < 0 ? 'text-red-400 font-semibold' : days <= 5 ? 'text-yellow-400' : 'text-slate-300'}>
                        {d.deadline}
                      </span>
                    </td>
                    <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full ${statusColor(d.status)}`}>{d.status}</span></td>
                    <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full ${priorityColor(d.priority)}`}>{d.priority}</span></td>
                    <td className="p-3 text-slate-300">{d.assignedTo}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 hover:bg-slate-600 rounded" title="View"><Eye size={14} className="text-slate-400" /></button>
                        <button className="p-1.5 hover:bg-slate-600 rounded" title="Verify Identity"><Fingerprint size={14} className="text-purple-400" /></button>
                        <button className="p-1.5 hover:bg-slate-600 rounded" title="Complete"><CheckCircle size={14} className="text-emerald-400" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ── Consent Tab ──
  const renderConsent = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <div className="text-sm text-slate-400 mb-1">Average Consent Rate</div>
          <div className="text-2xl font-bold text-emerald-400">{avgConsentRate}%</div>
        </div>
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <div className="text-sm text-slate-400 mb-1">Active Purposes</div>
          <div className="text-2xl font-bold text-white">{MOCK_CONSENT.filter(c => c.active).length}</div>
        </div>
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <div className="text-sm text-slate-400 mb-1">Avg Withdrawal Rate</div>
          <div className="text-2xl font-bold text-amber-400">{Math.round(MOCK_CONSENT.reduce((s, c) => s + c.withdrawnPercent, 0) / MOCK_CONSENT.length)}%</div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-700 text-slate-400">
              <th className="text-left p-3 font-medium">Purpose</th>
              <th className="text-left p-3 font-medium">Legal Basis</th>
              <th className="text-left p-3 font-medium">Records</th>
              <th className="text-left p-3 font-medium">Granted</th>
              <th className="text-left p-3 font-medium">Withdrawn</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Last Updated</th>
            </tr></thead>
            <tbody>
              {MOCK_CONSENT.map(c => (
                <tr key={c.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="p-3">
                    <div className="text-white font-medium">{c.name}</div>
                    <div className="text-xs text-slate-500">{c.description}</div>
                  </td>
                  <td className="p-3 text-slate-300">{c.legalBasis}</td>
                  <td className="p-3 text-slate-300">{c.totalRecords.toLocaleString()}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${c.grantedPercent}%` }} />
                      </div>
                      <span className="text-emerald-400 text-xs">{c.grantedPercent}%</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: `${c.withdrawnPercent}%` }} />
                      </div>
                      <span className="text-red-400 text-xs">{c.withdrawnPercent}%</span>
                    </div>
                  </td>
                  <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full ${c.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>{c.active ? 'Active' : 'Inactive'}</span></td>
                  <td className="p-3 text-slate-300">{c.lastUpdated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ── Retention Tab ──
  const renderRetention = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Data Retention Schedules</h3>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2">
          <Plus size={16} /> Add Schedule
        </button>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-700 text-slate-400">
              <th className="text-left p-3 font-medium">Data Category</th>
              <th className="text-left p-3 font-medium">Retention Period</th>
              <th className="text-left p-3 font-medium">Legal Basis</th>
              <th className="text-left p-3 font-medium">Auto-Delete</th>
              <th className="text-left p-3 font-medium">Records</th>
              <th className="text-left p-3 font-medium">Last Purge</th>
              <th className="text-left p-3 font-medium">Next Purge</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Actions</th>
            </tr></thead>
            <tbody>
              {MOCK_RETENTION.map(r => (
                <tr key={r.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="p-3 text-white font-medium">{r.dataCategory}</td>
                  <td className="p-3 text-slate-300">{r.retentionPeriod}</td>
                  <td className="p-3 text-slate-300">{r.legalBasis}</td>
                  <td className="p-3">
                    {r.autoDelete
                      ? <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">Enabled</span>
                      : <span className="text-xs px-2 py-1 rounded-full bg-slate-500/20 text-slate-400">Disabled</span>
                    }
                  </td>
                  <td className="p-3 text-slate-300">{r.recordsAffected.toLocaleString()}</td>
                  <td className="p-3 text-slate-300">{r.lastPurgeDate}</td>
                  <td className="p-3">
                    <span className={daysUntil(r.nextPurgeDate) <= 7 ? 'text-yellow-400' : 'text-slate-300'}>
                      {r.nextPurgeDate}
                    </span>
                  </td>
                  <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full ${statusColor(r.status)}`}>{r.status}</span></td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 hover:bg-slate-600 rounded" title="Run Purge"><RefreshCw size={14} className="text-blue-400" /></button>
                      <button className="p-1.5 hover:bg-slate-600 rounded" title="Edit"><Eye size={14} className="text-slate-400" /></button>
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

  // ── Cross-Border Transfers Tab ──
  const renderTransfers = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <div className="text-sm text-slate-400 mb-1">Active Transfers</div>
          <div className="text-2xl font-bold text-white">{MOCK_TRANSFERS.filter(t => t.status === 'Active').length}</div>
        </div>
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <div className="text-sm text-slate-400 mb-1">TIA Completed</div>
          <div className="text-2xl font-bold text-emerald-400">{MOCK_TRANSFERS.filter(t => t.tiaCompleted).length}/{MOCK_TRANSFERS.length}</div>
        </div>
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <div className="text-sm text-slate-400 mb-1">High-Risk Transfers</div>
          <div className="text-2xl font-bold text-red-400">{MOCK_TRANSFERS.filter(t => t.riskLevel === 'High').length}</div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-700 text-slate-400">
              <th className="text-left p-3 font-medium">Transfer</th>
              <th className="text-left p-3 font-medium">Source</th>
              <th className="text-left p-3 font-medium">Destination</th>
              <th className="text-left p-3 font-medium">Mechanism</th>
              <th className="text-left p-3 font-medium">TIA</th>
              <th className="text-left p-3 font-medium">Risk</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Review Date</th>
            </tr></thead>
            <tbody>
              {MOCK_TRANSFERS.map(t => (
                <tr key={t.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="p-3">
                    <div className="text-white font-medium">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.provider}</div>
                  </td>
                  <td className="p-3 text-slate-300">{t.sourceCountry}</td>
                  <td className="p-3 text-slate-300">{t.destCountry}</td>
                  <td className="p-3"><span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">{t.mechanism}</span></td>
                  <td className="p-3">
                    {t.tiaCompleted
                      ? <CheckCircle size={16} className="text-emerald-400" />
                      : <AlertCircle size={16} className="text-yellow-400" />
                    }
                  </td>
                  <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full ${riskColor(t.riskLevel)}`}>{t.riskLevel}</span></td>
                  <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full ${statusColor(t.status)}`}>{t.status}</span></td>
                  <td className="p-3 text-slate-300">{t.reviewDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ── Marketing Opt-Out Tab ──
  const renderMarketing = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
        {['Email', 'SMS', 'Phone', 'Post'].map(channel => {
          const count = MOCK_SUPPRESSION.filter(s => s.channel === channel).length;
          return (
            <div key={channel} className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <div className="text-sm text-slate-400 mb-1">{channel} Opt-Outs</div>
              <div className="text-2xl font-bold text-white">{count}</div>
              <div className="text-xs text-slate-500 mt-1">{Math.round((count / MOCK_SUPPRESSION.length) * 100)}% of total</div>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Suppression List</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-700 text-slate-400">
              <th className="text-left p-3 font-medium">Email / Contact</th>
              <th className="text-left p-3 font-medium">Channel</th>
              <th className="text-left p-3 font-medium">Opt-Out Date</th>
              <th className="text-left p-3 font-medium">Reason</th>
              <th className="text-left p-3 font-medium">Source</th>
            </tr></thead>
            <tbody>
              {MOCK_SUPPRESSION.map(s => (
                <tr key={s.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="p-3 text-white">{s.email}</td>
                  <td className="p-3"><span className="text-xs px-2 py-1 rounded-full bg-slate-600/50 text-slate-300">{s.channel}</span></td>
                  <td className="p-3 text-slate-300">{s.optOutDate}</td>
                  <td className="p-3 text-slate-300">{s.reason}</td>
                  <td className="p-3 text-slate-400">{s.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ── Render Active Tab ──
  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'dsar': return renderDSAR();
      case 'consent': return renderConsent();
      case 'retention': return renderRetention();
      case 'transfers': return renderTransfers();
      case 'marketing': return renderMarketing();
      default: return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-slate-400" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Privacy Management Platform</h1>
          <p className="text-sm text-slate-400">DSAR, Consent, Retention, Cross-Border Transfers & Marketing Compliance</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center gap-1">
            <Shield size={12} /> GDPR Compliant
          </span>
          <button className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2">
            <Download size={14} /> Export Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-800 rounded-lg p-1 overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.key ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {renderContent()}

      {/* Create DSAR Modal */}
      {showCreateDSAR && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateDSAR(false)}>
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">New DSAR Request</h3>
              <button onClick={() => setShowCreateDSAR(false)} className="p-1 hover:bg-slate-700 rounded"><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div><label className="block text-sm text-slate-400 mb-1">Request Type</label><select className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm">{(['Access', 'Deletion', 'Rectification', 'Portability', 'Restriction', 'Objection'] as DSARType[]).map(t => <option key={t}>{t}</option>)}</select></div>
              <div><label className="block text-sm text-slate-400 mb-1">Data Subject Name</label><input placeholder="Full name" className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm" /></div>
              <div><label className="block text-sm text-slate-400 mb-1">Data Subject Email</label><input type="email" placeholder="email@example.com" className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm" /></div>
              <div><label className="block text-sm text-slate-400 mb-1">Regulation</label><select className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm">{['GDPR', 'CCPA', 'LGPD', 'PIPEDA', 'PDPA'].map(r => <option key={r}>{r}</option>)}</select></div>
              <div><label className="block text-sm text-slate-400 mb-1">Priority</label><select className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm">{(['High', 'Medium', 'Low'] as Priority[]).map(p => <option key={p}>{p}</option>)}</select></div>
              <div><label className="block text-sm text-slate-400 mb-1">Notes</label><textarea placeholder="Additional context..." className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm h-20 resize-none" /></div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-slate-700">
              <button onClick={() => setShowCreateDSAR(false)} className="px-4 py-2 text-sm text-slate-400">Cancel</button>
              <button onClick={() => setShowCreateDSAR(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Submit Request</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrivacyManagementPlatform;
