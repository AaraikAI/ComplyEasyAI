import React, { useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Diamond } from 'lucide-react';
import MarketingLayout from '../MarketingLayout';
import Seo from '../../seo/Seo';
import JsonLd from '../../seo/JsonLd';
import { breadcrumbSchema } from '../../seo/siteSchema';
import type { SignalCategory } from '../signal';
import {
  Eyebrow,
  OutlineCta,
  PrimaryCta,
  SIGNAL_CATEGORIES,
  SectionTitle,
  SignalCard,
  SignalPage,
  SignalSection,
} from '../signal';
import { FRAMEWORK_PILLARS } from '../../../data/frameworkPillarContent';

// ---------------------------------------------------------------------------
// SEO copy
// ---------------------------------------------------------------------------
const SEO_TITLE =
  'Compliance Frameworks: SOC 2, ISO 27001, GDPR, HIPAA, EU AI Act & More | ComplyEasy AI';
const SEO_DESCRIPTION =
  'Explore the 14 compliance frameworks ComplyEasyAI keeps continuously audit-ready — security, privacy, AI governance and the full EU digital stack — mapped once, with shared controls and evidence reused across every framework.';
const SEO_KEYWORDS =
  'compliance frameworks, SOC 2, ISO 27001, NIST CSF, PCI DSS, GDPR, HIPAA, CCPA, EU AI Act, NIST AI RMF, ISO 42001, DORA, DMA, DSA, CSRD, compliance automation';

// ---------------------------------------------------------------------------
// Index data — the 14 pillar pages, in catalog order
// ---------------------------------------------------------------------------
const FRAMEWORKS = Object.values(FRAMEWORK_PILLARS);

/** One-line index-card blurbs per pillar slug (design copy). */
const FRAMEWORK_BLURBS: Record<string, string> = {
  'soc-2': 'Type I & II readiness with continuous control monitoring.',
  'iso-27001': 'Annex A control mapping and Statement of Applicability support.',
  'nist-csf': 'Identify, Protect, Detect, Respond and Recover coverage.',
  'pci-dss': 'Cardholder-data controls with compensating-control worksheets.',
  gdpr: 'RoPA, DPIAs and data-subject request workflows.',
  hipaa: 'Administrative, physical and technical safeguard tracking.',
  ccpa: 'US state privacy obligations and consumer-rights handling.',
  'eu-ai-act': 'Risk classification, technical documentation and transparency.',
  'nist-ai-rmf': 'GOVERN, MAP, MEASURE and MANAGE for AI systems.',
  'iso-42001': 'AI management system certification support.',
  dora: 'Operational-resilience controls for financial entities.',
  dma: 'Gatekeeper obligations and core platform services.',
  dsa: 'Content-moderation tracking and VLOP/VLOSE controls.',
  csrd: 'Sustainability reporting for in-scope groups.',
};

const CATEGORY_FILTERS = ['All', 'Security', 'Privacy', 'AI Governance', 'EU Digital'] as const;
type CategoryFilter = (typeof CATEGORY_FILTERS)[number];

// ---------------------------------------------------------------------------
// "Map once. Reuse everywhere." section data
// ---------------------------------------------------------------------------
const EVIDENCE_MAPPINGS = ['SOC 2 · CC6.1', 'ISO 27001 · A.9', 'GDPR · Art. 32', 'HIPAA · §164.312'];

const MULTIPLIER_POINTS: { glyph: string; title: string; desc: string }[] = [
  {
    glyph: '1×',
    title: 'Connect your stack once',
    desc: 'Read-only integrations feed evidence continuously — no repeated screenshotting per framework.',
  },
  {
    glyph: '∞',
    title: 'Add frameworks with less effort each time',
    desc: 'Overlapping controls are already satisfied, so each new certification mostly reuses existing evidence.',
  },
  {
    glyph: '↺',
    title: 'Stay current automatically',
    desc: 'When a regulation changes, the affected controls update — across every framework that shares them.',
  },
];

/**
 * Marketing index of all 14 framework pillar pages ("Signal" design): hero,
 * category-filterable card grid linking to each pillar, the shared-evidence
 * multiplier story, and a closing demo CTA.
 */
const FrameworksIndexPage: React.FC = () => {
  const [category, setCategory] = useState<CategoryFilter>('All');
  const visibleFrameworks =
    category === 'All'
      ? FRAMEWORKS
      : FRAMEWORKS.filter((framework) => framework.category === category);

  return (
    <MarketingLayout>
      <Seo
        title={SEO_TITLE}
        description={SEO_DESCRIPTION}
        canonicalPath="/frameworks"
        keywords={SEO_KEYWORDS}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: 'https://complyeasyai.com/' },
          { name: 'Frameworks', url: 'https://complyeasyai.com/frameworks' },
        ])}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Compliance frameworks supported by ComplyEasy AI',
          itemListElement: FRAMEWORKS.map((framework, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: framework.name,
            url: `https://complyeasyai.com${framework.path}`,
          })),
        }}
      />

      <SignalPage>
        {/* ============================== Hero ============================== */}
        <section className="bg-signal-glow px-6 pb-10 pt-14 text-center md:px-10 md:pt-[60px]">
          <div className="mb-3.5">
            <Eyebrow>Frameworks</Eyebrow>
          </div>
          <SectionTitle as="h1">
            Every framework.
            <br />
            One platform.
          </SectionTitle>
          <p className="mx-auto mt-5 max-w-[640px] text-lg leading-relaxed text-signal-sub">
            Security, privacy, AI governance and the full EU digital stack — 14 frameworks, mapped
            once and kept continuously audit-ready.
          </p>
        </section>

        {/* ================= Category filter + framework grid =============== */}
        <section className="bg-signal-canvas px-6 pb-16 pt-5 md:px-10 md:pb-20">
          <div className="mx-auto max-w-[1200px]">
            <div className="mb-9 flex flex-wrap justify-center gap-2.5">
              {CATEGORY_FILTERS.map((filter) => {
                const isActive = category === filter;
                return (
                  <button
                    key={filter}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setCategory(filter)}
                    className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors ${
                      isActive
                        ? 'border-signal-green bg-signal-green text-signal-canvas'
                        : 'border-white/[0.14] bg-white/[0.04] text-signal-sub hover:text-signal-ink'
                    }`}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>
            <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
              {visibleFrameworks.map((framework) => {
                const accent = SIGNAL_CATEGORIES[framework.category as SignalCategory];
                return (
                  <SignalCard
                    key={framework.slug}
                    padding="lg"
                    className="flex flex-col transition-colors hover:border-white/[0.16]"
                  >
                    <div className="mb-4 flex items-center gap-2">
                      <span
                        className="h-2 w-2 flex-none rounded-full"
                        style={{ backgroundColor: accent.color }}
                        aria-hidden="true"
                      />
                      <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-signal-sub">
                        {framework.category}
                      </span>
                    </div>
                    <h3 className="mb-2.5 font-display text-[22px] font-bold text-signal-ink">
                      {framework.name}
                    </h3>
                    <p className="flex-1 text-sm leading-relaxed text-signal-sub">
                      {FRAMEWORK_BLURBS[framework.slug] ?? framework.tagline}
                    </p>
                    <Link
                      to={framework.path}
                      aria-label={`Explore ${framework.name} compliance`}
                      className="mt-[18px] inline-flex items-center gap-1.5 text-sm font-semibold text-signal-green transition-opacity hover:opacity-85"
                    >
                      Explore
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </SignalCard>
                );
              })}
            </div>
          </div>
        </section>

        {/* ========================== The multiplier ======================== */}
        <SignalSection variant="glow" width={1100}>
          <div className="mb-12 text-center">
            <div className="mb-3.5">
              <Eyebrow>The multiplier</Eyebrow>
            </div>
            <SectionTitle>Map once. Reuse everywhere.</SectionTitle>
            <p className="mx-auto mt-3.5 max-w-[640px] text-base leading-relaxed text-signal-sub">
              Most frameworks share the majority of their controls. ComplyEasyAI maps shared controls
              a single time, so each new framework mostly reuses evidence you already have.
            </p>
          </div>
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
            <SignalCard padding="lg">
              <p className="mb-5 font-mono text-xs text-signal-green">ONE EVIDENCE LAYER</p>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 rounded-xl border border-signal-green/25 bg-signal-green/[0.08] px-4 py-4">
                  <Diamond className="h-4 w-4 flex-none text-signal-green" aria-hidden="true" />
                  <span className="text-[15px] font-semibold text-signal-ink">
                    Your connected evidence
                  </span>
                </div>
                <div className="flex justify-center font-mono text-[13px] text-signal-muted">
                  maps to ↓
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {EVIDENCE_MAPPINGS.map((mapping) => (
                    <div
                      key={mapping}
                      className="rounded-[10px] border border-white/10 bg-white/[0.04] px-3.5 py-3 text-[13px] text-signal-body"
                    >
                      {mapping}
                    </div>
                  ))}
                </div>
              </div>
            </SignalCard>
            <div className="flex flex-col gap-5">
              {MULTIPLIER_POINTS.map((point) => (
                <div key={point.title} className="flex items-start gap-4">
                  <div
                    className="w-10 flex-none font-display text-3xl font-bold text-signal-green"
                    aria-hidden="true"
                  >
                    {point.glyph}
                  </div>
                  <div>
                    <div className="mb-1 text-base font-semibold text-signal-ink">{point.title}</div>
                    <div className="text-sm leading-relaxed text-signal-sub">{point.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SignalSection>

        {/* ============================ Closing CTA ========================= */}
        <SignalSection variant="tight" className="text-center">
          <h2 className="font-display text-4xl font-bold tracking-[-0.03em] text-signal-ink md:text-[46px]">
            Which frameworks are you chasing?
          </h2>
          <p className="mt-4 text-lg text-signal-sub">
            We’ll map them in one platform. Book a 30-minute walkthrough.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3.5 sm:flex-row">
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

export default FrameworksIndexPage;
export { FrameworksIndexPage };
