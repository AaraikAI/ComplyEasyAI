import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Shield, AlertTriangle, Users, Activity } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useExecutiveDashboard } from '../hooks/queries/useDashboard';
import { useRisks } from '../hooks/queries/useRisks';
import { ComplianceGauge } from './ComplianceGauge';
import { RisingSignals } from './RisingSignals';

const HomeOS: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: dashboard, isLoading } = useExecutiveDashboard();
  const { data: risks = [] } = useRisks();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.name?.split(' ')[0] || 'there';

  // Map backend nested response to flat values
  const openRisks = (dashboard as any)?.riskPosture?.totalOpen ?? 0;
  const openIncidents = (dashboard as any)?.incidents?.totalOpen ?? 0;
  const vendorsAtRisk = (dashboard as any)?.vendorRiskSummary?.highRisk ?? 0;
  const auditReadiness = (dashboard as any)?.auditReadiness?.score ?? 0;

  const stats = [
    {
      label: 'Open Risks',
      value: openRisks,
      icon: Shield,
      color: 'text-brand-600 dark:text-brand-400',
      bg: 'bg-brand-50 dark:bg-brand-950/30',
      path: '/risks',
    },
    {
      label: 'Open Incidents',
      value: openIncidents,
      icon: AlertTriangle,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      path: '/issues?tab=incidents',
    },
    {
      label: 'Vendors at Risk',
      value: vendorsAtRisk,
      icon: Users,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-950/30',
      path: '/vendors?tab=risk-assessment',
    },
    {
      label: 'Audit Readiness',
      value: `${auditReadiness}%`,
      icon: Activity,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      path: '/audit',
    },
  ];

  // AI suggestion based on data
  const aiSuggestion = React.useMemo(() => {
    if (!dashboard) return {
      title: 'Get started with your compliance journey',
      description: 'Set up your first framework, run a gap analysis, or explore AI-powered compliance tools to get started.',
      actions: [
        { label: 'Explore features', path: '/feature-library' },
        { label: 'View frameworks', path: '/frameworks' },
      ],
    };
    const score = dashboard.overallCompliance ?? dashboard.complianceScore ?? 0;
    if (score < 60) return {
      title: 'Compliance score needs attention',
      description: `Your overall compliance is at ${score}%. Consider running a gap analysis to identify critical controls that need implementation.`,
      actions: [
        { label: 'Run gap analysis', path: '/ai/document-tools?tab=gap' },
        { label: 'View frameworks', path: '/frameworks' },
      ],
    };
    if (openIncidents > 3) return {
      title: `${openIncidents} open incidents detected`,
      description: 'Multiple incidents are pending resolution. Prioritize critical ones to maintain your compliance posture.',
      actions: [
        { label: 'View incidents', path: '/issues?tab=incidents' },
        { label: 'Auto-remediate', path: '/ai/compliance-tools?tab=remediation' },
      ],
    };
    if (vendorsAtRisk > 0) return {
      title: `${vendorsAtRisk} high-risk vendor${vendorsAtRisk > 1 ? 's' : ''} found`,
      description: 'Some vendors require immediate risk assessment review.',
      actions: [
        { label: 'Assess vendors', path: '/vendors?tab=risk-assessment' },
        { label: 'View all vendors', path: '/vendors' },
      ],
    };
    return {
      title: 'Your compliance posture is healthy',
      description: `Score is at ${score}%. Keep monitoring for regulatory changes and upcoming audit deadlines.`,
      actions: [
        { label: 'View calendar', path: '/calendar' },
        { label: 'Executive report', path: '/executive' },
      ],
    };
  }, [dashboard, openIncidents, vendorsAtRisk]);

  const complianceScore = dashboard?.overallCompliance ?? dashboard?.complianceScore ?? 0;

  return (
    <div className="min-h-full" style={{ background: 'var(--warm-bg, #f5f4f0)' }}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ── Left Panel ─────────────────────────────────── */}
          <div className="lg:col-span-5 space-y-8">
            {/* Greeting */}
            <div>
              <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-100">
                {greeting()}, {firstName}
              </h1>
              <p className="text-surface-500 dark:text-surface-400 mt-1">
                Here&apos;s your compliance overview for today.
              </p>
            </div>

            {/* Compliance Gauge */}
            <div data-onboarding="compliance-gauge" className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-sm border border-surface-200/60 dark:border-surface-700/60">
              <ComplianceGauge score={complianceScore} label="Overall Compliance" size={220} />
            </div>

            {/* Stat Cards */}
            <div data-onboarding="stat-cards" className="grid grid-cols-2 gap-4">
              {stats.map(stat => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    onClick={() => navigate(stat.path)}
                    className="bg-white dark:bg-surface-800 rounded-xl p-4 shadow-sm border border-surface-200/60 dark:border-surface-700/60 cursor-pointer hover:border-brand-300 dark:hover:border-brand-700 transition-colors"
                  >
                    <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                      <Icon className={`w-4.5 h-4.5 ${stat.color}`} />
                    </div>
                    <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">{stat.value}</p>
                    <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{stat.label}</p>
                  </div>
                );
              })}
            </div>

            {/* Browse Features CTA */}
            <button
              onClick={() => navigate('/feature-library')}
              className="w-full flex items-center justify-between px-5 py-4 bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-surface-200/60 dark:border-surface-700/60 hover:border-brand-300 dark:hover:border-brand-700 transition-colors group"
            >
              <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Browse all features</span>
              <ArrowRight className="w-4 h-4 text-surface-400 group-hover:text-brand-500 transition-colors" />
            </button>
          </div>

          {/* ── Right Panel ────────────────────────────────── */}
          <div className="lg:col-span-7 space-y-6">
            {/* Rising Signals Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                Rising Signals &middot; Today
              </h2>
              <span className="text-xs text-surface-400 dark:text-surface-500">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
            </div>

            {/* Rising Signals Feed */}
            <div className="bg-white dark:bg-surface-800 rounded-2xl p-5 shadow-sm border border-surface-200/60 dark:border-surface-700/60">
              <RisingSignals
                maxVisible={5}
                risks={risks.map(r => ({
                  id: r.id,
                  title: r.title,
                  severity: r.severity,
                  status: r.status,
                  category: r.category,
                }))}
              />
            </div>

            {/* AI Suggestion Card */}
            {aiSuggestion && (
              <div data-onboarding="ai-suggestion" className="bg-brand-50 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-800 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1">
                      AI Suggestion
                    </p>
                    <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-1">
                      {aiSuggestion.title}
                    </h3>
                    <p className="text-xs text-surface-600 dark:text-surface-400 mb-4">
                      {aiSuggestion.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {aiSuggestion.actions.map((action, i) => (
                        <button
                          key={i}
                          onClick={() => navigate(action.path)}
                          className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                            i === 0
                              ? 'bg-brand-600 text-white hover:bg-brand-700'
                              : 'bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 border border-surface-200 dark:border-surface-700 hover:border-brand-300'
                          }`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default HomeOS;
