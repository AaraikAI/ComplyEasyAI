import React from 'react';
import { Link } from 'react-router';
import { MarketingLayout } from './marketing/MarketingLayout';
import {
  Eyebrow,
  OutlineCta,
  PrimaryCta,
  SectionTitle,
  SignalCard,
  SignalPage,
  SignalSection,
} from './marketing/signal';
import { Seo } from './seo/Seo';

/** Published resources to use while the community is not yet open. */
const RESOURCES: { title: string; desc: string; to: string }[] = [
  {
    title: 'Learning center',
    desc: 'Framework guides, checklists and learning paths, from a first SOC 2 to the EU AI Act.',
    to: '/learn',
  },
  {
    title: 'Glossary',
    desc: 'Plain-language definitions of the compliance, privacy and AI-governance terms auditors use.',
    to: '/glossary',
  },
  {
    title: 'Blog',
    desc: 'Step-by-step posts on automating evidence collection and meeting new obligations.',
    to: '/blog',
  },
];

/**
 * Community page. The practitioner community has not opened yet, so the page
 * says so plainly and points to the published resources; it carries a noindex
 * robots tag and is left out of the sitemap until there is community content.
 */
export const CommunityPage: React.FC = () => (
  <MarketingLayout>
    <Seo
      title="ComplyEasyAI Community (Early Access)"
      description="The ComplyEasyAI practitioner community is opening to customers and design partners first. Until then, use the learning center, glossary and blog."
      canonicalPath="/community"
      noindex
    />

    <SignalPage className="!min-h-[calc(100vh-4rem)]">
      <SignalSection variant="glow" width={1000} className="text-center">
        <Eyebrow pill dot>
          Community
        </Eyebrow>
        <SectionTitle as="h1" className="mt-6">
          ComplyEasyAI community:
          <br />
          early access
        </SectionTitle>
        <p className="mx-auto mt-5 max-w-[640px] text-lg leading-relaxed text-signal-sub">
          A practitioner community for compliance, security and AI-governance teams is on the way.
        </p>
        <p className="mx-auto mt-4 max-w-[640px] text-[15px] leading-relaxed text-signal-body">
          The ComplyEasyAI community is opening to customers and design partners first. It is
          planned around office hours with our compliance team, reusable policy and evidence
          templates, and early notes on framework changes such as the EU AI Act amendments. Until it
          opens, book a demo or browse the learning center.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3.5">
          <PrimaryCta to="/demo">Book a demo</PrimaryCta>
          <OutlineCta to="/learn">Browse the learning center</OutlineCta>
        </div>
      </SignalSection>

      <SignalSection variant="plain" width={1000}>
        <SectionTitle className="mb-8 text-center">Where can I learn in the meantime?</SectionTitle>
        <div className="grid gap-4 md:grid-cols-3">
          {RESOURCES.map((resource) => (
            <Link key={resource.to} to={resource.to} className="block">
              <SignalCard className="h-full transition-colors hover:border-signal-green/40">
                <h3 className="font-display text-lg font-semibold text-signal-ink">{resource.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-signal-sub">{resource.desc}</p>
              </SignalCard>
            </Link>
          ))}
        </div>
      </SignalSection>
    </SignalPage>
  </MarketingLayout>
);

export default CommunityPage;
