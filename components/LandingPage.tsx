import React, { useState } from 'react';
import { Link } from 'react-router';
import MarketingLayout from './marketing/MarketingLayout';
import {
  SignalPage,
  SignalSection,
  Eyebrow,
  SectionTitle,
  SignalCard,
  PrimaryCta,
  OutlineCta,
} from './marketing/signal';
import Seo from './seo/Seo';
import JsonLd from './seo/JsonLd';
import {
  organizationSchema,
  softwareApplicationSchema,
  breadcrumbSchema,
} from './seo/siteSchema';
import { FRAMEWORK_PILLAR_COUNT } from '../data/frameworkPillarContent';

// ---------------------------------------------------------------------------
// SEO copy
// ---------------------------------------------------------------------------
const SEO_TITLE =
  'AI Compliance Automation for SOC 2, ISO 27001, GDPR & the EU AI Act | ComplyEasy AI';
const SEO_DESCRIPTION =
  'ComplyEasy AI automates evidence collection, control mapping, and audit preparation with autonomous AI agents — helping teams achieve readiness for SOC 2, ISO 27001, GDPR, HIPAA, and the EU AI Act.';
const SEO_KEYWORDS =
  'AI compliance software, compliance automation, SOC 2 automation, ISO 27001 software, GDPR compliance, EU AI Act compliance tool, NIST AI RMF software, GRC software, continuous compliance monitoring';

// ---------------------------------------------------------------------------
// Section anchors + shared scroll behavior
// ---------------------------------------------------------------------------
const PLATFORM_SECTION_ID = 'platform';

const scrollToPlatform = () => {
  document.getElementById(PLATFORM_SECTION_ID)?.scrollIntoView({ behavior: 'smooth' });
};

// ---------------------------------------------------------------------------
// Hero content
// ---------------------------------------------------------------------------
const HERO_FRAMEWORK_CHIPS = ['SOC 2', 'ISO 27001', 'GDPR', 'HIPAA', 'EU AI Act', 'DORA'];

interface StatusBar {
  label: string;
  status: string;
  statusColor: string;
  width: string;
  fill: string;
}

const STATUS_BARS: StatusBar[] = [
  { label: 'Evidence sync', status: '●', statusColor: '#38E8A6', width: '100%', fill: '#38E8A6' },
  { label: 'Control drift', status: 'resolved', statusColor: '#38E8A6', width: '84%', fill: '#3AA0FF' },
  { label: 'Next audit gap', status: 'predicted', statusColor: '#E8B93A', width: '63%', fill: '#E8B93A' },
];

/** Live "aCOS · operating" status card with the readiness ring and pulse halo. */
const HeroStatusCard: React.FC = () => (
  <div className="relative flex h-[420px] items-center justify-center lg:h-[470px]">
    <div
      aria-hidden="true"
      className="absolute h-[330px] w-[330px] animate-pulse-ring rounded-full border border-signal-green/35"
    />
    <div
      aria-hidden="true"
      className="absolute h-[330px] w-[330px] animate-pulse-ring-delay rounded-full border border-signal-blue/30"
    />
    <div className="relative w-full max-w-[410px] rounded-[20px] border border-white/[0.09] bg-[rgba(16,22,34,0.92)] p-[22px] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.85)] backdrop-blur">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-[9px]">
          <span aria-hidden="true" className="h-2 w-2 animate-blink-dot rounded-full bg-signal-green" />
          <span className="font-mono text-[13px] text-signal-body">aCOS · operating</span>
        </div>
        <span className="rounded-[5px] bg-signal-green px-2 py-[3px] font-mono text-[10px] font-semibold tracking-[0.1em] text-signal-canvas">
          LIVE
        </span>
      </div>

      <div className="flex items-center gap-5">
        <div
          className="flex h-[118px] w-[118px] flex-none items-center justify-center rounded-full"
          style={{ background: 'conic-gradient(#38E8A6 0 92%, rgba(255,255,255,.08) 92% 100%)' }}
        >
          <div className="flex h-[90px] w-[90px] flex-col items-center justify-center rounded-full bg-[#101622]">
            <span className="font-display text-[26px] font-bold text-signal-ink">92%</span>
            <span className="font-mono text-[9px] tracking-[0.14em] text-[#8A94A6]">READY</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-[13px]">
          {STATUS_BARS.map((bar) => (
            <div key={bar.label}>
              <div className="mb-[5px] flex justify-between text-xs text-signal-sub">
                <span className="whitespace-nowrap">{bar.label}</span>
                <span style={{ color: bar.statusColor }}>{bar.status}</span>
              </div>
              <div className="h-[5px] rounded-full bg-white/[0.08]">
                <div
                  className="h-full rounded-full"
                  style={{ width: bar.width, backgroundColor: bar.fill }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-[18px] border-t border-white/[0.07] pt-4 font-mono text-[11px] text-signal-muted">
        {FRAMEWORK_PILLAR_COUNT} frameworks · 30+ integrations · agents on watch 24/7
      </div>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// "Three jobs" cards
// ---------------------------------------------------------------------------
type JobGlyph = 'ring' | 'outline' | 'solid';

const JOB_CARDS: { glyph: JobGlyph; title: string; body: string }[] = [
  {
    glyph: 'ring',
    title: 'Audit-ready, continuously',
    body: 'The evidence package is the same artifacts auditors pull from production. No final-quarter scramble.',
  },
  {
    glyph: 'outline',
    title: `One platform, ${FRAMEWORK_PILLAR_COUNT} frameworks`,
    body: 'Shared controls mapped once and reused across SOC 2, ISO 27001, GDPR, HIPAA and more.',
  },
  {
    glyph: 'solid',
    title: 'It runs itself',
    body: 'Autonomous agents collect, monitor and remediate — with you approving anything that matters.',
  },
];

const jobGlyphClass = (glyph: JobGlyph): string => {
  if (glyph === 'ring') return 'h-[17px] w-[17px] rounded-full border-[2.5px] border-signal-green';
  if (glyph === 'outline') return 'h-[17px] w-[17px] border-[2.5px] border-signal-green';
  return 'h-[17px] w-[17px] rounded-[4px] bg-signal-green';
};

// ---------------------------------------------------------------------------
// ROI calculator
// ---------------------------------------------------------------------------
const RANGE_STYLES = `
.signal-range{-webkit-appearance:none;appearance:none;height:6px;border-radius:999px;background:rgba(255,255,255,.14);outline:none}
.signal-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:22px;height:22px;border-radius:50%;background:#38E8A6;cursor:pointer;box-shadow:0 2px 10px rgba(56,232,166,.5);border:3px solid #0B1220}
.signal-range::-moz-range-thumb{width:22px;height:22px;border-radius:50%;background:#38E8A6;cursor:pointer;border:3px solid #0B1220}
.signal-range:focus-visible{box-shadow:0 0 0 3px rgba(56,232,166,.35)}
`;

interface RoiCalculatorProps {
  /** Share of evidence work automated, as a percentage. */
  automationPct: number;
  /** Annual cost of each point tool, in thousands of dollars. */
  toolCostK: number;
}

const RoiCalculator: React.FC<RoiCalculatorProps> = ({ automationPct, toolCostK }) => {
  const [team, setTeam] = useState(60);
  const [frameworksPursued, setFrameworksPursued] = useState(3);
  const [pointTools, setPointTools] = useState(5);

  const hoursPerMonth = Math.round((automationPct / 100) * (18 + team * 0.4 + frameworksPursued * 9));
  const hoursPerYear = hoursPerMonth * 12;
  const stackThousands = pointTools * toolCostK;

  const sliders = [
    { id: 'roi-team', label: 'Team size', value: team, min: 5, max: 500, step: 5, onChange: setTeam },
    {
      id: 'roi-frameworks',
      label: 'Frameworks pursued',
      value: frameworksPursued,
      min: 1,
      max: 14,
      step: 1,
      onChange: setFrameworksPursued,
    },
    { id: 'roi-tools', label: 'Point tools today', value: pointTools, min: 1, max: 8, step: 1, onChange: setPointTools },
  ];

  return (
    <>
      <style>{RANGE_STYLES}</style>
      <div className="grid grid-cols-1 gap-7 md:grid-cols-2">
        <div className="flex flex-col justify-center gap-[30px] rounded-[20px] border border-white/[0.08] bg-white/[0.035] p-6 sm:p-[34px]">
          {sliders.map((slider) => (
            <div key={slider.id}>
              <div className="mb-3 flex items-center justify-between">
                <label htmlFor={slider.id} className="text-[15px] font-semibold text-signal-ink">
                  {slider.label}
                </label>
                <span className="font-display text-xl font-bold text-signal-green">{slider.value}</span>
              </div>
              <input
                id={slider.id}
                type="range"
                min={slider.min}
                max={slider.max}
                step={slider.step}
                value={slider.value}
                onChange={(e) => slider.onChange(Number(e.target.value))}
                className="signal-range w-full"
              />
            </div>
          ))}
        </div>

        <div
          className="flex flex-col justify-center rounded-[20px] border border-signal-green/30 p-6 sm:p-[34px]"
          style={{ background: 'linear-gradient(160deg,#0F1B18,#07090D)' }}
        >
          <div className="text-sm font-semibold tracking-[0.04em] text-signal-green">
            Estimated with ComplyEasyAI
          </div>
          <div className="mt-3 font-display text-[52px] font-bold leading-none text-signal-green sm:text-[64px]">
            {hoursPerYear.toLocaleString('en-US')}
          </div>
          <div className="mt-1 text-base text-signal-sub">hours / year reclaimed</div>

          <div className="mt-[26px] flex gap-[26px] border-t border-white/[0.12] pt-6">
            <div>
              <div className="font-display text-[26px] font-bold text-white">
                {hoursPerMonth.toLocaleString('en-US')}
              </div>
              <div className="mt-0.5 text-[13px] text-[#8A94A6]">hrs / month</div>
            </div>
            <div>
              <div className="font-display text-[26px] font-bold text-white">
                ${stackThousands.toLocaleString('en-US')}k
              </div>
              <div className="mt-0.5 text-[13px] text-[#8A94A6]">stack you can consolidate</div>
            </div>
          </div>

          <PrimaryCta to="/demo" className="mt-[26px] w-full">
            Book a demo to see your number
          </PrimaryCta>
        </div>
      </div>

      <p className="mx-auto mt-[22px] max-w-[640px] text-center text-xs text-signal-muted">
        Illustrative estimate based on ~{automationPct}% evidence automation and typical GRC tooling
        costs. Your actual results depend on starting maturity and framework mix.
      </p>
    </>
  );
};

// ---------------------------------------------------------------------------
// Depth bullets
// ---------------------------------------------------------------------------
const DEPTH_ITEMS = [
  { title: 'Full EU regulatory stack', sub: 'AI Act · DORA · DMA · DSA' },
  { title: 'Compliance Digital Twin', sub: 'Simulate an audit before you invest a dollar' },
  { title: 'Autonomous remediation + rollback', sub: 'Fixes drift safely — not just another alert' },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export interface LandingPageProps {
  /** Share of evidence work automated, as a percentage (drives the ROI estimate). */
  automationPct?: number;
  /** Annual cost of each consolidated point tool, in thousands of dollars per year. */
  toolCostK?: number;
}

export const LandingPage: React.FC<LandingPageProps> = ({ automationPct = 80, toolCostK = 22 }) => {
  return (
    <MarketingLayout>
      <Seo title={SEO_TITLE} description={SEO_DESCRIPTION} canonicalPath="/" keywords={SEO_KEYWORDS} />
      <JsonLd data={organizationSchema()} />
      <JsonLd data={softwareApplicationSchema()} />
      <JsonLd data={breadcrumbSchema([{ name: 'Home', url: 'https://complyeasyai.com/' }])} />

      <SignalPage>
        {/* ================================ Hero ================================ */}
        <section className="relative overflow-hidden bg-signal-glow-tight">
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(920px 520px at 80% 8%, rgba(58,160,255,.16), transparent 60%), radial-gradient(720px 500px at 6% 96%, rgba(56,232,166,.12), transparent 60%)',
            }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
              WebkitMaskImage: 'radial-gradient(circle at 62% 34%, #000, transparent 74%)',
              maskImage: 'radial-gradient(circle at 62% 34%, #000, transparent 74%)',
            }}
          />

          <div className="relative mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-12 px-6 pb-[92px] pt-[52px] md:px-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <Eyebrow dot pill>
                Autonomous Compliance OS
              </Eyebrow>
              <h1 className="mt-[26px] font-display text-[44px] font-bold leading-[1.05] tracking-[-0.03em] text-signal-ink sm:text-[56px] lg:text-[66px] lg:leading-[1.01]">
                Compliance that
                <br />
                runs itself.
              </h1>
              <p className="mt-6 max-w-[500px] text-lg leading-[1.6] text-signal-sub md:text-[19px]">
                ComplyEasyAI watches your cloud, code and vendors, closes the gaps, and keeps you
                audit-ready across every major framework — so your team stops chasing evidence and
                starts shipping.
              </p>
              <div className="mt-[34px] flex flex-wrap gap-3.5">
                <PrimaryCta to="/demo">
                  Book a demo <span aria-hidden="true">→</span>
                </PrimaryCta>
                <OutlineCta onClick={scrollToPlatform}>See it in motion</OutlineCta>
              </div>
              <p className="mt-10 font-mono text-[11.5px] uppercase tracking-[0.14em] text-signal-muted">
                In design partnerships across fintech · health-tech · EU SaaS
              </p>
              <div className="mt-[15px] flex flex-wrap gap-[9px]">
                {HERO_FRAMEWORK_CHIPS.map((name) => (
                  <span
                    key={name}
                    className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-signal-sub"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>

            <HeroStatusCard />
          </div>
        </section>

        {/* ====================== Three jobs it takes off your plate ====================== */}
        <SignalSection id="platform" variant="glow">
          <div className="mb-12 text-center">
            <div className="mb-3.5">
              <Eyebrow>What it does — not how</Eyebrow>
            </div>
            <SectionTitle>Three jobs it takes off your plate</SectionTitle>
          </div>
          <div className="grid grid-cols-1 gap-[22px] md:grid-cols-3">
            {JOB_CARDS.map((card) => (
              <SignalCard key={card.title} padding="lg">
                <div className="mb-5 flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-signal-green/[0.12]">
                  <span aria-hidden="true" className={jobGlyphClass(card.glyph)} />
                </div>
                <h3 className="mb-[11px] font-display text-[22px] font-semibold text-signal-ink">
                  {card.title}
                </h3>
                <p className="text-[15px] leading-[1.6] text-[#8A94A6]">{card.body}</p>
              </SignalCard>
            ))}
          </div>
        </SignalSection>

        {/* ============================== ROI calculator ============================== */}
        <SignalSection id="roi" variant="glow" width={1000}>
          <div className="mb-11 text-center">
            <Eyebrow pill>ROI calculator</Eyebrow>
            <SectionTitle className="mt-[18px]">What could you reclaim?</SectionTitle>
            <p className="mt-3 text-base text-signal-sub">
              Move the sliders to size the opportunity for your team.
            </p>
          </div>
          <RoiCalculator automationPct={automationPct} toolCostK={toolCostK} />
        </SignalSection>

        {/* ============================ Depth vs mid-market ============================ */}
        <SignalSection variant="glow">
          <div className="flex flex-col items-start gap-11 lg:flex-row lg:items-center">
            <div className="min-w-0 flex-1">
              <div className="mb-3.5">
                <Eyebrow>Coverage others don't have</Eyebrow>
              </div>
              <h2 className="font-display text-[30px] font-bold leading-[1.08] tracking-[-0.02em] text-signal-ink md:text-[36px]">
                Depth that the mid-market tools can't match
              </h2>
            </div>
            <div className="flex w-full flex-col gap-3 lg:w-[540px] lg:flex-none">
              {DEPTH_ITEMS.map((item) => (
                <div
                  key={item.title}
                  className="flex items-center gap-3.5 rounded-xl border border-white/10 bg-white/[0.05] px-5 py-4"
                >
                  <span aria-hidden="true" className="flex-none text-lg leading-none text-signal-green">
                    ●
                  </span>
                  <div className="flex min-w-0 flex-col gap-[3px]">
                    <div className="text-[15px] font-semibold leading-[1.3] text-signal-ink">
                      {item.title}
                    </div>
                    <div className="text-[13px] text-signal-sub">{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SignalSection>


        {/* ============================== Pricing teaser ============================== */}
        <SignalSection id="company" variant="glow" className="text-center">
          <div className="mb-3.5">
            <Eyebrow>Pricing</Eyebrow>
          </div>
          <SectionTitle>Priced for outcomes, not seats.</SectionTitle>
          <p className="mx-auto mt-4 max-w-[600px] text-[17px] leading-[1.6] text-[#8A94A6]">
            Enterprise-grade coverage at a fraction of a four-to-six tool GRC stack. One platform
            price — no renewal surprises.
          </p>
          <div className="mt-[26px] flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            <Link
              to="/pricing"
              className="inline-flex items-center border-b border-signal-green/40 pb-[3px] text-base font-semibold text-signal-green"
            >
              Talk to us about pricing →
            </Link>
            <Link
              to="/demo"
              className="inline-flex items-center border-b border-white/20 pb-[3px] text-base font-medium text-signal-ink transition-colors hover:border-white/40"
            >
              Book a demo →
            </Link>
          </div>
        </SignalSection>

        {/* ================================ Closing CTA ================================ */}
        <SignalSection id="demo" variant="tight" className="text-center">
          <h2 className="font-display text-[40px] font-bold leading-[1.05] tracking-[-0.03em] text-signal-ink md:text-[52px] md:leading-[1.02]">
            See compliance
            <br />
            run itself.
          </h2>
          <p className="mt-5 text-lg text-signal-sub">A 30-minute demo, tailored to your frameworks.</p>
          <div className="mt-[34px] flex flex-wrap justify-center gap-3.5">
            <PrimaryCta to="/demo">
              Book a demo <span aria-hidden="true">→</span>
            </PrimaryCta>
            <OutlineCta to="/demo">Talk to sales</OutlineCta>
          </div>
        </SignalSection>
      </SignalPage>
    </MarketingLayout>
  );
};
