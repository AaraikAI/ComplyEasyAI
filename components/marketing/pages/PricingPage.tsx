import React, { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import MarketingLayout from '../MarketingLayout';
import Seo from '../../seo/Seo';
import JsonLd from '../../seo/JsonLd';
import { breadcrumbSchema, faqSchema } from '../../seo/siteSchema';
import {
  SignalPage,
  SignalSection,
  Eyebrow,
  SectionTitle,
  PrimaryCta,
  OutlineCta,
  SignalFaq,
} from '../signal';

// ---------------------------------------------------------------------------
// SEO copy
// ---------------------------------------------------------------------------
const SEO_TITLE = 'Pricing — ComplyEasyAI';
const SEO_DESCRIPTION =
  "Enterprise-grade compliance at a fraction of a four-to-six tool stack. Pick the tier that fits — we'll tailor an exact number to your frameworks.";
const SEO_KEYWORDS =
  'ComplyEasyAI pricing, compliance automation pricing, compliance platform tiers, SOC 2 automation pricing, GRC platform cost';

// ---------------------------------------------------------------------------
// Pricing content — copy transcribed verbatim from the Signal design handoff.
// Tier names and framework counts align with constants/tierFeatures.ts and
// constants/tierLimits.ts (3 / 10 / 50 / unlimited frameworks).
// ---------------------------------------------------------------------------
type TierId = 'Foundation' | 'Essentials' | 'Growth' | 'Visionary';

interface CompanySize {
  key: string;
  label: string;
  tier: TierId;
}

const COMPANY_SIZES: CompanySize[] = [
  { key: 'Startup', label: 'Startup', tier: 'Foundation' },
  { key: 'Scale-up', label: 'Scale-up', tier: 'Essentials' },
  { key: 'Growth', label: 'Growth', tier: 'Growth' },
  { key: 'Enterprise', label: 'Enterprise', tier: 'Visionary' },
];

interface PricingTier {
  name: TierId;
  target: string;
  fw: string;
  users: string;
  note: string;
  highlights: string[];
}

const TIERS: PricingTier[] = [
  {
    name: 'Foundation',
    target: 'Pre-Series A · 10–50 people',
    fw: '3 frameworks',
    users: '10 users',
    note: '≈15% below comparable entry tiers',
    highlights: [
      'Core AI: policy generation + gap analysis',
      'Continuous control monitoring',
      'Incident, calendar & risk heat map',
      'Month-to-month after year one',
    ],
  },
  {
    name: 'Essentials',
    target: 'Series A/B · 50–200 people',
    fw: '10 frameworks',
    users: '100 users',
    note: 'Trust Center & VRM included — often paid extras elsewhere',
    highlights: [
      'Full 6-tool AI suite',
      'Vendor risk management + Trust Center',
      'Governance & breach management',
      'Maturity, BIA & cost analytics',
    ],
  },
  {
    name: 'Growth',
    target: 'Series C+ · 200–1,000 people',
    fw: '50 frameworks',
    users: '1,000 users',
    note: 'The only platform with a Compliance Digital Twin',
    highlights: [
      'Complete aCOS: Digital Twin + auto-remediation',
      'Predictive analytics & forecasting',
      'Executive dashboards & report builder',
      'SSO/SAML, custom roles & workflows',
    ],
  },
  {
    name: 'Visionary',
    target: '1,000+ · critical infrastructure',
    fw: 'Unlimited frameworks',
    users: 'Unlimited users',
    note: 'Complete cryptographic & EU regulatory suite',
    highlights: [
      'Full EU stack — AI Act, DORA, DMA & DSA',
      'Zero-knowledge proofs & crypto suite',
      'SCIM provisioning & white-labeling',
      'On-premises option',
    ],
  },
];

/** Feature-table rows: label + availability per tier, in TIERS order. */
const FEATURE_MATRIX: { label: string; tiers: [boolean, boolean, boolean, boolean] }[] = [
  { label: 'Continuous control monitoring', tiers: [true, true, true, true] },
  { label: 'Full AI suite (6 tools)', tiers: [false, true, true, true] },
  { label: 'Vendor risk + Trust Center', tiers: [false, true, true, true] },
  { label: 'Governance & breach management', tiers: [false, true, true, true] },
  { label: 'aCOS: Digital Twin + auto-remediation', tiers: [false, false, true, true] },
  { label: 'Predictive analytics & forecasting', tiers: [false, false, true, true] },
  { label: 'SSO/SAML & custom roles', tiers: [false, false, true, true] },
  { label: 'Full EU stack (AI Act · DORA · DMA · DSA)', tiers: [false, false, false, true] },
  { label: 'Zero-knowledge proofs & crypto suite', tiers: [false, false, false, true] },
  { label: 'SCIM provisioning & white-labeling', tiers: [false, false, false, true] },
];

const EVERY_PLAN_INCLUDES = [
  'Immutable audit trail',
  'Encryption at rest & in transit',
  '6-language support',
  'WCAG 2.1 AA',
  'PWA & offline',
];

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "Why don't you list exact prices?",
    a: 'Your number depends on which frameworks you pursue and your team size. A 30-minute call gets you an exact, tailored quote — positioned well below comparable competitor tiers.',
  },
  {
    q: 'Are there hidden implementation or renewal fees?',
    a: "No. One platform price covers the tier's frameworks and users, with no per-framework add-ons or surprise renewal step-ups.",
  },
  {
    q: 'Can I pursue multiple frameworks at once?',
    a: 'Yes — shared controls are mapped once and reused across frameworks, so pursuing SOC 2 with ISO 27001 and GDPR shares evidence rather than multiplying the work.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Yes — a free trial with no credit card required. Design-partner arrangements are also available for teams willing to share feedback and a reference.',
  },
];

// ---------------------------------------------------------------------------
// Tier card
// ---------------------------------------------------------------------------
const TierCard: React.FC<{ tier: PricingTier; recommended: boolean }> = ({ tier, recommended }) => (
  <div
    className={`relative flex flex-col rounded-[20px] border p-7 ${
      recommended ? 'border-signal-green bg-signal-green/[0.06]' : 'border-white/[0.09] bg-white/[0.02]'
    }`}
  >
    {recommended && (
      <span className="absolute -top-[11px] left-7 inline-flex items-center gap-1.5 rounded-full bg-signal-green px-3 py-[5px] font-mono text-[11px] font-bold tracking-[0.04em] text-signal-canvas">
        RECOMMENDED
      </span>
    )}
    <h3
      className={`font-display text-2xl font-bold ${
        recommended ? 'text-signal-green' : 'text-signal-ink'
      }`}
    >
      {tier.name}
    </h3>
    <div className="mt-1.5 min-h-[34px] text-[13px] text-[#8A94A6]">{tier.target}</div>
    <div className="my-[18px] flex items-center gap-3.5 border-y border-white/[0.08] py-3.5">
      <span className="font-display text-[15px] font-bold text-signal-ink">{tier.fw}</span>
      <span aria-hidden="true" className="text-[#3a4453]">
        ·
      </span>
      <span className="font-display text-[15px] font-bold text-signal-ink">{tier.users}</span>
    </div>
    <ul className="flex flex-1 flex-col gap-[11px]">
      {tier.highlights.map((highlight) => (
        <li
          key={highlight}
          className="flex items-start gap-2.5 text-[13.5px] leading-[1.45] text-signal-body"
        >
          <Check
            className="mt-0.5 h-3.5 w-3.5 flex-none text-signal-green"
            strokeWidth={3}
            aria-hidden="true"
          />
          <span>{highlight}</span>
        </li>
      ))}
    </ul>
    <div className="mt-[18px] min-h-[32px] text-[11.5px] leading-[1.45] text-signal-green">
      {tier.note}
    </div>
    {recommended ? (
      <PrimaryCta to="/demo" className="mt-4 w-full">
        Talk to us
      </PrimaryCta>
    ) : (
      <OutlineCta to="/demo" className="mt-4 w-full">
        Talk to us
      </OutlineCta>
    )}
  </div>
);

// ---------------------------------------------------------------------------
// Feature comparison cell
// ---------------------------------------------------------------------------
const FeatureCell: React.FC<{ included: boolean }> = ({ included }) => (
  <div className="flex items-center justify-center px-2 py-[15px]">
    <span
      aria-hidden="true"
      className={`text-[17px] ${included ? 'text-signal-good' : 'text-[#4b5568]'}`}
    >
      {included ? '●' : '–'}
    </span>
    <span className="sr-only">{included ? 'Included' : 'Not included'}</span>
  </div>
);

/**
 * Public marketing pricing page ("Signal" design, dark-only). Numbers are
 * intentionally absent — every tier CTA routes to the demo booking flow.
 */
const PricingPage: React.FC = () => {
  const [size, setSize] = useState<string>('Scale-up');
  const recommendedTier: TierId =
    COMPANY_SIZES.find((s) => s.key === size)?.tier ?? 'Essentials';

  return (
    <MarketingLayout>
      <Seo
        title={SEO_TITLE}
        description={SEO_DESCRIPTION}
        canonicalPath="/pricing"
        keywords={SEO_KEYWORDS}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: 'https://complyeasyai.com/' },
          { name: 'Pricing', url: 'https://complyeasyai.com/pricing' },
        ])}
      />
      <JsonLd data={faqSchema(FAQ_ITEMS)} />

      <SignalPage>
        {/* ============================== Hero ============================== */}
        <section className="relative overflow-hidden bg-signal-glow-tight px-6 pb-[30px] pt-[60px] text-center md:px-10">
          <Eyebrow className="mb-3.5">Pricing</Eyebrow>
          <SectionTitle as="h1">
            Pricing that pays
            <br />
            for itself.
          </SectionTitle>
          <p className="mx-auto mt-5 max-w-[620px] text-lg leading-relaxed text-signal-sub">
            Enterprise-grade compliance at a fraction of a four-to-six tool stack. Pick the tier
            that fits — we'll tailor an exact number to your frameworks.
          </p>
          <div className="mt-[30px] font-mono text-[13px] uppercase tracking-[0.1em] text-signal-muted">
            See what fits your stage
          </div>
          <div
            role="group"
            aria-label="Company size"
            className="mt-3 inline-flex max-w-full flex-wrap justify-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] p-1.5"
          >
            {COMPANY_SIZES.map((s) => {
              const active = s.key === size;
              return (
                <button
                  key={s.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSize(s.key)}
                  className={`whitespace-nowrap rounded-full px-5 py-2 font-plex text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-signal-green text-signal-canvas'
                      : 'text-signal-sub hover:text-signal-ink'
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* ============================ Tier cards ========================== */}
        <section className="bg-signal-canvas px-6 pb-5 pt-7 md:px-10">
          <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-stretch gap-[18px] pt-3 md:grid-cols-2 xl:grid-cols-4">
            {TIERS.map((tier) => (
              <TierCard key={tier.name} tier={tier} recommended={tier.name === recommendedTier} />
            ))}
          </div>
          <p className="mt-5 text-center text-xs text-signal-muted">
            Pricing is positioned ≈10–15% below comparable Vanta and Drata tiers. Exact figures
            shared on a short call.
          </p>
        </section>

        {/* ========================= Compare tiers ========================== */}
        <SignalSection variant="glow" width={1000}>
          <div className="mb-9 text-center">
            <Eyebrow className="mb-3">Compare tiers</Eyebrow>
            <SectionTitle>What's included, tier by tier</SectionTitle>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[680px] overflow-hidden rounded-[20px] border border-white/[0.08] bg-white/[0.02]">
              <div className="grid grid-cols-[2fr_repeat(4,1fr)]">
                <div className="flex items-end px-5 py-[18px] font-mono text-[11px] uppercase tracking-[0.1em] text-signal-muted">
                  Capability
                </div>
                {TIERS.map((tier) => (
                  <div
                    key={tier.name}
                    className={`px-2 py-4 text-center font-display text-[13px] font-semibold ${
                      tier.name === 'Visionary' ? 'text-signal-green' : 'text-signal-body'
                    }`}
                  >
                    {tier.name}
                  </div>
                ))}
              </div>
              {FEATURE_MATRIX.map((row) => (
                <div
                  key={row.label}
                  className="grid grid-cols-[2fr_repeat(4,1fr)] border-t border-white/[0.05]"
                >
                  <div className="flex items-center px-5 py-[15px] text-sm font-medium text-signal-body">
                    {row.label}
                  </div>
                  {row.tiers.map((included, index) => (
                    <FeatureCell key={TIERS[index].name} included={included} />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-[22px] flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-5">
            <span className="font-mono text-[13px] text-[#8A94A6]">Every plan includes:</span>
            {EVERY_PLAN_INCLUDES.map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5 text-[13px] text-signal-body">
                <Check className="h-3.5 w-3.5 text-signal-green" strokeWidth={3} aria-hidden="true" />
                {item}
              </span>
            ))}
          </div>
        </SignalSection>

        {/* ============================== FAQ =============================== */}
        <SignalSection variant="plain" width={1000}>
          <div className="mx-auto max-w-[820px]">
            <div className="mb-8 text-center">
              <Eyebrow className="mb-3">Questions</Eyebrow>
              <SectionTitle>Pricing FAQ</SectionTitle>
            </div>
            <div className="flex flex-col gap-3">
              {FAQ_ITEMS.map((item) => (
                <SignalFaq key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        </SignalSection>

        {/* =========================== Closing CTA ========================== */}
        <SignalSection variant="tight" className="text-center">
          <SectionTitle>Get your tailored number.</SectionTitle>
          <p className="mt-4 text-lg text-signal-sub">
            A 30-minute demo, tailored to your frameworks.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
            <PrimaryCta to="/demo">
              Book a demo
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </PrimaryCta>
            <OutlineCta to="/demo">Talk to sales</OutlineCta>
          </div>
        </SignalSection>
      </SignalPage>
    </MarketingLayout>
  );
};

export default PricingPage;
export { PricingPage };
