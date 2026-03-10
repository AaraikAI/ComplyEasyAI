/**
 * Language Switcher Component
 *
 * Dropdown for selecting the application language.
 * Shows available locales with flag emojis, native names, and check marks.
 * Fully keyboard accessible (arrow keys, Enter, Escape, Home, End).
 * Persists the selection to localStorage via the I18n context.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Globe, Check, ChevronDown, Loader2 } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import type { SupportedLocale } from '../i18n';

// ---------------------------------------------------------------------------
// Flag emoji map
// ---------------------------------------------------------------------------

const FLAG_MAP: Record<SupportedLocale, string> = {
  en: '\uD83C\uDDFA\uD83C\uDDF8',
  es: '\uD83C\uDDEA\uD83C\uDDF8',
  fr: '\uD83C\uDDEB\uD83C\uDDF7',
  de: '\uD83C\uDDE9\uD83C\uDDEA',
  ja: '\uD83C\uDDEF\uD83C\uDDF5',
  pt: '\uD83C\uDDE7\uD83C\uDDF7',
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface LanguageSwitcherProps {
  /** Render a compact icon-only button (no label text). Defaults to false. */
  compact?: boolean;
  /** Additional CSS classes for the wrapper div. */
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  compact = false,
  className = '',
}) => {
  const { locale, setLocale, availableLocales, t, isLoading } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // ---- Close on click outside ----
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setFocusIndex(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ---- Keyboard navigation ----
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          setIsOpen(true);
          setFocusIndex(availableLocales.findIndex((l) => l.code === locale));
        }
        return;
      }

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setFocusIndex(-1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFocusIndex((prev) => (prev + 1) % availableLocales.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusIndex((prev) => (prev - 1 + availableLocales.length) % availableLocales.length);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (focusIndex >= 0 && focusIndex < availableLocales.length) {
            handleSelect(availableLocales[focusIndex].code);
          }
          break;
        case 'Home':
          e.preventDefault();
          setFocusIndex(0);
          break;
        case 'End':
          e.preventDefault();
          setFocusIndex(availableLocales.length - 1);
          break;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isOpen, focusIndex, availableLocales, locale],
  );

  // ---- Scroll focused item into view ----
  useEffect(() => {
    if (isOpen && focusIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[role="option"]');
      items[focusIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [focusIndex, isOpen]);

  // ---- Selection handler ----
  const handleSelect = async (code: SupportedLocale) => {
    setIsOpen(false);
    setFocusIndex(-1);
    if (code !== locale) {
      await setLocale(code);
    }
  };

  const currentLocale = availableLocales.find((l) => l.code === locale);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setFocusIndex(availableLocales.findIndex((l) => l.code === locale));
          }
        }}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={t('settings.selectLanguage')}
        className={[
          'flex items-center gap-2 rounded-lg border transition-colors text-sm',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/50',
          // Light mode
          'bg-white border-gray-300 text-gray-700 hover:bg-gray-50',
          // Dark mode
          'dark:bg-white/5 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white',
          compact ? 'px-2 py-2' : 'px-3 py-2',
        ].join(' ')}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Globe className="w-4 h-4 flex-shrink-0" />
        )}

        {!compact && (
          <>
            <span className="hidden sm:inline">
              {FLAG_MAP[locale]} {currentLocale?.nativeName || 'English'}
            </span>
            <span className="sm:hidden">{FLAG_MAP[locale]}</span>
          </>
        )}

        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <ul
          ref={listRef}
          role="listbox"
          aria-label={t('settings.selectLanguage')}
          aria-activedescendant={
            focusIndex >= 0 ? `lang-option-${availableLocales[focusIndex]?.code}` : undefined
          }
          className={[
            'absolute right-0 mt-2 w-56 py-1.5 rounded-xl shadow-2xl z-50 max-h-72 overflow-y-auto',
            // Light mode
            'bg-white border border-gray-200',
            // Dark mode
            'dark:bg-slate-800/95 dark:backdrop-blur-xl dark:border-white/10',
          ].join(' ')}
        >
          {/* Header */}
          <li className="px-3.5 py-2 border-b border-gray-100 dark:border-white/10">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/40">
              {t('settings.selectLanguage')}
            </span>
          </li>

          {/* Options */}
          {availableLocales.map((loc, idx) => {
            const isActive = loc.code === locale;
            const isFocused = idx === focusIndex;

            return (
              <li
                key={loc.code}
                id={`lang-option-${loc.code}`}
                role="option"
                aria-selected={isActive}
                onClick={() => handleSelect(loc.code)}
                onMouseEnter={() => setFocusIndex(idx)}
                className={[
                  'flex items-center justify-between px-3.5 py-2.5 cursor-pointer transition-colors text-sm',
                  isFocused ? 'bg-gray-50 dark:bg-white/10' : '',
                  isActive
                    ? 'text-indigo-600 dark:text-blue-400'
                    : 'text-gray-700 hover:text-gray-900 dark:text-white/80 dark:hover:text-white',
                ].join(' ')}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg leading-none">{FLAG_MAP[loc.code]}</span>
                  <div className="flex flex-col">
                    <span className="font-medium">{loc.nativeName}</span>
                    <span className="text-xs text-gray-400 dark:text-white/40">{loc.name}</span>
                  </div>
                </div>
                {isActive && <Check className="w-4 h-4 text-indigo-600 dark:text-blue-400 flex-shrink-0" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default LanguageSwitcher;
