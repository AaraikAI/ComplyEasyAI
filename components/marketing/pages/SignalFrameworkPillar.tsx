import React from 'react';
import { Link } from 'react-router';
import {
  ArrowRight,
  ClipboardCheck,
  FileCheck,
  Gauge,
  Layers,
  Network,
  RefreshCw,
} from 'lucide-react';
import MarketingLayout from '../MarketingLayout';
import Seo from '../../seo/Seo';
import JsonLd from '../../seo/JsonLd';
import { breadcrumbSchema, faqSchema, reviewedWebPageSchema } from '../../seo/siteSchema';
import {
  Eyebrow,
  OutlineCta,
  PrimaryCta,
  SectionTitle,
  SignalCard,
  SignalFaq,
  SignalPage,
  SignalSection,
  SIGNAL_CATEGORIES,
} from '../signal';
import { ReviewedByline, TldrList } from '../answerFirst';
import {
  FRAMEWORK_PILLARS,
  PILLAR_CAPABILITIES,
  PILLAR_HOW_IT_WORKS,
  relatedPillars,
} from '../../../data/frameworkPillarContent';
import { TRIAL_CTA } from '../../../data/marketingFacts';
import { SITE_ORIGIN } from '../../seo/siteOrigin';

/** Icons paired by position with the six shared PILLAR_CAPABILITIES cards. */
const CAPABILITY_ICONS = [Network, FileCheck, RefreshCw, Gauge, Layers, ClipboardCheck];

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

/**
 * Formats an ISO date (YYYY-MM-DD) as "2 December 2027", the day-month order the
 * regulatory copy uses. Parsed by hand so prerendered HTML and the browser agree
 * in every time zone.
 */
function formatMilestoneDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;
  const [, year, month, day] = match;
  const monthName = MONTHS[Number(month) - 1];
  return monthName ? `${Number(day)} ${monthName} ${year}` : isoDate;
}

export interface SignalFrameworkPillarProps {
  /** Key into FRAMEWORK_PILLARS (e.g. 'soc-2', 'gdpr'). */
  slug: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
}

/**
 * Shared "Signal" framework pillar template. Renders every marketing framework
 * page from data/frameworkPillarContent.ts, answer-first: hero (breadcrumb,
 * category eyebrow, H1 naming the query, one-line hook, 40–60-word answer,
 * CTAs, TL;DR, review byline and sources) → requirements → timeline (phased
 * regulations only) → how it works → capabilities → related frameworks → FAQ →
 * closing CTA. Section headings are phrased as the questions people ask.
 * Dark-only by design: explicit signal-* classes on the near-black canvas,
 * independent of the app theme.
 */
const SignalFrameworkPillar: React.FC<SignalFrameworkPillarProps> = ({
  slug,
  seoTitle,
  seoDescription,
  seoKeywords,
}) => {
  const content = FRAMEWORK_PILLARS[slug];
  if (!content) return null;

  const accent = SIGNAL_CATEGORIES[content.category];
  const inSentence = content.nameInSentence ?? content.name;
  const related = relatedPillars(slug);
  const pageUrl = `${SITE_ORIGIN}${content.path}`;

  return (
    <MarketingLayout>
      <Seo
        title={seoTitle}
        description={seoDescription}
        canonicalPath={content.path}
        keywords={seoKeywords}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: `${SITE_ORIGIN}/` },
          { name: 'Frameworks', url: `${SITE_ORIGIN}/frameworks` },
          { name: content.name, url: pageUrl },
        ])}
      />
      <JsonLd
        data={reviewedWebPageSchema({
          name: seoTitle,
          description: seoDescription,
          path: content.path,
          lastReviewed: content.lastReviewed,
          about: content.name,
          citations: content.sources.map((source) => source.url),
        })}
      />
      <JsonLd data={faqSchema(content.faqs)} />

      <SignalPage>
        {/* ============================ Hero ============================ */}
        <SignalSection variant="glow" width={1000}>
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-2 text-[13px] text-signal-muted">
              <li>
                <Link to="/" className="transition-colors hover:text-signal-sub">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link to="/frameworks" className="transition-colors hover:text-signal-sub">
                  Frameworks
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-signal-sub">{content.name}</li>
            </ol>
          </nav>

          <Eyebrow pill dot color={accent.color}>
            {content.category}
          </Eyebrow>

          <SectionTitle as="h1" className="mt-6 max-w-[820px]">
            {content.name} compliance,{' '}
            <span className="block">{content.tagline}</span>
          </SectionTitle>

          <p className="mt-6 max-w-[720px] text-lg leading-relaxed text-signal-sub md:text-[19px]">
            {content.hook}
          </p>
          <p className="mt-4 max-w-[720px] text-[15px] leading-relaxed text-signal-body">
            {content.definition}
          </p>

          <div className="mt-8 flex flex-col gap-3.5 sm:flex-row">
            <PrimaryCta to="/demo">
              Book a demo
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </PrimaryCta>
            <OutlineCta to={TRIAL_CTA.to}>{TRIAL_CTA.label}</OutlineCta>
          </div>

          <div className="mt-10 max-w-[720px]">
            <TldrList items={content.tldr} />
          </div>

          <ReviewedByline lastReviewed={content.lastReviewed} className="mt-6" />
          <p className="mt-2 max-w-[820px] text-[13px] leading-relaxed text-signal-muted">
            <span className="font-mono text-[11px] uppercase tracking-[0.12em]">Sources:</span>{' '}
            {content.sources.map((source, index) => (
              <React.Fragment key={source.url}>
                {index > 0 ? <span aria-hidden="true"> · </span> : null}
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-white/20 underline-offset-2 transition-colors hover:text-signal-sub"
                >
                  {source.label}
                </a>
              </React.Fragment>
            ))}
          </p>
        </SignalSection>

        {/* ======================= Key requirements ===================== */}
        <SignalSection variant="plain" width={1000}>
          <Eyebrow>Key requirements</Eyebrow>
          <SectionTitle className="mt-3.5">What does {inSentence} require?</SectionTitle>
          <p className="mt-3 max-w-[620px] text-base leading-relaxed text-signal-sub">
            The requirements below define {inSentence}. ComplyEasyAI maps your environment to each
            one.
          </p>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {content.requirements.map((req) => (
              <SignalCard key={req.num}>
                <div className="font-mono text-[13px]" style={{ color: accent.color }}>
                  {req.num}
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold text-signal-ink">
                  {req.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-signal-sub">{req.desc}</p>
              </SignalCard>
            ))}
          </div>
        </SignalSection>

        {/* ===================== Timeline (phased rules) ================ */}
        {content.timeline && content.timeline.length > 0 ? (
          <SignalSection variant="plain" width={1000} className="pt-0 md:pt-0">
            <Eyebrow>Timeline</Eyebrow>
            <SectionTitle className="mt-3.5">
              When do {content.name} obligations apply?
            </SectionTitle>
            <ol className="mt-9 flex list-none flex-col gap-3">
              {content.timeline.map((milestone) => (
                <li key={`${milestone.date}-${milestone.event}`}>
                  <SignalCard className="flex flex-col gap-1.5 md:flex-row md:items-baseline md:gap-6">
                    <time
                      dateTime={milestone.date}
                      className="flex-none font-mono text-[13px] text-signal-green md:w-44"
                    >
                      {formatMilestoneDate(milestone.date)}
                    </time>
                    <span className="text-[15px] leading-relaxed text-signal-body">
                      {milestone.event}
                    </span>
                  </SignalCard>
                </li>
              ))}
            </ol>
          </SignalSection>
        ) : null}

        {/* ========================= How it works ======================= */}
        <SignalSection variant="glow" width={1000}>
          <Eyebrow>How it works</Eyebrow>
          <SectionTitle className="mt-3.5">How do you prepare for {inSentence}?</SectionTitle>
          <ol className="mt-9 grid list-none gap-4 md:grid-cols-2">
            {PILLAR_HOW_IT_WORKS.map((step) => (
              <li key={step.num} className="h-full">
                <SignalCard className="flex h-full gap-4">
                  <span
                    className="font-display text-2xl font-bold leading-none text-signal-green"
                    aria-hidden="true"
                  >
                    {step.num}
                  </span>
                  <div>
                    <h3 className="font-display text-[17px] font-semibold text-signal-ink">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-signal-sub">{step.body}</p>
                  </div>
                </SignalCard>
              </li>
            ))}
          </ol>
        </SignalSection>

        {/* ==================== How ComplyEasyAI helps ================== */}
        <SignalSection variant="plain" width={1000}>
          <Eyebrow>How ComplyEasyAI helps</Eyebrow>
          <SectionTitle className="mt-3.5">
            How does ComplyEasyAI automate {content.name} compliance?
          </SectionTitle>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PILLAR_CAPABILITIES.map((cap, index) => {
              const Icon = CAPABILITY_ICONS[index % CAPABILITY_ICONS.length];
              return (
                <SignalCard key={cap.title}>
                  <span className="mb-4 flex h-[42px] w-[42px] items-center justify-center rounded-[11px] bg-signal-green/[0.12] text-signal-green">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="font-display text-[17px] font-semibold text-signal-ink">
                    {cap.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-signal-sub">{cap.desc}</p>
                </SignalCard>
              );
            })}
          </div>
        </SignalSection>

        {/* ====================== Related frameworks ==================== */}
        <SignalSection variant="glow" width={1000}>
          <Eyebrow>Related frameworks</Eyebrow>
          <SectionTitle className="mt-3.5">Which frameworks are related to {inSentence}?</SectionTitle>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((rf) => (
              <Link
                key={rf.slug}
                to={rf.path}
                className="group block rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 transition-colors hover:border-signal-green/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-signal-green/60 md:p-6"
              >
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: SIGNAL_CATEGORIES[rf.category].color }}
                  />
                  <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-signal-sub">
                    {rf.category}
                  </span>
                </span>
                <h3 className="mt-2.5 font-display text-lg font-bold text-signal-ink">{rf.name}</h3>
                <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-signal-green">
                  Explore
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            ))}
          </div>
        </SignalSection>

        {/* ============================= FAQ ============================ */}
        <SignalSection variant="plain" width={1000}>
          <div className="mx-auto max-w-[820px]">
            <div className="mb-8 text-center">
              <Eyebrow>FAQ</Eyebrow>
              <SectionTitle className="mt-3">{content.name} FAQ</SectionTitle>
            </div>
            <div className="flex flex-col gap-3">
              {content.faqs.map((faq) => (
                <SignalFaq key={faq.q} q={faq.q} a={faq.a} />
              ))}
            </div>
          </div>
        </SignalSection>

        {/* ========================= Closing CTA ======================== */}
        <SignalSection variant="tight" width={1000} className="text-center">
          <SectionTitle className="tracking-[-0.03em]">
            Start your {content.name} program.
          </SectionTitle>
          <p className="mt-4 text-lg text-signal-sub">
            Map the requirements, automate the evidence, stay audit-ready.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
            <PrimaryCta to="/demo">
              Book a demo
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </PrimaryCta>
            <OutlineCta to="/pricing">See pricing</OutlineCta>
          </div>
        </SignalSection>
      </SignalPage>
    </MarketingLayout>
  );
};

export default SignalFrameworkPillar;
export { SignalFrameworkPillar };
