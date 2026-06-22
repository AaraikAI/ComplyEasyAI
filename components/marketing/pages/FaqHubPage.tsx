import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { MarketingLayout } from '../MarketingLayout';
import { Seo } from '../../seo/Seo';
import { JsonLd } from '../../seo/JsonLd';
import { breadcrumbSchema, faqSchema } from '../../seo/siteSchema';

const SITE_ORIGIN = 'https://complyeasyai.com';

interface QaItem {
  q: string;
  a: string;
}

interface FaqTopic {
  id: string;
  title: string;
  blurb: string;
  items: QaItem[];
}

/**
 * Topic-grouped Q&A set adapted from the published FAQ. Answers describe
 * platform capabilities and supported frameworks factually; figures that are
 * not independently verifiable here are intentionally omitted.
 */
const FAQ_TOPICS: FaqTopic[] = [
  {
    id: 'getting-started',
    title: 'Getting started',
    blurb: 'What the platform is, who it serves, and how onboarding works.',
    items: [
      {
        q: 'What is ComplyEasy AI?',
        a: 'ComplyEasy AI is an AI-powered compliance automation platform that helps organizations achieve and maintain continuous readiness across global regulatory standards. It automates evidence collection, control monitoring, risk assessment, and audit preparation using autonomous AI agents and machine learning.',
      },
      {
        q: 'Who is ComplyEasy AI for?',
        a: 'It is built for startups preparing for a first certification such as SOC 2 or ISO 27001, scale-ups managing several frameworks at once, and enterprises that need advanced automation, custom frameworks, or on-premise deployment. It is a strong fit for regulated industries including FinTech, HealthTech, SaaS, and AI companies, as well as organizations subject to the EU AI Act, DMA, or DSA.',
      },
      {
        q: 'How quickly can I get started?',
        a: 'Signing up takes a couple of minutes, and AI-assisted framework setup typically takes 15 to 30 minutes. Automated evidence collection can begin within the first day, an initial compliance dashboard comes together within a few days, and audit-ready status generally follows over 30 to 90 days depending on the framework and your current maturity.',
      },
      {
        q: 'Do you offer a free trial?',
        a: 'Yes. A 3-day free trial is available with no credit card required. It includes Foundation-tier capabilities such as three compliance frameworks, up to 10 users, automated evidence collection, the AI Risk Analyzer, and basic reporting.',
      },
      {
        q: 'What happens after my trial ends?',
        a: 'The trial ends automatically after three days. You can upgrade to a paid tier to continue with all of your data preserved, or contact the sales team to request an extension for evaluation purposes.',
      },
    ],
  },
  {
    id: 'pricing-billing',
    title: 'Pricing and billing',
    blurb: 'Tiers, tier changes, payment methods, and refunds.',
    items: [
      {
        q: 'How does your pricing work?',
        a: 'Pricing is tier-based with flat annual rates. Foundation is $8,500/year for up to 10 users and three frameworks. Essentials is $17,000/year for up to 100 users and 10 frameworks. Growth ranges from $42,500 to $51,000/year for 100 to 1,000 users and up to 50 frameworks. Visionary ranges from $68,000 to $170,000/year with unlimited users and frameworks. Growth and Visionary are quoted by the sales team.',
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
        a: 'You can cancel during the trial period with no charges. On annual plans, a prorated refund for unused months is available after the first 30 days. Enterprise contracts follow their negotiated terms.',
      },
    ],
  },
  {
    id: 'platform-features',
    title: 'Platform and features',
    blurb: 'Core capabilities, autonomous operations, and evidence automation.',
    items: [
      {
        q: 'What compliance frameworks does the platform support?',
        a: 'The platform includes more than 50 built-in frameworks spanning security (SOC 2 Type I and II, ISO 27001, ISO 27701, NIST CSF, CIS Controls), privacy (GDPR, CCPA, HIPAA, PIPEDA, LGPD), cloud (FedRAMP, StateRAMP, TISAX), AI/ML (EU AI Act, NIST AI RMF, ISO 42001), and industry standards (PCI DSS, HITRUST, 21 CFR Part 11, ITAR), plus the EU Digital Markets Act and Digital Services Act. Custom frameworks are available as an add-on with the Growth tier and above.',
      },
      {
        q: 'What is aCOS (Autonomous Compliance Operations System)?',
        a: 'aCOS is the autonomous compliance engine. It monitors your infrastructure continuously with AI agents, detects compliance drift in real time, remediates issues automatically when it is safe to do so, learns from your environment to adapt policies, predicts emerging risks, and orchestrates remediation workflows. It is available in the Essentials tier and above, or as a separately billed add-on.',
      },
      {
        q: 'How does automated evidence collection work?',
        a: 'AI agents collect evidence from cloud infrastructure (AWS, Azure, GCP), SaaS tools (GitHub, Slack, Jira, Okta, Google Workspace), security tools, monitoring systems, and HR systems. You connect integrations through OAuth, API keys, personal access tokens, or read-only access; the AI maps evidence to controls automatically; evidence is collected on a daily, weekly, or monthly schedule; and a versioned, immutable audit trail is maintained for every item.',
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
    title: 'AI and automation',
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
    title: 'Compliance frameworks',
    blurb: 'Timelines, running multiple frameworks, and staying current with updates.',
    items: [
      {
        q: 'How long does SOC 2 certification take?',
        a: 'With ComplyEasy AI, setup and gap assessment usually take a few weeks, remediation runs roughly 4 to 12 weeks depending on the gaps found, and SOC 2 Type II requires a 3 to 6 month observation period before the audit itself. End to end this commonly lands in the 4 to 9 month range, compared with the longer timelines typical of fully manual programs.',
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
        a: 'Framework changes are tracked centrally. When a standard is revised, new controls are added to your instance, you receive advance notice, and AI assists the transition while preserving and remapping existing evidence. This has covered updates such as the ISO 27001:2022 revision, NIST CSF 2.0, and the EU AI Act, so you stay current without manual framework maintenance.',
      },
    ],
  },
  {
    id: 'eu-regulations',
    title: 'EU regulations',
    blurb: 'EU AI Act, DMA, DSA, and GDPR coverage.',
    items: [
      {
        q: 'Do you support the EU AI Act?',
        a: 'Yes. The platform helps you classify AI system risk, generate technical documentation for high-risk systems, run conformity assessments, manage required transparency disclosures and labeling, operate human-oversight governance workflows, and monitor data quality and accuracy. It is included with the Visionary tier and available as an add-on for lower tiers.',
      },
      {
        q: 'What about the Digital Markets Act (DMA)?',
        a: 'The platform supports DMA obligations for digital gatekeepers, including gatekeeper assessment, mapping of the DMA obligations, documenting interoperability and data portability, monitoring self-preferencing and data-combination practices, and generating compliance reports. It is available in the Visionary tier or as a Growth-tier add-on.',
      },
      {
        q: 'And the Digital Services Act (DSA)?',
        a: 'The platform provides a DSA toolkit covering content-moderation tracking, notice-and-action workflows, automated transparency reporting, systemic-risk analysis for very large platforms, recommender-system documentation, advertising transparency, and user-rights request handling. It is available in the Visionary tier or as a Growth-tier add-on.',
      },
      {
        q: 'How does the platform help with GDPR?',
        a: 'The GDPR toolkit helps you track processing activities, manage consent, handle data-subject requests for access, deletion, and portability, generate a Record of Processing Activities, conduct Data Protection Impact Assessments, and document your legal basis for processing.',
      },
    ],
  },
  {
    id: 'security',
    title: 'Security and privacy',
    blurb: 'Architecture, data residency, access controls, and customer-managed keys.',
    items: [
      {
        q: 'How is the platform secured?',
        a: 'The platform is built on a zero-trust architecture with device-trust verification, end-to-end encryption (AES-256 at rest and TLS 1.3 in transit), and support for zero-knowledge proofs to verify data without exposing it. Bring Your Own Key lets you control encryption keys, and continuous security monitoring backs the environment.',
      },
      {
        q: 'Where is my data stored?',
        a: 'By default, data is stored in multi-region cloud storage with geo-replication for disaster recovery. You can choose regional isolation to keep data in specific regions, deploy on-premise within your own infrastructure (Visionary tier with the on-premise add-on), or run a hybrid of cloud and on-premise to meet residency requirements for regulations such as GDPR and CCPA.',
      },
      {
        q: 'Do you have access to my data?',
        a: 'Access follows a minimal-access principle. Production data has zero standing access and requires breakglass approval, support access requires explicit customer permission and is logged and audited, and customer data is never used for AI training without opt-in. With zero-knowledge techniques, compliance can be verified without the platform seeing your underlying data.',
      },
      {
        q: 'Can I use my own encryption keys?',
        a: 'Yes. Bring Your Own Key is available in the Growth tier and above, with support for AWS KMS, Azure Key Vault, Google Cloud KMS, and HashiCorp Vault. Keys can be rotated automatically or manually, and revoking a key renders the associated data unreadable. BYOK can be combined with client-side encryption for a zero-knowledge posture.',
      },
    ],
  },
  {
    id: 'integrations',
    title: 'Integrations',
    blurb: 'Supported tools, connection methods, and building your own.',
    items: [
      {
        q: 'What integrations do you support?',
        a: 'The platform offers more than 80 pre-built integrations across cloud providers (AWS, Azure, GCP, Oracle Cloud, IBM Cloud), security and compliance tools (Wiz, Vanta, Snyk, Crowdstrike, Qualys, Tenable), DevOps (GitHub, GitLab, Bitbucket, Jenkins, CircleCI, Terraform), communication (Slack, Microsoft Teams, PagerDuty, Opsgenie), HR and identity (Okta, Azure AD, Google Workspace, BambooHR, Workday), ticketing (Jira, ServiceNow, Linear, Asana), and monitoring (Datadog, Splunk, Elasticsearch, Prometheus, Grafana).',
      },
      {
        q: 'How do integrations work?',
        a: 'Integrations connect through one-click OAuth where available, read-only API keys or personal access tokens, or webhooks for real-time events, and they are agentless with no software to install. The platform requests the minimum permissions needed, preferring read-only access.',
      },
      {
        q: 'Can I build custom integrations?',
        a: 'Yes. A Webhook API is available on every tier for sending evidence, triggering workflows, and querying compliance data. The no-code Integration Builder (Growth tier and above) connects any REST API with visual field mapping, and full programmatic access via REST and GraphQL is available on the Visionary tier. Professional services can also build integrations for you.',
      },
      {
        q: 'What if you don’t support my tool?',
        a: 'You can use generic options such as the Webhook API, CSV import, or email forwarding, request the integration on the public roadmap, build it yourself with the Integration Builder or SDK, or have the professional services team build it. New integrations are added regularly based on customer demand.',
      },
    ],
  },
  {
    id: 'technical',
    title: 'Technical questions',
    blurb: 'Uptime, deployment, rate limits, and developer interfaces.',
    items: [
      {
        q: 'What is your uptime SLA?',
        a: 'Uptime commitments scale by tier: 99.5% for Foundation and Essentials, 99.9% with SLA credits for Growth, and 99.95% with SLA credits for Visionary. When an uptime target is missed, monthly service credits apply, and a public status page is available.',
      },
      {
        q: 'Can I deploy on-premise?',
        a: 'Yes. On-premise deployment is available on the Visionary tier with an on-premise add-on. It runs on a Kubernetes cluster with PostgreSQL, Redis, and S3-compatible storage, ships as Docker containers with Helm charts, and is supported by a dedicated on-premise team. A hybrid mode keeps sensitive data on-premise while using the cloud for AI processing.',
      },
      {
        q: 'What are your API rate limits?',
        a: 'Hourly API rate limits scale by tier, from 1,000 requests per hour on Foundation up to custom limits on Visionary, with a short-burst allowance above the base rate. The limit is a soft limit returning HTTP 429 responses rather than a hard cut-off, and there are no overage fees.',
      },
      {
        q: 'Do you have a CLI or SDK?',
        a: 'Yes. The platform provides a documented REST API, a GraphQL API on Growth and above with real-time subscriptions, a command-line interface, and SDKs for JavaScript/TypeScript, Python, Go, and Java. A Terraform provider lets you manage compliance as infrastructure-as-code.',
      },
    ],
  },
  {
    id: 'support-services',
    title: 'Support and services',
    blurb: 'Support tiers, professional services, training, and migration help.',
    items: [
      {
        q: 'What support do you provide?',
        a: 'Support scales by tier. Foundation includes email support, a knowledge base, and a community forum. Essentials adds business-hours chat and monthly office-hours webinars. Growth adds priority support, quarterly business reviews, and a dedicated Slack channel. Visionary adds 24/7 phone support, a critical-response SLA, a dedicated Customer Success Manager, and a private Slack channel with engineering.',
      },
      {
        q: 'Do you offer professional services?',
        a: 'Yes. The services team provides compliance consulting (gap assessments, remediation planning, policy development, audit preparation, framework selection), implementation services (onboarding, integration setup, custom framework building, workflow design, team training), and managed services such as Compliance-as-a-Service, a virtual CISO, and continuous monitoring.',
      },
      {
        q: 'How do I get training?',
        a: 'Self-paced video tutorials, interactive walkthroughs, documentation, and webinar recordings are available to all tiers. Essentials and above add live webinars and office hours, and Growth and above add custom on-site or virtual sessions, team workshops, and an admin certification program.',
      },
      {
        q: 'Can you help me prepare for an audit?',
        a: 'Yes. The audit-preparation program covers pre-audit work such as AI Red Team review, gap remediation, evidence packaging, and a mock audit; in-audit support with a secure auditor portal, instant evidence search, and question tracking; and post-audit help with response generation, finding remediation, and continuous monitoring to prevent recurrence.',
      },
      {
        q: 'What if I need help migrating from another tool?',
        a: 'Migration support is included for all tiers and typically takes a week or two. The team imports your data from tools such as Vanta, Drata, or Secureframe, handles data mapping and validation, and runs the platform in parallel during the transition for no downtime. Growth and above add a dedicated migration engineer and custom data transformation.',
      },
    ],
  },
  {
    id: 'additional',
    title: 'Additional questions',
    blurb: 'White-labeling, multi-tenancy, and enterprise add-ons.',
    items: [
      {
        q: 'Can I white-label ComplyEasy AI?',
        a: 'Yes. White-labeling is available on the Visionary tier and includes custom branding (logo, colors, and domain), removal of ComplyEasy AI branding, custom email templates, and custom report headers and footers. It is a common fit for managed service providers, compliance consultants, and resellers.',
      },
      {
        q: 'Do you support multi-tenancy?',
        a: 'Yes. Multi-tenant features let you manage multiple organizations from a single account, view consolidated cross-organization dashboards, apply role-based access with separate permissions per organization, and consolidate billing into a single invoice. This suits consultancies, managed service providers, and holding companies.',
      },
      {
        q: 'What enterprise add-ons are available?',
        a: 'Add-ons include custom frameworks at $2,997/year per framework (Growth and Visionary), on-premise deployment at $3,200/year (Visionary), custom fine-tuned AI models at $1,920/year (Visionary), and a dedicated vCISO service at $9,997/year for 10 consulting hours per month (all tiers). An audit-bundling option provides pre-negotiated rates with a partner network of certified audit firms.',
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
        title="Frequently Asked Questions — ComplyEasy AI"
        description="Answers about the ComplyEasy AI compliance automation platform: supported frameworks, AI features, security architecture, integrations, pricing, deployment, and support."
        canonicalPath="/faq"
        keywords="ComplyEasy AI FAQ, compliance automation questions, SOC 2 platform, ISO 27001, GDPR, EU AI Act, BYOK, audit preparation"
      />
      <JsonLd data={faqLd} />
      <JsonLd data={breadcrumbs} />

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
            ComplyEasy AI <span className="text-gradient">FAQ</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-surface-600 dark:text-surface-300">
            Clear answers about the platform, its AI capabilities, supported compliance frameworks,
            security architecture, integrations, pricing, and support. Browse by topic below, or
            jump straight to the area you care about.
          </p>

          {/* Topic jump links */}
          <nav aria-label="FAQ topics" className="mt-10">
            <ul className="flex flex-wrap gap-2">
              {FAQ_TOPICS.map((topic) => (
                <li key={topic.id}>
                  <a
                    href={`#${topic.id}`}
                    className="inline-flex rounded-full border border-surface-200 bg-white/70 px-4 py-1.5 text-sm font-medium text-surface-700 transition-colors hover:border-brand-300 hover:text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-surface-700 dark:bg-surface-900/70 dark:text-surface-200 dark:hover:border-brand-700 dark:hover:text-brand-300"
                  >
                    {topic.title}
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
              Explore the platform on a free trial, or dig deeper into a specific framework,
              integration, or capability across our resources.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/signup"
                className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                Start free
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
