import React from 'react';
import { TierName } from '../../types';
import { Building2, Rocket, TrendingUp, Crown } from 'lucide-react';

export interface OnboardingTierBadgeProps {
  tier: TierName;
  variant?: 'small' | 'large';
}

const tierConfig: Record<TierName, { icon: React.ElementType; color: string; bg: string; border: string; glow: string }> = {
  Foundation: {
    icon: Building2,
    color: 'text-signal-blue',
    bg: 'bg-signal-blue/10',
    border: 'border-signal-blue/30',
    glow: 'shadow-signal-blue/20',
  },
  Essentials: {
    icon: Rocket,
    color: 'text-signal-violet',
    bg: 'bg-signal-violet/10',
    border: 'border-signal-violet/30',
    glow: 'shadow-signal-violet/20',
  },
  Growth: {
    icon: TrendingUp,
    color: 'text-signal-green',
    bg: 'bg-signal-green/10',
    border: 'border-signal-green/30',
    glow: 'shadow-signal-green/20',
  },
  Visionary: {
    icon: Crown,
    color: 'text-signal-amber',
    bg: 'bg-signal-amber/10',
    border: 'border-signal-amber/30',
    glow: 'shadow-signal-amber/20',
  },
};

export const OnboardingTierBadge: React.FC<OnboardingTierBadgeProps> = ({ tier, variant = 'small' }) => {
  // Fall back to Foundation styling if an unrecognized tier value reaches the badge.
  const config = tierConfig[tier] ?? tierConfig.Foundation;
  const Icon = config.icon;

  if (variant === 'large') {
    return (
      <div
        className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl border ${config.bg} ${config.border} shadow-lg ${config.glow}`}
      >
        <Icon className={`w-7 h-7 ${config.color}`} />
        <div>
          <p className={`font-display text-lg font-bold ${config.color}`}>{tier}</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-signal-muted">Plan</p>
        </div>
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[11px] font-medium uppercase tracking-[0.12em] border ${config.bg} ${config.border} ${config.color}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {tier}
    </span>
  );
};
