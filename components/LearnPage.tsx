import React, { useState } from 'react';
import { Link } from 'react-router';
import { MarketingLayout } from './marketing/MarketingLayout';
import {
  Eyebrow,
  OutlineCta,
  PrimaryCta,
  SectionTitle,
  SignalChip,
  SignalPage,
  SignalSection,
  SIGNAL_CATEGORIES,
  type SignalCategory,
} from './marketing/signal';
import { Seo } from './seo/Seo';
import { JsonLd } from './seo/JsonLd';
import { breadcrumbSchema } from './seo/siteSchema';
import { SITE_ORIGIN } from './seo/siteOrigin';
import { TldrList } from './marketing/answerFirst';
import { FRAMEWORK_PILLAR_COUNT } from '../data/frameworkPillarContent';
import { glossaryTerms } from '../data/glossary';
import { TRIAL_CTA } from '../data/marketingFacts';

type GuideCategory = 'Fundamentals' | SignalCategory;
type GuideFilter = 'All' | GuideCategory;

interface LearningPath {
  tag: string;
  color: string;
  title: string;
  desc: string;
  /** Published page that answers this path. */
  to: string;
}

interface Guide {
  cat: GuideCategory;
  title: string;
  desc: string;
  /** Published page that answers this guide. */
  to: string;
  badge: string;
  bg: string;
}

/** Kind of page a card opens, shown in place of a reading time. */
const destinationLabel = (to: string): string => {
  if (to.startsWith('/blog/')) return 'Blog post';
  if (to.startsWith('/glossary/')) return 'Glossary entry';
  return 'Framework guide';
};

/** Learning paths from the Signal design handoff. */
const LEARNING_PATHS: LearningPath[] = [
  {
    tag: 'SECURITY',
    color: '#38E8A6',
    title: 'Your first SOC 2, step by step',
    desc: 'A step-by-step path from scoping the Trust Services Criteria to a clean auditor hand-off.',
    to: '/blog/how-to-automate-soc-2-compliance-with-ai',
  },
  {
    tag: 'PRIVACY',
    color: '#3AA0FF',
    title: 'GDPR readiness playbook',
    desc: 'Lawful basis, RoPA, DPIAs and data-subject requests — operationalized end to end.',
    to: '/gdpr',
  },
  {
    tag: 'AI GOVERNANCE',
    color: '#B98CFF',
    title: 'Governing AI under the EU AI Act',
    desc: 'Classify risk, build technical documentation and stand up post-market monitoring.',
    to: '/blog/eu-ai-act-compliance-checklist',
  },
  {
    tag: 'GRC LEADER',
    color: '#E8B93A',
    title: 'Running a multi-framework program',
    desc: 'Map once and reuse evidence across SOC 2, ISO 27001 and beyond without duplicating work.',
    to: '/glossary/control-mapping',
  },
];

/** Guide grid entries from the Signal design handoff. */
const GUIDES: Guide[] = [
  {
    cat: 'Fundamentals',
    title: 'GRC 101',
    desc: 'What governance, risk and compliance actually mean — and why they converge in one platform.',
    to: '/grc',
    badge: 'GRC',
    bg: 'linear-gradient(135deg,#10221c,#122)',
  },
  {
    cat: 'Security',
    title: 'SOC 2 Type I vs Type II',
    desc: 'Which report to pursue first, and what the observation period really requires.',
    to: '/soc2-compliance',
    badge: 'SOC 2',
    bg: 'linear-gradient(135deg,#0f2a22,#123)',
  },
  {
    cat: 'Security',
    title: 'ISO 27001 Statement of Applicability',
    desc: 'How to scope Annex A controls and justify exclusions without over-committing.',
    to: '/iso-27001',
    badge: 'ISO',
    bg: 'linear-gradient(135deg,#0f2a22,#123)',
  },
  {
    cat: 'Privacy',
    title: 'Writing a DPIA that holds up',
    desc: 'A practical template for assessing high-risk processing before it ships.',
    to: '/glossary/dpia',
    badge: 'DPIA',
    bg: 'linear-gradient(135deg,#0f2233,#122)',
  },
  {
    cat: 'Privacy',
    title: 'Handling data-subject requests',
    desc: 'Build a repeatable workflow for access, deletion and portability under GDPR & CCPA.',
    to: '/gdpr',
    badge: 'DSAR',
    bg: 'linear-gradient(135deg,#0f2233,#122)',
  },
  {
    cat: 'AI Governance',
    title: 'Classifying AI system risk',
    desc: 'Map your models to the EU AI Act risk tiers and know which duties attach.',
    to: '/eu-ai-act',
    badge: 'AI Act',
    bg: 'linear-gradient(135deg,#1e1533,#122)',
  },
  {
    cat: 'AI Governance',
    title: 'Operationalizing the NIST AI RMF',
    desc: 'Turn Govern-Map-Measure-Manage into evidence, not slideware.',
    to: '/nist-ai-rmf',
    badge: 'AI RMF',
    bg: 'linear-gradient(135deg,#1e1533,#122)',
  },
  {
    cat: 'EU Digital',
    title: 'DORA for financial entities',
    desc: 'ICT risk, incident reporting and resilience testing explained for practitioners.',
    to: '/dora-compliance',
    badge: 'DORA',
    bg: 'linear-gradient(135deg,#2a2410,#122)',
  },
  {
    cat: 'AI Governance',
    title: 'EU AI Act timeline after the Digital Omnibus',
    desc: 'Every date after Regulation (EU) 2026/1744, from the December 2026 bans to the 2027 and 2028 high-risk deadlines.',
    to: '/blog/eu-ai-act-timeline-digital-omnibus',
    badge: 'AI Act',
    bg: 'linear-gradient(135deg,#1e1533,#122)',
  },
  {
    cat: 'Privacy',
    title: 'India DPDP Rules 2025: what applies on 13 May 2027',
    desc: 'What starts on 13 November 2026 and 13 May 2027, and how to prepare notices, consent and breach response.',
    to: '/blog/india-dpdp-rules-2025-timeline',
    badge: 'DPDP',
    bg: 'linear-gradient(135deg,#0f2233,#122)',
  },
  {
    cat: 'EU Digital',
    title: 'CSRD after Omnibus I: who still reports?',
    desc: 'The 1,000-employee and €450 million thresholds, the end of reasonable assurance and the next dates.',
    to: '/blog/csrd-after-omnibus-i',
    badge: 'CSRD',
    bg: 'linear-gradient(135deg,#2a2410,#122)',
  },
  {
    cat: 'Security',
    title: 'Continuous evidence, explained',
    desc: 'Why automated collection beats screenshots — and how versioning helps at audit.',
    to: '/glossary/continuous-compliance',
    badge: 'Evidence',
    bg: 'linear-gradient(135deg,#0f2a22,#123)',
  },
];

/** Key facts shown as the TL;DR under the hero. */
const LEARN_TLDR: string[] = [
  `${FRAMEWORK_PILLAR_COUNT} in-depth framework guides, from SOC 2 and ISO 27001 to the EU AI Act and CSRD.`,
  `A glossary of ${glossaryTerms.length} core compliance terms, each with a quotable definition.`,
  'Step-by-step posts such as the EU AI Act compliance checklist.',
  'Every card opens a published guide, glossary entry or post.',
];

const GUIDE_FILTERS: GuideFilter[] = [
  'All',
  'Fundamentals',
  'Security',
  'Privacy',
  'AI Governance',
  'EU Digital',
];

/** Category dot accent; Fundamentals shares the Security green. */
const guideDotColor = (cat: GuideCategory): string =>
  cat === 'Fundamentals' ? SIGNAL_CATEGORIES.Security.color : SIGNAL_CATEGORIES[cat].color;

/**
 * Learning center in the Signal design: glow hero, four learning-path cards,
 * a category-filterable guide grid, and a closing CTA.
 */
export const LearnPage: React.FC = () => {
  const [category, setCategory] = useState<GuideFilter>('All');

  const visibleGuides = GUIDES.filter((guide) => category === 'All' || guide.cat === category);

  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: SITE_ORIGIN },
    { name: 'Learning center', url: `${SITE_ORIGIN}/learn` },
  ]);

  return (
    <MarketingLayout>
      <Seo
        title="Compliance Learning Center: Guides & Glossary | ComplyEasyAI"
        description="Practical guides, checklists and plain-language definitions for SOC 2, ISO 27001, GDPR, HIPAA, the EU AI Act and more."
        canonicalPath="/learn"
        keywords="compliance learning center, SOC 2 guide, GDPR playbook, EU AI Act training, GRC fundamentals, compliance guides"
      />
      <JsonLd data={breadcrumbs} />

      <SignalPage className="!min-h-[calc(100vh-4rem)]">
        {/* Hero */}
        <SignalSection variant="glow" width={1100} className="!py-14 text-center md:!py-16">
          <Eyebrow>Learning center</Eyebrow>
          <SectionTitle as="h1" className="mt-3.5">
            Compliance learning center:
            <br />
            guides, checklists and definitions.
          </SectionTitle>
          <p className="mx-auto mt-5 max-w-[640px] text-lg leading-relaxed text-signal-sub">
            Start with the framework you need, then go deeper with checklists and plain-language
            definitions.
          </p>
          <p className="mx-auto mt-4 max-w-[640px] text-[15px] leading-relaxed text-signal-body">
            The ComplyEasyAI learning center collects practical guides for SOC 2, ISO 27001, GDPR,
            HIPAA, the EU AI Act and {FRAMEWORK_PILLAR_COUNT - 5} other frameworks, a glossary of{' '}
            {glossaryTerms.length} core compliance terms, and step-by-step posts such as the EU AI Act
            checklist. Each card below opens the guide, glossary entry or post that answers it.
          </p>
          <div className="mx-auto mt-8 max-w-[760px]">
            <TldrList items={LEARN_TLDR} />
          </div>
        </SignalSection>

        {/* Learning paths */}
        <section className="bg-signal-canvas px-6 py-5 md:px-10">
          <div className="mx-auto max-w-[1200px]">
            <h2 className="mb-[18px] font-mono text-xs font-normal uppercase tracking-[0.2em] text-signal-green">
              Where should I start?
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {LEARNING_PATHS.map((path) => (
                <Link
                  key={path.title}
                  to={path.to}
                  className="flex flex-col rounded-[18px] border border-white/[0.08] bg-[linear-gradient(160deg,rgba(56,232,166,.08),rgba(255,255,255,.02))] p-[26px] transition-colors hover:border-signal-green/40"
                >
                  <div className="font-mono text-[11px] tracking-[0.1em]" style={{ color: path.color }}>
                    {path.tag}
                  </div>
                  <h3 className="mt-3 font-display text-xl font-bold leading-tight text-signal-ink">
                    {path.title}
                  </h3>
                  <p className="mt-2.5 flex-1 text-sm leading-relaxed text-signal-sub">{path.desc}</p>
                  <div className="mt-[18px] flex items-center justify-between border-t border-white/[0.08] pt-4">
                    <span className="text-xs text-signal-muted">{destinationLabel(path.to)}</span>
                    <span className="text-sm font-semibold text-signal-green">Start →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Guide grid */}
        <section className="bg-signal-canvas px-6 pb-8 pt-14 md:px-10">
          <div className="mx-auto max-w-[1200px]">
            <div className="mb-[26px] flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-display text-[30px] font-bold tracking-[-0.02em] text-signal-ink">
                Which guide answers my question?
              </h2>
              <div className="flex flex-wrap gap-2">
                {GUIDE_FILTERS.map((filter) => (
                  <SignalChip
                    key={filter}
                    active={filter === category}
                    onClick={() => setCategory(filter)}
                  >
                    {filter}
                  </SignalChip>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleGuides.map((guide) => (
                <Link
                  key={guide.title}
                  to={guide.to}
                  className="flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] transition-colors hover:border-signal-green/40"
                >
                  <div
                    className="flex h-[110px] items-center justify-center"
                    style={{ background: guide.bg }}
                  >
                    <span className="font-display text-3xl font-bold text-white/90">{guide.badge}</span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-2.5 flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="h-[7px] w-[7px] rounded-full"
                        style={{ backgroundColor: guideDotColor(guide.cat) }}
                      />
                      <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-signal-sub">
                        {guide.cat}
                      </span>
                    </div>
                    <h3 className="font-display text-[17px] font-semibold leading-snug text-signal-ink">
                      {guide.title}
                    </h3>
                    <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-signal-sub">
                      {guide.desc}
                    </p>
                    <div className="mt-3.5 text-xs text-signal-muted">{destinationLabel(guide.to)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <SignalSection variant="tight" className="text-center">
          <SectionTitle as="h2">Put it into practice.</SectionTitle>
          <p className="mt-4 text-lg text-signal-sub">
            See it live in a 30-minute demo, or request a trial for your team.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3.5">
            <PrimaryCta to="/demo">Book a demo</PrimaryCta>
            <OutlineCta to={TRIAL_CTA.to}>{TRIAL_CTA.label}</OutlineCta>
          </div>
        </SignalSection>
      </SignalPage>
    </MarketingLayout>
  );
};

export default LearnPage;
