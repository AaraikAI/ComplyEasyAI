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

  // API-loaded data
  const [risks, setRisks] = useState<ICTRisk[]>([]);
  const [incidents, setIncidents] = useState<ICTIncident[]>([]);
  const [providers, setProviders] = useState<ThirdPartyProvider[]>([]);
  const [tests, setTests] = useState<ResilienceTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
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
        if (cancelled) return;
        if (dashboard.status === 'fulfilled') setDashboardData(dashboard.value);
        if (assessments.status === 'fulfilled') setRisks((assessments.value.data || assessments.value || []).map(mapApiRisk));
        if (incidentRes.status === 'fulfilled') setIncidents((incidentRes.value.data || incidentRes.value || []).map(mapApiIncident));
        if (providerRes.status === 'fulfilled') setProviders((providerRes.value.data || providerRes.value || []).map(mapApiProvider));
        if (testRes.status === 'fulfilled') setTests((testRes.value.data || testRes.value || []).map(mapApiTest));
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load DORA data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

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
  const riskLevelBg = (level: RiskLevel) => level === 'Critical' ? 'bg-red-500/20 text-red-400' : level === 'High' ? 'bg-orange-500/20 text-orange-400' : level === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400';
  const severityBg = (s: IncidentSeverity) => s === 'Critical' ? 'bg-red-500/20 text-red-400' : s === 'High' ? 'bg-orange-500/20 text-orange-400' : s === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400';
  const statusBg = (s: IncidentStatus) => s === 'Reported to Authority' ? 'bg-blue-500/20 text-blue-400' : s === 'Resolved' ? 'bg-emerald-500/20 text-emerald-400' : s === 'Investigating' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400';
  const mitigationBg = (s: MitigationStatus) => s === 'Verified' ? 'bg-emerald-500/20 text-emerald-400' : s === 'Implemented' ? 'bg-blue-500/20 text-blue-400' : s === 'In Progress' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400';
  const criticalityBg = (c: Criticality) => c === 'Critical' ? 'bg-red-500/20 text-red-400' : c === 'Important' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400';
  const testResultBg = (r: TestResult) => r === 'Pass' ? 'bg-emerald-500/20 text-emerald-400' : r === 'Fail' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400';
  const contractBg = (s: ContractStatus) => s === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : s === 'Renewal Pending' ? 'bg-amber-500/20 text-amber-400' : s === 'Under Review' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400';
  const concentrationBg = (c: ConcentrationRisk) => c === 'High' ? 'bg-red-500/20 text-red-400' : c === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400';

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
        <div className="bg-slate-800 rounded-lg p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-400">Compliance Score</span>
            <Shield size={18} className="text-blue-400" />
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-14 h-14">
              <svg viewBox="0 0 36 36" className="w-14 h-14 transform -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#334155" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke={complianceScore >= 80 ? '#10b981' : complianceScore >= 60 ? '#f59e0b' : '#ef4444'} strokeWidth="3" strokeDasharray={`${complianceScore} ${100 - complianceScore}`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">{complianceScore}%</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{complianceScore}%</div>
              <div className="text-xs text-slate-400">DORA Readiness</div>
            </div>
          </div>
        </div>
        {[
          { label: 'ICT Risk Events', value: risks.length, sub: `${criticalRisks} critical`, icon: AlertCircle, color: 'text-red-400' },
          { label: 'Third-Party Providers', value: providers.length, sub: `${criticalProviders} critical`, icon: Building2, color: 'text-purple-400' },
          { label: 'Incidents Filed', value: reportedIncidents, sub: `${openIncidents} open`, icon: FileText, color: 'text-amber-400' },
          { label: 'Resilience Tests', value: testsCompleted, sub: `${testsPassed} passed`, icon: Activity, color: 'text-emerald-400' },
        ].map(m => (
          <div key={m.label} className="bg-slate-800 rounded-lg p-5 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">{m.label}</span>
              <m.icon size={18} className={m.color} />
            </div>
            <div className="text-2xl font-bold text-white">{m.value}</div>
            <div className="text-xs text-slate-400 mt-1">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution */}
        <div className="bg-slate-800 rounded-lg p-5 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">ICT Risk Level Distribution</h3>
          <div className="space-y-3">
            {[
              { label: 'Critical', count: criticalRisks, pct: Math.round((criticalRisks / risks.length) * 100), color: 'bg-red-500' },
              { label: 'High', count: highRisks, pct: Math.round((highRisks / risks.length) * 100), color: 'bg-orange-500' },
              { label: 'Medium', count: risks.filter(r => r.riskLevel === 'Medium').length, pct: Math.round((risks.filter(r => r.riskLevel === 'Medium').length / risks.length) * 100), color: 'bg-amber-500' },
              { label: 'Low', count: risks.filter(r => r.riskLevel === 'Low').length, pct: Math.round((risks.filter(r => r.riskLevel === 'Low').length / risks.length) * 100), color: 'bg-emerald-500' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">{item.label}</span>
                  <span className="text-white font-medium">{item.count} ({item.pct}%)</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full">
                  <div className={`h-2 ${item.color} rounded-full transition-all`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Incidents */}
        <div className="bg-slate-800 rounded-lg p-5 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Recent ICT Incidents</h3>
          <div className="space-y-3">
            {incidents.slice(0, 4).map(inc => (
              <div key={inc.id} className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-mono">{inc.incidentId}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${severityBg(inc.severity)}`}>{inc.severity}</span>
                  </div>
                  <p className="text-sm text-white truncate mt-1">{inc.title}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ml-3 whitespace-nowrap ${statusBg(inc.status)}`}>{inc.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Third-Party Concentration */}
        <div className="bg-slate-800 rounded-lg p-5 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Third-Party Provider Overview</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-900 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-400">{criticalProviders}</div>
              <div className="text-xs text-slate-400">Critical Providers</div>
            </div>
            <div className="bg-slate-900 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-amber-400">{providersWithoutExit}</div>
              <div className="text-xs text-slate-400">Missing Exit Strategy</div>
            </div>
          </div>
          <div className="space-y-2">
            {providers.filter(p => p.criticality === 'Critical').map(p => (
              <div key={p.id} className="flex items-center justify-between p-2 bg-slate-900 rounded">
                <div>
                  <span className="text-sm text-white">{p.providerName}</span>
                  <span className="text-xs text-slate-400 ml-2">{p.serviceType.split('(')[0].trim()}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${concentrationBg(p.concentrationRisk)}`}>{p.concentrationRisk} risk</span>
              </div>
            ))}
          </div>
        </div>

        {/* Resilience Testing Summary */}
        <div className="bg-slate-800 rounded-lg p-5 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Resilience Testing Summary</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-slate-900 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-emerald-400">{testsPassed}</div>
              <div className="text-xs text-slate-400">Passed</div>
            </div>
            <div className="bg-slate-900 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-amber-400">{tests.filter(tst => tst.result === 'Partial').length}</div>
              <div className="text-xs text-slate-400">Partial</div>
            </div>
            <div className="bg-slate-900 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-400">{testsFailed}</div>
              <div className="text-xs text-slate-400">Failed</div>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
            <span className="text-sm text-slate-300">Total Open Findings</span>
            <span className="text-lg font-bold text-amber-400">{totalFindings}</span>
          </div>
          <div className="mt-3 space-y-2">
            {tests.filter(tst => tst.result === 'Fail').map(tst => (
              <div key={tst.id} className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded">
                <XCircle size={14} className="text-red-400 flex-shrink-0" />
                <span className="text-sm text-red-300">{tst.testName}</span>
                <span className="text-xs text-red-400 ml-auto">{tst.findingsCount} findings</span>
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
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search risks..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
          >
            <option value="all">All Categories</option>
            {(['Cyber', 'Infrastructure', 'Software', 'Cloud', 'Data'] as RiskCategory[]).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <button onClick={() => setShowAddRisk(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          <Plus size={16} />Add Risk
        </button>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left p-3 text-slate-400 font-medium">Risk ID</th>
                <th className="text-left p-3 text-slate-400 font-medium">Title</th>
                <th className="text-left p-3 text-slate-400 font-medium">Category</th>
                <th className="text-left p-3 text-slate-400 font-medium">Likelihood</th>
                <th className="text-left p-3 text-slate-400 font-medium">Impact</th>
                <th className="text-left p-3 text-slate-400 font-medium">Risk Level</th>
                <th className="text-left p-3 text-slate-400 font-medium">Mitigation</th>
                <th className="text-left p-3 text-slate-400 font-medium">Owner</th>
                <th className="text-left p-3 text-slate-400 font-medium">Review Date</th>
                <th className="text-left p-3 text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRisks.map(risk => (
                <tr key={risk.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="p-3 font-mono text-xs text-slate-300">{risk.riskId}</td>
                  <td className="p-3 text-white max-w-[200px] truncate">{risk.title}</td>
                  <td className="p-3"><span className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300">{risk.category}</span></td>
                  <td className="p-3 text-slate-300">{risk.likelihood}</td>
                  <td className="p-3 text-slate-300">{risk.impact}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full ${riskLevelBg(risk.riskLevel)}`}>{risk.riskLevel}</span></td>
                  <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full ${mitigationBg(risk.mitigationStatus)}`}>{risk.mitigationStatus}</span></td>
                  <td className="p-3 text-slate-300 whitespace-nowrap">{risk.owner}</td>
                  <td className="p-3 text-slate-400 whitespace-nowrap">{risk.reviewDate}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setSelectedRisk(risk)} className="p-1.5 hover:bg-slate-600 rounded" title="View"><Eye size={14} className="text-slate-400" /></button>
                      <button className="p-1.5 hover:bg-slate-600 rounded" title="Edit"><Edit3 size={14} className="text-slate-400" /></button>
                      <button className="p-1.5 hover:bg-slate-600 rounded" title="Delete"><Trash2 size={14} className="text-red-400" /></button>
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
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search incidents..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500"
          />
        </div>
        <button onClick={() => setShowAddIncident(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          <Plus size={16} />Report Incident
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
        {[
          { label: 'Open Incidents', value: incidents.filter(i => i.status === 'Open').length, color: 'text-red-400', icon: AlertCircle },
          { label: 'Under Investigation', value: incidents.filter(i => i.status === 'Investigating').length, color: 'text-amber-400', icon: Search },
          { label: 'Resolved', value: incidents.filter(i => i.status === 'Resolved').length, color: 'text-emerald-400', icon: CheckCircle },
          { label: 'Reported to Authority', value: incidents.filter(i => i.status === 'Reported to Authority').length, color: 'text-blue-400', icon: FileText },
        ].map(m => (
          <div key={m.label} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400">{m.label}</span>
              <m.icon size={16} className={m.color} />
            </div>
            <div className={`text-xl font-bold ${m.color}`}>{m.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left p-3 text-slate-400 font-medium">Incident ID</th>
                <th className="text-left p-3 text-slate-400 font-medium">Title</th>
                <th className="text-left p-3 text-slate-400 font-medium">Type</th>
                <th className="text-left p-3 text-slate-400 font-medium">Severity</th>
                <th className="text-left p-3 text-slate-400 font-medium">Affected Services</th>
                <th className="text-left p-3 text-slate-400 font-medium">Detection</th>
                <th className="text-left p-3 text-slate-400 font-medium">Resolution</th>
                <th className="text-left p-3 text-slate-400 font-medium">Status</th>
                <th className="text-left p-3 text-slate-400 font-medium">Notification</th>
                <th className="text-left p-3 text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.map(inc => (
                <tr key={inc.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="p-3 font-mono text-xs text-slate-300">{inc.incidentId}</td>
                  <td className="p-3 text-white max-w-[180px] truncate">{inc.title}</td>
                  <td className="p-3"><span className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300 whitespace-nowrap">{inc.type}</span></td>
                  <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full ${severityBg(inc.severity)}`}>{inc.severity}</span></td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1 max-w-[160px]">
                      {inc.affectedServices.slice(0, 2).map(s => <span key={s} className="text-xs bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">{s}</span>)}
                      {inc.affectedServices.length > 2 && <span className="text-xs text-slate-500">+{inc.affectedServices.length - 2}</span>}
                    </div>
                  </td>
                  <td className="p-3 text-slate-400 text-xs whitespace-nowrap">{new Date(inc.detectionTime).toLocaleDateString()}</td>
                  <td className="p-3 text-slate-400 text-xs whitespace-nowrap">{inc.resolutionTime ? new Date(inc.resolutionTime).toLocaleDateString() : <span className="text-amber-400">Ongoing</span>}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${statusBg(inc.status)}`}>{inc.status}</span></td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                      inc.notificationStatus === 'Final Sent' ? 'bg-emerald-500/20 text-emerald-400' :
                      inc.notificationStatus === 'Not Required' ? 'bg-slate-500/20 text-slate-400' :
                      inc.notificationStatus === 'Pending' ? 'bg-red-500/20 text-red-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>{inc.notificationStatus}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setSelectedIncident(inc)} className="p-1.5 hover:bg-slate-600 rounded" title="View"><Eye size={14} className="text-slate-400" /></button>
                      <button className="p-1.5 hover:bg-slate-600 rounded" title="Edit"><Edit3 size={14} className="text-slate-400" /></button>
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
        <h3 className="text-lg font-semibold text-white">ICT Third-Party Service Provider Register</h3>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          <Plus size={16} />Add Provider
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
        {[
          { label: 'Total Providers', value: providers.length, color: 'text-blue-400', icon: Building2 },
          { label: 'Critical Providers', value: criticalProviders, color: 'text-red-400', icon: AlertCircle },
          { label: 'No Exit Strategy', value: providersWithoutExit, color: 'text-amber-400', icon: AlertTriangle },
          { label: 'High Concentration', value: providers.filter(p => p.concentrationRisk === 'High').length, color: 'text-orange-400', icon: Zap },
        ].map(m => (
          <div key={m.label} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400">{m.label}</span>
              <m.icon size={16} className={m.color} />
            </div>
            <div className={`text-xl font-bold ${m.color}`}>{m.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left p-3 text-slate-400 font-medium">Provider Name</th>
                <th className="text-left p-3 text-slate-400 font-medium">Service Type</th>
                <th className="text-left p-3 text-slate-400 font-medium">Criticality</th>
                <th className="text-left p-3 text-slate-400 font-medium">Contract</th>
                <th className="text-left p-3 text-slate-400 font-medium">Exit Strategy</th>
                <th className="text-left p-3 text-slate-400 font-medium">Concentration Risk</th>
                <th className="text-left p-3 text-slate-400 font-medium">Country</th>
                <th className="text-left p-3 text-slate-400 font-medium">Last Assessment</th>
                <th className="text-left p-3 text-slate-400 font-medium">Next Review</th>
                <th className="text-left p-3 text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {providers.map(p => (
                <tr key={p.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="p-3 text-white font-medium whitespace-nowrap">{p.providerName}</td>
                  <td className="p-3 text-slate-300 max-w-[180px] truncate">{p.serviceType}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full ${criticalityBg(p.criticality)}`}>{p.criticality}</span></td>
                  <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full ${contractBg(p.contractStatus)}`}>{p.contractStatus}</span></td>
                  <td className="p-3 text-center">
                    {p.exitStrategyExists
                      ? <CheckCircle size={16} className="text-emerald-400 inline" />
                      : <XCircle size={16} className="text-red-400 inline" />
                    }
                  </td>
                  <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full ${concentrationBg(p.concentrationRisk)}`}>{p.concentrationRisk}</span></td>
                  <td className="p-3 text-slate-300 whitespace-nowrap">{p.country}</td>
                  <td className="p-3 text-slate-400 whitespace-nowrap">{p.lastAssessmentDate}</td>
                  <td className="p-3 text-slate-400 whitespace-nowrap">{p.nextReview}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 hover:bg-slate-600 rounded" title="View"><Eye size={14} className="text-slate-400" /></button>
                      <button className="p-1.5 hover:bg-slate-600 rounded" title="Edit"><Edit3 size={14} className="text-slate-400" /></button>
                      <button className="p-1.5 hover:bg-slate-600 rounded" title="Delete"><Trash2 size={14} className="text-red-400" /></button>
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
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-orange-300">Concentration Risk Alert</h4>
              <p className="text-sm text-orange-200/80 mt-1">
                {providers.filter(p => p.concentrationRisk === 'High').length} providers have high concentration risk. DORA Article 29 requires financial entities to identify and assess concentration risk at entity and group level. Consider alternative providers or mitigation measures.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {providers.filter(p => p.concentrationRisk === 'High').map(p => (
                  <span key={p.id} className="text-xs bg-orange-500/20 text-orange-300 px-2 py-1 rounded">{p.providerName}</span>
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
        <h3 className="text-lg font-semibold text-white">Digital Operational Resilience Testing Programme</h3>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 bg-slate-700 text-white rounded-lg text-sm hover:bg-slate-600">
            <Download size={16} />Export Report
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
            <Plus size={16} />Schedule Test
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
        {[
          { label: 'Tests Conducted', value: tests.length, color: 'text-blue-400', icon: Activity },
          { label: 'Pass Rate', value: `${Math.round((testsPassed / tests.length) * 100)}%`, color: 'text-emerald-400', icon: CheckCircle },
          { label: 'Open Findings', value: totalFindings, color: 'text-amber-400', icon: Bug },
          { label: 'TLPT Completed', value: tests.filter(tst => tst.type === 'TLPT').length, color: 'text-purple-400', icon: Shield },
        ].map(m => (
          <div key={m.label} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400">{m.label}</span>
              <m.icon size={16} className={m.color} />
            </div>
            <div className={`text-xl font-bold ${m.color}`}>{m.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left p-3 text-slate-400 font-medium">Test Name</th>
                <th className="text-left p-3 text-slate-400 font-medium">Type</th>
                <th className="text-left p-3 text-slate-400 font-medium">Scope</th>
                <th className="text-left p-3 text-slate-400 font-medium">Last Executed</th>
                <th className="text-left p-3 text-slate-400 font-medium">Result</th>
                <th className="text-left p-3 text-slate-400 font-medium">Findings</th>
                <th className="text-left p-3 text-slate-400 font-medium">Next Scheduled</th>
                <th className="text-left p-3 text-slate-400 font-medium">Tested By</th>
                <th className="text-left p-3 text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tests.map(tst => (
                <tr key={tst.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="p-3 text-white font-medium max-w-[200px] truncate">{tst.testName}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded ${
                      tst.type === 'TLPT' ? 'bg-purple-500/20 text-purple-400' :
                      tst.type === 'Penetration Test' ? 'bg-blue-500/20 text-blue-400' :
                      tst.type === 'Vulnerability Scan' ? 'bg-cyan-500/20 text-cyan-400' :
                      'bg-slate-600 text-slate-300'
                    }`}>{tst.type}</span>
                  </td>
                  <td className="p-3 text-slate-300 max-w-[200px] truncate">{tst.scope}</td>
                  <td className="p-3 text-slate-400 whitespace-nowrap">{tst.lastExecuted}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full ${testResultBg(tst.result)}`}>{tst.result}</span></td>
                  <td className="p-3">
                    <span className={`text-sm font-medium ${tst.findingsCount > 5 ? 'text-amber-400' : tst.findingsCount > 0 ? 'text-slate-300' : 'text-emerald-400'}`}>
                      {tst.findingsCount}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400 whitespace-nowrap">{tst.nextScheduled}</td>
                  <td className="p-3 text-slate-300 max-w-[150px] truncate">{tst.testedBy}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 hover:bg-slate-600 rounded" title="View Report"><Eye size={14} className="text-slate-400" /></button>
                      <button className="p-1.5 hover:bg-slate-600 rounded" title="Download"><Download size={14} className="text-slate-400" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* TLPT Notice */}
      <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield size={20} className="text-purple-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-purple-300">Threat-Led Penetration Testing (TLPT)</h4>
            <p className="text-sm text-purple-200/80 mt-1">
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
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">{selectedRisk.riskId}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${riskLevelBg(selectedRisk.riskLevel)}`}>{selectedRisk.riskLevel}</span>
            </div>
            <h3 className="text-lg font-semibold text-white mt-1">{selectedRisk.title}</h3>
          </div>
          <button onClick={() => setSelectedRisk(null)} className="p-1 hover:bg-slate-700 rounded"><X size={18} className="text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Description</label>
            <p className="text-sm text-white">{selectedRisk.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Category</label>
              <span className="text-sm text-white">{selectedRisk.category}</span>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Owner</label>
              <span className="text-sm text-white">{selectedRisk.owner}</span>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Likelihood</label>
              <span className="text-sm text-white">{selectedRisk.likelihood}</span>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Impact</label>
              <span className="text-sm text-white">{selectedRisk.impact}</span>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Mitigation Status</label>
              <span className={`text-xs px-2 py-1 rounded-full ${mitigationBg(selectedRisk.mitigationStatus)}`}>{selectedRisk.mitigationStatus}</span>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Next Review</label>
              <span className="text-sm text-white">{selectedRisk.reviewDate}</span>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-slate-700">
          <button onClick={() => setSelectedRisk(null)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Close</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Edit Risk</button>
        </div>
      </div>
    </div>
  );

  const renderIncidentDetailModal = () => selectedIncident && (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedIncident(null)}>
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">{selectedIncident.incidentId}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${severityBg(selectedIncident.severity)}`}>{selectedIncident.severity}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusBg(selectedIncident.status)}`}>{selectedIncident.status}</span>
            </div>
            <h3 className="text-lg font-semibold text-white mt-1">{selectedIncident.title}</h3>
          </div>
          <button onClick={() => setSelectedIncident(null)} className="p-1 hover:bg-slate-700 rounded"><X size={18} className="text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Description</label>
            <p className="text-sm text-white">{selectedIncident.description}</p>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Root Cause</label>
            <p className="text-sm text-white">{selectedIncident.rootCause}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Type</label>
              <span className="text-sm text-white">{selectedIncident.type}</span>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Notification Status</label>
              <span className="text-sm text-white">{selectedIncident.notificationStatus}</span>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Detection Time</label>
              <span className="text-sm text-white">{new Date(selectedIncident.detectionTime).toLocaleString()}</span>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Resolution Time</label>
              <span className="text-sm text-white">{selectedIncident.resolutionTime ? new Date(selectedIncident.resolutionTime).toLocaleString() : 'Ongoing'}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Affected Services</label>
            <div className="flex flex-wrap gap-2">
              {selectedIncident.affectedServices.map(s => (
                <span key={s} className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">{s}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-slate-700">
          <button onClick={() => setSelectedIncident(null)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Close</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Update Status</button>
        </div>
      </div>
    </div>
  );

  const renderAddRiskModal = () => showAddRisk && (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowAddRisk(false)}>
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">Add ICT Risk</h3>
          <button onClick={() => setShowAddRisk(false)} className="p-1 hover:bg-slate-700 rounded"><X size={18} className="text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Risk Title</label>
            <input type="text" placeholder="Enter risk title..." className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Category</label>
            <select className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm">
              {(['Cyber', 'Infrastructure', 'Software', 'Cloud', 'Data'] as RiskCategory[]).map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Likelihood</label>
              <select className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm">
                {(['Very Low', 'Low', 'Medium', 'High', 'Very High'] as Likelihood[]).map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Impact</label>
              <select className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm">
                {(['Negligible', 'Minor', 'Moderate', 'Major', 'Severe'] as Impact[]).map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Owner</label>
            <input type="text" placeholder="Risk owner..." className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Description</label>
            <textarea placeholder="Describe the risk..." className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm h-20 resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-slate-700">
          <button onClick={() => setShowAddRisk(false)} className="px-4 py-2 text-sm text-slate-400">Cancel</button>
          <button onClick={() => setShowAddRisk(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Add Risk</button>
        </div>
      </div>
    </div>
  );

  const renderAddIncidentModal = () => showAddIncident && (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowAddIncident(false)}>
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">Report ICT Incident</h3>
          <button onClick={() => setShowAddIncident(false)} className="p-1 hover:bg-slate-700 rounded"><X size={18} className="text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Incident Title</label>
            <input type="text" placeholder="Enter incident title..." className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Type</label>
              <select className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm">
                {(['Cyber Attack', 'System Failure', 'Data Breach', 'Third-Party Outage'] as IncidentType[]).map(it => <option key={it}>{it}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Severity</label>
              <select className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm">
                {(['Low', 'Medium', 'High', 'Critical'] as IncidentSeverity[]).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Affected Services</label>
            <input type="text" placeholder="Comma-separated services..." className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Description</label>
            <textarea placeholder="Describe the incident..." className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm h-20 resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-slate-700">
          <button onClick={() => setShowAddIncident(false)} className="px-4 py-2 text-sm text-slate-400">Cancel</button>
          <button onClick={() => setShowAddIncident(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Report Incident</button>
        </div>
      </div>
    </div>
  );

  // ── Main Render ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-lg"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="text-2xl font-bold">DORA Compliance</h1>
            <p className="text-sm text-slate-400">Digital Operational Resilience Act (EU) 2022/2554</p>
          </div>
        </div>

        <div className="flex gap-1 mb-6 border-b border-slate-700 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSearchQuery(''); setCategoryFilter('all'); }} className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.key ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white hover:border-slate-600'}`}>
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
    </div>
  );
};

export default DORADashboard;
