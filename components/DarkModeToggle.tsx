/**
 * Dark Mode Toggle Component
 * Allows users to switch between light/dark/system themes
 */

import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';
import { useI18n } from '../contexts/I18nContext';

export const DarkModeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, setTheme, isDark } = useDarkMode();
  const { t } = useI18n();

  return (
    <div className={`flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}>
      <button
        onClick={() => setTheme('light')}
        className={`p-2 rounded-md transition-colors ${
          theme === 'light'
            ? 'bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
        title={t('settings.lightMode')}
        aria-label={t('settings.lightMode')}
      >
        <Sun className="w-4 h-4" />
      </button>

      <button
        onClick={() => setTheme('system')}
        className={`p-2 rounded-md transition-colors ${
          theme === 'system'
            ? 'bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
        title={t('settings.systemTheme')}
        aria-label={t('settings.systemTheme')}
      >
        <Monitor className="w-4 h-4" />
      </button>

      <button
        onClick={() => setTheme('dark')}
        className={`p-2 rounded-md transition-colors ${
          theme === 'dark'
            ? 'bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
        title={t('settings.darkMode')}
        aria-label={t('settings.darkMode')}
      >
        <Moon className="w-4 h-4" />
      </button>
    </div>
  );
};

/**
 * Simple dark mode toggle button (moon/sun icon only)
 */
export const DarkModeToggleSimple: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { toggleDarkMode, isDark } = useDarkMode();
  const { t: translate } = useI18n();

  return (
    <button
      onClick={toggleDarkMode}
      className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${className}`}
      title={isDark ? translate('settings.lightMode') : translate('settings.darkMode')}
      aria-label={isDark ? translate('settings.lightMode') : translate('settings.darkMode')}
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      ) : (
        <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      )}
    </button>
  );
};

export default DarkModeToggle;
