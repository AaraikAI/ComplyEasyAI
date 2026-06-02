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
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    glow: 'shadow-blue-500/20',
  },
  Essentials: {
    icon: Rocket,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    glow: 'shadow-purple-500/20',
  },
  Growth: {
    icon: TrendingUp,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    glow: 'shadow-emerald-500/20',
  },
  Visionary: {
    icon: Crown,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    glow: 'shadow-amber-500/20',
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
          <p className={`text-lg font-bold ${config.color}`}>{tier}</p>
          <p className="text-xs text-slate-400">Plan</p>
        </div>
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${config.bg} ${config.border} ${config.color}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {tier}
    </span>
  );
};
