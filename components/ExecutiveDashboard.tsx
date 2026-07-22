/**
 * Executive Dashboard Component
 *
 * Board-level executive dashboard with:
 * - Traffic light indicators for each framework
 * - Overall risk posture
 * - Compliance scores
 * - Incident trends
 * - Top risks
 * - Period comparison
 *
 * Data is fetched from /api/executive/dashboard via the useExecutiveDashboard hook.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart3,
  Shield,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Minus,
  Activity,
  Target,
  Users,
  Clock,
  Calendar,
  Eye,
  FileText,
  Loader2,
} from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';

// ── Types ───────────────────────────────────────────────────────────────────

type TrafficLight = 'green' | 'yellow' | 'red';
type RiskTrend = 'improving' | 'stable' | 'degrading';

interface FrameworkStatus {
  name: string;
  score: number;
  status: TrafficLight;
  trend: RiskTrend;
  controlsTotal: number;
  controlsPassing: number;
  lastAudit: string;
  nextAudit: string;
  openFindings: number;
}

interface TopRisk {
  id: string;
  title: string;
  category: string;
  likelihood: number;
  impact: number;
  score: number;
  owner: string;
  status: 'Open' | 'Mitigating' | 'Accepted';
  trend: RiskTrend;
}

interface IncidentTrend {
  month: string;
  sev1: number;
  sev2: number;
  sev3: number;
  sev4: number;
}

// ── API response to component data mapping ──────────────────────────────────

function ragToTrafficLight(rag: string): TrafficLight {
  if (rag === 'GREEN') return 'green';
  if (rag === 'AMBER') return 'yellow';
  return 'red';
}

function mapFrameworks(apiData: any): FrameworkStatus[] {
  const scores = apiData?.frameworkScores;
  if (!Array.isArray(scores) || scores.length === 0) return [];
  return scores.map((fw: any) => ({
    name: fw.name || 'Unknown',
    score: fw.progress ?? fw.controlCoverage ?? 0,
    status: ragToTrafficLight(fw.rag || 'GREEN'),
    trend: 'stable' as RiskTrend,
    controlsTotal: fw.totalControls || 0,
    controlsPassing: fw.implementedControls || 0,
    lastAudit: '',
    nextAudit: '',
    openFindings: 0,
  }));
}

function mapTopRisks(apiData: any): TopRisk[] {
  const risks = apiData?.riskPosture?.topRisks;
  if (!Array.isArray(risks) || risks.length === 0) return [];
  const severityScoreMap: Record<string, number> = { Critical: 20, High: 15, Medium: 10, Low: 5 };
  return risks.map((r: any, idx: number) => ({
    id: r.id || `R-${idx + 1}`,
    title: r.title || r.id || 'Risk',
    category: r.category || 'General',
    likelihood: 0,
    impact: 0,
    score: severityScoreMap[r.severity] || 10,
    owner: r.owner || '',
    status: (r.status === 'In_Progress' ? 'Mitigating' : r.status === 'Open' ? 'Open' : 'Accepted') as 'Open' | 'Mitigating' | 'Accepted',
    trend: 'stable' as RiskTrend,
  }));
}

function buildPeriodComparison(apiData: any, trendsData: any) {
  const current = {
    complianceScore: apiData?.overallCompliance ?? 0,
    riskScore: apiData?.riskPosture?.averageScore ? Math.round(apiData.riskPosture.averageScore * 25) : 0,
    incidents: apiData?.incidents?.totalOpen ?? 0,
    openFindings: apiData?.riskPosture?.totalOpen ?? 0,
    controlCoverage: apiData?.auditReadiness?.score ?? 0,
    vendorCompliance: apiData?.vendorRiskSummary?.avgScore ?? 0,
  };

  // The /executive/trends endpoint exposes genuine prior-period counts for the
  // metrics it tracks over time (incidents, risks/findings). Those are populated
  // from real data; metrics the backend does not yet track historically are left
  // at the sentinel 0 so the UI renders "No prior period data" instead of
  // fabricating a baseline and showing misleading deltas.
  const cmp = trendsData?.comparison;
  const previous = {
    complianceScore: 0,
    riskScore: 0,
    incidents: typeof cmp?.newIncidents?.previous === 'number' ? cmp.newIncidents.previous : 0,
    openFindings: typeof cmp?.newRisks?.previous === 'number' ? cmp.newRisks.previous : 0,
    controlCoverage: 0,
    vendorCompliance: 0,
  };

  return { current, previous };
}

// Builds the current-snapshot severity breakdown of open incidents from
// /executive/dashboard (incidents.bySeverity). This is a point-in-time view, not a
// multi-month time series — the panel is labelled accordingly.
function buildIncidentTrends(apiData: any): IncidentTrend[] {
  const bySev = apiData?.incidents?.bySeverity;
  if (!bySev || typeof bySev !== 'object') return [];
  return [{
    month: 'Open',
    sev1: bySev['SEV1'] || bySev['Critical'] || 0,
    sev2: bySev['SEV2'] || bySev['High'] || 0,
    sev3: bySev['SEV3'] || bySev['Medium'] || 0,
    sev4: bySev['SEV4'] || bySev['Low'] || 0,
  }];
}

// ── Component ───────────────────────────────────────────────────────────────

const ExecutiveDashboard: React.FC = () => {
  const { t } = useI18n();
  const [selectedPeriod, setSelectedPeriod] = useState<'quarter' | 'year'>('quarter');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [trendsData, setTrendsData] = useState<any>(null);

  // Quarterly view compares 90-day windows; annual compares 365-day windows.
  const periodDays = selectedPeriod === 'year' ? 365 : 90;

  useEffect(() => {
    let cancelled = false;
    async function fetchDashboard() {
      setLoading(true);
      setError(null);
      try {
        const [dashRes, trendsRes] = await Promise.all([
          fetch('/api/executive/dashboard', { credentials: 'include' }),
          fetch(`/api/executive/trends?periodDays=${periodDays}`, { credentials: 'include' }),
        ]);
        if (!dashRes.ok) {
          throw new Error(`Failed to load dashboard (${dashRes.status})`);
        }
        const dashJson = await dashRes.json();
        // Trends power the period-over-period comparison; treat them as best-effort
        // so a trends failure never blocks the primary dashboard render.
        let trendsJson: any = null;
        if (trendsRes.ok) {
          trendsJson = await trendsRes.json();
        }
        if (!cancelled) {
          setDashboardData(dashJson.data ?? dashJson);
          setTrendsData(trendsJson ? (trendsJson.data ?? trendsJson) : null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    fetchDashboard();
    return () => { cancelled = true; };
  }, [selectedPeriod, periodDays]);

  const frameworks = useMemo(() => mapFrameworks(dashboardData), [dashboardData]);
  const topRisks = useMemo(() => mapTopRisks(dashboardData), [dashboardData]);
  const incidentTrends = useMemo(() => buildIncidentTrends(dashboardData), [dashboardData]);
  const periodComparison = useMemo(() => buildPeriodComparison(dashboardData, trendsData), [dashboardData, trendsData]);

  const overallScore = useMemo(() => {
    // eslint-disable-next-line eqeqeq -- Intentional: catches both null and undefined
    if (dashboardData?.overallCompliance != null) return dashboardData.overallCompliance;
    if (frameworks.length === 0) return 0;
    return Math.round(frameworks.reduce((s, f) => s + f.score, 0) / frameworks.length);
  }, [dashboardData, frameworks]);
  const overallStatus: TrafficLight = overallScore >= 90 ? 'green' : overallScore >= 75 ? 'yellow' : 'red';

  const maxIncidents = incidentTrends.length > 0
    ? Math.max(...incidentTrends.map(m => m.sev1 + m.sev2 + m.sev3 + m.sev4), 1)
    : 1;

  const trendIcon = (trend: RiskTrend) => {
    if (trend === 'improving') return <ArrowUp className="w-3 h-3 text-green-400 dark:text-signal-good" />;
    if (trend === 'degrading') return <ArrowDown className="w-3 h-3 text-red-400 dark:text-signal-bad" />;
    return <Minus className="w-3 h-3 text-slate-400 dark:text-signal-muted" />;
  };

  const lightColor = (status: TrafficLight) => {
    if (status === 'green') return 'bg-green-500 dark:bg-signal-good';
    if (status === 'yellow') return 'bg-yellow-500 dark:bg-signal-warn';
    return 'bg-red-500 dark:bg-signal-bad';
  };

  const pctChange = (curr: number, prev: number) => {
    if (prev === 0) return 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 dark:bg-signal-canvas text-white dark:text-signal-ink p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-400 dark:text-signal-green animate-spin" />
          <span className="text-slate-400 dark:text-signal-sub">Loading executive dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 dark:bg-signal-canvas text-white dark:text-signal-ink p-6 flex items-center justify-center">
        <div className="bg-red-500/10 dark:bg-signal-bad/10 border border-red-500/30 dark:border-signal-bad/30 rounded-2xl p-6 max-w-md text-center">
          <AlertTriangle className="w-8 h-8 text-red-400 dark:text-signal-bad mx-auto mb-3" />
          <h2 className="text-lg font-semibold dark:font-display mb-2">Failed to Load Dashboard</h2>
          <p className="text-slate-400 dark:text-signal-sub text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-signal-green dark:hover:bg-signal-green/90 dark:text-signal-canvas dark:font-semibold rounded-lg text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 dark:bg-signal-canvas text-white dark:text-signal-ink p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 dark:bg-signal-green/10 rounded-lg"><BarChart3 className="w-6 h-6 text-blue-400 dark:text-signal-green" /></div>
            <div><h1 className="text-2xl font-bold dark:font-display dark:text-signal-ink">{t('executive.title')}</h1><p className="text-slate-400 dark:text-signal-sub text-sm">Board-level compliance and risk overview</p></div>
          </div>
          <div className="flex items-center gap-2 bg-slate-800 dark:bg-white/[0.04] border border-slate-700 dark:border-white/[0.10] rounded-lg p-0.5">
            <button onClick={() => setSelectedPeriod('quarter')} className={`px-3 py-1.5 rounded-md text-sm ${selectedPeriod === 'quarter' ? 'bg-blue-600 text-white dark:bg-signal-green dark:text-signal-canvas dark:font-semibold' : 'text-slate-400 dark:text-signal-sub'}`}>Quarterly</button>
            <button onClick={() => setSelectedPeriod('year')} className={`px-3 py-1.5 rounded-md text-sm ${selectedPeriod === 'year' ? 'bg-blue-600 text-white dark:bg-signal-green dark:text-signal-canvas dark:font-semibold' : 'text-slate-400 dark:text-signal-sub'}`}>Annual</button>
          </div>
        </div>
      </div>

      {/* Overall Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-slate-800 dark:bg-white/[0.03] rounded-2xl border border-slate-700 dark:border-white/[0.06] p-6 flex items-center gap-6">
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#334155" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke={overallStatus === 'green' ? '#22c55e' : overallStatus === 'yellow' ? '#eab308' : '#ef4444'} strokeWidth="8" strokeDasharray={`${overallScore * 2.64} 264`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold dark:font-display dark:text-signal-ink">{overallScore}%</span>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold dark:font-display dark:text-signal-ink">{t('executive.compliancePosture')}</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-3 h-3 rounded-full ${lightColor(overallStatus)}`} />
              <span className="text-sm text-slate-400 dark:text-signal-sub capitalize">{overallStatus === 'green' ? 'Healthy' : overallStatus === 'yellow' ? 'Needs Attention' : 'Critical'}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-signal-muted mt-1">{frameworks.length} frameworks monitored</p>
          </div>
        </div>

        <div className="bg-slate-800 dark:bg-white/[0.03] rounded-2xl border border-slate-700 dark:border-white/[0.06] p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400 dark:text-signal-muted">{t('executive.riskOverview')}</span>
            <Target className="w-4 h-4 text-orange-400 dark:text-signal-amber" />
          </div>
          <div className="text-3xl font-bold dark:font-display dark:text-signal-ink mb-1">{periodComparison.current.riskScore}/100</div>
          <div className="flex items-center gap-1 text-xs">
            {periodComparison.previous.riskScore > 0 ? (
              pctChange(periodComparison.current.riskScore, periodComparison.previous.riskScore) > 0 ? (
                <><ArrowUp className="w-3 h-3 text-green-400 dark:text-signal-good" /><span className="text-green-400 dark:text-signal-good">+{pctChange(periodComparison.current.riskScore, periodComparison.previous.riskScore)}% vs last period</span></>
              ) : (
                <><ArrowDown className="w-3 h-3 text-red-400 dark:text-signal-bad" /><span className="text-red-400 dark:text-signal-bad">{pctChange(periodComparison.current.riskScore, periodComparison.previous.riskScore)}% vs last period</span></>
              )
            ) : (
              <span className="text-slate-500 dark:text-signal-muted">No prior period data</span>
            )}
          </div>
        </div>

        <div className="bg-slate-800 dark:bg-white/[0.03] rounded-2xl border border-slate-700 dark:border-white/[0.06] p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400 dark:text-signal-muted">Open Incidents</span>
            <AlertTriangle className="w-4 h-4 text-red-400 dark:text-signal-bad" />
          </div>
          <div className="text-3xl font-bold dark:font-display dark:text-signal-ink mb-1">{periodComparison.current.incidents}</div>
          <div className="flex items-center gap-1 text-xs">
            {periodComparison.previous.incidents > 0 ? (
              <>
                <ArrowDown className="w-3 h-3 text-green-400 dark:text-signal-good" />
                <span className="text-green-400 dark:text-signal-good">-{Math.round(((periodComparison.previous.incidents - periodComparison.current.incidents) / periodComparison.previous.incidents) * 100)}% vs last period</span>
              </>
            ) : (
              <span className="text-slate-500 dark:text-signal-muted">{periodComparison.current.incidents} open</span>
            )}
          </div>
        </div>
      </div>

      {/* Framework Traffic Lights */}
      <div className="bg-slate-800 dark:bg-white/[0.03] rounded-2xl border border-slate-700 dark:border-white/[0.06] p-6 mb-6">
        <h3 className="text-sm font-semibold dark:font-display dark:text-signal-ink mb-4">Framework Compliance Status</h3>
        {frameworks.length === 0 ? (
          <p className="text-slate-500 dark:text-signal-muted text-sm text-center py-8">No frameworks configured yet</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {frameworks.map(fw => (
              <div key={fw.name} className={`p-4 rounded-xl border ${fw.status === 'green' ? 'border-green-500/30 bg-green-500/5 dark:border-signal-good/30 dark:bg-signal-good/5' : fw.status === 'yellow' ? 'border-yellow-500/30 bg-yellow-500/5 dark:border-signal-warn/30 dark:bg-signal-warn/5' : 'border-red-500/30 bg-red-500/5 dark:border-signal-bad/30 dark:bg-signal-bad/5'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-4 h-4 rounded-full ${lightColor(fw.status)} shadow-lg ${fw.status === 'red' ? 'animate-pulse' : ''}`} />
                  {trendIcon(fw.trend)}
                </div>
                <h4 className="text-sm font-medium dark:text-signal-body mb-1">{fw.name}</h4>
                <div className="text-2xl font-bold dark:font-display dark:text-signal-ink mb-2">{fw.score}%</div>
                <div className="w-full bg-slate-700 dark:bg-white/[0.06] rounded-full h-1.5 mb-2">
                  <div className={`h-full rounded-full ${lightColor(fw.status)}`} style={{ width: `${fw.score}%` }} />
                </div>
                <div className="space-y-0.5 text-xs text-slate-400 dark:text-signal-sub">
                  <div className="flex justify-between"><span>Controls</span><span>{fw.controlsPassing}/{fw.controlsTotal}</span></div>
                  <div className="flex justify-between"><span>Findings</span><span className={fw.openFindings > 0 ? 'text-orange-400 dark:text-signal-amber' : 'text-green-400 dark:text-signal-good'}>{fw.openFindings}</span></div>
                  {fw.nextAudit && <div className="flex justify-between"><span>Next Audit</span><span>{fw.nextAudit}</span></div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Risks */}
        <div className="bg-slate-800 dark:bg-white/[0.03] rounded-2xl border border-slate-700 dark:border-white/[0.06] p-6">
          <h3 className="text-sm font-semibold dark:font-display dark:text-signal-ink mb-4">{t('risks.topRisks')}</h3>
          {topRisks.length === 0 ? (
            <p className="text-slate-500 dark:text-signal-muted text-sm text-center py-8">No open risks</p>
          ) : (
            <div className="space-y-3">
              {topRisks.map(risk => (
                <div key={risk.id} className="flex items-start gap-3 p-3 bg-slate-700/30 dark:bg-white/[0.04] rounded-lg">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${risk.score >= 15 ? 'bg-red-500/20 text-red-400 dark:bg-signal-bad/10 dark:text-signal-bad' : risk.score >= 10 ? 'bg-orange-500/20 text-orange-400 dark:bg-signal-amber/10 dark:text-signal-amber' : 'bg-yellow-500/20 text-yellow-400 dark:bg-signal-warn/10 dark:text-signal-warn'}`}>{risk.score}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium dark:text-signal-body truncate">{risk.title}</span>
                      {trendIcon(risk.trend)}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-signal-muted">
                      <span>{risk.category}</span>
                      {risk.owner && <><span>|</span><span>{risk.owner}</span></>}
                      <span className={`px-1.5 py-0.5 rounded ${risk.status === 'Open' ? 'bg-red-500/20 text-red-400 dark:bg-signal-bad/10 dark:text-signal-bad' : risk.status === 'Mitigating' ? 'bg-blue-500/20 text-blue-400 dark:bg-signal-blue/10 dark:text-signal-blue' : 'bg-green-500/20 text-green-400 dark:bg-signal-good/10 dark:text-signal-good'}`}>{risk.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Open incidents broken down by severity (current snapshot from /executive/dashboard) */}
        <div className="bg-slate-800 dark:bg-white/[0.03] rounded-2xl border border-slate-700 dark:border-white/[0.06] p-6">
          <h3 className="text-sm font-semibold dark:font-display dark:text-signal-ink mb-4">Open Incidents by Severity</h3>
          {incidentTrends.length === 0 ? (
            <p className="text-slate-500 dark:text-signal-muted text-sm text-center py-8">No incident data available</p>
          ) : (
            <>
              <div className="flex items-end gap-3 h-48 mb-4">
                {incidentTrends.map(m => {
                  const total = m.sev1 + m.sev2 + m.sev3 + m.sev4;
                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-0.5">
                      <span className="text-[10px] text-slate-400 dark:text-signal-muted font-mono">{total}</span>
                      <div className="w-full flex flex-col rounded-t overflow-hidden" style={{ height: `${maxIncidents > 0 ? (total / maxIncidents) * 100 : 0}%`, minHeight: '4px' }}>
                        {m.sev1 > 0 && <div className="bg-red-500 dark:bg-signal-bad" style={{ flex: m.sev1 }} />}
                        {m.sev2 > 0 && <div className="bg-orange-500 dark:bg-signal-amber" style={{ flex: m.sev2 }} />}
                        {m.sev3 > 0 && <div className="bg-yellow-500 dark:bg-signal-warn" style={{ flex: m.sev3 }} />}
                        {m.sev4 > 0 && <div className="bg-blue-500 dark:bg-signal-blue" style={{ flex: m.sev4 }} />}
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-signal-muted">{m.month}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500 dark:bg-signal-bad" />SEV-1</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500 dark:bg-signal-amber" />SEV-2</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-500 dark:bg-signal-warn" />SEV-3</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-signal-blue" />SEV-4</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Period Comparison */}
      <div className="bg-slate-800 dark:bg-white/[0.03] rounded-2xl border border-slate-700 dark:border-white/[0.06] p-6">
        <h3 className="text-sm font-semibold dark:font-display dark:text-signal-ink mb-4">Period Comparison</h3>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {[
            // hasPrior=false marks metrics the backend does not yet track over time
            // (their `previous` is the sentinel 0); those render "No prior period data"
            // instead of a delta computed against a non-existent baseline.
            { label: t('executive.compliancePosture'), current: periodComparison.current.complianceScore, previous: periodComparison.previous.complianceScore, suffix: '%', higherBetter: true, hasPrior: false },
            { label: t('risks.riskScore'), current: periodComparison.current.riskScore, previous: periodComparison.previous.riskScore, suffix: '/100', higherBetter: true, hasPrior: periodComparison.previous.riskScore > 0 },
            { label: 'Open Incidents', current: periodComparison.current.incidents, previous: periodComparison.previous.incidents, suffix: '', higherBetter: false, hasPrior: periodComparison.previous.incidents > 0 },
            { label: 'Open Findings', current: periodComparison.current.openFindings, previous: periodComparison.previous.openFindings, suffix: '', higherBetter: false, hasPrior: periodComparison.previous.openFindings > 0 },
            { label: 'Control Coverage', current: periodComparison.current.controlCoverage, previous: periodComparison.previous.controlCoverage, suffix: '%', higherBetter: true, hasPrior: false },
            { label: `${t('vendors.title')} ${t('vendors.complianceStatus')}`, current: periodComparison.current.vendorCompliance, previous: periodComparison.previous.vendorCompliance, suffix: '%', higherBetter: true, hasPrior: false },
          ].map(metric => {
            const change = metric.current - metric.previous;
            const isPositive = metric.higherBetter ? change > 0 : change < 0;
            return (
              <div key={metric.label} className="p-3 bg-slate-700/30 dark:bg-white/[0.04] rounded-xl text-center">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400 dark:text-signal-muted mb-1">{metric.label}</div>
                <div className="text-xl font-bold dark:font-display dark:text-signal-ink">{metric.current}{metric.suffix}</div>
                <div className={`flex items-center justify-center gap-1 text-xs mt-1 ${!metric.hasPrior ? 'text-slate-500 dark:text-signal-muted' : isPositive ? 'text-green-400 dark:text-signal-good' : change === 0 ? 'text-slate-400 dark:text-signal-sub' : 'text-red-400 dark:text-signal-bad'}`}>
                  {!metric.hasPrior ? (
                    <span>No prior period data</span>
                  ) : (
                    <>
                      {change > 0 ? <ArrowUp className="w-3 h-3" /> : change < 0 ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                      {Math.abs(change)}{metric.suffix} vs prior
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
