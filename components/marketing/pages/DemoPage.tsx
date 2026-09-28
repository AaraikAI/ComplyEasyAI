import React from 'react';
import MarketingLayout from '../MarketingLayout';
import Seo from '../../seo/Seo';
import JsonLd from '../../seo/JsonLd';
import { SITE_ORIGIN } from '../../seo/siteOrigin';
import { breadcrumbSchema, faqSchema } from '../../seo/siteSchema';
import { Eyebrow, SectionTitle, SignalFaq } from '../signal';
import { TldrList } from '../answerFirst';
import DemoBookingForm from '../../DemoBookingForm';

// ---------------------------------------------------------------------------
// SEO copy
// ---------------------------------------------------------------------------
const SEO_TITLE = 'Book a ComplyEasyAI Demo (30 Minutes)';
const SEO_DESCRIPTION =
  'Book a 30-minute ComplyEasyAI demo tailored to your frameworks, or request a trial. See evidence collection, control monitoring and remediation live, with a pricing and ROI estimate for your team.';
const SEO_KEYWORDS =
  'compliance automation demo, ComplyEasyAI demo, ComplyEasyAI trial, SOC 2 automation demo, compliance software walkthrough, GRC platform demo, book a compliance demo';

// Left-column TL;DR (the proof points from the Signal design handoff).
const DEMO_TLDR = [
  'Tailored to your framework mix, not a canned deck.',
  'A live look at evidence collection, drift detection and safe remediation.',
  'A tailored pricing and ROI estimate for your team.',
  'Want to try it yourself? The same form requests a trial.',
];

/** Demo questions (rendered and emitted as FAQPage structured data). */
const DEMO_FAQ: { q: string; a: string }[] = [
  {
    q: 'What happens in the demo?',
    a: 'We confirm your frameworks and timeline, map them to your stack, and walk through evidence collection, control monitoring, the Compliance Digital Twin and safe remediation. You get a tailored pricing and ROI estimate afterwards.',
  },
  {
    q: 'Do I need to connect my systems first?',
    a: "No. You don't need to connect anything before the call. Integrations are read-only for evidence collection and can be connected later in your own workspace.",
  },
  {
    q: 'Can I try ComplyEasyAI myself?',
    a: 'Yes, on request. Submit this form and we will set up a trial with you, agreeing its scope and length for your team.',
  },
];

const DemoPage: React.FC = () => {
  return (
    <MarketingLayout>
      <Seo
        title={SEO_TITLE}
        description={SEO_DESCRIPTION}
        canonicalPath="/demo"
        keywords={SEO_KEYWORDS}
      />
      <JsonLd data={faqSchema(DEMO_FAQ)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: `${SITE_ORIGIN}/` },
          { name: 'Book a demo', url: `${SITE_ORIGIN}/demo` },
        ])}
      />

      <section className="bg-signal-glow px-6 pb-20 pt-10 md:px-10">
        <div className="mx-auto grid max-w-[1140px] items-start gap-10 md:grid-cols-[0.9fr_1.1fr]">
          {/* ===================== Left — value prop ===================== */}
          <div className="pt-5">
            <Eyebrow className="mb-3.5">Book a demo</Eyebrow>
            <h1 className="font-display text-[36px] font-bold leading-[1.05] tracking-[-0.03em] text-signal-ink md:text-[44px]">
              Book a 30-minute
              <br />
              ComplyEasyAI demo.
            </h1>
            <p className="mt-[18px] max-w-[440px] text-[17px] leading-relaxed text-signal-sub">
              See compliance run itself on your own stack and framework mix, or request a trial.
            </p>
            <p className="mt-4 max-w-[440px] text-[15px] leading-relaxed text-signal-body">
              In a 30-minute ComplyEasyAI demo we map your frameworks, walk through your stack, and
              show evidence collection, drift detection and safe remediation live. You get a tailored
              pricing and ROI estimate for your team. Fill in the form with your company and
              framework goals to request a time.
            </p>
            <TldrList items={DEMO_TLDR} className="mt-[30px] max-w-[440px]" />
            <div className="mt-[34px] border-t border-white/[0.08] pt-6 font-mono text-[11px] tracking-[0.12em] text-signal-muted">
              TYPICALLY RESPONDS WITHIN 24 HOURS
            </div>
          </div>

          {/* ===================== Right — booking form ===================== */}
          <DemoBookingForm variant="inline" source="demo_page" />
        </div>
      </section>

      <section className="bg-signal-canvas px-6 pb-20 md:px-10">
        <div className="mx-auto max-w-[820px]">
          <div className="mb-8 text-center">
            <Eyebrow className="mb-3">Questions</Eyebrow>
            <SectionTitle>Demo FAQ</SectionTitle>
          </div>
          <div className="flex flex-col gap-3">
            {DEMO_FAQ.map((item) => (
              <SignalFaq key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default DemoPage;
export { DemoPage };
