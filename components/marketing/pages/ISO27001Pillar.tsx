import React from 'react';
import { Link } from 'react-router-dom';
import {
  Lock,
  ShieldCheck,
  ClipboardCheck,
  FileCheck,
  RefreshCw,
  Layers,
  Network,
  Database,
  Users,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  ScrollText,
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
  'ISO 27001 Software: Automate ISMS Certification & Annex A Controls | ComplyEasy AI';
const SEO_DESCRIPTION =
  'ISO 27001 software that automates your ISMS — Annex A control mapping, Statement of Applicability, risk treatment, and continuous evidence collection. Get certification-ready faster with ComplyEasy AI.';
const SEO_KEYWORDS =
  'ISO 27001 software, ISO 27001 compliance, ISMS software, ISO 27001 certification, Annex A controls, Statement of Applicability, ISO 27001:2022, risk treatment plan, ISO 27001 automation';

// ---------------------------------------------------------------------------
// On-page FAQ — defensible, capability-based answers an AI engine can quote
// ---------------------------------------------------------------------------
const faqItems: { q: string; a: string }[] = [
  {
    q: 'What is ISO 27001?',
    a: 'ISO/IEC 27001 is the leading international standard for information security management. It specifies the requirements for establishing, implementing, maintaining, and continually improving an Information Security Management System (ISMS) — a risk-based framework of policies, processes, and controls that protect the confidentiality, integrity, and availability of information. Organizations can be independently certified against ISO 27001 by an accredited certification body.',
  },
  {
    q: 'What is the difference between ISO 27001 and Annex A?',
    a: 'ISO 27001 is the certifiable standard that defines the ISMS requirements (Clauses 4 to 10). Annex A is a reference catalogue of information security controls attached to the standard. In the 2022 revision, Annex A contains 93 controls organized into four themes — organizational, people, physical, and technological. You select applicable controls through a risk assessment and document your choices in a Statement of Applicability.',
  },
  {
    q: 'What is a Statement of Applicability (SoA)?',
    a: 'The Statement of Applicability is a mandatory ISO 27001 document that lists every Annex A control, states whether it applies to your organization, gives the justification for inclusion or exclusion, and records its implementation status. It is one of the first artifacts an auditor reviews because it ties your risk assessment to the controls you have actually implemented.',
  },
  {
    q: 'How long does ISO 27001 certification take?',
    a: 'Most organizations reach certification in roughly three to nine months, depending on starting maturity, scope, and resources. Certification involves a two-stage external audit: a Stage 1 documentation review followed by a Stage 2 assessment of how effectively controls operate. ISO 27001 software shortens the preparation phase by automating evidence collection and gap analysis, but the audit cadence itself is set by your certification body.',
  },
  {
    q: 'What is the difference between ISO 27001 and SOC 2?',
    a: 'ISO 27001 is an international standard centered on a certifiable Information Security Management System and a risk-treatment process, resulting in a certificate from an accredited body. SOC 2 is an attestation against the AICPA Trust Services Criteria, resulting in an auditor report rather than a certificate. The two share a large portion of underlying controls, so evidence collected for one can be reused for the other.',
  },
  {
    q: 'How does ComplyEasy AI help with ISO 27001?',
    a: 'ComplyEasy AI maps your environment to the ISO 27001:2022 Annex A controls, helps build your Statement of Applicability and risk treatment plan, and automatically collects evidence on a recurring schedule through read-only integrations with tools such as AWS, GitHub, Okta, and Jira. Real-time dashboards surface control gaps before your Stage 2 audit, and evidence is organized so it can be shared directly with your certification body.',
  },
  {
    q: 'Does ISO 27001 require an internal audit and management review?',
    a: 'Yes. ISO 27001 requires a documented internal audit programme (Clause 9.2) and periodic management reviews (Clause 9.3) so leadership evaluates the performance of the ISMS. It also requires corrective action and continual improvement (Clause 10). ComplyEasy AI tracks internal audit findings, corrective actions, and review records so these mandatory clauses are evidenced and ready for assessment.',
  },
  {
    q: 'How is the ISO 27001:2022 revision different from the 2013 version?',
    a: 'The 2022 revision restructured Annex A from 114 controls across 14 domains into 93 controls across four themes (organizational, people, physical, technological) and introduced 11 new controls covering areas such as threat intelligence, cloud services, data leakage prevention, and secure coding. Organizations certified under the 2013 version were required to transition to the 2022 controls.',
  },
];

// ---------------------------------------------------------------------------
// Annex A 2022 themes
// ---------------------------------------------------------------------------
const annexThemes: { title: string; count: string; desc: string; icon: React.FC<any> }[] = [
  {
    title: 'Organizational controls',
    count: '37 controls',
    desc: 'Policies, roles, supplier relationships, threat intelligence, and information security in the cloud and across projects.',
    icon: ScrollText,
  },
  {
    title: 'People controls',
    count: '8 controls',
    desc: 'Screening, terms of employment, awareness and training, disciplinary processes, and remote-working safeguards.',
    icon: Users,
  },
  {
    title: 'Physical controls',
    count: '14 controls',
    desc: 'Secure areas, equipment protection, clear-desk and clear-screen practices, and secure disposal of media.',
    icon: ShieldCheck,
  },
  {
    title: 'Technological controls',
    count: '34 controls',
    desc: 'Access control, cryptography, logging and monitoring, secure development, data leakage prevention, and backups.',
    icon: Network,
  },
];

// ---------------------------------------------------------------------------
// Mandatory clause requirements (4–10)
// ---------------------------------------------------------------------------
const clauseRequirements: { clause: string; title: string; desc: string }[] = [
  {
    clause: 'Clause 4',
    title: 'Context of the organization',
    desc: 'Define the ISMS scope, identify interested parties, and understand the internal and external issues that affect information security.',
  },
  {
    clause: 'Clause 5',
    title: 'Leadership',
    desc: 'Secure top-management commitment, establish an information security policy, and assign clear roles and responsibilities.',
  },
  {
    clause: 'Clause 6',
    title: 'Planning',
    desc: 'Run a risk assessment, build a risk treatment plan, select Annex A controls, and produce the Statement of Applicability.',
  },
  {
    clause: 'Clause 7',
    title: 'Support',
    desc: 'Provide resources, competence, awareness, communication, and documented information to operate the ISMS.',
  },
  {
    clause: 'Clause 8',
    title: 'Operation',
    desc: 'Execute the risk treatment plan and operate the processes needed to meet information security objectives.',
  },
  {
    clause: 'Clause 9',
    title: 'Performance evaluation',
    desc: 'Monitor, measure, and analyze the ISMS through internal audits and management reviews.',
  },
  {
    clause: 'Clause 10',
    title: 'Improvement',
    desc: 'Address nonconformities with corrective action and continually improve the effectiveness of the ISMS.',
  },
];

// ---------------------------------------------------------------------------
// Common challenges
// ---------------------------------------------------------------------------
const challenges: { title: string; desc: string; icon: React.FC<any> }[] = [
  {
    title: 'Manual evidence gathering',
    desc: 'Teams burn weeks collecting screenshots, exports, and configuration snapshots by hand, only to repeat the effort at the next surveillance audit.',
    icon: FileCheck,
  },
  {
    title: 'Scoping the ISMS',
    desc: 'Drawing the ISMS boundary too wide inflates effort, while drawing it too narrow undermines the certificate. Getting scope right requires discipline.',
    icon: Layers,
  },
  {
    title: 'Keeping the SoA current',
    desc: 'The Statement of Applicability drifts out of date as systems change, leaving the justification for each control inconsistent with reality.',
    icon: ClipboardCheck,
  },
  {
    title: 'Demonstrating operating effectiveness',
    desc: 'A Stage 2 audit examines whether controls actually operate over time — not just that a policy exists on paper.',
    icon: RefreshCw,
  },
  {
    title: 'Sustaining the 3-year cycle',
    desc: 'Certification is followed by annual surveillance audits and recertification every three years, so compliance must be continuous, not a one-off project.',
    icon: AlertTriangle,
  },
  {
    title: 'Mapping to other frameworks',
    desc: 'Organizations pursuing SOC 2, GDPR, or HIPAA alongside ISO 27001 struggle to reuse overlapping evidence across programs.',
    icon: Network,
  },
];

// ---------------------------------------------------------------------------
// Sibling pillar pages for internal linking
// ---------------------------------------------------------------------------
const siblingPillars: { name: string; path: string; blurb: string }[] = [
  { name: 'SOC 2 compliance', path: '/soc2-compliance', blurb: 'Trust Services Criteria readiness with shared, reusable evidence.' },
  { name: 'GDPR compliance', path: '/gdpr', blurb: 'RoPA, DPIAs, and data-subject request workflows for EU privacy.' },
  { name: 'HIPAA compliance', path: '/hipaa', blurb: 'Administrative, physical, and technical safeguard tracking.' },
];

const cardBase =
  'rounded-2xl border border-surface-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-surface-700 dark:bg-surface-900';

const ISO27001Pillar: React.FC = () => {
  const pageUrl = 'https://complyeasyai.com/iso-27001';

  return (
    <MarketingLayout>
      <Seo
        title={SEO_TITLE}
        description={SEO_DESCRIPTION}
        canonicalPath="/iso-27001"
        keywords={SEO_KEYWORDS}
      />
      <JsonLd data={softwareApplicationSchema()} />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: 'https://complyeasyai.com/' },
          { name: 'ISO 27001 software', url: pageUrl },
        ])}
      />
      <JsonLd data={faqSchema(faqItems.map((f) => ({ q: f.q, a: f.a })))} />

      {/* ============================== Hero ============================== */}
      <section className="relative overflow-hidden mesh-gradient">
        <div className="absolute inset-0 dot-pattern opacity-40" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-8 text-sm">
            <ol className="flex items-center gap-2 text-surface-500 dark:text-surface-400">
              <li>
                <Link to="/" className="transition-colors hover:text-brand-600 dark:hover:text-brand-400">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="font-medium text-surface-700 dark:text-surface-200">ISO 27001 software</li>
            </ol>
          </nav>

          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700 dark:border-brand-800 dark:bg-brand-950/50 dark:text-brand-300">
              <Lock className="h-4 w-4" aria-hidden="true" />
              Information Security Management
            </span>

            <h1 className="mt-6 text-4xl font-bold tracking-tight text-surface-900 sm:text-5xl lg:text-6xl dark:text-white">
              <span className="text-gradient">ISO 27001 software</span> to automate your ISMS
            </h1>

            {/* Answer-first quotable definition */}
            <p className="mt-6 text-lg leading-relaxed text-surface-600 dark:text-surface-300">
              ISO 27001 software automates the work of building and running an Information Security
              Management System (ISMS) — mapping your environment to Annex A controls, generating the
              Statement of Applicability and risk treatment plan, and continuously collecting the
              evidence an accredited auditor needs for certification. ComplyEasy AI uses autonomous AI
              agents to keep your ISMS audit-ready across the full three-year certification cycle.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-7 py-3 text-base font-semibold text-white shadow-lg shadow-brand-500/20 transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-surface-950"
              >
                Start free trial
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-full border border-surface-300 bg-white px-7 py-3 text-base font-semibold text-surface-700 transition-colors hover:border-brand-400 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-surface-600 dark:bg-surface-900 dark:text-surface-200 dark:hover:text-brand-400"
              >
                Book a demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ====================== What is ISO 27001 ====================== */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-white">
              What is ISO 27001 compliance?
            </h2>
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-surface-600 dark:text-surface-300">
              <p>
                ISO/IEC 27001 is the world&apos;s most widely recognized international standard for
                information security. Rather than prescribing a fixed checklist, it requires
                organizations to operate a risk-based{' '}
                <strong className="font-semibold text-surface-900 dark:text-white">
                  Information Security Management System (ISMS)
                </strong>{' '}
                — a living set of policies, processes, and controls that protect the confidentiality,
                integrity, and availability of information.
              </p>
              <p>
                Compliance means establishing that ISMS, running a documented risk assessment,
                selecting and implementing controls from Annex A, and demonstrating to an accredited
                certification body that those controls operate effectively over time. The current
                edition, ISO/IEC 27001:2022, organizes 93 Annex A controls into four themes and
                emphasizes continual improvement through internal audits and management reviews.
              </p>
              <p>
                Certification signals to customers, partners, and regulators that information security
                is managed systematically — which is why ISO 27001 is frequently a prerequisite in
                enterprise procurement and vendor due-diligence questionnaires.
              </p>
            </div>
          </div>

          <aside className="rounded-2xl border border-brand-200 bg-brand-50/60 p-6 dark:border-brand-900 dark:bg-brand-950/30">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">
              At a glance
            </h3>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="font-semibold text-surface-900 dark:text-white">Standard</dt>
                <dd className="text-surface-600 dark:text-surface-300">ISO/IEC 27001:2022</dd>
              </div>
              <div>
                <dt className="font-semibold text-surface-900 dark:text-white">Core requirement</dt>
                <dd className="text-surface-600 dark:text-surface-300">
                  A certifiable Information Security Management System (ISMS)
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-surface-900 dark:text-white">Annex A controls</dt>
                <dd className="text-surface-600 dark:text-surface-300">93 controls across 4 themes</dd>
              </div>
              <div>
                <dt className="font-semibold text-surface-900 dark:text-white">Result</dt>
                <dd className="text-surface-600 dark:text-surface-300">
                  A certificate from an accredited body, valid for three years
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      {/* ====================== Annex A themes ====================== */}
      <section className="border-y border-surface-200 bg-surface-50 dark:border-surface-800 dark:bg-surface-900/40">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-white">
              The Annex A controls (2022)
            </h2>
            <p className="mt-4 text-lg text-surface-600 dark:text-surface-300">
              ISO 27001:2022 groups its 93 reference controls into four themes. You determine which
              apply to your organization through a risk assessment and record those decisions in the
              Statement of Applicability.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {annexThemes.map((theme) => (
              <div key={theme.title} className={cardBase}>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                  <theme.icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-surface-900 dark:text-white">
                  {theme.title}
                </h3>
                <p className="mt-1 text-sm font-medium text-brand-600 dark:text-brand-400">
                  {theme.count}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-surface-600 dark:text-surface-300">
                  {theme.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================== Key requirements / How it works ====================== */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-white">
            Key requirements: how ISO 27001 works
          </h2>
          <p className="mt-4 text-lg text-surface-600 dark:text-surface-300">
            The certifiable requirements live in Clauses 4 through 10 of the standard. Together they
            describe the full lifecycle of an ISMS — from defining scope to continually improving it.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {clauseRequirements.map((req) => (
            <div key={req.clause} className={cardBase}>
              <div className="flex items-start gap-4">
                <span className="mt-0.5 inline-flex shrink-0 items-center rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white">
                  {req.clause}
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
                    {req.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-surface-600 dark:text-surface-300">
                    {req.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-surface-200 bg-surface-50 p-8 dark:border-surface-700 dark:bg-surface-900/40">
          <h3 className="text-xl font-semibold text-surface-900 dark:text-white">
            The path to certification
          </h3>
          <ol className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { step: '1', title: 'Define scope', desc: 'Set the ISMS boundary and gain leadership commitment.' },
              { step: '2', title: 'Assess & treat risk', desc: 'Identify risks, select Annex A controls, and build the SoA.' },
              { step: '3', title: 'Operate & evidence', desc: 'Implement controls and collect evidence of their operation.' },
              { step: '4', title: 'Audit & certify', desc: 'Pass Stage 1 and Stage 2 audits, then maintain surveillance.' },
            ].map((s) => (
              <li key={s.step} className="relative">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                  {s.step}
                </span>
                <h4 className="mt-3 font-semibold text-surface-900 dark:text-white">{s.title}</h4>
                <p className="mt-1 text-sm text-surface-600 dark:text-surface-300">{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ====================== Common challenges ====================== */}
      <section className="border-y border-surface-200 bg-surface-50 dark:border-surface-800 dark:bg-surface-900/40">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-white">
              Common ISO 27001 challenges
            </h2>
            <p className="mt-4 text-lg text-surface-600 dark:text-surface-300">
              Most certification programs stall on the same recurring obstacles. Knowing them in
              advance is the first step to a smoother audit.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {challenges.map((c) => (
              <div key={c.title} className={cardBase}>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent-100 text-accent-700 dark:bg-accent-950/40 dark:text-accent-300">
                  <c.icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-surface-900 dark:text-white">
                  {c.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-surface-600 dark:text-surface-300">
                  {c.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================== How ComplyEasy AI helps ====================== */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-white">
            How ComplyEasy AI helps you achieve ISO 27001
          </h2>
          <p className="mt-4 text-lg text-surface-600 dark:text-surface-300">
            ComplyEasy AI runs the operational backbone of your ISMS so your team can focus on risk
            decisions instead of evidence chasing. Every module below is part of the authenticated
            platform.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: ClipboardCheck,
              title: 'Annex A control mapping',
              desc: 'AI agents map your cloud, identity, and code environments to all 93 ISO 27001:2022 Annex A controls and keep that mapping current as systems change.',
              to: '/app/frameworks',
              cta: 'Explore frameworks',
            },
            {
              icon: ScrollText,
              title: 'Statement of Applicability',
              desc: 'Generate and maintain your SoA and risk treatment plan, with the justification for each included or excluded control recorded alongside its status.',
              to: '/app/controls',
              cta: 'Manage controls',
            },
            {
              icon: Database,
              title: 'Continuous evidence collection',
              desc: 'Connect AWS, GitHub, Okta, Jira, and more with read-only access; evidence is collected on a recurring schedule with a versioned audit trail.',
              to: '/app/evidence',
              cta: 'View evidence',
            },
            {
              icon: AlertTriangle,
              title: 'Risk register & treatment',
              desc: 'Run the Clause 6 risk assessment in a structured register, link risks to Annex A controls, and track treatment decisions through to closure.',
              to: '/app/risks',
              cta: 'Open risk register',
            },
            {
              icon: RefreshCw,
              title: 'Internal audit & reviews',
              desc: 'Track internal audit findings, corrective actions, and management reviews so the Clause 9 and Clause 10 requirements are always evidenced.',
              to: '/app/audits',
              cta: 'Run internal audits',
            },
            {
              icon: ShieldCheck,
              title: 'Audit-ready dashboards',
              desc: 'Real-time dashboards surface control gaps before your Stage 2 assessment, and evidence packages export cleanly for your certification body.',
              to: '/app/dashboard',
              cta: 'See the dashboard',
            },
          ].map((m) => (
            <div key={m.title} className={`${cardBase} flex flex-col`}>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                <m.icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-surface-900 dark:text-white">
                {m.title}
              </h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-surface-600 dark:text-surface-300">
                {m.desc}
              </p>
              <Link
                to={m.to}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
              >
                {m.cta}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          ))}
        </div>

        {/* Cross-framework benefit */}
        <div className="mt-12 rounded-2xl border border-surface-200 bg-surface-50 p-8 dark:border-surface-700 dark:bg-surface-900/40">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <Layers className="h-8 w-8 shrink-0 text-brand-600 dark:text-brand-400" aria-hidden="true" />
            <div>
              <h3 className="text-xl font-semibold text-surface-900 dark:text-white">
                One ISMS, many frameworks
              </h3>
              <p className="mt-2 text-surface-600 dark:text-surface-300">
                ISO 27001 shares a large portion of its controls with other standards. ComplyEasy AI
                maps overlapping controls once and reuses evidence across programs — so the work you do
                for ISO 27001 also advances your{' '}
                {siblingPillars.map((p, i) => (
                  <React.Fragment key={p.path}>
                    <Link
                      to={p.path}
                      className="font-semibold text-brand-600 underline-offset-2 hover:underline dark:text-brand-400"
                    >
                      {p.name}
                    </Link>
                    {i < siblingPillars.length - 2 ? ', ' : i === siblingPillars.length - 2 ? ', and ' : ''}
                  </React.Fragment>
                ))}{' '}
                programs.
              </p>
            </div>
          </div>
        </div>

        {/* Sibling pillar cards */}
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {siblingPillars.map((p) => (
            <Link
              key={p.path}
              to={p.path}
              className={`${cardBase} group flex flex-col`}
            >
              <h3 className="text-lg font-semibold text-surface-900 group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400">
                {p.name}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-surface-600 dark:text-surface-300">
                {p.blurb}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 dark:text-brand-400">
                Learn more
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ====================== FAQ ====================== */}
      <section className="border-y border-surface-200 bg-surface-50 dark:border-surface-800 dark:bg-surface-900/40">
        <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-white">
            ISO 27001 frequently asked questions
          </h2>
          <dl className="mt-12 space-y-8">
            {faqItems.map((item) => (
              <div
                key={item.q}
                className="rounded-2xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-900"
              >
                <dt className="flex items-start gap-3 text-lg font-semibold text-surface-900 dark:text-white">
                  <CheckCircle className="mt-1 h-5 w-5 shrink-0 text-brand-600 dark:text-brand-400" aria-hidden="true" />
                  {item.q}
                </dt>
                <dd className="mt-3 pl-8 leading-relaxed text-surface-600 dark:text-surface-300">
                  {item.a}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ====================== Closing CTA ====================== */}
      <section className="relative overflow-hidden bg-brand-950">
        <div className="absolute inset-0 mesh-gradient opacity-30" aria-hidden="true" />
        <div className="relative mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Get ISO 27001 certification-ready faster
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-brand-100">
            Stand up your ISMS, map Annex A controls, and let autonomous AI agents keep your evidence
            current across the full three-year certification cycle.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-base font-semibold text-brand-700 shadow-lg transition-colors hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-950"
            >
              Start free trial
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-7 py-3 text-base font-semibold text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
            >
              Book a demo
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default ISO27001Pillar;
export { ISO27001Pillar };
