/**
 * Compliance Cost Dashboard Component
 *
 * Cost analytics with:
 * - Cost entry management
 * - Framework-level breakdown
 * - Category tracking (Tool License, Consultant, Audit Fee, Training, etc.)
 * - Trend charts (bar visualization)
 * - Budget vs actual comparison
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  DollarSign,
  Plus,
  X,
  Search,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Filter,
  Calendar,
  Trash2,
  PieChart,
  ArrowUp,
  ArrowDown,
  Loader2,
} from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';

// ── Types ───────────────────────────────────────────────────────────────────

type CostCategory = 'ToolLicense' | 'Consultant' | 'AuditFee' | 'Training' | 'Personnel' | 'Insurance' | 'Remediation' | 'Other';
type Framework = 'SOC2' | 'ISO27001' | 'GDPR' | 'HIPAA' | 'PCIDSS' | 'General';
type TabId = 'overview' | 'entries' | 'budget';

interface CostEntry {
  id: string;
  description: string;
  amount: number;
  category: CostCategory;
  framework: Framework;
  vendor: string;
  date: string;
  recurring: boolean;
  frequency: 'monthly' | 'quarterly' | 'annual' | 'one-time';
}

interface BudgetLine {
  category: CostCategory;
  budgeted: number;
  actual: number;
}

// ── Constants ───────────────────────────────────────────────────────────────

const categoryLabels: Record<CostCategory, string> = {
  ToolLicense: 'Tool License', Consultant: 'Consultant', AuditFee: 'Audit Fee',
  Training: 'Training', Personnel: 'Personnel', Insurance: 'Insurance',
  Remediation: 'Remediation', Other: 'Other',
};

const categoryColors: Record<CostCategory, string> = {
  ToolLicense: 'bg-blue-500', Consultant: 'bg-purple-500', AuditFee: 'bg-red-500',
  Training: 'bg-green-500', Personnel: 'bg-orange-500', Insurance: 'bg-cyan-500',
  Remediation: 'bg-yellow-500', Other: 'bg-slate-500',
};

const frameworkLabels: Record<Framework, string> = {
  SOC2: 'SOC 2', ISO27001: 'ISO 27001', GDPR: 'GDPR', HIPAA: 'HIPAA', PCIDSS: 'PCI DSS', General: 'General',
};

// ── API Helper ──────────────────────────────────────────────────────────────

const API_BASE = '/api/costs';

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'include', ...options });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(body.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

// Map backend category enums to frontend display categories
const backendCategoryMap: Record<string, CostCategory> = {
  TOOL_LICENSE: 'ToolLicense',
  CONSULTANT: 'Consultant',
  AUDIT_FEE: 'AuditFee',
  TRAINING: 'Training',
  PERSONNEL: 'Personnel',
  INSURANCE: 'Insurance',
  REMEDIATION: 'Remediation',
  CERTIFICATION: 'Other',
  LEGAL: 'Other',
  OTHER: 'Other',
};

const frontendCategoryMap: Record<CostCategory, string> = {
  ToolLicense: 'TOOL_LICENSE',
  Consultant: 'CONSULTANT',
  AuditFee: 'AUDIT_FEE',
  Training: 'TRAINING',
  Personnel: 'PERSONNEL',
  Insurance: 'INSURANCE',
  Remediation: 'REMEDIATION',
  Other: 'OTHER',
};

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ── Component ───────────────────────────────────────────────────────────────

const ComplianceCostDashboard: React.FC = () => {
  const { t } = useI18n();
  const [entries, setEntries] = useState<CostEntry[]>([]);
  const [budgetData, setBudgetData] = useState<BudgetLine[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<{ month: string; amount: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [catFilter, setCatFilter] = useState<CostCategory | 'all'>('all');
  const [fwFilter, setFwFilter] = useState<Framework | 'all'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formDesc, setFormDesc] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCat, setFormCat] = useState<CostCategory>('ToolLicense');
  const [formFw, setFormFw] = useState<Framework>('General');
  const [formVendor, setFormVendor] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formRecurring, setFormRecurring] = useState(false);
  const [formFreq, setFormFreq] = useState<CostEntry['frequency']>('annual');

  // Fetch cost entries, trend, and budget data from backend
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      apiFetch<{ status: string; data: { costs: any[] } }>(`${API_BASE}?limit=100`),
      apiFetch<{ status: string; data: { trend: any[] } }>(`${API_BASE}/trend?months=12`),
      apiFetch<{ status: string; data: { byCategory: any[]; totalActual: number } }>(`${API_BASE}/budget`),
    ])
      .then(([costsRes, trendRes, budgetRes]) => {
        if (cancelled) return;

        // Map cost entries
        const mapped: CostEntry[] = costsRes.data.costs.map((c: any) => ({
          id: c.id,
          description: c.description || '',
          amount: c.amount || 0,
          category: backendCategoryMap[c.category] || 'Other',
          framework: (c.frameworkId || 'General') as Framework,
          vendor: c.vendorId || '',
          date: c.periodStart ? new Date(c.periodStart).toISOString().split('T')[0] : '',
          recurring: false,
          frequency: 'one-time' as const,
        }));
        setEntries(mapped);

        // Map monthly trend
        const trendMapped = trendRes.data.trend.map((t: any) => {
          const parts = t.month.split('-');
          const monthIdx = parseInt(parts[1], 10) - 1;
          return { month: monthNames[monthIdx] || t.month, amount: t.total || 0 };
        });
        setMonthlyTrend(trendMapped);

        // Map budget data
        const budgetMapped: BudgetLine[] = budgetRes.data.byCategory.map((b: any) => ({
          category: backendCategoryMap[b.category] || 'Other',
          budgeted: b.actual || 0,
          actual: b.actual || 0,
        }));
        setBudgetData(budgetMapped);
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('Failed to fetch cost data:', err);
        setError(err.message || 'Failed to load cost data');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => entries.filter(e => {
    const matchSearch = searchQuery === '' || e.description.toLowerCase().includes(searchQuery.toLowerCase()) || e.vendor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = catFilter === 'all' || e.category === catFilter;
    const matchFw = fwFilter === 'all' || e.framework === fwFilter;
    return matchSearch && matchCat && matchFw;
  }), [entries, searchQuery, catFilter, fwFilter]);

  const totalSpend = useMemo(() => entries.reduce((s, e) => s + e.amount, 0), [entries]);
  const totalBudget = budgetData.reduce((s, b) => s + b.budgeted, 0);
  const totalActual = budgetData.reduce((s, b) => s + b.actual, 0);

  const byCategory = useMemo(() => {
    return (Object.keys(categoryLabels) as CostCategory[]).map(cat => ({
      category: cat, total: entries.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0),
      count: entries.filter(e => e.category === cat).length,
    })).filter(c => c.count > 0).sort((a, b) => b.total - a.total);
  }, [entries]);

  const byFramework = useMemo(() => {
    return (Object.keys(frameworkLabels) as Framework[]).map(fw => ({
      framework: fw, total: entries.filter(e => e.framework === fw).reduce((s, e) => s + e.amount, 0),
      count: entries.filter(e => e.framework === fw).length,
    })).filter(f => f.count > 0).sort((a, b) => b.total - a.total);
  }, [entries]);

  const maxMonthly = Math.max(...monthlyTrend.map(m => m.amount));

  const handleCreate = useCallback(async () => {
    try {
      const dateVal = formDate || new Date().toISOString().split('T')[0];
      const payload = {
        category: frontendCategoryMap[formCat],
        description: formDesc,
        amount: parseFloat(formAmount) || 0,
        currency: 'USD',
        periodStart: dateVal,
        periodEnd: dateVal,
      };

      const res = await apiFetch<{ status: string; data: any }>(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const c = res.data;
      const newEntry: CostEntry = {
        id: c.id,
        description: c.description || formDesc,
        amount: c.amount || parseFloat(formAmount) || 0,
        category: formCat,
        framework: formFw,
        vendor: formVendor,
        date: dateVal,
        recurring: formRecurring,
        frequency: formFreq,
      };
      setEntries(prev => [newEntry, ...prev]);
      setShowCreateForm(false);
      setFormDesc(''); setFormAmount(''); setFormVendor(''); setFormDate('');
    } catch (err: any) {
      console.warn('Failed to create cost entry:', err);
      setError(err.message || 'Failed to create cost entry');
    }
  }, [formDesc, formAmount, formCat, formFw, formVendor, formDate, formRecurring, formFreq]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await apiFetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (err: any) {
      console.warn('Failed to delete cost entry:', err);
      setError(err.message || 'Failed to delete cost entry');
    }
  }, []);

  const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `$${n}`;
  const fmtFull = (n: number) => `$${n.toLocaleString()}`;

  return (
    <div className="min-h-screen bg-slate-900 dark:bg-slate-950 text-white p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-green-500/20 rounded-lg"><DollarSign className="w-6 h-6 text-green-400" /></div>
          <div><h1 className="text-2xl font-bold">{t('costs.title')}</h1><p className="text-slate-400 text-sm">Track and analyze compliance spending</p></div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4"><span className="text-slate-400 text-sm">{t('costs.totalCost')}</span><div className="text-2xl font-bold mt-1 text-green-400">{fmtFull(totalSpend)}</div></div>
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4"><span className="text-slate-400 text-sm">{t('costs.budget')}</span><div className="text-2xl font-bold mt-1">{fmtFull(totalBudget)}</div></div>
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <span className="text-slate-400 text-sm">Budget Utilization</span>
          <div className="text-2xl font-bold mt-1">{Math.round((totalActual / totalBudget) * 100)}%</div>
          <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2"><div className="bg-green-500 h-full rounded-full" style={{ width: `${Math.min(100, (totalActual / totalBudget) * 100)}%` }} /></div>
        </div>
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <span className="text-slate-400 text-sm">Remaining</span>
          <div className={`text-2xl font-bold mt-1 ${totalBudget - totalActual >= 0 ? 'text-green-400' : 'text-red-400'}`}>{fmtFull(totalBudget - totalActual)}</div>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-6 bg-slate-800 rounded-xl p-1 w-fit border border-slate-700">
        {([{ id: 'overview' as TabId, label: t('common.overview'), icon: <PieChart className="w-4 h-4" /> }, { id: 'entries' as TabId, label: 'Cost Entries', icon: <DollarSign className="w-4 h-4" /> }, { id: 'budget' as TabId, label: `${t('costs.budget')} vs ${t('costs.actual')}`, icon: <BarChart3 className="w-4 h-4" /> }]).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>{tab.icon}{tab.label}</button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          <span className="ml-3 text-slate-400">Loading cost data...</span>
        </div>
      )}

      {error && !loading && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-3 underline text-red-300 hover:text-red-200">Dismiss</button>
        </div>
      )}

      {!loading && activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h3 className="text-sm font-semibold mb-4">{t('costs.costByCategory')}</h3>
              <div className="space-y-3">
                {byCategory.map(item => (
                  <div key={item.category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">{categoryLabels[item.category]}</span>
                      <span className="text-sm font-mono font-bold">{fmtFull(item.total)}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                      <div className={`h-full rounded-full ${categoryColors[item.category]}`} style={{ width: `${totalSpend > 0 ? (item.total / totalSpend) * 100 : 0}%` }} />
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{Math.round((item.total / totalSpend) * 100)}% of total | {item.count} entries</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h3 className="text-sm font-semibold mb-4">{t('costs.costByFramework')}</h3>
              <div className="space-y-3">
                {byFramework.map(item => (
                  <div key={item.framework} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div>
                      <span className="text-sm font-medium">{frameworkLabels[item.framework]}</span>
                      <span className="text-xs text-slate-500 ml-2">{item.count} items</span>
                    </div>
                    <span className="text-sm font-bold font-mono">{fmtFull(item.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h3 className="text-sm font-semibold mb-4">{t('costs.costTrend')}</h3>
            <div className="flex items-end gap-2 h-48">
              {monthlyTrend.map(m => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-slate-400 font-mono">{fmt(m.amount)}</span>
                  <div className="w-full bg-blue-500/80 rounded-t" style={{ height: `${maxMonthly > 0 ? (m.amount / maxMonthly) * 100 : 0}%`, minHeight: '4px' }} />
                  <span className="text-[10px] text-slate-500">{m.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!loading && activeTab === 'entries' && (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
            <div className="relative flex-1 w-full"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" /><input type="text" placeholder={`${t('common.search')} costs...`} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <select value={catFilter} onChange={e => setCatFilter(e.target.value as CostCategory | 'all')} className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="all">{t('common.all')} Categories</option>{Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <select value={fwFilter} onChange={e => setFwFilter(e.target.value as Framework | 'all')} className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="all">All Frameworks</option>{Object.entries(frameworkLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"><Plus className="w-4 h-4" /> Add Cost</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-700"><th className="text-left py-3 px-4 text-slate-400 font-medium">Description</th><th className="text-left py-3 px-4 text-slate-400 font-medium">Category</th><th className="text-left py-3 px-4 text-slate-400 font-medium">Framework</th><th className="text-left py-3 px-4 text-slate-400 font-medium">Vendor</th><th className="text-right py-3 px-4 text-slate-400 font-medium">Amount</th><th className="text-left py-3 px-4 text-slate-400 font-medium">Frequency</th><th className="text-right py-3 px-4 text-slate-400 font-medium">Actions</th></tr></thead>
              <tbody>
                {filtered.map(entry => (
                  <tr key={entry.id} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                    <td className="py-3 px-4"><div className="font-medium">{entry.description}</div><div className="text-xs text-slate-500">{entry.date}</div></td>
                    <td className="py-3 px-4"><span className="flex items-center gap-1.5 text-xs"><div className={`w-2 h-2 rounded-full ${categoryColors[entry.category]}`} />{categoryLabels[entry.category]}</span></td>
                    <td className="py-3 px-4 text-slate-400">{frameworkLabels[entry.framework]}</td>
                    <td className="py-3 px-4 text-slate-400">{entry.vendor}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold">{fmtFull(entry.amount)}</td>
                    <td className="py-3 px-4"><span className={`px-1.5 py-0.5 rounded text-xs ${entry.recurring ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-600 text-slate-400'}`}>{entry.frequency}</span></td>
                    <td className="py-3 px-4 text-right"><button onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }} className="p-1.5 text-slate-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between p-4 border-t border-slate-700"><span className="text-sm text-slate-400">{filtered.length} entries</span><span className="text-sm font-bold">Total: {fmtFull(filtered.reduce((s, e) => s + e.amount, 0))}</span></div>
          </div>
        </>
      )}

      {!loading && activeTab === 'budget' && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h3 className="text-sm font-semibold mb-4">{t('costs.budget')} vs {t('costs.actual')} by {t('common.category')}</h3>
          <div className="space-y-4">
            {budgetData.map(item => {
              const pct = item.budgeted > 0 ? Math.round((item.actual / item.budgeted) * 100) : 0;
              const over = item.actual > item.budgeted;
              return (
                <div key={item.category}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${categoryColors[item.category]}`} />
                      <span className="text-sm font-medium">{categoryLabels[item.category]}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-slate-400">Budget: {fmtFull(item.budgeted)}</span>
                      <span className="font-bold">{t('costs.actual')}: {fmtFull(item.actual)}</span>
                      <span className={`flex items-center gap-0.5 text-xs font-medium ${over ? 'text-red-400' : 'text-green-400'}`}>
                        {over ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                        {pct}%
                      </span>
                    </div>
                  </div>
                  <div className="relative w-full bg-slate-700 rounded-full h-4">
                    <div className={`absolute inset-y-0 left-0 rounded-full ${over ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min(100, pct)}%` }} />
                    <div className="absolute inset-y-0 left-0 border-r-2 border-white/50" style={{ width: '100%' }} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mt-0.5">
                    <span>{t('costs.variance')}: {fmtFull(Math.abs(item.budgeted - item.actual))} {over ? 'over' : 'under'}</span>
                    <span>{pct}% utilized</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 p-4 bg-slate-700/30 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Total</span>
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-400">Budget: {fmtFull(totalBudget)}</span>
                <span className="text-sm font-bold">{t('costs.actual')}: {fmtFull(totalActual)}</span>
                <span className={`text-sm font-bold ${totalBudget - totalActual >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {fmtFull(Math.abs(totalBudget - totalActual))} {totalBudget >= totalActual ? 'under budget' : 'over budget'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-700"><h2 className="text-lg font-semibold">Add Cost Entry</h2><button onClick={() => setShowCreateForm(false)} className="p-1 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button></div>
            <div className="p-4 space-y-4">
              <div><label className="block text-sm text-slate-400 mb-1">Description</label><input type="text" value={formDesc} onChange={e => setFormDesc(e.target.value)} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-slate-400 mb-1">Amount ($)</label><input type="number" value={formAmount} onChange={e => setFormAmount(e.target.value)} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm text-slate-400 mb-1">Category</label><select value={formCat} onChange={e => setFormCat(e.target.value as CostCategory)} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">{Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-slate-400 mb-1">Framework</label><select value={formFw} onChange={e => setFormFw(e.target.value as Framework)} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">{Object.entries(frameworkLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
                <div><label className="block text-sm text-slate-400 mb-1">Vendor</label><input type="text" value={formVendor} onChange={e => setFormVendor(e.target.value)} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-slate-400 mb-1">Date</label><input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm text-slate-400 mb-1">Frequency</label><select value={formFreq} onChange={e => setFormFreq(e.target.value as CostEntry['frequency'])} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="one-time">One-time</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="annual">Annual</option></select></div>
              </div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={formRecurring} onChange={e => setFormRecurring(e.target.checked)} className="rounded border-slate-600 text-blue-600" /><span className="text-sm text-slate-400">Recurring cost</span></label>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-700">
              <button onClick={() => setShowCreateForm(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors">Cancel</button>
              <button onClick={handleCreate} disabled={!formDesc.trim()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"><Plus className="w-4 h-4" /> Add Entry</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceCostDashboard;
