import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ChevronDown, Menu, X } from 'lucide-react';
import { ThemeToggleCompact } from '../ThemeToggle';

interface MarketingLayoutProps {
  children: React.ReactNode;
}

interface NavLinkItem {
  label: string;
  to: string;
}

/** Framework pillar pages (also used in the footer "Frameworks" column). */
const FRAMEWORK_LINKS: NavLinkItem[] = [
  { label: 'SOC 2', to: '/frameworks/soc-2' },
  { label: 'ISO 27001', to: '/frameworks/iso-27001' },
  { label: 'GDPR', to: '/frameworks/gdpr' },
  { label: 'HIPAA', to: '/frameworks/hipaa' },
  { label: 'EU AI Act', to: '/frameworks/eu-ai-act' },
  { label: 'NIST AI RMF', to: '/frameworks/nist-ai-rmf' },
  { label: 'PCI DSS', to: '/frameworks/pci-dss' },
  { label: 'NIS2', to: '/frameworks/nis2' },
];

/** Competitor comparison pages (also used in the footer "Compare" column). */
const COMPARE_LINKS: NavLinkItem[] = [
  { label: 'Vanta alternative', to: '/compare/vanta-alternative' },
  { label: 'Drata alternative', to: '/compare/drata-alternative' },
  { label: 'Secureframe alternative', to: '/compare/secureframe-alternative' },
  { label: 'Sprinto alternative', to: '/compare/sprinto-alternative' },
  { label: 'OneTrust alternative', to: '/compare/onetrust-alternative' },
];

const RESOURCE_LINKS: NavLinkItem[] = [
  { label: 'Blog', to: '/blog' },
  { label: 'Glossary', to: '/glossary' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Learning center', to: '/learn' },
  { label: 'Documentation', to: '/docs' },
  { label: 'Community', to: '/community' },
  { label: 'System status', to: '/status' },
];

const LEGAL_LINKS: NavLinkItem[] = [
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Terms of Service', to: '/terms' },
  { label: 'Security', to: '/security' },
  { label: 'GDPR', to: '/gdpr' },
  { label: 'DPA', to: '/dpa' },
];

const Wordmark: React.FC<{ inverse?: boolean }> = ({ inverse = false }) => (
  <span className="flex items-center gap-2">
    <span className="rounded-lg bg-brand-600 p-1.5 shadow-lg shadow-brand-500/20">
      <Shield className="h-5 w-5 text-white" aria-hidden="true" />
    </span>
    <span
      className={`text-lg font-bold tracking-tight ${
        inverse ? 'text-white' : 'text-surface-900 dark:text-white'
      }`}
    >
      ComplyEasy AI
    </span>
  </span>
);

/**
 * Public chrome for marketing and content pages: a sticky header with primary
 * navigation and an SEO-rich footer. Wraps every content page (frameworks,
 * comparisons, blog, glossary, FAQ).
 */
const MarketingLayout: React.FC<MarketingLayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [platformOpen, setPlatformOpen] = useState(false);

  const navHover =
    'text-sm font-medium text-surface-600 transition-colors hover:text-brand-600 dark:text-surface-300 dark:hover:text-brand-400';

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-surface-900 dark:bg-surface-950 dark:text-surface-100">
      {/* ============================== Header ============================== */}
      <header className="sticky top-0 z-50 border-b border-surface-200/60 glass dark:border-surface-700/60 dark:glass-dark">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" aria-label="ComplyEasy AI home">
              <Wordmark />
            </Link>

            {/* Desktop navigation */}
            <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
              {/* Platform dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setPlatformOpen(true)}
                onMouseLeave={() => setPlatformOpen(false)}
              >
                <button
                  type="button"
                  className={`flex items-center gap-1 ${navHover}`}
                  aria-haspopup="true"
                  aria-expanded={platformOpen}
                  onClick={() => setPlatformOpen((v) => !v)}
                >
                  Platform
                  <ChevronDown size={14} aria-hidden="true" />
                </button>
                {platformOpen && (
                  <div className="absolute left-0 top-full w-56 pt-2">
                    <div className="grid grid-cols-1 gap-1 rounded-2xl border border-surface-200 bg-white p-2 shadow-xl dark:border-surface-700 dark:bg-surface-900">
                      {FRAMEWORK_LINKS.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          className="rounded-lg px-3 py-2 text-sm text-surface-600 transition-colors hover:bg-surface-50 hover:text-brand-600 dark:text-surface-300 dark:hover:bg-surface-800 dark:hover:text-brand-400"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Link to="/compare/vanta-alternative" className={navHover}>
                Compare
              </Link>
              <Link to="/" className={navHover}>
                Pricing
              </Link>
              <Link to="/blog" className={navHover}>
                Blog
              </Link>
              <Link to="/glossary" className={navHover}>
                Glossary
              </Link>
              <Link to="/faq" className={navHover}>
                FAQ
              </Link>

              <ThemeToggleCompact />

              <Link to="/login" className={navHover}>
                Log in
              </Link>
              <Link
                to="/signup"
                className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                Start free
              </Link>
            </nav>

            {/* Mobile toggle */}
            <div className="flex items-center gap-3 md:hidden">
              <ThemeToggleCompact />
              <button
                type="button"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileOpen}
                className="rounded-lg p-2 text-surface-600 hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-800"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile navigation */}
        {mobileOpen && (
          <nav
            aria-label="Mobile"
            className="border-t border-surface-200 bg-white px-4 py-4 dark:border-surface-700 dark:bg-surface-950 md:hidden"
          >
            <div className="flex flex-col gap-1">
              {[...FRAMEWORK_LINKS.slice(0, 4)].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm text-surface-700 hover:bg-surface-50 dark:text-surface-200 dark:hover:bg-surface-800"
                >
                  {item.label}
                </Link>
              ))}
              <Link to="/compare/vanta-alternative" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm text-surface-700 hover:bg-surface-50 dark:text-surface-200 dark:hover:bg-surface-800">Compare</Link>
              <Link to="/blog" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm text-surface-700 hover:bg-surface-50 dark:text-surface-200 dark:hover:bg-surface-800">Blog</Link>
              <Link to="/glossary" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm text-surface-700 hover:bg-surface-50 dark:text-surface-200 dark:hover:bg-surface-800">Glossary</Link>
              <Link to="/faq" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm text-surface-700 hover:bg-surface-50 dark:text-surface-200 dark:hover:bg-surface-800">FAQ</Link>
              <Link to="/login" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm text-surface-700 hover:bg-surface-50 dark:text-surface-200 dark:hover:bg-surface-800">Log in</Link>
              <Link
                to="/signup"
                onClick={() => setMobileOpen(false)}
                className="mt-2 rounded-full bg-brand-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-brand-700"
              >
                Start free
              </Link>
            </div>
          </nav>
        )}
      </header>

      {/* ============================== Main =============================== */}
      <main className="flex-1">{children}</main>

      {/* ============================== Footer ============================= */}
      <footer className="border-t border-surface-800 bg-surface-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link to="/" aria-label="ComplyEasy AI home">
                <Wordmark inverse />
              </Link>
              <p className="mt-4 text-sm text-surface-400">
                AI-native compliance automation that helps teams achieve and maintain readiness across
                security, privacy, and AI-governance frameworks.
              </p>
            </div>

            {/* Frameworks */}
            <div>
              <h2 className="mb-4 text-sm font-semibold text-white">Frameworks</h2>
              <ul className="space-y-3 text-sm text-surface-400">
                {FRAMEWORK_LINKS.map((item) => (
                  <li key={item.to}>
                    <Link to={item.to} className="transition-colors hover:text-white">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Compare */}
            <div>
              <h2 className="mb-4 text-sm font-semibold text-white">Compare</h2>
              <ul className="space-y-3 text-sm text-surface-400">
                {COMPARE_LINKS.map((item) => (
                  <li key={item.to}>
                    <Link to={item.to} className="transition-colors hover:text-white">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h2 className="mb-4 text-sm font-semibold text-white">Resources</h2>
              <ul className="space-y-3 text-sm text-surface-400">
                {RESOURCE_LINKS.map((item) => (
                  <li key={item.to}>
                    <Link to={item.to} className="transition-colors hover:text-white">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company + Legal */}
            <div>
              <h2 className="mb-4 text-sm font-semibold text-white">Company</h2>
              <ul className="space-y-3 text-sm text-surface-400">
                <li>
                  <a href="/about" className="transition-colors hover:text-white">
                    About
                  </a>
                </li>
                <li>
                  <a href="/careers" className="transition-colors hover:text-white">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="/contact" className="transition-colors hover:text-white">
                    Contact
                  </a>
                </li>
              </ul>
              <h2 className="mb-4 mt-6 text-sm font-semibold text-white">Legal</h2>
              <ul className="space-y-3 text-sm text-surface-400">
                {LEGAL_LINKS.map((item) => (
                  <li key={item.to}>
                    <Link to={item.to} className="transition-colors hover:text-white">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-surface-800 pt-8 text-sm text-surface-400">
            &copy; 2026 ComplyEasy AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MarketingLayout;
export { MarketingLayout };
