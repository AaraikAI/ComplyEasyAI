import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Menu, X } from 'lucide-react';
import { SignalLogo } from './signal';
import { FRAMEWORK_PILLARS } from '../../data/frameworkPillarContent';

interface MarketingLayoutProps {
  children: React.ReactNode;
}

interface NavLinkItem {
  label: string;
  to: string;
}

/** Framework pillar pages (footer "Frameworks" column), from the content module. */
const FRAMEWORK_LINKS: NavLinkItem[] = Object.values(FRAMEWORK_PILLARS).map((f) => ({
  label: f.name,
  to: f.path,
}));

/** Competitor comparison pages (nav dropdown + footer "Compare" column). */
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

/** Primary nav links (Signal spec: Platform, Frameworks, Pricing, Compare). */
const PRIMARY_LINKS: NavLinkItem[] = [
  { label: 'Platform', to: '/platform' },
  { label: 'Frameworks', to: '/frameworks' },
  { label: 'Pricing', to: '/pricing' },
];

/**
 * Public chrome for marketing and content pages — "Signal" design system.
 * Dark-only: sticky nav on the near-black canvas with the green pill CTA, and
 * an SEO-rich dark footer. The root carries the `dark` class so legacy content
 * pages (blog, glossary, FAQ) render their dark variants underneath.
 */
const MarketingLayout: React.FC<MarketingLayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const location = useLocation();

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  const navLink = (active: boolean) =>
    `text-sm font-medium transition-colors ${
      active ? 'text-signal-green' : 'text-signal-sub hover:text-signal-ink'
    }`;

  return (
    <div className="dark flex min-h-screen flex-col bg-signal-canvas font-plex text-signal-ink antialiased">
      {/* ============================== Header ============================== */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-signal-canvas/85 backdrop-blur-md">
        <div className="mx-auto max-w-[1200px] px-6 md:px-10">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" aria-label="ComplyEasyAI home">
              <SignalLogo />
            </Link>

            {/* Desktop navigation */}
            <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
              {PRIMARY_LINKS.map((item) => (
                <Link key={item.to} to={item.to} className={navLink(isActive(item.to))}>
                  {item.label}
                </Link>
              ))}

              {/* Compare dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setCompareOpen(true)}
                onMouseLeave={() => setCompareOpen(false)}
              >
                <button
                  type="button"
                  className={`flex items-center gap-1 ${navLink(isActive('/compare'))}`}
                  aria-haspopup="true"
                  aria-expanded={compareOpen}
                  onClick={() => setCompareOpen((v) => !v)}
                >
                  Compare
                  <ChevronDown size={14} aria-hidden="true" />
                </button>
                {compareOpen && (
                  <div className="absolute left-0 top-full w-60 pt-2">
                    <div className="grid grid-cols-1 gap-1 rounded-2xl border border-white/[0.08] bg-signal-panel p-2 shadow-2xl shadow-black/50">
                      {COMPARE_LINKS.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          className="rounded-lg px-3 py-2 text-sm text-signal-sub transition-colors hover:bg-white/[0.05] hover:text-signal-green"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </nav>

            <div className="hidden items-center gap-6 md:flex">
              <Link to="/login" className={navLink(false)}>
                Log in
              </Link>
              <Link
                to="/demo"
                className="rounded-full bg-signal-green px-5 py-2.5 text-sm font-semibold text-signal-canvas shadow-[0_6px_24px_rgba(56,232,166,0.28)] transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-signal-green/60"
              >
                Book a demo
              </Link>
            </div>

            {/* Mobile toggle */}
            <div className="flex items-center gap-3 md:hidden">
              <button
                type="button"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileOpen}
                className="rounded-lg p-2 text-signal-sub hover:bg-white/[0.06] hover:text-signal-ink"
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
            className="border-t border-white/[0.06] bg-signal-canvas px-6 py-4 md:hidden"
          >
            <div className="flex flex-col gap-1">
              {[...PRIMARY_LINKS, { label: 'Compare', to: '/compare/vanta-alternative' }].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm text-signal-body hover:bg-white/[0.05] hover:text-signal-ink"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-sm text-signal-body hover:bg-white/[0.05] hover:text-signal-ink"
              >
                Log in
              </Link>
              <Link
                to="/demo"
                onClick={() => setMobileOpen(false)}
                className="mt-2 rounded-full bg-signal-green px-4 py-2.5 text-center text-sm font-semibold text-signal-canvas"
              >
                Book a demo
              </Link>
            </div>
          </nav>
        )}
      </header>

      {/* ============================== Main =============================== */}
      <main className="flex-1 bg-signal-canvas">{children}</main>

      {/* ============================== Footer ============================= */}
      <footer className="border-t border-white/[0.06] bg-signal-canvas">
        <div className="mx-auto max-w-[1200px] px-6 py-16 md:px-10">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link to="/" aria-label="ComplyEasyAI home">
                <SignalLogo />
              </Link>
              <p className="mt-4 text-sm leading-relaxed text-signal-muted">
                Autonomous compliance that watches your stack, closes the gaps, and keeps you
                audit-ready across every major framework.
              </p>
            </div>

            {/* Frameworks */}
            <div>
              <h2 className="mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-signal-muted">
                Frameworks
              </h2>
              <ul className="space-y-3 text-sm text-signal-sub">
                {FRAMEWORK_LINKS.slice(0, 8).map((item) => (
                  <li key={item.to}>
                    <Link to={item.to} className="transition-colors hover:text-signal-ink">
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link to="/frameworks" className="text-signal-green transition-opacity hover:opacity-80">
                    All frameworks →
                  </Link>
                </li>
              </ul>
            </div>

            {/* Compare */}
            <div>
              <h2 className="mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-signal-muted">
                Compare
              </h2>
              <ul className="space-y-3 text-sm text-signal-sub">
                {COMPARE_LINKS.map((item) => (
                  <li key={item.to}>
                    <Link to={item.to} className="transition-colors hover:text-signal-ink">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h2 className="mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-signal-muted">
                Resources
              </h2>
              <ul className="space-y-3 text-sm text-signal-sub">
                {RESOURCE_LINKS.map((item) => (
                  <li key={item.to}>
                    <Link to={item.to} className="transition-colors hover:text-signal-ink">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company + Legal */}
            <div>
              <h2 className="mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-signal-muted">
                Company
              </h2>
              <ul className="space-y-3 text-sm text-signal-sub">
                <li>
                  <Link to="/platform" className="transition-colors hover:text-signal-ink">
                    Platform
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="transition-colors hover:text-signal-ink">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link to="/demo" className="transition-colors hover:text-signal-ink">
                    Book a demo
                  </Link>
                </li>
              </ul>
              <h2 className="mb-4 mt-6 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-signal-muted">
                Legal
              </h2>
              <ul className="space-y-3 text-sm text-signal-sub">
                {LEGAL_LINKS.map((item) => (
                  <li key={item.to}>
                    <Link to={item.to} className="transition-colors hover:text-signal-ink">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-4 border-t border-white/[0.06] pt-8 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <SignalLogo withWordmark={false} size={22} />
              <span className="text-sm text-signal-muted">© 2026 ComplyEasyAI. All rights reserved.</span>
            </div>
            <div className="flex flex-wrap items-center gap-5 font-mono text-[11px] uppercase tracking-[0.14em] text-signal-muted">
              <Link to="/privacy" className="transition-colors hover:text-signal-sub">
                Privacy
              </Link>
              <Link to="/terms" className="transition-colors hover:text-signal-sub">
                Terms
              </Link>
              <Link to="/security" className="transition-colors hover:text-signal-sub">
                Security
              </Link>
              <Link to="/status" className="transition-colors hover:text-signal-sub">
                Status
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MarketingLayout;
export { MarketingLayout };
