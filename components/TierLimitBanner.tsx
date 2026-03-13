/**
 * Reusable banner for tier limit (Vendors, Reports, Policies, Monitors, Issues,
 * Risk Assessments, Workspaces, Questionnaires). Use with getLimit / isAtLimit / getUpgradeMessage
 * from constants/tierLimits and link to Settings → Billing (UPGRADE_LINK).
 */
import React from 'react';
import { UPGRADE_LINK } from '../constants/tierLimits';
import { useI18n } from '../contexts/I18nContext';

interface TierLimitBannerProps {
  message: string;
}

export const TierLimitBanner: React.FC<TierLimitBannerProps> = ({ message }) => {
  const { t } = useI18n();

  if (!message) return null;
  return (
    <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 px-4 py-3 rounded-lg">
      {message} <a href={UPGRADE_LINK} className="font-medium underline">{t('subscription.upgrade')}</a>
    </div>
  );
};
