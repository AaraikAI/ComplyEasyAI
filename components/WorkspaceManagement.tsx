import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { isAtLimit, getUpgradeMessage } from '../constants/tierLimits';
import { TierLimitBanner } from './TierLimitBanner';
import {
  ArrowLeft, Plus, Loader2, Search, X, Building2, Users, Shield,
  Brain, TrendingUp, BarChart3, GitBranch, Copy, UserPlus, ChevronRight,
  CheckCircle, AlertTriangle, XCircle, Layers, Globe, Zap, Target,
  ArrowRightLeft, Award, Lightbulb,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ChildOrg {
  id: string;
  name: string;
  plan: string;
  userCount: number;
  frameworkCount: number;
}

interface Hierarchy {
  current: { id: string; name: string; isParent: boolean; plan: string };
  parent: { id: string; name: string; siblingCount: number } | null;
  children: ChildOrg[];
}

interface ConsolidatedMetrics {
  totalOrganizations: number;
  totalUsers: number;
  totalFrameworks: number;
  totalControls: number;
  implementedControls: number;
  totalRisks: number;
  openRisks: number;
  totalVendors: number;
  organizationBreakdown: Array<{
    id: string;
    name: string;
    users: number;
    frameworks: number;
    risks: number;
    vendors: number;
    complianceRate: number;
  }>;
}

interface CoPilotData {
  recommendations: any[];
  overallScore: number;
  criticalActions: any[];
  quickWins: any[];
  longTermInitiatives: any[];
}

interface BenchmarkData {
  yourScore: number;
  industryAverage: number;
  topPerformerScore: number;
  percentile: number;
  strengths: any[];
  weaknesses: any[];
  recommendations: any[];
  peerInsights: any[];
}

interface PredictiveRisk {
  predictions: any[];
  riskTrend: string;
  confidence: number;
  emergingThreats: any[];
  preventiveActions: any[];
}

type ViewMode = 'dashboard' | 'ai-insights' | 'ai-benchmark' | 'ai-predict-risks' | 'create-child' | 'clone-framework' | 'move-user';

const CHART_COLORS = ['#3b82f6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#0d9488', '#ec4899'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function WorkspaceManagement() {
  const { t } = useI18n();
  const { user } = useAuth();
  const plan = user?.organization?.plan || 'Foundation';

  // Core state
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [hierarchy, setHierarchy] = useState<Hierarchy | null>(null);
  const [metrics, setMetrics] = useState<ConsolidatedMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // AI state
  const [coPilot, setCoPilot] = useState<CoPilotData | null>(null);
  const [benchmark, setBenchmark] = useState<BenchmarkData | null>(null);
  const [predictiveRisk, setPredictiveRisk] = useState<PredictiveRisk | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Form state
  const [childForm, setChildForm] = useState({ name: '', plan: '' });
  const [cloneForm, setCloneForm] = useState({ frameworkId: '', targetIds: [] as string[] });
  const [moveForm, setMoveForm] = useState({ userId: '', targetOrgId: '' });
  const [isSaving, setIsSaving] = useState(false);

  // Tier limit
  const childCount = hierarchy?.children.length || 0;
  const workspaceLimitReached = isAtLimit(plan, 'maxWorkspaces', childCount);

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------
  const loadHierarchy = useCallback(async () => {
    try {
      const data = await api.enterprise.workspaces.getHierarchy();
      setHierarchy(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load hierarchy');
    }
  }, []);

  const loadMetrics = useCallback(async () => {
    try {
      const data = await api.enterprise.workspaces.getConsolidatedMetrics();
      setMetrics(data);
    } catch {
      // Metrics are supplementary - only available for parent orgs
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await Promise.all([loadHierarchy(), loadMetrics()]);
      setIsLoading(false);
    };
    load();
  }, [loadHierarchy, loadMetrics]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleCreateChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAtLimit(plan, 'maxWorkspaces', childCount)) {
      toast.warning(getUpgradeMessage(plan, 'maxWorkspaces', childCount));
      return;
    }
    setIsSaving(true);
    try {
      const { plan: _plan, ...childPayload } = childForm;
      await api.enterprise.workspaces.createChild(childPayload);
      await Promise.all([loadHierarchy(), loadMetrics()]);
      setChildForm({ name: '', plan: '' });
      setViewMode('dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create workspace');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloneFramework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloneForm.frameworkId || cloneForm.targetIds.length === 0) return;
    setIsSaving(true);
    try {
      await api.enterprise.workspaces.cloneFramework(cloneForm.frameworkId, cloneForm.targetIds);
      await loadMetrics();
      setCloneForm({ frameworkId: '', targetIds: [] });
      setViewMode('dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to clone framework');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMoveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moveForm.userId || !moveForm.targetOrgId) return;
    setIsSaving(true);
    try {
      await api.enterprise.workspaces.moveUser(moveForm.userId, moveForm.targetOrgId);
      await Promise.all([loadHierarchy(), loadMetrics()]);
      setMoveForm({ userId: '', targetOrgId: '' });
      setViewMode('dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to move user');
    } finally {
      setIsSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // AI Handlers
  // ---------------------------------------------------------------------------
  const handleAIInsights = async () => {
    setAiLoading(true);
    setCoPilot(null);
    setViewMode('ai-insights');
    try {
      const data = await api.enterprise.visionaryAI.getCoPilotRecommendations();
      setCoPilot(data);
    } catch (err: any) {
      setError(err.message || 'AI insights failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIBenchmark = async () => {
    setAiLoading(true);
    setBenchmark(null);
    setViewMode('ai-benchmark');
    try {
      const data = await api.enterprise.visionaryAI.getBenchmarking();
      setBenchmark(data);
    } catch (err: any) {
      setError(err.message || 'Benchmarking failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIPredictRisks = async () => {
    setAiLoading(true);
    setPredictiveRisk(null);
    setViewMode('ai-predict-risks');
    try {
      const data = await api.enterprise.visionaryAI.predictRisks(90);
      setPredictiveRisk(data);
    } catch (err: any) {
      setError(err.message || 'Risk prediction failed');
    } finally {
      setAiLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render: Dashboard
  // ---------------------------------------------------------------------------
  const renderDashboard = () => {
    const complianceData = metrics?.organizationBreakdown.map(o => ({
      name: o.name.length > 15 ? o.name.substring(0, 15) + '...' : o.name,
      compliance: o.complianceRate,
      risks: o.risks,
      users: o.users,
    })) || [];

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Workspace Management</h1>
            <p className="text-gray-500 mt-1">AI-powered multi-workspace compliance management</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAIInsights} disabled={aiLoading}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
              <Brain className="w-4 h-4" /> AI Insights
            </button>
            <button onClick={handleAIBenchmark} disabled={aiLoading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              <Award className="w-4 h-4" /> Benchmark
            </button>
            <button onClick={handleAIPredictRisks} disabled={aiLoading}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50">
              <TrendingUp className="w-4 h-4" /> Predict Risks
            </button>
            <button onClick={() => setViewMode('create-child')} disabled={workspaceLimitReached}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              <Plus className="w-4 h-4" /> Add Workspace
            </button>
          </div>
        </div>

        {workspaceLimitReached && <TierLimitBanner message={getUpgradeMessage(plan, 'maxWorkspaces', childCount)} />}

        {/* Consolidated Stats */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Workspaces', value: metrics.totalOrganizations, icon: <Building2 className="w-5 h-5 text-blue-600" /> },
              { label: 'Total Users', value: metrics.totalUsers, icon: <Users className="w-5 h-5 text-green-600" /> },
              { label: 'Frameworks', value: metrics.totalFrameworks, icon: <Shield className="w-5 h-5 text-purple-600" /> },
              { label: 'Controls', value: `${metrics.implementedControls}/${metrics.totalControls}`, icon: <CheckCircle className="w-5 h-5 text-emerald-600" /> },
              { label: 'Total Risks', value: metrics.totalRisks, icon: <AlertTriangle className="w-5 h-5 text-yellow-600" /> },
              { label: 'Open Risks', value: metrics.openRisks, icon: <XCircle className="w-5 h-5 text-red-600" /> },
              { label: 'Vendors', value: metrics.totalVendors, icon: <Globe className="w-5 h-5 text-indigo-600" /> },
              { label: 'Compliance', value: metrics.totalControls > 0 ? `${Math.round((metrics.implementedControls / metrics.totalControls) * 100)}%` : 'N/A', icon: <Target className="w-5 h-5 text-teal-600" /> },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border p-4 flex items-center gap-3">
                {s.icon}
                <div>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Hierarchy Tree */}
        {hierarchy && (
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <GitBranch className="w-5 h-5" /> Organization Hierarchy
            </h3>

            {/* Current org */}
            <div className="mb-4">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Building2 className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-semibold text-gray-900">{hierarchy.current.name}</p>
                  <p className="text-xs text-gray-500">{hierarchy.current.isParent ? 'Parent Organization' : 'Organization'} · {hierarchy.current.plan}</p>
                </div>
              </div>
            </div>

            {/* Parent (if current is child) */}
            {hierarchy.parent && (
              <div className="mb-4 ml-4">
                <p className="text-xs text-gray-500 mb-1">Part of:</p>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <Layers className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{hierarchy.parent.name} ({hierarchy.parent.siblingCount} siblings)</span>
                </div>
              </div>
            )}

            {/* Children */}
            {hierarchy.children.length > 0 && (
              <div className="ml-6 space-y-2">
                <p className="text-xs text-gray-500 mb-2">Child Workspaces ({hierarchy.children.length})</p>
                {hierarchy.children.map(child => (
                  <div key={child.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    <div className="flex items-center gap-3">
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                      <Building2 className="w-4 h-4 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{child.name}</p>
                        <p className="text-xs text-gray-500">{child.plan}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{child.userCount} users</span>
                      <span>{child.frameworkCount} frameworks</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {hierarchy.children.length === 0 && !hierarchy.parent && (
              <p className="text-sm text-gray-500 ml-6">No child workspaces yet. Create one to get started.</p>
            )}
          </div>
        )}

        {/* Organization Breakdown Chart */}
        {complianceData.length > 0 && (
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Compliance by Workspace</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={complianceData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="compliance" fill="#3b82f6" name="Compliance %" radius={[4, 4, 0, 0]} />
                <Bar dataKey="risks" fill="#ef4444" name="Risks" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Org Breakdown Table */}
        {metrics && metrics.organizationBreakdown.length > 0 && (
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Workspace Details</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Workspace</th>
                    <th className="text-left py-2 px-3">Users</th>
                    <th className="text-left py-2 px-3">Frameworks</th>
                    <th className="text-left py-2 px-3">Risks</th>
                    <th className="text-left py-2 px-3">Vendors</th>
                    <th className="text-left py-2 px-3">Compliance</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.organizationBreakdown.map(org => (
                    <tr key={org.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium">{org.name}</td>
                      <td className="py-2 px-3">{org.users}</td>
                      <td className="py-2 px-3">{org.frameworks}</td>
                      <td className="py-2 px-3">{org.risks}</td>
                      <td className="py-2 px-3">{org.vendors}</td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[80px]">
                            <div className="h-2 rounded-full" style={{
                              width: `${org.complianceRate}%`,
                              backgroundColor: org.complianceRate > 70 ? '#22c55e' : org.complianceRate > 40 ? '#eab308' : '#ef4444',
                            }} />
                          </div>
                          <span className="text-xs font-medium">{org.complianceRate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button onClick={() => setViewMode('create-child')} disabled={workspaceLimitReached}
            className="bg-white rounded-xl border p-4 hover:border-blue-200 transition text-left disabled:opacity-50">
            <Plus className="w-5 h-5 text-blue-600 mb-2" />
            <p className="font-medium text-gray-900">Create Workspace</p>
            <p className="text-xs text-gray-500">Add a child organization</p>
          </button>
          <button onClick={() => setViewMode('clone-framework')}
            className="bg-white rounded-xl border p-4 hover:border-purple-200 transition text-left">
            <Copy className="w-5 h-5 text-purple-600 mb-2" />
            <p className="font-medium text-gray-900">Clone Framework</p>
            <p className="text-xs text-gray-500">Copy frameworks to children</p>
          </button>
          <button onClick={() => setViewMode('move-user')}
            className="bg-white rounded-xl border p-4 hover:border-green-200 transition text-left">
            <ArrowRightLeft className="w-5 h-5 text-green-600 mb-2" />
            <p className="font-medium text-gray-900">Move User</p>
            <p className="text-xs text-gray-500">Transfer between workspaces</p>
          </button>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Create Child
  // ---------------------------------------------------------------------------
  const renderCreateChild = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setViewMode('dashboard')} className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h2 className="text-xl font-bold text-gray-900">Create Child Workspace</h2>
      </div>

      <form onSubmit={handleCreateChild} className="bg-white rounded-xl border p-6 space-y-4 max-w-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Workspace Name</label>
          <input type="text" required value={childForm.name} onChange={e => setChildForm(f => ({ ...f, name: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g., APAC Division" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Plan (optional, inherits parent)</label>
          <select value={childForm.plan} onChange={e => setChildForm(f => ({ ...f, plan: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm">
            <option value="">Inherit from parent</option>
            <option value="Foundation">Foundation</option>
            <option value="Essentials">Essentials</option>
            <option value="Growth">Growth</option>
            <option value="Visionary">Visionary</option>
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />} Create Workspace
          </button>
          <button type="button" onClick={() => setViewMode('dashboard')} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">{t('common.cancel')}</button>
        </div>
      </form>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: Clone Framework
  // ---------------------------------------------------------------------------
  const renderCloneFramework = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setViewMode('dashboard')} className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h2 className="text-xl font-bold text-gray-900">Clone Framework to Children</h2>
      </div>

      <form onSubmit={handleCloneFramework} className="bg-white rounded-xl border p-6 space-y-4 max-w-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Framework ID</label>
          <input type="text" required value={cloneForm.frameworkId} onChange={e => setCloneForm(f => ({ ...f, frameworkId: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Enter framework ID to clone" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Workspaces</label>
          {hierarchy?.children.map(child => (
            <label key={child.id} className="flex items-center gap-2 py-1 cursor-pointer">
              <input type="checkbox" checked={cloneForm.targetIds.includes(child.id)}
                onChange={e => {
                  setCloneForm(f => ({
                    ...f,
                    targetIds: e.target.checked ? [...f.targetIds, child.id] : f.targetIds.filter(id => id !== child.id),
                  }));
                }} className="rounded" />
              <span className="text-sm">{child.name}</span>
            </label>
          ))}
          {(!hierarchy?.children || hierarchy.children.length === 0) && (
            <p className="text-sm text-gray-500">No child workspaces available. Create one first.</p>
          )}
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isSaving || cloneForm.targetIds.length === 0}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />} Clone Framework
          </button>
          <button type="button" onClick={() => setViewMode('dashboard')} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">{t('common.cancel')}</button>
        </div>
      </form>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: Move User
  // ---------------------------------------------------------------------------
  const renderMoveUser = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setViewMode('dashboard')} className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h2 className="text-xl font-bold text-gray-900">Move User Between Workspaces</h2>
      </div>

      <form onSubmit={handleMoveUser} className="bg-white rounded-xl border p-6 space-y-4 max-w-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
          <input type="text" required value={moveForm.userId} onChange={e => setMoveForm(f => ({ ...f, userId: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Enter user ID" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Workspace</label>
          <select required value={moveForm.targetOrgId} onChange={e => setMoveForm(f => ({ ...f, targetOrgId: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm">
            <option value="">Select workspace...</option>
            {hierarchy && <option value={hierarchy.current.id}>{hierarchy.current.name} (Current)</option>}
            {hierarchy?.children.map(child => (
              <option key={child.id} value={child.id}>{child.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isSaving}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />} Move User
          </button>
          <button type="button" onClick={() => setViewMode('dashboard')} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">{t('common.cancel')}</button>
        </div>
      </form>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: AI Insights (Co-Pilot)
  // ---------------------------------------------------------------------------
  const renderAIInsights = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setViewMode('dashboard')} className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <Brain className="w-5 h-5 text-purple-600" />
        <h2 className="text-xl font-bold text-gray-900">AI Compliance Co-Pilot</h2>
      </div>

      {aiLoading && (
        <div className="flex items-center justify-center py-16 bg-white rounded-xl border">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mr-3" />
          <span className="text-gray-600">AI is analyzing your compliance posture...</span>
        </div>
      )}

      {coPilot && !aiLoading && (
        <>
          {/* Overall Score */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Overall Compliance Score</p>
                <p className="text-4xl font-bold text-purple-900">{coPilot.overallScore}%</p>
              </div>
              <div className="w-20 h-20 rounded-full border-4 border-purple-300 flex items-center justify-center">
                <span className="text-xl font-bold text-purple-700">{coPilot.overallScore}</span>
              </div>
            </div>
          </div>

          {/* Critical Actions */}
          {coPilot.criticalActions?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <h3 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                <XCircle className="w-4 h-4" /> Critical Actions ({coPilot.criticalActions.length})
              </h3>
              <div className="space-y-2">
                {coPilot.criticalActions.map((a: any, i: number) => (
                  <div key={i} className="bg-white rounded-lg p-3 border border-red-100">
                    <p className="text-sm font-medium text-gray-900">{a.title || a.action || a}</p>
                    {a.description && <p className="text-xs text-gray-600 mt-1">{a.description}</p>}
                    {a.impact && <p className="text-xs text-red-600 mt-1">Impact: {a.impact}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Wins */}
          {coPilot.quickWins?.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4" /> Quick Wins ({coPilot.quickWins.length})
              </h3>
              <div className="space-y-2">
                {coPilot.quickWins.map((w: any, i: number) => (
                  <div key={i} className="bg-white rounded-lg p-3 border border-green-100">
                    <p className="text-sm font-medium text-gray-900">{w.title || w.action || w}</p>
                    {w.description && <p className="text-xs text-gray-600 mt-1">{w.description}</p>}
                    {w.effort && <p className="text-xs text-green-600 mt-1">Effort: {w.effort}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {coPilot.recommendations?.length > 0 && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" /> Recommendations
              </h3>
              <div className="space-y-2">
                {coPilot.recommendations.map((r: any, i: number) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">{r.title || r.recommendation || r}</p>
                    {r.description && <p className="text-xs text-gray-600 mt-1">{r.description}</p>}
                    {r.priority && <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${r.priority === 'High' ? 'bg-red-100 text-red-700' : r.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>{r.priority}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Long Term */}
          {coPilot.longTermInitiatives?.length > 0 && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-500" /> Long-Term Initiatives
              </h3>
              <div className="space-y-2">
                {coPilot.longTermInitiatives.map((l: any, i: number) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">{l.title || l.initiative || l}</p>
                    {l.description && <p className="text-xs text-gray-600 mt-1">{l.description}</p>}
                    {l.timeline && <p className="text-xs text-blue-600 mt-1">Timeline: {l.timeline}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: AI Benchmark
  // ---------------------------------------------------------------------------
  const renderAIBenchmark = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setViewMode('dashboard')} className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <Award className="w-5 h-5 text-indigo-600" />
        <h2 className="text-xl font-bold text-gray-900">AI Compliance Benchmarking</h2>
      </div>

      {aiLoading && (
        <div className="flex items-center justify-center py-16 bg-white rounded-xl border">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mr-3" />
          <span className="text-gray-600">AI is benchmarking against industry peers...</span>
        </div>
      )}

      {benchmark && !aiLoading && (
        <>
          {/* Score Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <p className="text-xs text-blue-600">Your Score</p>
              <p className="text-3xl font-bold text-blue-900">{benchmark.yourScore}%</p>
            </div>
            <div className="bg-gray-50 border rounded-xl p-4 text-center">
              <p className="text-xs text-gray-600">Industry Average</p>
              <p className="text-3xl font-bold text-gray-900">{benchmark.industryAverage}%</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-xs text-green-600">Top Performer</p>
              <p className="text-3xl font-bold text-green-900">{benchmark.topPerformerScore}%</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
              <p className="text-xs text-purple-600">Your Percentile</p>
              <p className="text-3xl font-bold text-purple-900">{benchmark.percentile}th</p>
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benchmark.strengths?.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <h3 className="font-semibold text-green-800 mb-3">Strengths</h3>
                <ul className="space-y-2">
                  {benchmark.strengths.map((s: any, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                      <span>{s.area || s.strength || s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {benchmark.weaknesses?.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <h3 className="font-semibold text-red-800 mb-3">Areas for Improvement</h3>
                <ul className="space-y-2">
                  {benchmark.weaknesses.map((w: any, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                      <span>{w.area || w.weakness || w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Recommendations */}
          {benchmark.recommendations?.length > 0 && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Benchmark Recommendations</h3>
              <div className="space-y-2">
                {benchmark.recommendations.map((r: any, i: number) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm">{r.recommendation || r.title || r}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Peer Insights */}
          {benchmark.peerInsights?.length > 0 && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Peer Insights</h3>
              <div className="space-y-2">
                {benchmark.peerInsights.map((p: any, i: number) => (
                  <div key={i} className="p-3 bg-indigo-50 rounded-lg text-sm text-indigo-800">
                    {p.insight || p.title || p}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: AI Predict Risks
  // ---------------------------------------------------------------------------
  const renderAIPredictRisks = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setViewMode('dashboard')} className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <TrendingUp className="w-5 h-5 text-orange-600" />
        <h2 className="text-xl font-bold text-gray-900">AI Predictive Risk Intelligence</h2>
      </div>

      {aiLoading && (
        <div className="flex items-center justify-center py-16 bg-white rounded-xl border">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600 mr-3" />
          <span className="text-gray-600">AI is forecasting risks for the next 90 days...</span>
        </div>
      )}

      {predictiveRisk && !aiLoading && (
        <>
          {/* Summary */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Risk Trend</p>
                <p className="text-2xl font-bold text-orange-900 capitalize">{predictiveRisk.riskTrend}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-orange-600 font-medium">Confidence</p>
                <p className="text-2xl font-bold text-orange-900">{Math.round((predictiveRisk.confidence || 0) * 100)}%</p>
              </div>
            </div>
          </div>

          {/* Predictions */}
          {predictiveRisk.predictions?.length > 0 && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Risk Predictions (90-day horizon)</h3>
              <div className="space-y-3">
                {predictiveRisk.predictions.map((p: any, i: number) => (
                  <div key={i} className={`p-4 rounded-lg border-l-4 ${
                    (p.severity || p.level || p.likelihood) === 'Critical' ? 'border-l-red-500 bg-red-50' :
                    (p.severity || p.level || p.likelihood) === 'High' ? 'border-l-orange-500 bg-orange-50' :
                    'border-l-yellow-500 bg-yellow-50'
                  }`}>
                    <p className="text-sm font-medium text-gray-900">
                      {p.title || p.risk || p.category || (typeof p === 'string' ? p : 'Risk')}
                    </p>
                    {p.description && <p className="text-xs text-gray-600 mt-1">{p.description}</p>}
                    {p.predictedRisks !== undefined && (
                      <p className="text-xs text-gray-600 mt-1">Predicted occurrences: {p.predictedRisks}</p>
                    )}
                    <div className="flex gap-3 mt-2">
                      {(p.severity || p.level || p.likelihood) && (
                        <span className="text-xs font-medium">{p.severity || p.level || p.likelihood}</span>
                      )}
                      {(p.probability || p.confidence) && (
                        <span className="text-xs text-gray-500">
                          Confidence: {typeof (p.probability || p.confidence) === 'number'
                            ? `${Math.round((p.probability || p.confidence) * 100)}%`
                            : (p.probability || p.confidence)}
                        </span>
                      )}
                      {p.timeframe && <span className="text-xs text-gray-500">Timeframe: {p.timeframe}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Emerging Threats */}
          {predictiveRisk.emergingThreats?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <h3 className="font-semibold text-red-800 mb-3">Emerging Threats</h3>
              <div className="space-y-2">
                {predictiveRisk.emergingThreats.map((threat: any, i: number) => (
                  <div key={i} className="bg-white rounded-lg p-3 border border-red-100">
                    <p className="text-sm font-medium text-gray-900">
                      {threat.title || threat.threat || threat.category || (typeof threat === 'string' ? threat : 'Emerging Threat')}
                    </p>
                    {threat.description && <p className="text-xs text-gray-600 mt-1">{threat.description}</p>}
                    {threat.predictedRisks !== undefined && (
                      <p className="text-xs text-gray-600 mt-1">Predicted occurrences: {threat.predictedRisks}</p>
                    )}
                    {threat.likelihood && (
                      <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded ${
                        threat.likelihood === 'High' ? 'bg-red-100 text-red-700' :
                        threat.likelihood === 'Medium' ? 'bg-orange-100 text-orange-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {threat.likelihood} likelihood
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preventive Actions */}
          {predictiveRisk.preventiveActions?.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <h3 className="font-semibold text-green-800 mb-3">Preventive Actions</h3>
              <ul className="space-y-2">
                {predictiveRisk.preventiveActions.map((a: any, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <span>{a.action || a.title || (typeof a === 'string' ? a : 'Take preventive action')}</span>
                      {a.priority && (
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                          a.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                          a.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {a.priority}
                        </span>
                      )}
                      {a.category && (
                        <span className="ml-2 text-xs text-gray-500">({a.category})</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span className="text-sm">{error}</span>
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {viewMode === 'dashboard' && renderDashboard()}
      {viewMode === 'create-child' && renderCreateChild()}
      {viewMode === 'clone-framework' && renderCloneFramework()}
      {viewMode === 'move-user' && renderMoveUser()}
      {viewMode === 'ai-insights' && renderAIInsights()}
      {viewMode === 'ai-benchmark' && renderAIBenchmark()}
      {viewMode === 'ai-predict-risks' && renderAIPredictRisks()}
    </div>
  );
}
