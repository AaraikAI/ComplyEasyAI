import { FRAMEWORK_PILLARS } from './frameworkPillarContent';

/**
 * Facts repeated across the marketing pages, kept in one place so the copy
 * cannot drift from the product. Plan names follow the tier gating in
 * constants/tierFeatures.ts (mirrors server/src/config/tiers.ts).
 */

/** Joins items as "A, B and C". */
export function joinWithAnd(items: readonly string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/** Frameworks with a dedicated guide page, in catalogue order. */
export const FRAMEWORK_GUIDE_NAMES: string[] = Object.values(FRAMEWORK_PILLARS).map(
  (pillar) => pillar.name,
);

/** "SOC 2, ISO 27001, … and CSRD". */
export const FRAMEWORK_GUIDE_LIST = joinWithAnd(FRAMEWORK_GUIDE_NAMES);

/**
 * Public framework-catalogue claim. The in-app catalogue
 * (server/src/services/frameworkTemplateService.ts, FRAMEWORK_TEMPLATE_MAP)
 * held 159 templates, every one with controls, on 2026-09-27;
 * __tests__/data/marketingFacts.test.ts fails if the catalogue drops below
 * this floor.
 */
export const FRAMEWORK_CATALOGUE_FLOOR = 150;

/** "150+". */
export const FRAMEWORK_CATALOGUE_LABEL = `${FRAMEWORK_CATALOGUE_FLOOR}+`;

/**
 * Integrations that work end to end in the product, grouped for display.
 *
 * Counted (2026-09-27) by following the in-app connect flow for each of the
 * 381 catalogue tiles in components/Integrations.tsx. A connector counts only
 * when all three hold:
 *   1. connecting verifies the credential against the provider's live API
 *      before it is saved — the OAuth code exchange (Google Workspace, GitHub,
 *      Slack, Jira), the dedicated AWS and Azure connect handlers, or a
 *      patValidationService validator that makes a network call for the auth
 *      type the connect modal actually sends;
 *   2. a sync path collects evidence under the same provider id — a dedicated
 *      service route or an integration-registry descriptor; and
 *   3. both paths are reachable from the integration routes
 *      (server/src/routes/integrations.ts, or server/src/routes/ticketing.ts for
 *      ServiceNow and Azure DevOps, which have their own connect/test/sync).
 * Tiles whose connect step stores credentials without checking them (for
 * example username/password or client-id/secret connectors, or format-only
 * validators) are not counted, even though the catalogue lists them.
 *
 * The OAuth connectors also need their *_CLIENT_ID / *_CLIENT_SECRET /
 * *_CALLBACK_URL settings in the deployment before customers can connect them.
 */
export const VERIFIED_INTEGRATION_GROUPS: { group: string; names: string[] }[] = [
  {
    group: 'Cloud and infrastructure',
    names: ['AWS', 'Microsoft Azure', 'DigitalOcean', 'Heroku', 'Kubernetes'],
  },
  { group: 'Identity and HR', names: ['Okta', 'Google Workspace', 'BambooHR', 'ADP'] },
  { group: 'Code and CI/CD', names: ['GitHub', 'GitLab', 'Bitbucket', 'CircleCI'] },
  { group: 'Security', names: ['CrowdStrike', 'Qualys'] },
  {
    group: 'Ticketing and work management',
    names: ['Jira', 'ServiceNow', 'Azure DevOps', 'Zendesk', 'Asana', 'Monday.com', 'Confluence'],
  },
  { group: 'Communication', names: ['Slack', 'Discord', 'SendGrid', 'Twilio'] },
];

/** Every verified integration, in display order. */
export const VERIFIED_INTEGRATIONS: string[] = VERIFIED_INTEGRATION_GROUPS.flatMap(
  (group) => group.names,
);

/** The one integration count used on every public page. */
export const INTEGRATION_COUNT = VERIFIED_INTEGRATIONS.length;

/** Plans that include the full aCOS loop (tier feature `acosGoals`). */
export const ACOS_PLANS = 'Growth and Visionary';

/** Plan that includes the EU AI Act, DORA, DMA and DSA (tier features `euAiAct`, `dma`, `dsa`). */
export const EU_STACK_PLAN = 'Visionary';

/** Plan that includes bring-your-own-key encryption (tier feature `byokEncryption`). */
export const BYOK_PLAN = 'Visionary';

/**
 * ComplyEasyAI's own security posture, limited to controls that can be verified
 * in the code or the hosting configuration. No certification is held; a SOC 2
 * Type I audit is in progress.
 */
export const SECURITY_ATTESTATION = 'SOC 2 Type I audit in progress';

export const HOSTING_REGION = 'a single US region (AWS and Supabase, us-east-1)';

export const VERIFIED_SECURITY_CONTROLS: string[] = [
  'Encryption at rest (Supabase and AWS)',
  'TLS encryption in transit',
  'Single US region: us-east-1',
  'Multi-factor authentication',
  'Audit logging',
];

/** Call to action that replaces self-serve free-trial promises while billing is off. */
export const TRIAL_CTA = {
  label: 'Request a trial',
  to: '/demo',
} as const;
