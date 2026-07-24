import React, { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, Check, FileCheck, KeyRound, Lock, Timer, Users } from 'lucide-react';
import MarketingLayout from '../MarketingLayout';
import Seo from '../../seo/Seo';
import JsonLd from '../../seo/JsonLd';
import { breadcrumbSchema, softwareApplicationSchema } from '../../seo/siteSchema';
import {
  Eyebrow,
  OutlineCta,
  PrimaryCta,
  SectionTitle,
  SignalCard,
  SignalPage,
  SignalSection,
} from '../signal';

// ---------------------------------------------------------------------------
// SEO copy
// ---------------------------------------------------------------------------
const SEO_TITLE =
  'Compliance Automation Platform: The Autonomous Compliance OS | ComplyEasy AI';
const SEO_DESCRIPTION =
  'ComplyEasyAI runs a closed compliance loop — observing your cloud, code, identity and vendors, predicting the control most likely to fail, remediating safely with rollback, verifying every fix, and learning from each cycle.';
const SEO_KEYWORDS =
  'compliance automation platform, autonomous compliance, continuous compliance monitoring, compliance digital twin, automated evidence collection, autonomous remediation, continuous evidence, compliance OS';

// ---------------------------------------------------------------------------
// The five aCOS loop stages, in run order
// ---------------------------------------------------------------------------
const ACOS_STAGES: { name: string; num: string; desc: string }[] = [
  {
    name: 'Observe',
    num: '01',
    desc: 'Continuous signal from your cloud, code, identity and vendors — one always-current picture of every control.',
  },
  {
    name: 'Predict',
    num: '02',
    desc: 'Models your compliance trajectory and surfaces the control most likely to fail before it becomes a finding.',
  },
  {
    name: 'Act',
    num: '03',
    desc: 'Closes the gap autonomously where it is safe to — with blast-radius estimation and human approval where it matters.',
  },
  {
    name: 'Verify',
    num: '04',
    desc: 'Confirms the fix held, captures the evidence, and writes it to an immutable, auditor-ready trail.',
  },
  {
    name: 'Learn',
    num: '05',
    desc: 'Feeds every outcome back into the loop, so the system gets sharper with each cycle.',
  },
];

// ---------------------------------------------------------------------------
// Section data
// ---------------------------------------------------------------------------
const INTEGRATION_TILES = ['AWS', 'GitHub', 'Okta', 'Jira', 'Azure'];

const TWIN_ROWS: { label: string; value: string; tone: 'good' | 'warn' }[] = [
  { label: 'Add ISO 27001', value: '+18% ready', tone: 'good' },
  { label: 'If control CC6.1 fails', value: '3 findings', tone: 'warn' },
  { label: 'Projected audit date', value: '−6 weeks', tone: 'good' },
];

const REMEDIATION_STEPS = [
  'Detected drift · S3 bucket policy',
  'Blast radius estimated · low',
  'Auto-remediated · rollback armed',
];

const TRUST_ITEMS: { label: string; icon: LucideIcon }[] = [
  { label: 'Encryption at rest & in transit', icon: Lock },
  { label: 'Role-based access control', icon: Users },
  { label: 'Immutable audit trail', icon: FileCheck },
  { label: 'Bring-your-own-key', icon: KeyRound },
  { label: 'Just-in-time admin access', icon: Timer },
];

/**
 * Marketing page for the platform itself ("Signal" design): the aCOS closed
 * loop, continuous evidence, the Compliance Digital Twin, safe autonomous
 * remediation, and platform trust posture.
 */
const PlatformPage: React.FC = () => {
  const [stage, setStage] = useState(0);
  const activeStage = ACOS_STAGES[stage];

  return (
    <MarketingLayout>
      <Seo
        title={SEO_TITLE}
        description={SEO_DESCRIPTION}
        canonicalPath="/platform"
        keywords={SEO_KEYWORDS}
      />
      <JsonLd data={softwareApplicationSchema()} />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: 'https://complyeasyai.com/' },
          { name: 'Platform', url: 'https://complyeasyai.com/platform' },
        ])}
      />

      <SignalPage>
        {/* ============================== Hero ============================== */}
        <section className="bg-signal-glow px-6 pb-11 pt-14 text-center md:px-10 md:pt-[60px]">
          <Eyebrow pill dot>
            The Autonomous Compliance OS
          </Eyebrow>
          <SectionTitle as="h1" className="mt-6">
            Compliance that
            <br />
            operates itself.
          </SectionTitle>
          <p className="mx-auto mt-5 max-w-[640px] text-lg leading-relaxed text-signal-sub">
            Most tools help you <em className="text-signal-body">manage</em> compliance. ComplyEasyAI
            runs a closed loop that <em className="text-signal-body">operates</em> it — observing,
            predicting, acting, verifying and learning around the clock.
          </p>
        </section>

        {/* ========================= The aCOS loop ========================= */}
        <section className="bg-signal-canvas px-6 pb-16 pt-9 md:px-10 md:pb-20">
          <div className="mx-auto max-w-[1000px]">
            <p className="mb-6 text-center font-mono text-xs uppercase tracking-[0.2em] text-signal-green">
              The aCOS loop — tap a stage
            </p>
            <div className="mb-6 flex flex-wrap justify-center gap-2.5">
              {ACOS_STAGES.map((s, index) => {
                const isActive = index === stage;
                return (
                  <button
                    key={s.name}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setStage(index)}
                    className={`flex items-center gap-2.5 rounded-[14px] border px-5 py-3.5 text-[15px] font-semibold transition-colors ${
                      isActive
                        ? 'border-signal-green bg-signal-green/[0.12] text-signal-green'
                        : 'border-white/10 bg-white/[0.03] text-signal-sub hover:text-signal-body'
                    }`}
                  >
                    <span className="font-mono text-xs opacity-80" aria-hidden="true">
                      {s.num}
                    </span>
                    {s.name}
                  </button>
                );
              })}
            </div>
            <div className="flex min-h-[150px] flex-col items-center justify-center rounded-[20px] border border-signal-green/20 bg-white/[0.03] p-8 text-center md:p-10">
              <h2 className="mb-3.5 font-display text-[26px] font-bold text-signal-green md:text-[28px]">
                {activeStage.name}
              </h2>
              <p className="max-w-[640px] text-[17px] leading-relaxed text-signal-body md:text-lg">
                {activeStage.desc}
              </p>
            </div>
          </div>
        </section>

        {/* ======================= Continuous evidence ====================== */}
        <SignalSection variant="glow" width={1100}>
          <div className="grid items-center gap-11 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <Eyebrow className="mb-3.5">Continuous evidence</Eyebrow>
              <SectionTitle>Connect once. Evidence flows on its own.</SectionTitle>
              <p className="mt-4 text-base leading-relaxed text-signal-sub">
                Read-only integrations across cloud, code, identity and vendors feed evidence
                continuously — mapped to the right controls the moment it lands. No screenshots, no
                spreadsheets, no final-quarter scramble.
              </p>
            </div>
            <SignalCard padding="lg">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {INTEGRATION_TILES.map((name) => (
                  <div
                    key={name}
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-4 text-center text-[13px] text-signal-body"
                  >
                    {name}
                  </div>
                ))}
                <div className="rounded-xl border border-signal-green/[0.28] bg-signal-green/10 px-3 py-4 text-center text-[13px] font-semibold text-signal-green">
                  +25 more
                </div>
              </div>
            </SignalCard>
          </div>
        </SignalSection>

        {/* ======================== Predict & simulate ====================== */}
        <SignalSection variant="plain" width={1100}>
          <div className="grid items-center gap-11 lg:grid-cols-[0.95fr_1.05fr]">
            <SignalCard padding="lg" className="order-2 lg:order-1">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-mono text-xs text-signal-sub">DIGITAL TWIN · what-if</span>
                <span className="rounded-[5px] bg-signal-green px-2 py-0.5 font-mono text-[10px] font-semibold text-signal-canvas">
                  SIM
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {TWIN_ROWS.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-3 rounded-[10px] bg-white/[0.04] px-3.5 py-3 text-[13px] text-signal-body"
                  >
                    <span>{row.label}</span>
                    <span className={row.tone === 'good' ? 'text-signal-green' : 'text-signal-amber'}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </SignalCard>
            <div className="order-1 lg:order-2">
              <Eyebrow className="mb-3.5">Predict & simulate</Eyebrow>
              <SectionTitle>See your compliance future before you invest.</SectionTitle>
              <p className="mt-4 text-base leading-relaxed text-signal-sub">
                The Compliance Digital Twin models “what if we add a framework?” or “what if this
                control fails?” against a virtual replica of your environment — and predictive signals
                flag the gap likely to become your next finding.
              </p>
            </div>
          </div>
        </SignalSection>

        {/* =========================== Act — safely ========================= */}
        <SignalSection variant="glow" width={1100}>
          <div className="grid items-center gap-11 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <Eyebrow className="mb-3.5">Act — safely</Eyebrow>
              <SectionTitle>Autonomous remediation, with a seatbelt.</SectionTitle>
              <p className="mt-4 text-base leading-relaxed text-signal-sub">
                Agents close the gaps they safely can — with blast-radius estimation, automatic
                rollback on failure, and human approval on anything high-impact. It’s action, not just
                another alert.
              </p>
            </div>
            <SignalCard padding="lg" className="flex flex-col gap-3">
              {REMEDIATION_STEPS.map((step, index) => (
                <div key={step} className="flex items-center gap-3 text-sm text-signal-body">
                  <span
                    className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-md bg-signal-green/15 text-xs text-signal-green"
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  {step}
                </div>
              ))}
              <div className="flex items-center gap-3 text-sm font-semibold text-signal-green">
                <span className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-md bg-signal-green text-signal-canvas">
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                Verified & logged to audit trail
              </div>
            </SignalCard>
          </div>
        </SignalSection>

        {/* ========================= Built to be trusted ==================== */}
        <SignalSection variant="plain" width={1100}>
          <div className="mb-10 text-center">
            <Eyebrow className="mb-3">Built to be trusted</Eyebrow>
            <SectionTitle className="mx-auto max-w-3xl">
              The system that proves your compliance is built to be trusted itself
            </SectionTitle>
          </div>
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
            {TRUST_ITEMS.map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="rounded-[14px] border border-white/[0.08] bg-white/[0.03] px-4 py-5 text-center"
              >
                <Icon className="mx-auto mb-2.5 h-5 w-5 text-signal-green" aria-hidden="true" />
                <div className="text-[13.5px] font-semibold leading-snug text-signal-ink">{label}</div>
              </div>
            ))}
          </div>
        </SignalSection>

        {/* ============================ Closing CTA ========================= */}
        <SignalSection variant="tight" className="text-center">
          <h2 className="font-display text-4xl font-bold tracking-[-0.03em] text-signal-ink md:text-[46px]">
            See the loop in motion.
          </h2>
          <p className="mt-4 text-lg text-signal-sub">A 30-minute demo, tailored to your environment.</p>
          <div className="mt-8 flex flex-col justify-center gap-3.5 sm:flex-row">
            <PrimaryCta to="/demo">
              Book a demo
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </PrimaryCta>
            <OutlineCta to="/frameworks">Explore frameworks</OutlineCta>
          </div>
        </SignalSection>
      </SignalPage>
    </MarketingLayout>
  );
};

export default PlatformPage;
export { PlatformPage };
