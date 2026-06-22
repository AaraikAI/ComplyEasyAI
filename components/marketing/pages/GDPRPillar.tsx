import React from 'react';
import { Link } from 'react-router-dom';
import {
  Globe,
  ShieldCheck,
  FileText,
  Users,
  Database,
  Bell,
  ClipboardCheck,
  Scale,
  Lock,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
} from 'lucide-react';
import MarketingLayout from '../MarketingLayout';
import Seo from '../../seo/Seo';
import JsonLd from '../../seo/JsonLd';
import { breadcrumbSchema, faqSchema, softwareApplicationSchema } from '../../seo/siteSchema';

// ---------------------------------------------------------------------------
// SEO copy
// ---------------------------------------------------------------------------
const SEO_TITLE =
  'GDPR Compliance Software: Automate Data Privacy & DSARs | ComplyEasy AI';
const SEO_DESCRIPTION =
  'ComplyEasy AI is GDPR compliance software that automates records of processing (RoPA), DPIAs, data-subject request workflows, consent tracking, and breach notification — helping teams achieve and maintain GDPR readiness.';
const SEO_KEYWORDS =
  'GDPR compliance software, GDPR automation, data subject access request software, RoPA tool, DPIA software, GDPR data privacy platform, GDPR breach notification, consent management';

// ---------------------------------------------------------------------------
// Core GDPR data-subject rights
// ---------------------------------------------------------------------------
const dataSubjectRights: { title: string; desc: string }[] = [
  {
    title: 'Right of access',
    desc: 'Individuals can obtain confirmation of whether their data is processed and a copy of that data, normally within one month.',
  },
  {
    title: 'Right to rectification',
    desc: 'Inaccurate or incomplete personal data must be corrected or completed without undue delay.',
  },
  {
    title: 'Right to erasure',
    desc: 'The "right to be forgotten" lets individuals request deletion of their data where there is no lawful basis to retain it.',
  },
  {
    title: 'Right to restrict processing',
    desc: 'Individuals can ask you to pause processing while a dispute over accuracy or lawful basis is resolved.',
  },
  {
    title: 'Right to data portability',
    desc: 'Data provided to you must be returnable in a structured, commonly used, machine-readable format.',
  },
  {
    title: 'Right to object',
    desc: 'Individuals can object to processing based on legitimate interests, and to direct marketing at any time.',
  },
];

// ---------------------------------------------------------------------------
// Key principles / requirements
// ---------------------------------------------------------------------------
const principles: { icon: React.FC<{ className?: string }>; title: string; desc: string }[] = [
  {
    icon: Scale,
    title: 'Lawful basis for processing',
    desc: 'Every processing activity must rest on one of six lawful bases — consent, contract, legal obligation, vital interests, public task, or legitimate interests — and that basis must be documented.',
  },
  {
    icon: FileText,
    title: 'Records of processing (Article 30)',
    desc: 'Controllers and processors must maintain a record of processing activities (RoPA) describing what data is processed, why, where it flows, and how long it is retained.',
  },
  {
    icon: ClipboardCheck,
    title: 'Data protection by design and default',
    desc: 'Privacy safeguards such as minimisation, pseudonymisation, and least-privilege access must be built into systems from the outset, not bolted on afterwards.',
  },
  {
    icon: Users,
    title: 'Data-subject rights fulfilment',
    desc: 'Repeatable workflows must let you find, export, correct, and delete an individual’s data across every system within statutory deadlines.',
  },
  {
    icon: AlertTriangle,
    title: 'Breach notification (72 hours)',
    desc: 'A notifiable personal-data breach must be reported to the relevant supervisory authority within 72 hours of becoming aware of it, and affected individuals informed when the risk is high.',
  },
  {
    icon: Globe,
    title: 'Lawful international transfers',
    desc: 'Transfers of personal data outside the EEA need an adequacy decision, Standard Contractual Clauses, or another Chapter V safeguard, backed by a transfer impact assessment.',
  },
];

// ---------------------------------------------------------------------------
// Common challenges
// ---------------------------------------------------------------------------
const challenges: { icon: React.FC<{ className?: string }>; title: string; desc: string }[] = [
  {
    icon: Database,
    title: 'Unknown data sprawl',
    desc: 'Personal data accumulates across SaaS apps, data warehouses, and spreadsheets, making it hard to keep an accurate RoPA or answer a deletion request completely.',
  },
  {
    icon: Bell,
    title: 'Manual DSAR handling',
    desc: 'Fulfilling access and erasure requests by hand across dozens of systems is slow, error-prone, and risks missing the one-month statutory clock.',
  },
  {
    icon: RefreshCw,
    title: 'Drifting evidence',
    desc: 'Policies, consent records, and processor agreements go stale between audits, so compliance becomes a once-a-year scramble rather than a continuous state.',
  },
  {
    icon: Eye,
    title: 'Vendor and sub-processor risk',
    desc: 'Each processor and sub-processor extends your data footprint; tracking DPAs, transfer mechanisms, and security posture across them is a continuous burden.',
  },
];

// ---------------------------------------------------------------------------
// How ComplyEasy AI helps — links to authenticated product modules
// ---------------------------------------------------------------------------
const helpItems: { icon: React.FC<{ className?: string }>; title: string; desc: string; to: string; cta: string }[] = [
  {
    icon: FileText,
    title: 'Automated RoPA and data mapping',
    desc: 'Connect your stack with read-only integrations and let AI agents discover processing activities, classify personal data, and keep your Article 30 records current automatically.',
    to: '/integrations',
    cta: 'Explore integrations',
  },
  {
    icon: ClipboardCheck,
    title: 'Guided DPIAs and risk assessments',
    desc: 'Structured Data Protection Impact Assessment workflows score risk, capture mitigations, and link findings to the controls and evidence that prove them.',
    to: '/risk-register',
    cta: 'Open the risk register',
  },
  {
    icon: Users,
    title: 'Data-subject request workflows',
    desc: 'Intake, verification, fulfilment, and audit-trail logging for access, rectification, and erasure requests, with deadline tracking baked into every case.',
    to: '/workflows',
    cta: 'See workflows',
  },
  {
    icon: ShieldCheck,
    title: 'Continuous control monitoring',
    desc: 'Map GDPR articles to technical and organisational controls, collect evidence on a schedule, and surface gaps on a live dashboard before they become findings.',
    to: '/dashboard',
    cta: 'View the dashboard',
  },
  {
    icon: AlertTriangle,
    title: 'Breach and incident response',
    desc: 'Log incidents, assess notifiability against the 72-hour clock, and generate the documentation a supervisory authority expects.',
    to: '/incidents',
    cta: 'Manage incidents',
  },
  {
    icon: Lock,
    title: 'Vendor and DPA management',
    desc: 'Track processors, sub-processors, signed data processing agreements, and transfer mechanisms in one continuously monitored register.',
    to: '/vendors',
    cta: 'Review vendors',
  },
];

// ---------------------------------------------------------------------------
// FAQ — defensible, capability-based answers an AI engine can quote
// ---------------------------------------------------------------------------
const faqItems: { q: string; a: string }[] = [
  {
    q: 'What is GDPR compliance software?',
    a: 'GDPR compliance software is a platform that helps organisations meet the requirements of the EU General Data Protection Regulation by automating tasks such as maintaining records of processing activities (RoPA), running Data Protection Impact Assessments (DPIAs), fulfilling data-subject requests, tracking consent, managing processor agreements, and documenting breach response. ComplyEasy AI uses autonomous agents to discover personal data, map it to GDPR obligations, and keep evidence continuously up to date.',
  },
  {
    q: 'Who does the GDPR apply to?',
    a: 'The GDPR applies to any organisation that processes the personal data of individuals in the European Union or European Economic Area, regardless of where the organisation itself is located. This extraterritorial reach means companies outside the EU must comply if they offer goods or services to, or monitor the behaviour of, people in the EU.',
  },
  {
    q: 'What is a record of processing activities (RoPA)?',
    a: 'A record of processing activities is the documentation required by Article 30 of the GDPR. It describes the personal data your organisation processes, the purposes and lawful bases, the categories of individuals and recipients, international transfers, and retention periods. ComplyEasy AI helps build and maintain a RoPA automatically by discovering processing activities across your connected systems.',
  },
  {
    q: 'How long do I have to respond to a data-subject access request?',
    a: 'Under the GDPR you must respond to a data-subject request without undue delay and within one month of receipt. That period can be extended by a further two months where requests are complex or numerous, provided you inform the individual of the extension and the reasons within the first month.',
  },
  {
    q: 'What is the GDPR breach-notification deadline?',
    a: 'When a personal-data breach is likely to result in a risk to individuals, the controller must notify the competent supervisory authority within 72 hours of becoming aware of it. Where the breach poses a high risk to individuals, those affected must also be informed without undue delay. ComplyEasy AI helps assess notifiability and assemble the required documentation.',
  },
  {
    q: 'What are the penalties for GDPR non-compliance?',
    a: 'The GDPR allows supervisory authorities to impose administrative fines of up to 20 million euros, or up to 4 percent of an organisation’s total worldwide annual turnover of the preceding financial year, whichever is higher, for the most serious infringements. Lower-tier infringements are capped at 10 million euros or 2 percent of turnover.',
  },
  {
    q: 'Does ComplyEasy AI help with international data transfers?',
    a: 'Yes. The platform helps you document the lawful transfer mechanism for each processor and data flow — such as an adequacy decision or Standard Contractual Clauses — and track the transfer impact assessments that support them, so cross-border processing stays defensible.',
  },
  {
    q: 'Can I manage GDPR alongside SOC 2 and ISO 27001?',
    a: 'Yes. Many security and privacy controls overlap, so ComplyEasy AI maps shared controls once and reuses the evidence across frameworks. A single programme can cover GDPR alongside SOC 2, ISO 27001, and HIPAA while surfacing the requirements unique to each standard.',
  },
];

const GDPRPillar: React.FC = () => {
  return (
    <MarketingLayout>
      <Seo
        title={SEO_TITLE}
        description={SEO_DESCRIPTION}
        canonicalPath="/gdpr"
        keywords={SEO_KEYWORDS}
      />
      <JsonLd data={softwareApplicationSchema()} />
      <JsonLd data={faqSchema(faqItems)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: 'https://complyeasyai.com/' },
          { name: 'GDPR compliance software', url: 'https://complyeasyai.com/gdpr' },
        ])}
      />

      {/* ============================== Hero ============================== */}
      <section className="relative overflow-hidden mesh-gradient">
        <div className="absolute inset-0 dot-pattern opacity-40 dark:opacity-20" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400">
              <li>
                <Link to="/" className="transition-colors hover:text-brand-600 dark:hover:text-brand-400">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="font-medium text-surface-700 dark:text-surface-200">GDPR</li>
            </ol>
          </nav>

          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700 dark:border-brand-800 dark:bg-brand-950/50 dark:text-brand-300">
              <Globe className="h-4 w-4" aria-hidden="true" />
              EU General Data Protection Regulation
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-surface-900 sm:text-5xl lg:text-6xl dark:text-white">
              <span className="text-gradient">GDPR compliance software</span> that keeps your data
              privacy programme audit-ready
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-surface-600 dark:text-surface-300">
              GDPR compliance software is a platform that automates the work of meeting the EU
              General Data Protection Regulation — maintaining records of processing, running
              impact assessments, fulfilling data-subject requests, and documenting breach response.
              ComplyEasy AI uses autonomous agents to discover personal data across your stack, map
              it to GDPR obligations, and keep evidence continuously up to date.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-brand-500/20 transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-surface-950"
              >
                Start free trial
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-full border border-surface-300 bg-white px-6 py-3 text-base font-semibold text-surface-700 transition-colors hover:border-brand-400 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200 dark:hover:text-brand-400"
              >
                Book a demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================== Definition block ============================== */}
      <section className="border-y border-surface-200 bg-surface-50 dark:border-surface-800 dark:bg-surface-900/50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl rounded-2xl border border-surface-200 bg-white p-8 shadow-sm dark:border-surface-700 dark:bg-surface-900">
            <h2 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white">
              What is the GDPR?
            </h2>
            <p className="mt-4 leading-relaxed text-surface-600 dark:text-surface-300">
              The General Data Protection Regulation (Regulation (EU) 2016/679) is the European
              Union’s comprehensive data-protection law, in force since 25 May 2018. It governs how
              organisations collect, use, store, and share the personal data of people in the EU and
              European Economic Area, and it grants individuals enforceable rights over their data.
              The GDPR applies to any organisation processing that data — wherever the organisation
              is based — making it one of the most far-reaching privacy laws in the world. It is
              built on principles of lawfulness, fairness, transparency, purpose limitation, data
              minimisation, accuracy, storage limitation, integrity, confidentiality, and
              accountability.
            </p>
          </div>
        </div>
      </section>

      {/* ============================== Key requirements ============================== */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl dark:text-white">
            Key GDPR requirements
          </h2>
          <p className="mt-4 text-lg text-surface-600 dark:text-surface-300">
            GDPR compliance is less about a single certificate and more about demonstrable,
            ongoing accountability. These are the obligations that most shape a privacy programme.
          </p>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {principles.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-surface-700 dark:bg-surface-900"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                <item.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-surface-900 dark:text-white">
                {item.title}
              </h3>
              <p className="mt-2 leading-relaxed text-surface-600 dark:text-surface-300">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================== Data-subject rights ============================== */}
      <section className="border-y border-surface-200 bg-surface-50 dark:border-surface-800 dark:bg-surface-900/50">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl dark:text-white">
              The eight data-subject rights
            </h2>
            <p className="mt-4 text-lg text-surface-600 dark:text-surface-300">
              The GDPR gives individuals a set of enforceable rights over their personal data.
              Operationalising these rights — finding, exporting, correcting, and deleting data on
              request within statutory deadlines — is where most programmes feel the strain.
            </p>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {dataSubjectRights.map((right) => (
              <div
                key={right.title}
                className="flex gap-4 rounded-2xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-900"
              >
                <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-600 dark:text-brand-400" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold text-surface-900 dark:text-white">{right.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-surface-600 dark:text-surface-300">
                    {right.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-8 max-w-3xl text-sm leading-relaxed text-surface-500 dark:text-surface-400">
            Two further rights round out the eight: the right to be informed (through clear privacy
            notices) and rights related to automated decision-making and profiling, which let
            individuals avoid solely automated decisions that produce legal or similarly significant
            effects.
          </p>
        </div>
      </section>

      {/* ============================== How it works / challenges ============================== */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl dark:text-white">
            Common GDPR challenges
          </h2>
          <p className="mt-4 text-lg text-surface-600 dark:text-surface-300">
            The regulation is principles-based, so the hard part is not reading the text — it is
            keeping a living, accurate picture of where personal data lives and how it is governed.
          </p>
        </div>
        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {challenges.map((item) => (
            <div
              key={item.title}
              className="flex gap-5 rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-900"
            >
              <span className="inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-600 dark:bg-accent-900/40 dark:text-accent-400">
                <item.icon className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="mt-2 leading-relaxed text-surface-600 dark:text-surface-300">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================== How ComplyEasy AI helps ============================== */}
      <section className="border-y border-surface-200 bg-surface-50 dark:border-surface-800 dark:bg-surface-900/50">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl dark:text-white">
              How ComplyEasy AI helps you achieve GDPR readiness
            </h2>
            <p className="mt-4 text-lg text-surface-600 dark:text-surface-300">
              ComplyEasy AI turns the GDPR from an annual project into a continuous, evidence-backed
              programme. Autonomous agents do the repetitive discovery and monitoring work; your
              team keeps control of the decisions that matter.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {helpItems.map((item) => (
              <div
                key={item.title}
                className="flex flex-col rounded-2xl border border-surface-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-surface-700 dark:bg-surface-900"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                  <item.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-surface-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="mt-2 flex-1 leading-relaxed text-surface-600 dark:text-surface-300">
                  {item.desc}
                </p>
                <Link
                  to={item.to}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                >
                  {item.cta}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== Related frameworks ============================== */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl dark:text-white">
            Pair GDPR with your other frameworks
          </h2>
          <p className="mt-4 text-lg text-surface-600 dark:text-surface-300">
            Privacy and security controls overlap heavily. Map shared controls once and reuse the
            evidence across every standard you pursue.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          <Link
            to="/soc2-compliance"
            className="group rounded-2xl border border-surface-200 bg-white p-6 transition-colors hover:border-brand-400 dark:border-surface-700 dark:bg-surface-900 dark:hover:border-brand-500"
          >
            <ShieldCheck className="h-7 w-7 text-brand-600 dark:text-brand-400" aria-hidden="true" />
            <h3 className="mt-4 text-lg font-semibold text-surface-900 group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400">
              SOC 2 compliance
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-surface-600 dark:text-surface-300">
              Trust Services Criteria readiness with continuous control monitoring and evidence
              that overlaps with GDPR security obligations.
            </p>
          </Link>
          <Link
            to="/iso-27001"
            className="group rounded-2xl border border-surface-200 bg-white p-6 transition-colors hover:border-brand-400 dark:border-surface-700 dark:bg-surface-900 dark:hover:border-brand-500"
          >
            <Lock className="h-7 w-7 text-brand-600 dark:text-brand-400" aria-hidden="true" />
            <h3 className="mt-4 text-lg font-semibold text-surface-900 group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400">
              ISO 27001
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-surface-600 dark:text-surface-300">
              Annex A controls and an ISMS that satisfies the technical and organisational measures
              the GDPR expects.
            </p>
          </Link>
          <Link
            to="/hipaa"
            className="group rounded-2xl border border-surface-200 bg-white p-6 transition-colors hover:border-brand-400 dark:border-surface-700 dark:bg-surface-900 dark:hover:border-brand-500"
          >
            <FileText className="h-7 w-7 text-brand-600 dark:text-brand-400" aria-hidden="true" />
            <h3 className="mt-4 text-lg font-semibold text-surface-900 group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400">
              HIPAA
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-surface-600 dark:text-surface-300">
              Safeguards for protected health information that map cleanly onto GDPR’s special-category
              data requirements.
            </p>
          </Link>
        </div>
      </section>

      {/* ============================== FAQ ============================== */}
      <section className="border-t border-surface-200 bg-surface-50 dark:border-surface-800 dark:bg-surface-900/50">
        <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl dark:text-white">
            GDPR compliance FAQ
          </h2>
          <dl className="mt-12 space-y-8">
            {faqItems.map((item) => (
              <div
                key={item.q}
                className="rounded-2xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-900"
              >
                <dt className="text-lg font-semibold text-surface-900 dark:text-white">{item.q}</dt>
                <dd className="mt-3 leading-relaxed text-surface-600 dark:text-surface-300">
                  {item.a}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ============================== Closing CTA ============================== */}
      <section className="relative overflow-hidden bg-brand-950">
        <div className="absolute inset-0 mesh-gradient opacity-30" aria-hidden="true" />
        <div className="relative mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Make GDPR readiness continuous
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-brand-100">
            Discover where personal data lives, automate records of processing and data-subject
            requests, and keep evidence audit-ready — all in one AI-native platform.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-base font-semibold text-brand-700 shadow-lg transition-colors hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-950"
            >
              Start free trial
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
            >
              Book a demo
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default GDPRPillar;
export { GDPRPillar };
