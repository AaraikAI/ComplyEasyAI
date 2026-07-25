import React from 'react';
import { Link } from 'react-router';
import { ArrowRight, Check, Scale } from 'lucide-react';
import MarketingLayout from '../MarketingLayout';
import Seo from '../../seo/Seo';
import JsonLd from '../../seo/JsonLd';
import { breadcrumbSchema, faqSchema } from '../../seo/siteSchema';
import {
  SignalSection,
  Eyebrow,
  SectionTitle,
  SignalCard,
  PrimaryCta,
  OutlineCta,
  SignalFaq,
} from '../signal';
import { COMPETITOR_PAGES } from '../../../data/competitorPageContent';

const SITE_ORIGIN = 'https://complyeasyai.com';

export interface SignalCompetitorPageProps {
  /** Key into COMPETITOR_PAGES (vanta | drata | secureframe | sprinto | onetrust). */
  slug: string;
  /** Per-page SEO strings, preserved verbatim by each wrapper page. */
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  /** Optional og:type override (some pages ship 'article'). */
  seoOgType?: string;
}

/**
 * Shared "Signal" competitor-comparison page. Dark-only by design: every
 * section renders on the near-black canvas with the electric-green accent,
 * independent of the app theme. Content comes exclusively from
 * data/competitorPageContent.ts; the five route components are thin wrappers
 * that pass a slug plus their preserved SEO strings.
 */
const SignalCompetitorPage: React.FC<SignalCompetitorPageProps> = ({
  slug,
  seoTitle,
  seoDescription,
  seoKeywords,
  seoOgType,
}) => {
  const content = COMPETITOR_PAGES[slug];
  if (!content) return null;

  const { them, path, intro, rows, whyChoose, whenFit, faqs } = content;

  const breadcrumb = breadcrumbSchema([
    { name: 'Home', url: `${SITE_ORIGIN}/` },
    { name: 'Compare', url: `${SITE_ORIGIN}/compare/vanta-alternative` },
    { name: `${them} alternative`, url: `${SITE_ORIGIN}${path}` },
  ]);

  return (
    <MarketingLayout>
      <Seo
        title={seoTitle}
        description={seoDescription}
        canonicalPath={path}
        keywords={seoKeywords}
        ogType={seoOgType}
      />
      <JsonLd data={breadcrumb} />
      <JsonLd data={faqSchema(faqs)} />

      {/* ============================== Hero ============================== */}
      <SignalSection variant="glow" width={1000}>
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-2 text-[13px] text-signal-muted">
            <li>
              <Link to="/" className="text-signal-muted transition-colors hover:text-signal-green">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-signal-sub">Compare</li>
            <li aria-hidden="true">/</li>
            <li className="text-signal-sub">{them} alternative</li>
          </ol>
        </nav>

        <Eyebrow pill>{them} alternative</Eyebrow>

        <SectionTitle as="h1" className="mt-6 max-w-[840px]">
          ComplyEasyAI vs {them}: the best {them} alternative
        </SectionTitle>

        <p className="mt-6 max-w-[720px] text-lg leading-relaxed text-signal-sub md:text-[19px]">
          {intro}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3.5">
          <PrimaryCta to="/signup">
            Start free
            <ArrowRight size={17} aria-hidden="true" />
          </PrimaryCta>
          <OutlineCta href="#comparison">See the comparison</OutlineCta>
        </div>
      </SignalSection>

      {/* ======================= Comparison table ======================== */}
      <SignalSection variant="plain" width={1000} id="comparison">
        <div className="mx-auto max-w-[760px] text-center">
          <SectionTitle>ComplyEasyAI and {them}, feature by feature</SectionTitle>
          <p className="mt-3 text-base text-signal-sub">
            A fair, capability-focused comparison. Where {them} leads, we say so.
          </p>
        </div>

        <div className="mt-8 overflow-hidden rounded-[20px] border border-white/[0.08] bg-white/[0.02]">
          <div className="overflow-x-auto">
            <div role="table" aria-label={`ComplyEasyAI vs ${them} feature comparison`} className="min-w-[640px]">
              {/* Header row: neutral / green (us) / neutral (them) */}
              <div role="row" className="grid grid-cols-[1.4fr_1fr_1fr]">
                <div
                  role="columnheader"
                  className="flex items-end px-6 py-[18px] font-mono text-[11px] uppercase tracking-[0.1em] text-signal-muted"
                >
                  Capability
                </div>
                <div
                  role="columnheader"
                  className="border-x border-[rgba(56,232,166,0.22)] bg-[rgba(56,232,166,0.09)] px-6 py-[18px]"
                >
                  <span className="font-display text-base font-bold text-signal-green">ComplyEasyAI</span>
                </div>
                <div role="columnheader" className="px-6 py-[18px]">
                  <span className="font-display text-base font-bold text-signal-ink">{them}</span>
                </div>
              </div>

              {rows.map((row) => (
                <div
                  key={row.feature}
                  role="row"
                  className="grid grid-cols-[1.4fr_1fr_1fr] border-t border-white/[0.06]"
                >
                  <div role="cell" className="flex items-center px-6 py-[18px] text-sm font-medium text-signal-body">
                    {row.feature}
                  </div>
                  <div
                    role="cell"
                    className="flex items-center gap-2 border-x border-[rgba(56,232,166,0.16)] bg-[rgba(56,232,166,0.06)] px-6 py-[18px] text-sm font-medium text-signal-ink"
                  >
                    <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-signal-green" />
                    {row.us}
                  </div>
                  <div role="cell" className="flex items-center px-6 py-[18px] text-sm text-signal-sub">
                    {row.them}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="mx-auto mt-4 max-w-[720px] text-center text-xs text-signal-muted">
          Reflects publicly reported capabilities as of 2026, for evaluation purposes. &ldquo;Varies&rdquo;
          means the value depends on the {them} plan or is not publicly fixed.
        </p>
      </SignalSection>

      {/* ==================== Why teams choose us ======================== */}
      <SignalSection variant="glow" width={1000}>
        <div className="text-center">
          <SectionTitle>Why teams choose ComplyEasyAI</SectionTitle>
        </div>
        <ul className="mt-9 grid list-none gap-4 sm:grid-cols-2">
          {whyChoose.map((reason) => (
            <li key={reason}>
              <SignalCard className="flex h-full items-start gap-3.5">
                <span
                  aria-hidden="true"
                  className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[rgba(56,232,166,0.14)] text-signal-green"
                >
                  <Check size={16} />
                </span>
                <p className="text-[15px] leading-relaxed text-signal-body">{reason}</p>
              </SignalCard>
            </li>
          ))}
        </ul>
      </SignalSection>

      {/* ==================== When {them} might fit ====================== */}
      {/* Honest section crediting the competitor — an intentional credibility device. */}
      <SignalSection variant="plain" width={1000}>
        <SignalCard padding="lg" className="mx-auto max-w-[800px]">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.06] text-signal-sub"
            >
              <Scale size={19} />
            </span>
            <h2 className="font-display text-2xl font-bold tracking-[-0.01em] text-signal-ink">
              When {them} might fit
            </h2>
          </div>
          <p className="mt-4 text-base leading-[1.65] text-signal-sub">{whenFit}</p>
        </SignalCard>
      </SignalSection>

      {/* ============================== FAQ ============================== */}
      <SignalSection variant="glow" width={1000}>
        <div className="mx-auto max-w-[820px]">
          <div className="text-center">
            <SectionTitle>Frequently asked questions</SectionTitle>
          </div>
          <div className="mt-9 flex flex-col gap-3">
            {faqs.map((faq) => (
              <SignalFaq key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </SignalSection>

      {/* ========================== Closing CTA ========================== */}
      <SignalSection variant="tight" width={1000} className="text-center">
        <SectionTitle>Evaluate ComplyEasyAI for yourself.</SectionTitle>
        <p className="mx-auto mt-4 max-w-[560px] text-lg text-signal-sub">
          See AI-native compliance handle your frameworks in one platform.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
          <PrimaryCta to="/demo">
            Book a demo
            <ArrowRight size={17} aria-hidden="true" />
          </PrimaryCta>
          <OutlineCta to="/pricing">View pricing</OutlineCta>
        </div>
      </SignalSection>
    </MarketingLayout>
  );
};

export default SignalCompetitorPage;
export { SignalCompetitorPage };
