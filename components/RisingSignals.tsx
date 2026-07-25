import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { AlertTriangle, ShieldAlert, TrendingUp, CheckCircle, ChevronDown, Sparkles } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

type SignalSeverity = 'critical' | 'ai-flagged' | 'high' | 'on-track';

interface Signal {
  id: string;
  severity: SignalSeverity;
  title: string;
  description: string;
  badge?: string;
  actionUrl?: string;
  actionLabel?: string;
}

interface RisingSignalsProps {
  maxVisible?: number;
  risks?: Array<{
    id: string;
    title: string;
    severity: string;
    status: string;
    category: string;
  }>;
}

const SEVERITY_CONFIG: Record<SignalSeverity, {
  border: string;
  bg: string;
  icon: React.ElementType;
  iconColor: string;
  badgeClass: string;
}> = {
  critical: {
    border: 'border-l-red-500',
    bg: 'bg-red-50/50 dark:bg-red-950/20',
    icon: AlertTriangle,
    iconColor: 'text-red-500',
    badgeClass: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  },
  'ai-flagged': {
    border: 'border-l-brand-500',
    bg: 'bg-brand-50/50 dark:bg-brand-950/20',
    icon: Sparkles,
    iconColor: 'text-brand-500',
    badgeClass: 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300',
  },
  high: {
    border: 'border-l-amber-500',
    bg: 'bg-amber-50/50 dark:bg-amber-950/20',
    icon: ShieldAlert,
    iconColor: 'text-amber-500',
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
  'on-track': {
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-50/50 dark:bg-emerald-950/20',
    icon: CheckCircle,
    iconColor: 'text-emerald-500',
    badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
};

export const RisingSignals: React.FC<RisingSignalsProps> = ({ maxVisible = 5, risks = [] }) => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const { notifications } = useNotifications();

  const signals: Signal[] = useMemo(() => {
    const result: Signal[] = [];

    // Convert critical/high risks to signals
    risks.forEach(risk => {
      if (risk.status === 'Closed' || risk.status === 'Mitigated') return;
      if (risk.severity === 'Critical') {
        result.push({
          id: `risk-${risk.id}`,
          severity: 'critical',
          title: risk.title,
          description: `Critical risk in ${risk.category}`,
          badge: 'Critical',
          actionUrl: '/risks?tab=register',
          actionLabel: 'View risk',
        });
      } else if (risk.severity === 'High') {
        result.push({
          id: `risk-${risk.id}`,
          severity: 'high',
          title: risk.title,
          description: `High-severity risk requires attention`,
          badge: 'High',
          actionUrl: '/risks?tab=register',
          actionLabel: 'View risk',
        });
      }
    });

    // Convert unread notifications to AI-flagged signals
    notifications
      .filter(n => !n.isRead)
      .slice(0, 3)
      .forEach(n => {
        result.push({
          id: `notif-${n.id}`,
          severity: 'ai-flagged',
          title: n.title,
          description: n.message,
          badge: 'AI Flagged',
          actionUrl: n.actionUrl,
        });
      });

    // Add a synthetic on-track signal if things are quiet
    if (result.filter(s => s.severity === 'critical').length === 0) {
      result.push({
        id: 'on-track-1',
        severity: 'on-track',
        title: 'Compliance posture healthy',
        description: 'No critical risks detected across your active frameworks',
        badge: 'On Track',
      });
    }

    // Sort: critical first, then ai-flagged, high, on-track
    const order: Record<SignalSeverity, number> = { critical: 0, 'ai-flagged': 1, high: 2, 'on-track': 3 };
    return result.sort((a, b) => order[a.severity] - order[b.severity]);
  }, [risks, notifications]);

  const visibleSignals = expanded ? signals : signals.slice(0, maxVisible);
  const hiddenCount = signals.length - maxVisible;

  if (signals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-surface-400 dark:text-surface-500">
        <CheckCircle className="w-10 h-10 mb-3 text-emerald-400" />
        <p className="text-sm font-medium">All quiet — no signals today</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {visibleSignals.map(signal => {
        const config = SEVERITY_CONFIG[signal.severity];
        const Icon = config.icon;

        return (
          <div
            key={signal.id}
            className={`border-l-4 ${config.border} ${config.bg} rounded-lg p-4 transition-all hover:shadow-sm`}
          >
            <div className="flex items-start gap-3">
              <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${config.iconColor}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-surface-900 dark:text-surface-100 truncate">
                    {signal.title}
                  </h4>
                  {signal.badge && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${config.badgeClass}`}>
                      {signal.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-surface-500 dark:text-surface-400 line-clamp-2">
                  {signal.description}
                </p>
                {signal.actionUrl && (
                  <button
                    onClick={() => navigate(signal.actionUrl!)}
                    className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 mt-2 transition-colors"
                  >
                    {signal.actionLabel || 'View details'} &rarr;
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {!expanded && hiddenCount > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-1.5 text-xs font-medium text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 transition-colors w-full justify-center py-2"
        >
          <ChevronDown className="w-3.5 h-3.5" />
          Show {hiddenCount} more signal{hiddenCount !== 1 ? 's' : ''}
        </button>
      )}
    </div>
  );
};
