/**
 * Cookie Consent Banner Component
 *
 * GDPR/ePrivacy compliant cookie consent management:
 * - Fixed bottom banner with cookie category toggles
 * - Accept All, Reject All, Customize options
 * - Persistent preferences via localStorage + API sync
 * - Smooth slide-up animation
 * - Full accessibility with ARIA labels and keyboard navigation
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { logger } from '../utils/logger';
import {
  Shield,
  X,
  Cookie,
  Settings,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// ── Type Definitions ────────────────────────────────────────────────────────

type CookieCategory = 'essential' | 'functional' | 'analytics' | 'targeting';

interface CookieCategoryConfig {
  id: CookieCategory;
  label: string;
  description: string;
  required: boolean;
}

interface CookiePreferences {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  targeting: boolean;
  consentDate: string;
  consentVersion: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

const CONSENT_VERSION = '1.0';
const STORAGE_KEY = 'complyeasy_cookie_consent';

const API_BASE = (import.meta as ImportMeta & { env: Record<string, string> }).env.VITE_API_URL || 'http://localhost:3001/api';
const apiUrl = API_BASE.endsWith('/api') ? API_BASE : API_BASE.replace(/\/?$/, '') + '/api';

const cookieCategories: CookieCategoryConfig[] = [
  {
    id: 'essential',
    label: 'Essential',
    description:
      'These cookies are strictly necessary for the website to function properly. They enable core functionality such as security, session management, and accessibility. You cannot disable these cookies.',
    required: true,
  },
  {
    id: 'functional',
    label: 'Functional',
    description:
      'These cookies enable enhanced functionality and personalization, such as remembering your preferences, language settings, and login information. Without these cookies, some features may not work properly.',
    required: false,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    description:
      'These cookies help us understand how visitors interact with the website by collecting and reporting information anonymously. They help us improve the website performance and user experience.',
    required: false,
  },
  {
    id: 'targeting',
    label: 'Targeting',
    description:
      'These cookies are used to deliver advertisements more relevant to you and your interests. They may also be used to limit the number of times you see an advertisement and to measure the effectiveness of advertising campaigns.',
    required: false,
  },
];

// ── Helper ──────────────────────────────────────────────────────────────────

function getStoredPreferences(): CookiePreferences | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as CookiePreferences;
    if (parsed.consentVersion !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function storePreferences(prefs: CookiePreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (err) {
    logger.error('Failed to store cookie preferences:', err);
  }
}

async function syncPreferencesToApi(prefs: CookiePreferences): Promise<void> {
  try {
    await fetch(`${apiUrl}/cookie-consent/preferences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        subjectIdentifier: 'self',
        categories: {
          essential: prefs.essential,
          functional: prefs.functional,
          analytics: prefs.analytics,
          targeting: prefs.targeting,
        },
        consentMethod: 'CookieBanner',
      }),
    });
  } catch (err) {
    // Cookie consent sync is best-effort; don't block UX
  }
}

// ── Component ───────────────────────────────────────────────────────────────

const CookieConsentBanner: React.FC = () => {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<CookieCategory | null>(null);
  const [preferences, setPreferences] = useState<Record<CookieCategory, boolean>>({
    essential: true,
    functional: false,
    analytics: false,
    targeting: false,
  });
  const [saving, setSaving] = useState(false);
  const [slideIn, setSlideIn] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  // Check if user has already consented
  useEffect(() => {
    const stored = getStoredPreferences();
    if (!stored) {
      setVisible(true);
      // Trigger slide-in animation after mount
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setSlideIn(true);
        });
      });
    }
  }, []);

  // Focus management for accessibility
  useEffect(() => {
    if (visible && firstFocusableRef.current) {
      firstFocusableRef.current.focus();
    }
  }, [visible]);

  // Trap focus within banner for keyboard navigation
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Do nothing on escape - user must make a choice
        return;
      }

      if (e.key === 'Tab' && bannerRef.current) {
        const focusableElements = bannerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [visible]);

  const savePreferences = useCallback(
    async (prefs: Record<CookieCategory, boolean>) => {
      setSaving(true);
      const fullPrefs: CookiePreferences = {
        ...prefs,
        consentDate: new Date().toISOString(),
        consentVersion: CONSENT_VERSION,
      };

      storePreferences(fullPrefs);
      await syncPreferencesToApi(fullPrefs);

      setSaving(false);
      setSlideIn(false);
      // Wait for slide-out animation
      setTimeout(() => setVisible(false), 300);
    },
    []
  );

  const handleAcceptAll = useCallback(() => {
    const allAccepted: Record<CookieCategory, boolean> = {
      essential: true,
      functional: true,
      analytics: true,
      targeting: true,
    };
    setPreferences(allAccepted);
    savePreferences(allAccepted);
  }, [savePreferences]);

  const handleRejectAll = useCallback(() => {
    const onlyEssential: Record<CookieCategory, boolean> = {
      essential: true,
      functional: false,
      analytics: false,
      targeting: false,
    };
    setPreferences(onlyEssential);
    savePreferences(onlyEssential);
  }, [savePreferences]);

  const handleSaveCustom = useCallback(() => {
    savePreferences(preferences);
  }, [preferences, savePreferences]);

  const toggleCategory = (category: CookieCategory) => {
    if (category === 'essential') return; // Cannot disable essential
    setPreferences(prev => ({ ...prev, [category]: !prev[category] }));
  };

  if (!visible) return null;

  return (
    <div
      ref={bannerRef}
      role="dialog"
      aria-label="Cookie consent preferences"
      aria-modal="true"
      className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out ${
        slideIn ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="bg-slate-800 border-t border-slate-700 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          {/* Main Banner Content */}
          {!showCustomize ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-start gap-3 flex-1">
                <Shield className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-sm font-medium text-white mb-1">{t('privacy.cookieConsent')}</h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    We use cookies to enhance your browsing experience, serve personalized content, and analyze our
                    traffic. By clicking &quot;Accept All&quot;, you consent to our use of cookies. You can customize
                    your preferences or reject non-essential cookies.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                <button
                  ref={firstFocusableRef}
                  onClick={handleRejectAll}
                  disabled={saving}
                  aria-label="Reject all non-essential cookies"
                  className="flex-1 sm:flex-initial px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                >
                  Reject All
                </button>
                <button
                  onClick={() => setShowCustomize(true)}
                  disabled={saving}
                  aria-label="Customize cookie preferences"
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                >
                  <Settings className="w-3.5 h-3.5" /> Customize
                </button>
                <button
                  onClick={handleAcceptAll}
                  disabled={saving}
                  aria-label="Accept all cookies"
                  className="flex-1 sm:flex-initial px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                >
                  {saving ? `${t('common.loading')}...` : 'Accept All'}
                </button>
              </div>
            </div>
          ) : (
            /* Customize View */
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-400" />
                  <h2 className="text-sm font-medium text-white">{t('privacy.cookieConsent')}</h2>
                </div>
                <button
                  onClick={() => setShowCustomize(false)}
                  aria-label={t('common.close')}
                  className="p-1.5 text-slate-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 mb-4 max-h-[50vh] overflow-y-auto">
                {cookieCategories.map(category => (
                  <div
                    key={category.id}
                    className="bg-slate-700/50 rounded-lg border border-slate-600/50"
                  >
                    <div className="flex items-center justify-between px-4 py-3">
                      <button
                        onClick={() =>
                          setExpandedCategory(prev => (prev === category.id ? null : category.id))
                        }
                        className="flex items-center gap-2 flex-1 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                        aria-expanded={expandedCategory === category.id}
                        aria-controls={`cookie-category-${category.id}-description`}
                      >
                        {expandedCategory === category.id ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                        <span className="text-sm text-white font-medium">{category.label}</span>
                        {category.required && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-slate-600 text-slate-300">
                            Always Active
                          </span>
                        )}
                      </button>
                      <label
                        className="relative inline-flex items-center cursor-pointer"
                        aria-label={`${category.required ? 'Essential cookies are always enabled' : `Toggle ${category.label} cookies`}`}
                      >
                        <input
                          type="checkbox"
                          checked={preferences[category.id]}
                          onChange={() => toggleCategory(category.id)}
                          disabled={category.required}
                          className="sr-only peer"
                          role="switch"
                          aria-checked={preferences[category.id]}
                          aria-label={`${category.label} cookies`}
                        />
                        <div
                          className={`w-10 h-5 rounded-full transition-colors ${
                            preferences[category.id]
                              ? 'bg-blue-600'
                              : 'bg-slate-600'
                          } ${
                            category.required ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                          } peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-slate-800`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform mt-0.5 ${
                              preferences[category.id] ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'
                            }`}
                          />
                        </div>
                      </label>
                    </div>
                    {expandedCategory === category.id && (
                      <div
                        id={`cookie-category-${category.id}-description`}
                        className="px-4 pb-3 pt-0"
                      >
                        <p className="text-xs text-slate-400 leading-relaxed pl-6">
                          {category.description}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-700">
                <button
                  onClick={handleRejectAll}
                  disabled={saving}
                  aria-label="Reject all non-essential cookies"
                  className="flex-1 sm:flex-initial px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                >
                  Reject All
                </button>
                <button
                  onClick={handleSaveCustom}
                  disabled={saving}
                  aria-label="Save custom cookie preferences"
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  {saving ? `${t('common.loading')}...` : t('common.save')}
                </button>
                <button
                  onClick={handleAcceptAll}
                  disabled={saving}
                  aria-label="Accept all cookies"
                  className="flex-1 sm:flex-initial px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                >
                  Accept All
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;
