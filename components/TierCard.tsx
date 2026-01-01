import React from 'react';
import { Check, X, Crown, Rocket, TrendingUp, Building2, Sparkles, Zap } from 'lucide-react';
import {
  TierName,
  Tier,
  TierFeatures,
  TIER_COLORS,
  formatLimit,
  formatPrice,
} from '../types';

interface TierCardProps {
  tier: Tier;
  isCurrentTier?: boolean;
  isPopular?: boolean;
  onSelect?: (tierName: TierName) => void;
  billingCycle?: 'monthly' | 'annual';
  disabled?: boolean;
  isUpgrade?: boolean;
  isDowngrade?: boolean;
  canDowngrade?: boolean;
}

const TierIcon: React.FC<{ tierName: TierName; className?: string }> = ({ tierName, className = '' }) => {
  const icons: Record<TierName, React.ReactNode> = {
    Foundation: <Building2 className={className} />,
    Essentials: <Rocket className={className} />,
    Growth: <TrendingUp className={className} />,
    Visionary: <Crown className={className} />,
  };
  return <>{icons[tierName]}</>;
};

const TierCard: React.FC<TierCardProps> = ({
  tier,
  isCurrentTier = false,
  isPopular = false,
  onSelect,
  billingCycle = 'annual',
  disabled = false,
  isUpgrade = false,
  isDowngrade = false,
  canDowngrade = true,
}) => {
  const colors = TIER_COLORS[tier.name];

  const calculatePrice = () => {
    if (billingCycle === 'monthly') {
      const monthlyBase = tier.pricing.annualMin * tier.pricing.monthlyMultiplier / 12;
      return Math.round(monthlyBase);
    }
    return tier.pricing.annualMin;
  };

  const price = calculatePrice();
  const priceDisplay = tier.name === 'Visionary' && billingCycle === 'annual'
    ? 'Custom'
    : formatPrice(price);

  const handleSelect = () => {
    if (!disabled && onSelect && !isCurrentTier) {
      if (isDowngrade && !canDowngrade) return;
      onSelect(tier.name);
    }
  };

  const getButtonText = () => {
    if (isCurrentTier) return 'Current Plan';
    if (disabled) return 'Contact Sales';
    if (isUpgrade) return 'Upgrade';
    if (isDowngrade) return canDowngrade ? 'Downgrade' : 'Cannot Downgrade';
    return 'Get Started';
  };

  const getButtonStyle = () => {
    if (isCurrentTier) {
      return 'bg-gray-100 text-gray-500 cursor-default';
    }
    if (disabled || (isDowngrade && !canDowngrade)) {
      return 'bg-gray-200 text-gray-500 cursor-not-allowed';
    }
    if (isPopular) {
      return `bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700`;
    }
    return `bg-white text-gray-900 border-2 hover:bg-gray-50`;
  };

  // Key features to highlight per tier
  const keyFeatures: Record<TierName, Array<{ text: string; included: boolean }>> = {
    Foundation: [
      { text: 'Up to 10 users', included: true },
      { text: '3 compliance frameworks', included: true },
      { text: 'Basic AI (Policy & Gap)', included: true },
      { text: '5 questionnaires/month', included: true },
      { text: '2FA authentication', included: true },
      { text: 'Audit logging', included: true },
      { text: 'Full AI suite', included: false },
      { text: 'aCOS features', included: false },
    ],
    Essentials: [
      { text: 'Up to 100 users', included: true },
      { text: '10 compliance frameworks', included: true },
      { text: 'Full AI suite', included: true },
      { text: 'Vendor risk management', included: true },
      { text: 'Policy library', included: true },
      { text: '5 workspaces', included: true },
      { text: 'Priority support', included: true },
      { text: 'aCOS features', included: false },
    ],
    Growth: [
      { text: 'Up to 1,000 users', included: true },
      { text: '50 compliance frameworks', included: true },
      { text: 'Full aCOS v3.0', included: true },
      { text: 'Agentic actions', included: true },
      { text: 'Digital twin', included: true },
      { text: 'Red team simulations', included: true },
      { text: 'Regulatory intelligence', included: true },
      { text: 'SLA guarantee', included: true },
    ],
    Visionary: [
      { text: 'Unlimited users', included: true },
      { text: 'All Growth features', included: true },
      { text: 'VR training', included: true },
      { text: 'Zero Trust security', included: true },
      { text: 'ZK proofs', included: true },
      { text: 'BYOK encryption', included: true },
      { text: 'On-premises option', included: true },
      { text: 'Dedicated support', included: true },
    ],
  };

  return (
    <div
      className={`relative rounded-2xl p-6 transition-all duration-300 ${
        isCurrentTier ? 'ring-2 ring-offset-2' : ''
      } ${isPopular ? 'shadow-xl scale-105' : 'shadow-lg hover:shadow-xl'}`}
      style={{
        backgroundColor: isCurrentTier ? colors.bg : 'white',
        borderColor: colors.border,
        borderWidth: '1px',
        borderStyle: 'solid',
        ...(isCurrentTier && { ringColor: colors.primary }),
      }}
    >
      {/* Popular badge */}
      {isPopular && (
        <div
          className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-white text-sm font-semibold flex items-center gap-1"
          style={{ backgroundColor: colors.primary }}
        >
          <Sparkles size={14} />
          Most Popular
        </div>
      )}

      {/* Current tier badge */}
      {isCurrentTier && (
        <div className="absolute -top-3 right-4 px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
          Current Plan
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: colors.bg }}
        >
          <TierIcon tierName={tier.name} className="w-6 h-6" style={{ color: colors.primary }} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">{tier.displayName}</h3>
          <p className="text-sm text-gray-500">{tier.tagline}</p>
        </div>
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-gray-900">
            {priceDisplay === 'Custom' ? 'Custom' : priceDisplay}
          </span>
          {priceDisplay !== 'Custom' && (
            <span className="text-gray-500">
              /{billingCycle === 'monthly' ? 'mo' : 'yr'}
            </span>
          )}
        </div>
        {tier.name !== 'Visionary' && billingCycle === 'annual' && (
          <p className="text-sm text-green-600 mt-1">
            Save {Math.round((1 - 1/tier.pricing.monthlyMultiplier) * 100)}% vs monthly
          </p>
        )}
        {tier.name === 'Visionary' && (
          <p className="text-sm text-gray-500 mt-1">
            Starting at {formatPrice(tier.pricing.annualMin)}/year
          </p>
        )}
      </div>

      {/* CTA Button */}
      <button
        onClick={handleSelect}
        disabled={isCurrentTier || (isDowngrade && !canDowngrade)}
        className={`w-full py-3 px-4 rounded-xl font-semibold transition-all ${getButtonStyle()}`}
        style={
          !isCurrentTier && !disabled && !(isDowngrade && !canDowngrade)
            ? { borderColor: colors.primary }
            : {}
        }
      >
        {getButtonText()}
      </button>

      {/* Features list */}
      <div className="mt-6 space-y-3">
        <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          What's included
        </p>
        {keyFeatures[tier.name].map((feature, index) => (
          <div key={index} className="flex items-center gap-2">
            {feature.included ? (
              <Check size={18} className="text-green-500 flex-shrink-0" />
            ) : (
              <X size={18} className="text-gray-300 flex-shrink-0" />
            )}
            <span
              className={`text-sm ${
                feature.included ? 'text-gray-700' : 'text-gray-400'
              }`}
            >
              {feature.text}
            </span>
          </div>
        ))}
      </div>

      {/* Limits summary */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-500">Users</p>
            <p className="font-semibold">{formatLimit(tier.limits.maxUsers)}</p>
          </div>
          <div>
            <p className="text-gray-500">Frameworks</p>
            <p className="font-semibold">{formatLimit(tier.limits.maxFrameworks)}</p>
          </div>
          <div>
            <p className="text-gray-500">AI Requests/mo</p>
            <p className="font-semibold">{formatLimit(tier.limits.maxAiRequestsPerMonth)}</p>
          </div>
          <div>
            <p className="text-gray-500">Storage</p>
            <p className="font-semibold">{formatLimit(tier.limits.maxStorageGB)} GB</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TierCard;
