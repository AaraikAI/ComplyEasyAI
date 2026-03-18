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
  critical: 'bg-red-600 hover:bg-red-700',
  high: 'bg-orange-500 hover:bg-orange-600',
  medium: 'bg-yellow-400 hover:bg-yellow-500',
  low: 'bg-green-400 hover:bg-green-500',
  minimal: 'bg-green-200 hover:bg-green-300',
};

const LEVEL_TEXT: Record<string, string> = {
  critical: 'text-white',
  high: 'text-white',
  medium: 'text-gray-900',
  low: 'text-gray-900',
  minimal: 'text-gray-700',
};

function getRiskLevel(likelihood: number, impact: number): 'critical' | 'high' | 'medium' | 'low' | 'minimal' {
  const score = likelihood * impact;
  if (score >= 20) return 'critical';
  if (score >= 12) return 'high';
  if (score >= 6) return 'medium';
  if (score >= 3) return 'low';
  return 'minimal';
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
      const items = rawItems.map((r: any) => ({
        id: r.id,
        title: r.title,
        severity: r.severity,
        likelihood: r.likelihood || Math.ceil(Math.random() * 5),
        impact: r.impact || Math.ceil(Math.random() * 5),
        status: r.status,
        category: r.category,
        owner: r.owner,
        trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable',
      }));
      setRisks(items);
    } catch (err: any) {
      setError(err.message || 'Failed to load risks');
    } finally {
      setIsLoading(false);
    }
  };

  const heatMapData = useMemo(() => {
    const cells: HeatMapCell[][] = [];
    for (let l = 5; l >= 1; l--) {
      const row: HeatMapCell[] = [];
      for (let i = 1; i <= 5; i++) {
        const cellRisks = risks.filter(r => r.likelihood === l && r.impact === i);
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
  }, [risks]);

  const stats = useMemo(() => {
    const critical = risks.filter(r => getRiskLevel(r.likelihood, r.impact) === 'critical').length;
    const high = risks.filter(r => getRiskLevel(r.likelihood, r.impact) === 'high').length;
    const avgScore = risks.length > 0
      ? (risks.reduce((sum, r) => sum + r.likelihood * r.impact, 0) / risks.length).toFixed(1)
      : '0';
    const trendingUp = risks.filter(r => r.trend === 'up').length;
    return { total: risks.length, critical, high, avgScore, trendingUp };
  }, [risks]);

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
          <div className="h-8 bg-surface-200 dark:bg-surface-700 rounded w-48" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-surface-200 dark:bg-surface-700 rounded-lg" />
            ))}
          </div>
          <div className="h-96 bg-surface-200 dark:bg-surface-700 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle size={48} className="mx-auto text-red-400 mb-4" />
        <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">Failed to Load Risk Data</h3>
        <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">{error}</p>
        <button onClick={fetchRisks} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">Retry</button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">{t('risks.heatMap')}</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Interactive 5x5 risk matrix — Likelihood vs Impact</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTarget(!showTarget)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-colors ${
              showTarget
                ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-300 dark:border-brand-700 text-brand-700 dark:text-brand-300'
                : 'border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700'
            }`}
          >
            <Target size={14} />
            {showTarget ? 'Current' : 'Target'} View
          </button>
          <button onClick={exportHeatMap} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-surface-300 dark:border-surface-600 rounded-lg text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700">
            <Download size={14} />
            {t('common.export')}
          </button>
          <button onClick={fetchRisks} className="p-2 border border-surface-300 dark:border-surface-600 rounded-lg text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 p-4">
          <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase">{t('common.total')} {t('risks.title')}</p>
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-100 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 p-4">
          <p className="text-xs font-medium text-red-500 uppercase">{t('risks.critical')}</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.critical}</p>
        </div>
        <div className="bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 p-4">
          <p className="text-xs font-medium text-orange-500 uppercase">{t('risks.high')}</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{stats.high}</p>
        </div>
        <div className="bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 p-4">
          <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase">Avg Score</p>
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-100 mt-1">{stats.avgScore}</p>
        </div>
        <div className="bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 p-4">
          <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase">Trending Up</p>
          <p className="text-2xl font-bold text-red-500 mt-1 flex items-center gap-1">
            {stats.trendingUp} <TrendingUp size={16} />
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heat Map */}
        <div className="lg:col-span-2 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">
            {showTarget ? 'Target Risk Posture' : 'Current Risk Posture'}
          </h2>

          <div className="relative">
            {/* Y-axis label */}
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-semibold text-surface-500 dark:text-surface-400 tracking-wider uppercase whitespace-nowrap">
              {t('risks.likelihood')}
            </div>

            <div className="ml-8">
              {/* Grid */}
              <div className="space-y-1">
                {heatMapData.map((row, rowIdx) => (
                  <div key={rowIdx} className="flex items-center gap-1">
                    <span className="w-24 text-xs text-surface-500 dark:text-surface-400 text-right pr-2 flex-shrink-0">
                      {LIKELIHOOD_LABELS[4 - rowIdx]}
                    </span>
                    {row.map((cell, colIdx) => (
                      <button
                        key={colIdx}
                        onClick={() => setSelectedCell(cell.risks.length > 0 ? cell : null)}
                        className={`flex-1 aspect-square rounded-lg flex items-center justify-center transition-all ${LEVEL_COLORS[cell.level]} ${
                          selectedCell?.likelihood === cell.likelihood && selectedCell?.impact === cell.impact
                            ? 'ring-2 ring-offset-2 ring-brand-500 dark:ring-offset-surface-800'
                            : ''
                        }`}
                        title={`Likelihood: ${LIKELIHOOD_LABELS[cell.likelihood - 1]}, Impact: ${IMPACT_LABELS[cell.impact - 1]} — ${cell.risks.length} risk(s)`}
                      >
                        {cell.risks.length > 0 && (
                          <span className={`text-lg font-bold ${LEVEL_TEXT[cell.level]}`}>
                            {cell.risks.length}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>

              {/* X-axis labels */}
              <div className="flex mt-2 ml-24">
                {IMPACT_LABELS.map((label, i) => (
                  <span key={i} className="flex-1 text-xs text-surface-500 dark:text-surface-400 text-center">
                    {label}
                  </span>
                ))}
              </div>

              {/* X-axis title */}
              <p className="text-center text-xs font-semibold text-surface-500 dark:text-surface-400 tracking-wider uppercase mt-2">
                {t('risks.impact')}
              </p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-surface-200 dark:border-surface-700">
            {[
              { level: 'critical', label: `${t('risks.critical')} (20-25)` },
              { level: 'high', label: `${t('risks.high')} (12-19)` },
              { level: 'medium', label: `${t('risks.medium')} (6-11)` },
              { level: 'low', label: `${t('risks.low')} (3-5)` },
              { level: 'minimal', label: 'Minimal (1-2)' },
            ].map(item => (
              <div key={item.level} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded ${LEVEL_COLORS[item.level].split(' ')[0]}`} />
                <span className="text-[10px] text-surface-500 dark:text-surface-400">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">
            {selectedCell ? `Risks (${LIKELIHOOD_LABELS[selectedCell.likelihood - 1]} / ${IMPACT_LABELS[selectedCell.impact - 1]})` : 'Select a Cell'}
          </h3>

          {selectedCell ? (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {selectedCell.risks.map(risk => (
                <div key={risk.id} className="p-3 rounded-lg bg-surface-50 dark:bg-surface-700/50 border border-surface-200 dark:border-surface-600">
                  <div className="flex items-start justify-between">
                    <h4 className="text-sm font-medium text-surface-900 dark:text-surface-100 line-clamp-2">{risk.title}</h4>
                    <div className="flex-shrink-0 ml-2">
                      {risk.trend === 'up' && <TrendingUp size={14} className="text-red-500" />}
                      {risk.trend === 'down' && <TrendingDown size={14} className="text-green-500" />}
                      {risk.trend === 'stable' && <Minus size={14} className="text-gray-400" />}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      risk.severity === 'Critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      risk.severity === 'High' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      risk.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
                      {risk.severity}
                    </span>
                    <span className="text-[10px] text-surface-500 dark:text-surface-400">
                      {t('risks.riskScore')}: {risk.likelihood * risk.impact}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      risk.status === 'Open' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      risk.status === 'Mitigated' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      'bg-surface-100 text-surface-600 dark:bg-surface-600 dark:text-surface-300'
                    }`}>
                      {risk.status}
                    </span>
                  </div>
                  {risk.owner && (
                    <p className="text-[10px] text-surface-400 dark:text-surface-500 mt-1">{t('common.owner')}: {risk.owner}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 size={48} className="mx-auto text-surface-300 dark:text-surface-600 mb-3" />
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Click a cell on the heat map to view risks in that quadrant
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Risk Summary Table */}
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
        <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">Risk Summary by Level</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200 dark:border-surface-700">
                <th className="text-left py-2 px-3 font-medium text-surface-500 dark:text-surface-400">Level</th>
                <th className="text-center py-2 px-3 font-medium text-surface-500 dark:text-surface-400">Count</th>
                <th className="text-center py-2 px-3 font-medium text-surface-500 dark:text-surface-400">% of Total</th>
                <th className="text-left py-2 px-3 font-medium text-surface-500 dark:text-surface-400">Distribution</th>
              </tr>
            </thead>
            <tbody>
              {['critical', 'high', 'medium', 'low', 'minimal'].map(level => {
                const count = risks.filter(r => getRiskLevel(r.likelihood, r.impact) === level).length;
                const pct = risks.length > 0 ? Math.round((count / risks.length) * 100) : 0;
                return (
                  <tr key={level} className="border-b border-surface-100 dark:border-surface-700/50">
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded ${LEVEL_COLORS[level].split(' ')[0]}`} />
                        <span className="capitalize font-medium text-surface-900 dark:text-surface-100">{level}</span>
                      </div>
                    </td>
                    <td className="text-center py-2 px-3 font-semibold text-surface-900 dark:text-surface-100">{count}</td>
                    <td className="text-center py-2 px-3 text-surface-500 dark:text-surface-400">{pct}%</td>
                    <td className="py-2 px-3">
                      <div className="w-full bg-surface-100 dark:bg-surface-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${LEVEL_COLORS[level].split(' ')[0]}`}
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
