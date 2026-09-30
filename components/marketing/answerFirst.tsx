import React from 'react';
import { Check } from 'lucide-react';
import { REVIEWER_NAME } from '../seo/brand';

/**
 * "Answer-first" building blocks shared by marketing pages, pillar pages and
 * blog posts, in the Signal design system:
 *
 * - <TldrList> — the TL;DR bullets under a page's lede.
 * - <ReviewedByline> — "Reviewed by the ComplyEasyAI compliance team · Last
 *   reviewed <date>". Pair it with reviewedWebPageSchema() or
 *   reviewedArticleSchema() from components/seo/siteSchema.ts so the visible
 *   date and the JSON-LD dateModified / lastReviewed stay the same value.
 */

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** An ISO calendar date, YYYY-MM-DD. */
export const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Formats an ISO date (YYYY-MM-DD) as "September 27, 2026". Parsed by hand so
 * the prerendered HTML and the browser render the same day in every time zone.
 */
export function formatReviewDate(isoDate: string): string {
  const match = ISO_DATE.exec(isoDate);
  if (!match) return isoDate;
  const [, year, month, day] = match;
  const monthName = MONTHS[Number(month) - 1];
  return monthName ? `${monthName} ${Number(day)}, ${year}` : isoDate;
}

interface TldrListProps {
  /** Three to five short takeaways, each one sentence. */
  items: string[];
  /** Visible label above the list. */
  label?: string;
  className?: string;
}

/** TL;DR card: a mono label and check-mark bullets on a hairline Signal card. */
export const TldrList: React.FC<TldrListProps> = ({ items, label = 'TL;DR', className = '' }) => (
  <section
    aria-label={label}
    className={`rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 text-left md:p-6 ${className}`}
  >
    <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-signal-green">
      {label}
    </p>
    <ul className="mt-3 flex flex-col gap-2.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-signal-body">
          <Check
            className="mt-1 h-3.5 w-3.5 flex-none text-signal-green"
            strokeWidth={3}
            aria-hidden="true"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </section>
);

interface ReviewedBylineProps {
  /** ISO date (YYYY-MM-DD) of the last content review. */
  lastReviewed: string;
  className?: string;
}

/** Visible review byline with a machine-readable <time> element. */
export const ReviewedByline: React.FC<ReviewedBylineProps> = ({ lastReviewed, className = '' }) => (
  <p className={`font-mono text-[11px] uppercase tracking-[0.12em] text-signal-muted ${className}`}>
    <span>Reviewed by {REVIEWER_NAME}</span>
    <span aria-hidden="true"> · </span>
    <span>
      Last reviewed <time dateTime={lastReviewed}>{formatReviewDate(lastReviewed)}</time>
    </span>
  </p>
);
