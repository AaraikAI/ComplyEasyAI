/**
 * RoPA Management Component
 *
 * Records of Processing Activities (Article 30 GDPR) management:
 * - Table listing all processing activities
 * - Create/Edit form with all required fields
 * - Export functionality (CSV/JSON)
 * - Statistics summary cards
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { logger } from '../utils/logger';
import {
  ArrowLeft,
  Shield,
  FileText,
  Plus,
  X,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Eye,
  Edit,
  Download,
  BarChart3,
  Database,
  Filter,
  Trash2,
  Globe,
  Lock,
  Users,
  ClipboardList,
} from 'lucide-react';

// ── Type Definitions ────────────────────────────────────────────────────────

type RoPAStatus = 'Active' | 'UnderReview' | 'Archived' | 'Draft';

type LegalBasis =
  | 'Consent'
  | 'Contract'
  | 'LegalObligation'
  | 'VitalInterests'
  | 'PublicTask'
  | 'LegitimateInterests';

interface ProcessingActivity {
  id: string;
  activityName: string;
  description: string;
  purposes: string[];
  legalBasis: LegalBasis;
  legalBasisJustification: string;
  dataCategories: string[];
  specialCategories: string[];
  dataSubjects: string[];
  recipients: string[];
  internationalTransfers: {
    country: string;
    safeguard: string;
  }[];
  retentionPeriod: string;
  technicalMeasures: string[];
  organizationalMeasures: string[];
  controllerName: string;
  controllerContact: string;
  processorName: string;
  processorContact: string;
  dpoContact: string;
  status: RoPAStatus;
  createdAt: string;
  updatedAt: string;
  lastReviewDate: string;
}

interface ProcessingActivityForm {
  activityName: string;
  description: string;
  purposes: string;
  legalBasis: LegalBasis;
  legalBasisJustification: string;
  dataCategories: string;
  specialCategories: string;
  dataSubjects: string;
  recipients: string;
  internationalTransfers: string;
  retentionPeriod: string;
  technicalMeasures: string;
  organizationalMeasures: string;
  controllerName: string;
  controllerContact: string;
  processorName: string;
  processorContact: string;
  dpoContact: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

const API_BASE = (import.meta as ImportMeta & { env: Record<string, string> }).env.VITE_API_URL || 'http://localhost:3001/api';
const apiUrl = API_BASE.endsWith('/api') ? API_BASE : API_BASE.replace(/\/?$/, '') + '/api';

const statusColors: Record<RoPAStatus, string> = {
  Active: 'bg-green-500/20 text-green-400 border-green-500/30',
  UnderReview: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Archived: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  Draft: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

const legalBasisLabels: Record<LegalBasis, string> = {
  Consent: 'Consent (Art. 6(1)(a))',
  Contract: 'Contract (Art. 6(1)(b))',
  LegalObligation: 'Legal Obligation (Art. 6(1)(c))',
  VitalInterests: 'Vital Interests (Art. 6(1)(d))',
  PublicTask: 'Public Task (Art. 6(1)(e))',
  LegitimateInterests: 'Legitimate Interests (Art. 6(1)(f))',
};

const legalBasisShortLabels: Record<LegalBasis, string> = {
  Consent: 'Consent',
  Contract: 'Contract',
  LegalObligation: 'Legal Obligation',
  VitalInterests: 'Vital Interests',
  PublicTask: 'Public Task',
  LegitimateInterests: 'Legitimate Interests',
};

const emptyForm: ProcessingActivityForm = {
  activityName: '',
  description: '',
  purposes: '',
  legalBasis: 'Consent',
  legalBasisJustification: '',
  dataCategories: '',
  specialCategories: '',
  dataSubjects: '',
  recipients: '',
  internationalTransfers: '',
  retentionPeriod: '',
  technicalMeasures: '',
  organizationalMeasures: '',
  controllerName: '',
  controllerContact: '',
  processorName: '',
  processorContact: '',
  dpoContact: '',
};

// ── Helper ──────────────────────────────────────────────────────────────────

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${apiUrl}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  return res.json();
}

// ── Component ───────────────────────────────────────────────────────────────

const RoPAManagement: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<RoPAStatus | 'All'>('All');
  const [legalBasisFilter, setLegalBasisFilter] = useState<LegalBasis | 'All'>('All');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activities, setActivities] = useState<ProcessingActivity[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<ProcessingActivityForm>({ ...emptyForm });
  const [selectedActivity, setSelectedActivity] = useState<ProcessingActivity | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // ── Data Loading ──────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await apiFetch<{ data: ProcessingActivity[] } | ProcessingActivity[]>('/ropa');
      if (Array.isArray(res)) {
        setActivities(res);
      } else if (res?.data) {
        setActivities(res.data);
      }
    } catch (err) {
      setLoadError('Failed to load processing activities. Please check your connection and try again.');
      logger.error('RoPAManagement data load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Computed Stats ────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = activities.length;
    const active = activities.filter(a => a.status === 'Active').length;
    const underReview = activities.filter(a => a.status === 'UnderReview').length;
    const archived = activities.filter(a => a.status === 'Archived').length;
    const draft = activities.filter(a => a.status === 'Draft').length;

    const byLegalBasis: Record<string, number> = {};
    activities.forEach(a => {
      const label = legalBasisShortLabels[a.legalBasis] || a.legalBasis;
      byLegalBasis[label] = (byLegalBasis[label] || 0) + 1;
    });

    const withSpecialCategories = activities.filter(
      a => a.specialCategories && a.specialCategories.length > 0
    ).length;

    const withInternationalTransfers = activities.filter(
      a => a.internationalTransfers && a.internationalTransfers.length > 0
    ).length;

    return {
      total,
      active,
      underReview,
      archived,
      draft,
      byLegalBasis,
      withSpecialCategories,
      withInternationalTransfers,
    };
  }, [activities]);

  const filteredActivities = useMemo(() => {
    return activities.filter(a => {
      const matchesSearch =
        searchQuery === '' ||
        a.activityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || a.status === statusFilter;
      const matchesLegal = legalBasisFilter === 'All' || a.legalBasis === legalBasisFilter;
      return matchesSearch && matchesStatus && matchesLegal;
    });
  }, [activities, searchQuery, statusFilter, legalBasisFilter]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setShowFormModal(true);
  };

  const handleOpenEdit = (activity: ProcessingActivity) => {
    setEditingId(activity.id);
    setForm({
      activityName: activity.activityName,
      description: activity.description,
      purposes: activity.purposes.join(', '),
      legalBasis: activity.legalBasis,
      legalBasisJustification: activity.legalBasisJustification,
      dataCategories: activity.dataCategories.join(', '),
      specialCategories: activity.specialCategories.join(', '),
      dataSubjects: activity.dataSubjects.join(', '),
      recipients: activity.recipients.join(', '),
      internationalTransfers: activity.internationalTransfers
        .map(item => `${item.country} (${item.safeguard})`)
        .join(', '),
      retentionPeriod: activity.retentionPeriod,
      technicalMeasures: activity.technicalMeasures.join(', '),
      organizationalMeasures: activity.organizationalMeasures.join(', '),
      controllerName: activity.controllerName,
      controllerContact: activity.controllerContact,
      processorName: activity.processorName,
      processorContact: activity.processorContact,
      dpoContact: activity.dpoContact,
    });
    setShowFormModal(true);
  };

  const handleViewDetail = (activity: ProcessingActivity) => {
    setSelectedActivity(activity);
    setShowDetailModal(true);
  };

  const handleSubmitForm = async () => {
    setSubmitting(true);
    try {
      const payload = {
        activityName: form.activityName,
        description: form.description,
        purposes: form.purposes.split(',').map(s => s.trim()).filter(Boolean),
        legalBasis: form.legalBasis,
        legalBasisJustification: form.legalBasisJustification,
        dataCategories: form.dataCategories.split(',').map(s => s.trim()).filter(Boolean),
        specialCategories: form.specialCategories.split(',').map(s => s.trim()).filter(Boolean),
        dataSubjects: form.dataSubjects.split(',').map(s => s.trim()).filter(Boolean),
        recipients: form.recipients.split(',').map(s => s.trim()).filter(Boolean),
        internationalTransfers: form.internationalTransfers
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
          .map(entry => {
            const match = entry.match(/^(.+?)\s*\((.+?)\)$/);
            return match ? { country: match[1].trim(), safeguard: match[2].trim() } : { country: entry, safeguard: 'SCC' };
          }),
        retentionPeriod: form.retentionPeriod,
        technicalMeasures: form.technicalMeasures.split(',').map(s => s.trim()).filter(Boolean),
        organizationalMeasures: form.organizationalMeasures.split(',').map(s => s.trim()).filter(Boolean),
        controllerName: form.controllerName,
        controllerContact: form.controllerContact,
        processorName: form.processorName,
        processorContact: form.processorContact,
        dpoContact: form.dpoContact,
      };

      if (editingId) {
        await apiFetch(`/ropa/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/ropa', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setShowFormModal(false);
      setForm({ ...emptyForm });
      setEditingId(null);
      await loadData();
    } catch (err) {
      logger.error('Failed to save processing activity:', err);
      setLoadError('Failed to save processing activity. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = (format: 'csv' | 'json') => {
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(activities, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ropa-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const headers = [
        'ID',
        'Activity Name',
        'Description',
        'Purposes',
        'Legal Basis',
        'Data Categories',
        'Special Categories',
        'Data Subjects',
        'Recipients',
        'International Transfers',
        'Retention Period',
        'Technical Measures',
        'Organizational Measures',
        'Controller',
        'Processor',
        'Status',
        'Created',
        'Updated',
      ];
      const rows = activities.map(a => [
        a.id,
        `"${a.activityName}"`,
        `"${a.description}"`,
        `"${a.purposes.join('; ')}"`,
        legalBasisShortLabels[a.legalBasis],
        `"${a.dataCategories.join('; ')}"`,
        `"${a.specialCategories.join('; ')}"`,
        `"${a.dataSubjects.join('; ')}"`,
        `"${a.recipients.join('; ')}"`,
        `"${a.internationalTransfers.map(item => `${item.country} (${item.safeguard})`).join('; ')}"`,
        a.retentionPeriod,
        `"${a.technicalMeasures.join('; ')}"`,
        `"${a.organizationalMeasures.join('; ')}"`,
        `"${a.controllerName}"`,
        `"${a.processorName}"`,
        a.status,
        a.createdAt,
        a.updatedAt,
      ]);

      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ropa-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // ── Statistics Cards ──────────────────────────────────────────────────────

  const renderStats = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-400 text-sm mb-1">
            <Database className="w-4 h-4" /> Total Activities
          </div>
          <div className="text-3xl font-bold text-blue-400">{stats.total}</div>
          <div className="text-xs text-slate-500 mt-1">{stats.draft} drafts</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-400 text-sm mb-1">
            <CheckCircle className="w-4 h-4" /> Active
          </div>
          <div className="text-3xl font-bold text-green-400">{stats.active}</div>
          <div className="text-xs text-slate-500 mt-1">{stats.underReview} under review</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-purple-400 text-sm mb-1">
            <Lock className="w-4 h-4" /> Special Categories
          </div>
          <div className="text-3xl font-bold text-purple-400">{stats.withSpecialCategories}</div>
          <div className="text-xs text-slate-500 mt-1">activities with sensitive data</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-orange-400 text-sm mb-1">
            <Globe className="w-4 h-4" /> International Transfers
          </div>
          <div className="text-3xl font-bold text-orange-400">{stats.withInternationalTransfers}</div>
          <div className="text-xs text-slate-500 mt-1">cross-border activities</div>
        </div>
      </div>

      {/* Legal Basis Breakdown */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-white mb-3">By Legal Basis</h3>
        <div className="space-y-2">
          {Object.entries(stats.byLegalBasis).map(([basis, count]) => {
            const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
            return (
              <div key={basis} className="flex items-center gap-3">
                <div className="w-36 text-xs text-slate-400 truncate" title={basis}>
                  {basis}
                </div>
                <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="w-6 text-xs text-slate-400 text-right">{count}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ── Activities Table ──────────────────────────────────────────────────────

  const renderTable = () => (
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
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as RoPAStatus | 'All')}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="UnderReview">Under Review</option>
            <option value="Draft">Draft</option>
            <option value="Archived">Archived</option>
          </select>
          <select
            value={legalBasisFilter}
            onChange={e => setLegalBasisFilter(e.target.value as LegalBasis | 'All')}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="All">All Legal Bases</option>
            {(Object.keys(legalBasisLabels) as LegalBasis[]).map(lb => (
              <option key={lb} value={lb}>
                {legalBasisShortLabels[lb]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors">
              <Download className="w-4 h-4" /> {t('common.export')}
            </button>
            <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => handleExport('csv')}
                className="block w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white rounded-t-lg"
              >
                Export as CSV
              </button>
              <button
                onClick={() => handleExport('json')}
                className="block w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white rounded-b-lg"
              >
                Export as JSON
              </button>
            </div>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> {t('ropa.createRecord')}
          </button>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Activity Name</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">{t('ropa.processingPurpose')}</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">{t('ropa.lawfulBasis')}</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">{t('ropa.categoriesOfData')}</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">{t('common.status')}</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Updated</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredActivities.map(activity => (
                <tr key={activity.id} className="border-b border-slate-700/50 hover:bg-slate-750/50">
                  <td className="px-4 py-3 text-slate-200 max-w-[200px]">
                    <div className="truncate" title={activity.activityName}>
                      {activity.activityName}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap max-w-[200px]">
                      {activity.purposes.slice(0, 2).map((p, i) => (
                        <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                          {p}
                        </span>
                      ))}
                      {activity.purposes.length > 2 && (
                        <span className="text-xs text-slate-500">+{activity.purposes.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">
                      {legalBasisShortLabels[activity.legalBasis]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap max-w-[180px]">
                      {activity.dataCategories.slice(0, 2).map((c, i) => (
                        <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                          {c}
                        </span>
                      ))}
                      {activity.dataCategories.length > 2 && (
                        <span className="text-xs text-slate-500">+{activity.dataCategories.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded border ${statusColors[activity.status]}`}>
                      {activity.status === 'UnderReview' ? 'Under Review' : activity.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{activity.updatedAt}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleViewDetail(activity)}
                        className="p-1.5 text-slate-400 hover:text-white transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(activity)}
                        className="p-1.5 text-slate-400 hover:text-white transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredActivities.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-sm">
            {loading ? 'Loading processing activities...' : 'No activities match the current filters.'}
          </div>
        )}
      </div>
    </div>
  );

  // ── Create/Edit Form Modal ────────────────────────────────────────────────

  const renderFormModal = () => {
    if (!showFormModal) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
            <h2 className="text-lg font-semibold text-white">
              {editingId ? `${t('common.edit')} ${t('ropa.createRecord')}` : t('ropa.createRecord')}
            </h2>
            <button
              onClick={() => {
                setShowFormModal(false);
                setEditingId(null);
              }}
              className="p-1 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="px-6 py-4 space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" /> Basic Information
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Activity Name *</label>
                  <input
                    type="text"
                    value={form.activityName}
                    onChange={e => setForm(prev => ({ ...prev, activityName: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g., Customer Data Processing"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">{t('common.description')}</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                    placeholder="Describe the processing activity"
                  />
                </div>
              </div>
            </div>

            {/* Controller & Processor */}
            <div>
              <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-green-400" /> Controller & Processor Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Controller Name *</label>
                  <input
                    type="text"
                    value={form.controllerName}
                    onChange={e => setForm(prev => ({ ...prev, controllerName: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Controller organization name"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Controller Contact</label>
                  <input
                    type="text"
                    value={form.controllerContact}
                    onChange={e => setForm(prev => ({ ...prev, controllerContact: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Contact details"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Processor Name</label>
                  <input
                    type="text"
                    value={form.processorName}
                    onChange={e => setForm(prev => ({ ...prev, processorName: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Processor organization name"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Processor Contact</label>
                  <input
                    type="text"
                    value={form.processorContact}
                    onChange={e => setForm(prev => ({ ...prev, processorContact: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Contact details"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-slate-400 mb-1">DPO Contact</label>
                  <input
                    type="text"
                    value={form.dpoContact}
                    onChange={e => setForm(prev => ({ ...prev, dpoContact: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Data Protection Officer contact"
                  />
                </div>
              </div>
            </div>

            {/* Processing Details */}
            <div>
              <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-yellow-400" /> Processing Details
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">{t('ropa.processingPurpose')} (comma-separated) *</label>
                  <input
                    type="text"
                    value={form.purposes}
                    onChange={e => setForm(prev => ({ ...prev, purposes: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g., Service delivery, Marketing, Analytics"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">{t('ropa.lawfulBasis')} *</label>
                    <select
                      value={form.legalBasis}
                      onChange={e => setForm(prev => ({ ...prev, legalBasis: e.target.value as LegalBasis }))}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {(Object.keys(legalBasisLabels) as LegalBasis[]).map(lb => (
                        <option key={lb} value={lb}>
                          {legalBasisLabels[lb]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Legal Basis Justification</label>
                    <input
                      type="text"
                      value={form.legalBasisJustification}
                      onChange={e => setForm(prev => ({ ...prev, legalBasisJustification: e.target.value }))}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Justification for chosen legal basis"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">{t('ropa.categoriesOfData')} (comma-separated) *</label>
                  <input
                    type="text"
                    value={form.dataCategories}
                    onChange={e => setForm(prev => ({ ...prev, dataCategories: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g., Name, Email, IP Address, Payment Data"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Special Categories (comma-separated)</label>
                  <input
                    type="text"
                    value={form.specialCategories}
                    onChange={e => setForm(prev => ({ ...prev, specialCategories: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g., Health data, Biometric data, Political opinions"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">{t('dpia.dataSubjects')} (comma-separated)</label>
                  <input
                    type="text"
                    value={form.dataSubjects}
                    onChange={e => setForm(prev => ({ ...prev, dataSubjects: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g., Customers, Employees, Website visitors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">{t('ropa.recipients')} (comma-separated)</label>
                  <input
                    type="text"
                    value={form.recipients}
                    onChange={e => setForm(prev => ({ ...prev, recipients: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g., Cloud provider, Payment processor, Analytics provider"
                  />
                </div>
              </div>
            </div>

            {/* Transfers & Retention */}
            <div>
              <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4 text-orange-400" /> Transfers & Retention
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    International Transfers (format: Country (Safeguard), comma-separated)
                  </label>
                  <input
                    type="text"
                    value={form.internationalTransfers}
                    onChange={e => setForm(prev => ({ ...prev, internationalTransfers: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g., USA (SCC), India (BCR)"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">{t('ropa.retentionPeriod')} *</label>
                  <input
                    type="text"
                    value={form.retentionPeriod}
                    onChange={e => setForm(prev => ({ ...prev, retentionPeriod: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g., 3 years after contract termination"
                  />
                </div>
              </div>
            </div>

            {/* Security Measures */}
            <div>
              <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                <Lock className="w-4 h-4 text-purple-400" /> Security Measures
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">{t('ropa.technicalMeasures')} (comma-separated)</label>
                  <textarea
                    value={form.technicalMeasures}
                    onChange={e => setForm(prev => ({ ...prev, technicalMeasures: e.target.value }))}
                    rows={2}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                    placeholder="e.g., Encryption at rest, TLS 1.3, Access controls, Audit logging"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    {t('ropa.organizationalMeasures')} (comma-separated)
                  </label>
                  <textarea
                    value={form.organizationalMeasures}
                    onChange={e => setForm(prev => ({ ...prev, organizationalMeasures: e.target.value }))}
                    rows={2}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                    placeholder="e.g., Staff training, DPA with processors, Regular audits"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-700 sticky bottom-0 bg-slate-800">
            <button
              onClick={() => {
                setShowFormModal(false);
                setEditingId(null);
              }}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSubmitForm}
              disabled={!form.activityName || !form.controllerName || submitting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors"
            >
              <CheckCircle className="w-4 h-4" /> {submitting ? `${t('common.loading')}...` : t('common.save')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Detail Modal ──────────────────────────────────────────────────────────

  const renderDetailModal = () => {
    if (!showDetailModal || !selectedActivity) return null;
    const a = selectedActivity;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
            <h2 className="text-lg font-semibold text-white">{a.activityName}</h2>
            <button
              onClick={() => setShowDetailModal(false)}
              className="p-1 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded border ${statusColors[a.status]}`}>
                {a.status === 'UnderReview' ? 'Under Review' : a.status}
              </span>
              <span className="text-xs text-slate-500">ID: {a.id}</span>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">{t('common.description')}</div>
              <div className="text-sm text-slate-200">{a.description || 'No description'}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-400 mb-1">Controller</div>
                <div className="text-sm text-slate-200">{a.controllerName}</div>
                <div className="text-xs text-slate-500">{a.controllerContact}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">Processor</div>
                <div className="text-sm text-slate-200">{a.processorName || 'N/A'}</div>
                <div className="text-xs text-slate-500">{a.processorContact}</div>
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">{t('ropa.lawfulBasis')}</div>
              <div className="text-sm text-slate-200">{legalBasisLabels[a.legalBasis]}</div>
              {a.legalBasisJustification && (
                <div className="text-xs text-slate-500 mt-0.5">{a.legalBasisJustification}</div>
              )}
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">{t('ropa.processingPurpose')}</div>
              <div className="flex gap-1 flex-wrap">
                {a.purposes.map((p, i) => (
                  <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                    {p}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">{t('ropa.categoriesOfData')}</div>
              <div className="flex gap-1 flex-wrap">
                {a.dataCategories.map((c, i) => (
                  <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                    {c}
                  </span>
                ))}
              </div>
            </div>
            {a.specialCategories.length > 0 && (
              <div>
                <div className="text-xs text-slate-400 mb-1">Special Categories</div>
                <div className="flex gap-1 flex-wrap">
                  {a.specialCategories.map((c, i) => (
                    <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div>
              <div className="text-xs text-slate-400 mb-1">{t('ropa.recipients')}</div>
              <div className="flex gap-1 flex-wrap">
                {a.recipients.map((r, i) => (
                  <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                    {r}
                  </span>
                ))}
              </div>
            </div>
            {a.internationalTransfers.length > 0 && (
              <div>
                <div className="text-xs text-slate-400 mb-1">{t('ropa.transfers')}</div>
                <div className="space-y-1">
                  {a.internationalTransfers.map((item, i) => (
                    <div key={i} className="text-sm text-slate-200">
                      {item.country} <span className="text-xs text-slate-500">({item.safeguard})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <div className="text-xs text-slate-400 mb-1">{t('ropa.retentionPeriod')}</div>
              <div className="text-sm text-slate-200">{a.retentionPeriod}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-400 mb-1">{t('ropa.technicalMeasures')}</div>
                <div className="space-y-0.5">
                  {a.technicalMeasures.map((m, i) => (
                    <div key={i} className="text-xs text-slate-300 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-green-400" /> {m}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">{t('ropa.organizationalMeasures')}</div>
                <div className="space-y-0.5">
                  {a.organizationalMeasures.map((m, i) => (
                    <div key={i} className="text-xs text-slate-300 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-green-400" /> {m}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-700">
              <span>Created: {a.createdAt}</span>
              <span>Updated: {a.updatedAt}</span>
              <span>Last Review: {a.lastReviewDate}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Error Banner ──────────────────────────────────────────────────────────

  const renderErrorBanner = () =>
    loadError ? (
      <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span className="text-sm text-red-300">{loadError}</span>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-300 rounded text-sm hover:bg-red-500/30 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      </div>
    ) : null;

  // ── Main Return ───────────────────────────────────────────────────────────

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
                <Database className="w-5 h-5 text-blue-400" />
                <h1 className="text-lg font-semibold text-white">{t('ropa.title')}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">GDPR Article 30</span>
              <button
                onClick={loadData}
                className="p-2 text-slate-400 hover:text-white transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {renderErrorBanner()}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
            <span className="ml-3 text-slate-400">{t('common.loading')}...</span>
          </div>
        ) : (
          <>
            {renderStats()}
            {renderTable()}
          </>
        )}
      </div>

      {renderFormModal()}
      {renderDetailModal()}
    </div>
  );
};

export default RoPAManagement;
