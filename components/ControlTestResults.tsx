/**
 * Control Test Results Component
 *
 * Automated control testing dashboard:
 * - Test list with type, schedule, last run, pass/fail status
 * - Test result detail view with full output, evidence captured, remediation
 * - Test coverage metrics (% of controls with automated testing)
 * - Schedule recurring tests (quarterly, monthly)
 * - Manual test trigger
 * - Test trend chart showing pass/fail over time
 * - API calls to /api/control-testing
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeft, Plus, Loader2, Search, X, Filter, Trash2, Edit3, Eye,
  CheckCircle, Clock, AlertTriangle, Play, RefreshCw, Settings,
  XCircle, BarChart3, Activity, Calendar, Shield, Target, Zap,
  ChevronDown, ChevronUp, ChevronRight, FileText, Download,
  TrendingUp, TrendingDown, AlertCircle, Timer, Monitor,
  Lock, Globe, Server, Database, Key,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Type Definitions ────────────────────────────────────────────────────────

type TestType = 'access_review' | 'config_check' | 'vulnerability_scan' | 'penetration_test' | 'policy_review' | 'data_classification' | 'encryption_check' | 'backup_verification';
type TestStatus = 'passed' | 'failed' | 'warning' | 'running' | 'scheduled' | 'not_run';
type TestFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually' | 'on_demand';
type ViewMode = 'dashboard' | 'list' | 'detail' | 'create' | 'edit';

interface TestResult {
  id: string;
  testId: string;
  status: TestStatus;
  output: string;
  evidenceCaptured: string[];
  findings: TestFinding[];
  startedAt: string;
  completedAt: string;
  durationMs: number;
  testedBy: string;
}

interface TestFinding {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  remediation: string;
  controlId?: string;
}

interface ControlTest {
  id: string;
  name: string;
  description: string;
  testType: TestType;
  controlId: string;
  controlName: string;
  framework: string;
  frequency: TestFrequency;
  lastRun?: string;
  lastStatus: TestStatus;
  nextRun?: string;
  passRate: number;
  totalRuns: number;
  consecutivePasses: number;
  owner: string;
  automated: boolean;
  results: TestResult[];
  createdAt: string;
  updatedAt: string;
}

interface TestTrendData {
  period: string;
  passed: number;
  failed: number;
  warning: number;
}

interface CoverageMetrics {
  totalControls: number;
  testedControls: number;
  coveragePercent: number;
  fullyAutomated: number;
  partiallyAutomated: number;
  manualOnly: number;
  noTesting: number;
  byFramework: { framework: string; tested: number; total: number; percent: number }[];
}

const TEST_TYPE_CONFIG: Record<TestType, { label: string; icon: React.ReactNode; color: string }> = {
  access_review: { label: 'Access Review', icon: <Key className="w-4 h-4" />, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  config_check: { label: 'Config Check', icon: <Settings className="w-4 h-4" />, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  vulnerability_scan: { label: 'Vulnerability Scan', icon: <Shield className="w-4 h-4" />, color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
  penetration_test: { label: 'Penetration Test', icon: <Target className="w-4 h-4" />, color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
  policy_review: { label: 'Policy Review', icon: <FileText className="w-4 h-4" />, color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  data_classification: { label: 'Data Classification', icon: <Database className="w-4 h-4" />, color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300' },
  encryption_check: { label: 'Encryption Check', icon: <Lock className="w-4 h-4" />, color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300' },
  backup_verification: { label: 'Backup Verification', icon: <Server className="w-4 h-4" />, color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
};

const STATUS_CONFIG: Record<TestStatus, { label: string; color: string; icon: React.ReactNode }> = {
  passed: { label: 'Passed', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', icon: <CheckCircle className="w-4 h-4" /> },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', icon: <XCircle className="w-4 h-4" /> },
  warning: { label: 'Warning', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', icon: <AlertTriangle className="w-4 h-4" /> },
  running: { label: 'Running', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', icon: <Loader2 className="w-4 h-4 animate-spin" /> },
  scheduled: { label: 'Scheduled', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300', icon: <Clock className="w-4 h-4" /> },
  not_run: { label: 'Not Run', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400', icon: <AlertCircle className="w-4 h-4" /> },
};

const FREQUENCIES: { value: TestFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
  { value: 'on_demand', label: 'On Demand' },
];

const generateId = () => `ct_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// ── Main Component ──────────────────────────────────────────────────────────

const ControlTestResults: React.FC = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [tests, setTests] = useState<ControlTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<ControlTest | null>(null);
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);
  const [coverage, setCoverage] = useState<CoverageMetrics | null>(null);
  const [trendData, setTrendData] = useState<TestTrendData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<TestType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<TestStatus | 'all'>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState<Partial<ControlTest>>({
    name: '', description: '', testType: 'config_check', controlId: '', controlName: '',
    framework: '', frequency: 'monthly', automated: true, owner: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadTests();
    loadCoverage();
    loadTrends();
  }, []);

  const loadTests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/control-testing/tests');
      setTests(Array.isArray(res.data) ? res.data : (res.data?.tests || []));
    } catch {
      setTests([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCoverage = async () => {
    try {
      const res = await api.get('/api/control-testing/coverage');
      setCoverage(res.data);
    } catch {
      setCoverage(null);
    }
  };

  const loadTrends = async () => {
    try {
      const res = await api.get('/api/control-testing/trends');
      setTrendData(Array.isArray(res.data) ? res.data : (res.data?.trends || []));
    } catch {
      setTrendData([]);
    }
  };

  const saveTest = async () => {
    try {
      if (editingId) {
        const res = await api.put(`/api/control-testing/tests/${editingId}`, form);
        setTests(prev => prev.map(t => t.id === editingId ? { ...t, ...form, ...(res.data || {}), updatedAt: new Date().toISOString() } as ControlTest : t));
        toast.success('Test updated');
      } else {
        const newTest = {
          ...form, id: generateId(), lastStatus: 'not_run' as TestStatus, passRate: 0, totalRuns: 0,
          consecutivePasses: 0, results: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        };
        const res = await api.post('/api/control-testing/tests', form);
        setTests(prev => [...prev, (res.data || newTest) as ControlTest]);
        toast.success('Test created');
      }
      setViewMode('list');
      setEditingId(null);
      resetForm();
    } catch {
      toast.error('Failed to save test');
    }
  };

  const deleteTest = async (id: string) => {
    try {
      await api.delete(`/api/control-testing/tests/${id}`);
      setTests(prev => prev.filter(t => t.id !== id));
      toast.success('Test deleted');
      setShowDeleteConfirm(null);
    } catch {
      toast.error('Failed to delete');
    }
  };

  const runTest = async (testId: string) => {
    setRunning(testId);
    try {
      const res = await api.post(`/api/control-testing/tests/${testId}/run`);
      toast.success('Test execution started');
      setTimeout(() => {
        loadTests();
        loadCoverage();
        loadTrends();
      }, 3000);
    } catch {
      toast.error('Failed to run test');
    } finally {
      setRunning(null);
    }
  };

  const resetForm = () => {
    setForm({
      name: '', description: '', testType: 'config_check', controlId: '', controlName: '',
      framework: '', frequency: 'monthly', automated: true, owner: '',
    });
  };

  const openEdit = (test: ControlTest) => {
    setForm({
      name: test.name, description: test.description, testType: test.testType,
      controlId: test.controlId, controlName: test.controlName, framework: test.framework,
      frequency: test.frequency, automated: test.automated, owner: test.owner,
    });
    setEditingId(test.id);
    setViewMode('edit');
  };

  const filteredTests = useMemo(() => {
    return tests.filter(t => {
      if (filterType !== 'all' && t.testType !== filterType) return false;
      if (filterStatus !== 'all' && t.lastStatus !== filterStatus) return false;
      if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase()) && !t.controlName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [tests, filterType, filterStatus, searchQuery]);

  const passCount = tests.filter(t => t.lastStatus === 'passed').length;
  const failCount = tests.filter(t => t.lastStatus === 'failed').length;
  const warnCount = tests.filter(t => t.lastStatus === 'warning').length;

  // ── Render: Dashboard ─────────────────────────────────────────────────

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Control Testing</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Automated control testing and compliance verification</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setViewMode('list')} className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition">
            <FileText className="w-4 h-4" />
            All Tests
          </button>
          <button onClick={() => { resetForm(); setEditingId(null); setViewMode('create'); }} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
            <Plus className="w-4 h-4" />
            New Test
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <Activity className="w-5 h-5 text-blue-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{tests.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Tests</p>
        </div>
        <div className="bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <CheckCircle className="w-5 h-5 text-green-500 mb-2" />
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{passCount}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Passing</p>
        </div>
        <div className="bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <XCircle className="w-5 h-5 text-red-500 mb-2" />
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{failCount}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Failing</p>
        </div>
        <div className="bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 text-yellow-500 mb-2" />
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{warnCount}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Warnings</p>
        </div>
        {coverage && (
          <>
            <div className="bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <Target className="w-5 h-5 text-purple-500 mb-2" />
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{coverage.coveragePercent}%</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Test Coverage</p>
            </div>
            <div className="bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <Zap className="w-5 h-5 text-teal-500 mb-2" />
              <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">{coverage.fullyAutomated}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Fully Automated</p>
            </div>
          </>
        )}
      </div>

      {/* Coverage Breakdown */}
      {coverage && (
        <div className="bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Test Coverage by Framework</h3>
          <div className="space-y-3">
            {(coverage.byFramework || []).map(fw => (
              <div key={fw.framework} className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-900 dark:text-white w-28">{fw.framework}</span>
                <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${fw.percent >= 80 ? 'bg-green-500' : fw.percent >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${fw.percent}%` }} />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-300 w-24 text-right">{fw.tested}/{fw.total} ({fw.percent}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trend Chart (Simplified bar representation) */}
      {trendData.length > 0 && (
        <div className="bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Pass/Fail Trend</h3>
          <div className="flex items-end gap-2 h-40">
            {trendData.map((d, idx) => {
              const total = d.passed + d.failed + d.warning;
              const passPercent = total > 0 ? (d.passed / total) * 100 : 0;
              const failPercent = total > 0 ? (d.failed / total) * 100 : 0;
              const warnPercent = total > 0 ? (d.warning / total) * 100 : 0;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col justify-end h-32 gap-0.5">
                    {failPercent > 0 && <div className="bg-red-500 rounded-t" style={{ height: `${failPercent}%` }} title={`Failed: ${d.failed}`} />}
                    {warnPercent > 0 && <div className="bg-yellow-500" style={{ height: `${warnPercent}%` }} title={`Warning: ${d.warning}`} />}
                    {passPercent > 0 && <div className="bg-green-500 rounded-b" style={{ height: `${passPercent}%` }} title={`Passed: ${d.passed}`} />}
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500 truncate w-full text-center">{d.period}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500" /> Passed</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-yellow-500" /> Warning</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500" /> Failed</span>
          </div>
        </div>
      )}

      {/* Recent Test Results */}
      <div className="bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Recent Test Executions</h3>
          <button onClick={loadTests} className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
        ) : tests.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No tests configured yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tests.slice(0, 8).map(test => {
              const statusConfig = STATUS_CONFIG[test.lastStatus];
              const typeConfig = TEST_TYPE_CONFIG[test.testType];
              return (
                <div
                  key={test.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-surface-700/50 rounded-lg transition cursor-pointer group"
                  onClick={() => { setSelectedTest(test); setSelectedResult(null); setViewMode('detail'); }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded ${typeConfig.color}`}>{typeConfig.icon}</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{test.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{test.controlName} &middot; {test.frequency}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${statusConfig.color}`}>
                      {statusConfig.icon} {statusConfig.label}
                    </span>
                    {test.lastRun && <span className="text-xs text-gray-400">{new Date(test.lastRun).toLocaleDateString()}</span>}
                    <button
                      onClick={e => { e.stopPropagation(); runTest(test.id); }}
                      disabled={running === test.id}
                      className="p-1 text-gray-400 hover:text-primary-600 rounded opacity-0 group-hover:opacity-100 transition"
                    >
                      {running === test.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // ── Render: Test List ─────────────────────────────────────────────────

  const renderTestList = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setViewMode('dashboard')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">All Control Tests</h2>
        </div>
        <button onClick={() => { resetForm(); setEditingId(null); setViewMode('create'); }} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
          <Plus className="w-4 h-4" />
          New Test
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search tests..." className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-surface-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500" />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-surface-800 text-gray-900 dark:text-white">
          <option value="all">All Types</option>
          {Object.entries(TEST_TYPE_CONFIG).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-surface-800 text-gray-900 dark:text-white">
          <option value="all">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
        </select>
      </div>

      <div className="bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-surface-700">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Test</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Schedule</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Last Run</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Pass Rate</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredTests.map(test => {
              const typeConfig = TEST_TYPE_CONFIG[test.testType];
              const statusConfig = STATUS_CONFIG[test.lastStatus];
              return (
                <tr key={test.id} className="hover:bg-gray-50 dark:hover:bg-surface-700/50 cursor-pointer" onClick={() => { setSelectedTest(test); setSelectedResult(null); setViewMode('detail'); }}>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{test.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{test.controlName}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full w-fit ${typeConfig.color}`}>
                      {typeConfig.icon} {typeConfig.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 capitalize">{test.frequency}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{test.lastRun ? new Date(test.lastRun).toLocaleDateString() : 'Never'}</td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full w-fit ${statusConfig.color}`}>
                      {statusConfig.icon} {statusConfig.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${test.passRate >= 80 ? 'bg-green-500' : test.passRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${test.passRate}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{test.passRate}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => runTest(test.id)} disabled={running === test.id} className="p-1.5 text-gray-400 hover:text-primary-600 rounded" title="Run">
                        {running === test.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button onClick={() => openEdit(test)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => setShowDeleteConfirm(test.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredTests.length === 0 && (
          <div className="text-center py-12">
            <Activity className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No tests match your filters</p>
          </div>
        )}
      </div>
    </div>
  );

  // ── Render: Detail View ───────────────────────────────────────────────

  const renderDetailView = () => {
    if (!selectedTest) return null;
    const typeConfig = TEST_TYPE_CONFIG[selectedTest.testType];
    const statusConfig = STATUS_CONFIG[selectedTest.lastStatus];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => { setViewMode('dashboard'); setSelectedTest(null); setSelectedResult(null); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedTest.name}</h2>
                <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${statusConfig.color}`}>{statusConfig.icon}{statusConfig.label}</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{selectedTest.controlName} &middot; {typeConfig.label} &middot; {selectedTest.frequency}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => runTest(selectedTest.id)} disabled={running === selectedTest.id} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50">
              {running === selectedTest.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Run Test
            </button>
            <button onClick={() => openEdit(selectedTest)} className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition">
              <Edit3 className="w-4 h-4" />
              Edit
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Runs', value: selectedTest.totalRuns, color: 'text-blue-600 dark:text-blue-400' },
            { label: 'Pass Rate', value: `${selectedTest.passRate}%`, color: selectedTest.passRate >= 80 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400' },
            { label: 'Consecutive Passes', value: selectedTest.consecutivePasses, color: 'text-green-600 dark:text-green-400' },
            { label: 'Next Run', value: selectedTest.nextRun ? new Date(selectedTest.nextRun).toLocaleDateString() : 'N/A', color: 'text-gray-600 dark:text-gray-400' },
          ].map((m, i) => (
            <div key={i} className="bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center">
              <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Selected Result Detail */}
        {selectedResult && (
          <div className="bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">Test Result Detail</h3>
              <button onClick={() => setSelectedResult(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="bg-gray-900 dark:bg-black rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">{selectedResult.output}</pre>
            </div>
            {selectedResult.evidenceCaptured && selectedResult.evidenceCaptured.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Evidence Captured</h4>
                <div className="space-y-1">
                  {selectedResult.evidenceCaptured.map((ev, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 p-2 bg-gray-50 dark:bg-surface-700 rounded">
                      <FileText className="w-4 h-4" />
                      {ev}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selectedResult.findings && selectedResult.findings.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Findings ({selectedResult.findings.length})</h4>
                <div className="space-y-2">
                  {selectedResult.findings.map(finding => (
                    <div key={finding.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          finding.severity === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                          finding.severity === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                          finding.severity === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                          finding.severity === 'low' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                          'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}>{finding.severity}</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{finding.title}</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{finding.description}</p>
                      {finding.remediation && (
                        <p className="text-xs text-primary-600 dark:text-primary-400 mt-1 flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {finding.remediation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results History */}
        <div className="bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Execution History</h3>
          {(!selectedTest.results || selectedTest.results.length === 0) ? (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No test results yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedTest.results.map(result => {
                const rStatusConfig = STATUS_CONFIG[result.status];
                return (
                  <button
                    key={result.id}
                    onClick={() => setSelectedResult(selectedResult?.id === result.id ? null : result)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition text-left ${
                      selectedResult?.id === result.id ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-300 dark:border-primary-700' : 'bg-gray-50 dark:bg-surface-700 hover:bg-gray-100 dark:hover:bg-surface-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {rStatusConfig.icon}
                      <div>
                        <p className="text-sm text-gray-900 dark:text-white">{new Date(result.startedAt).toLocaleString()}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{result.testedBy} &middot; {result.findings?.length || 0} findings</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${rStatusConfig.color}`}>{rStatusConfig.label}</span>
                      {result.durationMs && <span className="text-xs text-gray-400">{(result.durationMs / 1000).toFixed(1)}s</span>}
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Render: Create/Edit Form ──────────────────────────────────────────

  const renderForm = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => { setViewMode('list'); setEditingId(null); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editingId ? 'Edit' : 'Create'} Control Test</h2>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Test Name</label>
            <input type="text" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-surface-700 text-gray-900 dark:text-white" placeholder="e.g., MFA Enforcement Check" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-surface-700 text-gray-900 dark:text-white" placeholder="Describe what this test verifies" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Test Type</label>
              <select value={form.testType} onChange={e => setForm({ ...form, testType: e.target.value as TestType })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-surface-700 text-gray-900 dark:text-white text-sm">
                {Object.entries(TEST_TYPE_CONFIG).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Schedule</label>
              <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value as TestFrequency })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-surface-700 text-gray-900 dark:text-white text-sm">
                {FREQUENCIES.map(f => (<option key={f.value} value={f.value}>{f.label}</option>))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Control Name</label>
              <input type="text" value={form.controlName || ''} onChange={e => setForm({ ...form, controlName: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-surface-700 text-gray-900 dark:text-white" placeholder="e.g., CC6.1 - Logical Access" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Framework</label>
              <input type="text" value={form.framework || ''} onChange={e => setForm({ ...form, framework: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-surface-700 text-gray-900 dark:text-white" placeholder="e.g., SOC 2" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Owner</label>
            <input type="text" value={form.owner || ''} onChange={e => setForm({ ...form, owner: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-surface-700 text-gray-900 dark:text-white" placeholder="Test owner" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Automated</span>
            <button
              onClick={() => setForm({ ...form, automated: !form.automated })}
              className={`relative w-11 h-6 rounded-full transition ${form.automated ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.automated ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={() => { setViewMode('list'); setEditingId(null); }} className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
          <button onClick={saveTest} disabled={!form.name} className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">{editingId ? 'Update' : 'Create'} Test</button>
        </div>
      </div>
    </div>
  );

  const renderDeleteConfirm = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDeleteConfirm(null)}>
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Test</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">This will delete the test and all its history.</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
          <button onClick={() => showDeleteConfirm && deleteTest(showDeleteConfirm)} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-surface-800 min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        {viewMode === 'dashboard' && renderDashboard()}
        {viewMode === 'list' && renderTestList()}
        {viewMode === 'detail' && renderDetailView()}
        {(viewMode === 'create' || viewMode === 'edit') && renderForm()}
        {showDeleteConfirm && renderDeleteConfirm()}
      </div>
    </div>
  );
};

export default ControlTestResults;
