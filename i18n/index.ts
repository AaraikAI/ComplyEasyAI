/**
 * ComplyEasyAI Internationalization (i18n) Core Module
 *
 * Provides translation lookup, locale management, and variable interpolation.
 * Works standalone (outside React) for use in utility functions, API layers, etc.
 *
 * For React components, prefer the I18nContext / useTranslation hook instead.
 */

import en from './locales/en.json';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SupportedLocale = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'pt';

export interface LocaleMetadata {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
}

export type TranslationDictionary = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const LOCALE_STORAGE_KEY = 'complyeasy_locale';
export const DEFAULT_LOCALE: SupportedLocale = 'en';

export const AVAILABLE_LOCALES: LocaleMetadata[] = [
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Espanol', dir: 'ltr' },
  { code: 'fr', name: 'French', nativeName: 'Francais', dir: 'ltr' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', dir: 'ltr' },
  { code: 'ja', name: 'Japanese', nativeName: '\u65E5\u672C\u8A9E', dir: 'ltr' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Portugues', dir: 'ltr' },
];

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

let currentLocale: SupportedLocale = DEFAULT_LOCALE;
const loadedLocales: Record<string, TranslationDictionary> = { en: en as unknown as TranslationDictionary };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve a dot-separated key against a nested translation dictionary.
 * e.g. "dashboard.welcome" -> translations.dashboard.welcome
 */
function resolveKey(dict: TranslationDictionary, key: string): string | undefined {
  const parts = key.split('.');
  let current: unknown = dict;

  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === 'string' ? current : undefined;
}

/**
 * Replace `{{variable}}` placeholders with values from the vars object.
 */
function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, varName) => {
    const value = vars[varName];
    return value !== undefined ? String(value) : `{{${varName}}}`;
  });
}

// ---------------------------------------------------------------------------
// Locale loader (dynamic import for non-English locales)
// ---------------------------------------------------------------------------

const localeImportMap: Record<SupportedLocale, () => Promise<{ default: TranslationDictionary }>> = {
  en: () => Promise.resolve({ default: en as unknown as TranslationDictionary }),
  es: () => import('./locales/es.json') as Promise<{ default: TranslationDictionary }>,
  fr: () => import('./locales/fr.json') as Promise<{ default: TranslationDictionary }>,
  de: () => import('./locales/de.json') as Promise<{ default: TranslationDictionary }>,
  ja: () => import('./locales/ja.json') as Promise<{ default: TranslationDictionary }>,
  pt: () => import('./locales/pt.json') as Promise<{ default: TranslationDictionary }>,
};

/**
 * Load a locale dictionary. Returns the cached version if already loaded.
 */
export async function loadLocale(locale: SupportedLocale): Promise<TranslationDictionary> {
  if (loadedLocales[locale]) return loadedLocales[locale];

  const loader = localeImportMap[locale];
  if (!loader) {
    console.warn(`[i18n] Unknown locale "${locale}", falling back to "${DEFAULT_LOCALE}"`);
    return loadedLocales[DEFAULT_LOCALE];
  }

  try {
    const module = await loader();
    loadedLocales[locale] = module.default;
    return module.default;
  } catch (err) {
    console.error(`[i18n] Failed to load locale "${locale}":`, err);
    return loadedLocales[DEFAULT_LOCALE];
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get the current active locale.
 */
export function getLocale(): SupportedLocale {
  return currentLocale;
}

/**
 * Set the current locale. If the locale dictionary is not yet loaded it will
 * be loaded asynchronously; in the meantime, translations fall back to English.
 *
 * Persists the choice in localStorage.
 */
export async function setLocale(locale: SupportedLocale): Promise<void> {
  if (!AVAILABLE_LOCALES.find((l) => l.code === locale)) {
    console.warn(`[i18n] Unsupported locale "${locale}"`);
    return;
  }

  currentLocale = locale;

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    }
  } catch {
    // localStorage may be unavailable (SSR, incognito quota, etc.)
  }

  await loadLocale(locale);
}

/**
 * Translate a key. Supports nested keys ("nav.dashboard") and variable
 * interpolation ("Welcome {{name}}").
 *
 * Falls back to English if the key is missing in the active locale, then
 * returns the raw key if it is missing everywhere.
 */
export function t(key: string, vars?: Record<string, string | number>): string {
  // Try current locale first
  const dict = loadedLocales[currentLocale];
  if (dict) {
    const value = resolveKey(dict, key);
    if (value !== undefined) return interpolate(value, vars);
  }

  // Fallback to English
  if (currentLocale !== DEFAULT_LOCALE) {
    const fallback = resolveKey(loadedLocales[DEFAULT_LOCALE], key);
    if (fallback !== undefined) return interpolate(fallback, vars);
  }

  // Last resort: return the key itself
  return key;
}

/**
 * Initialise the i18n module. Call once at app startup.
 * Reads the persisted locale from localStorage and pre-loads it.
 */
export async function initI18n(): Promise<SupportedLocale> {
  let saved: string | null = null;

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    }
  } catch {
    // ignore
  }

  const locale = (saved && AVAILABLE_LOCALES.find((l) => l.code === saved)
    ? saved
    : DEFAULT_LOCALE) as SupportedLocale;

  await setLocale(locale);
  return locale;
}
