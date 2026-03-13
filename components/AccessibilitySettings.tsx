/**
 * Accessibility Settings Component
 *
 * WCAG 2.1 AA accessibility preferences panel:
 * - High contrast mode toggle
 * - Reduced motion toggle (prefers-reduced-motion)
 * - Font size adjustment (100%, 125%, 150%)
 * - Focus indicator visibility setting
 * - Persists all settings to localStorage
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../contexts/I18nContext';
import {
  Accessibility,
  Eye,
  Type,
  Zap,
  Monitor,
  Sun,
  RotateCcw,
  Check,
  Info,
} from 'lucide-react';

// ── Types ───────────────────────────────────────────────────────────────────

type FontSizeOption = '100' | '125' | '150';
type FocusIndicator = 'default' | 'enhanced' | 'high-visibility';

interface AccessibilityPreferences {
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: FontSizeOption;
  focusIndicator: FocusIndicator;
}

const STORAGE_KEY = 'complyeasy-accessibility-prefs';

const DEFAULT_PREFERENCES: AccessibilityPreferences = {
  highContrast: false,
  reducedMotion: false,
  fontSize: '100',
  focusIndicator: 'default',
};

const FONT_SIZE_OPTIONS: { value: FontSizeOption; label: string; description: string }[] = [
  { value: '100', label: '100% (Default)', description: 'Standard text size for all content' },
  { value: '125', label: '125% (Large)', description: 'Increased text size for easier reading' },
  { value: '150', label: '150% (Extra Large)', description: 'Maximum text size for low vision' },
];

const FOCUS_OPTIONS: { value: FocusIndicator; label: string; description: string }[] = [
  { value: 'default', label: 'Default', description: 'Standard browser focus outline' },
  { value: 'enhanced', label: 'Enhanced', description: 'Thicker, more visible focus ring (3px)' },
  { value: 'high-visibility', label: 'High Visibility', description: 'Bold contrasting outline with offset (4px)' },
];

// ── Helper: load/save preferences ─────────────────────────────────────────

function loadPreferences(): AccessibilityPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_PREFERENCES, ...parsed };
    }
  } catch {
    // Corrupted data, use defaults
  }
  return { ...DEFAULT_PREFERENCES };
}

function savePreferences(prefs: AccessibilityPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Storage full or unavailable
  }
}

// ── Helper: apply preferences to DOM ──────────────────────────────────────

function applyPreferences(prefs: AccessibilityPreferences): void {
  const root = document.documentElement;

  // High contrast mode
  if (prefs.highContrast) {
    root.classList.add('high-contrast');
    root.setAttribute('data-high-contrast', 'true');
  } else {
    root.classList.remove('high-contrast');
    root.removeAttribute('data-high-contrast');
  }

  // Reduced motion
  if (prefs.reducedMotion) {
    root.classList.add('reduce-motion');
    root.setAttribute('data-reduced-motion', 'true');
  } else {
    root.classList.remove('reduce-motion');
    root.removeAttribute('data-reduced-motion');
  }

  // Font size
  const fontSizeMap: Record<FontSizeOption, string> = {
    '100': '16px',
    '125': '20px',
    '150': '24px',
  };
  root.style.fontSize = fontSizeMap[prefs.fontSize];
  root.setAttribute('data-font-size', prefs.fontSize);

  // Focus indicator
  root.setAttribute('data-focus-indicator', prefs.focusIndicator);
  root.classList.remove('focus-default', 'focus-enhanced', 'focus-high-visibility');
  root.classList.add(`focus-${prefs.focusIndicator}`);
}

// ── Inline style injection for accessibility CSS ──────────────────────────

function injectAccessibilityStyles(): void {
  const styleId = 'complyeasy-a11y-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    /* High Contrast Mode */
    .high-contrast {
      --bg-primary: #000000;
      --bg-secondary: #1a1a1a;
      --text-primary: #ffffff;
      --text-secondary: #e0e0e0;
      --border-color: #ffffff;
    }
    .high-contrast * {
      border-color: currentColor !important;
    }
    .high-contrast button, .high-contrast a {
      text-decoration: underline;
    }

    /* Reduced Motion */
    .reduce-motion,
    .reduce-motion * {
      animation-duration: 0.001ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.001ms !important;
      scroll-behavior: auto !important;
    }

    /* Focus Indicators */
    .focus-enhanced *:focus-visible {
      outline: 3px solid #2563eb !important;
      outline-offset: 2px !important;
    }
    .focus-high-visibility *:focus-visible {
      outline: 4px solid #f59e0b !important;
      outline-offset: 3px !important;
      box-shadow: 0 0 0 6px rgba(245, 158, 11, 0.3) !important;
    }
  `;
  document.head.appendChild(style);
}

// ── Component ─────────────────────────────────────────────────────────────

const AccessibilitySettings: React.FC = () => {
  const { t } = useI18n();
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(DEFAULT_PREFERENCES);
  const [saved, setSaved] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    const prefs = loadPreferences();
    setPreferences(prefs);
    applyPreferences(prefs);
    injectAccessibilityStyles();
  }, []);

  // Update a single preference field
  const updatePreference = useCallback(<K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K],
  ) => {
    setPreferences(prev => {
      const next = { ...prev, [key]: value };
      savePreferences(next);
      applyPreferences(next);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      return next;
    });
  }, []);

  // Reset all to defaults
  const resetToDefaults = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
    savePreferences(DEFAULT_PREFERENCES);
    applyPreferences(DEFAULT_PREFERENCES);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, []);

  const hasChanges = JSON.stringify(preferences) !== JSON.stringify(DEFAULT_PREFERENCES);

  return (
    <div className="space-y-6" role="region" aria-label="Accessibility Settings">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
            <Accessibility className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Accessibility Settings
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Customize display and interaction preferences (WCAG 2.1 AA)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span
              className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400"
              role="status"
              aria-live="polite"
            >
              <Check className="w-4 h-4" /> Saved
            </span>
          )}
          {hasChanges && (
            <button
              onClick={resetToDefaults}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              aria-label="Reset accessibility settings to defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {t('common.reset')}
            </button>
          )}
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700 dark:text-blue-300">
          These settings are stored locally in your browser and apply immediately.
          They persist across sessions and help ensure the application meets
          WCAG 2.1 Level AA accessibility standards.
        </p>
      </div>

      {/* Settings cards */}
      <div className="grid gap-4">
        {/* High Contrast Mode */}
        <div className="p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 mt-0.5">
                <Sun className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  High Contrast Mode
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Increase contrast between text and background colors. Adds visible
                  borders and underlines links for better visibility.
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  WCAG 2.1 SC 1.4.3 &mdash; Contrast (Minimum)
                </p>
              </div>
            </div>
            <button
              role="switch"
              aria-checked={preferences.highContrast}
              aria-label="Toggle high contrast mode"
              onClick={() => updatePreference('highContrast', !preferences.highContrast)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                preferences.highContrast
                  ? 'bg-indigo-600'
                  : 'bg-gray-200 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.highContrast ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Reduced Motion */}
        <div className="p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 mt-0.5">
                <Zap className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Reduced Motion
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Minimize animations and transitions throughout the application.
                  Recommended for users who experience motion sickness or vestibular disorders.
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  WCAG 2.1 SC 2.3.3 &mdash; Animation from Interactions
                </p>
              </div>
            </div>
            <button
              role="switch"
              aria-checked={preferences.reducedMotion}
              aria-label="Toggle reduced motion"
              onClick={() => updatePreference('reducedMotion', !preferences.reducedMotion)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                preferences.reducedMotion
                  ? 'bg-indigo-600'
                  : 'bg-gray-200 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.reducedMotion ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Font Size */}
        <div className="p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 mt-0.5">
              <Type className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Font Size
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Adjust the base text size across the application. Content reflows
                without loss of information or functionality.
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                WCAG 2.1 SC 1.4.4 &mdash; Resize Text
              </p>
            </div>
          </div>
          <fieldset>
            <legend className="sr-only">Select font size</legend>
            <div className="grid grid-cols-3 gap-3 pl-11">
              {FONT_SIZE_OPTIONS.map(option => (
                <label
                  key={option.value}
                  className={`relative flex flex-col items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                    preferences.fontSize === option.value
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <input
                    type="radio"
                    name="fontSize"
                    value={option.value}
                    checked={preferences.fontSize === option.value}
                    onChange={() => updatePreference('fontSize', option.value)}
                    className="sr-only"
                    aria-describedby={`font-desc-${option.value}`}
                  />
                  <span
                    className={`text-lg font-bold ${
                      preferences.fontSize === option.value
                        ? 'text-indigo-700 dark:text-indigo-300'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                    style={{ fontSize: `${parseInt(option.value) / 100}em` }}
                  >
                    Aa
                  </span>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1">
                    {option.label}
                  </span>
                  <span
                    id={`font-desc-${option.value}`}
                    className="sr-only"
                  >
                    {option.description}
                  </span>
                  {preferences.fontSize === option.value && (
                    <span className="absolute top-1 right-1">
                      <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </span>
                  )}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {/* Focus Indicator */}
        <div className="p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 mt-0.5">
              <Eye className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Focus Indicator Style
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Control the visibility of keyboard focus indicators on interactive
                elements. Enhanced and high-visibility modes improve navigation
                for keyboard users.
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                WCAG 2.1 SC 2.4.7 &mdash; Focus Visible
              </p>
            </div>
          </div>
          <fieldset>
            <legend className="sr-only">Select focus indicator style</legend>
            <div className="space-y-2 pl-11">
              {FOCUS_OPTIONS.map(option => (
                <label
                  key={option.value}
                  className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                    preferences.focusIndicator === option.value
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <input
                    type="radio"
                    name="focusIndicator"
                    value={option.value}
                    checked={preferences.focusIndicator === option.value}
                    onChange={() => updatePreference('focusIndicator', option.value)}
                    className="sr-only"
                    aria-describedby={`focus-desc-${option.value}`}
                  />
                  {/* Visual preview of the focus style */}
                  <div className="flex-shrink-0">
                    <div
                      className="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-500 bg-gray-50 dark:bg-gray-700"
                      style={
                        option.value === 'default'
                          ? { outline: '2px solid #3b82f6', outlineOffset: '1px' }
                          : option.value === 'enhanced'
                          ? { outline: '3px solid #2563eb', outlineOffset: '2px' }
                          : { outline: '4px solid #f59e0b', outlineOffset: '3px', boxShadow: '0 0 0 6px rgba(245,158,11,0.3)' }
                      }
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {option.label}
                    </span>
                    <span
                      id={`focus-desc-${option.value}`}
                      className="block text-xs text-gray-500 dark:text-gray-400"
                    >
                      {option.description}
                    </span>
                  </div>
                  {preferences.focusIndicator === option.value && (
                    <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                  )}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </div>

      {/* Preview Section */}
      <div className="p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 mt-0.5">
            <Monitor className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Preview
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Test your current accessibility settings with interactive elements below.
            </p>
          </div>
        </div>
        <div className="pl-11 space-y-4">
          <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              Tab through the elements below to test focus indicator visibility.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Sample Button
              </button>
              <a
                href="#preview"
                onClick={(e) => e.preventDefault()}
                className="px-3 py-1.5 text-sm text-indigo-600 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
              >
                Sample Link
              </a>
              <input
                type="text"
                placeholder="Sample input..."
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                aria-label="Sample input for testing focus visibility"
              />
              <select
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                aria-label="Sample select for testing focus visibility"
              >
                <option>Option 1</option>
                <option>Option 2</option>
                <option>Option 3</option>
              </select>
            </div>
          </div>

          {/* Current settings summary */}
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1" role="status" aria-live="polite">
            <p>
              Current settings: Font {preferences.fontSize}%
              {preferences.highContrast ? ' | High Contrast ON' : ''}
              {preferences.reducedMotion ? ' | Reduced Motion ON' : ''}
              {' | Focus: '}{preferences.focusIndicator}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessibilitySettings;
