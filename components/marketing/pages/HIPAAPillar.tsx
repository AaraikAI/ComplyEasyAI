import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  FileCheck,
  Lock,
  Users,
  Activity,
  ClipboardCheck,
  AlertTriangle,
  KeyRound,
  Network,
  ScrollText,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import MarketingLayout from '../MarketingLayout';
import Seo from '../../seo/Seo';
import JsonLd from '../../seo/JsonLd';
import { breadcrumbSchema, faqSchema, softwareApplicationSchema } from '../../seo/siteSchema';

// ---------------------------------------------------------------------------
// SEO copy
// ---------------------------------------------------------------------------
const SEO_TITLE =
  'HIPAA Compliance Software: Automate Safeguards, Risk Analysis & Audit Readiness | ComplyEasy AI';
const SEO_DESCRIPTION =
  'ComplyEasy AI is HIPAA compliance software that helps covered entities and business associates map the Security, Privacy, and Breach Notification Rules, run continuous risk analysis, and stay audit-ready with automated safeguard tracking and evidence collection.';
const SEO_KEYWORDS =
  'HIPAA compliance software, HIPAA Security Rule, HIPAA Privacy Rule, HIPAA risk analysis, ePHI safeguards, business associate agreement, HIPAA audit readiness, healthcare compliance automation';

// ---------------------------------------------------------------------------
// On-page FAQ — defensible, capability-based answers an AI engine can quote
// ---------------------------------------------------------------------------
const faqItems: { q: string; a: string }[] = [
  {
    q: 'What is HIPAA compliance software?',
    a: 'HIPAA compliance software is a platform that helps healthcare organizations and their vendors implement, track, and demonstrate the safeguards the Health Insurance Portability and Accountability Act requires for protected health information (PHI). It centralizes risk analysis, policies, administrative/physical/technical safeguards, workforce training, business associate agreements, and audit evidence so a covered entity or business associate can show ongoing compliance with the HIPAA Security, Privacy, and Breach Notification Rules.',
  },
  {
    q: 'Who has to comply with HIPAA?',
    a: 'HIPAA applies to covered entities — health plans, health-care clearinghouses, and health-care providers that transmit health information electronically — and to business associates that create, receive, maintain, or transmit protected health information on a covered entity’s behalf. Subcontractors of business associates are also bound through a chain of business associate agreements. Software vendors, cloud platforms, billing companies, and analytics providers that handle PHI are typically business associates.',
  },
  {
    q: 'What does the HIPAA Security Rule require?',
    a: 'The HIPAA Security Rule requires covered entities and business associates to protect electronic protected health information (ePHI) through three categories of safeguards: administrative safeguards (such as a documented risk analysis, a risk management process, workforce training, and a designated security official), physical safeguards (facility access controls, workstation security, and device/media controls), and technical safeguards (access control, audit controls, integrity controls, and transmission security). A documented, periodically reviewed risk analysis is the foundational requirement.',
  },
  {
    q: 'Is HIPAA risk analysis mandatory?',
    a: 'Yes. A thorough, organization-wide risk analysis is an explicit, required implementation specification under the Security Rule administrative safeguards. It must identify where ePHI is created, received, maintained, and transmitted, and assess the likelihood and impact of threats to that data. Many enforcement actions stem from a missing or incomplete risk analysis, so it should be documented and revisited whenever the environment changes.',
  },
  {
    q: 'Does HIPAA require encryption of ePHI?',
    a: 'Encryption of ePHI is an addressable implementation specification, not a strict requirement. Addressable means an organization must assess whether encryption is reasonable and appropriate, implement it where it is, and document the rationale and any equivalent alternative where it is not. In practice, encrypting ePHI at rest and in transit is strongly advised because encrypted data that is lost or stolen can fall within the breach-notification safe harbor.',
  },
  {
    q: 'What is a business associate agreement (BAA)?',
    a: 'A business associate agreement is a written contract that a covered entity must have in place with any vendor that handles protected health information on its behalf. The BAA defines permitted uses of PHI, requires the business associate to safeguard the data, mandates breach reporting, and flows obligations down to subcontractors. ComplyEasy AI helps you track which vendors require a BAA, whether one is signed, and when it needs review.',
  },
  {
    q: 'Does HIPAA have a formal certification?',
    a: 'There is no official government HIPAA certification or seal. HIPAA compliance is demonstrated through documented safeguards, a current risk analysis, policies and procedures, workforce training records, business associate agreements, and the ability to produce evidence during an audit or investigation. Compliance software helps by keeping that evidence organized and continuously up to date rather than assembled reactively.',
  },
  {
    q: 'How does ComplyEasy AI help with HIPAA compliance?',
    a: 'ComplyEasy AI maps your environment to the HIPAA Security, Privacy, and Breach Notification Rules, guides a documented risk analysis, and continuously collects evidence for administrative, physical, and technical safeguards from connected systems. It tracks policies, workforce training, business associate agreements, and access controls in one place, and surfaces gaps before an audit or investigation so your team stays prepared rather than scrambling.',
  },
];

// ---------------------------------------------------------------------------
// Safeguard categories under the Security Rule
// ---------------------------------------------------------------------------
const safeguards: { icon: React.FC<any>; title: string; desc: string }[] = [
  {
    icon: Users,
    title: 'Administrative safeguards',
    desc: 'A documented risk analysis and risk management process, a designated security official, workforce training and sanctions, access management, and contingency planning for ePHI.',
  },
  {
    icon: Lock,
    title: 'Physical safeguards',
    desc: 'Facility access controls, workstation use and security policies, and device and media controls covering the disposal, reuse, and movement of hardware that stores ePHI.',
  },
  {
    icon: KeyRound,
    title: 'Technical safeguards',
    desc: 'Access control with unique user IDs and emergency access, audit controls and logging, integrity controls for ePHI, and transmission security for data moving across networks.',
  },
];

// ---------------------------------------------------------------------------
// How the platform helps — links to authenticated product modules
// ---------------------------------------------------------------------------
const platformHelp: { icon: React.FC<any>; title: string; desc: string; to: string; cta: string }[] = [
  {
    icon: ClipboardCheck,
    title: 'HIPAA control mapping',
    desc: 'Map your environment to the Security, Privacy, and Breach Notification Rules and reuse controls that overlap with SOC 2 and ISO 27001.',
    to: '/frameworks',
    cta: 'Open Frameworks',
  },
  {
    icon: Activity,
    title: 'Continuous risk analysis',
    desc: 'Identify where ePHI lives, assess threats, and keep a living risk register that updates as your systems and vendors change.',
    to: '/risks',
    cta: 'Open Risk Register',
  },
  {
    icon: FileCheck,
    title: 'Automated evidence collection',
    desc: 'Connect read-only integrations so AI agents gather safeguard evidence on a schedule and maintain a versioned audit trail.',
    to: '/evidence',
    cta: 'Open Evidence',
  },
  {
    icon: ScrollText,
    title: 'Policies & workforce training',
    desc: 'Publish HIPAA policies, capture acknowledgements, and track required workforce training in one place.',
    to: '/policies',
    cta: 'Open Policies',
  },
  {
    icon: Network,
    title: 'Vendor & BAA tracking',
    desc: 'Track which business associates handle PHI, whether a signed BAA is on file, and when each agreement needs review.',
    to: '/vendors',
    cta: 'Open Vendors',
  },
  {
    icon: ShieldCheck,
    title: 'Audit-ready dashboards',
    desc: 'See safeguard coverage and open gaps in real time, then export organized evidence for an auditor or investigation.',
    to: '/dashboard',
    cta: 'Open Dashboard',
  },
];

const HIPAAPillar: React.FC = () => {
  return (
    <MarketingLayout>
      <Seo
        title={SEO_TITLE}
        description={SEO_DESCRIPTION}
        canonicalPath="/hipaa"
        keywords={SEO_KEYWORDS}
        ogType="article"
      />
      <JsonLd data={softwareApplicationSchema()} />
      <JsonLd data={faqSchema(faqItems)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: 'https://complyeasyai.com/' },
          { name: 'HIPAA Compliance Software', url: 'https://complyeasyai.com/hipaa' },
        ])}
      />

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
              <li className="font-medium text-surface-700 dark:text-surface-200">
                HIPAA compliance software
              </li>
            </ol>
          </nav>

          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700 dark:border-brand-800 dark:bg-brand-950/50 dark:text-brand-300">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Healthcare compliance, automated
            </span>

            <h1 className="mt-6 text-4xl font-bold tracking-tight text-surface-900 sm:text-5xl lg:text-6xl dark:text-white">
              HIPAA compliance software for{' '}
              <span className="text-gradient">covered entities and business associates</span>
            </h1>

            <p className="mt-6 text-lg leading-relaxed text-surface-600 dark:text-surface-300">
              HIPAA compliance software helps healthcare organizations and their vendors implement,
              track, and prove the safeguards required to protect protected health information (PHI).
              ComplyEasy AI maps your environment to the HIPAA Security, Privacy, and Breach
              Notification Rules, guides a documented risk analysis, and continuously collects
              safeguard evidence — so your team stays audit-ready instead of assembling proof
              reactively.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-7 py-3 text-base font-semibold text-white shadow-lg shadow-brand-500/20 transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                Start free trial
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-surface-300 bg-white px-7 py-3 text-base font-semibold text-surface-800 transition-colors hover:border-brand-400 hover:text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100 dark:hover:border-brand-500"
              >
                Book a demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================== Definition block ============================== */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-white">
              What is HIPAA compliance?
            </h2>
            <div className="mt-6 space-y-5 text-lg leading-relaxed text-surface-600 dark:text-surface-300">
              <p>
                The Health Insurance Portability and Accountability Act (HIPAA) is a United States
                federal law that sets national standards for protecting sensitive patient health
                information. <strong className="font-semibold text-surface-900 dark:text-white">HIPAA
                compliance</strong> means meeting the obligations of the law’s core rules — the
                Privacy Rule, the Security Rule, and the Breach Notification Rule — and being able to
                demonstrate that protection on demand.
              </p>
              <p>
                The Privacy Rule governs how protected health information (PHI) may be used and
                disclosed and gives individuals rights over their own records. The Security Rule sets
                administrative, physical, and technical safeguards specifically for electronic PHI
                (ePHI). The Breach Notification Rule defines what counts as a breach of unsecured PHI
                and the timelines for notifying affected individuals, the U.S. Department of Health
                and Human Services (HHS), and, in some cases, the media. Together they are enforced by
                the HHS Office for Civil Rights (OCR).
              </p>
              <p>
                Compliance is not a one-time project or a certificate you receive. It is a continuous
                program of documented risk analysis, safeguards, policies, training, vendor
                management, and evidence that must hold up if OCR opens an investigation or audit.
              </p>
            </div>
          </div>

          <aside className="rounded-2xl border border-surface-200 bg-surface-50 p-8 dark:border-surface-700 dark:bg-surface-900">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-400">
              At a glance
            </h3>
            <dl className="mt-5 space-y-5 text-sm">
              <div>
                <dt className="font-semibold text-surface-900 dark:text-white">Who it applies to</dt>
                <dd className="mt-1 text-surface-600 dark:text-surface-300">
                  Covered entities and the business associates that handle PHI on their behalf.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-surface-900 dark:text-white">Core rules</dt>
                <dd className="mt-1 text-surface-600 dark:text-surface-300">
                  Privacy Rule, Security Rule, and Breach Notification Rule.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-surface-900 dark:text-white">Foundation</dt>
                <dd className="mt-1 text-surface-600 dark:text-surface-300">
                  A documented, periodically reviewed organization-wide risk analysis.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-surface-900 dark:text-white">Enforced by</dt>
                <dd className="mt-1 text-surface-600 dark:text-surface-300">
                  The HHS Office for Civil Rights (OCR).
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      {/* ============================== Key requirements ============================== */}
      <section className="border-y border-surface-200 bg-surface-50 dark:border-surface-800 dark:bg-surface-900/40">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-white">
              Key HIPAA requirements
            </h2>
            <p className="mt-4 text-lg text-surface-600 dark:text-surface-300">
              The Security Rule organizes protections for electronic PHI into three safeguard
              categories. Each contains required and addressable implementation specifications you
              must satisfy or document.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {safeguards.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-surface-200 bg-white p-7 shadow-sm transition-shadow hover:shadow-md dark:border-surface-700 dark:bg-surface-900"
                >
                  <span className="inline-flex rounded-xl bg-brand-50 p-3 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-xl font-semibold text-surface-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-surface-600 dark:text-surface-300">{item.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="text-xl font-semibold text-surface-900 dark:text-white">
                The Privacy Rule and patient rights
              </h3>
              <p className="mt-3 text-surface-600 dark:text-surface-300">
                Beyond securing ePHI, HIPAA limits how PHI may be used or disclosed and grants
                individuals rights to access their records, request amendments, and receive an
                accounting of disclosures. Covered entities must apply the minimum-necessary standard,
                publish a Notice of Privacy Practices, and honor patient requests within defined
                timelines.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-surface-900 dark:text-white">
                The Breach Notification Rule
              </h3>
              <p className="mt-3 text-surface-600 dark:text-surface-300">
                When unsecured PHI is compromised, covered entities must notify affected individuals
                without unreasonable delay and within statutory timelines, report to HHS, and notify
                the media for larger breaches. Business associates must report breaches to the covered
                entity. Encrypting PHI can place lost or stolen data within a safe harbor that limits
                notification obligations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================== How it works ============================== */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-white">
          How a HIPAA compliance program works
        </h2>
        <p className="mt-4 max-w-3xl text-lg text-surface-600 dark:text-surface-300">
          A sustainable program moves from discovery to documented, monitored controls. The steps
          below describe the lifecycle ComplyEasy AI helps you operate.
        </p>

        <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              n: '01',
              title: 'Scope ePHI',
              d: 'Identify every system, vendor, and workflow that creates, receives, maintains, or transmits electronic protected health information.',
            },
            {
              n: '02',
              title: 'Run a risk analysis',
              d: 'Assess threats and vulnerabilities to ePHI, rate likelihood and impact, and record findings in a living risk register.',
            },
            {
              n: '03',
              title: 'Implement safeguards',
              d: 'Apply administrative, physical, and technical safeguards, addressing each required and addressable implementation specification.',
            },
            {
              n: '04',
              title: 'Document policies & train',
              d: 'Publish HIPAA policies and procedures, capture workforce acknowledgements, and deliver required training.',
            },
            {
              n: '05',
              title: 'Manage business associates',
              d: 'Track which vendors handle PHI, ensure a signed BAA is on file, and review agreements on a schedule.',
            },
            {
              n: '06',
              title: 'Monitor & prove',
              d: 'Continuously collect evidence, watch for control drift, and keep an organized audit trail ready for OCR.',
            },
          ].map((step) => (
            <li
              key={step.n}
              className="rounded-2xl border border-surface-200 bg-white p-7 dark:border-surface-700 dark:bg-surface-900"
            >
              <span className="text-sm font-bold text-gradient-accent">{step.n}</span>
              <h3 className="mt-2 text-lg font-semibold text-surface-900 dark:text-white">
                {step.title}
              </h3>
              <p className="mt-2 text-surface-600 dark:text-surface-300">{step.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ============================== Common challenges ============================== */}
      <section className="border-y border-surface-200 bg-surface-50 dark:border-surface-800 dark:bg-surface-900/40">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-white">
              Common HIPAA compliance challenges
            </h2>
            <p className="mt-4 text-lg text-surface-600 dark:text-surface-300">
              Most HIPAA enforcement actions trace back to a handful of recurring gaps. Knowing them
              helps you prioritize.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {[
              {
                title: 'Missing or stale risk analysis',
                d: 'The required risk analysis is often skipped, scoped too narrowly, or never updated after new systems are added — a frequent root cause of OCR findings.',
              },
              {
                title: 'Untracked business associates',
                d: 'PHI flows to billing, cloud, and analytics vendors without a signed BAA on file, leaving an unmanaged chain of liability.',
              },
              {
                title: 'Evidence assembled reactively',
                d: 'Teams scramble to gather screenshots and logs when an investigation arrives, instead of maintaining a continuous, versioned audit trail.',
              },
              {
                title: 'Inconsistent access and audit controls',
                d: 'Shared accounts, missing logging, and weak transmission security undermine the technical safeguards the Security Rule requires.',
              },
              {
                title: 'Workforce training gaps',
                d: 'Training and sanction policies exist on paper but acknowledgements and completion records are incomplete or hard to produce.',
              },
              {
                title: 'Overlapping framework duplication',
                d: 'Organizations re-document controls already covered by SOC 2 or ISO 27001 instead of mapping shared controls once and reusing evidence.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex gap-4 rounded-2xl border border-surface-200 bg-white p-7 dark:border-surface-700 dark:bg-surface-900"
              >
                <AlertTriangle
                  className="mt-0.5 h-6 w-6 flex-shrink-0 text-brand-500"
                  aria-hidden="true"
                />
                <div>
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-surface-600 dark:text-surface-300">{item.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== How ComplyEasy AI helps ============================== */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-white">
            How ComplyEasy AI helps with HIPAA
          </h2>
          <p className="mt-4 text-lg text-surface-600 dark:text-surface-300">
            ComplyEasy AI turns HIPAA from a periodic fire drill into a continuously monitored
            program. Connect your systems once, and autonomous agents keep safeguard evidence current
            across the modules below.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {platformHelp.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="flex flex-col rounded-2xl border border-surface-200 bg-white p-7 shadow-sm transition-shadow hover:shadow-md dark:border-surface-700 dark:bg-surface-900"
              >
                <span className="inline-flex w-fit rounded-xl bg-brand-50 p-3 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-surface-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="mt-2 flex-1 text-surface-600 dark:text-surface-300">{item.desc}</p>
                <Link
                  to={item.to}
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                >
                  {item.cta}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Evidence-reuse callout with sibling pillar links */}
        <div className="mt-14 rounded-2xl border border-brand-200 bg-brand-50/60 p-8 dark:border-brand-900 dark:bg-brand-950/30">
          <h3 className="text-xl font-semibold text-surface-900 dark:text-white">
            One program, many frameworks
          </h3>
          <p className="mt-3 max-w-3xl text-surface-600 dark:text-surface-300">
            HIPAA’s technical and administrative safeguards overlap heavily with other security
            frameworks. ComplyEasy AI maps shared controls once and reuses the same evidence, so a
            HIPAA program can extend to{' '}
            <Link
              to="/soc2-compliance"
              className="font-semibold text-brand-700 underline decoration-brand-400 underline-offset-2 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200"
            >
              SOC 2
            </Link>
            ,{' '}
            <Link
              to="/iso-27001"
              className="font-semibold text-brand-700 underline decoration-brand-400 underline-offset-2 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200"
            >
              ISO 27001
            </Link>
            , and{' '}
            <Link
              to="/gdpr"
              className="font-semibold text-brand-700 underline decoration-brand-400 underline-offset-2 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200"
            >
              GDPR
            </Link>{' '}
            without re-documenting the controls they have in common.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              'Read-only integrations gather safeguard evidence automatically',
              'Living risk register tied to where ePHI actually lives',
              'Business associate and BAA tracking in one place',
              'Audit-ready exports organized for OCR reviewers',
            ].map((point) => (
              <li key={point} className="flex items-start gap-2 text-surface-700 dark:text-surface-200">
                <CheckCircle2
                  className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-600 dark:text-accent-400"
                  aria-hidden="true"
                />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ============================== FAQ ============================== */}
      <section className="border-t border-surface-200 bg-surface-50 dark:border-surface-800 dark:bg-surface-900/40">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-white">
            HIPAA compliance FAQ
          </h2>
          <dl className="mt-10 space-y-4">
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
      <section className="relative overflow-hidden bg-surface-950">
        <div className="absolute inset-0 mesh-gradient opacity-30" aria-hidden="true" />
        <div className="relative mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Make HIPAA readiness continuous
          </h2>
          <p className="mt-5 text-lg text-surface-300">
            Map the Security, Privacy, and Breach Notification Rules, run a documented risk analysis,
            and keep safeguard evidence current — all in one platform. Start free or talk to our team.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-7 py-3 text-base font-semibold text-white shadow-lg shadow-brand-500/20 transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              Start free trial
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-surface-600 px-7 py-3 text-base font-semibold text-white transition-colors hover:border-brand-400 hover:text-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              Book a demo
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default HIPAAPillar;
export { HIPAAPillar };
