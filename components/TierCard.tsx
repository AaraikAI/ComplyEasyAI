import React from 'react';
import { Check, X, Crown, Rocket, TrendingUp, Building2, Sparkles, Zap, Calendar } from 'lucide-react';
import {
  TierName,
  Tier,
  TierFeatures,
  TIER_COLORS,
  formatLimit,
  formatPrice,
} from '../types';
import { useI18n } from '../contexts/I18nContext';

interface TierCardProps {
  tier: Tier;
  isCurrentTier?: boolean;
  isPopular?: boolean;
  onSelect?: (tierName: TierName) => void;
  onBookDemo?: (tierName: TierName) => void;
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
  onBookDemo,
  billingCycle = 'annual',
  disabled = false,
  isUpgrade = false,
  isDowngrade = false,
  canDowngrade = true,
}) => {
  const { t } = useI18n();
  const colors = TIER_COLORS[tier.name];

  const calculatePrice = () => {
    if (billingCycle === 'monthly') {
      // Use the monthly price if available, otherwise calculate from annual
      const monthlyPrice = tier.pricing.monthlyMin || (tier.pricing.annualMin / 12);
      return Math.round(monthlyPrice);
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

  const handleBookDemo = () => {
    if (onBookDemo) {
      onBookDemo(tier.name);
    }
  };

  const getButtonText = () => {
    if (isCurrentTier) return t('subscription.currentPlan');
    if (disabled) return 'Contact Sales';
    if (isUpgrade) return t('subscription.upgrade');
    if (isDowngrade) return canDowngrade ? t('subscription.downgrade') : 'Cannot Downgrade';
    return t('onboarding.getStarted');
  };

  const getButtonStyle = () => {
    if (isCurrentTier) {
      return 'bg-gray-100 text-gray-500 cursor-default';
    }
    if (disabled || (isDowngrade && !canDowngrade)) {
      return 'bg-gray-200 text-gray-500 cursor-not-allowed';
    }
    if (isPopular) {
      return `bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:from-brand-600 hover:to-brand-700`;
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
        // Use the bg-white class (not an inline style) for non-current cards so the
        // app's global dark-mode override (.dark .bg-white) darkens the card; an
        // inline backgroundColor would escape it and leave light text on white.
        isCurrentTier ? 'ring-2 ring-offset-2' : 'bg-white'
      } ${isPopular ? 'shadow-xl scale-105' : 'shadow-lg hover:shadow-xl'}`}
      style={{
        ...(isCurrentTier && { backgroundColor: colors.bg }),
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
          {t('subscription.currentPlan')}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: colors.bg }}
        >
          <TierIcon tierName={tier.name} className={`w-6 h-6 text-${tier.name.toLowerCase()}-600`} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">{tier.displayName}</h3>
          <p className="text-sm text-gray-500">{tier.tagline}</p>
        </div>
      </div>


      {/* CTA Buttons */}
      <div className="space-y-2">
        {/* Book a Demo - Primary CTA for all tiers */}
        <button
          onClick={handleBookDemo}
          className="w-full py-3 px-4 rounded-xl font-semibold transition-all bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:from-brand-600 hover:to-brand-700 flex items-center justify-center gap-2"
        >
          <Calendar size={18} />
          Book a Demo
        </button>

        {/* Secondary action button */}
        {!isCurrentTier && (
          <button
            onClick={handleSelect}
            disabled={isCurrentTier || (isDowngrade && !canDowngrade)}
            className={`w-full py-2.5 px-4 rounded-xl font-medium transition-all text-sm ${
              disabled || (isDowngrade && !canDowngrade)
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {getButtonText()}
          </button>
        )}

        {isCurrentTier && (
          <div className="text-center text-sm text-green-600 font-medium py-2">
            {t('subscription.currentPlan')}
          </div>
        )}
      </div>

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
    </div>
  );
};

export default TierCard;
