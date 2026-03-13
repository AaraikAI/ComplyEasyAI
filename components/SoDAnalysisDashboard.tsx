/**
 * Separation of Duties (SoD) Analysis Dashboard
 * Conflict rule management, violation detection, matrix visualization,
 * and compensating controls for ERP/financial system access governance
 */
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { api } from '../services/api';
import {
  ArrowLeft, Shield, AlertTriangle, CheckCircle, Search, Plus, X,
  Eye, Filter, BarChart3, Grid3X3, ShieldCheck, ShieldAlert, Users,
  Calendar, TrendingUp, XCircle, Edit3, Download, Lock, Activity, RefreshCw
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────
type TabKey = 'overview' | 'rules' | 'violations' | 'matrix' | 'controls';
type RiskLevel = 'High' | 'Medium' | 'Low';
type RuleStatus = 'Active' | 'Inactive';
type ViolationStatus = 'Open' | 'Mitigated' | 'Accepted' | 'Remediated';
type ControlType = 'Monitoring' | 'Approval Workflow' | 'Periodic Review' | 'System Restriction' | 'Reconciliation';
type ControlEffectiveness = 'Effective' | 'Partially Effective' | 'Ineffective';
type ERPSystem = 'SAP ECC' | 'SAP S/4HANA' | 'Oracle EBS' | 'Workday';

interface SoDRule {
  id: string; ruleId: string; name: string;
  functionA: string; functionB: string;
  system: ERPSystem; riskLevel: RiskLevel; status: RuleStatus;
  description: string; category: string;
}

interface SoDViolation {
  id: string; violationId: string; ruleId: string; ruleName: string;
  userId: string; userName: string; functionA: string; functionB: string;
  riskLevel: RiskLevel; status: ViolationStatus;
  detectedDate: string; resolvedDate: string | null;
  system: ERPSystem; department: string;
}

interface CompensatingControl {
  id: string; name: string; violationId: string; violationDesc: string;
  controlType: ControlType; effectiveness: ControlEffectiveness;
  reviewDate: string; owner: string; description: string; nextReviewDate: string;
}

interface MatrixFunction {
  id: string; name: string; system: ERPSystem; category: string;
}

// Mock data constants removed — component now uses empty initial state with proper error handling.

const MATRIX_FUNCTIONS: MatrixFunction[] = [
  { id: 'f1', name: 'Create Purchase Order', system: 'SAP ECC', category: 'Procure-to-Pay' },
  { id: 'f2', name: 'Approve Purchase Order', system: 'SAP ECC', category: 'Procure-to-Pay' },
  { id: 'f3', name: 'Receive Goods', system: 'SAP ECC', category: 'Procure-to-Pay' },
  { id: 'f4', name: 'Enter Vendor Invoice', system: 'SAP ECC', category: 'Procure-to-Pay' },
  { id: 'f5', name: 'Execute Payment Run', system: 'SAP ECC', category: 'Procure-to-Pay' },
  { id: 'f6', name: 'Maintain Vendor Master', system: 'SAP ECC', category: 'Procure-to-Pay' },
  { id: 'f7', name: 'Create Journal Entry', system: 'SAP S/4HANA', category: 'Financial Close' },
  { id: 'f8', name: 'Approve Journal Entry', system: 'SAP S/4HANA', category: 'Financial Close' },
  { id: 'f9', name: 'Maintain GL Accounts', system: 'SAP S/4HANA', category: 'Financial Close' },
  { id: 'f10', name: 'Create Sales Order', system: 'Oracle EBS', category: 'Order-to-Cash' },
  { id: 'f11', name: 'Generate Billing Document', system: 'Oracle EBS', category: 'Order-to-Cash' },
  { id: 'f12', name: 'Maintain Customer Master', system: 'SAP ECC', category: 'Order-to-Cash' },
  { id: 'f13', name: 'Issue Credit Memo', system: 'SAP ECC', category: 'Order-to-Cash' },
];

// ── Component ──────────────────────────────────────────────────────────
export const SoDAnalysisDashboard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [systemFilter, setSystemFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateRule, setShowCreateRule] = useState(false);
  const [selectedViolation, setSelectedViolation] = useState<SoDViolation | null>(null);
  const [matrixSystemFilter, setMatrixSystemFilter] = useState<string>('all');
  const [rules, setRules] = useState<SoDRule[]>([]);
  const [violations, setViolations] = useState<SoDViolation[]>([]);
  const [compensatingControls, setCompensatingControls] = useState<CompensatingControl[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Rule form state
  const [ruleForm, setRuleForm] = useState({
    name: '', functionA: '', functionB: '', system: 'SAP ECC' as ERPSystem,
    riskLevel: 'Medium' as RiskLevel, description: '', category: 'Procure-to-Pay',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [rulesRes, violationsRes, dashboardRes, matrixRes] = await Promise.allSettled([
        api.sod.listRules(),
        api.sod.listViolations(),
        api.sod.getDashboard(),
        api.sod.getMatrix(),
      ]);

      const failures: string[] = [];

      if (rulesRes.status === 'fulfilled') {
        const data = rulesRes.value;
        if (Array.isArray(data)) setRules(data);
        else if (data?.data) setRules(data.data);
        else if (data?.rules) setRules(data.rules);
      } else {
        failures.push('rules');
      }
      if (violationsRes.status === 'fulfilled') {
        const data = violationsRes.value;
        if (Array.isArray(data)) setViolations(data);
        else if (data?.data) setViolations(data.data);
        else if (data?.violations) setViolations(data.violations);
      } else {
        failures.push('violations');
      }
      if (dashboardRes.status === 'fulfilled' && dashboardRes.value?.compensatingControls) {
        setCompensatingControls(dashboardRes.value.compensatingControls);
      } else if (dashboardRes.status === 'rejected') {
        failures.push('dashboard');
      }
      if (matrixRes.status === 'rejected') {
        failures.push('matrix');
      }

      if (failures.length > 0) {
        setLoadError(`Failed to load ${failures.join(', ')} data. Some information may be incomplete.`);
      }
    } catch (err) {
      setLoadError('Failed to connect to the server. Please check your connection and try again.');
      console.error('SoDAnalysisDashboard data load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Derived metrics
  const activeRules = rules.filter(r => r.status === 'Active').length;
  const openViolations = violations.filter(v => v.status === 'Open').length;
  const mitigatedViolations = violations.filter(v => v.status === 'Mitigated').length;
  const highRiskOpen = violations.filter(v => v.status === 'Open' && v.riskLevel === 'High').length;
  const riskScore = Math.min(100, Math.round((openViolations / Math.max(violations.length, 1)) * 100 + highRiskOpen * 10));

  const filteredRules = useMemo(() => {
    return rules.filter(r => {
      if (riskFilter !== 'all' && r.riskLevel !== riskFilter) return false;
      if (systemFilter !== 'all' && r.system !== systemFilter) return false;
      if (searchQuery && !r.ruleId.toLowerCase().includes(searchQuery.toLowerCase()) && !r.name.toLowerCase().includes(searchQuery.toLowerCase()) && !r.functionA.toLowerCase().includes(searchQuery.toLowerCase()) && !r.functionB.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [rules, riskFilter, systemFilter, searchQuery]);

  const filteredViolations = useMemo(() => {
    return violations.filter(v => {
      if (statusFilter !== 'all' && v.status !== statusFilter) return false;
      if (riskFilter !== 'all' && v.riskLevel !== riskFilter) return false;
      if (searchQuery && !v.violationId.toLowerCase().includes(searchQuery.toLowerCase()) && !v.userName.toLowerCase().includes(searchQuery.toLowerCase()) && !v.ruleName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [violations, statusFilter, riskFilter, searchQuery]);

  const filteredMatrixFunctions = useMemo(() => {
    if (matrixSystemFilter === 'all') return MATRIX_FUNCTIONS;
    return MATRIX_FUNCTIONS.filter(f => f.system === matrixSystemFilter);
  }, [matrixSystemFilter]);

  // Conflict lookup: key = "functionA|functionB" => RiskLevel
  const conflictMap = useMemo(() => {
    const map: Record<string, RiskLevel> = {};
    rules.filter(r => r.status === 'Active').forEach(r => {
      map[`${r.functionA}|${r.functionB}`] = r.riskLevel;
      map[`${r.functionB}|${r.functionA}`] = r.riskLevel;
    });
    return map;
  }, [rules]);

  const riskBg = (r: RiskLevel) => r === 'High' ? 'bg-red-500/20 text-red-400' : r === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400';
  const statusBg = (s: ViolationStatus) => s === 'Open' ? 'bg-red-500/20 text-red-400' : s === 'Mitigated' ? 'bg-blue-500/20 text-blue-400' : s === 'Accepted' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400';
  const ruleStatusBg = (s: RuleStatus) => s === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400';
  const effectivenessBg = (e: ControlEffectiveness) => e === 'Effective' ? 'bg-emerald-500/20 text-emerald-400' : e === 'Partially Effective' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400';
  const conflictCellColor = (risk: RiskLevel | null) => risk === 'High' ? 'bg-red-500/40 border-red-500/60' : risk === 'Medium' ? 'bg-amber-500/40 border-amber-500/60' : 'bg-slate-700/30 border-slate-700';

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <BarChart3 size={15} /> },
    { key: 'rules', label: 'Rules', icon: <ShieldAlert size={15} /> },
    { key: 'violations', label: 'Violations', icon: <AlertTriangle size={15} /> },
    { key: 'matrix', label: 'Matrix', icon: <Grid3X3 size={15} /> },
    { key: 'controls', label: 'Compensating Controls', icon: <ShieldCheck size={15} /> },
  ];

  // ── Error Banner ─────────────────────────────────────────────────────
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

  // ── Overview Tab ──────────────────────────────────────────────────────
  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-800 rounded-lg p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-400">Risk Score</span>
            <Activity size={18} className="text-red-400" />
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-14 h-14">
              <svg viewBox="0 0 36 36" className="w-14 h-14 transform -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#334155" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke={riskScore <= 30 ? '#10b981' : riskScore <= 60 ? '#f59e0b' : '#ef4444'} strokeWidth="3" strokeDasharray={`${riskScore} ${100 - riskScore}`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">{riskScore}</span>
            </div>
            <div><div className="text-2xl font-bold text-white">{riskScore}/100</div><div className="text-xs text-slate-400">Overall Risk</div></div>
          </div>
        </div>
        {[
          { label: 'Total Rules', value: rules.length, icon: Shield, color: 'text-blue-400' },
          { label: 'Active Violations', value: openViolations, icon: AlertTriangle, color: 'text-red-400' },
          { label: 'Mitigated', value: mitigatedViolations, icon: CheckCircle, color: 'text-emerald-400' },
          { label: 'High Risk Open', value: highRiskOpen, icon: XCircle, color: 'text-orange-400' },
        ].map(m => (
          <div key={m.label} className="bg-slate-800 rounded-lg p-5 border border-slate-700">
            <div className="flex items-center justify-between mb-2"><span className="text-sm text-slate-400">{m.label}</span><m.icon size={18} className={m.color} /></div>
            <div className="text-2xl font-bold text-white">{m.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-lg p-5 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Violations by Status</h3>
          <div className="space-y-3">
            {[
              { label: 'Open', count: violations.filter(v => v.status === 'Open').length, color: 'bg-red-500' },
              { label: 'Mitigated', count: violations.filter(v => v.status === 'Mitigated').length, color: 'bg-blue-500' },
              { label: 'Accepted', count: violations.filter(v => v.status === 'Accepted').length, color: 'bg-amber-500' },
              { label: 'Remediated', count: violations.filter(v => v.status === 'Remediated').length, color: 'bg-emerald-500' },
            ].map(item => {
              const pct = violations.length > 0 ? Math.round((item.count / violations.length) * 100) : 0;
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1"><span className="text-slate-300">{item.label}</span><span className="text-white font-medium">{item.count} ({pct}%)</span></div>
                  <div className="h-2 bg-slate-700 rounded-full"><div className={`h-2 ${item.color} rounded-full transition-all`} style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-5 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Violations</h3>
          <div className="space-y-3">
            {violations.slice(0, 5).map(v => (
              <div key={v.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-white">{v.userName}</div>
                  <div className="text-xs text-slate-400">{v.ruleName} &middot; {v.detectedDate}</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBg(v.status)}`}>{v.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-5 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Violations by Department</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from(new Set(violations.map(v => v.department))).map(dept => {
            const deptViolations = violations.filter(v => v.department === dept);
            const deptOpen = deptViolations.filter(v => v.status === 'Open').length;
            return (
              <div key={dept} className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                <Users size={16} className="text-blue-400 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm text-white">{dept}</div>
                  <div className="text-xs text-slate-400">{deptViolations.length} violations ({deptOpen} open)</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs ${deptOpen > 0 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{deptOpen > 0 ? 'Action Needed' : 'Clear'}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ── Rules Tab ─────────────────────────────────────────────────────────
  const renderRules = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder={t('common.search')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
        </div>
        <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)} className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm">
          <option value="all">All Risk Levels</option>
          {['High', 'Medium', 'Low'].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={systemFilter} onChange={e => setSystemFilter(e.target.value)} className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm">
          <option value="all">All Systems</option>
          {['SAP ECC', 'SAP S/4HANA', 'Oracle EBS', 'Workday'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={() => setShowCreateRule(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"><Plus size={16} /> Add Rule</button>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-700">
            {['Rule ID', 'Name', 'Function A', 'Function B', 'System', 'Risk', 'Status', 'Category', 'Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-slate-400 font-medium">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filteredRules.map(r => (
              <tr key={r.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                <td className="px-4 py-3 text-blue-400 font-mono text-xs">{r.ruleId}</td>
                <td className="px-4 py-3 text-white">{r.name}</td>
                <td className="px-4 py-3 text-slate-300 text-xs">{r.functionA}</td>
                <td className="px-4 py-3 text-slate-300 text-xs">{r.functionB}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs">{r.system}</span></td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${riskBg(r.riskLevel)}`}>{r.riskLevel}</span></td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${ruleStatusBg(r.status)}`}>{r.status}</span></td>
                <td className="px-4 py-3 text-slate-400 text-xs">{r.category}</td>
                <td className="px-4 py-3"><div className="flex gap-1">
                  <button className="p-1 hover:bg-slate-600 rounded"><Eye size={14} className="text-slate-400" /></button>
                  <button className="p-1 hover:bg-slate-600 rounded"><Edit3 size={14} className="text-slate-400" /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-sm text-slate-400">{filteredRules.length} of {rules.length} rules shown</div>
    </div>
  );

  // ── Violations Tab ────────────────────────────────────────────────────
  const renderViolations = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder={t('common.search')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm">
          <option value="all">All Statuses</option>
          {['Open', 'Mitigated', 'Accepted', 'Remediated'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)} className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm">
          <option value="all">All Risk Levels</option>
          {['High', 'Medium', 'Low'].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="flex gap-4 mb-2">
        {['Open', 'Mitigated', 'Accepted', 'Remediated'].map(s => {
          const count = violations.filter(v => v.status === s).length;
          return (
            <div key={s} className="bg-slate-800 rounded-lg px-4 py-2 border border-slate-700">
              <span className="text-xs text-slate-400">{s}</span>
              <div className={`text-xl font-bold ${s === 'Open' ? 'text-red-400' : s === 'Mitigated' ? 'text-blue-400' : s === 'Accepted' ? 'text-amber-400' : 'text-emerald-400'}`}>{count}</div>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-700">
            {['Violation ID', 'Rule Violated', 'User', 'Functions', 'System', 'Risk', 'Status', 'Detected', 'Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-slate-400 font-medium">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filteredViolations.map(v => (
              <tr key={v.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                <td className="px-4 py-3 text-blue-400 font-mono text-xs">{v.violationId}</td>
                <td className="px-4 py-3 text-white text-xs">{v.ruleName}</td>
                <td className="px-4 py-3"><div className="text-white text-xs">{v.userName}</div><div className="text-slate-500 text-xs">{v.userId} &middot; {v.department}</div></td>
                <td className="px-4 py-3"><div className="text-slate-300 text-xs">{v.functionA}</div><div className="text-slate-500 text-xs">vs. {v.functionB}</div></td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs">{v.system}</span></td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${riskBg(v.riskLevel)}`}>{v.riskLevel}</span></td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBg(v.status)}`}>{v.status}</span></td>
                <td className="px-4 py-3 text-slate-400 text-xs">{v.detectedDate}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => setSelectedViolation(v)} className="p-1 hover:bg-slate-600 rounded" title="View Details"><Eye size={14} className="text-slate-400" /></button>
                    {v.status === 'Open' && (
                      <>
                        <button onClick={async () => { try { await api.sod.mitigateViolation(v.id, { action: 'mitigate' }); loadData(); } catch {} }} className="p-1 hover:bg-slate-600 rounded" title="Mitigate"><ShieldCheck size={14} className="text-blue-400" /></button>
                        <button onClick={async () => { try { await api.sod.acceptViolation(v.id, { action: 'accept' }); loadData(); } catch {} }} className="p-1 hover:bg-slate-600 rounded" title="Accept Risk"><CheckCircle size={14} className="text-amber-400" /></button>
                        <button onClick={async () => { try { await api.sod.mitigateViolation(v.id, { action: 'remediate' }); loadData(); } catch {} }} className="p-1 hover:bg-slate-600 rounded" title="Remediate"><Lock size={14} className="text-emerald-400" /></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-sm text-slate-400">{filteredViolations.length} of {violations.length} violations shown</div>
    </div>
  );

  // ── Matrix Tab ────────────────────────────────────────────────────────
  const renderMatrix = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">SoD Conflict Matrix</h3>
          <p className="text-sm text-slate-400">Visual representation of function-level conflicts</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={matrixSystemFilter} onChange={e => setMatrixSystemFilter(e.target.value)} className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm">
            <option value="all">All Systems</option>
            {['SAP ECC', 'SAP S/4HANA', 'Oracle EBS', 'Workday'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500/60 inline-block" /> High</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500/60 inline-block" /> Medium</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-700 inline-block" /> No Conflict</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-x-auto p-4">
        <div className="min-w-[700px]">
          <div className="flex">
            <div className="w-40 flex-shrink-0" />
            {filteredMatrixFunctions.map(f => (
              <div key={f.id} className="flex-1 min-w-[56px] px-1">
                <div className="text-xs text-slate-400 transform -rotate-45 origin-bottom-left whitespace-nowrap h-24 flex items-end pb-1">{f.name.length > 18 ? f.name.slice(0, 18) + '...' : f.name}</div>
              </div>
            ))}
          </div>
          {filteredMatrixFunctions.map(rowFn => (
            <div key={rowFn.id} className="flex items-center">
              <div className="w-40 flex-shrink-0 text-xs text-slate-300 pr-2 py-1 truncate" title={rowFn.name}>{rowFn.name}</div>
              {filteredMatrixFunctions.map(colFn => {
                const isSame = rowFn.id === colFn.id;
                const conflict = isSame ? null : (conflictMap[`${rowFn.name}|${colFn.name}`] || null);
                return (
                  <div key={colFn.id} className="flex-1 min-w-[56px] px-1 py-1">
                    <div
                      className={`h-8 rounded border text-xs flex items-center justify-center font-medium ${isSame ? 'bg-slate-600/30 border-slate-600' : conflictCellColor(conflict)}`}
                      title={isSame ? rowFn.name : conflict ? `${conflict} Risk: ${rowFn.name} vs ${colFn.name}` : 'No conflict'}
                    >
                      {isSame ? <span className="text-slate-500">&mdash;</span> : conflict ? (
                        <span className={conflict === 'High' ? 'text-red-300' : 'text-amber-300'}>{conflict[0]}</span>
                      ) : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-5 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-3">Conflict Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'High Risk Conflicts', count: rules.filter(r => r.status === 'Active' && r.riskLevel === 'High').length, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' },
            { label: 'Medium Risk Conflicts', count: rules.filter(r => r.status === 'Active' && r.riskLevel === 'Medium').length, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
            { label: 'Covered by Controls', count: compensatingControls.filter(c => c.effectiveness === 'Effective').length, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
          ].map(m => (
            <div key={m.label} className={`rounded-lg p-4 border ${m.bg}`}>
              <div className="text-sm text-slate-400">{m.label}</div>
              <div className={`text-3xl font-bold ${m.color}`}>{m.count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Compensating Controls Tab ──────────────────────────────────────────
  const renderCompensatingControls = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          {['Effective', 'Partially Effective', 'Ineffective'].map(e => {
            const count = compensatingControls.filter(c => c.effectiveness === e).length;
            return (
              <div key={e} className="bg-slate-800 rounded-lg px-4 py-2 border border-slate-700">
                <span className="text-xs text-slate-400">{e}</span>
                <div className={`text-xl font-bold ${e === 'Effective' ? 'text-emerald-400' : e === 'Partially Effective' ? 'text-amber-400' : 'text-red-400'}`}>{count}</div>
              </div>
            );
          })}
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"><Download size={16} /> {t('common.export')}</button>
      </div>

      <div className="space-y-3">
        {compensatingControls.map(cc => (
          <div key={cc.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-slate-600">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <ShieldCheck size={16} className="text-blue-400" />
                <span className="text-white font-medium">{cc.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${effectivenessBg(cc.effectiveness)}`}>{cc.effectiveness}</span>
                <span className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs">{cc.controlType}</span>
              </div>
            </div>
            <div className="text-sm text-slate-400 mb-3">{cc.description}</div>
            <div className="flex items-center gap-6 text-xs text-slate-500">
              <span>Violation: {cc.violationId}</span>
              <span>Owner: {cc.owner}</span>
              <span className="flex items-center gap-1"><Calendar size={11} /> Last Review: {cc.reviewDate}</span>
              <span className="flex items-center gap-1"><Calendar size={11} /> Next Review: {cc.nextReviewDate}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Modals ────────────────────────────────────────────────────────────
  const renderCreateRuleModal = () => showCreateRule && (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateRule(false)}>
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">Create SoD Rule</h3>
          <button onClick={() => setShowCreateRule(false)} className="p-1 hover:bg-slate-700 rounded"><X size={18} className="text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          {[
            { label: 'Rule ID', placeholder: 'e.g. SOD-011' },
            { label: 'Rule Name', placeholder: 'Descriptive name for this conflict rule' },
          ].map(f => (
            <div key={f.label}><label className="block text-sm text-slate-400 mb-1">{f.label}</label><input type="text" placeholder={f.placeholder} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm" /></div>
          ))}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-slate-400 mb-1">Conflicting Function A</label><input type="text" placeholder="e.g. Create Purchase Order" className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm" /></div>
            <div><label className="block text-sm text-slate-400 mb-1">Conflicting Function B</label><input type="text" placeholder="e.g. Approve Purchase Order" className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'System', options: ['SAP ECC', 'SAP S/4HANA', 'Oracle EBS', 'Workday'] },
              { label: 'Risk Level', options: ['High', 'Medium', 'Low'] },
            ].map(s => (
              <div key={s.label}><label className="block text-sm text-slate-400 mb-1">{s.label}</label><select className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm">{s.options.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
            ))}
          </div>
          <div><label className="block text-sm text-slate-400 mb-1">Description</label><textarea placeholder="Describe why this separation of duties conflict is important..." className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm h-20 resize-none" /></div>
          <div><label className="block text-sm text-slate-400 mb-1">Category</label><select className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm">{['Procure-to-Pay', 'Order-to-Cash', 'Financial Close', 'Basis / Security', 'HR / Payroll'].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-slate-700">
          <button onClick={() => setShowCreateRule(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">{t('common.cancel')}</button>
          <button onClick={async () => {
            try {
              await api.sod.createRule({ ...ruleForm, status: 'Active' });
              setShowCreateRule(false);
              loadData();
            } catch { setShowCreateRule(false); }
          }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Create Rule</button>
        </div>
      </div>
    </div>
  );

  const renderViolationDetailModal = () => selectedViolation && (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedViolation(null)}>
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">{selectedViolation.violationId}: {selectedViolation.ruleName}</h3>
          <button onClick={() => setSelectedViolation(null)} className="p-1 hover:bg-slate-700 rounded"><X size={18} className="text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex gap-2">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${riskBg(selectedViolation.riskLevel)}`}>{selectedViolation.riskLevel} Risk</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBg(selectedViolation.status)}`}>{selectedViolation.status}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ['User', `${selectedViolation.userName} (${selectedViolation.userId})`],
              ['Department', selectedViolation.department],
              ['Function A', selectedViolation.functionA],
              ['Function B', selectedViolation.functionB],
              ['System', selectedViolation.system],
              ['Detected', selectedViolation.detectedDate],
              ['Rule ID', selectedViolation.ruleId],
              ['Resolved', selectedViolation.resolvedDate || 'Pending'],
            ].map(([k, v]) => (
              <div key={k as string}><span className="text-slate-400">{k}: </span><span className="text-white">{v}</span></div>
            ))}
          </div>
          {selectedViolation.status === 'Open' && (
            <div className="flex gap-2 pt-2 border-t border-slate-700">
              <button onClick={async () => {
                try { await api.sod.mitigateViolation(selectedViolation.id, { action: 'mitigate' }); setSelectedViolation(null); loadData(); } catch { /* keep open */ }
              }} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"><ShieldCheck size={14} /> Mitigate</button>
              <button onClick={async () => {
                try { await api.sod.acceptViolation(selectedViolation.id, { action: 'accept' }); setSelectedViolation(null); loadData(); } catch { /* keep open */ }
              }} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700"><CheckCircle size={14} /> Accept Risk</button>
              <button onClick={async () => {
                try { await api.sod.mitigateViolation(selectedViolation.id, { action: 'remediate' }); setSelectedViolation(null); loadData(); } catch { /* keep open */ }
              }} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"><Lock size={14} /> Remediate</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ── Main Render ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-lg"><ArrowLeft size={20} /></button>
          <div><h1 className="text-2xl font-bold">Separation of Duties Analysis</h1><p className="text-sm text-slate-400">SoD Conflict Rules, Violation Detection & Compensating Controls</p></div>
        </div>

        <div className="flex gap-1 mb-6 border-b border-slate-700 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSearchQuery(''); setRiskFilter('all'); setStatusFilter('all'); setSystemFilter('all'); }} className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.key ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white hover:border-slate-600'}`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        {renderErrorBanner()}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'rules' && renderRules()}
        {activeTab === 'violations' && renderViolations()}
        {activeTab === 'matrix' && renderMatrix()}
        {activeTab === 'controls' && renderCompensatingControls()}
      </div>

      {renderCreateRuleModal()}
      {renderViolationDetailModal()}
    </div>
  );
};

export default SoDAnalysisDashboard;
