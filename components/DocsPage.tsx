import React, { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { MarketingLayout } from './marketing/MarketingLayout';
import { SignalPage } from './marketing/signal';
import { Seo } from './seo/Seo';
import { JsonLd } from './seo/JsonLd';
import { breadcrumbSchema } from './seo/siteSchema';

const SITE_ORIGIN = 'https://complyeasyai.com';

/** One content block inside a docs section. */
type DocBlock =
  | { t: 'p'; v: string }
  | { t: 'ul'; v: string[] }
  | { t: 'code'; v: string }
  | { t: 'note'; v: string };

interface DocSectionData {
  h: string;
  blocks: DocBlock[];
}

interface DocArticle {
  category: string;
  title: string;
  summary: string;
  sections: DocSectionData[];
}

/** Seed docs from the Signal design handoff, keyed by URL slug. */
const DOCS: Record<string, DocArticle> = {
  quickstart: {
    category: 'Get started',
    title: 'Quickstart',
    summary: 'Get from sign-up to your first monitored control in under 15 minutes.',
    sections: [
      {
        h: 'Create your workspace',
        blocks: [
          {
            t: 'p',
            v: 'After signing in, create a workspace for your organization. A workspace holds your frameworks, controls, evidence and team — separate business units or subsidiaries can each have their own.',
          },
          {
            t: 'ul',
            v: [
              'Name your workspace and set your primary region.',
              'Choose the frameworks you intend to pursue first.',
              'Invite teammates by email with a role (Admin, Editor or Viewer).',
            ],
          },
        ],
      },
      {
        h: 'Connect your first integration',
        blocks: [
          {
            t: 'p',
            v: 'Integrations feed evidence automatically. Connect one to see controls populate immediately.',
          },
          {
            t: 'note',
            v: 'All integrations are read-only. ComplyEasyAI never makes changes to your infrastructure without an explicit, approved remediation action.',
          },
        ],
      },
      {
        h: 'Add a framework',
        blocks: [
          {
            t: 'p',
            v: 'Adding a framework maps its requirements to controls in your workspace. Shared controls are reused across frameworks you already run, so the second framework is far faster than the first.',
          },
        ],
      },
    ],
  },
  concepts: {
    category: 'Get started',
    title: 'Core concepts',
    summary: 'The four objects the whole platform is built around.',
    sections: [
      {
        h: 'Controls',
        blocks: [
          {
            t: 'p',
            v: 'A control is a safeguard you implement — MFA enforced, encryption at rest, access reviews. Controls are the atomic unit that evidence attaches to and that frameworks map onto.',
          },
        ],
      },
      {
        h: 'Evidence',
        blocks: [
          {
            t: 'p',
            v: 'Evidence proves a control is operating. ComplyEasyAI collects it automatically from integrations on a recurring schedule and keeps a versioned, timestamped trail.',
          },
        ],
      },
      {
        h: 'Frameworks',
        blocks: [
          {
            t: 'p',
            v: 'A framework (SOC 2, ISO 27001, GDPR…) is a set of requirements. Each requirement maps to one or more controls, so satisfying a control can satisfy many frameworks at once.',
          },
          {
            t: 'ul',
            v: ['Map once, reuse everywhere.', 'Coverage is calculated continuously as evidence flows in.'],
          },
        ],
      },
      {
        h: 'Risks',
        blocks: [
          {
            t: 'p',
            v: 'Risks capture what could go wrong. They are scored by likelihood and impact, linked to controls that mitigate them, and tracked to closure.',
          },
        ],
      },
    ],
  },
  integrations: {
    category: 'Platform',
    title: 'Connect integrations',
    summary: 'Feed evidence continuously from your cloud, code, identity and ticketing systems.',
    sections: [
      {
        h: 'How connections work',
        blocks: [
          {
            t: 'p',
            v: 'Connect a system once using read-only OAuth, an API key, or a personal access token. ComplyEasyAI discovers the relevant controls and maps incoming configuration and activity data to the requirements it satisfies.',
          },
          {
            t: 'ul',
            v: [
              'Cloud — AWS, Azure, GCP',
              'Code — GitHub, GitLab',
              'Identity — Okta, Google Workspace, Entra ID',
              'Ticketing — Jira, Linear',
            ],
          },
        ],
      },
      {
        h: 'Sync schedule',
        blocks: [
          {
            t: 'p',
            v: 'Evidence is collected on a recurring schedule so your posture reflects current, continuously verified data rather than a point-in-time snapshot.',
          },
          {
            t: 'note',
            v: 'Over 30 integrations are available. Missing one? Evidence can also be uploaded manually or via the API.',
          },
        ],
      },
    ],
  },
  frameworks: {
    category: 'Frameworks',
    title: 'Add & manage frameworks',
    summary: 'Map requirements to controls and track coverage in real time.',
    sections: [
      {
        h: 'Adding a framework',
        blocks: [
          {
            t: 'p',
            v: 'Select a framework to add it to your workspace. Its requirements are mapped to controls automatically, and any control you already satisfy for another framework carries over.',
          },
        ],
      },
      {
        h: 'Statement of Applicability',
        blocks: [
          {
            t: 'p',
            v: 'For frameworks like ISO 27001, the platform maintains a Statement of Applicability — which controls apply and the justification for any exclusions — and keeps it current as your environment changes.',
          },
        ],
      },
      {
        h: 'Coverage & gaps',
        blocks: [
          {
            t: 'p',
            v: 'A readiness view shows coverage per framework and highlights failing or unmapped controls, each with an owner and remediation steps attached.',
          },
        ],
      },
    ],
  },
  evidence: {
    category: 'Automation',
    title: 'Evidence collection',
    summary: 'A versioned, auditor-ready trail built without screenshots.',
    sections: [
      {
        h: 'Automated collection',
        blocks: [
          {
            t: 'p',
            v: 'AI agents gather configuration and activity evidence from connected systems on a schedule, mapping each item to the controls it supports.',
          },
        ],
      },
      {
        h: 'Versioning',
        blocks: [
          {
            t: 'p',
            v: 'Every piece of evidence is timestamped and versioned, so you can show an auditor exactly what a control looked like at any point in your observation window.',
          },
        ],
      },
      {
        h: 'Manual & API evidence',
        blocks: [
          {
            t: 'p',
            v: 'Where a control cannot be verified through an integration, evidence can be uploaded manually or pushed via the API and held to the same versioning.',
          },
        ],
      },
    ],
  },
  monitoring: {
    category: 'Automation',
    title: 'Continuous monitoring',
    summary: 'Catch control drift the moment it happens — not during fieldwork.',
    sections: [
      {
        h: 'Drift detection',
        blocks: [
          {
            t: 'p',
            v: 'Controls are checked continuously. When one drifts — a disabled MFA policy, a public storage bucket, an over-privileged role — it surfaces immediately as a finding.',
          },
        ],
      },
      {
        h: 'Alerts & ownership',
        blocks: [
          {
            t: 'p',
            v: 'Findings are routed to an owner with severity and remediation guidance, so issues are closed well before an audit rather than discovered in it.',
          },
        ],
      },
    ],
  },
  acos: {
    category: 'Automation',
    title: 'aCOS & the Digital Twin',
    summary: 'Set a goal; the system works toward it with autonomous control loops.',
    sections: [
      {
        h: 'Goals & control loops',
        blocks: [
          {
            t: 'p',
            v: 'Define a compliance goal — reach a score, add a framework, reduce risk. aCOS creates control loops that observe, act and verify continuously to move you toward it.',
          },
        ],
      },
      {
        h: 'The Compliance Digital Twin',
        blocks: [
          {
            t: 'p',
            v: 'Model "what if we add ISO 27001?" or "what if this control fails?" against a virtual replica of your environment, and see the projected impact before you touch production.',
          },
          {
            t: 'note',
            v: 'The Digital Twin is available on Growth and Visionary tiers.',
          },
        ],
      },
      {
        h: 'Autonomous remediation',
        blocks: [
          {
            t: 'p',
            v: 'Where it is safe, aCOS closes gaps automatically with blast-radius estimation and automatic rollback, escalating anything high-impact for human approval.',
          },
        ],
      },
    ],
  },
  reports: {
    category: 'Platform',
    title: 'Reports & audit center',
    summary: 'Package organized, current evidence for auditors and stakeholders.',
    sections: [
      {
        h: 'Audit-ready exports',
        blocks: [
          {
            t: 'p',
            v: 'Generate evidence packages on demand — the same artifacts auditors pull from production, organized by control and framework.',
          },
        ],
      },
      {
        h: 'Executive & board views',
        blocks: [
          {
            t: 'p',
            v: 'Executive dashboards summarize posture across frameworks for leadership and the board, with trend and forecast lines.',
          },
        ],
      },
    ],
  },
  roles: {
    category: 'Admin',
    title: 'Roles & permissions',
    summary: 'Control who can see and change what, with enterprise SSO and SCIM.',
    sections: [
      {
        h: 'Built-in roles',
        blocks: [
          {
            t: 'ul',
            v: [
              'Admin — full access to features and settings.',
              'Editor — manage frameworks, controls and evidence.',
              'Viewer — read-only access to dashboards and reports.',
            ],
          },
        ],
      },
      {
        h: 'SSO & SCIM',
        blocks: [
          {
            t: 'p',
            v: 'Enterprise tiers support SAML SSO and SCIM provisioning, so access follows your identity provider and de-provisions automatically when someone leaves.',
          },
        ],
      },
    ],
  },
  api: {
    category: 'Developers',
    title: 'API & webhooks',
    summary: 'Push evidence, read posture, and subscribe to events programmatically.',
    sections: [
      {
        h: 'Authentication',
        blocks: [
          {
            t: 'p',
            v: 'Generate an API key in Settings → Developers. Pass it as a bearer token on every request.',
          },
          {
            t: 'code',
            v: 'curl https://api.complyeasyai.com/v1/frameworks \\\n  -H "Authorization: Bearer $CEAI_API_KEY"',
          },
        ],
      },
      {
        h: 'Webhooks',
        blocks: [
          {
            t: 'p',
            v: 'Subscribe to events to react to compliance changes in your own systems — for example, opening a ticket when a control drifts.',
          },
          {
            t: 'code',
            v: 'POST /v1/webhooks\n{\n  "url": "https://example.com/hooks/ceai",\n  "events": ["control.drifted", "evidence.collected"]\n}',
          },
        ],
      },
    ],
  },
};

/** Reading order driving the prev/next footer links. */
const DOC_ORDER: string[] = [
  'quickstart',
  'concepts',
  'integrations',
  'frameworks',
  'evidence',
  'monitoring',
  'acos',
  'reports',
  'roles',
  'api',
];

/** Left-nav category groups. */
const NAV_GROUPS: { name: string; ids: string[] }[] = [
  { name: 'Get started', ids: ['quickstart', 'concepts'] },
  { name: 'Platform', ids: ['integrations', 'frameworks', 'reports'] },
  { name: 'Automation', ids: ['evidence', 'monitoring', 'acos'] },
  { name: 'Admin', ids: ['roles'] },
  { name: 'Developers', ids: ['api'] },
];

const DEFAULT_DOC = 'quickstart';

const sectionAnchor = (heading: string): string =>
  'sec-' +
  heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** Renders a single article content block by type. */
const DocBlockView: React.FC<{ block: DocBlock }> = ({ block }) => {
  if (block.t === 'ul') {
    return (
      <ul className="flex list-disc flex-col gap-2 pl-5 marker:text-signal-muted">
        {block.v.map((item) => (
          <li key={item} className="text-[15.5px] leading-relaxed text-signal-body2">
            {item}
          </li>
        ))}
      </ul>
    );
  }
  if (block.t === 'code') {
    return (
      <pre className="overflow-x-auto rounded-xl border border-white/[0.08] bg-signal-panel2 px-[18px] py-4">
        <code className="whitespace-pre font-mono text-[13px] leading-relaxed text-signal-body">
          {block.v}
        </code>
      </pre>
    );
  }
  if (block.t === 'note') {
    return (
      <div className="flex gap-2.5 rounded-xl border border-signal-green/25 bg-signal-green/[0.06] px-[18px] py-3.5 text-[14.5px] leading-relaxed text-signal-body">
        <span aria-hidden="true" className="shrink-0 text-signal-green">
          ◆
        </span>
        <span>{block.v}</span>
      </div>
    );
  }
  return <p className="text-[15.5px] leading-[1.7] text-signal-body2">{block.v}</p>;
};

/**
 * Documentation page in the Signal design: sticky left category nav, center
 * article, right "On this page" TOC. The active article is derived from the
 * /docs/:slug URL, so deep links land directly on the right article.
 */
export const DocsPage: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();

  // The route is mounted at both /docs and /docs/*; the splat carries the slug.
  const slug = (params['*'] ?? '').split('/')[0];
  const activeId = slug && Object.prototype.hasOwnProperty.call(DOCS, slug) ? slug : DEFAULT_DOC;
  const article = DOCS[activeId];

  const orderIndex = DOC_ORDER.indexOf(activeId);
  const prevId = orderIndex > 0 ? DOC_ORDER[orderIndex - 1] : null;
  const nextId = orderIndex < DOC_ORDER.length - 1 ? DOC_ORDER[orderIndex + 1] : null;

  const hasRendered = useRef(false);
  useEffect(() => {
    if (hasRendered.current) {
      window.scrollTo({ top: 0 });
    } else {
      hasRendered.current = true;
    }
  }, [activeId]);

  const openArticle = (id: string) => {
    if (id !== activeId) {
      navigate(`/docs/${id}`);
    }
  };

  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: SITE_ORIGIN },
    { name: 'Docs', url: `${SITE_ORIGIN}/docs` },
    { name: article.title, url: `${SITE_ORIGIN}/docs/${activeId}` },
  ]);

  return (
    <MarketingLayout>
      <Seo
        title={`${article.title} — ComplyEasy AI Docs`}
        description={article.summary}
        canonicalPath={activeId === DEFAULT_DOC ? '/docs' : `/docs/${activeId}`}
        ogType="article"
      />
      <JsonLd data={breadcrumbs} />

      <SignalPage className="!min-h-[calc(100vh-4rem)]">
        <div className="mx-auto grid max-w-[1400px] items-start lg:grid-cols-[262px_minmax(0,1fr)] xl:grid-cols-[262px_minmax(0,1fr)_210px]">
          {/* Mobile article picker (replaces the sidebar below lg) */}
          <div className="border-b border-white/[0.06] px-6 py-4 lg:hidden">
            <label className="relative block">
              <span className="sr-only">Select a docs article</span>
              <select
                value={activeId}
                onChange={(event) => openArticle(event.target.value)}
                className="w-full appearance-none rounded-xl border border-white/[0.1] bg-signal-panel2 px-4 py-3 pr-10 text-sm font-medium text-signal-ink outline-none focus:border-signal-green/50"
              >
                {NAV_GROUPS.map((group) => (
                  <optgroup key={group.name} label={group.name}>
                    {group.ids.map((id) => (
                      <option key={id} value={id}>
                        {DOCS[id].title}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-signal-muted"
              />
            </label>
          </div>

          {/* Left category nav */}
          <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] self-start overflow-y-auto border-r border-white/[0.06] px-5 py-7 lg:block">
            <nav aria-label="Docs">
              {NAV_GROUPS.map((group) => (
                <div key={group.name} className="mb-[22px]">
                  <div className="mb-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-signal-muted">
                    {group.name}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {group.ids.map((id) => {
                      const isActive = id === activeId;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => openArticle(id)}
                          aria-current={isActive ? 'page' : undefined}
                          className={`rounded-[9px] px-3 py-2 text-left text-sm transition-colors ${
                            isActive
                              ? 'bg-signal-green/10 font-semibold text-signal-green'
                              : 'font-medium text-signal-sub hover:bg-white/[0.04] hover:text-signal-ink'
                          }`}
                        >
                          {DOCS[id].title}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </aside>

          {/* Article */}
          <main className="min-w-0 max-w-[820px] px-6 py-10 md:px-12">
            <div className="mb-3 font-mono text-xs uppercase tracking-[0.1em] text-signal-green">
              {article.category}
            </div>
            <h1 className="font-display text-[32px] font-bold leading-tight tracking-[-0.02em] text-signal-ink md:text-[38px]">
              {article.title}
            </h1>
            <p className="mt-3.5 text-[17px] leading-relaxed text-signal-sub">{article.summary}</p>
            <div aria-hidden="true" className="my-[30px] h-px bg-white/[0.08]" />

            {article.sections.map((section) => (
              <section key={section.h} id={sectionAnchor(section.h)} className="mb-[34px] scroll-mt-20">
                <h2 className="mb-3.5 font-display text-[22px] font-semibold tracking-[-0.01em] text-signal-ink">
                  {section.h}
                </h2>
                <div className="flex flex-col gap-3.5">
                  {section.blocks.map((block, index) => (
                    <DocBlockView key={index} block={block} />
                  ))}
                </div>
              </section>
            ))}

            {/* Prev / next */}
            <div className="mt-11 flex gap-4 border-t border-white/[0.08] pt-6">
              {prevId && (
                <button
                  type="button"
                  onClick={() => openArticle(prevId)}
                  className="flex-1 rounded-[14px] border border-white/[0.08] bg-white/[0.03] px-5 py-4 text-left transition-colors hover:border-white/[0.2]"
                >
                  <div className="mb-1 text-xs text-signal-muted">← Previous</div>
                  <div className="font-display text-[15px] font-semibold text-signal-ink">
                    {DOCS[prevId].title}
                  </div>
                </button>
              )}
              {nextId && (
                <button
                  type="button"
                  onClick={() => openArticle(nextId)}
                  className="flex-1 rounded-[14px] border border-white/[0.08] bg-white/[0.03] px-5 py-4 text-right transition-colors hover:border-white/[0.2]"
                >
                  <div className="mb-1 text-xs text-signal-muted">Next →</div>
                  <div className="font-display text-[15px] font-semibold text-signal-ink">
                    {DOCS[nextId].title}
                  </div>
                </button>
              )}
            </div>
          </main>

          {/* On this page */}
          <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] self-start overflow-y-auto px-6 py-10 xl:block">
            <div className="mb-3.5 font-mono text-[11px] uppercase tracking-[0.14em] text-signal-muted">
              On this page
            </div>
            <nav
              aria-label="On this page"
              className="flex flex-col gap-2.5 border-l border-white/[0.08] pl-3.5"
            >
              {article.sections.map((section) => (
                <a
                  key={section.h}
                  href={`#${sectionAnchor(section.h)}`}
                  className="text-[13px] leading-snug text-signal-sub transition-colors hover:text-signal-ink"
                >
                  {section.h}
                </a>
              ))}
            </nav>
          </aside>
        </div>
      </SignalPage>
    </MarketingLayout>
  );
};

export default DocsPage;
