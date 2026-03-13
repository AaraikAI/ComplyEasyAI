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
 */

import React, { useState, useMemo } from 'react';
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

// ── Mock Data ───────────────────────────────────────────────────────────────

const frameworks: FrameworkStatus[] = [
  { name: 'SOC 2 Type II', score: 94, status: 'green', trend: 'improving', controlsTotal: 142, controlsPassing: 138, lastAudit: '2025-06-15', nextAudit: '2026-04-01', openFindings: 2 },
  { name: 'ISO 27001', score: 91, status: 'green', trend: 'stable', controlsTotal: 93, controlsPassing: 87, lastAudit: '2025-09-15', nextAudit: '2026-03-15', openFindings: 1 },
  { name: 'GDPR', score: 88, status: 'yellow', trend: 'improving', controlsTotal: 65, controlsPassing: 58, lastAudit: '2025-08-01', nextAudit: '2026-08-01', openFindings: 3 },
  { name: 'HIPAA', score: 72, status: 'red', trend: 'degrading', controlsTotal: 78, controlsPassing: 56, lastAudit: '2024-05-15', nextAudit: '2026-05-01', openFindings: 5 },
  { name: 'PCI DSS', score: 85, status: 'yellow', trend: 'stable', controlsTotal: 264, controlsPassing: 228, lastAudit: '2024-12-01', nextAudit: '2026-03-01', openFindings: 3 },
];

const topRisks: TopRisk[] = [
  { id: 'R-001', title: 'Third-party data breach via vendor', category: 'Vendor Risk', likelihood: 3, impact: 5, score: 15, owner: 'Sarah Chen', status: 'Mitigating', trend: 'stable' },
  { id: 'R-002', title: 'Regulatory fine for GDPR non-compliance', category: 'Regulatory', likelihood: 2, impact: 5, score: 10, owner: 'Legal Team', status: 'Mitigating', trend: 'improving' },
  { id: 'R-003', title: 'Ransomware attack on infrastructure', category: 'Cybersecurity', likelihood: 3, impact: 4, score: 12, owner: 'Security Team', status: 'Open', trend: 'stable' },
  { id: 'R-004', title: 'Key personnel turnover in security team', category: 'Operational', likelihood: 4, impact: 3, score: 12, owner: 'HR', status: 'Open', trend: 'degrading' },
  { id: 'R-005', title: 'Cloud misconfiguration leading to data exposure', category: 'Technology', likelihood: 3, impact: 4, score: 12, owner: 'DevOps', status: 'Mitigating', trend: 'improving' },
];

const incidentTrends: IncidentTrend[] = [
  { month: 'Jul', sev1: 0, sev2: 1, sev3: 2, sev4: 5 },
  { month: 'Aug', sev1: 1, sev2: 0, sev3: 3, sev4: 4 },
  { month: 'Sep', sev1: 0, sev2: 2, sev3: 1, sev4: 6 },
  { month: 'Oct', sev1: 0, sev2: 1, sev3: 2, sev4: 3 },
  { month: 'Nov', sev1: 0, sev2: 0, sev3: 3, sev4: 4 },
  { month: 'Dec', sev1: 1, sev2: 2, sev3: 1, sev4: 3 },
];

const periodComparison = {
  current: { complianceScore: 88, riskScore: 72, incidents: 8, openFindings: 14, controlCoverage: 92, vendorCompliance: 85 },
  previous: { complianceScore: 84, riskScore: 68, incidents: 12, openFindings: 19, controlCoverage: 88, vendorCompliance: 80 },
};

// ── Component ───────────────────────────────────────────────────────────────

const ExecutiveDashboard: React.FC = () => {
  const { t } = useI18n();
  const [selectedPeriod, setSelectedPeriod] = useState<'quarter' | 'year'>('quarter');

  const overallScore = useMemo(() => Math.round(frameworks.reduce((s, f) => s + f.score, 0) / frameworks.length), []);
  const overallStatus: TrafficLight = overallScore >= 90 ? 'green' : overallScore >= 75 ? 'yellow' : 'red';

  const maxIncidents = Math.max(...incidentTrends.map(m => m.sev1 + m.sev2 + m.sev3 + m.sev4));

  const trendIcon = (trend: RiskTrend) => {
    if (trend === 'improving') return <ArrowUp className="w-3 h-3 text-green-400" />;
    if (trend === 'degrading') return <ArrowDown className="w-3 h-3 text-red-400" />;
    return <Minus className="w-3 h-3 text-slate-400" />;
  };

  const lightColor = (status: TrafficLight) => {
    if (status === 'green') return 'bg-green-500';
    if (status === 'yellow') return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const pctChange = (curr: number, prev: number) => {
    if (prev === 0) return 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  return (
    <div className="min-h-screen bg-slate-900 dark:bg-slate-950 text-white p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg"><BarChart3 className="w-6 h-6 text-blue-400" /></div>
            <div><h1 className="text-2xl font-bold">{t('executive.title')}</h1><p className="text-slate-400 text-sm">Board-level compliance and risk overview</p></div>
          </div>
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg p-0.5">
            <button onClick={() => setSelectedPeriod('quarter')} className={`px-3 py-1.5 rounded-md text-sm ${selectedPeriod === 'quarter' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Quarterly</button>
            <button onClick={() => setSelectedPeriod('year')} className={`px-3 py-1.5 rounded-md text-sm ${selectedPeriod === 'year' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Annual</button>
          </div>
        </div>
      </div>

      {/* Overall Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 flex items-center gap-6">
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#334155" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke={overallStatus === 'green' ? '#22c55e' : overallStatus === 'yellow' ? '#eab308' : '#ef4444'} strokeWidth="8" strokeDasharray={`${overallScore * 2.64} 264`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold">{overallScore}%</span>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold">{t('executive.compliancePosture')}</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-3 h-3 rounded-full ${lightColor(overallStatus)}`} />
              <span className="text-sm text-slate-400 capitalize">{overallStatus === 'green' ? 'Healthy' : overallStatus === 'yellow' ? 'Needs Attention' : 'Critical'}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{frameworks.length} frameworks monitored</p>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-400">{t('executive.riskOverview')}</span>
            <Target className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-3xl font-bold mb-1">{periodComparison.current.riskScore}/100</div>
          <div className="flex items-center gap-1 text-xs">
            {pctChange(periodComparison.current.riskScore, periodComparison.previous.riskScore) > 0 ? (
              <><ArrowUp className="w-3 h-3 text-green-400" /><span className="text-green-400">+{pctChange(periodComparison.current.riskScore, periodComparison.previous.riskScore)}% vs last period</span></>
            ) : (
              <><ArrowDown className="w-3 h-3 text-red-400" /><span className="text-red-400">{pctChange(periodComparison.current.riskScore, periodComparison.previous.riskScore)}% vs last period</span></>
            )}
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-400">Open Incidents</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-3xl font-bold mb-1">{periodComparison.current.incidents}</div>
          <div className="flex items-center gap-1 text-xs">
            <ArrowDown className="w-3 h-3 text-green-400" />
            <span className="text-green-400">-{Math.round(((periodComparison.previous.incidents - periodComparison.current.incidents) / periodComparison.previous.incidents) * 100)}% vs last period</span>
          </div>
        </div>
      </div>

      {/* Framework Traffic Lights */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
        <h3 className="text-sm font-semibold mb-4">Framework Compliance Status</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {frameworks.map(fw => (
            <div key={fw.name} className={`p-4 rounded-xl border ${fw.status === 'green' ? 'border-green-500/30 bg-green-500/5' : fw.status === 'yellow' ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className={`w-4 h-4 rounded-full ${lightColor(fw.status)} shadow-lg ${fw.status === 'red' ? 'animate-pulse' : ''}`} />
                {trendIcon(fw.trend)}
              </div>
              <h4 className="text-sm font-medium mb-1">{fw.name}</h4>
              <div className="text-2xl font-bold mb-2">{fw.score}%</div>
              <div className="w-full bg-slate-700 rounded-full h-1.5 mb-2">
                <div className={`h-full rounded-full ${lightColor(fw.status)}`} style={{ width: `${fw.score}%` }} />
              </div>
              <div className="space-y-0.5 text-xs text-slate-400">
                <div className="flex justify-between"><span>Controls</span><span>{fw.controlsPassing}/{fw.controlsTotal}</span></div>
                <div className="flex justify-between"><span>Findings</span><span className={fw.openFindings > 0 ? 'text-orange-400' : 'text-green-400'}>{fw.openFindings}</span></div>
                <div className="flex justify-between"><span>Next Audit</span><span>{fw.nextAudit}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Risks */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h3 className="text-sm font-semibold mb-4">{t('risks.topRisks')}</h3>
          <div className="space-y-3">
            {topRisks.map(risk => (
              <div key={risk.id} className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${risk.score >= 15 ? 'bg-red-500/20 text-red-400' : risk.score >= 10 ? 'bg-orange-500/20 text-orange-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{risk.score}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{risk.title}</span>
                    {trendIcon(risk.trend)}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                    <span>{risk.category}</span>
                    <span>|</span>
                    <span>{risk.owner}</span>
                    <span className={`px-1.5 py-0.5 rounded ${risk.status === 'Open' ? 'bg-red-500/20 text-red-400' : risk.status === 'Mitigating' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>{risk.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Incident Trends */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h3 className="text-sm font-semibold mb-4">Incident Trends (6 Months)</h3>
          <div className="flex items-end gap-3 h-48 mb-4">
            {incidentTrends.map(m => {
              const total = m.sev1 + m.sev2 + m.sev3 + m.sev4;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-0.5">
                  <span className="text-[10px] text-slate-400 font-mono">{total}</span>
                  <div className="w-full flex flex-col rounded-t overflow-hidden" style={{ height: `${maxIncidents > 0 ? (total / maxIncidents) * 100 : 0}%`, minHeight: '4px' }}>
                    {m.sev1 > 0 && <div className="bg-red-500" style={{ flex: m.sev1 }} />}
                    {m.sev2 > 0 && <div className="bg-orange-500" style={{ flex: m.sev2 }} />}
                    {m.sev3 > 0 && <div className="bg-yellow-500" style={{ flex: m.sev3 }} />}
                    {m.sev4 > 0 && <div className="bg-blue-500" style={{ flex: m.sev4 }} />}
                  </div>
                  <span className="text-[10px] text-slate-500">{m.month}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" />SEV-1</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500" />SEV-2</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-500" />SEV-3</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" />SEV-4</span>
          </div>
        </div>
      </div>

      {/* Period Comparison */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <h3 className="text-sm font-semibold mb-4">Period Comparison</h3>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {[
            { label: t('executive.compliancePosture'), current: periodComparison.current.complianceScore, previous: periodComparison.previous.complianceScore, suffix: '%', higherBetter: true },
            { label: t('risks.riskScore'), current: periodComparison.current.riskScore, previous: periodComparison.previous.riskScore, suffix: '/100', higherBetter: true },
            { label: 'Open Incidents', current: periodComparison.current.incidents, previous: periodComparison.previous.incidents, suffix: '', higherBetter: false },
            { label: 'Open Findings', current: periodComparison.current.openFindings, previous: periodComparison.previous.openFindings, suffix: '', higherBetter: false },
            { label: 'Control Coverage', current: periodComparison.current.controlCoverage, previous: periodComparison.previous.controlCoverage, suffix: '%', higherBetter: true },
            { label: `${t('vendors.title')} ${t('vendors.complianceStatus')}`, current: periodComparison.current.vendorCompliance, previous: periodComparison.previous.vendorCompliance, suffix: '%', higherBetter: true },
          ].map(metric => {
            const change = metric.current - metric.previous;
            const isPositive = metric.higherBetter ? change > 0 : change < 0;
            return (
              <div key={metric.label} className="p-3 bg-slate-700/30 rounded-xl text-center">
                <div className="text-xs text-slate-400 mb-1">{metric.label}</div>
                <div className="text-xl font-bold">{metric.current}{metric.suffix}</div>
                <div className={`flex items-center justify-center gap-1 text-xs mt-1 ${isPositive ? 'text-green-400' : change === 0 ? 'text-slate-400' : 'text-red-400'}`}>
                  {change > 0 ? <ArrowUp className="w-3 h-3" /> : change < 0 ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                  {Math.abs(change)}{metric.suffix} vs prior
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
