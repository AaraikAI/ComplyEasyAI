import { useContext } from 'react';
import { I18nContext, type I18nContextType } from '../contexts/I18nContext';

/**
 * Hook for accessing the i18n system inside React components.
 *
 * Returns the full I18nContextType:
 *  - `t(key, vars?)` -- translate a dot-separated key with optional interpolation
 *  - `locale`         -- current active locale code (e.g. "en", "es")
 *  - `setLocale`      -- switch locale (async, lazy-loads the bundle)
 *  - `availableLocales` -- list of all supported locales
 *  - `isLoading`      -- true while a locale bundle is being fetched
 *
 * @example
 *   const { t, locale, setLocale } = useTranslation();
 *   return (
 *     <>
 *       <h1>{t('dashboard.welcome', { name: user.name })}</h1>
 *       <button onClick={() => setLocale('es')}>Espanol</button>
 *     </>
 *   );
 *
 * @throws if called outside an <I18nProvider>
 */
export const useTranslation = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an <I18nProvider>');
  }
  return context;
};

export default useTranslation;
