import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useAppNavigate } from '../hooks/useAppNavigate';

/**
 * Auto-generated breadcrumb navigation based on current route.
 * Provides contextual navigation hierarchy for deep-linked pages.
 */
export const Breadcrumbs: React.FC = () => {
  const { breadcrumbs } = useAppNavigate();

  if (breadcrumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-1 text-sm mb-4">
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        const isFirst = index === 0;

        return (
          <React.Fragment key={index}>
            {index > 0 && (
              <ChevronRight size={14} className="text-surface-400 dark:text-surface-500 flex-shrink-0" />
            )}
            {isLast ? (
              <span className="text-surface-700 dark:text-surface-200 font-medium truncate max-w-[200px]">
                {isFirst && <Home size={14} className="inline mr-1 -mt-0.5" />}
                {crumb.label}
              </span>
            ) : crumb.path ? (
              <Link
                to={crumb.path}
                className="text-surface-500 dark:text-surface-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors truncate max-w-[200px]"
              >
                {isFirst && <Home size={14} className="inline mr-1 -mt-0.5" />}
                {crumb.label}
              </Link>
            ) : (
              <span className="text-surface-500 dark:text-surface-400 truncate max-w-[200px]">
                {crumb.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
