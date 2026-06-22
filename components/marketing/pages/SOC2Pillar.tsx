import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  CheckCircle,
  ArrowRight,
  ClipboardCheck,
  RefreshCw,
  FileCheck,
  Network,
  Lock,
  Eye,
  AlertTriangle,
  Layers,
  Server,
  Workflow,
} from 'lucide-react';
import MarketingLayout from '../MarketingLayout';
import Seo from '../../seo/Seo';
import JsonLd from '../../seo/JsonLd';
import {
  softwareApplicationSchema,
  breadcrumbSchema,
  faqSchema,
} from '../../seo/siteSchema';

// ---------------------------------------------------------------------------
// SEO copy
// ---------------------------------------------------------------------------
const SEO_TITLE =
  'SOC 2 Compliance Software: Automate Type I & Type II Readiness | ComplyEasy AI';
const SEO_DESCRIPTION =
  'SOC 2 compliance software that maps your environment to the Trust Services Criteria, automates evidence collection, and tracks control effectiveness for Type I and Type II — so you reach audit readiness faster.';
const SEO_KEYWORDS =
  'SOC 2 compliance software, SOC 2 automation, SOC 2 Type II, Trust Services Criteria, SOC 2 readiness, continuous control monitoring, SOC 2 audit preparation, SOC 2 evidence collection';

// ---------------------------------------------------------------------------
// The five Trust Services Criteria
// ---------------------------------------------------------------------------
const trustCriteria: { name: string; icon: React.FC<any>; desc: string }[] = [
  {
    name: 'Security',
    icon: Shield,
    desc: 'The common criteria every SOC 2 report must cover: protecting systems and data against unauthorized access, disclosure, and damage. This is the only mandatory category.',
  },
  {
    name: 'Availability',
    icon: Server,
    desc: 'Systems are available for operation and use as committed, covering performance monitoring, disaster recovery, and incident handling.',
  },
  {
    name: 'Processing Integrity',
    icon: Workflow,
    desc: 'System processing is complete, valid, accurate, timely, and authorized — relevant when you process transactions on a customer’s behalf.',
  },
  {
    name: 'Confidentiality',
    icon: Lock,
    desc: 'Information designated as confidential is protected throughout its lifecycle, from collection and use to retention and disposal.',
  },
  {
    name: 'Privacy',
    icon: Eye,
    desc: 'Personal information is collected, used, retained, disclosed, and disposed of in line with your privacy notice and applicable criteria.',
  },
];

// ---------------------------------------------------------------------------
// How the platform helps — capability cards
// ---------------------------------------------------------------------------
const capabilities: { title: string; icon: React.FC<any>; desc: string }[] = [
  {
    title: 'Criteria mapping',
    icon: Network,
    desc: 'Your cloud, identity, code, and ticketing systems are mapped to the relevant Trust Services Criteria and points of focus, so you can see exactly which controls satisfy which requirement.',
  },
  {
    title: 'Automated evidence collection',
    icon: FileCheck,
    desc: 'Read-only integrations pull configuration and activity data on a recurring schedule, building a versioned, timestamped audit trail for every control instead of manual screenshots.',
  },
  {
    title: 'Continuous control monitoring',
    icon: RefreshCw,
    desc: 'Controls are checked on an ongoing basis so drift — a disabled MFA policy, an unencrypted bucket, an over-privileged role — surfaces as soon as it happens rather than during the audit.',
  },
  {
    title: 'Type II observation tracking',
    icon: ClipboardCheck,
    desc: 'Operating effectiveness is recorded across your observation window, giving your auditor a continuous record of how each control performed over time.',
  },
  {
    title: 'Gap and readiness dashboards',
    icon: AlertTriangle,
    desc: 'Real-time dashboards highlight failing or unmapped controls before fieldwork begins, with owners and remediation steps attached to each gap.',
  },
  {
    title: 'Multi-framework reuse',
    icon: Layers,
    desc: 'Controls shared with ISO 27001, HIPAA, and other standards are mapped once and reused, so a SOC 2 program lays the groundwork for additional certifications.',
  },
];

// ---------------------------------------------------------------------------
// On-page FAQ — defensible, capability-based answers an AI engine can quote
// ---------------------------------------------------------------------------
const faqItems: { q: string; a: string }[] = [
  {
    q: 'What is SOC 2 compliance?',
    a: 'SOC 2 is an attestation framework developed by the AICPA that evaluates how a service organization manages customer data against five Trust Services Criteria: Security, Availability, Processing Integrity, Confidentiality, and Privacy. An independent CPA firm examines your controls and issues a report. SOC 2 is not a certification you pass or fail — it is an auditor’s opinion on whether your controls are suitably designed and, for Type II, operating effectively.',
  },
  {
    q: 'What is the difference between SOC 2 Type I and Type II?',
    a: 'A SOC 2 Type I report assesses whether your controls are suitably designed at a single point in time. A Type II report goes further and tests whether those controls operated effectively across a period — commonly three to twelve months. Type II carries more weight with customers because it demonstrates sustained operation rather than a one-time snapshot.',
  },
  {
    q: 'What is SOC 2 compliance software?',
    a: 'SOC 2 compliance software maps your systems to the Trust Services Criteria, collects evidence automatically through integrations with your cloud and SaaS tools, monitors controls continuously, and organizes everything an auditor needs. It replaces manual evidence-gathering in spreadsheets and screenshots with a maintained, versioned audit trail, reducing the effort to reach and stay audit-ready.',
  },
  {
    q: 'How long does it take to become SOC 2 compliant?',
    a: 'Framework setup and integration are AI-assisted and can be completed quickly. The overall timeline depends on your starting maturity and report type. A Type I report can often be achieved in a matter of weeks once controls are in place, while a Type II requires an observation period — typically three months at minimum — that no tool can shorten because the auditor must observe controls operating over time.',
  },
  {
    q: 'Which Trust Services Criteria do I need for SOC 2?',
    a: 'The Security criterion (the common criteria) is required in every SOC 2 report. The other four — Availability, Processing Integrity, Confidentiality, and Privacy — are optional and chosen based on the commitments you make to customers. Most early-stage SaaS reports cover Security alone or Security plus Availability and Confidentiality.',
  },
  {
    q: 'Does ComplyEasy AI replace my SOC 2 auditor?',
    a: 'No. SOC 2 reports must be issued by an independent licensed CPA firm, and ComplyEasy AI does not perform the audit. The platform prepares you for that audit by mapping controls, collecting and organizing evidence, monitoring control effectiveness, and surfacing gaps — so your auditor receives a clean, well-documented control environment and fieldwork goes faster.',
  },
  {
    q: 'Can I pursue SOC 2 alongside ISO 27001 or HIPAA?',
    a: 'Yes. SOC 2 shares a substantial portion of its controls with ISO 27001 and overlaps with HIPAA safeguards. ComplyEasy AI maps shared controls once and reuses the underlying evidence across frameworks, so a SOC 2 program reduces the incremental effort of adding a second or third standard.',
  },
  {
    q: 'How does automated SOC 2 evidence collection work?',
    a: 'You connect integrations such as AWS, GitHub, Okta, and Jira using read-only OAuth, API keys, or personal access tokens. The platform maps incoming configuration and activity data to the relevant Trust Services Criteria and collects evidence on a recurring schedule, maintaining a versioned trail for every control so your report reflects current, continuously verified data.',
  },
];

// ---------------------------------------------------------------------------
// Procedural "From scoping to a clean SOC 2 report" steps — rendered as the
// visible ordered list and emitted as HowTo JSON-LD from the same source.
// ---------------------------------------------------------------------------
const howToSteps: { step: string; title: string; body: string }[] = [
  {
    step: '01',
    title: 'Scope your report',
    body: 'Choose the Trust Services Criteria that match your customer commitments and define the systems, in-scope products, and trust boundaries your report will cover.',
  },
  {
    step: '02',
    title: 'Connect your stack',
    body: 'Link cloud providers, identity systems, source control, and ticketing using read-only access. The platform discovers controls and maps each one to the criteria it satisfies.',
  },
  {
    step: '03',
    title: 'Collect evidence automatically',
    body: 'AI agents gather configuration and activity evidence on a recurring schedule, maintaining a versioned, timestamped audit trail for every control without manual screenshots.',
  },
  {
    step: '04',
    title: 'Monitor and remediate',
    body: 'Continuous monitoring flags control drift the moment it occurs, assigns owners, and tracks remediation so gaps are closed well before fieldwork begins.',
  },
  {
    step: '05',
    title: 'Run the observation period',
    body: 'For Type II, operating effectiveness is recorded across your window, producing a continuous record of how each control performed over time.',
  },
  {
    step: '06',
    title: 'Hand off to your auditor',
    body: 'Organized, current evidence is packaged for your independent CPA firm, so the audit examines a clean, well-documented control environment.',
  },
];

// ---------------------------------------------------------------------------
// Reusable section heading
// ---------------------------------------------------------------------------
const SectionEyebrow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700 dark:border-brand-800/60 dark:bg-brand-950/40 dark:text-brand-300">
    {children}
  </span>
);

/**
 * Long-form pillar page for the primary keyword "SOC 2 compliance software".
 * Answer-first structure, sectioned with semantic headings, on-page FAQ, and
 * structured data (SoftwareApplication, BreadcrumbList, FAQPage).
 */
const SOC2Pillar: React.FC = () => {
  return (
    <MarketingLayout>
      <Seo
        title={SEO_TITLE}
        description={SEO_DESCRIPTION}
        canonicalPath="/soc2-compliance"
        keywords={SEO_KEYWORDS}
      />
      <JsonLd data={softwareApplicationSchema()} />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: 'https://complyeasyai.com/' },
          { name: 'SOC 2 Compliance Software', url: 'https://complyeasyai.com/soc2-compliance' },
        ])}
      />
      <JsonLd data={faqSchema(faqItems)} />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: 'How to become SOC 2 compliant',
          description:
            'A six-step procedure for reaching SOC 2 audit readiness — from scoping the Trust Services Criteria and connecting your stack to automated evidence collection, continuous monitoring, the observation period, and the auditor hand-off.',
          step: howToSteps.map((item, index) => ({
            '@type': 'HowToStep',
            position: index + 1,
            name: item.title,
            text: item.body,
          })),
        }}
      />

      {/* ============================== Hero ============================== */}
      <section className="relative overflow-hidden mesh-gradient">
        <div className="absolute inset-0 dot-pattern opacity-40" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400">
              <li>
                <Link to="/" className="transition-colors hover:text-brand-600 dark:hover:text-brand-400">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="font-medium text-surface-700 dark:text-surface-200">
                SOC 2 Compliance Software
              </li>
            </ol>
          </nav>

          <SectionEyebrow>
            <Shield className="h-3.5 w-3.5" aria-hidden="true" />
            SOC 2 automation
          </SectionEyebrow>

          <h1 className="mt-6 max-w-4xl text-4xl font-bold tracking-tight text-surface-900 sm:text-5xl lg:text-6xl dark:text-white">
            SOC 2 compliance software that gets you{' '}
            <span className="text-gradient">audit-ready faster</span>
          </h1>

          {/* Answer-first definition — the quotable lede */}
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-surface-700 dark:text-surface-300">
            SOC 2 compliance software maps your systems to the AICPA Trust Services Criteria,
            automatically collects evidence from your cloud and SaaS tools, and continuously monitors
            control effectiveness so you stay audit-ready for both Type I and Type II reports.
            ComplyEasy AI does this with autonomous AI agents that connect to your environment, track
            every control, and surface gaps before your auditor ever opens a file.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-7 py-3 text-base font-semibold text-white shadow-lg shadow-brand-500/25 transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-surface-950"
            >
              Start free trial
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-surface-300 bg-white px-7 py-3 text-base font-semibold text-surface-800 transition-colors hover:border-brand-400 hover:text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100 dark:hover:text-brand-300"
            >
              Book a demo
            </Link>
          </div>
        </div>
      </section>

      {/* ====================== What is SOC 2 ====================== */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <SectionEyebrow>Definition</SectionEyebrow>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-surface-900 dark:text-white">
              What is SOC 2 compliance?
            </h2>
          </div>
          <div className="space-y-5 text-base leading-relaxed text-surface-700 lg:col-span-2 dark:text-surface-300">
            <p>
              <strong className="font-semibold text-surface-900 dark:text-white">SOC 2</strong>{' '}
              (System and Organization Controls 2) is an attestation framework developed by the
              American Institute of Certified Public Accountants (AICPA). It evaluates how a service
              organization manages customer data based on five Trust Services Criteria. An independent
              CPA firm examines your control environment and issues a report describing whether your
              controls are suitably designed and operating effectively.
            </p>
            <p>
              SOC 2 is especially important for SaaS companies, cloud providers, and any vendor that
              stores or processes customer data, because enterprise buyers routinely require a SOC 2
              report before signing. Unlike a pass/fail certification, a SOC 2 report is an auditor’s
              opinion — the value lies in demonstrating that your security and operational controls are
              real, documented, and consistently enforced.
            </p>
            <p>
              Reports come in two forms. A{' '}
              <strong className="font-semibold text-surface-900 dark:text-white">Type I</strong> report
              assesses control design at a single point in time, while a{' '}
              <strong className="font-semibold text-surface-900 dark:text-white">Type II</strong> report
              tests operating effectiveness across an observation period of several months. Most
              enterprise customers ask for Type II because it proves controls work over time, not just
              on the day of the audit.
            </p>
          </div>
        </div>
      </section>

      {/* ====================== Trust Services Criteria ====================== */}
      <section className="border-y border-surface-200 bg-surface-50 dark:border-surface-800 dark:bg-surface-900/40">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <SectionEyebrow>Key requirements</SectionEyebrow>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-surface-900 dark:text-white">
              The five Trust Services Criteria
            </h2>
            <p className="mt-4 text-base leading-relaxed text-surface-700 dark:text-surface-300">
              Every SOC 2 report is built on the Trust Services Criteria. The Security criterion (the
              common criteria) is mandatory; the other four are selected based on the commitments you
              make to your customers. ComplyEasy AI maps your environment to each criterion you choose.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trustCriteria.map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.name}
                  className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-surface-700 dark:bg-surface-900"
                >
                  <span className="inline-flex rounded-xl bg-brand-50 p-3 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-surface-900 dark:text-white">
                    {c.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-surface-600 dark:text-surface-400">
                    {c.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ====================== How it works ====================== */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <SectionEyebrow>How it works</SectionEyebrow>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-surface-900 dark:text-white">
            From scoping to a clean SOC 2 report
          </h2>
          <p className="mt-4 text-base leading-relaxed text-surface-700 dark:text-surface-300">
            A SOC 2 program follows a predictable path. ComplyEasy AI automates the repetitive parts so
            your team spends its time on decisions, not data entry.
          </p>
        </div>

        <ol className="mt-12 grid gap-8 md:grid-cols-2">
          {howToSteps.map((item) => (
            <li
              key={item.step}
              className="flex gap-5 rounded-2xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-900"
            >
              <span className="text-2xl font-bold text-gradient" aria-hidden="true">
                {item.step}
              </span>
              <div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-surface-600 dark:text-surface-400">
                  {item.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ====================== Common challenges ====================== */}
      <section className="border-y border-surface-200 bg-surface-50 dark:border-surface-800 dark:bg-surface-900/40">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <SectionEyebrow>Common challenges</SectionEyebrow>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-surface-900 dark:text-white">
              Why SOC 2 is hard to do manually
            </h2>
            <p className="mt-4 text-base leading-relaxed text-surface-700 dark:text-surface-300">
              Most teams underestimate SOC 2 because the work is less about a single audit and more
              about sustaining a control environment. These are the recurring pain points the platform
              is designed to remove.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {[
              {
                title: 'Manual evidence collection',
                body: 'Gathering screenshots and exports across dozens of tools is slow, error-prone, and stale by the time the audit arrives. Evidence has to be re-collected for every reporting period.',
              },
              {
                title: 'Control drift between audits',
                body: 'Controls that passed last quarter quietly break — an MFA exception, a public storage bucket, a lapsed access review. Without continuous monitoring, drift is only discovered during fieldwork.',
              },
              {
                title: 'Mapping controls to criteria',
                body: 'Translating real infrastructure into the Trust Services Criteria and their points of focus is ambiguous work that is easy to get wrong and hard to keep current as systems change.',
              },
              {
                title: 'Sustaining Type II over time',
                body: 'A Type II report demands that controls operate effectively across months. Demonstrating that continuity by hand means tracking evidence on a calendar and hoping nothing slips.',
              },
              {
                title: 'Overlapping framework requirements',
                body: 'Teams pursuing SOC 2 plus ISO 27001 or HIPAA often duplicate effort, collecting the same evidence multiple times because nothing maps shared controls across standards.',
              },
              {
                title: 'Ownership and accountability gaps',
                body: 'When no system assigns owners and deadlines to failing controls, remediation stalls and the same findings reappear audit after audit.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-900"
              >
                <h3 className="flex items-start gap-3 text-lg font-semibold text-surface-900 dark:text-white">
                  <AlertTriangle
                    className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500"
                    aria-hidden="true"
                  />
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-surface-600 dark:text-surface-400">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================== How ComplyEasy AI helps ====================== */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <SectionEyebrow>How ComplyEasy AI helps</SectionEyebrow>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-surface-900 dark:text-white">
            Automate the SOC 2 work that doesn’t need a human
          </h2>
          <p className="mt-4 text-base leading-relaxed text-surface-700 dark:text-surface-300">
            ComplyEasy AI runs the operational layer of your SOC 2 program — mapping, evidence,
            monitoring, and reporting — while your team keeps ownership of strategy and auditor
            relationships.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.title}
                className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-surface-700 dark:bg-surface-900"
              >
                <span className="inline-flex rounded-xl bg-brand-50 p-3 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-surface-900 dark:text-white">
                  {c.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-surface-600 dark:text-surface-400">
                  {c.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Product module links */}
        <div className="mt-12 rounded-2xl border border-surface-200 bg-surface-50 p-8 dark:border-surface-700 dark:bg-surface-900/40">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
            Explore the modules behind SOC 2 automation
          </h3>
          <p className="mt-2 text-sm text-surface-600 dark:text-surface-400">
            Once you sign in, these workspaces handle each part of your SOC 2 program.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: 'Compliance frameworks', to: '/compliance-frameworks' },
              { label: 'Evidence library', to: '/evidence' },
              { label: 'Controls monitoring', to: '/controls' },
              { label: 'Risk register', to: '/risks' },
              { label: 'Integrations', to: '/integrations' },
              { label: 'Audit center', to: '/audits' },
            ].map((m) => (
              <Link
                key={m.to}
                to={m.to}
                className="inline-flex items-center justify-between gap-2 rounded-xl border border-surface-200 bg-white px-4 py-3 text-sm font-medium text-surface-700 transition-colors hover:border-brand-400 hover:text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200 dark:hover:text-brand-300"
              >
                {m.label}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ====================== Related frameworks ====================== */}
      <section className="border-y border-surface-200 bg-surface-50 dark:border-surface-800 dark:bg-surface-900/40">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <SectionEyebrow>Related frameworks</SectionEyebrow>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-surface-900 dark:text-white">
              Pursue more than SOC 2 with shared evidence
            </h2>
            <p className="mt-4 text-base leading-relaxed text-surface-700 dark:text-surface-300">
              SOC 2 overlaps heavily with other security and privacy standards. Because shared controls
              are mapped once and reused, the work you do for SOC 2 accelerates these adjacent programs.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: 'ISO 27001',
                to: '/iso-27001',
                blurb: 'The international information-security standard — its Annex A controls overlap substantially with the SOC 2 common criteria.',
                icon: Lock,
              },
              {
                name: 'HIPAA',
                to: '/hipaa',
                blurb: 'Administrative, physical, and technical safeguards for protected health information that reuse much of your SOC 2 security work.',
                icon: FileCheck,
              },
              {
                name: 'GRC platform',
                to: '/grc',
                blurb: 'Unified governance, risk, and compliance across every framework you run, with one control library and one source of evidence.',
                icon: ClipboardCheck,
              },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <Link
                  key={f.to}
                  to={f.to}
                  className="group flex flex-col rounded-2xl border border-surface-200 bg-white p-6 shadow-sm transition-all hover:border-brand-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-surface-700 dark:bg-surface-900"
                >
                  <span className="inline-flex w-fit rounded-xl bg-brand-50 p-3 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 flex items-center gap-2 text-lg font-semibold text-surface-900 dark:text-white">
                    {f.name}
                    <ArrowRight
                      className="h-4 w-4 text-brand-600 opacity-0 transition-opacity group-hover:opacity-100 dark:text-brand-400"
                      aria-hidden="true"
                    />
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-surface-600 dark:text-surface-400">
                    {f.blurb}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ====================== FAQ ====================== */}
      <section className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <SectionEyebrow>FAQ</SectionEyebrow>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-surface-900 dark:text-white">
            SOC 2 compliance questions, answered
          </h2>
        </div>

        <dl className="mt-12 space-y-4">
          {faqItems.map((item) => (
            <div
              key={item.q}
              className="rounded-2xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-900"
            >
              <dt className="flex items-start gap-3 text-lg font-semibold text-surface-900 dark:text-white">
                <CheckCircle
                  className="mt-1 h-5 w-5 flex-shrink-0 text-brand-600 dark:text-brand-400"
                  aria-hidden="true"
                />
                {item.q}
              </dt>
              <dd className="mt-3 pl-8 text-base leading-relaxed text-surface-600 dark:text-surface-400">
                {item.a}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ====================== Closing CTA ====================== */}
      <section className="relative overflow-hidden bg-brand-950">
        <div className="absolute inset-0 mesh-gradient opacity-30" aria-hidden="true" />
        <div className="relative mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Start your SOC 2 program with ComplyEasy AI
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-brand-100">
            Map the Trust Services Criteria, automate evidence collection, and monitor controls
            continuously — so your next SOC 2 audit examines a control environment that is already
            ready.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3 text-base font-semibold text-brand-700 shadow-lg transition-colors hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-950"
            >
              Start free trial
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-7 py-3 text-base font-semibold text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
            >
              Book a demo
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default SOC2Pillar;
export { SOC2Pillar };
