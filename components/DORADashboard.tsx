/**
 * DORA (Digital Operational Resilience Act) Compliance Dashboard
 *
 * Comprehensive management interface for DORA compliance:
 * - ICT risk management framework (Article 6-16)
 * - ICT-related incident reporting (Article 17-23)
 * - Digital operational resilience testing (Article 24-27)
 * - Third-party ICT service provider risk management (Article 28-44)
 * - Compliance overview with key metrics and scoring
 *
 * Reference: Regulation (EU) 2022/2554
 */
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Shield, CheckCircle, AlertTriangle, XCircle, Search, Plus, X,
  FileText, Clock, BarChart3, ChevronRight, Edit3, Trash2, Eye, Download,
  AlertCircle, Filter, Calendar, Activity, TrendingUp, Lock, Server,
  Globe, Wifi, Database, Bug, RefreshCw, Users, Building2, Zap, Loader2
} from 'lucide-react';
import { api } from '../services/api';
import { useI18n } from '../contexts/I18nContext';

// ── Types ──────────────────────────────────────────────────────────────

type TabKey = 'overview' | 'ict_risk' | 'incidents' | 'third_party' | 'resilience_testing';

type RiskCategory = 'Cyber' | 'Infrastructure' | 'Software' | 'Cloud' | 'Data';
type Likelihood = 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
type Impact = 'Negligible' | 'Minor' | 'Moderate' | 'Major' | 'Severe';
type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';
type MitigationStatus = 'Not Started' | 'In Progress' | 'Implemented' | 'Verified';

type IncidentType = 'Cyber Attack' | 'System Failure' | 'Data Breach' | 'Third-Party Outage';
type IncidentSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
type IncidentStatus = 'Open' | 'Investigating' | 'Resolved' | 'Reported to Authority';
type NotificationStatus = 'Not Required' | 'Pending' | 'Initial Sent' | 'Intermediate Sent' | 'Final Sent';

type Criticality = 'Critical' | 'Important' | 'Standard';
type ContractStatus = 'Active' | 'Under Review' | 'Renewal Pending' | 'Expired';
type ConcentrationRisk = 'Low' | 'Medium' | 'High';

type TestType = 'TLPT' | 'Scenario' | 'Vulnerability Scan' | 'Penetration Test';
type TestResult = 'Pass' | 'Fail' | 'Partial';

interface ICTRisk {
  id: string;
  riskId: string;
  title: string;
  category: RiskCategory;
  description: string;
  likelihood: Likelihood;
  impact: Impact;
  riskLevel: RiskLevel;
  mitigationStatus: MitigationStatus;
  owner: string;
  reviewDate: string;
}

interface ICTIncident {
  id: string;
  incidentId: string;
  title: string;
  type: IncidentType;
  severity: IncidentSeverity;
  affectedServices: string[];
  detectionTime: string;
  resolutionTime: string | null;
  status: IncidentStatus;
  notificationStatus: NotificationStatus;
  description: string;
  rootCause: string;
}

interface ThirdPartyProvider {
  id: string;
  providerName: string;
  serviceType: string;
  criticality: Criticality;
  contractStatus: ContractStatus;
  exitStrategyExists: boolean;
  concentrationRisk: ConcentrationRisk;
  lastAssessmentDate: string;
  nextReview: string;
  country: string;
  subcontractors: number;
}

interface ResilienceTest {
  id: string;
  testName: string;
  type: TestType;
  scope: string;
  lastExecuted: string;
  result: TestResult;
  nextScheduled: string;
  findingsCount: number;
  description: string;
  testedBy: string;
}

// ── API data mapping helpers ─────────────────────────────────────────

function mapApiRisk(r: any): ICTRisk {
  return {
    id: r.id, riskId: r.riskId || r.id?.substring(0, 8).toUpperCase(),
    title: r.title || r.name || '', category: (r.category as RiskCategory) || 'Cyber',
    description: r.description || '', likelihood: (r.likelihood as Likelihood) || 'Medium',
    impact: (r.impact as Impact) || 'Moderate', riskLevel: (r.riskLevel as RiskLevel) || 'Medium',
    mitigationStatus: (r.mitigationStatus as MitigationStatus) || 'Not Started',
    owner: r.owner || 'Unassigned',
    reviewDate: r.reviewDate ? new Date(r.reviewDate).toLocaleDateString('sv') : 'N/A',
  };
}

function mapApiIncident(i: any): ICTIncident {
  return {
    id: i.id, incidentId: i.incidentId || i.id?.substring(0, 8).toUpperCase(),
    title: i.title || '', type: (i.type as IncidentType) || 'System Failure',
    severity: (i.severity as IncidentSeverity) || 'Medium',
    affectedServices: Array.isArray(i.affectedServices) ? i.affectedServices : [],
    detectionTime: i.detectionTime || i.createdAt || '',
    resolutionTime: i.resolutionTime || null,
    status: (i.status as IncidentStatus) || 'Open',
    notificationStatus: (i.notificationStatus as NotificationStatus) || 'Not Required',
    description: i.description || '', rootCause: i.rootCause || '',
  };
}

function mapApiProvider(p: any): ThirdPartyProvider {
  return {
    id: p.id, providerName: p.providerName || p.name || '',
    serviceType: p.serviceType || '', criticality: (p.criticality as Criticality) || 'Standard',
    contractStatus: (p.contractStatus as ContractStatus) || 'Active',
    exitStrategyExists: p.exitStrategyExists ?? false,
    concentrationRisk: (p.concentrationRisk as ConcentrationRisk) || 'Low',
    lastAssessmentDate: p.lastAssessmentDate ? new Date(p.lastAssessmentDate).toLocaleDateString('sv') : 'N/A',
    nextReview: p.nextReview ? new Date(p.nextReview).toLocaleDateString('sv') : 'N/A',
    country: p.country || '', subcontractors: p.subcontractors ?? 0,
  };
}

function mapApiTest(item: any): ResilienceTest {
  return {
    id: item.id, testName: item.testName || item.name || '',
    type: (item.type as TestType) || 'Vulnerability Scan', scope: item.scope || '',
    lastExecuted: item.lastExecuted ? new Date(item.lastExecuted).toLocaleDateString('sv') : 'N/A',
    result: (item.result as TestResult) || 'Partial',
    nextScheduled: item.nextScheduled ? new Date(item.nextScheduled).toLocaleDateString('sv') : 'N/A',
    findingsCount: item.findingsCount ?? 0, description: item.description || '',
    testedBy: item.testedBy || '',
  };
}

// ── Component ──────────────────────────────────────────────────────────

export const DORADashboard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddRisk, setShowAddRisk] = useState(false);
  const [showAddIncident, setShowAddIncident] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<ICTRisk | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<ICTIncident | null>(null);
  const [editingRisk, setEditingRisk] = useState<ICTRisk | null>(null);
  const [editingIncident, setEditingIncident] = useState<ICTIncident | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Controlled form state for the Add Risk / Report Incident modals
  const [riskForm, setRiskForm] = useState<{ title: string; category: RiskCategory; likelihood: Likelihood; impact: Impact; owner: string; description: string }>({
    title: '', category: 'Cyber', likelihood: 'Medium', impact: 'Moderate', owner: '', description: '',
  });
  const [incidentForm, setIncidentForm] = useState<{ title: string; type: IncidentType; severity: IncidentSeverity; affectedServices: string; description: string }>({
    title: '', type: 'Cyber Attack', severity: 'Medium', affectedServices: '', description: '',
  });
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [editingProviderId, setEditingProviderId] = useState<string | null>(null);
  const [providerForm, setProviderForm] = useState<{ providerName: string; serviceType: string; criticality: Criticality; country: string; exitStrategyExists: boolean }>({
    providerName: '', serviceType: '', criticality: 'Standard', country: '', exitStrategyExists: false,
  });
  const [showAddTest, setShowAddTest] = useState(false);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [testForm, setTestForm] = useState<{ testName: string; type: TestType; scope: string; nextScheduled: string }>({
    testName: '', type: 'Vulnerability Scan', scope: '', nextScheduled: '',
  });

  // API-loaded data
  const [risks, setRisks] = useState<ICTRisk[]>([]);
  const [incidents, setIncidents] = useState<ICTIncident[]>([]);
  const [providers, setProviders] = useState<ThirdPartyProvider[]>([]);
  const [tests, setTests] = useState<ResilienceTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboard, assessments, incidentRes, providerRes, testRes] = await Promise.allSettled([
        api.dora.getDashboard(),
        api.dora.listAssessments(),
        api.dora.listIncidents(),
        api.dora.listProviders(),
        api.dora.listTests(),
      ]);
      if (dashboard.status === 'fulfilled') setDashboardData(dashboard.value);
      if (assessments.status === 'fulfilled') setRisks((assessments.value.data || assessments.value || []).map(mapApiRisk));
      if (incidentRes.status === 'fulfilled') setIncidents((incidentRes.value.data || incidentRes.value || []).map(mapApiIncident));
      if (providerRes.status === 'fulfilled') setProviders((providerRes.value.data || providerRes.value || []).map(mapApiProvider));
      if (testRes.status === 'fulfilled') setTests((testRes.value.data || testRes.value || []).map(mapApiTest));
    } catch (e: any) {
      setError(e?.message || 'Failed to load DORA data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Mutations ────────────────────────────────────────────────────────
  const handleCreateRisk = useCallback(async () => {
    if (!riskForm.title.trim()) { setError('Risk title is required'); return; }
    setSubmitting(true);
    setError(null);
    try {
      await api.dora.createAssessment({
        title: riskForm.title.trim(),
        category: riskForm.category,
        likelihood: riskForm.likelihood,
        impact: riskForm.impact,
        owner: riskForm.owner.trim() || undefined,
        description: riskForm.description.trim() || undefined,
      });
      setShowAddRisk(false);
      setRiskForm({ title: '', category: 'Cyber', likelihood: 'Medium', impact: 'Moderate', owner: '', description: '' });
      await loadAll();
    } catch (e: any) {
      setError(e?.message || 'Failed to create ICT risk');
    } finally {
      setSubmitting(false);
    }
  }, [riskForm, loadAll]);

  const handleUpdateRisk = useCallback(async (id: string, updates: Partial<ICTRisk>) => {
    setSubmitting(true);
    setError(null);
    try {
      await api.dora.updateAssessment(id, updates);
      setEditingRisk(null);
      await loadAll();
    } catch (e: any) {
      setError(e?.message || 'Failed to update ICT risk');
    } finally {
      setSubmitting(false);
    }
  }, [loadAll]);

  const handleDeleteRisk = useCallback(async (id: string) => {
    setError(null);
    const previous = risks;
    setRisks(prev => prev.filter(r => r.id !== id));
    try {
      await api.delete(`/dora/risk-assessments/${id}`);
    } catch (e: any) {
      setRisks(previous);
      setError(e?.message || 'Failed to delete ICT risk');
    }
  }, [risks]);

  const handleCreateIncident = useCallback(async () => {
    if (!incidentForm.title.trim()) { setError('Incident title is required'); return; }
    setSubmitting(true);
    setError(null);
    try {
      await api.dora.createIncident({
        title: incidentForm.title.trim(),
        type: incidentForm.type,
        severity: incidentForm.severity,
        affectedServices: incidentForm.affectedServices.split(',').map(s => s.trim()).filter(Boolean),
        description: incidentForm.description.trim() || undefined,
      });
      setShowAddIncident(false);
      setIncidentForm({ title: '', type: 'Cyber Attack', severity: 'Medium', affectedServices: '', description: '' });
      await loadAll();
    } catch (e: any) {
      setError(e?.message || 'Failed to report ICT incident');
    } finally {
      setSubmitting(false);
    }
  }, [incidentForm, loadAll]);

  const handleUpdateIncident = useCallback(async (id: string, updates: Partial<ICTIncident>) => {
    setSubmitting(true);
    setError(null);
    try {
      await api.dora.updateIncident(id, updates);
      setEditingIncident(null);
      await loadAll();
    } catch (e: any) {
      setError(e?.message || 'Failed to update incident');
    } finally {
      setSubmitting(false);
    }
  }, [loadAll]);

  const handleDeleteProvider = useCallback(async (id: string) => {
    setError(null);
    const previous = providers;
    setProviders(prev => prev.filter(p => p.id !== id));
    try {
      await api.delete(`/dora/third-party-providers/${id}`);
    } catch (e: any) {
      setProviders(previous);
      setError(e?.message || 'Failed to delete provider');
    }
  }, [providers]);

  const handleDeleteTest = useCallback(async (id: string) => {
    setError(null);
    const previous = tests;
    setTests(prev => prev.filter(tst => tst.id !== id));
    try {
      await api.delete(`/dora/resilience-tests/${id}`);
    } catch (e: any) {
      setTests(previous);
      setError(e?.message || 'Failed to delete resilience test');
    }
  }, [tests]);

  // Export the resilience-testing programme as a downloadable CSV (client-side).
  const handleExportTests = useCallback(() => {
    const headers = ['Test Name', 'Type', 'Scope', 'Last Executed', 'Result', 'Findings', 'Next Scheduled', 'Tested By'];
    const escape = (v: string | number) => {
      const s = String(v ?? '');
      const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
      return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
    };
    const rows = tests.map(tst => [tst.testName, tst.type, tst.scope, tst.lastExecuted, tst.result, tst.findingsCount, tst.nextScheduled, tst.testedBy].map(escape).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dora-resilience-tests-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [tests]);

  const handleSaveProvider = useCallback(async () => {
    if (!providerForm.providerName.trim()) { setError('Provider name is required'); return; }
    setSubmitting(true);
    setError(null);
    const payload = {
      providerName: providerForm.providerName.trim(),
      serviceType: providerForm.serviceType.trim() || undefined,
      criticality: providerForm.criticality,
      country: providerForm.country.trim() || undefined,
      exitStrategyExists: providerForm.exitStrategyExists,
    };
    try {
      if (editingProviderId) await api.dora.updateProvider(editingProviderId, payload);
      else await api.dora.createProvider(payload);
      setShowAddProvider(false);
      setEditingProviderId(null);
      setProviderForm({ providerName: '', serviceType: '', criticality: 'Standard', country: '', exitStrategyExists: false });
      await loadAll();
    } catch (e: any) {
      setError(e?.message || 'Failed to save provider');
    } finally {
      setSubmitting(false);
    }
  }, [providerForm, editingProviderId, loadAll]);

  const handleSaveTest = useCallback(async () => {
    if (!testForm.testName.trim()) { setError('Test name is required'); return; }
    setSubmitting(true);
    setError(null);
    const payload = {
      testName: testForm.testName.trim(),
      type: testForm.type,
      scope: testForm.scope.trim() || undefined,
      nextScheduled: testForm.nextScheduled || undefined,
    };
    try {
      if (editingTestId) await api.dora.updateTest(editingTestId, payload);
      else await api.dora.createTest(payload);
      setShowAddTest(false);
      setEditingTestId(null);
      setTestForm({ testName: '', type: 'Vulnerability Scan', scope: '', nextScheduled: '' });
      await loadAll();
    } catch (e: any) {
      setError(e?.message || 'Failed to save resilience test');
    } finally {
      setSubmitting(false);
    }
  }, [testForm, editingTestId, loadAll]);

  // ── Derived Metrics ──────────────────────────────────────────────────
  const rawComplianceScore = dashboardData?.complianceScore;
  const complianceScore = typeof rawComplianceScore === 'number'
    ? rawComplianceScore
    : rawComplianceScore?.overallScore
      ?? (risks.length > 0 ? Math.round(100 - (risks.filter(r => r.riskLevel === 'Critical').length * 12 + risks.filter(r => r.riskLevel === 'High').length * 6)) : 0);
  const criticalRisks = risks.filter(r => r.riskLevel === 'Critical').length;
  const highRisks = risks.filter(r => r.riskLevel === 'High').length;
  const openIncidents = incidents.filter(i => i.status === 'Open' || i.status === 'Investigating').length;
  const criticalProviders = providers.filter(p => p.criticality === 'Critical').length;
  const testsCompleted = tests.length;
  const testsPassed = tests.filter(tst => tst.result === 'Pass').length;
  const testsFailed = tests.filter(tst => tst.result === 'Fail').length;
  const totalFindings = tests.reduce((sum, tst) => sum + tst.findingsCount, 0);
  const reportedIncidents = incidents.filter(i => i.notificationStatus === 'Final Sent' || i.notificationStatus === 'Intermediate Sent' || i.notificationStatus === 'Initial Sent').length;
  const providersWithoutExit = providers.filter(p => !p.exitStrategyExists).length;

  const filteredRisks = useMemo(() => {
    return risks.filter(r => {
      if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
      if (searchQuery && !r.riskId.toLowerCase().includes(searchQuery.toLowerCase()) && !r.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [risks, categoryFilter, searchQuery]);

  const filteredIncidents = useMemo(() => {
    return incidents.filter(i => {
      if (searchQuery && !i.incidentId.toLowerCase().includes(searchQuery.toLowerCase()) && !i.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [incidents, searchQuery]);

  // ── Helper Functions ─────────────────────────────────────────────────
  const riskLevelBg = (level: RiskLevel) => level === 'Critical' ? 'bg-signal-bad/10 text-signal-bad' : level === 'High' ? 'bg-signal-warn/10 text-signal-warn' : level === 'Medium' ? 'bg-signal-amber/10 text-signal-amber' : 'bg-signal-good/10 text-signal-good';
  const severityBg = (s: IncidentSeverity) => s === 'Critical' ? 'bg-signal-bad/10 text-signal-bad' : s === 'High' ? 'bg-signal-warn/10 text-signal-warn' : s === 'Medium' ? 'bg-signal-amber/10 text-signal-amber' : 'bg-signal-good/10 text-signal-good';
  const statusBg = (s: IncidentStatus) => s === 'Reported to Authority' ? 'bg-signal-blue/10 text-signal-blue' : s === 'Resolved' ? 'bg-signal-good/10 text-signal-good' : s === 'Investigating' ? 'bg-signal-amber/10 text-signal-amber' : 'bg-signal-bad/10 text-signal-bad';
  const mitigationBg = (s: MitigationStatus) => s === 'Verified' ? 'bg-signal-good/10 text-signal-good' : s === 'Implemented' ? 'bg-signal-blue/10 text-signal-blue' : s === 'In Progress' ? 'bg-signal-amber/10 text-signal-amber' : 'bg-white/[0.06] text-signal-muted';
  const criticalityBg = (c: Criticality) => c === 'Critical' ? 'bg-signal-bad/10 text-signal-bad' : c === 'Important' ? 'bg-signal-amber/10 text-signal-amber' : 'bg-white/[0.06] text-signal-muted';
  const testResultBg = (r: TestResult) => r === 'Pass' ? 'bg-signal-good/10 text-signal-good' : r === 'Fail' ? 'bg-signal-bad/10 text-signal-bad' : 'bg-signal-amber/10 text-signal-amber';
  const contractBg = (s: ContractStatus) => s === 'Active' ? 'bg-signal-good/10 text-signal-good' : s === 'Renewal Pending' ? 'bg-signal-amber/10 text-signal-amber' : s === 'Under Review' ? 'bg-signal-blue/10 text-signal-blue' : 'bg-signal-bad/10 text-signal-bad';
  const concentrationBg = (c: ConcentrationRisk) => c === 'High' ? 'bg-signal-bad/10 text-signal-bad' : c === 'Medium' ? 'bg-signal-amber/10 text-signal-amber' : 'bg-signal-good/10 text-signal-good';

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: t('common.overview'), icon: <BarChart3 size={15} /> },
    { key: 'ict_risk', label: 'ICT Risk Management', icon: <Shield size={15} /> },
    { key: 'incidents', label: 'Incident Reporting', icon: <AlertTriangle size={15} /> },
    { key: 'third_party', label: 'Third-Party Risk', icon: <Building2 size={15} /> },
    { key: 'resilience_testing', label: 'Resilience Testing', icon: <Activity size={15} /> },
  ];

  // ── Overview Tab ─────────────────────────────────────────────────────
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-signal-muted">Compliance Score</span>
            <Shield size={18} className="text-signal-blue" />
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-14 h-14">
              <svg viewBox="0 0 36 36" className="w-14 h-14 transform -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke={complianceScore >= 80 ? '#34C88A' : complianceScore >= 60 ? '#E8B93A' : '#F87171'} strokeWidth="3" strokeDasharray={`${complianceScore} ${100 - complianceScore}`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-signal-ink">{complianceScore}%</span>
            </div>
            <div>
              <div className="text-2xl font-bold font-display text-signal-ink">{complianceScore}%</div>
              <div className="text-xs text-signal-muted">DORA Readiness</div>
            </div>
          </div>
        </div>
        {[
          { label: 'ICT Risk Events', value: risks.length, sub: `${criticalRisks} critical`, icon: AlertCircle, color: 'text-signal-bad' },
          { label: 'Third-Party Providers', value: providers.length, sub: `${criticalProviders} critical`, icon: Building2, color: 'text-signal-violet' },
          { label: 'Incidents Filed', value: reportedIncidents, sub: `${openIncidents} open`, icon: FileText, color: 'text-signal-warn' },
          { label: 'Resilience Tests', value: testsCompleted, sub: `${testsPassed} passed`, icon: Activity, color: 'text-signal-good' },
        ].map(m => (
          <div key={m.label} className="bg-white/[0.03] rounded-2xl p-5 border border-white/[0.06]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-signal-muted">{m.label}</span>
              <m.icon size={18} className={m.color} />
            </div>
            <div className="text-2xl font-bold font-display text-signal-ink">{m.value}</div>
            <div className="text-xs text-signal-muted mt-1">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution */}
        <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/[0.06]">
          <h3 className="text-lg font-semibold font-display text-signal-ink mb-4">ICT Risk Level Distribution</h3>
          <div className="space-y-3">
            {[
              { label: 'Critical', count: criticalRisks, pct: Math.round((criticalRisks / risks.length) * 100), color: 'bg-signal-bad' },
              { label: 'High', count: highRisks, pct: Math.round((highRisks / risks.length) * 100), color: 'bg-signal-warn' },
              { label: 'Medium', count: risks.filter(r => r.riskLevel === 'Medium').length, pct: Math.round((risks.filter(r => r.riskLevel === 'Medium').length / risks.length) * 100), color: 'bg-signal-amber' },
              { label: 'Low', count: risks.filter(r => r.riskLevel === 'Low').length, pct: Math.round((risks.filter(r => r.riskLevel === 'Low').length / risks.length) * 100), color: 'bg-signal-good' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-signal-body">{item.label}</span>
                  <span className="text-signal-ink font-medium">{item.count} ({item.pct}%)</span>
                </div>
                <div className="h-2 bg-white/[0.08] rounded-full">
                  <div className={`h-2 ${item.color} rounded-full transition-all`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Incidents */}
        <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/[0.06]">
          <h3 className="text-lg font-semibold font-display text-signal-ink mb-4">Recent ICT Incidents</h3>
          <div className="space-y-3">
            {incidents.slice(0, 4).map(inc => (
              <div key={inc.id} className="flex items-center justify-between p-3 bg-signal-canvas rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-signal-muted font-mono">{inc.incidentId}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${severityBg(inc.severity)}`}>{inc.severity}</span>
                  </div>
                  <p className="text-sm text-signal-ink truncate mt-1">{inc.title}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ml-3 whitespace-nowrap ${statusBg(inc.status)}`}>{inc.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Third-Party Concentration */}
        <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/[0.06]">
          <h3 className="text-lg font-semibold font-display text-signal-ink mb-4">Third-Party Provider Overview</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-signal-canvas rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-signal-bad">{criticalProviders}</div>
              <div className="text-xs text-signal-muted">Critical Providers</div>
            </div>
            <div className="bg-signal-canvas rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-signal-warn">{providersWithoutExit}</div>
              <div className="text-xs text-signal-muted">Missing Exit Strategy</div>
            </div>
          </div>
          <div className="space-y-2">
            {providers.filter(p => p.criticality === 'Critical').map(p => (
              <div key={p.id} className="flex items-center justify-between p-2 bg-signal-canvas rounded">
                <div>
                  <span className="text-sm text-signal-ink">{p.providerName}</span>
                  <span className="text-xs text-signal-muted ml-2">{p.serviceType.split('(')[0].trim()}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${concentrationBg(p.concentrationRisk)}`}>{p.concentrationRisk} risk</span>
              </div>
            ))}
          </div>
        </div>

        {/* Resilience Testing Summary */}
        <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/[0.06]">
          <h3 className="text-lg font-semibold font-display text-signal-ink mb-4">Resilience Testing Summary</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-signal-canvas rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-signal-good">{testsPassed}</div>
              <div className="text-xs text-signal-muted">Passed</div>
            </div>
            <div className="bg-signal-canvas rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-signal-warn">{tests.filter(tst => tst.result === 'Partial').length}</div>
              <div className="text-xs text-signal-muted">Partial</div>
            </div>
            <div className="bg-signal-canvas rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-signal-bad">{testsFailed}</div>
              <div className="text-xs text-signal-muted">Failed</div>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-signal-canvas rounded-lg">
            <span className="text-sm text-signal-body">Total Open Findings</span>
            <span className="text-lg font-bold text-signal-warn">{totalFindings}</span>
          </div>
          <div className="mt-3 space-y-2">
            {tests.filter(tst => tst.result === 'Fail').map(tst => (
              <div key={tst.id} className="flex items-center gap-2 p-2 bg-signal-bad/10 border border-signal-bad/20 rounded">
                <XCircle size={14} className="text-signal-bad flex-shrink-0" />
                <span className="text-sm text-signal-bad">{tst.testName}</span>
                <span className="text-xs text-signal-bad ml-auto">{tst.findingsCount} findings</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ── ICT Risk Management Tab ──────────────────────────────────────────
  const renderICTRisk = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 sm:max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-signal-muted" />
            <input
              type="text"
              placeholder="Search risks..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white/[0.04] border border-white/[0.10] rounded-xl text-signal-ink text-sm placeholder-signal-muted"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-white/[0.04] border border-white/[0.10] rounded-xl text-signal-ink text-sm"
          >
            <option value="all">All Categories</option>
            {(['Cyber', 'Infrastructure', 'Software', 'Cloud', 'Data'] as RiskCategory[]).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <button onClick={() => setShowAddRisk(true)} className="flex items-center gap-2 px-4 py-2 bg-signal-green text-signal-canvas font-medium rounded-lg text-sm hover:bg-signal-green/90">
          <Plus size={16} />Add Risk
        </button>
      </div>

      <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left p-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Risk ID</th>
                <th className="text-left p-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Title</th>
                <th className="text-left p-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Category</th>
                <th className="text-left p-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Likelihood</th>
                <th className="text-left p-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Impact</th>
                <th className="text-left p-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Risk Level</th>
                <th className="text-left p-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Mitigation</th>
                <th className="text-left p-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Owner</th>
                <th className="text-left p-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Review Date</th>
                <th className="text-left p-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRisks.map(risk => (
                <tr key={risk.id} className="border-b border-white/[0.06] hover:bg-white/[0.04]">
                  <td className="p-3 font-mono text-xs text-signal-body">{risk.riskId}</td>
                  <td className="p-3 text-signal-ink max-w-[200px] truncate">{risk.title}</td>
                  <td className="p-3"><span className="text-xs px-2 py-1 rounded bg-white/[0.06] text-signal-body">{risk.category}</span></td>
                  <td className="p-3 text-signal-body">{risk.likelihood}</td>
                  <td className="p-3 text-signal-body">{risk.impact}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full ${riskLevelBg(risk.riskLevel)}`}>{risk.riskLevel}</span></td>
                  <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full ${mitigationBg(risk.mitigationStatus)}`}>{risk.mitigationStatus}</span></td>
                  <td className="p-3 text-signal-body whitespace-nowrap">{risk.owner}</td>
                  <td className="p-3 text-signal-muted whitespace-nowrap">{risk.reviewDate}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setSelectedRisk(risk)} className="p-1.5 hover:bg-white/[0.06] rounded" title="View"><Eye size={14} className="text-signal-muted" /></button>
                      <button onClick={() => setEditingRisk(risk)} className="p-1.5 hover:bg-white/[0.06] rounded" title="Edit"><Edit3 size={14} className="text-signal-muted" /></button>
                      <button onClick={() => { if (window.confirm(`Delete risk "${risk.title}"? This cannot be undone.`)) handleDeleteRisk(risk.id); }} className="p-1.5 hover:bg-white/[0.06] rounded" title="Delete"><Trash2 size={14} className="text-signal-bad" /></button>
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

  // ── Incident Reporting Tab ───────────────────────────────────────────
  const renderIncidents = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative flex-1 sm:max-w-xs w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-signal-muted" />
          <input
            type="text"
            placeholder="Search incidents..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white/[0.04] border border-white/[0.10] rounded-xl text-signal-ink text-sm placeholder-signal-muted"
          />
        </div>
        <button onClick={() => setShowAddIncident(true)} className="flex items-center gap-2 px-4 py-2 bg-signal-green text-signal-canvas font-medium rounded-lg text-sm hover:bg-signal-green/90">
          <Plus size={16} />Report Incident
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
        {[
          { label: 'Open Incidents', value: incidents.filter(i => i.status === 'Open').length, color: 'text-signal-bad', icon: AlertCircle },
          { label: 'Under Investigation', value: incidents.filter(i => i.status === 'Investigating').length, color: 'text-signal-warn', icon: Search },
          { label: 'Resolved', value: incidents.filter(i => i.status === 'Resolved').length, color: 'text-signal-good', icon: CheckCircle },
          { label: 'Reported to Authority', value: incidents.filter(i => i.status === 'Reported to Authority').length, color: 'text-signal-blue', icon: FileText },
        ].map(m => (
          <div key={m.label} className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.06]">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-signal-muted">{m.label}</span>
              <m.icon size={16} className={m.color} />
            </div>
            <div className={`text-xl font-bold ${m.color}`}>{m.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left p-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Incident ID</th>
                <th className="text-left p-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Title</th>
                <th className="text-left p-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Type</th>
                <th className="text-left p-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Severity</th>
                <th className="text-left p-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Affected Services</th>
                <th className="text-left p-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Detection</th>
                <th className="text-left p-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Resolution</th>
                <th className="text-left p-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Status</th>
                <th className="text-left p-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Notification</th>
                <th className="text-left p-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.map(inc => (
                <tr key={inc.id} className="border-b border-white/[0.06] hover:bg-white/[0.04]">
                  <td className="p-3 font-mono text-xs text-signal-body">{inc.incidentId}</td>
                  <td className="p-3 text-signal-ink max-w-[180px] truncate">{inc.title}</td>
                  <td className="p-3"><span className="text-xs px-2 py-1 rounded bg-white/[0.06] text-signal-body whitespace-nowrap">{inc.type}</span></td>
                  <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full ${severityBg(inc.severity)}`}>{inc.severity}</span></td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1 max-w-[160px]">
                      {inc.affectedServices.slice(0, 2).map(s => <span key={s} className="text-xs bg-white/[0.06] text-signal-body px-1.5 py-0.5 rounded">{s}</span>)}
                      {inc.affectedServices.length > 2 && <span className="text-xs text-signal-muted">+{inc.affectedServices.length - 2}</span>}
                    </div>
                  </td>
                  <td className="p-3 text-signal-muted text-xs whitespace-nowrap">{new Date(inc.detectionTime).toLocaleDateString()}</td>
                  <td className="p-3 text-signal-muted text-xs whitespace-nowrap">{inc.resolutionTime ? new Date(inc.resolutionTime).toLocaleDateString() : <span className="text-signal-warn">Ongoing</span>}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${statusBg(inc.status)}`}>{inc.status}</span></td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                      inc.notificationStatus === 'Final Sent' ? 'bg-signal-good/10 text-signal-good' :
                      inc.notificationStatus === 'Not Required' ? 'bg-white/[0.06] text-signal-muted' :
                      inc.notificationStatus === 'Pending' ? 'bg-signal-bad/10 text-signal-bad' :
                      'bg-signal-blue/10 text-signal-blue'
                    }`}>{inc.notificationStatus}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setSelectedIncident(inc)} className="p-1.5 hover:bg-white/[0.06] rounded" title="View"><Eye size={14} className="text-signal-muted" /></button>
                      <button onClick={() => setEditingIncident(inc)} className="p-1.5 hover:bg-white/[0.06] rounded" title="Edit"><Edit3 size={14} className="text-signal-muted" /></button>
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

  // ── Third-Party Risk Tab ─────────────────────────────────────────────
  const renderThirdParty = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h3 className="text-lg font-semibold font-display text-signal-ink">ICT Third-Party Service Provider Register</h3>
        <button onClick={() => setShowAddProvider(true)} className="flex items-center gap-2 px-4 py-2 bg-signal-green text-signal-canvas font-medium rounded-lg text-sm hover:bg-signal-green/90">
          <Plus size={16} />Add Provider
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
        {[
          { label: 'Total Providers', value: providers.length, color: 'text-signal-blue', icon: Building2 },
          { label: 'Critical Providers', value: criticalProviders, color: 'text-signal-bad', icon: AlertCircle },
          { label: 'No Exit Strategy', value: providersWithoutExit, color: 'text-signal-warn', icon: AlertTriangle },
          { label: 'High Concentration', value: providers.filter(p => p.concentrationRisk === 'High').length, color: 'text-signal-warn', icon: Zap },
        ].map(m => (
          <div key={m.label} className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.06]">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-signal-muted">{m.label}</span>
              <m.icon size={16} className={m.color} />
            </div>
            <div className={`text-xl font-bold ${m.color}`}>{m.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left p-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Provider Name</th>
                <th className="text-left p-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Service Type</th>
                <th className="text-left p-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Criticality</th>
                <th className="text-left p-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Contract</th>
                <th className="text-left p-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Exit Strategy</th>
                <th className="text-left p-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Concentration Risk</th>
                <th className="text-left p-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Country</th>
                <th className="text-left p-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Last Assessment</th>
                <th className="text-left p-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Next Review</th>
                <th className="text-left p-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {providers.map(p => (
                <tr key={p.id} className="border-b border-white/[0.06] hover:bg-white/[0.04]">
                  <td className="p-3 text-signal-ink font-medium whitespace-nowrap">{p.providerName}</td>
                  <td className="p-3 text-signal-body max-w-[180px] truncate">{p.serviceType}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full ${criticalityBg(p.criticality)}`}>{p.criticality}</span></td>
                  <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full ${contractBg(p.contractStatus)}`}>{p.contractStatus}</span></td>
                  <td className="p-3 text-center">
                    {p.exitStrategyExists
                      ? <CheckCircle size={16} className="text-signal-good inline" />
                      : <XCircle size={16} className="text-signal-bad inline" />
                    }
                  </td>
                  <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full ${concentrationBg(p.concentrationRisk)}`}>{p.concentrationRisk}</span></td>
                  <td className="p-3 text-signal-body whitespace-nowrap">{p.country}</td>
                  <td className="p-3 text-signal-muted whitespace-nowrap">{p.lastAssessmentDate}</td>
                  <td className="p-3 text-signal-muted whitespace-nowrap">{p.nextReview}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setProviderForm({ providerName: p.providerName, serviceType: p.serviceType, criticality: p.criticality, country: p.country, exitStrategyExists: p.exitStrategyExists }); setEditingProviderId(p.id); setShowAddProvider(true); }}
                        className="p-1.5 hover:bg-white/[0.06] rounded" title="Edit"><Edit3 size={14} className="text-signal-muted" /></button>
                      <button onClick={() => { if (window.confirm(`Delete provider "${p.providerName}"? This cannot be undone.`)) handleDeleteProvider(p.id); }} className="p-1.5 hover:bg-white/[0.06] rounded" title="Delete"><Trash2 size={14} className="text-signal-bad" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Concentration Risk Warning */}
      {providers.filter(p => p.concentrationRisk === 'High').length > 0 && (
        <div className="bg-signal-warn/10 border border-signal-warn/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-signal-warn flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-signal-warn">Concentration Risk Alert</h4>
              <p className="text-sm text-signal-body mt-1">
                {providers.filter(p => p.concentrationRisk === 'High').length} providers have high concentration risk. DORA Article 29 requires financial entities to identify and assess concentration risk at entity and group level. Consider alternative providers or mitigation measures.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {providers.filter(p => p.concentrationRisk === 'High').map(p => (
                  <span key={p.id} className="text-xs bg-signal-warn/10 text-signal-warn px-2 py-1 rounded">{p.providerName}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ── Resilience Testing Tab ───────────────────────────────────────────
  const renderResilienceTesting = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h3 className="text-lg font-semibold font-display text-signal-ink">Digital Operational Resilience Testing Programme</h3>
        <div className="flex items-center gap-2">
          <button onClick={handleExportTests} disabled={tests.length === 0} className="flex items-center gap-2 px-3 py-2 bg-white/[0.06] text-signal-ink rounded-lg text-sm hover:bg-white/[0.10] disabled:opacity-50 disabled:cursor-not-allowed">
            <Download size={16} />Export Report
          </button>
          <button onClick={() => { setEditingTestId(null); setTestForm({ testName: '', type: 'Vulnerability Scan', scope: '', nextScheduled: '' }); setShowAddTest(true); }} className="flex items-center gap-2 px-4 py-2 bg-signal-green text-signal-canvas font-medium rounded-lg text-sm hover:bg-signal-green/90">
            <Plus size={16} />Schedule Test
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
        {[
          { label: 'Tests Conducted', value: tests.length, color: 'text-signal-blue', icon: Activity },
          { label: 'Pass Rate', value: `${Math.round((testsPassed / tests.length) * 100)}%`, color: 'text-signal-good', icon: CheckCircle },
          { label: 'Open Findings', value: totalFindings, color: 'text-signal-warn', icon: Bug },
          { label: 'TLPT Completed', value: tests.filter(tst => tst.type === 'TLPT').length, color: 'text-signal-violet', icon: Shield },
        ].map(m => (
          <div key={m.label} className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.06]">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-signal-muted">{m.label}</span>
              <m.icon size={16} className={m.color} />
            </div>
            <div className={`text-xl font-bold ${m.color}`}>{m.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left p-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Test Name</th>
                <th className="text-left p-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Type</th>
                <th className="text-left p-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Scope</th>
                <th className="text-left p-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Last Executed</th>
                <th className="text-left p-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Result</th>
                <th className="text-left p-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Findings</th>
                <th className="text-left p-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Next Scheduled</th>
                <th className="text-left p-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Tested By</th>
                <th className="text-left p-3 text-signal-muted font-mono text-[10px] uppercase tracking-[0.14em]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tests.map(tst => (
                <tr key={tst.id} className="border-b border-white/[0.06] hover:bg-white/[0.04]">
                  <td className="p-3 text-signal-ink font-medium max-w-[200px] truncate">{tst.testName}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded ${
                      tst.type === 'TLPT' ? 'bg-signal-violet/10 text-signal-violet' :
                      tst.type === 'Penetration Test' ? 'bg-signal-blue/10 text-signal-blue' :
                      tst.type === 'Vulnerability Scan' ? 'bg-signal-blue/10 text-signal-blue' :
                      'bg-white/[0.06] text-signal-body'
                    }`}>{tst.type}</span>
                  </td>
                  <td className="p-3 text-signal-body max-w-[200px] truncate">{tst.scope}</td>
                  <td className="p-3 text-signal-muted whitespace-nowrap">{tst.lastExecuted}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full ${testResultBg(tst.result)}`}>{tst.result}</span></td>
                  <td className="p-3">
                    <span className={`text-sm font-medium ${tst.findingsCount > 5 ? 'text-signal-warn' : tst.findingsCount > 0 ? 'text-signal-body' : 'text-signal-good'}`}>
                      {tst.findingsCount}
                    </span>
                  </td>
                  <td className="p-3 text-signal-muted whitespace-nowrap">{tst.nextScheduled}</td>
                  <td className="p-3 text-signal-body max-w-[150px] truncate">{tst.testedBy}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setTestForm({ testName: tst.testName, type: tst.type, scope: tst.scope, nextScheduled: '' }); setEditingTestId(tst.id); setShowAddTest(true); }}
                        className="p-1.5 hover:bg-white/[0.06] rounded" title="View / Edit"><Eye size={14} className="text-signal-muted" /></button>
                      <button onClick={handleExportTests} className="p-1.5 hover:bg-white/[0.06] rounded" title="Export"><Download size={14} className="text-signal-muted" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* TLPT Notice */}
      <div className="bg-signal-violet/10 border border-signal-violet/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Shield size={20} className="text-signal-violet flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-signal-violet">Threat-Led Penetration Testing (TLPT)</h4>
            <p className="text-sm text-signal-body mt-1">
              Under DORA Article 26, financial entities identified by competent authorities must conduct TLPT at least every 3 years. TLPT must be carried out in accordance with the TIBER-EU framework and cover critical or important functions on live production systems.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Modals ───────────────────────────────────────────────────────────

  const renderRiskDetailModal = () => selectedRisk && (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedRisk(null)}>
      <div className="bg-signal-panel2 rounded-2xl border border-white/[0.08] w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-signal-muted">{selectedRisk.riskId}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${riskLevelBg(selectedRisk.riskLevel)}`}>{selectedRisk.riskLevel}</span>
            </div>
            <h3 className="text-lg font-semibold font-display text-signal-ink mt-1">{selectedRisk.title}</h3>
          </div>
          <button onClick={() => setSelectedRisk(null)} className="p-1 hover:bg-white/[0.06] rounded"><X size={18} className="text-signal-muted" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-signal-muted mb-1">Description</label>
            <p className="text-sm text-signal-ink">{selectedRisk.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-signal-muted mb-1">Category</label>
              <span className="text-sm text-signal-ink">{selectedRisk.category}</span>
            </div>
            <div>
              <label className="block text-sm text-signal-muted mb-1">Owner</label>
              <span className="text-sm text-signal-ink">{selectedRisk.owner}</span>
            </div>
            <div>
              <label className="block text-sm text-signal-muted mb-1">Likelihood</label>
              <span className="text-sm text-signal-ink">{selectedRisk.likelihood}</span>
            </div>
            <div>
              <label className="block text-sm text-signal-muted mb-1">Impact</label>
              <span className="text-sm text-signal-ink">{selectedRisk.impact}</span>
            </div>
            <div>
              <label className="block text-sm text-signal-muted mb-1">Mitigation Status</label>
              <span className={`text-xs px-2 py-1 rounded-full ${mitigationBg(selectedRisk.mitigationStatus)}`}>{selectedRisk.mitigationStatus}</span>
            </div>
            <div>
              <label className="block text-sm text-signal-muted mb-1">Next Review</label>
              <span className="text-sm text-signal-ink">{selectedRisk.reviewDate}</span>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-white/[0.06]">
          <button onClick={() => setSelectedRisk(null)} className="px-4 py-2 text-sm text-signal-muted hover:text-signal-ink">Close</button>
          <button onClick={() => { setEditingRisk(selectedRisk); setSelectedRisk(null); }} className="px-4 py-2 bg-signal-green text-signal-canvas font-medium rounded-lg text-sm hover:bg-signal-green/90">Edit Risk</button>
        </div>
      </div>
    </div>
  );

  const renderIncidentDetailModal = () => selectedIncident && (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedIncident(null)}>
      <div className="bg-signal-panel2 rounded-2xl border border-white/[0.08] w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-signal-muted">{selectedIncident.incidentId}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${severityBg(selectedIncident.severity)}`}>{selectedIncident.severity}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusBg(selectedIncident.status)}`}>{selectedIncident.status}</span>
            </div>
            <h3 className="text-lg font-semibold font-display text-signal-ink mt-1">{selectedIncident.title}</h3>
          </div>
          <button onClick={() => setSelectedIncident(null)} className="p-1 hover:bg-white/[0.06] rounded"><X size={18} className="text-signal-muted" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-signal-muted mb-1">Description</label>
            <p className="text-sm text-signal-ink">{selectedIncident.description}</p>
          </div>
          <div>
            <label className="block text-sm text-signal-muted mb-1">Root Cause</label>
            <p className="text-sm text-signal-ink">{selectedIncident.rootCause}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-signal-muted mb-1">Type</label>
              <span className="text-sm text-signal-ink">{selectedIncident.type}</span>
            </div>
            <div>
              <label className="block text-sm text-signal-muted mb-1">Notification Status</label>
              <span className="text-sm text-signal-ink">{selectedIncident.notificationStatus}</span>
            </div>
            <div>
              <label className="block text-sm text-signal-muted mb-1">Detection Time</label>
              <span className="text-sm text-signal-ink">{new Date(selectedIncident.detectionTime).toLocaleString()}</span>
            </div>
            <div>
              <label className="block text-sm text-signal-muted mb-1">Resolution Time</label>
              <span className="text-sm text-signal-ink">{selectedIncident.resolutionTime ? new Date(selectedIncident.resolutionTime).toLocaleString() : 'Ongoing'}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm text-signal-muted mb-1">Affected Services</label>
            <div className="flex flex-wrap gap-2">
              {selectedIncident.affectedServices.map(s => (
                <span key={s} className="text-xs bg-white/[0.06] text-signal-body px-2 py-1 rounded">{s}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-white/[0.06]">
          <button onClick={() => setSelectedIncident(null)} className="px-4 py-2 text-sm text-signal-muted hover:text-signal-ink">Close</button>
          <button onClick={() => { setEditingIncident(selectedIncident); setSelectedIncident(null); }} className="px-4 py-2 bg-signal-green text-signal-canvas font-medium rounded-lg text-sm hover:bg-signal-green/90">Update Status</button>
        </div>
      </div>
    </div>
  );

  const renderAddRiskModal = () => showAddRisk && (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowAddRisk(false)}>
      <div className="bg-signal-panel2 rounded-2xl border border-white/[0.08] w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h3 className="text-lg font-semibold font-display text-signal-ink">Add ICT Risk</h3>
          <button onClick={() => setShowAddRisk(false)} className="p-1 hover:bg-white/[0.06] rounded"><X size={18} className="text-signal-muted" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-signal-muted mb-1">Risk Title</label>
            <input type="text" value={riskForm.title} onChange={e => setRiskForm(f => ({ ...f, title: e.target.value }))} placeholder="Enter risk title..." className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.10] rounded-xl text-signal-ink text-sm" />
          </div>
          <div>
            <label className="block text-sm text-signal-muted mb-1">Category</label>
            <select value={riskForm.category} onChange={e => setRiskForm(f => ({ ...f, category: e.target.value as RiskCategory }))} className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.10] rounded-xl text-signal-ink text-sm">
              {(['Cyber', 'Infrastructure', 'Software', 'Cloud', 'Data'] as RiskCategory[]).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-signal-muted mb-1">Likelihood</label>
              <select value={riskForm.likelihood} onChange={e => setRiskForm(f => ({ ...f, likelihood: e.target.value as Likelihood }))} className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.10] rounded-xl text-signal-ink text-sm">
                {(['Very Low', 'Low', 'Medium', 'High', 'Very High'] as Likelihood[]).map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-signal-muted mb-1">Impact</label>
              <select value={riskForm.impact} onChange={e => setRiskForm(f => ({ ...f, impact: e.target.value as Impact }))} className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.10] rounded-xl text-signal-ink text-sm">
                {(['Negligible', 'Minor', 'Moderate', 'Major', 'Severe'] as Impact[]).map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-signal-muted mb-1">Owner</label>
            <input type="text" value={riskForm.owner} onChange={e => setRiskForm(f => ({ ...f, owner: e.target.value }))} placeholder="Risk owner..." className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.10] rounded-xl text-signal-ink text-sm" />
          </div>
          <div>
            <label className="block text-sm text-signal-muted mb-1">Description</label>
            <textarea value={riskForm.description} onChange={e => setRiskForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the risk..." className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.10] rounded-xl text-signal-ink text-sm h-20 resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-white/[0.06]">
          <button onClick={() => setShowAddRisk(false)} className="px-4 py-2 text-sm text-signal-muted">Cancel</button>
          <button onClick={handleCreateRisk} disabled={submitting || !riskForm.title.trim()} className="px-4 py-2 bg-signal-green text-signal-canvas font-medium rounded-lg text-sm hover:bg-signal-green/90 disabled:opacity-50 disabled:cursor-not-allowed">{submitting ? 'Saving...' : 'Add Risk'}</button>
        </div>
      </div>
    </div>
  );

  const renderAddIncidentModal = () => showAddIncident && (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowAddIncident(false)}>
      <div className="bg-signal-panel2 rounded-2xl border border-white/[0.08] w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h3 className="text-lg font-semibold font-display text-signal-ink">Report ICT Incident</h3>
          <button onClick={() => setShowAddIncident(false)} className="p-1 hover:bg-white/[0.06] rounded"><X size={18} className="text-signal-muted" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-signal-muted mb-1">Incident Title</label>
            <input type="text" value={incidentForm.title} onChange={e => setIncidentForm(f => ({ ...f, title: e.target.value }))} placeholder="Enter incident title..." className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.10] rounded-xl text-signal-ink text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-signal-muted mb-1">Type</label>
              <select value={incidentForm.type} onChange={e => setIncidentForm(f => ({ ...f, type: e.target.value as IncidentType }))} className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.10] rounded-xl text-signal-ink text-sm">
                {(['Cyber Attack', 'System Failure', 'Data Breach', 'Third-Party Outage'] as IncidentType[]).map(it => <option key={it} value={it}>{it}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-signal-muted mb-1">Severity</label>
              <select value={incidentForm.severity} onChange={e => setIncidentForm(f => ({ ...f, severity: e.target.value as IncidentSeverity }))} className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.10] rounded-xl text-signal-ink text-sm">
                {(['Low', 'Medium', 'High', 'Critical'] as IncidentSeverity[]).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-signal-muted mb-1">Affected Services</label>
            <input type="text" value={incidentForm.affectedServices} onChange={e => setIncidentForm(f => ({ ...f, affectedServices: e.target.value }))} placeholder="Comma-separated services..." className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.10] rounded-xl text-signal-ink text-sm" />
          </div>
          <div>
            <label className="block text-sm text-signal-muted mb-1">Description</label>
            <textarea value={incidentForm.description} onChange={e => setIncidentForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the incident..." className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.10] rounded-xl text-signal-ink text-sm h-20 resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-white/[0.06]">
          <button onClick={() => setShowAddIncident(false)} className="px-4 py-2 text-sm text-signal-muted">Cancel</button>
          <button onClick={handleCreateIncident} disabled={submitting || !incidentForm.title.trim()} className="px-4 py-2 bg-signal-green text-signal-canvas font-medium rounded-lg text-sm hover:bg-signal-green/90 disabled:opacity-50 disabled:cursor-not-allowed">{submitting ? 'Saving...' : 'Report Incident'}</button>
        </div>
      </div>
    </div>
  );

  const renderEditRiskModal = () => editingRisk && (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setEditingRisk(null)}>
      <div className="bg-signal-panel2 rounded-2xl border border-white/[0.08] w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h3 className="text-lg font-semibold font-display text-signal-ink">Edit ICT Risk</h3>
          <button onClick={() => setEditingRisk(null)} className="p-1 hover:bg-white/[0.06] rounded"><X size={18} className="text-signal-muted" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-signal-muted mb-1">Risk Title</label>
            <input type="text" value={editingRisk.title} onChange={e => setEditingRisk(r => r ? { ...r, title: e.target.value } : r)} className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.10] rounded-xl text-signal-ink text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-signal-muted mb-1">Risk Level</label>
              <select value={editingRisk.riskLevel} onChange={e => setEditingRisk(r => r ? { ...r, riskLevel: e.target.value as RiskLevel } : r)} className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.10] rounded-xl text-signal-ink text-sm">
                {(['Low', 'Medium', 'High', 'Critical'] as RiskLevel[]).map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-signal-muted mb-1">Mitigation Status</label>
              <select value={editingRisk.mitigationStatus} onChange={e => setEditingRisk(r => r ? { ...r, mitigationStatus: e.target.value as MitigationStatus } : r)} className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.10] rounded-xl text-signal-ink text-sm">
                {(['Not Started', 'In Progress', 'Implemented', 'Verified'] as MitigationStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-signal-muted mb-1">Owner</label>
            <input type="text" value={editingRisk.owner} onChange={e => setEditingRisk(r => r ? { ...r, owner: e.target.value } : r)} className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.10] rounded-xl text-signal-ink text-sm" />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-white/[0.06]">
          <button onClick={() => setEditingRisk(null)} className="px-4 py-2 text-sm text-signal-muted">Cancel</button>
          <button onClick={() => editingRisk && handleUpdateRisk(editingRisk.id, { title: editingRisk.title, riskLevel: editingRisk.riskLevel, mitigationStatus: editingRisk.mitigationStatus, owner: editingRisk.owner })} disabled={submitting} className="px-4 py-2 bg-signal-green text-signal-canvas font-medium rounded-lg text-sm hover:bg-signal-green/90 disabled:opacity-50">{submitting ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </div>
    </div>
  );

  const renderEditIncidentModal = () => editingIncident && (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setEditingIncident(null)}>
      <div className="bg-signal-panel2 rounded-2xl border border-white/[0.08] w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h3 className="text-lg font-semibold font-display text-signal-ink">Update ICT Incident</h3>
          <button onClick={() => setEditingIncident(null)} className="p-1 hover:bg-white/[0.06] rounded"><X size={18} className="text-signal-muted" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-signal-muted mb-1">Incident Title</label>
            <input type="text" value={editingIncident.title} onChange={e => setEditingIncident(i => i ? { ...i, title: e.target.value } : i)} className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.10] rounded-xl text-signal-ink text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-signal-muted mb-1">Status</label>
              <select value={editingIncident.status} onChange={e => setEditingIncident(i => i ? { ...i, status: e.target.value as IncidentStatus } : i)} className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.10] rounded-xl text-signal-ink text-sm">
                {(['Open', 'Investigating', 'Resolved', 'Reported to Authority'] as IncidentStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-signal-muted mb-1">Notification Status</label>
              <select value={editingIncident.notificationStatus} onChange={e => setEditingIncident(i => i ? { ...i, notificationStatus: e.target.value as NotificationStatus } : i)} className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.10] rounded-xl text-signal-ink text-sm">
                {(['Not Required', 'Pending', 'Initial Sent', 'Intermediate Sent', 'Final Sent'] as NotificationStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-signal-muted mb-1">Root Cause</label>
            <textarea value={editingIncident.rootCause} onChange={e => setEditingIncident(i => i ? { ...i, rootCause: e.target.value } : i)} className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.10] rounded-xl text-signal-ink text-sm h-20 resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-white/[0.06]">
          <button onClick={() => setEditingIncident(null)} className="px-4 py-2 text-sm text-signal-muted">Cancel</button>
          <button onClick={() => editingIncident && handleUpdateIncident(editingIncident.id, { title: editingIncident.title, status: editingIncident.status, notificationStatus: editingIncident.notificationStatus, rootCause: editingIncident.rootCause })} disabled={submitting} className="px-4 py-2 bg-signal-green text-signal-canvas font-medium rounded-lg text-sm hover:bg-signal-green/90 disabled:opacity-50">{submitting ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </div>
    </div>
  );

  const renderProviderModal = () => showAddProvider && (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => { setShowAddProvider(false); setEditingProviderId(null); }}>
      <div className="bg-signal-panel2 rounded-2xl border border-white/[0.08] w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h3 className="text-lg font-semibold font-display text-signal-ink">{editingProviderId ? 'Edit' : 'Add'} ICT Third-Party Provider</h3>
          <button onClick={() => { setShowAddProvider(false); setEditingProviderId(null); }} className="p-1 hover:bg-white/[0.06] rounded"><X size={18} className="text-signal-muted" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-signal-muted mb-1">Provider Name</label>
            <input type="text" value={providerForm.providerName} onChange={e => setProviderForm(f => ({ ...f, providerName: e.target.value }))} placeholder="Provider name..." className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.10] rounded-xl text-signal-ink text-sm" />
          </div>
          <div>
            <label className="block text-sm text-signal-muted mb-1">Service Type</label>
            <input type="text" value={providerForm.serviceType} onChange={e => setProviderForm(f => ({ ...f, serviceType: e.target.value }))} placeholder="e.g., Cloud Hosting (IaaS)" className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.10] rounded-xl text-signal-ink text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-signal-muted mb-1">Criticality</label>
              <select value={providerForm.criticality} onChange={e => setProviderForm(f => ({ ...f, criticality: e.target.value as Criticality }))} className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.10] rounded-xl text-signal-ink text-sm">
                {(['Critical', 'Important', 'Standard'] as Criticality[]).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-signal-muted mb-1">Country</label>
              <input type="text" value={providerForm.country} onChange={e => setProviderForm(f => ({ ...f, country: e.target.value }))} placeholder="Country" className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.10] rounded-xl text-signal-ink text-sm" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-signal-body">
            <input type="checkbox" checked={providerForm.exitStrategyExists} onChange={e => setProviderForm(f => ({ ...f, exitStrategyExists: e.target.checked }))} className="w-4 h-4 rounded border-white/[0.10] bg-white/[0.06] accent-signal-green" />
            Exit strategy documented (DORA Article 28)
          </label>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-white/[0.06]">
          <button onClick={() => { setShowAddProvider(false); setEditingProviderId(null); }} className="px-4 py-2 text-sm text-signal-muted">Cancel</button>
          <button onClick={handleSaveProvider} disabled={submitting || !providerForm.providerName.trim()} className="px-4 py-2 bg-signal-green text-signal-canvas font-medium rounded-lg text-sm hover:bg-signal-green/90 disabled:opacity-50 disabled:cursor-not-allowed">{submitting ? 'Saving...' : editingProviderId ? 'Save Changes' : 'Add Provider'}</button>
        </div>
      </div>
    </div>
  );

  const renderTestModal = () => showAddTest && (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => { setShowAddTest(false); setEditingTestId(null); }}>
      <div className="bg-signal-panel2 rounded-2xl border border-white/[0.08] w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h3 className="text-lg font-semibold font-display text-signal-ink">{editingTestId ? 'Edit' : 'Schedule'} Resilience Test</h3>
          <button onClick={() => { setShowAddTest(false); setEditingTestId(null); }} className="p-1 hover:bg-white/[0.06] rounded"><X size={18} className="text-signal-muted" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-signal-muted mb-1">Test Name</label>
            <input type="text" value={testForm.testName} onChange={e => setTestForm(f => ({ ...f, testName: e.target.value }))} placeholder="Test name..." className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.10] rounded-xl text-signal-ink text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-signal-muted mb-1">Type</label>
              <select value={testForm.type} onChange={e => setTestForm(f => ({ ...f, type: e.target.value as TestType }))} className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.10] rounded-xl text-signal-ink text-sm">
                {(['TLPT', 'Scenario', 'Vulnerability Scan', 'Penetration Test'] as TestType[]).map(t2 => <option key={t2} value={t2}>{t2}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-signal-muted mb-1">Next Scheduled</label>
              <input type="date" value={testForm.nextScheduled} onChange={e => setTestForm(f => ({ ...f, nextScheduled: e.target.value }))} className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.10] rounded-xl text-signal-ink text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-signal-muted mb-1">Scope</label>
            <textarea value={testForm.scope} onChange={e => setTestForm(f => ({ ...f, scope: e.target.value }))} placeholder="Scope of the test..." className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.10] rounded-xl text-signal-ink text-sm h-20 resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-white/[0.06]">
          <button onClick={() => { setShowAddTest(false); setEditingTestId(null); }} className="px-4 py-2 text-sm text-signal-muted">Cancel</button>
          <button onClick={handleSaveTest} disabled={submitting || !testForm.testName.trim()} className="px-4 py-2 bg-signal-green text-signal-canvas font-medium rounded-lg text-sm hover:bg-signal-green/90 disabled:opacity-50 disabled:cursor-not-allowed">{submitting ? 'Saving...' : editingTestId ? 'Save Changes' : 'Schedule Test'}</button>
        </div>
      </div>
    </div>
  );

  // ── Main Render ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-signal-canvas text-signal-ink">
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={onBack} className="p-2 hover:bg-white/[0.06] rounded-lg"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="text-2xl font-bold font-display">DORA Compliance</h1>
            <p className="text-sm text-signal-muted">Digital Operational Resilience Act (EU) 2022/2554</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-signal-bad/10 border border-signal-bad/30 rounded-xl flex items-center justify-between text-sm text-signal-bad">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-4 text-signal-bad hover:text-signal-ink">Dismiss</button>
          </div>
        )}

        <div className="flex gap-1 mb-6 border-b border-white/[0.06] overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSearchQuery(''); setCategoryFilter('all'); }} className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.key ? 'border-signal-green text-signal-green' : 'border-transparent text-signal-muted hover:text-signal-ink hover:border-white/[0.10]'}`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'ict_risk' && renderICTRisk()}
        {activeTab === 'incidents' && renderIncidents()}
        {activeTab === 'third_party' && renderThirdParty()}
        {activeTab === 'resilience_testing' && renderResilienceTesting()}
      </div>

      {renderRiskDetailModal()}
      {renderIncidentDetailModal()}
      {renderAddRiskModal()}
      {renderAddIncidentModal()}
      {renderEditRiskModal()}
      {renderEditIncidentModal()}
      {renderProviderModal()}
      {renderTestModal()}
    </div>
  );
};

export default DORADashboard;
