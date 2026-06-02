import React, { useState, useMemo, useEffect } from 'react';
import { useI18n } from '../contexts/I18nContext';
import {
  ArrowLeft,
  Shield,
  Search,
  Plus,
  Filter,
  Download,
  Upload,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Clock,
  FileText,
  Users,
  Building2,
  Briefcase,
  Eye,
  Edit,
  Trash2,
  ChevronRight,
  Star,
  Phone,
  Mail,
  Globe,
  Calendar,
  BarChart3,
  TrendingUp,
  XCircle,
  RefreshCw,
  FolderOpen,
  BookOpen,
  X,
  Check,
  Send,
  MessageSquare,
  History,
  Award,
  MapPin,
} from 'lucide-react';

type TabId = 'overview' | 'engagements' | 'findings' | 'evidence' | 'directory' | 'workpapers';

interface AuditorHubProps {
  onBack: () => void;
}

interface Engagement {
  id: string;
  name: string;
  framework: string;
  auditorFirm: string;
  leadAuditor: string;
  status: 'planning' | 'fieldwork' | 'reporting' | 'completed';
  phase: string;
  startDate: string;
  endDate: string;
  progress: number;
  findingsCount: number;
  evidenceRequests: number;
}

interface Finding {
  id: string;
  title: string;
  engagement: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'informational';
  status: 'open' | 'in-progress' | 'remediated' | 'closed' | 'accepted';
  category: string;
  description: string;
  assignee: string;
  dueDate: string;
  createdDate: string;
}

interface EvidenceRequest {
  id: string;
  title: string;
  engagement: string;
  status: 'pending' | 'submitted' | 'under-review' | 'accepted' | 'rejected';
  requestedBy: string;
  assignee: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  description: string;
  attachments: number;
  isOverdue: boolean;
}

interface AuditorFirm {
  id: string;
  name: string;
  logo: string;
  specializations: string[];
  rating: number;
  reviewCount: number;
  location: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  certifications: string[];
  yearsExperience: number;
  clientCount: number;
  priceRange: string;
}

interface Workpaper {
  id: string;
  name: string;
  engagement: string;
  type: string;
  status: 'draft' | 'in-review' | 'approved' | 'final';
  author: string;
  reviewer: string;
  lastModified: string;
  version: string;
  size: string;
}

const severityColor: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  informational: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const statusColor: Record<string, string> = {
  open: 'bg-red-500/20 text-red-400',
  'in-progress': 'bg-yellow-500/20 text-yellow-400',
  remediated: 'bg-blue-500/20 text-blue-400',
  closed: 'bg-green-500/20 text-green-400',
  accepted: 'bg-purple-500/20 text-purple-400',
  pending: 'bg-yellow-500/20 text-yellow-400',
  submitted: 'bg-blue-500/20 text-blue-400',
  'under-review': 'bg-indigo-500/20 text-indigo-400',
  rejected: 'bg-red-500/20 text-red-400',
};

const engagementStatusColor: Record<string, string> = {
  planning: 'bg-blue-500/20 text-blue-400',
  fieldwork: 'bg-yellow-500/20 text-yellow-400',
  reporting: 'bg-purple-500/20 text-purple-400',
  completed: 'bg-green-500/20 text-green-400',
};

const workpaperStatusColor: Record<string, string> = {
  draft: 'bg-slate-500/20 text-slate-400',
  'in-review': 'bg-yellow-500/20 text-yellow-400',
  approved: 'bg-blue-500/20 text-blue-400',
  final: 'bg-green-500/20 text-green-400',
};

export const AuditorHub: React.FC<AuditorHubProps> = ({ onBack }) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateEngagement, setShowCreateEngagement] = useState(false);
  const [findingSeverityFilter, setFindingSeverityFilter] = useState<string>('all');
  const [findingStatusFilter, setFindingStatusFilter] = useState<string>('all');
  const [evidenceStatusFilter, setEvidenceStatusFilter] = useState<string>('all');
  const [selectedFirms, setSelectedFirms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [workpaperStatusFilter, setWorkpaperStatusFilter] = useState<string>('all');
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [evidenceRequests, setEvidenceRequests] = useState<EvidenceRequest[]>([]);
  const [workpapers, setWorkpapers] = useState<Workpaper[]>([]);
  const [auditorFirms, setAuditorFirms] = useState<AuditorFirm[]>([]);

  // Normalize an API list response that may be a bare array or { data: [...] }.
  const asArray = <T,>(payload: any): T[] =>
    Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];

  // Fetch live data from API. A successful-but-empty response yields an empty list
  // (real empty state), not seeded demo data; a transport failure surfaces an error.
  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [engRes, findRes, wpRes, evRes, dirRes] = await Promise.all([
        fetch('/api/auditor/engagements', { credentials: 'include' }),
        fetch('/api/auditor/findings', { credentials: 'include' }),
        fetch('/api/auditor/workpapers', { credentials: 'include' }),
        fetch('/api/auditor/requests', { credentials: 'include' }),
        fetch('/api/auditor/profiles', { credentials: 'include' }),
      ]);
      if (engRes.ok) setEngagements(asArray<Engagement>(await engRes.json()));
      if (findRes.ok) setFindings(asArray<Finding>(await findRes.json()));
      if (wpRes.ok) setWorkpapers(asArray<Workpaper>(await wpRes.json()));
      if (evRes.ok) setEvidenceRequests(asArray<EvidenceRequest>(await evRes.json()));
      if (dirRes.ok) setAuditorFirms(asArray<AuditorFirm>(await dirRes.json()));
      if (!engRes.ok && !findRes.ok && !wpRes.ok && !evRes.ok && !dirRes.ok) {
        setError('Unable to load auditor data. Please try again.');
      }
    } catch {
      setError('Unable to reach the server. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Write actions (wired to /api/auditor/*) ───────────────────────────────
  const [engForm, setEngForm] = useState({ name: '', framework: '', auditorFirm: '', startDate: '', endDate: '', leadAuditor: '' });
  const [engSubmitting, setEngSubmitting] = useState(false);
  const [showCreateWorkpaper, setShowCreateWorkpaper] = useState(false);
  const [wpForm, setWpForm] = useState({ name: '', engagementId: '', type: 'Testing' });
  const [wpSubmitting, setWpSubmitting] = useState(false);
  const [busyWorkpaperId, setBusyWorkpaperId] = useState<string | null>(null);

  const postJson = async (url: string, body: unknown): Promise<boolean> => {
    setActionError(null);
    try {
      const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => null);
        throw new Error(msg?.error || msg?.message || `Request failed (${res.status})`);
      }
      return true;
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed');
      return false;
    }
  };

  const handleCreateEngagement = async () => {
    if (!engForm.name.trim()) { setActionError('Engagement name is required'); return; }
    setEngSubmitting(true);
    const ok = await postJson('/api/auditor/engagements', {
      name: engForm.name.trim(),
      framework: engForm.framework || undefined,
      auditorFirm: engForm.auditorFirm || undefined,
      leadAuditor: engForm.leadAuditor || undefined,
      startDate: engForm.startDate || undefined,
      endDate: engForm.endDate || undefined,
    });
    setEngSubmitting(false);
    if (ok) {
      setShowCreateEngagement(false);
      setEngForm({ name: '', framework: '', auditorFirm: '', startDate: '', endDate: '', leadAuditor: '' });
      fetchData();
    }
  };

  const handleCreateWorkpaper = async () => {
    if (!wpForm.name.trim() || !wpForm.engagementId) { setActionError('Workpaper name and engagement are required'); return; }
    setWpSubmitting(true);
    const ok = await postJson('/api/auditor/workpapers', {
      name: wpForm.name.trim(),
      engagementId: wpForm.engagementId,
      type: wpForm.type,
      status: 'draft',
    });
    setWpSubmitting(false);
    if (ok) {
      setShowCreateWorkpaper(false);
      setWpForm({ name: '', engagementId: '', type: 'Testing' });
      fetchData();
    }
  };

  const handleWorkpaperStatus = async (id: string, status: 'in-review' | 'approved') => {
    setBusyWorkpaperId(id);
    setActionError(null);
    try {
      const res = await fetch(`/api/auditor/workpapers/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => null);
        throw new Error(msg?.error || msg?.message || `Update failed (${res.status})`);
      }
      await fetchData();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update workpaper');
    } finally {
      setBusyWorkpaperId(null);
    }
  };

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: t('common.overview'), icon: <BarChart3 size={16} /> },
    { id: 'engagements', label: 'Engagements', icon: <Briefcase size={16} /> },
    { id: 'findings', label: 'Findings', icon: <AlertTriangle size={16} /> },
    { id: 'evidence', label: 'Evidence Requests', icon: <FileText size={16} /> },
    { id: 'directory', label: 'Auditor Directory', icon: <Building2 size={16} /> },
    { id: 'workpapers', label: 'Workpapers', icon: <BookOpen size={16} /> },
  ];

  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      const matchesSeverity = findingSeverityFilter === 'all' || f.severity === findingSeverityFilter;
      const matchesStatus = findingStatusFilter === 'all' || f.status === findingStatusFilter;
      const matchesSearch =
        searchQuery === '' ||
        f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSeverity && matchesStatus && matchesSearch;
    });
  }, [findings, findingSeverityFilter, findingStatusFilter, searchQuery]);

  const filteredEvidence = useMemo(() => {
    return evidenceRequests.filter((e) => {
      const matchesStatus = evidenceStatusFilter === 'all' || e.status === evidenceStatusFilter;
      const matchesSearch =
        searchQuery === '' ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [evidenceRequests, evidenceStatusFilter, searchQuery]);

  const filteredWorkpapers = useMemo(() => {
    return workpapers.filter((w) => {
      const matchesStatus = workpaperStatusFilter === 'all' || w.status === workpaperStatusFilter;
      const matchesSearch =
        searchQuery === '' ||
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [workpapers, workpaperStatusFilter, searchQuery]);

  const overviewStats = useMemo(() => {
    const activeEngagements = engagements.filter((e) => e.status !== 'completed').length;
    const openFindings = findings.filter((f) => f.status === 'open' || f.status === 'in-progress').length;
    const pendingRequests = evidenceRequests.filter((e) => e.status === 'pending').length;
    const overdueRequests = evidenceRequests.filter((e) => e.isOverdue).length;
    const criticalFindings = findings.filter((f) => f.severity === 'critical').length;
    const remediatedFindings = findings.filter((f) => f.status === 'remediated' || f.status === 'closed').length;
    return { activeEngagements, openFindings, pendingRequests, overdueRequests, criticalFindings, remediatedFindings };
  }, [engagements, findings, evidenceRequests]);

  const toggleFirmCompare = (firmId: string) => {
    setSelectedFirms((prev) =>
      prev.includes(firmId) ? prev.filter((id) => id !== firmId) : prev.length < 3 ? [...prev, firmId] : prev
    );
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm">Active Engagements</span>
            <Briefcase size={18} className="text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white">{overviewStats.activeEngagements}</div>
          <div className="text-xs text-slate-500 mt-1">{engagements.length} total engagements</div>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm">{t('audit.findingsCount')}</span>
            <AlertTriangle size={18} className="text-orange-400" />
          </div>
          <div className="text-3xl font-bold text-white">{overviewStats.openFindings}</div>
          <div className="text-xs text-red-400 mt-1">{overviewStats.criticalFindings} critical</div>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm">{t('common.pending')}</span>
            <Clock size={18} className="text-yellow-400" />
          </div>
          <div className="text-3xl font-bold text-white">{overviewStats.pendingRequests}</div>
          <div className="text-xs text-red-400 mt-1">{overviewStats.overdueRequests} overdue</div>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm">Remediated Findings</span>
            <CheckCircle size={18} className="text-green-400" />
          </div>
          <div className="text-3xl font-bold text-white">{overviewStats.remediatedFindings}</div>
          <div className="text-xs text-green-400 mt-1">
            {findings.length > 0 ? Math.round((overviewStats.remediatedFindings / findings.length) * 100) : 0}% closure rate
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Briefcase size={16} className="text-blue-400" />
            Active Engagements
          </h3>
          <div className="space-y-3">
            {engagements.filter((e) => e.status !== 'completed').map((eng) => (
              <div key={eng.id} className="bg-slate-700/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-sm font-medium">{eng.name}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${engagementStatusColor[eng.status]}`}>
                    {eng.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>{eng.auditorFirm} - {eng.leadAuditor}</span>
                  <span>{eng.phase}</span>
                </div>
                <div className="w-full bg-slate-600 rounded-full h-1.5">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${eng.progress}%` }}
                  />
                </div>
                <div className="text-xs text-slate-500 mt-1 text-right">{eng.progress}% complete</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg border border-slate-700 p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-orange-400" />
            Recent Findings
          </h3>
          <div className="space-y-3">
            {findings.slice(0, 5).map((finding) => (
              <div key={finding.id} className="flex items-center justify-between bg-slate-700/50 rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs border ${severityColor[finding.severity]}`}>
                      {finding.severity}
                    </span>
                    <span className="text-white text-sm truncate">{finding.title}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">{finding.engagement} - {finding.assignee}</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs ml-2 whitespace-nowrap ${statusColor[finding.status]}`}>
                  {finding.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 p-5">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-green-400" />
          Recent Activity
        </h3>
        <div className="space-y-3">
          {[
            { action: 'Evidence submitted', detail: 'Encryption configuration evidence for SOC 2 Type II', time: '2 hours ago', icon: <Upload size={14} className="text-blue-400" /> },
            { action: 'Finding remediated', detail: 'Incomplete change management documentation (FND-003)', time: '5 hours ago', icon: <CheckCircle size={14} className="text-green-400" /> },
            { action: 'New evidence request', detail: 'Network architecture diagram for PCI DSS v4.0', time: '1 day ago', icon: <FileText size={14} className="text-yellow-400" /> },
            { action: 'Engagement phase updated', detail: 'SOX ITGC moved to Report Drafting phase', time: '2 days ago', icon: <RefreshCw size={14} className="text-purple-400" /> },
            { action: 'Workpaper approved', detail: 'Change Management Walkthrough (SOC 2 Type II)', time: '3 days ago', icon: <Check size={14} className="text-green-400" /> },
            { action: 'Finding created', detail: 'Vendor risk assessments overdue (FND-004)', time: '4 days ago', icon: <AlertCircle size={14} className="text-orange-400" /> },
          ].map((activity, idx) => (
            <div key={idx} className="flex items-start gap-3 bg-slate-700/30 rounded-lg p-3">
              <div className="mt-0.5">{activity.icon}</div>
              <div className="flex-1">
                <span className="text-white text-sm font-medium">{activity.action}</span>
                <div className="text-xs text-slate-400">{activity.detail}</div>
              </div>
              <span className="text-xs text-slate-500 whitespace-nowrap">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderEngagements = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">Audit Engagements ({engagements.length})</h3>
        <button
          onClick={() => setShowCreateEngagement(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
        >
          <Plus size={16} />
          New Engagement
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {engagements.map((eng) => (
          <div key={eng.id} className="bg-slate-800 rounded-lg border border-slate-700 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-semibold">{eng.name}</span>
                </div>
                <span className="text-xs text-slate-400">{eng.id}</span>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${engagementStatusColor[eng.status]}`}>
                {eng.status.charAt(0).toUpperCase() + eng.status.slice(1)}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Building2 size={14} className="text-slate-400" />
                <span className="text-slate-300">{eng.auditorFirm}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users size={14} className="text-slate-400" />
                <span className="text-slate-300">Lead: {eng.leadAuditor}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar size={14} className="text-slate-400" />
                <span className="text-slate-300">{eng.startDate} to {eng.endDate}</span>
              </div>
            </div>

            <div className="mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400">Phase: {eng.phase}</span>
                <span className="text-slate-300">{eng.progress}%</span>
              </div>
              <div className="w-full bg-slate-600 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${eng.progress}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-700 pt-3">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <AlertTriangle size={12} /> {eng.findingsCount} findings
                </span>
                <span className="flex items-center gap-1">
                  <FileText size={12} /> {eng.evidenceRequests} requests
                </span>
              </div>
              <button className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                View Details <ChevronRight size={14} />
              </button>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-700">
              <div className="text-xs text-slate-400 mb-2">Phase Tracking</div>
              <div className="flex items-center gap-1">
                {['planning', 'fieldwork', 'reporting', 'completed'].map((phase, idx) => {
                  const phaseOrder = ['planning', 'fieldwork', 'reporting', 'completed'];
                  const currentIdx = phaseOrder.indexOf(eng.status);
                  const isComplete = idx < currentIdx;
                  const isCurrent = idx === currentIdx;
                  return (
                    <React.Fragment key={phase}>
                      <div
                        className={`flex-1 h-1.5 rounded-full ${
                          isComplete
                            ? 'bg-green-500'
                            : isCurrent
                            ? 'bg-blue-500'
                            : 'bg-slate-600'
                        }`}
                      />
                    </React.Fragment>
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>Planning</span>
                <span>Fieldwork</span>
                <span>Reporting</span>
                <span>Complete</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showCreateEngagement && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <h3 className="text-white font-semibold">Create New Engagement</h3>
              <button onClick={() => setShowCreateEngagement(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {actionError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-400 flex items-center gap-2">
                  <AlertCircle size={14} className="flex-shrink-0" /> {actionError}
                </div>
              )}
              <div>
                <label className="block text-sm text-slate-300 mb-1">Engagement Name</label>
                <input
                  type="text"
                  value={engForm.name}
                  onChange={(e) => setEngForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., SOC 2 Type II Annual Audit"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Framework</label>
                <select
                  value={engForm.framework}
                  onChange={(e) => setEngForm((f) => ({ ...f, framework: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select framework</option>
                  <option>SOC 2</option>
                  <option>ISO 27001</option>
                  <option>SOX</option>
                  <option>PCI DSS</option>
                  <option>HIPAA</option>
                  <option>GDPR</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Auditor Firm</label>
                <select
                  value={engForm.auditorFirm}
                  onChange={(e) => setEngForm((f) => ({ ...f, auditorFirm: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select firm</option>
                  {auditorFirms.map((firm) => (
                    <option key={firm.id} value={firm.name}>{firm.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={engForm.startDate}
                    onChange={(e) => setEngForm((f) => ({ ...f, startDate: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">End Date</label>
                  <input
                    type="date"
                    value={engForm.endDate}
                    onChange={(e) => setEngForm((f) => ({ ...f, endDate: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Lead Auditor</label>
                <input
                  type="text"
                  value={engForm.leadAuditor}
                  onChange={(e) => setEngForm((f) => ({ ...f, leadAuditor: e.target.value }))}
                  placeholder="Auditor name"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-700">
              <button
                onClick={() => { setShowCreateEngagement(false); setActionError(null); }}
                className="px-4 py-2 text-slate-300 hover:text-white text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEngagement}
                disabled={engSubmitting || !engForm.name.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {engSubmitting ? 'Creating...' : 'Create Engagement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderFindings = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-white font-semibold">
          Audit Findings ({filteredFindings.length} of {findings.length})
        </h3>
        <div className="flex items-center gap-2">
          <select
            value={findingSeverityFilter}
            onChange={(e) => setFindingSeverityFilter(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="informational">Informational</option>
          </select>
          <select
            value={findingStatusFilter}
            onChange={(e) => setFindingStatusFilter(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="remediated">Remediated</option>
            <option value="closed">Closed</option>
            <option value="accepted">Accepted</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(['critical', 'high', 'medium', 'low', 'informational'] as const).map((sev) => {
          const count = findings.filter((f) => f.severity === sev).length;
          return (
            <div key={sev} className={`rounded-lg border p-3 text-center ${severityColor[sev]}`}>
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-xs capitalize">{sev}</div>
            </div>
          );
        })}
      </div>

      {filteredFindings.length === 0 ? (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-12 text-center">
          <AlertTriangle size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No findings match the selected filters.</p>
          <button
            onClick={() => { setFindingSeverityFilter('all'); setFindingStatusFilter('all'); setSearchQuery(''); }}
            className="text-blue-400 hover:text-blue-300 text-sm mt-2"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFindings.map((finding) => (
            <div key={finding.id} className="bg-slate-800 rounded-lg border border-slate-700 p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className={`px-2 py-0.5 rounded text-xs border whitespace-nowrap mt-0.5 ${severityColor[finding.severity]}`}>
                    {finding.severity}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium text-sm">{finding.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{finding.id} | {finding.engagement} | {finding.category}</div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs whitespace-nowrap ml-2 ${statusColor[finding.status]}`}>
                  {finding.status}
                </span>
              </div>
              <p className="text-slate-300 text-sm mb-3">{finding.description}</p>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1"><Users size={12} /> {finding.assignee}</span>
                  <span className="flex items-center gap-1"><Calendar size={12} /> Due: {finding.dueDate}</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> Created: {finding.createdDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-blue-400 hover:text-blue-300"><Eye size={14} /></button>
                  <button className="text-slate-400 hover:text-white"><Edit size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderEvidenceRequests = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-white font-semibold">
          Evidence Requests ({filteredEvidence.length} of {evidenceRequests.length})
        </h3>
        <div className="flex items-center gap-2">
          <select
            value={evidenceStatusFilter}
            onChange={(e) => setEvidenceStatusFilter(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="submitted">Submitted</option>
            <option value="under-review">Under Review</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors">
            <Upload size={14} /> Upload Evidence
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(['pending', 'submitted', 'under-review', 'accepted', 'rejected'] as const).map((st) => {
          const count = evidenceRequests.filter((e) => e.status === st).length;
          return (
            <div key={st} className={`rounded-lg p-3 text-center ${statusColor[st]}`}>
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-xs capitalize">{st.replace('-', ' ')}</div>
            </div>
          );
        })}
      </div>

      {filteredEvidence.length === 0 ? (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-12 text-center">
          <FileText size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No evidence requests match the selected filters.</p>
          <button
            onClick={() => { setEvidenceStatusFilter('all'); setSearchQuery(''); }}
            className="text-blue-400 hover:text-blue-300 text-sm mt-2"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvidence.map((req) => (
            <div
              key={req.id}
              className={`bg-slate-800 rounded-lg border p-4 ${
                req.isOverdue ? 'border-red-500/50' : 'border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium text-sm">{req.title}</span>
                    {req.isOverdue && (
                      <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                        <AlertCircle size={10} /> Overdue
                      </span>
                    )}
                    {req.priority === 'high' && (
                      <span className="px-2 py-0.5 rounded text-xs bg-orange-500/20 text-orange-400">
                        High Priority
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{req.id} | {req.engagement}</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs whitespace-nowrap ml-2 ${statusColor[req.status]}`}>
                  {req.status.replace('-', ' ')}
                </span>
              </div>
              <p className="text-slate-300 text-sm mb-3">{req.description}</p>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1"><Send size={12} /> From: {req.requestedBy}</span>
                  <span className="flex items-center gap-1"><Users size={12} /> To: {req.assignee}</span>
                  <span className="flex items-center gap-1"><Calendar size={12} /> Due: {req.dueDate}</span>
                  {req.attachments > 0 && (
                    <span className="flex items-center gap-1"><FileText size={12} /> {req.attachments} files</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-xs">
                    <Upload size={12} /> Upload
                  </button>
                  <button className="text-slate-400 hover:text-white"><Eye size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderDirectory = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-white font-semibold">Auditor Directory ({auditorFirms.length} Firms)</h3>
        {selectedFirms.length >= 2 && (
          <button className="flex items-center gap-2 px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors">
            <BarChart3 size={14} /> Compare Selected ({selectedFirms.length})
          </button>
        )}
      </div>

      {selectedFirms.length >= 2 && (
        <div className="bg-slate-800 rounded-lg border border-purple-500/30 p-5">
          <h4 className="text-white font-semibold mb-4">Firm Comparison</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left text-slate-400 pb-2 pr-4">Attribute</th>
                  {selectedFirms.map((id) => {
                    const firm = auditorFirms.find((f) => f.id === id);
                    return (
                      <th key={id} className="text-left text-white pb-2 pr-4">{firm?.name}</th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="text-slate-300">
                <tr className="border-b border-slate-700/50">
                  <td className="py-2 text-slate-400">Rating</td>
                  {selectedFirms.map((id) => {
                    const firm = auditorFirms.find((f) => f.id === id);
                    return <td key={id} className="py-2">{firm?.rating}/5.0 ({firm?.reviewCount} reviews)</td>;
                  })}
                </tr>
                <tr className="border-b border-slate-700/50">
                  <td className="py-2 text-slate-400">Experience</td>
                  {selectedFirms.map((id) => {
                    const firm = auditorFirms.find((f) => f.id === id);
                    return <td key={id} className="py-2">{firm?.yearsExperience} years</td>;
                  })}
                </tr>
                <tr className="border-b border-slate-700/50">
                  <td className="py-2 text-slate-400">Clients</td>
                  {selectedFirms.map((id) => {
                    const firm = auditorFirms.find((f) => f.id === id);
                    return <td key={id} className="py-2">{firm?.clientCount?.toLocaleString()}</td>;
                  })}
                </tr>
                <tr className="border-b border-slate-700/50">
                  <td className="py-2 text-slate-400">Price Range</td>
                  {selectedFirms.map((id) => {
                    const firm = auditorFirms.find((f) => f.id === id);
                    return <td key={id} className="py-2">{firm?.priceRange}</td>;
                  })}
                </tr>
                <tr>
                  <td className="py-2 text-slate-400">Specializations</td>
                  {selectedFirms.map((id) => {
                    const firm = auditorFirms.find((f) => f.id === id);
                    return <td key={id} className="py-2">{firm?.specializations.join(', ')}</td>;
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {auditorFirms.map((firm) => (
          <div key={firm.id} className="bg-slate-800 rounded-lg border border-slate-700 p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                  {firm.logo}
                </div>
                <div>
                  <h4 className="text-white font-semibold">{firm.name}</h4>
                  <div className="flex items-center gap-1 text-sm">
                    <Star size={12} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-yellow-400">{firm.rating}</span>
                    <span className="text-slate-400">({firm.reviewCount} reviews)</span>
                  </div>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedFirms.includes(firm.id)}
                  onChange={() => toggleFirmCompare(firm.id)}
                  className="rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-400">Compare</span>
              </label>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {firm.specializations.map((spec) => (
                <span key={spec} className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-xs">
                  {spec}
                </span>
              ))}
            </div>

            <div className="space-y-1.5 mb-3 text-sm">
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin size={14} className="text-slate-400" /> {firm.location}
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Mail size={14} className="text-slate-400" /> {firm.contactEmail}
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Phone size={14} className="text-slate-400" /> {firm.contactPhone}
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Globe size={14} className="text-slate-400" /> {firm.website}
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-400 border-t border-slate-700 pt-3 mb-3">
              <span>{firm.yearsExperience} years experience</span>
              <span>{firm.clientCount.toLocaleString()} clients</span>
              <span>{firm.priceRange}</span>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {firm.certifications.map((cert) => (
                <span key={cert} className="px-2 py-0.5 bg-green-500/10 text-green-400 rounded text-xs flex items-center gap-1">
                  <Award size={10} /> {cert}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors text-center">
                Request Proposal
              </button>
              <button className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors">
                <MessageSquare size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderWorkpapers = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-white font-semibold">
          Workpapers ({filteredWorkpapers.length} of {workpapers.length})
        </h3>
        <div className="flex items-center gap-2">
          <select
            value={workpaperStatusFilter}
            onChange={(e) => setWorkpaperStatusFilter(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="in-review">In Review</option>
            <option value="approved">Approved</option>
            <option value="final">Final</option>
          </select>
          <button
            onClick={() => { setActionError(null); setShowCreateWorkpaper(true); }}
            className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
          >
            <Plus size={14} /> New Workpaper
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(['draft', 'in-review', 'approved', 'final'] as const).map((st) => {
          const count = workpapers.filter((w) => w.status === st).length;
          return (
            <div key={st} className={`rounded-lg p-3 text-center ${workpaperStatusColor[st]}`}>
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-xs capitalize">{st.replace('-', ' ')}</div>
            </div>
          );
        })}
      </div>

      {filteredWorkpapers.length === 0 ? (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-12 text-center">
          <BookOpen size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No workpapers match the selected filters.</p>
          <button
            onClick={() => { setWorkpaperStatusFilter('all'); setSearchQuery(''); }}
            className="text-blue-400 hover:text-blue-300 text-sm mt-2"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredWorkpapers.map((wp) => (
            <div key={wp.id} className="bg-slate-800 rounded-lg border border-slate-700 p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <FolderOpen size={18} className="text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium text-sm">{wp.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {wp.id} | {wp.engagement} | {wp.type}
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs whitespace-nowrap ml-2 ${workpaperStatusColor[wp.status]}`}>
                  {wp.status.replace('-', ' ')}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1"><Users size={12} /> Author: {wp.author}</span>
                  <span className="flex items-center gap-1"><Eye size={12} /> Reviewer: {wp.reviewer}</span>
                  <span className="flex items-center gap-1"><History size={12} /> v{wp.version}</span>
                  <span className="flex items-center gap-1"><Calendar size={12} /> {wp.lastModified}</span>
                  <span>{wp.size}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-blue-400 hover:text-blue-300" title="Download">
                    <Download size={14} />
                  </button>
                  <button className="text-slate-400 hover:text-white" title="View history">
                    <History size={14} />
                  </button>
                  <button className="text-slate-400 hover:text-white" title="Edit">
                    <Edit size={14} />
                  </button>
                  {wp.status === 'draft' && (
                    <button
                      onClick={() => handleWorkpaperStatus(wp.id, 'in-review')}
                      disabled={busyWorkpaperId === wp.id}
                      className="text-green-400 hover:text-green-300 text-xs flex items-center gap-1 disabled:opacity-50"
                      title="Submit for review"
                    >
                      <Send size={12} /> Submit
                    </button>
                  )}
                  {wp.status === 'in-review' && (
                    <button
                      onClick={() => handleWorkpaperStatus(wp.id, 'approved')}
                      disabled={busyWorkpaperId === wp.id}
                      className="text-green-400 hover:text-green-300 text-xs flex items-center gap-1 disabled:opacity-50"
                      title="Approve"
                    >
                      <Check size={12} /> Approve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-slate-800 rounded-lg border border-slate-700 p-5">
        <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
          <History size={16} className="text-blue-400" />
          Version History & Review Workflow
        </h4>
        <div className="space-y-3">
          {[
            { action: 'Version 2.1 uploaded', paper: 'Access Control Testing Workpaper', user: 'Sarah Chen', time: '2026-02-18 14:30', status: 'Submitted for review' },
            { action: 'Review comments added', paper: 'SOD Conflict Analysis', user: 'Robert Kim', time: '2026-02-16 10:15', status: '3 comments pending' },
            { action: 'Approved', paper: 'Change Management Walkthrough', user: 'James Liu', time: '2026-02-15 16:45', status: 'Version 1.3 approved' },
            { action: 'Version 3.0 finalized', paper: 'Risk Assessment Summary', user: 'Patricia Moore', time: '2026-02-10 09:00', status: 'Marked as final' },
          ].map((entry, idx) => (
            <div key={idx} className="flex items-start gap-3 bg-slate-700/30 rounded-lg p-3">
              <div className="mt-0.5">
                {entry.action.includes('Approved') || entry.action.includes('finalized') ? (
                  <CheckCircle size={14} className="text-green-400" />
                ) : entry.action.includes('comments') ? (
                  <MessageSquare size={14} className="text-yellow-400" />
                ) : (
                  <Upload size={14} className="text-blue-400" />
                )}
              </div>
              <div className="flex-1">
                <span className="text-white text-sm font-medium">{entry.action}</span>
                <div className="text-xs text-slate-400">{entry.paper} by {entry.user}</div>
                <div className="text-xs text-slate-500">{entry.status}</div>
              </div>
              <span className="text-xs text-slate-500 whitespace-nowrap">{entry.time}</span>
            </div>
          ))}
        </div>
      </div>

      {showCreateWorkpaper && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <h3 className="text-white font-semibold">New Workpaper</h3>
              <button onClick={() => { setShowCreateWorkpaper(false); setActionError(null); }} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {actionError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-400 flex items-center gap-2">
                  <AlertCircle size={14} className="flex-shrink-0" /> {actionError}
                </div>
              )}
              <div>
                <label className="block text-sm text-slate-300 mb-1">Workpaper Name</label>
                <input
                  type="text"
                  value={wpForm.name}
                  onChange={(e) => setWpForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., Access Control Testing Workpaper"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Engagement</label>
                <select
                  value={wpForm.engagementId}
                  onChange={(e) => setWpForm((f) => ({ ...f, engagementId: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select engagement</option>
                  {engagements.map((eng) => (
                    <option key={eng.id} value={eng.id}>{eng.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Type</label>
                <select
                  value={wpForm.type}
                  onChange={(e) => setWpForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option>Testing</option>
                  <option>Walkthrough</option>
                  <option>Summary</option>
                  <option>Matrix</option>
                  <option>Analysis</option>
                  <option>Evidence</option>
                  <option>Review</option>
                  <option>Memo</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-700">
              <button
                onClick={() => { setShowCreateWorkpaper(false); setActionError(null); }}
                className="px-4 py-2 text-slate-300 hover:text-white text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateWorkpaper}
                disabled={wpSubmitting || !wpForm.name.trim() || !wpForm.engagementId}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {wpSubmitting ? 'Creating...' : 'Create Workpaper'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={32} className="text-blue-400 animate-spin" />
          <span className="text-slate-400 ml-3">{t('common.loading')}</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-8 text-center">
          <XCircle size={40} className="text-red-400 mx-auto mb-3" />
          <p className="text-red-400 font-medium mb-2">Error Loading Data</p>
          <p className="text-slate-400 text-sm mb-4">{error}</p>
          <button
            onClick={() => setError(null)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'engagements':
        return renderEngagements();
      case 'findings':
        return renderFindings();
      case 'evidence':
        return renderEvidenceRequests();
      case 'directory':
        return renderDirectory();
      case 'workpapers':
        return renderWorkpapers();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="border-b border-slate-700 bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Shield size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">{t('audit.title')}</h1>
                  <p className="text-sm text-slate-400">Manage audits, findings, evidence, and auditor relationships</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search audits, findings, evidence..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-700 border border-slate-600 rounded-lg pl-9 pr-4 py-2 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 w-72"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-700 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-white hover:border-slate-600'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {actionError && !showCreateEngagement && !showCreateWorkpaper && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400 flex items-center justify-between">
            <span className="flex items-center gap-2"><AlertCircle size={14} /> {actionError}</span>
            <button onClick={() => setActionError(null)} className="text-red-400 hover:text-red-300"><X size={14} /></button>
          </div>
        )}
        {renderContent()}
      </div>
    </div>
  );
};

export default AuditorHub;
