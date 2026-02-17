import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeToggleProps {
  variant?: 'icon' | 'dropdown';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = 'icon', className = '' }) => {
  const { theme, resolvedTheme, setTheme } = useTheme();

  if (variant === 'dropdown') {
    return (
      <div className={`relative inline-block ${className}`}>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
          className="appearance-none bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg px-3 py-2 pr-8 text-sm text-surface-700 dark:text-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
          {theme === 'light' && <Sun size={14} className="text-amber-500" />}
          {theme === 'dark' && <Moon size={14} className="text-indigo-400" />}
          {theme === 'system' && <Monitor size={14} className="text-surface-500" />}
        </div>
      </div>
    );
  }

  // Icon button variant with cycle through modes
  const handleClick = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getIcon = () => {
    if (theme === 'system') {
      return <Monitor size={20} />;
    }
    return resolvedTheme === 'dark' ? <Moon size={20} /> : <Sun size={20} />;
  };

  const getTooltip = () => {
    if (theme === 'light') return 'Switch to dark mode';
    if (theme === 'dark') return 'Switch to system theme';
    return 'Switch to light mode';
  };

  return (
    <button
      onClick={handleClick}
      className={`p-2 rounded-lg transition-colors duration-200 ${
        resolvedTheme === 'dark'
          ? 'bg-surface-800 hover:bg-surface-700 text-surface-200'
          : 'bg-surface-100 hover:bg-surface-200 text-surface-700'
      } ${className}`}
      title={getTooltip()}
      aria-label={getTooltip()}
    >
      <div className="relative">
        {getIcon()}
        {theme === 'system' && (
          <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-brand-500 rounded-full" />
        )}
      </div>
    </button>
  );
};

// Compact version for headers
export const ThemeToggleCompact: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const handleClick = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`relative flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300 ${
        resolvedTheme === 'dark'
          ? 'bg-surface-700/50 hover:bg-surface-600/50 text-yellow-300'
          : 'bg-surface-100 hover:bg-surface-200 text-surface-600'
      } ${className}`}
      title={`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`}
      aria-label={`Current theme: ${theme}. Click to change.`}
    >
      <div className="relative transition-transform duration-300">
        {theme === 'light' && <Sun size={18} className="text-amber-500" />}
        {theme === 'dark' && <Moon size={18} className="text-indigo-300" />}
        {theme === 'system' && (
          <>
            <Monitor size={18} />
            <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-brand-500 rounded-full" />
          </>
        )}
      </div>
    </button>
  );
};
