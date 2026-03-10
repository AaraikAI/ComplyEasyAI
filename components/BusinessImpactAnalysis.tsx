/**
 * Business Impact Analysis Component
 *
 * BIA wizard for business processes:
 * - Process CRUD with name, description, owner, department, criticality, RTO/RPO/MTPD
 * - Impact scoring across financial/operational/reputational/regulatory dimensions
 * - Dependency mapping table
 * - Process prioritization view sorted by criticality
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Activity,
  Plus,
  X,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Clock,
  DollarSign,
  Users,
  Shield,
  Building,
  Link2,
  BarChart3,
  TrendingDown,
  Zap,
  Target,
  RefreshCw,
  AlertCircle,
  Save,
} from 'lucide-react';

// ── Type Definitions ────────────────────────────────────────────────────────

type Criticality = 'Critical' | 'High' | 'Medium' | 'Low';
type ImpactDimension = 'financial' | 'operational' | 'reputational' | 'regulatory';
type TabId = 'processes' | 'impact' | 'dependencies' | 'prioritization';

interface ImpactScore {
  dimension: ImpactDimension;
  score1h: number;
  score4h: number;
  score24h: number;
  score72h: number;
  score1w: number;
}

interface ProcessDependency {
  processId: string;
  processName: string;
  type: 'upstream' | 'downstream';
  criticality: string;
}

interface BusinessProcess {
  id: string;
  name: string;
  description: string;
  owner: string;
  department: string;
  criticality: Criticality;
  rtoHours: number;
  rpoHours: number;
  mtpdHours: number;
  impactScores: ImpactScore[];
  dependencies: ProcessDependency[];
  peakPeriods: string[];
  staffRequired: number;
  alternateProcess: string;
  lastReviewed: string;
  createdAt: string;
  updatedAt: string;
}

interface ProcessForm {
  name: string;
  description: string;
  owner: string;
  department: string;
  criticality: Criticality;
  rtoHours: string;
  rpoHours: string;
  mtpdHours: string;
  staffRequired: string;
  alternateProcess: string;
  peakPeriods: string;
  impactScores: ImpactScore[];
}

// ── Constants ───────────────────────────────────────────────────────────────

const API_BASE = (import.meta as ImportMeta & { env: Record<string, string> }).env.VITE_API_URL || 'http://localhost:3001/api';
const apiUrl = API_BASE.endsWith('/api') ? API_BASE : API_BASE.replace(/\/?$/, '') + '/api';

const CRIT_CONFIG: Record<Criticality, { color: string; bg: string; border: string; priority: number }> = {
  Critical: { color: 'text-red-700 dark:text-red-300', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', priority: 4 },
  High: { color: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800', priority: 3 },
  Medium: { color: 'text-yellow-700 dark:text-yellow-300', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800', priority: 2 },
  Low: { color: 'text-green-700 dark:text-green-300', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', priority: 1 },
};

const DIM_CONFIG: Record<ImpactDimension, { label: string; icon: React.ReactNode; color: string }> = {
  financial: { label: 'Financial', icon: <DollarSign className="w-4 h-4" />, color: 'text-green-600 dark:text-green-400' },
  operational: { label: 'Operational', icon: <Activity className="w-4 h-4" />, color: 'text-blue-600 dark:text-blue-400' },
  reputational: { label: 'Reputational', icon: <Users className="w-4 h-4" />, color: 'text-purple-600 dark:text-purple-400' },
  regulatory: { label: 'Regulatory', icon: <Shield className="w-4 h-4" />, color: 'text-orange-600 dark:text-orange-400' },
};

const DEPARTMENTS = ['Engineering', 'Finance', 'Operations', 'Product', 'Marketing', 'Sales', 'Human Resources', 'Legal', 'Infrastructure', 'Security', 'Customer Success', 'Other'];

const defaultImpactScores: ImpactScore[] = (['financial', 'operational', 'reputational', 'regulatory'] as ImpactDimension[]).map(d => ({
  dimension: d, score1h: 1, score4h: 3, score24h: 5, score72h: 7, score1w: 9,
}));

const emptyForm: ProcessForm = {
  name: '', description: '', owner: '', department: 'Engineering', criticality: 'Medium',
  rtoHours: '', rpoHours: '', mtpdHours: '', staffRequired: '', alternateProcess: '',
  peakPeriods: '', impactScores: defaultImpactScores,
};

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

function scoreColor(score: number): string {
  if (score >= 8) return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
  if (score >= 5) return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300';
  if (score >= 3) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
  return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
}

// ── Component ───────────────────────────────────────────────────────────────

const BusinessImpactAnalysis: React.FC = () => {
  const [processes, setProcesses] = useState<BusinessProcess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('processes');
  const [searchQuery, setSearchQuery] = useState('');
  const [critFilter, setCritFilter] = useState<Criticality | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingProcess, setEditingProcess] = useState<BusinessProcess | null>(null);
  const [selectedProcess, setSelectedProcess] = useState<BusinessProcess | null>(null);
  const [form, setForm] = useState<ProcessForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [impactStep, setImpactStep] = useState(0);

  // ── API ────────────────────────────────────────────────────────────────

  const fetchProcesses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/bia/processes`, { headers: getAuthHeaders(), credentials: 'include' });
      if (!res.ok) throw new Error(`Failed to fetch processes: ${res.status}`);
      const data = await res.json();
      setProcesses(Array.isArray(data) ? data : data.processes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch processes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProcesses(); }, [fetchProcesses]);

  const saveProcess = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name, description: form.description, owner: form.owner, department: form.department,
        criticality: form.criticality, rtoHours: parseFloat(form.rtoHours) || 4, rpoHours: parseFloat(form.rpoHours) || 1,
        mtpdHours: parseFloat(form.mtpdHours) || 24, staffRequired: parseInt(form.staffRequired) || 1,
        alternateProcess: form.alternateProcess, peakPeriods: form.peakPeriods.split(',').map(s => s.trim()).filter(Boolean),
        impactScores: form.impactScores,
      };
      const url = editingProcess ? `${apiUrl}/bia/processes/${editingProcess.id}` : `${apiUrl}/bia/processes`;
      const res = await fetch(url, { method: editingProcess ? 'PUT' : 'POST', headers: getAuthHeaders(), credentials: 'include', body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(`Failed to save: ${res.status}`);
      setShowModal(false);
      setEditingProcess(null);
      setForm(emptyForm);
      await fetchProcesses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save process');
    } finally {
      setSaving(false);
    }
  };

  const deleteProcess = async (id: string) => {
    if (!confirm('Delete this process?')) return;
    try {
      const res = await fetch(`${apiUrl}/bia/processes/${id}`, { method: 'DELETE', headers: getAuthHeaders(), credentials: 'include' });
      if (!res.ok) throw new Error('Delete failed');
      if (selectedProcess?.id === id) setSelectedProcess(null);
      await fetchProcesses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  // ── Computed ───────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return processes.filter(p => {
      const match = searchQuery === '' || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.department.toLowerCase().includes(searchQuery.toLowerCase());
      const crit = critFilter === 'all' || p.criticality === critFilter;
      return match && crit;
    }).sort((a, b) => CRIT_CONFIG[b.criticality].priority - CRIT_CONFIG[a.criticality].priority);
  }, [processes, searchQuery, critFilter]);

  const stats = useMemo(() => ({
    total: processes.length,
    critical: processes.filter(p => p.criticality === 'Critical').length,
    avgRTO: processes.length > 0 ? (processes.reduce((s, p) => s + p.rtoHours, 0) / processes.length).toFixed(1) : '0',
    avgRPO: processes.length > 0 ? (processes.reduce((s, p) => s + p.rpoHours, 0) / processes.length).toFixed(1) : '0',
  }), [processes]);

  const openCreate = () => { setEditingProcess(null); setForm(emptyForm); setImpactStep(0); setShowModal(true); };
  const openEdit = (p: BusinessProcess) => {
    setEditingProcess(p);
    setForm({
      name: p.name, description: p.description, owner: p.owner, department: p.department,
      criticality: p.criticality, rtoHours: String(p.rtoHours), rpoHours: String(p.rpoHours),
      mtpdHours: String(p.mtpdHours), staffRequired: String(p.staffRequired),
      alternateProcess: p.alternateProcess, peakPeriods: p.peakPeriods.join(', '),
      impactScores: p.impactScores.length > 0 ? p.impactScores : defaultImpactScores,
    });
    setImpactStep(0);
    setShowModal(true);
  };

  const updateImpactScore = (dimIdx: number, field: keyof ImpactScore, value: number) => {
    setForm(prev => ({
      ...prev,
      impactScores: prev.impactScores.map((s, i) => i === dimIdx ? { ...s, [field]: Math.min(10, Math.max(0, value)) } : s),
    }));
  };

  const tabItems: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'processes', label: 'Process Registry', icon: <Building className="w-4 h-4" /> },
    { id: 'impact', label: 'Impact Analysis', icon: <TrendingDown className="w-4 h-4" /> },
    { id: 'dependencies', label: 'Dependencies', icon: <Link2 className="w-4 h-4" /> },
    { id: 'prioritization', label: 'Prioritization', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700">
      {/* Header */}
      <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            <div>
              <h1 className="text-xl font-bold text-surface-900 dark:text-surface-100">Business Impact Analysis</h1>
              <p className="text-sm text-surface-500 dark:text-surface-400">Assess and manage business continuity requirements</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchProcesses} disabled={loading} className="p-2 rounded-lg text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg">
              <Plus className="w-4 h-4" /> Add Process
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="bg-surface-50 dark:bg-surface-700/50 rounded-lg p-3 border border-surface-200 dark:border-surface-700">
            <span className="text-xs text-surface-500 dark:text-surface-400">Total Processes</span>
            <div className="text-2xl font-bold text-surface-900 dark:text-surface-100 mt-1">{stats.total}</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
            <span className="text-xs text-red-600 dark:text-red-400">Critical</span>
            <div className="text-2xl font-bold text-red-700 dark:text-red-300 mt-1">{stats.critical}</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
            <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Avg RTO</span>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">{stats.avgRTO}h</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
            <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> Avg RPO</span>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">{stats.avgRPO}h</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-surface-100 dark:bg-surface-700 rounded-lg p-0.5 w-fit">
          {tabItems.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === t.id ? 'bg-white dark:bg-surface-600 text-surface-900 dark:text-surface-100 shadow-sm' : 'text-surface-500 dark:text-surface-400 hover:text-surface-700'}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
          <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto p-1 text-red-500"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 text-orange-600 animate-spin" />
          <span className="ml-3 text-sm text-surface-500 dark:text-surface-400">Loading processes...</span>
        </div>
      ) : (
        <div className="p-6">
          {/* ── Processes Tab ────────────────────────────────── */}
          {activeTab === 'processes' && !selectedProcess && (
            <>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input type="text" placeholder="Search processes..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 text-sm focus:ring-2 focus:ring-orange-500" />
                </div>
                <select value={critFilter} onChange={e => setCritFilter(e.target.value as Criticality | 'all')}
                  className="px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 text-sm">
                  <option value="all">All Criticality</option>
                  <option value="Critical">Critical</option><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option>
                </select>
              </div>

              {filtered.length === 0 ? (
                <div className="text-center py-16">
                  <Building className="w-10 h-10 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
                  <p className="text-sm text-surface-500 dark:text-surface-400">No processes found</p>
                  <button onClick={openCreate} className="mt-3 text-sm text-orange-600 dark:text-orange-400 hover:underline">Add your first process</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map(proc => (
                    <div key={proc.id} onClick={() => setSelectedProcess(proc)}
                      className="bg-surface-50 dark:bg-surface-700/30 rounded-xl border border-surface-200 dark:border-surface-700 p-4 hover:border-surface-300 dark:hover:border-surface-600 cursor-pointer transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-surface-500">{proc.id}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${CRIT_CONFIG[proc.criticality].bg} ${CRIT_CONFIG[proc.criticality].color} ${CRIT_CONFIG[proc.criticality].border}`}>{proc.criticality}</span>
                          </div>
                          <h3 className="text-sm font-medium text-surface-900 dark:text-surface-100">{proc.name}</h3>
                          <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5 line-clamp-1">{proc.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-surface-500 dark:text-surface-400">
                            <span>RTO: {proc.rtoHours}h</span>
                            <span>RPO: {proc.rpoHours}h</span>
                            <span>MTPD: {proc.mtpdHours}h</span>
                            <span>{proc.department}</span>
                            <span>{proc.owner}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={e => { e.stopPropagation(); openEdit(proc); }} className="p-1.5 text-surface-400 hover:text-blue-600 dark:hover:text-blue-400"><Edit className="w-4 h-4" /></button>
                          <button onClick={e => { e.stopPropagation(); deleteProcess(proc.id); }} className="p-1.5 text-surface-400 hover:text-red-600 dark:hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                          <ChevronRight className="w-4 h-4 text-surface-400" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Process Detail ───────────────────────────────── */}
          {activeTab === 'processes' && selectedProcess && (
            <div className="space-y-6">
              <button onClick={() => setSelectedProcess(null)} className="flex items-center gap-2 text-sm text-surface-500 hover:text-surface-700 dark:hover:text-surface-300">
                <ChevronLeft className="w-4 h-4" /> Back to list
              </button>
              <div className="bg-surface-50 dark:bg-surface-700/30 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${CRIT_CONFIG[selectedProcess.criticality].bg} ${CRIT_CONFIG[selectedProcess.criticality].color} ${CRIT_CONFIG[selectedProcess.criticality].border}`}>{selectedProcess.criticality}</span>
                  <span className="text-xs text-surface-500 font-mono">{selectedProcess.id}</span>
                </div>
                <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100 mb-1">{selectedProcess.name}</h2>
                <p className="text-sm text-surface-500 dark:text-surface-400">{selectedProcess.description}</p>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 mb-6">
                  {[
                    { label: 'RTO', value: `${selectedProcess.rtoHours}h`, sub: 'Recovery Time Objective', color: 'text-blue-600 dark:text-blue-400' },
                    { label: 'RPO', value: `${selectedProcess.rpoHours}h`, sub: 'Recovery Point Objective', color: 'text-green-600 dark:text-green-400' },
                    { label: 'MTPD', value: `${selectedProcess.mtpdHours}h`, sub: 'Max Tolerable Downtime', color: 'text-orange-600 dark:text-orange-400' },
                    { label: 'Staff', value: String(selectedProcess.staffRequired), sub: 'Minimum Personnel', color: 'text-purple-600 dark:text-purple-400' },
                  ].map(item => (
                    <div key={item.label} className="p-3 bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 text-center">
                      <div className="text-xs text-surface-500 dark:text-surface-400">{item.label}</div>
                      <div className={`text-xl font-bold ${item.color}`}>{item.value}</div>
                      <div className="text-[10px] text-surface-500 dark:text-surface-400">{item.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Impact Matrix */}
                <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-3">Impact Over Time</h3>
                <div className="overflow-x-auto mb-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-200 dark:border-surface-700">
                        <th className="text-left py-2 px-3 text-surface-500 dark:text-surface-400 font-medium">Dimension</th>
                        {['1 Hour', '4 Hours', '24 Hours', '72 Hours', '1 Week'].map(h => (
                          <th key={h} className="text-center py-2 px-3 text-surface-500 dark:text-surface-400 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedProcess.impactScores || []).map(impact => (
                        <tr key={impact.dimension} className="border-b border-surface-100 dark:border-surface-700/50">
                          <td className="py-2 px-3 flex items-center gap-2">
                            <span className={DIM_CONFIG[impact.dimension].color}>{DIM_CONFIG[impact.dimension].icon}</span>
                            <span className="text-surface-900 dark:text-surface-100">{DIM_CONFIG[impact.dimension].label}</span>
                          </td>
                          {[impact.score1h, impact.score4h, impact.score24h, impact.score72h, impact.score1w].map((score, idx) => (
                            <td key={idx} className="py-2 px-3 text-center">
                              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold ${scoreColor(score)}`}>{score}</span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-2">Dependencies ({(selectedProcess.dependencies || []).length})</h3>
                    {(!selectedProcess.dependencies || selectedProcess.dependencies.length === 0) ? (
                      <p className="text-sm text-surface-500">No dependencies recorded</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedProcess.dependencies.map(dep => (
                          <div key={dep.processId} className="flex items-center justify-between p-3 bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700">
                            <div className="flex items-center gap-2"><Link2 className="w-4 h-4 text-surface-400" /><span className="text-sm text-surface-900 dark:text-surface-100">{dep.processName}</span></div>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${dep.type === 'upstream' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'}`}>{dep.type}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-2">Additional Details</h3>
                    <div className="space-y-2 text-sm">
                      {[
                        { label: 'Owner', value: selectedProcess.owner },
                        { label: 'Department', value: selectedProcess.department },
                        { label: 'Alternate Process', value: selectedProcess.alternateProcess || 'None' },
                        { label: 'Peak Periods', value: (selectedProcess.peakPeriods || []).join(', ') || 'None' },
                        { label: 'Last Reviewed', value: selectedProcess.lastReviewed ? new Date(selectedProcess.lastReviewed).toLocaleDateString() : 'Never' },
                      ].map(item => (
                        <div key={item.label} className="flex justify-between p-2 bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700">
                          <span className="text-surface-500 dark:text-surface-400">{item.label}</span>
                          <span className="text-surface-900 dark:text-surface-100 text-right max-w-[200px]">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 justify-end">
                  <button onClick={() => openEdit(selectedProcess)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
                    <Edit className="w-4 h-4" /> Edit Process
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Impact Analysis Tab ──────────────────────────── */}
          {activeTab === 'impact' && (
            <div className="bg-surface-50 dark:bg-surface-700/30 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
              <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-4">Impact Heatmap (24h Impact Score)</h3>
              {processes.length === 0 ? (
                <p className="text-center text-sm text-surface-500 py-8">No processes to display</p>
              ) : (
                <div className="space-y-2">
                  {[...processes].sort((a, b) => {
                    const maxA = Math.max(...(a.impactScores || []).map(s => s.score24h), 0);
                    const maxB = Math.max(...(b.impactScores || []).map(s => s.score24h), 0);
                    return maxB - maxA;
                  }).map(proc => (
                    <div key={proc.id} className="flex items-center gap-3 p-3 bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700">
                      <div className="w-48 flex-shrink-0">
                        <span className="text-sm font-medium text-surface-900 dark:text-surface-100">{proc.name}</span>
                        <div className="text-xs text-surface-500 dark:text-surface-400">{proc.department}</div>
                      </div>
                      <div className="flex-1 flex gap-2">
                        {(proc.impactScores || []).map(impact => (
                          <div key={impact.dimension} className="flex-1 text-center">
                            <div className="text-[10px] text-surface-500 mb-0.5">{DIM_CONFIG[impact.dimension].label}</div>
                            <div className={`h-6 rounded flex items-center justify-center text-xs font-bold ${scoreColor(impact.score24h)}`}>{impact.score24h}</div>
                          </div>
                        ))}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${CRIT_CONFIG[proc.criticality].bg} ${CRIT_CONFIG[proc.criticality].color} ${CRIT_CONFIG[proc.criticality].border}`}>{proc.criticality}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Dependencies Tab ─────────────────────────────── */}
          {activeTab === 'dependencies' && (
            <div className="bg-surface-50 dark:bg-surface-700/30 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
              <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-4">Process Dependency Map</h3>
              {processes.filter(p => (p.dependencies || []).length > 0).length === 0 ? (
                <p className="text-center text-sm text-surface-500 py-8">No dependencies recorded yet</p>
              ) : (
                <div className="space-y-4">
                  {processes.filter(p => (p.dependencies || []).length > 0).map(proc => (
                    <div key={proc.id} className="p-4 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${CRIT_CONFIG[proc.criticality].bg} ${CRIT_CONFIG[proc.criticality].color} ${CRIT_CONFIG[proc.criticality].border}`}>{proc.criticality}</span>
                        <span className="text-sm font-medium text-surface-900 dark:text-surface-100">{proc.name}</span>
                        <span className="text-xs text-surface-500">RTO: {proc.rtoHours}h</span>
                      </div>
                      <div className="ml-6 space-y-1.5">
                        {proc.dependencies.map(dep => (
                          <div key={dep.processId} className="flex items-center gap-2 text-sm">
                            <span className={`text-xs px-1.5 py-0.5 rounded ${dep.type === 'upstream' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'}`}>{dep.type}</span>
                            <span className="text-surface-700 dark:text-surface-300">{dep.processName}</span>
                            <span className="text-xs text-surface-500 font-mono">{dep.processId}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Prioritization Tab ───────────────────────────── */}
          {activeTab === 'prioritization' && (
            <div className="bg-surface-50 dark:bg-surface-700/30 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
              <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-4">Process Prioritization (by Criticality and RTO)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-200 dark:border-surface-700">
                      <th className="text-left py-2 px-3 text-surface-500 font-medium">#</th>
                      <th className="text-left py-2 px-3 text-surface-500 font-medium">Process</th>
                      <th className="text-left py-2 px-3 text-surface-500 font-medium">Department</th>
                      <th className="text-center py-2 px-3 text-surface-500 font-medium">Criticality</th>
                      <th className="text-center py-2 px-3 text-surface-500 font-medium">RTO</th>
                      <th className="text-center py-2 px-3 text-surface-500 font-medium">RPO</th>
                      <th className="text-center py-2 px-3 text-surface-500 font-medium">MTPD</th>
                      <th className="text-center py-2 px-3 text-surface-500 font-medium">Peak Impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...processes].sort((a, b) => {
                      const crit = CRIT_CONFIG[b.criticality].priority - CRIT_CONFIG[a.criticality].priority;
                      if (crit !== 0) return crit;
                      return a.rtoHours - b.rtoHours;
                    }).map((proc, idx) => {
                      const maxImpact = Math.max(...(proc.impactScores || []).map(s => s.score24h), 0);
                      return (
                        <tr key={proc.id} className="border-b border-surface-100 dark:border-surface-700/50 hover:bg-white dark:hover:bg-surface-800 cursor-pointer" onClick={() => { setActiveTab('processes'); setSelectedProcess(proc); }}>
                          <td className="py-2 px-3 text-surface-400">{idx + 1}</td>
                          <td className="py-2 px-3 font-medium text-surface-900 dark:text-surface-100">{proc.name}</td>
                          <td className="py-2 px-3 text-surface-600 dark:text-surface-400">{proc.department}</td>
                          <td className="py-2 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${CRIT_CONFIG[proc.criticality].bg} ${CRIT_CONFIG[proc.criticality].color} ${CRIT_CONFIG[proc.criticality].border}`}>{proc.criticality}</span>
                          </td>
                          <td className="py-2 px-3 text-center text-surface-900 dark:text-surface-100">{proc.rtoHours}h</td>
                          <td className="py-2 px-3 text-center text-surface-900 dark:text-surface-100">{proc.rpoHours}h</td>
                          <td className="py-2 px-3 text-center text-surface-900 dark:text-surface-100">{proc.mtpdHours}h</td>
                          <td className="py-2 px-3 text-center">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold ${scoreColor(maxImpact)}`}>{maxImpact}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Create/Edit Modal ────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-surface-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-700">
              <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">{editingProcess ? 'Edit Process' : 'Add Business Process'}</h2>
              <button onClick={() => { setShowModal(false); setEditingProcess(null); setForm(emptyForm); }} className="p-1 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-2">
                <button onClick={() => setImpactStep(0)} className={`px-3 py-1 rounded-lg text-xs font-medium ${impactStep === 0 ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300' : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700'}`}>1. Details</button>
                <ChevronRight className="w-3 h-3 text-surface-400" />
                <button onClick={() => setImpactStep(1)} className={`px-3 py-1 rounded-lg text-xs font-medium ${impactStep === 1 ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300' : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700'}`}>2. Impact Scoring</button>
              </div>

              {impactStep === 0 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Process Name <span className="text-red-500">*</span></label>
                    <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g., Customer Data Processing"
                      className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 text-sm focus:ring-2 focus:ring-orange-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Description</label>
                    <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2}
                      className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 text-sm resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Owner</label>
                      <input type="text" value={form.owner} onChange={e => setForm(p => ({ ...p, owner: e.target.value }))}
                        className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Department</label>
                      <select value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                        className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 text-sm">
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Criticality</label>
                      <select value={form.criticality} onChange={e => setForm(p => ({ ...p, criticality: e.target.value as Criticality }))}
                        className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 text-sm">
                        <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Staff Required</label>
                      <input type="number" value={form.staffRequired} onChange={e => setForm(p => ({ ...p, staffRequired: e.target.value }))}
                        className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">RTO (hours)</label>
                      <input type="number" step="0.5" value={form.rtoHours} onChange={e => setForm(p => ({ ...p, rtoHours: e.target.value }))} placeholder="4"
                        className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">RPO (hours)</label>
                      <input type="number" step="0.25" value={form.rpoHours} onChange={e => setForm(p => ({ ...p, rpoHours: e.target.value }))} placeholder="1"
                        className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">MTPD (hours)</label>
                      <input type="number" value={form.mtpdHours} onChange={e => setForm(p => ({ ...p, mtpdHours: e.target.value }))} placeholder="24"
                        className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Alternate Process</label>
                    <input type="text" value={form.alternateProcess} onChange={e => setForm(p => ({ ...p, alternateProcess: e.target.value }))} placeholder="Workaround if process fails"
                      className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Peak Periods (comma-separated)</label>
                    <input type="text" value={form.peakPeriods} onChange={e => setForm(p => ({ ...p, peakPeriods: e.target.value }))} placeholder="e.g., End of Month, Quarter Close"
                      className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 text-sm" />
                  </div>
                </>
              )}

              {impactStep === 1 && (
                <div>
                  <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-3">Impact Scoring (0-10 scale)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-surface-200 dark:border-surface-700">
                          <th className="text-left py-2 px-2 text-surface-500 font-medium">Dimension</th>
                          {['1h', '4h', '24h', '72h', '1w'].map(h => <th key={h} className="text-center py-2 px-2 text-surface-500 font-medium">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {form.impactScores.map((impact, dimIdx) => (
                          <tr key={impact.dimension} className="border-b border-surface-100 dark:border-surface-700/50">
                            <td className="py-2 px-2 flex items-center gap-2">
                              <span className={DIM_CONFIG[impact.dimension].color}>{DIM_CONFIG[impact.dimension].icon}</span>
                              <span className="text-surface-900 dark:text-surface-100">{DIM_CONFIG[impact.dimension].label}</span>
                            </td>
                            {(['score1h', 'score4h', 'score24h', 'score72h', 'score1w'] as (keyof ImpactScore)[]).map(field => (
                              <td key={field} className="py-2 px-2 text-center">
                                <input type="number" min={0} max={10} value={impact[field] as number}
                                  onChange={e => updateImpactScore(dimIdx, field, parseInt(e.target.value) || 0)}
                                  className="w-14 px-2 py-1 text-center border border-surface-300 dark:border-surface-600 rounded bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 text-sm" />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-surface-200 dark:border-surface-700 flex items-center justify-between">
              <div>
                {impactStep === 1 && (
                  <button onClick={() => setImpactStep(0)} className="px-4 py-2 text-sm text-surface-600 dark:text-surface-400 hover:text-surface-800 flex items-center gap-1">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => { setShowModal(false); setEditingProcess(null); setForm(emptyForm); }}
                  className="px-4 py-2 text-sm text-surface-600 dark:text-surface-400">Cancel</button>
                {impactStep === 0 ? (
                  <button onClick={() => setImpactStep(1)} disabled={!form.name.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 disabled:cursor-not-allowed rounded-lg flex items-center gap-1">
                    Next: Impact Scoring <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button onClick={saveProcess} disabled={saving || !form.name.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 disabled:cursor-not-allowed rounded-lg">
                    {saving ? 'Saving...' : editingProcess ? 'Update Process' : 'Create Process'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessImpactAnalysis;
