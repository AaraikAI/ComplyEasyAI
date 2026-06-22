import React from 'react';
import { Link } from 'react-router-dom';
import {
  ScrollText,
  ShieldCheck,
  Compass,
  AlertTriangle,
  ClipboardCheck,
  Workflow,
  Layers,
  BarChart3,
  FileSearch,
  Users,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import MarketingLayout from '../MarketingLayout';
import Seo from '../../seo/Seo';
import JsonLd from '../../seo/JsonLd';
import { breadcrumbSchema, faqSchema, softwareApplicationSchema } from '../../seo/siteSchema';

// ---------------------------------------------------------------------------
// SEO copy
// ---------------------------------------------------------------------------
const SEO_TITLE =
  'GRC Software: Governance, Risk & Compliance Automation | ComplyEasy AI';
const SEO_DESCRIPTION =
  'GRC software unifies governance, risk management, and compliance in one platform. Learn how AI-native GRC software automates risk registers, control mapping, and continuous compliance across SOC 2, ISO 27001, GDPR, and the EU AI Act.';
const SEO_KEYWORDS =
  'GRC software, governance risk and compliance, GRC platform, risk management software, compliance automation, integrated risk management, GRC tool, continuous compliance, control mapping, risk register software';

// ---------------------------------------------------------------------------
// The three GRC pillars
// ---------------------------------------------------------------------------
const PILLARS: { name: string; icon: React.FC<any>; blurb: string }[] = [
  {
    name: 'Governance',
    icon: Compass,
    blurb:
      'The policies, accountability structures, and oversight that align security and compliance work with business objectives. Governance defines who owns each control, how decisions are made, and how leadership demonstrates due diligence.',
  },
  {
    name: 'Risk',
    icon: AlertTriangle,
    blurb:
      'The continuous identification, assessment, treatment, and monitoring of threats to confidentiality, integrity, availability, and regulatory standing. Risk management quantifies exposure so leaders can prioritize remediation by impact and likelihood.',
  },
  {
    name: 'Compliance',
    icon: ClipboardCheck,
    blurb:
      'The evidence that controls operate as designed against the frameworks and regulations an organization is held to. Compliance turns governance and risk decisions into auditable, defensible proof for auditors, regulators, and customers.',
  },
];

// ---------------------------------------------------------------------------
// Core capabilities of a GRC platform
// ---------------------------------------------------------------------------
const CAPABILITIES: { title: string; icon: React.FC<any>; desc: string }[] = [
  {
    title: 'Unified control library',
    icon: Layers,
    desc: 'A single catalog of controls mapped to every framework you pursue, so overlapping requirements are satisfied once and shared across SOC 2, ISO 27001, GDPR, and more.',
  },
  {
    title: 'Risk register and assessments',
    icon: AlertTriangle,
    desc: 'A living inventory of risks scored by likelihood and impact, with treatment plans, owners, and residual-risk tracking that updates as controls change.',
  },
  {
    title: 'Continuous evidence collection',
    icon: RefreshCw,
    desc: 'Read-only integrations pull configuration and activity data from your stack on a schedule, keeping control evidence current instead of scrambling before an audit.',
  },
  {
    title: 'Policy and document management',
    icon: FileSearch,
    desc: 'Versioned policies linked to the controls they enforce, with review cycles, approvals, and acknowledgement tracking across the workforce.',
  },
  {
    title: 'Workflows and remediation',
    icon: Workflow,
    desc: 'Tasks, approvals, and remediation routed to owners with due dates and escalation, so findings move to closure rather than sitting in a spreadsheet.',
  },
  {
    title: 'Reporting and dashboards',
    icon: BarChart3,
    desc: 'Real-time posture across frameworks, risks, and controls, with exportable reports for leadership, auditors, and the board.',
  },
];

// ---------------------------------------------------------------------------
// Common challenges
// ---------------------------------------------------------------------------
const CHALLENGES: { title: string; desc: string }[] = [
  {
    title: 'Fragmented tooling',
    desc: 'Risk lives in one spreadsheet, policies in a wiki, and audit evidence in shared drives. Without a system of record, nothing reconciles and reporting becomes a manual, error-prone exercise.',
  },
  {
    title: 'Point-in-time compliance',
    desc: 'Certifications are earned in an audit window and then drift. Configurations change, access expands, and controls quietly break between assessments — leaving real exposure that the last report no longer reflects.',
  },
  {
    title: 'Duplicated effort across frameworks',
    desc: 'Many frameworks share a large share of their controls, yet teams collect the same evidence again for each standard because their tools cannot map requirements to a common control set.',
  },
  {
    title: 'Disconnected risk and compliance',
    desc: 'Risk assessments are produced for management while compliance evidence is produced for auditors, with no shared link between the risk a control mitigates and the proof that it works.',
  },
  {
    title: 'Manual, costly audit prep',
    desc: 'When evidence is gathered by hand, audit preparation consumes weeks of engineering and security time, and the burden grows with every new framework added to the program.',
  },
];

// ---------------------------------------------------------------------------
// On-page FAQ — defensible, capability-based answers an AI engine can quote
// ---------------------------------------------------------------------------
const FAQ: { q: string; a: string }[] = [
  {
    q: 'What is GRC software?',
    a: 'GRC software is a platform that unifies governance, risk management, and compliance into a single system of record. It centralizes policies, control libraries, risk registers, and audit evidence so an organization can align security work with business objectives, manage risk consistently, and prove compliance against frameworks like SOC 2, ISO 27001, GDPR, and the EU AI Act from one place.',
  },
  {
    q: 'What does GRC stand for?',
    a: 'GRC stands for Governance, Risk, and Compliance. Governance is the oversight and accountability that aligns programs with business goals; Risk is the identification, assessment, and treatment of threats to the organization; and Compliance is the evidence that controls operate as required by applicable frameworks and regulations.',
  },
  {
    q: 'How is GRC software different from a compliance tool?',
    a: 'A compliance tool focuses on collecting evidence and passing audits for specific frameworks. GRC software is broader: it adds governance (policy and accountability) and integrated risk management (a risk register, assessments, and treatment plans) and links all three so the risk a control mitigates is connected to the evidence that the control works. ComplyEasy AI combines both — framework automation plus integrated risk and governance.',
  },
  {
    q: 'What are the three pillars of GRC?',
    a: 'The three pillars are Governance, Risk, and Compliance. Governance sets policies, ownership, and oversight; Risk management identifies and treats threats based on likelihood and impact; and Compliance demonstrates that controls meet the requirements of frameworks and regulations. Effective GRC keeps these three connected rather than managed in isolation.',
  },
  {
    q: 'Who uses GRC software?',
    a: 'GRC software is used by security, compliance, risk, legal, and IT teams, as well as the executives and boards accountable for oversight. Common roles include CISOs, compliance managers, risk officers, internal auditors, and the engineering owners responsible for the controls being monitored.',
  },
  {
    q: 'Can GRC software help with multiple frameworks at once?',
    a: 'Yes. Mature GRC platforms maintain a unified control library and map shared controls across frameworks, so a single piece of evidence can satisfy overlapping requirements in SOC 2, ISO 27001, GDPR, HIPAA, and others. This lets an organization run several frameworks in parallel while surfacing only the requirements unique to each one.',
  },
  {
    q: 'How does AI improve GRC software?',
    a: 'AI extends GRC software beyond static tracking. ComplyEasy AI uses autonomous agents to collect evidence continuously, map incoming data to the right controls, surface control drift and gaps before an audit, and help draft policies and risk assessments. Critical actions support human-in-the-loop review so teams retain oversight of automated decisions.',
  },
  {
    q: 'Does ComplyEasy AI support continuous compliance?',
    a: 'Yes. Read-only integrations keep control evidence current on a recurring schedule rather than only at audit time, and dashboards reflect live posture across frameworks and risks. This shifts the program from point-in-time certification toward continuous compliance, where drift is detected and remediated as it happens.',
  },
];

const SECTION_HEADING =
  'text-3xl font-bold tracking-tight text-surface-900 dark:text-white sm:text-4xl';
const LEAD = 'mt-5 text-lg leading-relaxed text-surface-600 dark:text-surface-300';
const PROSE = 'text-base leading-relaxed text-surface-600 dark:text-surface-300';

const GRCPillar: React.FC = () => {
  return (
    <MarketingLayout>
      <Seo
        title={SEO_TITLE}
        description={SEO_DESCRIPTION}
        canonicalPath="/grc"
        keywords={SEO_KEYWORDS}
        ogType="article"
      />
      <JsonLd data={softwareApplicationSchema()} />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: 'https://complyeasyai.com/' },
          { name: 'GRC Software', url: 'https://complyeasyai.com/grc' },
        ])}
      />
      <JsonLd data={faqSchema(FAQ)} />

      {/* ============================== Hero ============================== */}
      <section className="relative overflow-hidden mesh-gradient">
        <div className="absolute inset-0 dot-pattern opacity-40" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400">
              <li>
                <Link to="/" className="transition-colors hover:text-brand-600 dark:hover:text-brand-400">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="font-medium text-surface-700 dark:text-surface-200">GRC Software</li>
            </ol>
          </nav>

          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700 dark:border-brand-800 dark:bg-brand-950/50 dark:text-brand-300">
            <ScrollText className="h-4 w-4" aria-hidden="true" />
            Governance, Risk &amp; Compliance
          </div>

          <h1 className="mt-6 max-w-4xl text-4xl font-extrabold tracking-tight text-surface-900 dark:text-white sm:text-5xl lg:text-6xl">
            <span className="text-gradient">GRC software</span> that unifies governance, risk, and
            compliance
          </h1>

          {/* Answer-first, quotable definition */}
          <p className="mt-6 max-w-3xl text-xl leading-relaxed text-surface-700 dark:text-surface-200">
            GRC software is a single platform that brings governance, risk management, and compliance
            together so an organization can align security work with business goals, manage risk
            consistently, and prove compliance against frameworks like SOC 2, ISO 27001, and GDPR from
            one system of record.
          </p>
          <p className={`${LEAD} max-w-3xl`}>
            ComplyEasy AI is AI-native GRC software: autonomous agents collect evidence continuously,
            map controls across every framework you pursue, and keep your risk register and audit
            posture current — replacing fragmented spreadsheets, wikis, and shared drives with one
            connected program.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-7 py-3 text-base font-semibold text-white shadow-lg shadow-brand-500/25 transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-surface-950"
            >
              Start free trial
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-surface-300 bg-white px-7 py-3 text-base font-semibold text-surface-800 transition-colors hover:border-brand-400 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100 dark:hover:text-brand-400"
            >
              Book a demo
            </Link>
          </div>
        </div>
      </section>

      {/* ====================== What is GRC / definition ====================== */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h2 className={SECTION_HEADING}>What is GRC software?</h2>
          <p className={LEAD}>
            GRC software is a platform that consolidates governance, risk management, and compliance
            into a single system of record. Instead of tracking policies in a wiki, risks in a
            spreadsheet, and audit evidence in shared drives, a GRC platform connects all three into
            one model: controls map to the frameworks they satisfy, risks map to the controls that
            mitigate them, and evidence proves those controls operate as designed.
          </p>
          <p className={`${PROSE} mt-5`}>
            The discipline of GRC emerged because governance, risk, and compliance are deeply
            interdependent. A governance decision — say, requiring multi-factor authentication —
            creates a control, that control mitigates an access-related risk, and the compliance
            program must produce evidence that the control is in place and effective. When these are
            managed in separate tools, organizations duplicate effort, lose traceability, and discover
            gaps only during an audit. GRC software exists to keep them connected and continuously
            current.
          </p>
        </div>

        {/* Three pillars */}
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {PILLARS.map((pillar) => (
            <div
              key={pillar.name}
              className="rounded-2xl border border-surface-200 bg-white p-7 shadow-sm transition-shadow hover:shadow-md dark:border-surface-800 dark:bg-surface-900"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
                <pillar.icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-surface-900 dark:text-white">
                {pillar.name}
              </h3>
              <p className={`${PROSE} mt-3`}>{pillar.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ====================== Key capabilities ====================== */}
      <section className="border-y border-surface-200 bg-surface-50 dark:border-surface-800 dark:bg-surface-900/40">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className={SECTION_HEADING}>Key capabilities of a GRC platform</h2>
            <p className={LEAD}>
              A complete GRC platform does more than store documents. It is the operational backbone
              that ties policies, controls, risks, and evidence together and keeps them moving. These
              are the capabilities to expect when evaluating GRC software.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map((cap) => (
              <div
                key={cap.title}
                className="rounded-2xl border border-surface-200 bg-white p-7 shadow-sm dark:border-surface-800 dark:bg-surface-950"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
                  <cap.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-surface-900 dark:text-white">
                  {cap.title}
                </h3>
                <p className={`${PROSE} mt-2`}>{cap.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================== How it works ====================== */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h2 className={SECTION_HEADING}>How GRC software works</h2>
          <p className={LEAD}>
            A modern GRC program follows a continuous loop. Rather than a once-a-year project, the
            platform keeps governance, risk, and compliance synchronized as your environment changes.
          </p>
        </div>

        <ol className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              step: '01',
              title: 'Establish governance',
              desc: 'Define policies, assign control owners, and select the frameworks the organization must meet. This sets the scope and accountability for the program.',
            },
            {
              step: '02',
              title: 'Map controls and risks',
              desc: 'Build a unified control library, link each control to the frameworks it satisfies, and connect controls to the risks they mitigate in a central risk register.',
            },
            {
              step: '03',
              title: 'Collect evidence continuously',
              desc: 'Connect read-only integrations so the platform gathers configuration and activity data on a schedule, keeping evidence current between audits.',
            },
            {
              step: '04',
              title: 'Monitor, report, and remediate',
              desc: 'Dashboards show live posture; drift and gaps generate remediation tasks routed to owners; reports are exported for auditors, leadership, and the board.',
            },
          ].map((item) => (
            <li
              key={item.step}
              className="rounded-2xl border border-surface-200 bg-white p-7 shadow-sm dark:border-surface-800 dark:bg-surface-900"
            >
              <span className="text-sm font-bold text-gradient-accent">{item.step}</span>
              <h3 className="mt-3 text-lg font-semibold text-surface-900 dark:text-white">
                {item.title}
              </h3>
              <p className={`${PROSE} mt-2`}>{item.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ====================== Common challenges ====================== */}
      <section className="border-y border-surface-200 bg-surface-50 dark:border-surface-800 dark:bg-surface-900/40">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className={SECTION_HEADING}>Common GRC challenges</h2>
            <p className={LEAD}>
              The reasons organizations adopt dedicated GRC software almost always trace back to the
              same recurring problems with manual, disconnected programs.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {CHALLENGES.map((challenge) => (
              <div
                key={challenge.title}
                className="flex gap-4 rounded-2xl border border-surface-200 bg-white p-6 dark:border-surface-800 dark:bg-surface-950"
              >
                <AlertTriangle
                  className="mt-1 h-5 w-5 flex-shrink-0 text-amber-500"
                  aria-hidden="true"
                />
                <div>
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
                    {challenge.title}
                  </h3>
                  <p className={`${PROSE} mt-2`}>{challenge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================== How ComplyEasy AI helps ====================== */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h2 className={SECTION_HEADING}>How ComplyEasy AI helps</h2>
          <p className={LEAD}>
            ComplyEasy AI is GRC software built around autonomous AI agents. It does not just track
            governance, risk, and compliance — it operates them, collecting evidence, mapping controls,
            and surfacing drift continuously so your team can focus on decisions instead of busywork.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-surface-200 bg-white p-7 dark:border-surface-800 dark:bg-surface-900">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-surface-900 dark:text-white">
              Unified compliance across every framework
            </h3>
            <p className={`${PROSE} mt-2`}>
              Map a single control library to all the frameworks you pursue and reuse evidence across
              overlapping requirements. The{' '}
              <Link to="/dashboard" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
                compliance dashboard
              </Link>{' '}
              and{' '}
              <Link to="/frameworks" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
                frameworks workspace
              </Link>{' '}
              keep posture visible in real time.
            </p>
          </div>

          <div className="rounded-2xl border border-surface-200 bg-white p-7 dark:border-surface-800 dark:bg-surface-900">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-surface-900 dark:text-white">
              Integrated risk management
            </h3>
            <p className={`${PROSE} mt-2`}>
              Maintain a living risk register with scored assessments and treatment plans in the{' '}
              <Link to="/risks" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
                risk management module
              </Link>
              , with each risk linked to the controls that mitigate it so risk and compliance stay in
              sync.
            </p>
          </div>

          <div className="rounded-2xl border border-surface-200 bg-white p-7 dark:border-surface-800 dark:bg-surface-900">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
              <RefreshCw className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-surface-900 dark:text-white">
              Continuous evidence and integrations
            </h3>
            <p className={`${PROSE} mt-2`}>
              Connect your stack with read-only access in the{' '}
              <Link to="/integrations" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
                integrations hub
              </Link>{' '}
              and let agents collect{' '}
              <Link to="/evidence" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
                evidence
              </Link>{' '}
              on a recurring schedule, maintaining a versioned audit trail for every artifact.
            </p>
          </div>

          <div className="rounded-2xl border border-surface-200 bg-white p-7 dark:border-surface-800 dark:bg-surface-900">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
              <Users className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-surface-900 dark:text-white">
              Governance, policies, and oversight
            </h3>
            <p className={`${PROSE} mt-2`}>
              Manage versioned policies, control owners, and review cycles in the{' '}
              <Link to="/policies" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
                policy center
              </Link>
              . Customer data is encrypted at rest and in transit, governed by role-based access
              control, and captured in a full audit trail — with bring-your-own-key encryption and
              just-in-time privileged access supported by the architecture.
            </p>
          </div>
        </div>

        {/* Sibling pillar links */}
        <div className="mt-14 rounded-2xl border border-brand-200 bg-brand-50/60 p-8 dark:border-brand-900 dark:bg-brand-950/30">
          <h3 className="text-xl font-semibold text-surface-900 dark:text-white">
            Explore related frameworks and topics
          </h3>
          <p className={`${PROSE} mt-2`}>
            GRC is the umbrella; these pillar pages go deep on the frameworks a GRC program most often
            covers.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {[
              { label: 'SOC 2 compliance', to: '/frameworks/soc-2' },
              { label: 'ISO 27001', to: '/frameworks/iso-27001' },
              { label: 'GDPR', to: '/frameworks/gdpr' },
              { label: 'EU AI Act', to: '/frameworks/eu-ai-act' },
              { label: 'NIST AI RMF', to: '/frameworks/nist-ai-rmf' },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="inline-flex items-center gap-1.5 rounded-full border border-surface-300 bg-white px-4 py-2 text-sm font-medium text-surface-700 transition-colors hover:border-brand-400 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200 dark:hover:text-brand-400"
              >
                {item.label}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ====================== FAQ ====================== */}
      <section className="border-t border-surface-200 bg-surface-50 dark:border-surface-800 dark:bg-surface-900/40">
        <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
          <h2 className={`${SECTION_HEADING} text-center`}>Frequently asked questions</h2>
          <p className={`${LEAD} text-center mx-auto max-w-2xl`}>
            Common questions about GRC software, governance, risk, and compliance.
          </p>

          <dl className="mt-14 space-y-4">
            {FAQ.map((item) => (
              <div
                key={item.q}
                className="rounded-2xl border border-surface-200 bg-white p-6 dark:border-surface-800 dark:bg-surface-950"
              >
                <dt className="text-lg font-semibold text-surface-900 dark:text-white">{item.q}</dt>
                <dd className={`${PROSE} mt-3`}>{item.a}</dd>
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
            Run governance, risk, and compliance from one platform
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-brand-100">
            Replace fragmented spreadsheets and shared drives with AI-native GRC software that keeps
            your controls, risks, and evidence continuously current.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-base font-semibold text-brand-700 shadow-lg transition-colors hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-950"
            >
              Start free trial
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
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

export default GRCPillar;
export { GRCPillar };
