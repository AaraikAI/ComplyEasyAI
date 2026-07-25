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
import {
  softwareApplicationSchema,
  breadcrumbSchema,
  faqSchema,
} from '../../seo/siteSchema';
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
import {
  FRAMEWORK_PILLARS,
  PILLAR_CAPABILITIES,
  PILLAR_HOW_IT_WORKS,
  relatedPillars,
} from '../../../data/frameworkPillarContent';

const SITE_ORIGIN = 'https://complyeasyai.com';

/** Icons paired by position with the six shared PILLAR_CAPABILITIES cards. */
const CAPABILITY_ICONS = [Network, FileCheck, RefreshCw, Gauge, Layers, ClipboardCheck];

export interface SignalFrameworkPillarProps {
  /** Key into FRAMEWORK_PILLARS (e.g. 'soc-2', 'gdpr'). */
  slug: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
}

/**
 * Shared "Signal" framework pillar template. Renders every marketing framework
 * page from data/frameworkPillarContent.ts: hero (breadcrumb, category
 * eyebrow, h1, definition) → key requirements → how it works → capabilities →
 * related frameworks → FAQ → closing CTA. Dark-only by design: explicit
 * signal-* classes on the near-black canvas, independent of the app theme.
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
      <JsonLd data={softwareApplicationSchema()} />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: `${SITE_ORIGIN}/` },
          { name: 'Frameworks', url: `${SITE_ORIGIN}/frameworks` },
          { name: content.name, url: pageUrl },
        ])}
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
            {content.name} compliance,
            <span className="block">{content.tagline}</span>
          </SectionTitle>

          <p className="mt-6 max-w-[720px] text-lg leading-relaxed text-signal-sub md:text-[19px]">
            {content.definition}
          </p>

          <div className="mt-8 flex flex-col gap-3.5 sm:flex-row">
            <PrimaryCta to="/demo">
              Book a demo
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </PrimaryCta>
            <OutlineCta to="/signup">Start free trial</OutlineCta>
          </div>
        </SignalSection>

        {/* ======================= Key requirements ===================== */}
        <SignalSection variant="plain" width={1000}>
          <Eyebrow>Key requirements</Eyebrow>
          <SectionTitle className="mt-3.5">What {content.name} asks of you</SectionTitle>
          <p className="mt-3 max-w-[620px] text-base leading-relaxed text-signal-sub">
            The requirements below define {content.name}. ComplyEasyAI maps your environment to
            each one.
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

        {/* ========================= How it works ======================= */}
        <SignalSection variant="glow" width={1000}>
          <Eyebrow>How it works</Eyebrow>
          <SectionTitle className="mt-3.5">From scoping to a clean report</SectionTitle>
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
            Automate the work that doesn&rsquo;t need a human
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
          <SectionTitle className="mt-3.5">Map once, reuse across programs</SectionTitle>
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
              <SectionTitle className="mt-3">{content.name} questions, answered</SectionTitle>
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
