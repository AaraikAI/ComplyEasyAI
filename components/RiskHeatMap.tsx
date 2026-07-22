import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Minus, Filter, Download, BarChart3, Target, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { useI18n } from '../contexts/I18nContext';

interface RiskItem {
  id: string;
  title: string;
  severity: string;
  likelihood: number;
  impact: number;
  status: string;
  category?: string;
  owner?: string;
  trend?: 'up' | 'down' | 'stable';
}

interface HeatMapCell {
  likelihood: number;
  impact: number;
  risks: RiskItem[];
  level: 'critical' | 'high' | 'medium' | 'low' | 'minimal';
}

const LIKELIHOOD_LABELS = ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'];
const IMPACT_LABELS = ['Negligible', 'Minor', 'Moderate', 'Major', 'Catastrophic'];

const LEVEL_COLORS: Record<string, string> = {
  critical: 'bg-red-600 hover:bg-red-700 dark:bg-[rgba(248,113,113,0.28)] dark:hover:bg-[rgba(248,113,113,0.38)]',
  high: 'bg-orange-500 hover:bg-orange-600 dark:bg-[rgba(248,113,113,0.16)] dark:hover:bg-[rgba(248,113,113,0.24)]',
  medium: 'bg-yellow-400 hover:bg-yellow-500 dark:bg-[rgba(232,185,58,0.16)] dark:hover:bg-[rgba(232,185,58,0.24)]',
  low: 'bg-green-400 hover:bg-green-500 dark:bg-[rgba(52,200,138,0.14)] dark:hover:bg-[rgba(52,200,138,0.22)]',
  minimal: 'bg-green-200 hover:bg-green-300 dark:bg-[rgba(52,200,138,0.18)] dark:hover:bg-[rgba(52,200,138,0.26)]',
};

// Solid swatch colors for the legend and distribution bars (dark uses Signal tones).
const LEVEL_SWATCH: Record<string, string> = {
  critical: 'bg-red-600 dark:bg-signal-bad',
  high: 'bg-orange-500 dark:bg-signal-bad/60',
  medium: 'bg-yellow-400 dark:bg-signal-warn',
  low: 'bg-green-400 dark:bg-signal-good',
  minimal: 'bg-green-200 dark:bg-signal-good/50',
};

const LEVEL_TEXT: Record<string, string> = {
  critical: 'text-white dark:text-white',
  high: 'text-white dark:text-white',
  medium: 'text-gray-900 dark:text-white',
  low: 'text-gray-900 dark:text-white',
  minimal: 'text-gray-700 dark:text-white',
};

function getRiskLevel(likelihood: number, impact: number): 'critical' | 'high' | 'medium' | 'low' | 'minimal' {
  const score = likelihood * impact;
  if (score >= 20) return 'critical';
  if (score >= 12) return 'high';
  if (score >= 6) return 'medium';
  if (score >= 3) return 'low';
  return 'minimal';
}

// Keep likelihood/impact within the 1-5 matrix bounds regardless of how the record was stored.
function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 3;
  return Math.min(5, Math.max(1, Math.round(value)));
}

// Derive a trend only from data the backend actually provides (current vs. previous score).
// Returns undefined when no historical signal exists so the UI can omit the indicator.
function deriveTrend(r: any): 'up' | 'down' | 'stable' | undefined {
  if (r.trend === 'up' || r.trend === 'down' || r.trend === 'stable') return r.trend;
  const current = typeof r.riskScore === 'number' ? r.riskScore
    : (typeof r.likelihood === 'number' && typeof r.impact === 'number' ? r.likelihood * r.impact : undefined);
  const previous = typeof r.previousRiskScore === 'number' ? r.previousRiskScore : undefined;
  if (current === undefined || previous === undefined) return undefined;
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'stable';
}

const RiskHeatMap: React.FC = () => {
  const { t } = useI18n();
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<HeatMapCell | null>(null);
  const [showTarget, setShowTarget] = useState(false);
  const [filterFramework, setFilterFramework] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');

  useEffect(() => {
    fetchRisks();
  }, []);

  const fetchRisks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/risks?pageSize=100');
      // Risks endpoint returns raw array or { status, data: [...] }
      const rawItems = Array.isArray(response) ? response : (response?.data ?? []);
      const items = rawItems.map((r: any) => {
        // likelihood/impact are non-null on the server (schema default 3); clamp to the 1-5
        // matrix range and fall back to the neutral midpoint when a legacy record omits them,
        // so cell placement is deterministic rather than fabricated.
        const likelihood = clampScore(typeof r.likelihood === 'number' ? r.likelihood : 3);
        const impact = clampScore(typeof r.impact === 'number' ? r.impact : 3);
        return {
          id: r.id,
          title: r.title,
          severity: r.severity,
          likelihood,
          impact,
          status: r.status,
          category: r.category,
          owner: r.owner ?? r.remediationOwner,
          // trend is derived from the persisted score delta when the backend supplies it;
          // absent historical data, it stays undefined and the trend UI hides itself.
          trend: deriveTrend(r),
        };
      });
      setRisks(items);
    } catch (err: any) {
      setError(err.message || 'Failed to load risks');
    } finally {
      setIsLoading(false);
    }
  };

  // Target (residual) posture: deterministically reduce the inherent score for risks that are
  // being mitigated or have a mitigation plan. Resolved risks land at the minimum band. This is a
  // real transform of persisted fields (status / mitigationPlan), so the Target view differs from
  // Current only where mitigation actually exists.
  const displayRisks = useMemo(() => {
    if (!showTarget) return risks;
    return risks.map(r => {
      const resolved = r.status === 'Mitigated' || r.status === 'Closed' || r.status === 'Resolved' || r.status === 'Accepted';
      const beingMitigated = r.status === 'InProgress' || r.status === 'In Progress' || r.status === 'Mitigating' || (r as any).mitigationPlan;
      let targetLikelihood = r.likelihood;
      if (resolved) targetLikelihood = 1;
      else if (beingMitigated) targetLikelihood = Math.max(1, r.likelihood - 1);
      return { ...r, likelihood: targetLikelihood };
    });
  }, [risks, showTarget]);

  const heatMapData = useMemo(() => {
    const cells: HeatMapCell[][] = [];
    for (let l = 5; l >= 1; l--) {
      const row: HeatMapCell[] = [];
      for (let i = 1; i <= 5; i++) {
        const cellRisks = displayRisks.filter(r => r.likelihood === l && r.impact === i);
        row.push({
          likelihood: l,
          impact: i,
          risks: cellRisks,
          level: getRiskLevel(l, i),
        });
      }
      cells.push(row);
    }
    return cells;
  }, [displayRisks]);

  const stats = useMemo(() => {
    const critical = displayRisks.filter(r => getRiskLevel(r.likelihood, r.impact) === 'critical').length;
    const high = displayRisks.filter(r => getRiskLevel(r.likelihood, r.impact) === 'high').length;
    const avgScore = displayRisks.length > 0
      ? (displayRisks.reduce((sum, r) => sum + r.likelihood * r.impact, 0) / displayRisks.length).toFixed(1)
      : '0';
    const trendingUp = displayRisks.filter(r => r.trend === 'up').length;
    const hasTrendData = displayRisks.some(r => r.trend === 'up' || r.trend === 'down' || r.trend === 'stable');
    return { total: displayRisks.length, critical, high, avgScore, trendingUp, hasTrendData };
  }, [displayRisks]);

  const exportHeatMap = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 600, 600);
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('Risk Heat Map', 200, 30);

    const colors: Record<string, string> = {
      critical: '#dc2626', high: '#f97316', medium: '#facc15', low: '#4ade80', minimal: '#bbf7d0',
    };

    const cellSize = 90;
    const offsetX = 120;
    const offsetY = 60;

    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const cell = heatMapData[row][col];
        ctx.fillStyle = colors[cell.level];
        ctx.fillRect(offsetX + col * cellSize, offsetY + row * cellSize, cellSize - 2, cellSize - 2);

        if (cell.risks.length > 0) {
          ctx.fillStyle = cell.level === 'medium' || cell.level === 'low' || cell.level === 'minimal' ? '#1f2937' : '#ffffff';
          ctx.font = 'bold 20px sans-serif';
          ctx.fillText(String(cell.risks.length), offsetX + col * cellSize + 35, offsetY + row * cellSize + 50);
        }
      }
    }

    const link = document.createElement('a');
    link.download = 'risk-heatmap.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface-200 dark:bg-white/[0.06] rounded w-48" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-surface-200 dark:bg-white/[0.06] rounded-lg" />
            ))}
          </div>
          <div className="h-96 bg-surface-200 dark:bg-white/[0.06] rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle size={48} className="mx-auto text-red-400 dark:text-signal-bad mb-4" />
        <h3 className="text-lg font-semibold text-surface-900 dark:text-signal-ink mb-2">Failed to Load Risk Data</h3>
        <p className="text-sm text-surface-500 dark:text-signal-sub mb-4">{error}</p>
        <button onClick={fetchRisks} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 dark:bg-signal-green dark:text-signal-canvas dark:hover:bg-signal-green/90">Retry</button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-signal-ink dark:font-display">{t('risks.heatMap')}</h1>
          <p className="text-sm text-surface-500 dark:text-signal-sub mt-1">Interactive 5x5 risk matrix — Likelihood vs Impact</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTarget(!showTarget)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-colors ${
              showTarget
                ? 'bg-brand-50 dark:bg-signal-green/10 border-brand-300 dark:border-signal-green/40 text-brand-700 dark:text-signal-green'
                : 'border-surface-300 dark:border-white/[0.10] text-surface-700 dark:text-signal-sub hover:bg-surface-50 dark:hover:bg-white/[0.06]'
            }`}
          >
            <Target size={14} />
            {showTarget ? 'Current' : 'Target'} View
          </button>
          <button onClick={exportHeatMap} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-surface-300 dark:border-white/[0.10] rounded-lg text-surface-700 dark:text-signal-sub hover:bg-surface-50 dark:hover:bg-white/[0.06]">
            <Download size={14} />
            {t('common.export')}
          </button>
          <button onClick={fetchRisks} className="p-2 border border-surface-300 dark:border-white/[0.10] rounded-lg text-surface-700 dark:text-signal-sub hover:bg-surface-50 dark:hover:bg-white/[0.06]">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-white/[0.03] rounded-lg border border-surface-200 dark:border-white/[0.06] p-4">
          <p className="text-xs font-medium text-surface-500 dark:text-signal-sub uppercase">{t('common.total')} {t('risks.title')}</p>
          <p className="text-2xl font-bold text-surface-900 dark:text-signal-ink mt-1">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-white/[0.03] rounded-lg border border-surface-200 dark:border-white/[0.06] p-4">
          <p className="text-xs font-medium text-red-500 dark:text-signal-bad uppercase">{t('risks.critical')}</p>
          <p className="text-2xl font-bold text-red-600 dark:text-signal-bad mt-1">{stats.critical}</p>
        </div>
        <div className="bg-white dark:bg-white/[0.03] rounded-lg border border-surface-200 dark:border-white/[0.06] p-4">
          <p className="text-xs font-medium text-orange-500 dark:text-signal-warn uppercase">{t('risks.high')}</p>
          <p className="text-2xl font-bold text-orange-600 dark:text-signal-warn mt-1">{stats.high}</p>
        </div>
        <div className="bg-white dark:bg-white/[0.03] rounded-lg border border-surface-200 dark:border-white/[0.06] p-4">
          <p className="text-xs font-medium text-surface-500 dark:text-signal-sub uppercase">Avg Score</p>
          <p className="text-2xl font-bold text-surface-900 dark:text-signal-ink mt-1">{stats.avgScore}</p>
        </div>
        {stats.hasTrendData && (
          <div className="bg-white dark:bg-white/[0.03] rounded-lg border border-surface-200 dark:border-white/[0.06] p-4">
            <p className="text-xs font-medium text-surface-500 dark:text-signal-sub uppercase">Trending Up</p>
            <p className="text-2xl font-bold text-red-500 dark:text-signal-bad mt-1 flex items-center gap-1">
              {stats.trendingUp} <TrendingUp size={16} />
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heat Map */}
        <div className="lg:col-span-2 bg-white dark:bg-white/[0.03] rounded-xl border border-surface-200 dark:border-white/[0.06] p-6">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-signal-ink mb-4">
            {showTarget ? 'Target Risk Posture' : 'Current Risk Posture'}
          </h2>

          <div className="relative">
            {/* Y-axis label */}
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-semibold text-surface-500 dark:text-signal-sub tracking-wider uppercase whitespace-nowrap">
              {t('risks.likelihood')}
            </div>

            <div className="ml-8">
              {/* Grid */}
              <div className="space-y-1">
                {heatMapData.map((row, rowIdx) => (
                  <div key={rowIdx} className="flex items-center gap-1">
                    <span className="w-24 text-xs text-surface-500 dark:text-signal-sub text-right pr-2 flex-shrink-0">
                      {LIKELIHOOD_LABELS[4 - rowIdx]}
                    </span>
                    {row.map((cell, colIdx) => (
                      <button
                        key={colIdx}
                        onClick={() => setSelectedCell(cell.risks.length > 0 ? cell : null)}
                        className={`flex-1 aspect-square rounded-lg flex items-center justify-center transition-all ${LEVEL_COLORS[cell.level]} ${
                          selectedCell?.likelihood === cell.likelihood && selectedCell?.impact === cell.impact
                            ? 'ring-2 ring-offset-2 ring-brand-500 dark:ring-signal-green dark:ring-offset-signal-canvas'
                            : ''
                        }`}
                        title={`Likelihood: ${LIKELIHOOD_LABELS[cell.likelihood - 1]}, Impact: ${IMPACT_LABELS[cell.impact - 1]} — ${cell.risks.length} risk(s)`}
                      >
                        {cell.risks.length > 0 ? (
                          <span className={`text-lg font-bold dark:font-mono ${LEVEL_TEXT[cell.level]}`}>
                            {cell.risks.length}
                          </span>
                        ) : (
                          <span aria-hidden="true" className="hidden dark:inline font-mono text-sm text-white/25">·</span>
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>

              {/* X-axis labels */}
              <div className="flex mt-2 ml-24">
                {IMPACT_LABELS.map((label, i) => (
                  <span key={i} className="flex-1 text-xs text-surface-500 dark:text-signal-sub text-center">
                    {label}
                  </span>
                ))}
              </div>

              {/* X-axis title */}
              <p className="text-center text-xs font-semibold text-surface-500 dark:text-signal-sub tracking-wider uppercase mt-2">
                {t('risks.impact')}
              </p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-surface-200 dark:border-white/[0.06]">
            {[
              { level: 'critical', label: `${t('risks.critical')} (20-25)` },
              { level: 'high', label: `${t('risks.high')} (12-19)` },
              { level: 'medium', label: `${t('risks.medium')} (6-11)` },
              { level: 'low', label: `${t('risks.low')} (3-5)` },
              { level: 'minimal', label: 'Minimal (1-2)' },
            ].map(item => (
              <div key={item.level} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded ${LEVEL_SWATCH[item.level]}`} />
                <span className="text-[10px] text-surface-500 dark:text-signal-sub">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="bg-white dark:bg-white/[0.03] rounded-xl border border-surface-200 dark:border-white/[0.06] p-6">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-signal-ink mb-4">
            {selectedCell ? `Risks (${LIKELIHOOD_LABELS[selectedCell.likelihood - 1]} / ${IMPACT_LABELS[selectedCell.impact - 1]})` : 'Select a Cell'}
          </h3>

          {selectedCell ? (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {selectedCell.risks.map(risk => (
                <div key={risk.id} className="p-3 rounded-lg bg-surface-50 dark:bg-white/[0.04] border border-surface-200 dark:border-white/[0.06]">
                  <div className="flex items-start justify-between">
                    <h4 className="text-sm font-medium text-surface-900 dark:text-signal-ink line-clamp-2">{risk.title}</h4>
                    <div className="flex-shrink-0 ml-2">
                      {risk.trend === 'up' && <TrendingUp size={14} className="text-red-500 dark:text-signal-bad" />}
                      {risk.trend === 'down' && <TrendingDown size={14} className="text-green-500 dark:text-signal-good" />}
                      {risk.trend === 'stable' && <Minus size={14} className="text-gray-400 dark:text-signal-muted" />}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      risk.severity === 'Critical' ? 'bg-red-100 text-red-700 dark:bg-signal-bad/20 dark:text-signal-bad' :
                      risk.severity === 'High' ? 'bg-orange-100 text-orange-700 dark:bg-signal-bad/10 dark:text-signal-bad' :
                      risk.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-signal-warn/10 dark:text-signal-warn' :
                      'bg-green-100 text-green-700 dark:bg-signal-good/10 dark:text-signal-good'
                    }`}>
                      {risk.severity}
                    </span>
                    <span className="text-[10px] text-surface-500 dark:text-signal-sub">
                      {t('risks.riskScore')}: {risk.likelihood * risk.impact}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      risk.status === 'Open' ? 'bg-blue-100 text-blue-700 dark:bg-signal-blue/10 dark:text-signal-blue' :
                      risk.status === 'Mitigated' ? 'bg-green-100 text-green-700 dark:bg-signal-good/10 dark:text-signal-good' :
                      'bg-surface-100 text-surface-600 dark:bg-white/[0.06] dark:text-signal-sub'
                    }`}>
                      {risk.status}
                    </span>
                  </div>
                  {risk.owner && (
                    <p className="text-[10px] text-surface-400 dark:text-signal-muted mt-1">{t('common.owner')}: {risk.owner}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 size={48} className="mx-auto text-surface-300 dark:text-signal-muted mb-3" />
              <p className="text-sm text-surface-500 dark:text-signal-sub">
                Click a cell on the heat map to view risks in that quadrant
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Risk Summary Table */}
      <div className="bg-white dark:bg-white/[0.03] rounded-xl border border-surface-200 dark:border-white/[0.06] p-6">
        <h3 className="text-lg font-semibold text-surface-900 dark:text-signal-ink mb-4">Risk Summary by Level</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200 dark:border-white/[0.06]">
                <th className="text-left py-2 px-3 font-mono text-[10px] uppercase tracking-[0.14em] font-medium text-surface-500 dark:text-signal-muted">Level</th>
                <th className="text-center py-2 px-3 font-mono text-[10px] uppercase tracking-[0.14em] font-medium text-surface-500 dark:text-signal-muted">Count</th>
                <th className="text-center py-2 px-3 font-mono text-[10px] uppercase tracking-[0.14em] font-medium text-surface-500 dark:text-signal-muted">% of Total</th>
                <th className="text-left py-2 px-3 font-mono text-[10px] uppercase tracking-[0.14em] font-medium text-surface-500 dark:text-signal-muted">Distribution</th>
              </tr>
            </thead>
            <tbody>
              {['critical', 'high', 'medium', 'low', 'minimal'].map(level => {
                const count = displayRisks.filter(r => getRiskLevel(r.likelihood, r.impact) === level).length;
                const pct = displayRisks.length > 0 ? Math.round((count / displayRisks.length) * 100) : 0;
                return (
                  <tr key={level} className="border-b border-surface-100 dark:border-white/[0.04]">
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded ${LEVEL_SWATCH[level]}`} />
                        <span className="capitalize font-medium text-surface-900 dark:text-signal-ink">{level}</span>
                      </div>
                    </td>
                    <td className="text-center py-2 px-3 font-semibold text-surface-900 dark:text-signal-ink">{count}</td>
                    <td className="text-center py-2 px-3 text-surface-500 dark:text-signal-sub">{pct}%</td>
                    <td className="py-2 px-3">
                      <div className="w-full bg-surface-100 dark:bg-white/[0.06] rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${LEVEL_SWATCH[level]}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RiskHeatMap;
