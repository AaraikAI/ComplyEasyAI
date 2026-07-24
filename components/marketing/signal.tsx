import React from 'react';
import { Link } from 'react-router-dom';

/**
 * "Signal" design-system primitives shared by every marketing surface.
 *
 * Signal marketing pages are dark-only: they render on the near-black canvas
 * (#07090D) with an electric-green accent (#38E8A6) regardless of the app's
 * light/dark theme class. Tokens live in tailwind.config.js under `signal.*`,
 * plus the `bg-signal-glow` / `bg-signal-glow-tight` background utilities and
 * the `font-display` / `font-plex` / `font-mono` families.
 */

/** Category accents used across frameworks (index, pillars, chips). */
export const SIGNAL_CATEGORIES = {
  Security: { color: '#38E8A6', border: 'rgba(56,232,166,.32)', bg: 'rgba(56,232,166,.06)' },
  Privacy: { color: '#3AA0FF', border: 'rgba(58,160,255,.32)', bg: 'rgba(58,160,255,.06)' },
  'AI Governance': { color: '#B98CFF', border: 'rgba(185,140,255,.32)', bg: 'rgba(185,140,255,.06)' },
  'EU Digital': { color: '#E8B93A', border: 'rgba(232,185,58,.32)', bg: 'rgba(232,185,58,.06)' },
} as const;

export type SignalCategory = keyof typeof SIGNAL_CATEGORIES;

/** Full-page wrapper: canvas background, Plex body, primary ink. */
export const SignalPage: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`min-h-screen bg-signal-canvas font-plex text-signal-ink antialiased ${className}`}>
    {children}
  </div>
);

interface SignalSectionProps {
  children: React.ReactNode;
  /** 'glow' = 1000×520 spotlight, 'tight' = 760×420 (hero/CTA), 'plain' = flat canvas. */
  variant?: 'glow' | 'tight' | 'plain';
  className?: string;
  /** Max width of the inner container in px (design uses 1000–1200). */
  width?: 1000 | 1100 | 1200;
  id?: string;
}

/** Marketing section with the signature top-anchored green glow. */
export const SignalSection: React.FC<SignalSectionProps> = ({
  children,
  variant = 'glow',
  className = '',
  width = 1200,
  id,
}) => {
  const bg =
    variant === 'glow' ? 'bg-signal-glow' : variant === 'tight' ? 'bg-signal-glow-tight' : 'bg-signal-canvas';
  const maxW = width === 1000 ? 'max-w-[1000px]' : width === 1100 ? 'max-w-[1100px]' : 'max-w-[1200px]';
  return (
    <section id={id} className={`${bg} px-6 py-[72px] md:px-10 md:py-[88px] ${className}`}>
      <div className={`mx-auto ${maxW}`}>{children}</div>
    </section>
  );
};

interface EyebrowProps {
  children: React.ReactNode;
  /** Accent color for the dot + text (defaults to Signal green). */
  color?: string;
  /** Render the blinking status dot before the label. */
  dot?: boolean;
  /** Wrap in a bordered pill (hero style). */
  pill?: boolean;
  className?: string;
}

/** Mono uppercase eyebrow label, optionally as a bordered pill with a blinking dot. */
export const Eyebrow: React.FC<EyebrowProps> = ({
  children,
  color = '#38E8A6',
  dot = false,
  pill = false,
  className = '',
}) => {
  const inner = (
    <>
      {dot && (
        <span
          aria-hidden="true"
          className="inline-block h-1.5 w-1.5 rounded-full animate-blink-dot"
          style={{ backgroundColor: color }}
        />
      )}
      <span className="font-mono text-[11px] font-medium uppercase tracking-[0.18em]" style={{ color }}>
        {children}
      </span>
    </>
  );
  if (pill) {
    return (
      <span
        className={`inline-flex items-center gap-2.5 rounded-full border px-4 py-2 ${className}`}
        style={{ borderColor: color ? `${color}52` : 'rgba(56,232,166,.32)', backgroundColor: `${color}0f` }}
      >
        {inner}
      </span>
    );
  }
  return <span className={`inline-flex items-center gap-2.5 ${className}`}>{inner}</span>;
};

/** Display-font section heading (Space Grotesk, tight tracking). */
export const SectionTitle: React.FC<{
  children: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3';
  className?: string;
}> = ({ children, as: Tag = 'h2', className = '' }) => (
  <Tag
    className={`font-display font-semibold tracking-[-0.02em] text-signal-ink ${
      Tag === 'h1' ? 'text-5xl leading-[1.04] md:text-[58px]' : 'text-[34px] leading-tight md:text-[42px]'
    } ${className}`}
  >
    {children}
  </Tag>
);

/** Translucent hairline-bordered card. */
export const SignalCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  padding?: 'md' | 'lg';
}> = ({ children, className = '', padding = 'md' }) => (
  <div
    className={`rounded-2xl border border-white/[0.07] bg-white/[0.03] ${
      padding === 'lg' ? 'p-7 md:p-8' : 'p-5 md:p-6'
    } ${className}`}
  >
    {children}
  </div>
);

type CtaProps = {
  children: React.ReactNode;
  to?: string;
  href?: string;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit';
};

const ctaBase =
  'inline-flex items-center justify-center gap-2 rounded-xl text-[15px] font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-signal-green/60';

/** Solid green primary CTA (dark text on green). */
export const PrimaryCta: React.FC<CtaProps> = ({ children, to, href, onClick, className = '', type = 'button' }) => {
  const cls = `${ctaBase} bg-signal-green px-6 py-3 text-signal-canvas shadow-[0_6px_24px_rgba(56,232,166,0.28)] hover:opacity-90 ${className}`;
  if (to) {
    return (
      <Link to={to} onClick={onClick} className={cls}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} onClick={onClick} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} onClick={onClick} className={cls}>
      {children}
    </button>
  );
};

/** Hairline outline secondary CTA. */
export const OutlineCta: React.FC<CtaProps> = ({ children, to, href, onClick, className = '', type = 'button' }) => {
  const cls = `${ctaBase} border border-white/[0.14] bg-white/[0.02] px-6 py-3 text-signal-ink hover:border-white/[0.28] hover:bg-white/[0.05] ${className}`;
  if (to) {
    return (
      <Link to={to} onClick={onClick} className={cls}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} onClick={onClick} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} onClick={onClick} className={cls}>
      {children}
    </button>
  );
};

/** Gradient rounded-square logo mark + wordmark ("AI" in green). */
export const SignalLogo: React.FC<{ size?: number; withWordmark?: boolean; className?: string }> = ({
  size = 34,
  withWordmark = true,
  className = '',
}) => (
  <span className={`inline-flex items-center gap-2.5 ${className}`}>
    <span
      aria-hidden="true"
      className="flex items-center justify-center rounded-[9px] bg-gradient-to-br from-signal-green to-signal-blue"
      style={{ width: size, height: size }}
    >
      <span
        className="rounded-[3px] border-[2.5px] border-signal-canvas"
        style={{ width: Math.round(size * 0.38), height: Math.round(size * 0.38) }}
      />
    </span>
    {withWordmark && (
      <span className="font-display text-lg font-bold tracking-tight text-signal-ink">
        ComplyEasy<span className="text-signal-green">AI</span>
      </span>
    )}
  </span>
);

/** FAQ disclosure row (native details/summary, Signal styling). */
export const SignalFaq: React.FC<{ q: string; a: string }> = ({ q, a }) => (
  <details className="group rounded-2xl border border-white/[0.07] bg-white/[0.03] px-6 py-4 open:pb-5">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-[16px] font-semibold text-signal-ink [&::-webkit-details-marker]:hidden">
      {q}
      <span
        aria-hidden="true"
        className="text-signal-muted transition-transform duration-200 group-open:rotate-45"
      >
        +
      </span>
    </summary>
    <p className="mt-3 text-[15px] leading-relaxed text-signal-body">{a}</p>
  </details>
);

/** Small mono chip (framework names, filters). */
export const SignalChip: React.FC<{
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  color?: string;
  className?: string;
}> = ({ children, active = false, onClick, color = '#38E8A6', className = '' }) => {
  const Tag = onClick ? 'button' : 'span';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`inline-flex items-center rounded-full border px-3.5 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.12em] transition-colors ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      style={
        active
          ? { borderColor: `${color}66`, backgroundColor: `${color}14`, color }
          : { borderColor: 'rgba(255,255,255,.10)', color: '#9aa4b5' }
      }
    >
      {children}
    </Tag>
  );
};
