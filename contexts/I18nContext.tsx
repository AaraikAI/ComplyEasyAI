import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  SupportedLocale,
  AVAILABLE_LOCALES,
  DEFAULT_LOCALE,
  initI18n,
  setLocale as setCoreLocale,
  t as coreT,
  type LocaleMetadata,
} from '../i18n';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface I18nContextType {
  /** The currently active locale code. */
  locale: SupportedLocale;

  /** Switch to a different locale. Persists to localStorage and lazy-loads the dictionary. */
  setLocale: (locale: SupportedLocale) => Promise<void>;

  /**
   * Translate a dot-separated key with optional variable interpolation.
   *
   * @example
   *   t("nav.dashboard")               // "Dashboard"
   *   t("dashboard.welcome", { name: "Alice" })  // "Welcome back, Alice"
   *   t("frameworks.controlsCompleted", { completed: 5, total: 10 })
   */
  t: (key: string, vars?: Record<string, string | number>) => string;

  /** Metadata for every supported locale (code, name, nativeName, dir). */
  availableLocales: LocaleMetadata[];

  /** True while a non-English locale bundle is being fetched. */
  isLoading: boolean;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<SupportedLocale>(DEFAULT_LOCALE);
  const [isLoading, setIsLoading] = useState(true);
  const [, forceUpdate] = useState(0);

  // Initialise on mount: read persisted locale from localStorage and pre-load it.
  useEffect(() => {
    initI18n().then((initialLocale) => {
      setLocaleState(initialLocale);

      // Set the <html> lang attribute to match
      document.documentElement.lang = initialLocale;
      const localeData = AVAILABLE_LOCALES.find((l) => l.code === initialLocale);
      if (localeData) document.documentElement.dir = localeData.dir;

      setIsLoading(false);
    });
  }, []);

  // Exposed setter: update core module, local state, and DOM attributes.
  const changeLocale = useCallback(async (newLocale: SupportedLocale) => {
    setIsLoading(true);
    await setCoreLocale(newLocale);
    setLocaleState(newLocale);

    // Keep <html lang="..."> in sync for accessibility / SEO
    document.documentElement.lang = newLocale;
    const localeData = AVAILABLE_LOCALES.find((l) => l.code === newLocale);
    if (localeData) document.documentElement.dir = localeData.dir;

    // Force consumers to re-render with the newly loaded dictionary
    forceUpdate((n) => n + 1);
    setIsLoading(false);
  }, []);

  // Translation function -- delegates to the core module.
  // The dependency on `locale` (and the force-update counter) ensures React
  // re-creates the callback reference after a locale switch, causing
  // consumers that call `t()` to re-render with the new translations.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => coreT(key, vars),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale],
  );

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale: changeLocale,
        t,
        availableLocales: AVAILABLE_LOCALES,
        isLoading,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// Convenience hook
// ---------------------------------------------------------------------------

export const useI18n = (): I18nContextType => {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an <I18nProvider>');
  }
  return ctx;
};

export { I18nContext };
export default I18nContext;
