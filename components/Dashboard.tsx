
import React, { useRef, useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  ChevronRight,
  ArrowRight,
  Calendar,
  Layers,
  Search,
  FileText,
  Zap,
  Lock,
  Sun,
  Clock,
  ChevronDown
} from 'lucide-react';
import { ComplianceFramework, ViewState, RiskItem } from '../types';
import { useOnboardingTrigger } from '../hooks/useOnboarding';
import { useI18n } from '../contexts/I18nContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'sonner';
import { api } from '../services/api';
import { logger } from '../utils/logger';

interface DashboardProps {
  frameworks: ComplianceFramework[];
  risks: RiskItem[];
  onNavigate: (view: ViewState) => void;
}

// Local fallback: generate trend data from current framework scores
const generateTrendDataLocal = (frameworks: ComplianceFramework[]) => {
  const now = new Date();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(monthNames[date.getMonth()]);
  }

  const calculateCurrentScore = () => {
    if (frameworks.length === 0) return 0;
    let totalControls = 0;
    let compliantControls = 0;
    frameworks.forEach((fw: any) => {
      if (fw.controls && Array.isArray(fw.controls) && fw.controls.length > 0) {
        totalControls += fw.controls.length;
        compliantControls += fw.controls.filter((c: any) =>
          c.status === 'Implemented' || c.status === 'Compliant'
        ).length;
      } else {
        totalControls += 100;
        compliantControls += fw.progress || 0;
      }
    });
    return totalControls > 0 ? Math.round((compliantControls / totalControls) * 100) : 0;
  };

  const currentScore = calculateCurrentScore();

  return months.map((month, index) => {
    const monthsAgo = 5 - index;
    const progressFactor = 1 - (monthsAgo / 6);
    const baseScore = Math.max(0, currentScore - 30);
    const score = Math.round(baseScore + (currentScore - baseScore) * progressFactor);
    return { name: month, score: Math.max(0, Math.min(100, score)) };
  });
};

export const Dashboard: React.FC<DashboardProps> = ({ frameworks, risks, onNavigate }) => {
  const { t } = useI18n();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // Chart palette: Signal tokens in dark, existing brand palette in light
  const chartStroke = isDark ? '#38E8A6' : '#0d9488';
  const chartGrid = isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0';
  const chartTick = isDark ? '#9aa4b5' : '#64748b';
  const chartDotStroke = isDark ? '#0C1017' : '#fff';

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartReady, setChartReady] = useState(false);
  const [trendData, setTrendData] = useState<{ name: string; score: number }[]>([]);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);

  // Fetch historical compliance scores from API with local fallback
  useEffect(() => {
    let cancelled = false;

    const fetchHistoricalScores = async () => {
      try {
        const data = await api.get('/frameworks/scores/history?months=6');
        if (!cancelled && data?.scores && Array.isArray(data.scores)) {
          setTrendData(data.scores.map((s: any) => ({ name: s.name, score: s.score })));
          return;
        }
      } catch {
        // API unavailable — fall through to local generation
      }
      if (!cancelled) {
        setTrendData(generateTrendDataLocal(frameworks));
      }
    };

    fetchHistoricalScores();
    return () => { cancelled = true; };
  }, [frameworks]);

  // Onboarding: auto-trigger welcome flow for first-time users (handled in context)
  // Dashboard-level trigger not needed since context auto-starts welcome on mount

  // Wait for container to be ready before rendering chart
  useEffect(() => {
    const checkContainer = () => {
      if (chartContainerRef.current) {
        const { width, height } = chartContainerRef.current.getBoundingClientRect();
        if (width > 0 && height > 0) {
          setChartReady(true);
        } else {
          // Retry after a short delay
          setTimeout(checkContainer, 100);
        }
      }
    };

    // Check immediately and on resize
    checkContainer();
    window.addEventListener('resize', checkContainer);

    return () => window.removeEventListener('resize', checkContainer);
  }, []);

  // Calculate compliance score dynamically based on actual control statuses
  const calculateComplianceScore = () => {
    if (!frameworks || frameworks.length === 0) return 0;

    let totalControls = 0;
    let compliantControls = 0;

    frameworks.forEach((fw: any) => {
      // If framework has controls array, calculate from actual control statuses
      if (fw.controls && Array.isArray(fw.controls) && fw.controls.length > 0) {
        const frameworkControls = fw.controls.length;
        const compliant = fw.controls.filter((c: any) =>
          c && (c.status === 'Implemented' || c.status === 'Compliant')
        ).length;
        totalControls += frameworkControls;
        compliantControls += compliant;
      } else {
        // Fallback to progress percentage if controls not available
        totalControls += 100;
        compliantControls += fw.progress || 0;
      }
    });

    return totalControls > 0
      ? Math.round((compliantControls / totalControls) * 100)
      : 0;
  };

  const avgScore = calculateComplianceScore();

  // Use API-fetched trend data (from useEffect), validated for chart rendering
  const chartTrendData = React.useMemo(() => {
    if (trendData.length > 0) {
      return trendData.map(d => ({
        name: d.name || 'Unknown',
        score: typeof d.score === 'number' && !isNaN(d.score) ? Math.max(0, Math.min(100, d.score)) : 0,
      }));
    }
    return [{ name: 'Jan', score: 0 }, { name: 'Feb', score: 0 }, { name: 'Mar', score: 0 }, { name: 'Apr', score: 0 }, { name: 'May', score: 0 }, { name: 'Jun', score: 0 }];
  }, [trendData]);

  // Month-over-month compliance-score delta, derived from the last two trend points.
  const scoreTrend = React.useMemo<{ delta: number; direction: 'up' | 'down' | 'flat' } | null>(() => {
    if (chartTrendData.length < 2) return null;
    const latest = chartTrendData[chartTrendData.length - 1].score;
    const previous = chartTrendData[chartTrendData.length - 2].score;
    const delta = latest - previous;
    return { delta, direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat' };
  }, [chartTrendData]);

  const activeCount = frameworks.length;
  const criticalRiskCount = risks.filter(r => r.severity === 'High' && r.status !== 'Resolved').length;

  // Calculate upcoming audits dynamically from actual framework dates
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Reset to start of day for accurate day calculation

  const allAudits = frameworks
    .filter(fw => fw && fw.nextAuditDate) // Only include frameworks with valid audit dates
    .map(fw => {
      try {
        const auditDate = new Date(fw.nextAuditDate);
        auditDate.setHours(0, 0, 0, 0); // Reset to start of day

        // Check if date is valid
        if (isNaN(auditDate.getTime())) {
          return null;
        }

        // Calculate days difference
        const diffTime = auditDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
          framework: fw,
          date: auditDate,
          days: diffDays,
        };
      } catch (error) {
        logger.error(`Invalid audit date for framework ${fw.name}:`, fw.nextAuditDate);
        return null;
      }
    })
    .filter((a): a is NonNullable<typeof a> => a !== null) // Remove null entries
    .sort((a, b) => a.date.getTime() - b.date.getTime()); // Sort by date (earliest first)

  // Get the nearest upcoming audit (could be overdue or future)
  const upcomingAudit = allAudits.length > 0 ? allAudits[0] : null;
  const auditDays = upcomingAudit ? upcomingAudit.days : null;

  // Get audits happening today (within 0 days)
  const auditsToday = allAudits.filter(a => a.days === 0);

  // Get top 3 recent open risks for the dashboard widget
  const priorityRisks = risks
    .filter(r => r && (r.status === 'Open' || r.status === 'In Progress'))
    .slice(0, 3);

  // SVG ring chart calculations
  const ringRadius = 70;
  const ringStroke = 10;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (avgScore / 100) * ringCircumference;

  // Greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Audit contextual colors
  const getAuditColors = () => {
    if (auditDays === null) return { bg: 'bg-surface-50 dark:bg-white/[0.04]', icon: 'text-surface-400 dark:text-signal-muted', text: 'text-surface-400', ring: 'border-surface-200' };
    if (auditDays < 0) return { bg: 'bg-red-50 dark:bg-signal-bad/10', icon: 'text-red-600 dark:text-signal-bad', text: 'text-red-600', ring: 'border-red-200' };
    if (auditDays <= 7) return { bg: 'bg-amber-50 dark:bg-signal-warn/10', icon: 'text-amber-600 dark:text-signal-warn', text: 'text-amber-600', ring: 'border-amber-200' };
    return { bg: 'bg-accent-50 dark:bg-signal-good/10', icon: 'text-accent-600 dark:text-signal-good', text: 'text-accent-600', ring: 'border-accent-200' };
  };
  const auditColors = getAuditColors();

  // Quick action items
  const quickActions = [
    { label: 'Run Gap Analysis', view: 'ai-gap' as ViewState, icon: Search },
    { label: 'Generate Report', view: 'reports' as ViewState, icon: FileText },
    { label: 'View Frameworks', view: 'frameworks' as ViewState, icon: Layers },
    { label: 'Security Scan', view: 'security' as ViewState, icon: Lock },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ================================================================ */}
      {/* WELCOME BANNER                                                   */}
      {/* ================================================================ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 dark:from-signal-green/[0.14] dark:via-signal-panel dark:to-signal-panel dark:border dark:border-white/[0.06] p-6 md:p-8 text-white dark:text-signal-ink">
        {/* Decorative mesh dots */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }} />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="animate-fadeInUp">
            <div className="flex items-center gap-2 mb-1">
              <Sun size={18} className="text-brand-200 dark:text-signal-green" />
              <span className="text-brand-200 dark:text-signal-green text-sm dark:text-[10px] font-medium dark:font-mono dark:uppercase dark:tracking-[0.14em]">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight dark:font-display">{getGreeting()}</h1>
            <p className="text-brand-200 dark:text-signal-sub mt-1 text-sm md:text-base">
              {criticalRiskCount > 0
                ? `You have ${criticalRiskCount} critical risk${criticalRiskCount !== 1 ? 's' : ''} requiring attention.`
                : 'Your compliance posture is looking healthy.'}
            </p>
          </div>

          {/* Quick Actions Dropdown */}
          <div className="relative">
            <button
              onClick={() => setQuickActionsOpen(!quickActionsOpen)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white/25 dark:bg-signal-green dark:hover:bg-signal-green/90 dark:text-signal-canvas backdrop-blur-sm rounded-xl text-sm font-semibold transition-all border border-white/20 dark:border-transparent"
            >
              <Zap size={16} />
              {t('dashboard.quickActions')}
              <ChevronDown size={14} className={`transition-transform ${quickActionsOpen ? 'rotate-180' : ''}`} />
            </button>
            {quickActionsOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-signal-panel2 rounded-xl shadow-xl border border-surface-100 dark:border-white/[0.08] z-50 animate-fadeIn overflow-hidden">
                {quickActions.map((action) => (
                  <button
                    key={action.view}
                    onClick={() => { onNavigate(action.view); setQuickActionsOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-surface-700 dark:text-signal-body hover:bg-brand-50 dark:hover:bg-white/[0.05] hover:text-brand-700 dark:hover:text-signal-green transition-colors"
                  >
                    <action.icon size={16} className="text-surface-400 dark:text-signal-muted" />
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* KPI CARDS ROW                                                    */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* -- Compliance Score Ring Card (spans 2 cols on lg) -- */}
        <div
          className="md:col-span-2 lg:col-span-1 bg-white dark:bg-white/[0.03] rounded-2xl shadow-sm border border-surface-100 dark:border-white/[0.06] hover:shadow-lg transition-all duration-300 p-6 animate-fadeInUp"
          data-onboarding="compliance-score"
        >
          <div className="flex items-center gap-5">
            {/* SVG Ring */}
            <div className="relative flex-shrink-0" style={{ width: 100, height: 100 }}>
              <svg width="100" height="100" viewBox="0 0 160 160" className="transform -rotate-90">
                {/* Background ring */}
                <circle
                  cx="80" cy="80" r={ringRadius}
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth={ringStroke}
                  className="stroke-surface-200 dark:stroke-white/10"
                />
                {/* Score ring */}
                <circle
                  cx="80" cy="80" r={ringRadius}
                  fill="none"
                  stroke="#0d9488"
                  strokeWidth={ringStroke}
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                  className="stroke-brand-600 dark:stroke-signal-green transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-surface-900 dark:font-display dark:text-signal-ink">{avgScore}%</span>
              </div>
            </div>
            {/* Text */}
            <div className="min-w-0">
              <p className="text-sm font-medium text-surface-500 dark:text-signal-sub">{t('dashboard.complianceScore')}</p>
              {scoreTrend && scoreTrend.direction !== 'flat' ? (
                <div className="flex items-center gap-1.5 mt-1.5">
                  {scoreTrend.direction === 'up' ? (
                    <TrendingUp size={14} className="text-accent-500 dark:text-signal-good" />
                  ) : (
                    <TrendingUp size={14} className="text-red-500 dark:text-signal-bad rotate-180" />
                  )}
                  <span className={`text-sm font-semibold ${scoreTrend.direction === 'up' ? 'text-accent-600 dark:text-signal-good' : 'text-red-600 dark:text-signal-bad'}`}>
                    {scoreTrend.delta > 0 ? '+' : ''}{scoreTrend.delta}%
                  </span>
                  <span className="text-xs text-surface-400 dark:text-signal-muted">vs last month</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-sm font-medium text-surface-400 dark:text-signal-muted">No change</span>
                  <span className="text-xs text-surface-400 dark:text-signal-muted">vs last month</span>
                </div>
              )}
              <p className="text-xs text-surface-400 dark:text-signal-muted mt-1 truncate">
                {frameworks.length > 0 ? `Across ${frameworks.length} framework${frameworks.length !== 1 ? 's' : ''}` : 'No frameworks yet'}
              </p>
            </div>
          </div>
        </div>

        {/* -- Critical Risks Card -- */}
        <div
          onClick={() => onNavigate('risks')}
          className="bg-white dark:bg-white/[0.03] rounded-2xl shadow-sm border border-surface-100 dark:border-white/[0.06] hover:shadow-lg hover:border-red-200 dark:hover:border-signal-bad/40 transition-all duration-300 p-6 cursor-pointer group animate-fadeInUp"
          style={{ animationDelay: '60ms' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-red-50 dark:bg-signal-bad/10 rounded-xl flex items-center justify-center group-hover:bg-red-100 dark:group-hover:bg-signal-bad/20 transition-colors">
              <AlertTriangle size={20} className="text-red-500 dark:text-signal-bad" />
            </div>
            {criticalRiskCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-signal-bad/[0.14] dark:text-signal-bad">
                Urgent
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-surface-500 dark:text-signal-sub group-hover:text-red-600 dark:group-hover:text-signal-bad transition-colors">Critical Risks</p>
          <h3 className="text-3xl font-bold text-surface-900 dark:font-display dark:text-signal-ink mt-0.5">{criticalRiskCount}</h3>
          <div className="mt-3 flex items-center text-sm">
            <span className="text-red-600 dark:text-signal-bad font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
              Action Required <ChevronRight size={14} />
            </span>
          </div>
        </div>

        {/* -- Active Frameworks Card -- */}
        <div
          onClick={() => onNavigate('frameworks')}
          className="bg-white dark:bg-white/[0.03] rounded-2xl shadow-sm border border-surface-100 dark:border-white/[0.06] hover:shadow-lg hover:border-brand-200 dark:hover:border-signal-green/40 transition-all duration-300 p-6 cursor-pointer group animate-fadeInUp"
          style={{ animationDelay: '120ms' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-brand-50 dark:bg-signal-green/10 rounded-xl flex items-center justify-center group-hover:bg-brand-100 dark:group-hover:bg-signal-green/20 transition-colors">
              <Layers size={20} className="text-brand-500 dark:text-signal-green" />
            </div>
          </div>
          <p className="text-sm font-medium text-surface-500 dark:text-signal-sub group-hover:text-brand-600 dark:group-hover:text-signal-green transition-colors">{t('dashboard.activeFrameworks')}</p>
          <h3 className="text-3xl font-bold text-surface-900 dark:font-display dark:text-signal-ink mt-0.5">{activeCount}</h3>
          <div className="mt-3 flex items-center text-sm">
            <span className="text-surface-500 dark:text-signal-sub truncate">{frameworks.map(f => f.name).join(', ') || 'None added'}</span>
          </div>
        </div>

        {/* -- Next Audit Card -- */}
        <div
          onClick={() => {
            if (frameworks.length > 0) {
              // Show modal with all upcoming audits
              if (allAudits.length > 0) {
                const auditList = allAudits.map(a => {
                  const dateStr = a.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  if (a.days < 0) {
                    return `${a.framework.name}: Overdue by ${Math.abs(a.days)} day${Math.abs(a.days) !== 1 ? 's' : ''} (${dateStr})`;
                  } else if (a.days === 0) {
                    return `${a.framework.name}: Due Today (${dateStr})`;
                  } else {
                    return `${a.framework.name}: Due in ${a.days} day${a.days !== 1 ? 's' : ''} (${dateStr})`;
                  }
                }).join('\n');

                toast.info(`Upcoming Audits: ${auditList}`);
              } else {
                toast.info('No audits scheduled for any frameworks.');
              }
            }
          }}
          className={`bg-white dark:bg-white/[0.03] rounded-2xl shadow-sm border border-surface-100 dark:border-white/[0.06] hover:shadow-lg hover:${auditColors.ring} transition-all duration-300 p-6 cursor-pointer group animate-fadeInUp`}
          style={{ animationDelay: '180ms' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 ${auditColors.bg} rounded-xl flex items-center justify-center group-hover:opacity-80 transition-colors`}>
              <Calendar size={20} className={auditColors.icon} />
            </div>
            {auditDays !== null && auditDays < 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-signal-bad/[0.14] dark:text-signal-bad">
                Overdue
              </span>
            )}
            {auditDays !== null && auditDays === 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-signal-warn/[0.14] dark:text-signal-warn">
                Today
              </span>
            )}
          </div>
          <p className={`text-sm font-medium text-surface-500 dark:text-signal-sub group-hover:${auditColors.text} transition-colors`}>Next Audit</p>
          <h3 className="text-3xl font-bold text-surface-900 dark:font-display dark:text-signal-ink mt-0.5">
            {upcomingAudit && auditDays !== null
              ? auditDays < 0
                ? `Overdue`
                : auditDays === 0
                ? 'Today'
                : `${auditDays}d`
              : '-'}
          </h3>
          <div className="mt-3 flex items-center text-sm">
            <span className={`transition-colors ${
              auditDays !== null && auditDays < 0 ? 'text-red-600 dark:text-signal-bad' : auditDays === 0 ? 'text-amber-600 dark:text-signal-warn' : 'text-surface-500 dark:text-signal-sub'
            }`}>
              {upcomingAudit
                ? `${upcomingAudit.framework.name}${auditsToday.length > 1 ? ` (+${auditsToday.length - 1} more today)` : ''}`
                : 'No audits scheduled'}
            </span>
            {allAudits.length > 1 && (
              <span className="text-surface-400 dark:text-signal-muted ml-2">({allAudits.length} audits)</span>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* MAIN CONTENT: CHART + PRIORITY ACTIONS                           */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* -- Compliance Trend Chart (2/3) -- */}
        <div className="lg:col-span-2 bg-white dark:bg-white/[0.03] rounded-2xl shadow-sm border border-surface-100 dark:border-white/[0.06] p-6 animate-fadeInUp" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-surface-800 dark:font-display dark:text-signal-ink">{t('dashboard.complianceTrend')}</h3>
              <p className="text-sm text-surface-400 dark:text-signal-muted mt-0.5">6-month rolling score</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-surface-400 dark:text-signal-sub">
              <span className="inline-block w-3 h-3 rounded-full bg-brand-500 dark:bg-signal-green"></span>
              Score %
            </div>
          </div>
          <div ref={chartContainerRef} className="h-72 w-full min-h-[300px] min-w-0" style={{ position: 'relative' }}>
            {chartTrendData && chartTrendData.length > 0 && chartReady ? (
              <ResponsiveContainer width="100%" height="100%" minHeight={300} minWidth={0}>
                <AreaChart data={chartTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartStroke} stopOpacity={isDark ? 0.26 : 0.15}/>
                      <stop offset="95%" stopColor={chartStroke} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGrid} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: chartTick, fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: chartTick, fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
                      boxShadow: '0 4px 12px -2px rgb(0 0 0 / 0.08)',
                      padding: '8px 14px',
                      fontSize: '13px',
                      backgroundColor: isDark ? '#0C1017' : '#ffffff',
                    }}
                    labelStyle={{ color: isDark ? '#E9EDF4' : '#334155', fontWeight: 600 }}
                    itemStyle={{ color: chartStroke }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke={chartStroke}
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorScore)"
                    dot={{ r: 4, fill: chartStroke, strokeWidth: 2, stroke: chartDotStroke }}
                    activeDot={{ r: 6, fill: chartStroke, strokeWidth: 2, stroke: chartDotStroke }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : !chartReady ? (
              <div className="flex items-center justify-center h-full text-surface-400 dark:text-signal-muted">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-brand-300 dark:border-signal-green/40 border-t-transparent dark:border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-sm">{t('common.loading')}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-surface-400 dark:text-signal-muted">
                <div className="text-center">
                  <TrendingUp size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No trend data available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* -- Priority Actions Sidebar (1/3) -- */}
        <div className="bg-white dark:bg-white/[0.03] rounded-2xl shadow-sm border border-surface-100 dark:border-white/[0.06] p-6 flex flex-col animate-fadeInUp" style={{ animationDelay: '260ms' }}>
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-lg font-bold text-surface-800 dark:font-display dark:text-signal-ink">Priority Actions</h3>
              <p className="text-sm text-surface-400 dark:text-signal-muted mt-0.5">{priorityRisks.length} item{priorityRisks.length !== 1 ? 's' : ''} pending</p>
            </div>
            <button
              onClick={() => onNavigate('risks')}
              className="text-sm text-brand-600 dark:text-signal-green font-semibold hover:text-brand-800 dark:hover:text-signal-green/80 transition-colors"
            >
              {t('common.viewAll')}
            </button>
          </div>
          <div className="space-y-3 flex-1 custom-scrollbar overflow-y-auto">
            {priorityRisks.length > 0 ? priorityRisks.map((risk, idx) => (
              <div
                key={risk.id}
                onClick={() => onNavigate('risks')}
                className="p-4 bg-surface-50 dark:bg-white/[0.03] rounded-xl border border-surface-100 dark:border-white/[0.07] hover:border-brand-200 dark:hover:border-signal-green/40 hover:bg-brand-50/30 dark:hover:bg-signal-green/[0.04] transition-all duration-200 cursor-pointer group animate-fadeInUp"
                style={{ animationDelay: `${300 + idx * 60}ms` }}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                    risk.severity === 'High' ? 'bg-red-100 text-red-700 dark:bg-signal-bad/[0.14] dark:text-signal-bad' :
                    risk.severity === 'Medium' ? 'bg-amber-100 text-amber-700 dark:bg-signal-warn/[0.14] dark:text-signal-warn' : 'bg-brand-100 text-brand-700 dark:bg-signal-green/[0.14] dark:text-signal-green'
                  }`}>
                    {risk.severity === 'High' ? t('risks.high') : risk.severity === 'Medium' ? t('risks.medium') : risk.severity === 'Low' ? t('risks.low') : risk.severity}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-surface-400 dark:text-signal-muted">
                    <Clock size={12} />
                    {risk.detectedAt}
                  </div>
                </div>
                <p className="text-sm font-medium text-surface-800 dark:text-signal-body group-hover:text-brand-700 dark:group-hover:text-signal-green transition-colors line-clamp-2 leading-snug">
                  {risk.description}
                </p>
                <div className="flex items-center justify-between mt-2.5">
                  <span className="text-xs text-surface-400 dark:text-signal-muted bg-surface-100 dark:bg-white/[0.06] px-2 py-0.5 rounded-md">{risk.category}</span>
                  <ChevronRight size={14} className="text-surface-300 dark:text-signal-muted group-hover:text-brand-500 dark:group-hover:text-signal-green transition-colors" />
                </div>
              </div>
            )) : (
              <div className="text-center py-10 text-surface-400 dark:text-signal-muted">
                <div className="w-12 h-12 bg-accent-50 dark:bg-signal-good/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle size={24} className="text-accent-500 dark:text-signal-good" />
                </div>
                <p className="text-sm font-medium text-surface-600 dark:text-signal-body">All Clear</p>
                <p className="text-xs text-surface-400 dark:text-signal-muted mt-1">No open risks to address</p>
              </div>
            )}
          </div>
          <button
            onClick={() => onNavigate('risks')}
            className="mt-4 w-full py-2.5 text-sm text-brand-600 dark:text-signal-green font-semibold hover:text-brand-800 dark:hover:text-signal-green hover:bg-brand-50 dark:hover:bg-signal-green/10 rounded-xl transition-colors border border-transparent hover:border-brand-100 dark:hover:border-signal-green/20"
          >
            View Risk Registry
          </button>
        </div>
      </div>

      {/* ================================================================ */}
      {/* QUICK ACCESS GRID                                                */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeInUp" style={{ animationDelay: '320ms' }}>
        {/* Run Gap Analysis */}
        <button
          onClick={() => onNavigate('ai-gap')}
          className="group relative bg-white dark:bg-white/[0.03] rounded-2xl shadow-sm border border-surface-100 dark:border-white/[0.06] hover:shadow-lg hover:border-brand-200 dark:hover:border-signal-green/40 transition-all duration-300 p-5 text-left overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-50 dark:bg-signal-green/[0.06] rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative">
            <div className="w-10 h-10 bg-brand-50 dark:bg-signal-green/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-brand-100 dark:group-hover:bg-signal-green/20 transition-colors">
              <Search size={20} className="text-brand-600 dark:text-signal-green" />
            </div>
            <h4 className="text-sm font-semibold text-surface-800 dark:text-signal-ink group-hover:text-brand-700 dark:group-hover:text-signal-green transition-colors">Run Gap Analysis</h4>
            <p className="text-xs text-surface-400 dark:text-signal-sub mt-1 leading-relaxed">AI-powered compliance gap detection</p>
            <ArrowRight size={16} className="mt-3 text-surface-300 dark:text-signal-muted group-hover:text-brand-500 dark:group-hover:text-signal-green group-hover:translate-x-1 transition-all" />
          </div>
        </button>

        {/* Generate Report */}
        <button
          onClick={() => onNavigate('reports')}
          className="group relative bg-white dark:bg-white/[0.03] rounded-2xl shadow-sm border border-surface-100 dark:border-white/[0.06] hover:shadow-lg hover:border-accent-200 dark:hover:border-signal-good/40 transition-all duration-300 p-5 text-left overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent-50 dark:bg-signal-good/[0.06] rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative">
            <div className="w-10 h-10 bg-accent-50 dark:bg-signal-good/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-accent-100 dark:group-hover:bg-signal-good/20 transition-colors">
              <FileText size={20} className="text-accent-600 dark:text-signal-good" />
            </div>
            <h4 className="text-sm font-semibold text-surface-800 dark:text-signal-ink group-hover:text-accent-700 dark:group-hover:text-signal-good transition-colors">Generate Report</h4>
            <p className="text-xs text-surface-400 dark:text-signal-sub mt-1 leading-relaxed">Export compliance & audit reports</p>
            <ArrowRight size={16} className="mt-3 text-surface-300 dark:text-signal-muted group-hover:text-accent-500 dark:group-hover:text-signal-good group-hover:translate-x-1 transition-all" />
          </div>
        </button>

        {/* View Frameworks */}
        <button
          onClick={() => onNavigate('frameworks')}
          className="group relative bg-white dark:bg-white/[0.03] rounded-2xl shadow-sm border border-surface-100 dark:border-white/[0.06] hover:shadow-lg hover:border-purple-200 dark:hover:border-signal-violet/40 transition-all duration-300 p-5 text-left overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 dark:bg-signal-violet/[0.06] rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative">
            <div className="w-10 h-10 bg-purple-50 dark:bg-signal-violet/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-purple-100 dark:group-hover:bg-signal-violet/20 transition-colors">
              <Layers size={20} className="text-purple-600 dark:text-signal-violet" />
            </div>
            <h4 className="text-sm font-semibold text-surface-800 dark:text-signal-ink group-hover:text-purple-700 dark:group-hover:text-signal-violet transition-colors">View Frameworks</h4>
            <p className="text-xs text-surface-400 dark:text-signal-sub mt-1 leading-relaxed">Manage regulatory frameworks</p>
            <ArrowRight size={16} className="mt-3 text-surface-300 dark:text-signal-muted group-hover:text-purple-500 dark:group-hover:text-signal-violet group-hover:translate-x-1 transition-all" />
          </div>
        </button>

        {/* Security Scan */}
        <button
          onClick={() => onNavigate('security')}
          className="group relative bg-white dark:bg-white/[0.03] rounded-2xl shadow-sm border border-surface-100 dark:border-white/[0.06] hover:shadow-lg hover:border-amber-200 dark:hover:border-signal-warn/40 transition-all duration-300 p-5 text-left overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 dark:bg-signal-warn/[0.06] rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative">
            <div className="w-10 h-10 bg-amber-50 dark:bg-signal-warn/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-amber-100 dark:group-hover:bg-signal-warn/20 transition-colors">
              <Lock size={20} className="text-amber-600 dark:text-signal-warn" />
            </div>
            <h4 className="text-sm font-semibold text-surface-800 dark:text-signal-ink group-hover:text-amber-700 dark:group-hover:text-signal-warn transition-colors">Security Scan</h4>
            <p className="text-xs text-surface-400 dark:text-signal-sub mt-1 leading-relaxed">Run infrastructure security checks</p>
            <ArrowRight size={16} className="mt-3 text-surface-300 dark:text-signal-muted group-hover:text-amber-500 dark:group-hover:text-signal-warn group-hover:translate-x-1 transition-all" />
          </div>
        </button>
      </div>
    </div>
  );
};
