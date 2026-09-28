import React from 'react';
import { Link } from 'react-router';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { MarketingLayout } from '../MarketingLayout';
import { Seo } from '../../seo/Seo';
import { JsonLd } from '../../seo/JsonLd';
import { breadcrumbSchema, faqSchema, reviewedWebPageSchema } from '../../seo/siteSchema';
import { SITE_ORIGIN } from '../../seo/siteOrigin';
import { ReviewedByline, TldrList } from '../answerFirst';
import { FRAMEWORK_PILLAR_COUNT } from '../../../data/frameworkPillarContent';
import {
  ACOS_PLANS,
  BYOK_PLAN,
  EU_STACK_PLAN,
  FRAMEWORK_CATALOGUE_LABEL,
  FRAMEWORK_GUIDE_LIST,
  HOSTING_REGION,
  INTEGRATION_COUNT,
  joinWithAnd,
  SECURITY_ATTESTATION,
  TRIAL_CTA,
  VERIFIED_INTEGRATION_GROUPS,
} from '../../../data/marketingFacts';

/** Date the answers on this page were last reviewed against the product and the rules. */
const LAST_REVIEWED = '2026-09-27';

const SEO_TITLE = 'ComplyEasyAI FAQ: Pricing, Frameworks, AI & Security';
const SEO_DESCRIPTION =
  'Answers about the ComplyEasyAI compliance automation platform: supported frameworks, AI features, security, integrations, pricing, deployment, and support.';

/** "Cloud and infrastructure: AWS, … and Kubernetes. Identity and HR: …." */
const INTEGRATION_GROUP_SENTENCES = VERIFIED_INTEGRATION_GROUPS.map(
  ({ group, names }) => `${group}: ${joinWithAnd(names)}.`,
).join(' ');

/** Key facts shown as the TL;DR under the hero. */
const FAQ_TLDR: string[] = [
  `${FRAMEWORK_PILLAR_COUNT} in-depth framework guides and ${FRAMEWORK_CATALOGUE_LABEL} frameworks in the in-app catalogue.`,
  `${INTEGRATION_COUNT} verified integrations collect evidence, read-only for evidence collection.`,
  'Four annual plans, each a tailored quote per framework mix; trials are available on request.',
  `Our own security: ${SECURITY_ATTESTATION}, hosted in a single US region (us-east-1).`,
];

interface QaItem {
  q: string;
  a: string;
}

interface FaqTopic {
  id: string;
  /** Short name for the topic jump links. */
  label: string;
  /** Section heading, phrased as the question the topic answers. */
  title: string;
  blurb: string;
  items: QaItem[];
}

/**
 * Topic-grouped Q&A set adapted from the published FAQ. Answers describe
 * platform capabilities and supported frameworks factually. Services that are
 * arranged per contract are labelled "available on request", and developer
 * tooling that does not exist yet is labelled "on the roadmap".
 */
const FAQ_TOPICS: FaqTopic[] = [
  {
    id: 'getting-started',
    label: 'Getting started',
    title: 'How do I get started?',
    blurb: 'What the platform is, who it serves, and how onboarding works.',
    items: [
      {
        q: 'What is ComplyEasyAI?',
        a: 'ComplyEasyAI is an AI-powered compliance automation platform that helps organizations achieve and maintain continuous readiness across global regulatory standards. It automates evidence collection, control monitoring, risk assessment, and audit preparation using autonomous AI agents and machine learning.',
      },
      {
        q: 'Who is ComplyEasyAI for?',
        a: 'It is built for startups preparing for a first audit such as SOC 2 or ISO 27001, scale-ups managing several frameworks at once, and enterprises that need advanced automation and custom frameworks. It is a strong fit for regulated industries including FinTech, HealthTech, SaaS, and AI companies, as well as organizations subject to the EU AI Act, DMA, or DSA.',
      },
      {
        q: 'How quickly can I get started?',
        a: 'Signing up takes a couple of minutes, and AI-assisted framework setup typically takes 15 to 30 minutes. Automated evidence collection can begin within the first day, an initial compliance dashboard comes together within a few days, and audit-ready status generally follows over 30 to 90 days depending on the framework and your current maturity.',
      },
      {
        q: 'Can I try ComplyEasyAI before buying?',
        a: `Yes, on request. ${TRIAL_CTA.label} through the demo form and we agree the trial's scope and length with you. You can also create an account yourself; a new workspace starts with the Foundation plan's limits of three frameworks and up to 10 users.`,
      },
      {
        q: 'What happens after my trial ends?',
        a: 'Before a trial ends we agree the next step with you: move to a paid plan with all of your data preserved, extend the evaluation, or close the workspace.',
      },
    ],
  },
  {
    id: 'pricing-billing',
    label: 'Pricing and billing',
    title: 'How does pricing work?',
    blurb: 'Tiers, tier changes, payment methods, and refunds.',
    items: [
      {
        q: 'How does your pricing work?',
        a: 'Pricing is tier-based with flat annual rates: Foundation (3 frameworks, 10 users), Essentials (10 frameworks, 100 users), Growth (50 frameworks, 1,000 users) and Visionary (unlimited). Each plan is one platform price; your exact figure is a tailored quote based on your framework mix and team size, shared on a 30-minute call.',
      },
      {
        q: 'Can I switch tiers?',
        a: 'Yes, at any time. Upgrades take effect immediately with prorated billing. Downgrades take effect at the next billing cycle, and your current features remain active until then. There are no penalties for switching tiers.',
      },
      {
        q: 'What payment methods do you accept?',
        a: 'Major credit and debit cards (Visa, Mastercard, Amex, Discover) are accepted for all customers. ACH bank transfer is available for US-based organizations, and wire transfer, purchase orders with NET 30 terms, and invoice payment are available for enterprise, Growth, and Visionary customers.',
      },
      {
        q: 'What is your refund policy?',
        a: 'Trials carry no charges. On annual plans, a prorated refund for unused months is available after the first 30 days. Enterprise contracts follow their negotiated terms.',
      },
    ],
  },
  {
    id: 'platform-features',
    label: 'Platform and features',
    title: 'What does the platform do?',
    blurb: 'Core capabilities, autonomous operations, and evidence automation.',
    items: [
      {
        q: 'What compliance frameworks does the platform support?',
        a: `ComplyEasyAI has ${FRAMEWORK_PILLAR_COUNT} in-depth framework guides: ${FRAMEWORK_GUIDE_LIST}. Its in-app catalogue covers ${FRAMEWORK_CATALOGUE_LABEL} frameworks and standards, including ISO 27701, NIST 800-53, CIS Controls, FedRAMP, HITRUST, PIPEDA, LGPD, TISAX, FDA 21 CFR Part 11 and ITAR. Growth and Visionary plans can build custom frameworks.`,
      },
      {
        q: 'What is aCOS (Autonomous Compliance Operations System)?',
        a: `aCOS is the autonomous compliance engine. It monitors your infrastructure continuously with AI agents, detects compliance drift in real time, remediates issues automatically when it is safe to do so, learns from your environment to adapt policies, predicts emerging risks, and orchestrates remediation workflows. The full aCOS loop is included in ${ACOS_PLANS}; continuous control monitoring is in every tier.`,
      },
      {
        q: 'How does automated evidence collection work?',
        a: `Evidence is collected through ${INTEGRATION_COUNT} verified integrations across cloud (AWS, Microsoft Azure), code (GitHub, GitLab), identity and HR (Okta, Google Workspace, BambooHR), security (CrowdStrike, Qualys) and ticketing (Jira, ServiceNow). You connect each one through OAuth, an API key or a personal access token, and the credential is checked with the provider before it is saved. Evidence is mapped to controls, collected on a schedule, and kept in a versioned audit trail.`,
      },
      {
        q: 'Can I customize frameworks and controls?',
        a: 'Yes, with customization scaling by tier. Foundation lets you add custom controls to existing frameworks, Essentials lets you modify control requirements and evidence mappings, Growth lets you build custom frameworks from scratch, and Visionary adds full Compliance-as-Code using OPA/Rego policies.',
      },
      {
        q: 'Can I export my data?',
        a: 'Yes. You own your data and can export it at any time, with unlimited exports, in JSON, CSV, PDF, or XML. Exports cover evidence and attachments, risk assessments, control mappings, audit history, policies and procedures, and reports. The platform also supports data portability to help you migrate elsewhere without vendor lock-in.',
      },
    ],
  },
  {
    id: 'ai-features',
    label: 'AI and automation',
    title: 'How does the AI work?',
    blurb: 'How the AI works, what it automates, and where humans stay in the loop.',
    items: [
      {
        q: 'What AI features are included?',
        a: 'Every tier includes core AI features: the AI Risk Analyzer for automated risk assessment and scoring, the AI Control Mapper for mapping evidence to controls, and a natural-language AI chatbot. Growth adds advanced AI such as predictive risk modeling, AI Red Team simulation, smart remediation, a compliance digital twin, and neuro-symbolic reasoning. Visionary adds federated learning, homomorphic encryption, multi-modal processing, and full AI governance.',
      },
      {
        q: 'Can AI replace my compliance team?',
        a: 'No, but it augments your team significantly. The AI handles routine work such as evidence collection, control monitoring, risk scoring, report generation, and anomaly detection, freeing people to focus on strategic decisions, auditor relationships, policy design, exception approvals, and program leadership.',
      },
      {
        q: 'What is AI Red Team?',
        a: 'AI Red Team simulates adversarial review of your compliance program. It identifies gaps an auditor would likely catch, models how controls could be bypassed, tests your posture under stress, and generates reports on what to fix. It is simulation only with no actual attacks performed, and it is available in the Growth tier and above.',
      },
      {
        q: 'How does the AI chatbot work?',
        a: 'The chatbot answers natural-language compliance questions against your own data, such as listing open access-control risks, identifying missing evidence for a specific SOC 2 control, or generating an executive risk report. It only accesses your organization’s data, which is never shared across organizations, and it is available in all tiers.',
      },
      {
        q: 'Do you use customer data to train AI models?',
        a: 'Customer data is never used for AI training without explicit opt-in. Where supported, zero-knowledge techniques allow compliance to be verified without exposing the underlying data, and you control data access permissions and encryption keys.',
      },
    ],
  },
  {
    id: 'frameworks',
    label: 'Compliance frameworks',
    title: 'Which frameworks are covered?',
    blurb: 'Timelines, running multiple frameworks, and staying current with updates.',
    items: [
      {
        q: 'How long does it take to get a SOC 2 report?',
        a: 'With ComplyEasyAI, setup and gap assessment usually take a few weeks, remediation runs roughly 4 to 12 weeks depending on the gaps found, and SOC 2 Type II requires a 3 to 6 month observation period before the audit itself. End to end this commonly lands in the 4 to 9 month range, compared with the longer timelines typical of fully manual programs.',
      },
      {
        q: 'Can I pursue multiple frameworks simultaneously?',
        a: 'Yes, and this is a core strength of the platform. Many frameworks share a large portion of their controls, so the AI maps shared controls automatically, reuses evidence across frameworks, flags the unique requirements of each, and generates framework-specific reports. The number of concurrent frameworks scales with your tier.',
      },
      {
        q: 'What is the difference between SOC 2 Type I and Type II?',
        a: 'SOC 2 Type I is a point-in-time assessment that evaluates whether controls are designed appropriately. SOC 2 Type II evaluates how effectively those controls operate over a 3 to 12 month observation period and is the report most enterprise buyers expect. The platform supports both Type I and Type II with continuous control monitoring.',
      },
      {
        q: 'How do you handle framework updates?',
        a: 'Framework changes are tracked centrally. When a standard is revised, new controls are added to your instance, you receive advance notice, and AI assists the transition while preserving and remapping existing evidence. This has covered updates such as the ISO 27001:2022 revision and NIST CSF 2.0.',
      },
    ],
  },
  {
    id: 'eu-regulations',
    label: 'EU regulations',
    title: 'Which EU regulations are covered?',
    blurb: 'EU AI Act, DMA, DSA, and GDPR coverage.',
    items: [
      {
        q: 'Do you support the EU AI Act?',
        a: `Yes. The platform helps you classify AI system risk, generate technical documentation for high-risk systems, run conformity assessments, manage required transparency disclosures and labeling, operate human-oversight governance workflows, and monitor data quality and accuracy. It is included in the ${EU_STACK_PLAN} plan's full EU stack (AI Act, DORA, DMA and DSA). After the 2026 Digital Omnibus amendments, most high-risk obligations apply from 2 December 2027 (Annex III systems) or 2 August 2028 (AI in products covered by Annex I).`,
      },
      {
        q: 'What about the Digital Markets Act (DMA)?',
        a: `The platform supports DMA obligations for digital gatekeepers, including gatekeeper assessment, mapping of the DMA obligations, documenting interoperability and data portability, monitoring self-preferencing and data-combination practices, and generating compliance reports. It is included in the ${EU_STACK_PLAN} plan.`,
      },
      {
        q: 'And the Digital Services Act (DSA)?',
        a: `The platform provides a DSA toolkit covering content-moderation tracking, notice-and-action workflows, automated transparency reporting, systemic-risk analysis for very large platforms, recommender-system documentation, advertising transparency, and user-rights request handling. It is included in the ${EU_STACK_PLAN} plan.`,
      },
      {
        q: 'How does the platform help with GDPR?',
        a: 'The GDPR toolkit helps you track processing activities, manage consent, handle data-subject requests for access, deletion, and portability, generate a Record of Processing Activities, conduct Data Protection Impact Assessments, and document your legal basis for processing.',
      },
    ],
  },
  {
    id: 'security',
    label: 'Security and privacy',
    title: 'How is my data protected?',
    blurb: 'Our own attestations, hosting, access and customer-managed keys.',
    items: [
      {
        q: 'How is the platform secured?',
        a: `${SECURITY_ATTESTATION}; ComplyEasyAI does not yet hold a SOC 2 report or an ISO 27001 certificate. The controls in place today are encryption at rest (Supabase and AWS), TLS encryption in transit, integration credentials additionally encrypted with AES-256-GCM, multi-factor authentication, role-based access within each workspace, audit logging, and hosting in a single US region (us-east-1).`,
      },
      {
        q: 'Where is my data stored?',
        a: `Customer data is hosted in ${HOSTING_REGION}, with the application on AWS and the database on Supabase. Nightly database backups are kept for 30 days. There is no multi-region replication today. On-premises deployment is available on request for Visionary customers.`,
      },
      {
        q: 'Do you have access to my data?',
        a: 'Your data is scoped to your organization and is never shown to other customers, and actions in the platform are written to an audit log. We do not use customer data to train AI models without your opt-in.',
      },
      {
        q: 'Can I use my own encryption keys?',
        a: `Yes. Bring Your Own Key is available on the ${BYOK_PLAN} plan, with support for AWS KMS, Azure Key Vault, Google Cloud KMS, and HashiCorp Vault. Keys can be rotated automatically or manually, and revoking a key renders the associated data unreadable. BYOK can be combined with client-side encryption for a zero-knowledge posture.`,
      },
    ],
  },
  {
    id: 'integrations',
    label: 'Integrations',
    title: 'Which tools does it connect to?',
    blurb: 'Supported tools, connection methods, and building your own.',
    items: [
      {
        q: 'What integrations do you support?',
        a: `ComplyEasyAI has ${INTEGRATION_COUNT} verified integrations: connectors that check your credentials with the provider when you connect and collect evidence when they sync. ${INTEGRATION_GROUP_SENTENCES} The in-app catalogue lists further connectors that are not yet verified end to end.`,
      },
      {
        q: 'How do integrations work?',
        a: 'Integrations connect through one-click OAuth where available, read-only API keys or personal access tokens, or webhooks for real-time events, and they are agentless with no software to install. The platform requests the minimum permissions needed, preferring read-only access.',
      },
      {
        q: 'Can I build custom integrations?',
        a: 'Yes. The Webhook API and the REST and GraphQL APIs let you send evidence, trigger workflows, and query compliance data. A no-code Integration Builder is on the roadmap, and integration work by our team is available on request.',
      },
      {
        q: 'What if you don’t support my tool?',
        a: 'You can send evidence through the Webhook API, import it from CSV, or upload it manually, and ask us to add the integration. A public roadmap for integration requests is on the roadmap, and integration work by our team is available on request.',
      },
    ],
  },
  {
    id: 'technical',
    label: 'Technical questions',
    title: 'What are the technical details?',
    blurb: 'Uptime, deployment, rate limits, and developer interfaces.',
    items: [
      {
        q: 'What is your uptime SLA?',
        a: 'Uptime SLAs with service credits are available on request and are agreed in your contract; without one, no SLA applies. Live availability is published on the status page.',
      },
      {
        q: 'Can I deploy on-premise?',
        a: 'On-premises deployment is available on request for Visionary customers. It runs on your Kubernetes cluster with PostgreSQL, Redis and S3-compatible storage; packaging (including Helm) and support are agreed per contract. The standard service runs in a single US region (us-east-1).',
      },
      {
        q: 'What are your API rate limits?',
        a: 'API use is subject to plan quotas, from 1,000 requests a day on Foundation to 10,000 on Essentials, 100,000 on Growth and unlimited under fair use on Visionary, and to rate limiting. Requests over a limit receive an HTTP 429 response.',
      },
      {
        q: 'Do you have an API, CLI or SDKs?',
        a: 'The API is available today: a documented REST API and a GraphQL API. SDKs for JavaScript/TypeScript, Python, Go, and Java, a command-line interface, and a Terraform provider are on the roadmap.',
      },
    ],
  },
  {
    id: 'support-services',
    label: 'Support and services',
    title: 'What support is included?',
    blurb: 'Support tiers, professional services, training, and migration help.',
    items: [
      {
        q: 'What support do you provide?',
        a: 'Every plan includes email support, the documentation, and the learning center. Growth and Visionary add priority support. For Visionary customers, 24/7 phone support, a critical-response SLA, and a dedicated Customer Success Manager are available on request.',
      },
      {
        q: 'Do you offer professional services?',
        a: 'Yes, on request. Compliance consulting (gap assessments, remediation planning, policy development, audit preparation, framework selection), implementation services (onboarding, integration setup, custom framework building, workflow design, team training), and managed services such as Compliance-as-a-Service and a virtual CISO are available on request and quoted separately.',
      },
      {
        q: 'How do I get training?',
        a: 'Documentation, the learning center, and in-app guidance are available on every plan. Live training sessions and workshops for your team are available on request.',
      },
      {
        q: 'Can you help me prepare for an audit?',
        a: 'Yes. The audit-preparation program covers pre-audit work such as AI Red Team review, gap remediation, evidence packaging, and a mock audit; in-audit support with a secure auditor portal, instant evidence search, and question tracking; and post-audit help with response generation, finding remediation, and continuous monitoring to prevent recurrence.',
      },
      {
        q: 'What if I need help migrating from another tool?',
        a: "Migration help is available on request. Our team can import your controls, evidence and policies from spreadsheets or your current compliance tool's exports, handle data mapping and validation, and run both systems in parallel during the switch.",
      },
    ],
  },
  {
    id: 'additional',
    label: 'Additional questions',
    title: 'What about white-labeling and multi-tenancy?',
    blurb: 'White-labeling, multi-tenancy, and enterprise add-ons.',
    items: [
      {
        q: 'Can I white-label ComplyEasyAI?',
        a: 'Yes. White-labeling is available on the Visionary tier and includes custom branding (logo, colors, and domain), removal of ComplyEasyAI branding, custom email templates, and custom report headers and footers. It is a common fit for managed service providers, compliance consultants, and resellers.',
      },
      {
        q: 'Do you support multi-tenancy?',
        a: 'Yes. Multi-tenant features let you manage multiple organizations from a single account, view consolidated cross-organization dashboards, apply role-based access with separate permissions per organization, and consolidate billing into a single invoice. This suits consultancies, managed service providers, and holding companies.',
      },
      {
        q: 'What enterprise add-ons are available?',
        a: 'Custom frameworks are included in the Growth and Visionary plans. The following are available on request and quoted with your plan: on-premises deployment (Visionary), custom fine-tuned AI models (Visionary), a dedicated virtual CISO service, and audit bundling with a partner network of audit firms.',
      },
    ],
  },
];

/** Flattened Q&A pairs used for the FAQPage structured data. */
const ALL_QA_PAIRS: QaItem[] = FAQ_TOPICS.flatMap((topic) => topic.items);

const FaqHubPage: React.FC = () => {
  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: SITE_ORIGIN },
    { name: 'FAQ', url: `${SITE_ORIGIN}/faq` },
  ]);

  const faqLd = faqSchema(
    ALL_QA_PAIRS.map((item) => ({ q: item.q, a: item.a })),
  );

  return (
    <MarketingLayout>
      <Seo
        title={SEO_TITLE}
        description={SEO_DESCRIPTION}
        canonicalPath="/faq"
        keywords="ComplyEasyAI FAQ, compliance automation questions, SOC 2 platform, ISO 27001, GDPR, EU AI Act, BYOK, audit preparation"
      />
      <JsonLd data={faqLd} />
      <JsonLd data={breadcrumbs} />
      <JsonLd
        data={reviewedWebPageSchema({
          name: SEO_TITLE,
          description: SEO_DESCRIPTION,
          path: '/faq',
          lastReviewed: LAST_REVIEWED,
          about: 'ComplyEasyAI',
        })}
      />

      {/* ============================== Hero ============================== */}
      <section className="relative overflow-hidden mesh-gradient">
        <div className="absolute inset-0 dot-pattern opacity-40" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm">
            <ol className="flex items-center gap-2 text-surface-500 dark:text-surface-400">
              <li>
                <Link to="/" className="transition-colors hover:text-brand-600 dark:hover:text-brand-400">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="font-medium text-surface-700 dark:text-surface-200">FAQ</li>
            </ol>
          </nav>

          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700 dark:border-brand-800 dark:bg-brand-950/60 dark:text-brand-300">
            <HelpCircle className="h-4 w-4" aria-hidden="true" />
            Frequently asked questions
          </span>

          <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-surface-900 sm:text-5xl dark:text-white">
            ComplyEasyAI <span className="text-gradient">FAQ</span>: frameworks, AI, security and
            pricing
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-surface-600 dark:text-surface-300">
            Straight answers on what the platform does, what it costs and how it protects your data.
          </p>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-surface-600 dark:text-surface-300">
            ComplyEasyAI is an AI compliance automation platform for SOC 2, ISO 27001, GDPR, HIPAA,
            the EU AI Act and {FRAMEWORK_PILLAR_COUNT - 5} more frameworks with dedicated guides. It
            collects evidence through read-only integrations, monitors controls continuously and maps
            shared controls once across frameworks. The answers below cover setup, pricing, AI,
            security, integrations and support.
          </p>
          <div className="mt-8 max-w-2xl">
            <TldrList items={FAQ_TLDR} />
          </div>
          <ReviewedByline lastReviewed={LAST_REVIEWED} className="mt-5" />

          {/* Topic jump links */}
          <nav aria-label="FAQ topics" className="mt-10">
            <ul className="flex flex-wrap gap-2">
              {FAQ_TOPICS.map((topic) => (
                <li key={topic.id}>
                  <a
                    href={`#${topic.id}`}
                    className="inline-flex rounded-full border border-surface-200 bg-white/70 px-4 py-1.5 text-sm font-medium text-surface-700 transition-colors hover:border-brand-300 hover:text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-surface-700 dark:bg-surface-900/70 dark:text-surface-200 dark:hover:border-brand-700 dark:hover:text-brand-300"
                  >
                    {topic.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>

      {/* ============================== Topics ============================== */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {FAQ_TOPICS.map((topic) => (
          <section
            key={topic.id}
            id={topic.id}
            aria-labelledby={`${topic.id}-heading`}
            className="scroll-mt-24 border-t border-surface-200 py-16 first:border-t-0 dark:border-surface-800"
          >
            <h2
              id={`${topic.id}-heading`}
              className="text-2xl font-bold tracking-tight text-surface-900 sm:text-3xl dark:text-white"
            >
              {topic.title}
            </h2>
            <p className="mt-2 text-surface-600 dark:text-surface-400">{topic.blurb}</p>

            <div className="mt-8 space-y-4">
              {topic.items.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-2xl border border-surface-200 bg-white transition-colors open:border-brand-300 hover:border-brand-300 dark:border-surface-800 dark:bg-surface-900 dark:open:border-brand-700 dark:hover:border-brand-700"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-4 text-left font-semibold text-surface-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-white">
                    <h3 className="text-base font-semibold sm:text-lg">{item.q}</h3>
                    <ChevronDown
                      className="h-5 w-5 shrink-0 text-brand-600 transition-transform group-open:rotate-180 dark:text-brand-400"
                      aria-hidden="true"
                    />
                  </summary>
                  <div className="px-5 pb-5 text-surface-600 dark:text-surface-300">
                    <p className="leading-relaxed">{item.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* ============================== CTA ============================== */}
      <section className="border-t border-surface-200 dark:border-surface-800">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="glass dark:glass-dark rounded-2xl border border-surface-200 px-8 py-12 text-center dark:border-surface-700">
            <h2 className="text-2xl font-bold tracking-tight text-surface-900 sm:text-3xl dark:text-white">
              Still have questions?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-surface-600 dark:text-surface-300">
              Request a trial for your team, or dig deeper into a specific framework, integration,
              or capability across our resources.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                to={TRIAL_CTA.to}
                className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {TRIAL_CTA.label}
              </Link>
              <Link
                to="/glossary"
                className="rounded-full border border-surface-300 px-6 py-3 text-sm font-semibold text-surface-700 transition-colors hover:border-brand-400 hover:text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-surface-700 dark:text-surface-200 dark:hover:border-brand-600 dark:hover:text-brand-300"
              >
                Browse the glossary
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default FaqHubPage;
export { FaqHubPage };
