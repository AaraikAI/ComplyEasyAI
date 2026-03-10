import React from 'react';

/**
 * Skip to main content link for keyboard navigation.
 * Visible only on focus (keyboard Tab).
 * Should be the first focusable element in the page.
 */
const SkipNavLink: React.FC<{ targetId?: string }> = ({ targetId = 'main-content' }) => {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-brand-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 transition-all"
      onClick={(e) => {
        e.preventDefault();
        const target = document.getElementById(targetId);
        if (target) {
          target.setAttribute('tabindex', '-1');
          target.focus();
          target.removeAttribute('tabindex');
        }
      }}
    >
      Skip to main content
    </a>
  );
};

export default SkipNavLink;
